import {
  canonicalizeConceptRoomRoute,
  formatConceptRoomRoute,
  parseConceptRoomRoute,
  type KpConceptRoomMode,
  type KpConceptRoomProjection,
  type KpConceptRoomProviderRouteState,
  type KpConceptRoomRoute,
  type KpConceptRoomSnapshotRouteState
} from "./concept-room-route.ts";

export interface KpConceptRoomState {
  readonly schemaVersion: "kp.room-state.v1";
  readonly revision: number;
  readonly artifactIntegrity: string;
  readonly conceptId: string;
  readonly conceptVersion: string;
  readonly checkpoint: string;
  readonly timePermille: number;
  readonly mode: KpConceptRoomMode;
  readonly projection: KpConceptRoomProjection;
  readonly parameters: Readonly<Record<string, string>>;
  readonly focus: readonly string[];
  readonly branch?: string;
  readonly provider?: KpConceptRoomProviderRouteState;
  readonly snapshot?: KpConceptRoomSnapshotRouteState;
}

// Hover and measured layout are intentionally outside the replayable state so
// pointer movement and renderer geometry cannot change a shared room URL.
export interface KpConceptRoomEphemeralViewState {
  readonly hoveredSemanticRef?: string;
  readonly layoutRevision: number;
}

export interface KpConceptRoomSnapshot {
  readonly schemaVersion: "kp.room-snapshot.v1";
  readonly artifactIntegrity: string;
  readonly route: string;
}

export type KpConceptRoomCommand =
  | { readonly kind: "seek"; readonly checkpoint: string; readonly timePermille: number }
  | { readonly kind: "set-mode"; readonly mode: KpConceptRoomMode }
  | { readonly kind: "set-projection"; readonly projection: KpConceptRoomProjection }
  | { readonly kind: "set-parameter"; readonly key: string; readonly value: string | null }
  | { readonly kind: "set-focus"; readonly focus: readonly string[] }
  | { readonly kind: "set-branch"; readonly branch: string | null }
  | { readonly kind: "set-provider"; readonly provider: KpConceptRoomProviderRouteState | null }
  | { readonly kind: "set-snapshot-identity"; readonly snapshot: KpConceptRoomSnapshotRouteState | null }
  | { readonly kind: "restore-snapshot"; readonly snapshot: KpConceptRoomSnapshot };

export function createConceptRoomState(
  route: KpConceptRoomRoute,
  artifactIntegrity: string
): KpConceptRoomState {
  requireIntegrity(artifactIntegrity);
  return stateFromRoute(parseConceptRoomRoute(formatConceptRoomRoute(route)), artifactIntegrity, 0);
}

export function reduceConceptRoomState(
  state: KpConceptRoomState,
  command: KpConceptRoomCommand
): KpConceptRoomState {
  validateState(state);
  const route = routeFromState(state);
  switch (command.kind) {
    case "seek":
      return transition(state, { ...route, checkpoint: command.checkpoint, timePermille: command.timePermille });
    case "set-mode":
      return transition(state, { ...route, mode: command.mode });
    case "set-projection":
      return transition(state, { ...route, projection: command.projection });
    case "set-parameter": {
      const parameters = { ...route.parameters };
      if (command.value === null) delete parameters[command.key];
      else parameters[command.key] = command.value;
      return transition(state, { ...route, parameters });
    }
    case "set-focus":
      return transition(state, { ...route, focus: command.focus });
    case "set-branch":
      return transition(state, replaceOptional(route, "branch", command.branch));
    case "set-provider":
      return transition(state, replaceOptional(route, "provider", command.provider));
    case "set-snapshot-identity":
      return transition(state, replaceOptional(route, "snapshot", command.snapshot));
    case "restore-snapshot":
      return restoreSnapshot(state, command.snapshot);
    default:
      return assertNever(command);
  }
}

export function replayConceptRoomCommands(
  initial: KpConceptRoomState,
  commands: readonly KpConceptRoomCommand[]
): KpConceptRoomState {
  return commands.reduce(reduceConceptRoomState, initial);
}

export function createConceptRoomSnapshot(state: KpConceptRoomState): KpConceptRoomSnapshot {
  validateState(state);
  return deepFreeze({
    schemaVersion: "kp.room-snapshot.v1" as const,
    artifactIntegrity: state.artifactIntegrity,
    route: formatConceptRoomRoute(routeFromState(state))
  });
}

