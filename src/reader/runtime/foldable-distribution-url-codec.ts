import {
  createKpFoldableDistributionEvaluationTree
} from "../../semantic/foldable-distribution-evaluation-tree.ts";
import {
  createKpFoldableDistributionFoldIntent,
  type KpFoldableDistributionFoldMode
} from "../../semantic/foldable-distribution-fold-intent.ts";
import {
  semanticTransformationTreeNodeIds
} from "../../semantic/transformation-composition.ts";
import type {
  KpReaderRuntimeRouteDescriptor
} from "./reader-route-descriptor.ts";

export type KpFoldableDistributionDirection = "forward" | "inverse";
export type KpFoldableDistributionCheckpoint =
  | "factored"
  | "distributed"
  | "products-evaluated"
  | "grouped"
  | "coefficient-factored"
  | "collected";

export interface KpFoldableDistributionUrlState {
  readonly checkpoint: KpFoldableDistributionCheckpoint;
  readonly progressPermille?: number | undefined;
  readonly direction: KpFoldableDistributionDirection;
  readonly foldMode: KpFoldableDistributionFoldMode;
  readonly activeNodeId?: string | undefined;
  readonly collapsedNodeIds: readonly string[];
  readonly pinnedNodeIds: readonly string[];
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
const checkpoints = new Set<KpFoldableDistributionCheckpoint>([
  "factored",
  "distributed",
  "products-evaluated",
  "grouped",
  "coefficient-factored",
  "collected"
]);
const foldModes = new Set<KpFoldableDistributionFoldMode>([
  "expanded",
  "collapsed",
  "automatic",
  "pinned"
]);
const knownNodeIds = new Set(
  semanticTransformationTreeNodeIds(
    createKpFoldableDistributionEvaluationTree().root
  )
);
const foldableNodeIds = new Set(
  createKpFoldableDistributionFoldIntent({ mode: "expanded" }).foldableNodeIds
);

export function decodeKpFoldableDistributionUrl(
  input: string | URL,
  expected?: KpReaderRuntimeRouteDescriptor
): KpFoldableDistributionUrlState {
  const parameters = new URL(input).searchParams;
  validateRoute(parameters, expected);
  const progressPermille = parseProgress(parameters.get("kpProgress"));
  const checkpoint = parseCheckpoint(parameters.get("kpCheckpoint"));
  const foldMode = parseFoldMode(parameters.get("kpFoldMode"));
  const activeNodeId = optionalKnownNode(parameters.get("kpNode"));
  const collapsedNodeIds = parseKnownList(parameters, "kpFold", foldableNodeIds);
  const pinnedNodeIds = parseKnownList(parameters, "kpPin", foldableNodeIds);

  // Reuse the semantic intent constructor so URL input cannot loosen the
  // authoring contract for pins or manufacture a new fold mode.
  createKpFoldableDistributionFoldIntent({
    mode: foldMode,
    pinnedNodeIds
  });

  return Object.freeze({
    checkpoint,
    ...(progressPermille === undefined ? {} : { progressPermille }),
    direction: parameters.get("kpDirection") === "inverse"
      ? "inverse"
      : "forward",
    foldMode,
    ...(activeNodeId === undefined ? {} : { activeNodeId }),
    collapsedNodeIds,
    pinnedNodeIds
  });
}

export function encodeKpFoldableDistributionUrl(
  baseUrl: string | URL,
  route: KpReaderRuntimeRouteDescriptor,
  state: KpFoldableDistributionUrlState
): string {
  validateState(state);
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

function validateState(state: KpFoldableDistributionUrlState): void {
  if (!checkpoints.has(state.checkpoint)) {
    throw new Error(`Unknown foldable distribution checkpoint ${state.checkpoint}.`);
  }
  if (state.direction !== "forward" && state.direction !== "inverse") {
    throw new Error(`Unknown foldable distribution direction ${state.direction}.`);
  }
  if (!foldModes.has(state.foldMode)) {
    throw new Error(`Unknown foldable distribution mode ${state.foldMode}.`);
  }
  parseProgress(
    state.progressPermille === undefined ? null : String(state.progressPermille)
  );
  if (state.activeNodeId !== undefined && !knownNodeIds.has(state.activeNodeId)) {
    throw new Error(`Unknown foldable distribution node ${state.activeNodeId}.`);
  }
  validateIds(state.collapsedNodeIds, foldableNodeIds, "fold");
  validateIds(state.pinnedNodeIds, foldableNodeIds, "pin");
  createKpFoldableDistributionFoldIntent({
    mode: state.foldMode,
    pinnedNodeIds: state.pinnedNodeIds
  });
}

function validateRoute(
  parameters: URLSearchParams,
  expected: KpReaderRuntimeRouteDescriptor | undefined
): void {
  if (expected === undefined) return;
  const documentId = parameters.get("kpLesson");
  const version = parameters.get("kpVersion");
  if (
    documentId !== null &&
    (documentId !== expected.documentId || version !== expected.documentVersion)
  ) {
    throw new Error(
      `foldable distribution URL targets ${documentId}@${version ?? ""}, expected ${expected.documentId}@${expected.documentVersion}`
    );
  }
}

function parseProgress(value: string | null): number | undefined {
  if (value === null) return undefined;
  const progress = Number(value);
  if (!Number.isInteger(progress) || progress < 0 || progress > 1_000) {
    throw new Error(
      "foldable distribution progress must be an integer from 0 to 1000"
    );
  }
  return progress;
}

function parseCheckpoint(
  value: string | null
): KpFoldableDistributionCheckpoint {
  return value !== null && checkpoints.has(value as KpFoldableDistributionCheckpoint)
    ? value as KpFoldableDistributionCheckpoint
    : "factored";
}

function parseFoldMode(value: string | null): KpFoldableDistributionFoldMode {
  return value !== null && foldModes.has(value as KpFoldableDistributionFoldMode)
    ? value as KpFoldableDistributionFoldMode
    : "automatic";
}

function optionalKnownNode(value: string | null): string | undefined {
  if (value === null) return undefined;
  if (!knownNodeIds.has(value)) {
    throw new Error(`Unknown foldable distribution node ${value}.`);
  }
  return value;
}

function parseKnownList(
  parameters: URLSearchParams,
  parameter: string,
  knownIds: ReadonlySet<string>
): readonly string[] {
  const values = parameters.getAll(parameter);
  validateIds(values, knownIds, parameter);
  return Object.freeze(canonicalIds(values));
}

function validateIds(
  values: readonly string[],
  knownIds: ReadonlySet<string>,
  label: string
): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`Foldable distribution URL repeats ${label} state.`);
  }
  const unknown = values.find((value) => !knownIds.has(value));
  if (unknown !== undefined) {
    throw new Error(`Unknown foldable distribution ${label} node ${unknown}.`);
  }
}

function canonicalIds(values: readonly string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}
