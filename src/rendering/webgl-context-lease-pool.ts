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
  readonly waiters: Map<HTMLCanvasElement, KpWebglContextLeaseWaiter>;
  readonly scheduledWaiters: Map<HTMLCanvasElement, KpWebglContextLeaseWaiter>;
}

interface KpWebglContextLeaseWaiter {
  readonly notify: () => void;
  cancelled: boolean;
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
  removeWaiter(pool, input.canvas, false);
  if (pool.activeCanvases.size >= KP_WEBGL_CONTEXT_LEASE_LIMIT) {
    if (input.onAvailable !== undefined) {
      pool.waiters.set(input.canvas, {
        notify: input.onAvailable,
        cancelled: false
      });
    }
    return { status: "capacity" };
  }

  const context = input.contextKind === "webgl2"
    ? input.canvas.getContext("webgl2", input.attributes)
    : input.canvas.getContext("webgl", input.attributes);
  if (context === null) {
    notifyNextWaiter(pool);
    return { status: "unavailable" };
  }

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
  const pool = pools.get(canvas.ownerDocument);
  if (pool === undefined) return;
  removeWaiter(pool, canvas, true);
}

export function inspectKpWebglContextLeasePool(
  ownerDocument: Document
): KpWebglContextLeaseSnapshot {
  const pool = pools.get(ownerDocument);
  return {
    limit: KP_WEBGL_CONTEXT_LEASE_LIMIT,
    active: pool?.activeCanvases.size ?? 0,
    waiting: pool === undefined
      ? 0
      : pool.waiters.size + pool.scheduledWaiters.size
  };
}

function requirePool(ownerDocument: Document): KpWebglContextLeasePool {
  const existing = pools.get(ownerDocument);
  if (existing !== undefined) return existing;
  const created = {
    activeCanvases: new Set<HTMLCanvasElement>(),
    waiters: new Map<HTMLCanvasElement, KpWebglContextLeaseWaiter>(),
    scheduledWaiters: new Map<HTMLCanvasElement, KpWebglContextLeaseWaiter>()
  };
  pools.set(ownerDocument, created);
  return created;
}

function notifyNextWaiter(pool: KpWebglContextLeasePool): void {
  const available = KP_WEBGL_CONTEXT_LEASE_LIMIT -
    pool.activeCanvases.size - pool.scheduledWaiters.size;
  if (available <= 0) return;
  const next = pool.waiters.entries().next().value;
  if (next === undefined) return;
  const [canvas, waiter] = next;
  pool.waiters.delete(canvas);
  pool.scheduledWaiters.set(canvas, waiter);
  queueMicrotask(() => {
    if (pool.scheduledWaiters.get(canvas) !== waiter) return;
    pool.scheduledWaiters.delete(canvas);
    if (!waiter.cancelled) waiter.notify();
    // A waiter may decline to reacquire because its stage became distant.
    notifyNextWaiter(pool);
  });
}

function removeWaiter(
  pool: KpWebglContextLeasePool,
  canvas: HTMLCanvasElement,
  notifyReplacement: boolean
): void {
  const waiting = pool.waiters.get(canvas);
  if (waiting !== undefined) waiting.cancelled = true;
  pool.waiters.delete(canvas);
  const scheduled = pool.scheduledWaiters.get(canvas);
  if (scheduled !== undefined) scheduled.cancelled = true;
  const removedScheduled = pool.scheduledWaiters.delete(canvas);
  if (notifyReplacement && removedScheduled) notifyNextWaiter(pool);
}
