import type {
  KpReaderRuntimeRouteDescriptor
} from "./reader-route-descriptor.ts";

export type KpReaderEvaluationFoldMode =
  | "expanded"
  | "collapsed"
  | "automatic"
  | "pinned";

export interface KpReaderEvaluationFoldUrlState<
  TCheckpoint extends string
> {
  readonly checkpoint: TCheckpoint;
  readonly progressPermille?: number | undefined;
  readonly direction: "forward" | "inverse";
  readonly foldMode: KpReaderEvaluationFoldMode;
  readonly activeNodeId?: string | undefined;
  readonly collapsedNodeIds: readonly string[];
  readonly pinnedNodeIds: readonly string[];
}

export interface KpReaderEvaluationFoldUrlContract<
  TCheckpoint extends string
> {
  readonly label: string;
  readonly checkpointIds: ReadonlySet<TCheckpoint>;
  readonly defaultCheckpoint: TCheckpoint;
  readonly knownNodeIds: ReadonlySet<string>;
  readonly foldableNodeIds: ReadonlySet<string>;
  readonly validateIntent: (
    mode: KpReaderEvaluationFoldMode,
    pinnedNodeIds: readonly string[]
  ) => void;
}

const PARAMETERS = Object.freeze([
  "kpLesson",
  "kpVersion",
  "kpCheckpoint",
  "kpProgress",
  "kpDirection",
  "kpFoldMode",
  "kpNode",
  "kpFold",
  "kpPin"
]);
const foldModes = new Set<KpReaderEvaluationFoldMode>([
  "expanded",
  "collapsed",
  "automatic",
  "pinned"
]);

export function decodeKpReaderEvaluationFoldUrl<TCheckpoint extends string>(
  input: string | URL,
  contract: KpReaderEvaluationFoldUrlContract<TCheckpoint>,
  expected?: KpReaderRuntimeRouteDescriptor
): KpReaderEvaluationFoldUrlState<TCheckpoint> {
  const parameters = new URL(input).searchParams;
  validateRoute(parameters, expected, contract.label);
  const progressPermille = parseProgress(
    parameters.get("kpProgress"),
    contract.label
  );
  const foldMode = parseFoldMode(parameters.get("kpFoldMode"));
  const pinnedNodeIds = parseKnownList(
    parameters,
    "kpPin",
    contract.foldableNodeIds,
    contract.label
  );
  contract.validateIntent(foldMode, pinnedNodeIds);
  const checkpointValue = parameters.get("kpCheckpoint");
  const checkpoint =
    checkpointValue !== null &&
      contract.checkpointIds.has(checkpointValue as TCheckpoint)
      ? checkpointValue as TCheckpoint
      : contract.defaultCheckpoint;
  const nodeValue = parameters.get("kpNode");
  if (nodeValue !== null && !contract.knownNodeIds.has(nodeValue)) {
    throw new Error(`Unknown ${contract.label} node ${nodeValue}.`);
  }
  return Object.freeze({
    checkpoint,
    ...(progressPermille === undefined ? {} : { progressPermille }),
    direction: parameters.get("kpDirection") === "inverse"
      ? "inverse"
      : "forward",
    foldMode,
    ...(nodeValue === null ? {} : { activeNodeId: nodeValue }),
    collapsedNodeIds: parseKnownList(
      parameters,
      "kpFold",
      contract.foldableNodeIds,
      contract.label
    ),
    pinnedNodeIds
  });
}

