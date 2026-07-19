export type KpConceptRoomMode = "watch" | "touch" | "ask" | "review";
export type KpConceptRoomProjection = "symbolic" | "balance";

export interface KpConceptRoomProviderRouteState {
  readonly id: string;
  readonly protocol: string;
  readonly version: string;
  readonly provenance: string;
}

export interface KpConceptRoomSnapshotRouteState {
  readonly id: string;
  readonly integrity: string;
}

export interface KpConceptRoomRoute {
  readonly schemaVersion: "kp.room-route.v1";
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

export class KpConceptRoomRouteError extends Error {
  readonly code: "malformed" | "unsupported-schema";

  constructor(code: "malformed" | "unsupported-schema", message: string) {
    super(message);
    this.name = "KpConceptRoomRouteError";
    this.code = code;
  }
}

const modes = new Set<KpConceptRoomMode>(["watch", "touch", "ask", "review"]);
const projections = new Set<KpConceptRoomProjection>(["symbolic", "balance"]);
const singletonKeys = new Set([
  "route", "v", "checkpoint", "t", "mode", "projection", "branch",
  "provider", "providerProtocol", "providerVersion", "providerProvenance",
  "snapshot", "snapshotIntegrity"
]);

export function formatConceptRoomRoute(route: KpConceptRoomRoute): string {
  validateRoute(route);
  const pairs: [string, string][] = [
    ["route", "1"],
    ["v", route.conceptVersion],
    ["checkpoint", route.checkpoint],
    ["t", String(route.timePermille)],
    ["mode", route.mode],
    ["projection", route.projection]
  ];
  for (const key of Object.keys(route.parameters).sort()) {
    pairs.push([`p.${key}`, route.parameters[key] ?? ""]);
  }
  for (const focus of [...new Set(route.focus)].sort()) pairs.push(["focus", focus]);
  if (route.branch !== undefined) pairs.push(["branch", route.branch]);
  if (route.provider !== undefined) {
    pairs.push(
      ["provider", route.provider.id],
      ["providerProtocol", route.provider.protocol],
      ["providerVersion", route.provider.version],
      ["providerProvenance", route.provider.provenance]
    );
  }
  if (route.snapshot !== undefined) {
    pairs.push(["snapshot", route.snapshot.id], ["snapshotIntegrity", route.snapshot.integrity]);
  }
  const path = `/concepts/${route.conceptId.split(".").map(encodeComponent).join("/")}`;
  return `${path}?${pairs.map(([key, value]) => `${encodeComponent(key)}=${encodeComponent(value)}`).join("&")}`;
}

export function parseConceptRoomRoute(input: string): KpConceptRoomRoute {
  const [path, search, extra] = input.split("?");
  if (path === undefined || search === undefined || extra !== undefined || path.includes("#") || search.includes("#")) {
    malformed("Expected a path-only concept URL with one query string and no fragment.");
  }
  const pathParts = path.split("/");
  if (pathParts[0] !== "" || pathParts[1] !== "concepts" || pathParts.length < 3) {
    malformed("Expected /concepts/<concept-id> path.");
  }
  const conceptParts = pathParts.slice(2).map(decodeComponent);
  if (conceptParts.some((part) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(part))) {
    malformed("Concept path contains an invalid segment.");
  }
  const query = parseQuery(search);
  const schema = requireSingle(query, "route");
  if (schema !== "1") {
    throw new KpConceptRoomRouteError("unsupported-schema", `Unsupported room route schema ${schema}.`);
  }
  const mode = requireSingle(query, "mode");
  const projection = requireSingle(query, "projection");
  if (!modes.has(mode as KpConceptRoomMode)) malformed(`Invalid room mode ${mode}.`);
  if (!projections.has(projection as KpConceptRoomProjection)) malformed(`Invalid projection ${projection}.`);
  const timeText = requireSingle(query, "t");
  const timePermille = Number(timeText);
  if (!/^\d+$/.test(timeText) || !Number.isInteger(timePermille) || timePermille < 0 || timePermille > 1000) {
    malformed(`Invalid room time ${timeText}.`);
  }
  const parameters: Record<string, string> = {};
  for (const [key, values] of query) {
    if (!key.startsWith("p.")) continue;
    const parameterKey = key.slice(2);
    if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(parameterKey) || values.length !== 1) {
      malformed(`Invalid room parameter ${key}.`);
    }
    parameters[parameterKey] = values[0] ?? "";
  }
  const focus = query.get("focus") ?? [];
  const route: KpConceptRoomRoute = {
    schemaVersion: "kp.room-route.v1",
    conceptId: conceptParts.join("."),
    conceptVersion: requireSingle(query, "v"),
    checkpoint: requireSingle(query, "checkpoint"),
    timePermille,
    mode: mode as KpConceptRoomMode,
    projection: projection as KpConceptRoomProjection,
    parameters,
    focus,
    ...optionalValue(query, "branch", "branch"),
    ...optionalProvider(query),
    ...optionalSnapshot(query)
  };
  validateRoute(route);
  return deepFreeze(route);
}

