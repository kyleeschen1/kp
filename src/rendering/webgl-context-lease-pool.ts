export const KP_WEBGL_CONTEXT_LEASE_LIMIT = 2;

export interface KpWebglContextLease {
  readonly context: WebGLRenderingContext | WebGL2RenderingContext;
  readonly release: () => void;
}

export type KpWebglContextLeaseAcquisition =
  | {
      readonly status: "acquired";
      readonly lease: KpWebglContextLease;
    }
  | {
      readonly status: "capacity";
    }
  | {
      readonly status: "unavailable";
    };

export interface KpWebglContextLeaseSnapshot {
  readonly limit: number;
  readonly active: number;
  readonly waiting: number;
}

interface KpWebglContextLeasePool {
  readonly activeCanvases: Set<HTMLCanvasElement>;
  readonly waiters: Map<HTMLCanvasElement, () => void>;
}

const pools = new WeakMap<Document, KpWebglContextLeasePool>();

/**
 * Structural effects borrow a small, app-defined context budget instead of
 * assuming a browser's device-dependent WebGL limit.
 */
export function acquireKpWebglContextLease(input: {
  readonly canvas: HTMLCanvasElement;
  readonly attributes?: WebGLContextAttributes | undefined;
  readonly contextKind?: "webgl" | "webgl2" | undefined;
  readonly onAvailable?: (() => void) | undefined;
  readonly onContextLost?: (() => void) | undefined;
}): KpWebglContextLeaseAcquisition {
  const pool = requirePool(input.canvas.ownerDocument);
  if (pool.activeCanvases.has(input.canvas)) {
    throw new Error("A canvas cannot hold more than one WebGL context lease.");
  }
  if (pool.activeCanvases.size >= KP_WEBGL_CONTEXT_LEASE_LIMIT) {
    if (input.onAvailable !== undefined) {
      pool.waiters.set(input.canvas, input.onAvailable);
    }
    return { status: "capacity" };
  }

  pool.waiters.delete(input.canvas);
  const context = input.contextKind === "webgl2"
    ? input.canvas.getContext("webgl2", input.attributes)
    : input.canvas.getContext("webgl", input.attributes);
  if (context === null) return { status: "unavailable" };

  pool.activeCanvases.add(input.canvas);
  let released = false;
  const release = (loseContext: boolean): void => {
    if (released) return;
    released = true;
    input.canvas.removeEventListener("webglcontextlost", onContextLost);
    pool.activeCanvases.delete(input.canvas);
    if (loseContext) {
      context.getExtension("WEBGL_lose_context")?.loseContext();
    }
    notifyNextWaiter(pool);
  };
  const onContextLost = (event: Event): void => {
    event.preventDefault();
    if (released) return;
    release(false);
    input.onContextLost?.();
  };
  input.canvas.addEventListener("webglcontextlost", onContextLost);

  return {
    status: "acquired",
    lease: {
      context,
      release: () => release(true)
    }
  };
}

export function cancelKpWebglContextLeaseWait(
  canvas: HTMLCanvasElement
): void {
  pools.get(canvas.ownerDocument)?.waiters.delete(canvas);
}

export function inspectKpWebglContextLeasePool(
  ownerDocument: Document
): KpWebglContextLeaseSnapshot {
  const pool = pools.get(ownerDocument);
  return {
    limit: KP_WEBGL_CONTEXT_LEASE_LIMIT,
    active: pool?.activeCanvases.size ?? 0,
    waiting: pool?.waiters.size ?? 0
  };
}

function requirePool(ownerDocument: Document): KpWebglContextLeasePool {
  const existing = pools.get(ownerDocument);
  if (existing !== undefined) return existing;
  const created = {
    activeCanvases: new Set<HTMLCanvasElement>(),
    waiters: new Map<HTMLCanvasElement, () => void>()
  };
  pools.set(ownerDocument, created);
  return created;
}

function notifyNextWaiter(pool: KpWebglContextLeasePool): void {
  const next = pool.waiters.entries().next().value;
  if (next === undefined) return;
  const [canvas, notify] = next;
  pool.waiters.delete(canvas);
  queueMicrotask(notify);
}
