import {
  canonicalizeConceptRoomRoute,
  parseConceptRoomSnapshot,
  type KpConceptRoomSnapshot,
  type KpConceptRoomState
} from "../kernel/public-api.ts";

export type KpRoomEffectRequest =
  | {
      readonly kind: "provider";
      readonly operation: "generate" | "verify-step" | "verify-solution";
      readonly payload: unknown;
    }
  | { readonly kind: "url"; readonly route: string; readonly strategy: "push" | "replace" }
  | { readonly kind: "persistence"; readonly snapshot: KpConceptRoomSnapshot }
  | { readonly kind: "lazy-load"; readonly resourceId: string };

export interface KpRoomEffectContext {
  readonly roomId: string;
  readonly requestId: string;
  readonly stateRevision: number;
  readonly signal: AbortSignal;
}

export interface KpRoomEffectPorts {
  readonly provider: (
    request: Extract<KpRoomEffectRequest, { readonly kind: "provider" }>,
    context: KpRoomEffectContext
  ) => Promise<unknown>;
  readonly url: (
    request: Extract<KpRoomEffectRequest, { readonly kind: "url" }>,
    context: KpRoomEffectContext
  ) => Promise<void> | void;
  readonly persistence: (
    request: Extract<KpRoomEffectRequest, { readonly kind: "persistence" }>,
    context: KpRoomEffectContext
  ) => Promise<void> | void;
  readonly lazyLoad: (
    request: Extract<KpRoomEffectRequest, { readonly kind: "lazy-load" }>,
    context: KpRoomEffectContext
  ) => Promise<unknown>;
}

export type KpRoomEffectOutcome =
  | {
      readonly status: "applied";
      readonly roomId: string;
      readonly requestId: string;
      readonly stateRevision: number;
      readonly kind: KpRoomEffectRequest["kind"];
      readonly value: unknown;
    }
  | {
      readonly status: "stale" | "cancelled";
      readonly roomId: string;
      readonly requestId: string;
      readonly stateRevision: number;
      readonly kind: KpRoomEffectRequest["kind"];
    }
  | {
      readonly status: "failed";
      readonly roomId: string;
      readonly requestId: string;
      readonly stateRevision: number;
      readonly kind: KpRoomEffectRequest["kind"];
      readonly error: { readonly name: string; readonly message: string };
    };

export interface KpRoomEffectHandle {
  readonly requestId: string;
  readonly result: Promise<KpRoomEffectOutcome>;
  cancel(): void;
}

export interface KpRoomEffectCoordinator {
  start(request: KpRoomEffectRequest): KpRoomEffectHandle;
  cancel(requestId: string): boolean;
  dispose(): void;
  readonly disposed: boolean;
  readonly activeRequestCount: number;
}