export function parseConceptRoomSnapshot(input: unknown): KpConceptRoomSnapshot {
  if (!isRecord(input)) throw new TypeError("Room snapshot must be an object.");
  const expected = ["schemaVersion", "artifactIntegrity", "route"];
  const unknownKeys = Object.keys(input).filter((key) => !expected.includes(key));
  if (unknownKeys.length > 0 || input["schemaVersion"] !== "kp.room-snapshot.v1" ||
    typeof input["artifactIntegrity"] !== "string" || typeof input["route"] !== "string") {
    throw new TypeError("Room snapshot has an invalid shape.");
  }
  requireIntegrity(input["artifactIntegrity"]);
  if (canonicalizeConceptRoomRoute(input["route"]) !== input["route"]) {
    throw new TypeError("Room snapshot route must already be canonical.");
  }
  return deepFreeze({
    schemaVersion: input["schemaVersion"],
    artifactIntegrity: input["artifactIntegrity"],
    route: input["route"]
  });
}

export function conceptRoomStateRoute(state: KpConceptRoomState): KpConceptRoomRoute {
  validateState(state);
  return routeFromState(state);
}

function transition(state: KpConceptRoomState, nextRoute: KpConceptRoomRoute): KpConceptRoomState {
  const canonical = parseConceptRoomRoute(formatConceptRoomRoute(nextRoute));
  if (formatConceptRoomRoute(canonical) === formatConceptRoomRoute(routeFromState(state))) return state;
  return stateFromRoute(canonical, state.artifactIntegrity, state.revision + 1);
}

function restoreSnapshot(
  state: KpConceptRoomState,
  input: KpConceptRoomSnapshot
): KpConceptRoomState {
  const snapshot = parseConceptRoomSnapshot(input);
  const route = parseConceptRoomRoute(snapshot.route);
  if (snapshot.artifactIntegrity !== state.artifactIntegrity || route.conceptId !== state.conceptId ||
    route.conceptVersion !== state.conceptVersion) {
    throw new Error("Room snapshot does not belong to this immutable concept version.");
  }
  if (snapshot.route === formatConceptRoomRoute(routeFromState(state))) return state;
  return stateFromRoute(route, state.artifactIntegrity, state.revision + 1);
}

function stateFromRoute(
  route: KpConceptRoomRoute,
  artifactIntegrity: string,
  revision: number
): KpConceptRoomState {
  return deepFreeze({
    schemaVersion: "kp.room-state.v1" as const,
    revision,
    artifactIntegrity,
    conceptId: route.conceptId,
    conceptVersion: route.conceptVersion,
    checkpoint: route.checkpoint,
    timePermille: route.timePermille,
    mode: route.mode,
    projection: route.projection,
    parameters: route.parameters,
    focus: route.focus,
    ...copyOptional(route, "branch"),
    ...copyOptional(route, "provider"),
    ...copyOptional(route, "snapshot")
  });
}

function routeFromState(state: KpConceptRoomState): KpConceptRoomRoute {
  return deepFreeze({
    schemaVersion: "kp.room-route.v1" as const,
    conceptId: state.conceptId,
    conceptVersion: state.conceptVersion,
    checkpoint: state.checkpoint,
    timePermille: state.timePermille,
    mode: state.mode,
    projection: state.projection,
    parameters: state.parameters,
    focus: state.focus,
    ...copyOptional(state, "branch"),
    ...copyOptional(state, "provider"),
    ...copyOptional(state, "snapshot")
  });
}

function validateState(state: KpConceptRoomState): void {
  if (state.schemaVersion !== "kp.room-state.v1" || !Number.isInteger(state.revision) || state.revision < 0) {
    throw new TypeError("Invalid concept room state version or revision.");
  }
  requireIntegrity(state.artifactIntegrity);
  formatConceptRoomRoute(routeFromState(state));
}

function requireIntegrity(value: string): void {
  if (!/^sha256:[a-f0-9]{64}$/.test(value)) throw new TypeError("Invalid artifact integrity.");
}

function copyOptional<Source extends object, Key extends keyof Source>(
  source: Source,
  key: Key
): Pick<Source, Key> | Record<never, never> {
  return source[key] === undefined ? {} : { [key]: source[key] } as Pick<Source, Key>;
}

function replaceOptional<
  Source extends object,
  Key extends keyof Source,
  Value extends Source[Key]
>(source: Source, key: Key, value: Value | null): Source {
  const next = { ...source };
  if (value === null) delete next[key];
  else next[key] = value;
  return next;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertNever(value: never): never {
  throw new TypeError(`Unknown concept room command: ${JSON.stringify(value)}.`);
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