export function encodeKpReaderEvaluationFoldUrl<TCheckpoint extends string>(
  baseUrl: string | URL,
  route: KpReaderRuntimeRouteDescriptor,
  state: KpReaderEvaluationFoldUrlState<TCheckpoint>,
  contract: KpReaderEvaluationFoldUrlContract<TCheckpoint>
): string {
  validateState(state, contract);
  const url = new URL(baseUrl);
  for (const parameter of PARAMETERS) url.searchParams.delete(parameter);
  url.searchParams.set("kpLesson", route.documentId);
  url.searchParams.set("kpVersion", route.documentVersion);
  url.searchParams.set("kpCheckpoint", state.checkpoint);
  if (state.progressPermille !== undefined) {
    url.searchParams.set("kpProgress", String(state.progressPermille));
  }
  url.searchParams.set("kpDirection", state.direction);
  url.searchParams.set("kpFoldMode", state.foldMode);
  if (state.activeNodeId !== undefined) {
    url.searchParams.set("kpNode", state.activeNodeId);
  }
  for (const nodeId of canonicalIds(state.collapsedNodeIds)) {
    url.searchParams.append("kpFold", nodeId);
  }
  for (const nodeId of canonicalIds(state.pinnedNodeIds)) {
    url.searchParams.append("kpPin", nodeId);
  }
  url.searchParams.sort();
  return url.toString();
}

function validateState<TCheckpoint extends string>(
  state: KpReaderEvaluationFoldUrlState<TCheckpoint>,
  contract: KpReaderEvaluationFoldUrlContract<TCheckpoint>
): void {
  if (!contract.checkpointIds.has(state.checkpoint)) {
    throw new Error(`Unknown ${contract.label} checkpoint ${state.checkpoint}.`);
  }
  if (state.direction !== "forward" && state.direction !== "inverse") {
    throw new Error(`Unknown ${contract.label} direction ${state.direction}.`);
  }
  if (!foldModes.has(state.foldMode)) {
    throw new Error(`Unknown ${contract.label} mode ${state.foldMode}.`);
  }
  parseProgress(
    state.progressPermille === undefined ? null : String(state.progressPermille),
    contract.label
  );
  if (
    state.activeNodeId !== undefined &&
    !contract.knownNodeIds.has(state.activeNodeId)
  ) {
    throw new Error(`Unknown ${contract.label} node ${state.activeNodeId}.`);
  }
  validateIds(
    state.collapsedNodeIds,
    contract.foldableNodeIds,
    "fold",
    contract.label
  );
  validateIds(
    state.pinnedNodeIds,
    contract.foldableNodeIds,
    "pin",
    contract.label
  );
  contract.validateIntent(state.foldMode, state.pinnedNodeIds);
}

function validateRoute(
  parameters: URLSearchParams,
  expected: KpReaderRuntimeRouteDescriptor | undefined,
  label: string
): void {
  if (expected === undefined) return;
  const documentId = parameters.get("kpLesson");
  const version = parameters.get("kpVersion");
  if (
    documentId !== null &&
    (documentId !== expected.documentId ||
      version !== expected.documentVersion)
  ) {
    throw new Error(
      `${label} URL targets ${documentId}@${version ?? ""}, ` +
      `expected ${expected.documentId}@${expected.documentVersion}`
    );
  }
}

function parseProgress(
  value: string | null,
  label: string
): number | undefined {
  if (value === null) return undefined;
  const progress = Number(value);
  if (!Number.isInteger(progress) || progress < 0 || progress > 1_000) {
    throw new Error(`${label} progress must be an integer from 0 to 1000`);
  }
  return progress;
}

function parseFoldMode(value: string | null): KpReaderEvaluationFoldMode {
  return value !== null && foldModes.has(value as KpReaderEvaluationFoldMode)
    ? value as KpReaderEvaluationFoldMode
    : "automatic";
}

function parseKnownList(
  parameters: URLSearchParams,
  parameter: string,
  knownIds: ReadonlySet<string>,
  label: string
): readonly string[] {
  const values = parameters.getAll(parameter);
  validateIds(values, knownIds, parameter, label);
  return Object.freeze(canonicalIds(values));
}

function validateIds(
  values: readonly string[],
  knownIds: ReadonlySet<string>,
  stateLabel: string,
  contractLabel: string
): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${contractLabel} URL repeats ${stateLabel} state.`);
  }
  const unknown = values.find((value) => !knownIds.has(value));
  if (unknown !== undefined) {
    throw new Error(`Unknown ${contractLabel} ${stateLabel} node ${unknown}.`);
  }
}

function canonicalIds(values: readonly string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}