export function canonicalizeConceptRoomRoute(input: string): string {
  return formatConceptRoomRoute(parseConceptRoomRoute(input));
}

function parseQuery(search: string): Map<string, string[]> {
  const query = new Map<string, string[]>();
  if (search.length === 0) malformed("Room route query cannot be empty.");
  for (const pair of search.split("&")) {
    const separator = pair.indexOf("=");
    if (separator <= 0) malformed(`Malformed query pair ${pair}.`);
    const key = decodeComponent(pair.slice(0, separator));
    const value = decodeComponent(pair.slice(separator + 1));
    if (!singletonKeys.has(key) && key !== "focus" && !key.startsWith("p.")) {
      malformed(`Unknown room route field ${key}.`);
    }
    const values = query.get(key) ?? [];
    values.push(value);
    query.set(key, values);
  }
  for (const key of singletonKeys) {
    if ((query.get(key)?.length ?? 0) > 1) malformed(`Duplicate room route field ${key}.`);
  }
  return query;
}

function optionalValue<Key extends string>(
  query: ReadonlyMap<string, readonly string[]>,
  queryKey: string,
  outputKey: Key
): { readonly [Property in Key]?: string } {
  const value = optionalSingle(query, queryKey);
  return value === undefined ? {} : { [outputKey]: value } as { readonly [Property in Key]: string };
}

function optionalProvider(
  query: ReadonlyMap<string, readonly string[]>
): { readonly provider?: KpConceptRoomProviderRouteState } {
  const values = ["provider", "providerProtocol", "providerVersion", "providerProvenance"]
    .map((key) => optionalSingle(query, key));
  if (values.every((value) => value === undefined)) return {};
  if (values.some((value) => value === undefined)) malformed("Provider route state must be complete.");
  return { provider: { id: values[0]!, protocol: values[1]!, version: values[2]!, provenance: values[3]! } };
}

function optionalSnapshot(
  query: ReadonlyMap<string, readonly string[]>
): { readonly snapshot?: KpConceptRoomSnapshotRouteState } {
  const id = optionalSingle(query, "snapshot");
  const integrity = optionalSingle(query, "snapshotIntegrity");
  if (id === undefined && integrity === undefined) return {};
  if (id === undefined || integrity === undefined) malformed("Snapshot route state must be complete.");
  return { snapshot: { id, integrity } };
}

function requireSingle(query: ReadonlyMap<string, readonly string[]>, key: string): string {
  const value = optionalSingle(query, key);
  if (value === undefined) malformed(`Missing room route field ${key}.`);
  return value;
}

function optionalSingle(query: ReadonlyMap<string, readonly string[]>, key: string): string | undefined {
  const values = query.get(key);
  if (values === undefined) return undefined;
  if (values.length !== 1 || values[0] === undefined || values[0].length === 0) {
    malformed(`Expected one non-empty room route field ${key}.`);
  }
  return values[0];
}

function validateRoute(route: KpConceptRoomRoute): void {
  requireMatch(route.conceptId, /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "concept ID");
  requireMatch(route.conceptVersion, /^\d+\.\d+\.\d+$/, "concept version");
  requireMatch(route.checkpoint, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, "checkpoint");
  if (!Number.isInteger(route.timePermille) || route.timePermille < 0 || route.timePermille > 1000) {
    malformed("Room time must be an integer from 0 through 1000.");
  }
  if (!modes.has(route.mode)) malformed(`Invalid room mode ${route.mode}.`);
  if (!projections.has(route.projection)) malformed(`Invalid projection ${route.projection}.`);
  for (const [key, value] of Object.entries(route.parameters)) {
    requireMatch(key, /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "parameter key");
    if (value.length > 256) malformed(`Parameter ${key} is too long.`);
  }
  route.focus.forEach((value) => requireMatch(value, /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "focus reference"));
  if (route.branch !== undefined) requireMatch(route.branch, /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "branch");
  if (route.provider !== undefined) {
    requireMatch(route.provider.id, /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "provider ID");
    requireMatch(route.provider.protocol, /^[a-z0-9]+(?:-[a-z0-9]+)*\.v[1-9][0-9]*$/, "provider protocol");
    requireMatch(route.provider.version, /^\d+\.\d+\.\d+$/, "provider version");
    if (route.provider.provenance.length === 0 || route.provider.provenance.length > 256) {
      malformed("Provider provenance must be non-empty and bounded.");
    }
  }
  if (route.snapshot !== undefined) {
    requireMatch(route.snapshot.id, /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "snapshot ID");
    requireMatch(route.snapshot.integrity, /^sha256:[a-f0-9]{64}$/, "snapshot integrity");
  }
}

function requireMatch(value: string, pattern: RegExp, label: string): void {
  if (!pattern.test(value)) malformed(`Invalid ${label}: ${value}.`);
}

// Keeping encoding local avoids making the headless route contract depend on
// DOM URL objects while preserving standard URL component semantics.
function encodeComponent(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function decodeComponent(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return malformed(`Invalid URL encoding ${value}.`);
  }
}

function malformed(message: string): never {
  throw new KpConceptRoomRouteError("malformed", message);
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