export function createRoomEffectCoordinator(input: {
  readonly roomId: string;
  readonly getState: () => KpConceptRoomState;
  readonly ports: KpRoomEffectPorts;
  readonly onApplied: (outcome: Extract<KpRoomEffectOutcome, { readonly status: "applied" }>) => void;
}): KpRoomEffectCoordinator {
  if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(input.roomId)) throw new Error("Invalid room ID.");
  let nextRequest = 1;
  let isDisposed = false;
  const active = new Map<string, ActiveRequest>();
  const lanes = new Map<string, string>();

  function start(request: KpRoomEffectRequest): KpRoomEffectHandle {
    if (isDisposed) throw new Error(`Room effect coordinator ${input.roomId} is disposed.`);
    validateRequest(request);
    const lane = effectLane(request);
    const superseded = lanes.get(lane);
    if (superseded !== undefined) cancel(superseded);

    const requestId = `${input.roomId}.${nextRequest++}`;
    const stateRevision = input.getState().revision;
    const controller = new AbortController();
    const record: ActiveRequest = { requestId, lane, controller, cancelled: false };
    active.set(requestId, record);
    lanes.set(lane, requestId);
    const context: KpRoomEffectContext = {
      roomId: input.roomId,
      requestId,
      stateRevision,
      signal: controller.signal
    };
    const result = executePort(input.ports, request, context)
      .then((value): KpRoomEffectOutcome => {
        if (record.cancelled || controller.signal.aborted || isDisposed) {
          return outcomeWithoutValue("cancelled", request, context);
        }
        if (input.getState().revision !== stateRevision) {
          return outcomeWithoutValue("stale", request, context);
        }
        const outcome = deepFreeze({
          status: "applied" as const,
          roomId: input.roomId,
          requestId,
          stateRevision,
          kind: request.kind,
          value
        });
        input.onApplied(outcome);
        return outcome;
      })
      .catch((error: unknown): KpRoomEffectOutcome => {
        if (record.cancelled || controller.signal.aborted || isDisposed) {
          return outcomeWithoutValue("cancelled", request, context);
        }
        return deepFreeze({
          status: "failed" as const,
          roomId: input.roomId,
          requestId,
          stateRevision,
          kind: request.kind,
          error: serializeError(error)
        });
      })
      .finally(() => finish(record));
    return Object.freeze({ requestId, result, cancel: () => { cancel(requestId); } });
  }

  function cancel(requestId: string): boolean {
    const record = active.get(requestId);
    if (record === undefined) return false;
    record.cancelled = true;
    record.controller.abort();
    finish(record);
    return true;
  }

  function dispose(): void {
    if (isDisposed) return;
    isDisposed = true;
    [...active.values()].forEach((record) => cancel(record.requestId));
  }

  function finish(record: ActiveRequest): void {
    active.delete(record.requestId);
    if (lanes.get(record.lane) === record.requestId) lanes.delete(record.lane);
  }

  return Object.freeze({
    start,
    cancel,
    dispose,
    get disposed() { return isDisposed; },
    get activeRequestCount() { return active.size; }
  });
}

interface ActiveRequest {
  readonly requestId: string;
  readonly lane: string;
  readonly controller: AbortController;
  cancelled: boolean;
}

async function executePort(
  ports: KpRoomEffectPorts,
  request: KpRoomEffectRequest,
  context: KpRoomEffectContext
): Promise<unknown> {
  switch (request.kind) {
    case "provider":
      return ports.provider(request, context);
    case "url":
      return ports.url(request, context);
    case "persistence":
      return ports.persistence(request, context);
    case "lazy-load":
      return ports.lazyLoad(request, context);
    default:
      return assertNever(request);
  }
}

function validateRequest(request: KpRoomEffectRequest): void {
  switch (request.kind) {
    case "provider":
      return;
    case "url":
      if (canonicalizeConceptRoomRoute(request.route) !== request.route) {
        throw new Error("URL effects require a canonical room route.");
      }
      return;
    case "persistence":
      parseConceptRoomSnapshot(request.snapshot);
      return;
    case "lazy-load":
      if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(request.resourceId)) {
        throw new Error(`Invalid lazy-load resource ${request.resourceId}.`);
      }
      return;
    default:
      return assertNever(request);
  }
}

function effectLane(request: KpRoomEffectRequest): string {
  return request.kind === "lazy-load" ? `lazy-load:${request.resourceId}` : request.kind;
}

function outcomeWithoutValue(
  status: "stale" | "cancelled",
  request: KpRoomEffectRequest,
  context: KpRoomEffectContext
): KpRoomEffectOutcome {
  return deepFreeze({
    status,
    roomId: context.roomId,
    requestId: context.requestId,
    stateRevision: context.stateRevision,
    kind: request.kind
  });
}

function serializeError(error: unknown): { readonly name: string; readonly message: string } {
  if (error instanceof Error) return { name: error.name, message: error.message };
  return { name: "Error", message: String(error) };
}

function assertNever(value: never): never {
  throw new TypeError(`Unknown room effect: ${JSON.stringify(value)}.`);
}

type DeepReadonly<Value> = Value extends readonly (infer Item)[]
  ? readonly DeepReadonly<Item>[]
  : Value extends object
    ? { readonly [Key in keyof Value]: DeepReadonly<Value[Key]> }
    : Value;

function deepFreeze<Value>(value: Value): DeepReadonly<Value> {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value as DeepReadonly<Value>;
  }
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value) as DeepReadonly<Value>;
}
