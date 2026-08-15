import {
  createKpSemanticMotionCompilerRepairRequired
} from "./semantic-motion-compiler-authority.ts";
import type {
  KpSemanticMotionCompilerRepairRequiredV1,
  KpSemanticMotionCompilerRequestV1,
  KpSemanticMotionStateRefV1
} from "./semantic-motion-compiler-contract.ts";
import {
  isKpVerifiedSemanticMotionPrecedence,
  type KpSemanticMotionEventSpec,
  type KpVerifiedSemanticMotionPrecedence
} from "./semantic-motion-precedence-compiler.ts";

export interface KpSemanticMotionHistoryStepInput {
  readonly request: KpSemanticMotionCompilerRequestV1;
  readonly precedence: KpVerifiedSemanticMotionPrecedence;
}

export interface KpSemanticMotionEntityAddress {
  readonly sourceId: string;
  readonly revisionId: string;
  readonly stateId: string;
  readonly entityId: string;
  readonly semanticIdentityId: string;
}

export interface KpSemanticMotionHistoryCheckpoint {
  readonly id: string;
  readonly index: number;
  readonly stateId: string;
  readonly objectIds: readonly string[];
  readonly entityAddresses: readonly KpSemanticMotionEntityAddress[];
}

export interface KpSemanticMotionHistoryTransition {
  readonly id: string;
  readonly index: number;
  readonly requestId: string;
  readonly sourceCheckpointId: string;
  readonly targetCheckpointId: string;
  readonly precedence: KpVerifiedSemanticMotionPrecedence;
}

declare const kpSemanticMotionHistoryAuthority: unique symbol;

export type KpVerifiedSemanticMotionHistory = Readonly<{
  kind: "verified-semantic-motion-history";
  id: string;
  assetId: string;
  sourceId: string;
  revisionId: string;
  checkpoints: readonly KpSemanticMotionHistoryCheckpoint[];
  transitions: readonly KpSemanticMotionHistoryTransition[];
  [kpSemanticMotionHistoryAuthority]: true;
}>;

export type KpSemanticMotionHistoryCompileResult =
  | { readonly status: "verified"; readonly history: KpVerifiedSemanticMotionHistory }
  | KpSemanticMotionCompilerRepairRequiredV1;

export type KpSemanticMotionHistoryCursor =
  | {
      readonly kind: "checkpoint";
      readonly historyId: string;
      readonly checkpointId: string;
    }
  | {
      readonly kind: "semantic-event";
      readonly historyId: string;
      readonly transitionId: string;
      readonly eventId: string;
    };

export type KpSemanticMotionResolvedHistoryCursor =
  | {
      readonly kind: "checkpoint";
      readonly checkpoint: KpSemanticMotionHistoryCheckpoint;
    }
  | {
      readonly kind: "semantic-event";
      readonly transition: KpSemanticMotionHistoryTransition;
      readonly event: KpSemanticMotionEventSpec;
    };

const verifiedHistories = new WeakSet<object>();
const checkpointUrlVersion = "kp-semantic-motion-checkpoint.v1";

export function compileKpSemanticMotionHistory(input: {
  readonly id: string;
  readonly steps: readonly KpSemanticMotionHistoryStepInput[];
}): KpSemanticMotionHistoryCompileResult {
  const issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][] = [];
  if (input.id.trim().length === 0) {
    addIssue(issues, "history-id", "$.id", "Semantic motion history requires a stable id.");
  }
  if (input.steps.length === 0) {
    addIssue(issues, "empty", "$.steps", "Semantic motion history requires at least one authored step.");
  }
  const first = input.steps[0];
  const requestIds = new Set<string>();
  const transitionIds = new Set<string>();
  input.steps.forEach((step, index) => {
    const path = `$.steps[${index}]`;
    if (!isKpVerifiedSemanticMotionPrecedence(step.precedence)) {
      throw new Error("History compilation requires original semantic precedence authority.");
    }
    if (step.precedence.requestId !== step.request.id) {
      addIssue(issues, "authority-mismatch", path, "Precedence authority does not belong to its request.");
    }
    if (requestIds.has(step.request.id)) {
      addIssue(issues, "duplicate-request", `${path}.request.id`, `History repeats request ${step.request.id}.`);
    }
    requestIds.add(step.request.id);
    if (transitionIds.has(step.request.operation.transformationId)) {
      addIssue(issues, "duplicate-transition", `${path}.request.operation.transformationId`, `History repeats transition ${step.request.operation.transformationId}.`);
    }
    transitionIds.add(step.request.operation.transformationId);
    if (first !== undefined && step.request.assetId !== first.request.assetId) {
      addIssue(issues, "duplicate-stage", `${path}.request.assetId`, "A semantic history composes transitions within one asset stage.");
    }
    const endpoint = step.precedence.structure.lifecycle.provenance.endpointFrontier;
    if (
      endpoint.request !== step.request ||
      endpoint.sourceId !== step.request.semanticSource.sourceId ||
      endpoint.revisionId !== step.request.semanticSource.revisionId
    ) {
      addIssue(issues, "source-authority", path, "Step semantic source does not match its compiled endpoint authority.");
    }
    if (first !== undefined && (
      endpoint.sourceId !== first.request.semanticSource.sourceId ||
      endpoint.revisionId !== first.request.semanticSource.revisionId
    )) {
      addIssue(issues, "source-boundary", path, "Every composed step must share one pinned semantic source revision.");
    }
    const previous = input.steps[index - 1];
    if (previous !== undefined) validateSeam(previous, step, path, issues);
  });

  if (issues.length > 0 || first === undefined) {
    return createKpSemanticMotionCompilerRepairRequired({
      requestId: input.id,
      issues,
      repairTargets: [{ kind: "semantic-state", targetId: input.id }]
    });
  }

  const states = [first.request.sourceState, ...input.steps.map(({ request }) => request.targetState)];
  const checkpoints = states.map((state, index) => createCheckpoint({
    historyId: input.id,
    sourceId: first.request.semanticSource.sourceId,
    revisionId: first.request.semanticSource.revisionId,
    state,
    index,
    identities: identityMapForCheckpoint(input.steps, index)
  }));
  const transitions = input.steps.map((step, index) => Object.freeze({
    id: step.request.operation.transformationId,
    index,
    requestId: step.request.id,
    sourceCheckpointId: checkpoints[index]!.id,
    targetCheckpointId: checkpoints[index + 1]!.id,
    precedence: step.precedence
  }));
  const history = Object.freeze({
    kind: "verified-semantic-motion-history" as const,
    id: input.id,
    assetId: first.request.assetId,
    sourceId: first.request.semanticSource.sourceId,
    revisionId: first.request.semanticSource.revisionId,
    checkpoints: Object.freeze(checkpoints),
    transitions: Object.freeze(transitions)
  }) as KpVerifiedSemanticMotionHistory;
  verifiedHistories.add(history);
  return { status: "verified", history };
}

export function isKpVerifiedSemanticMotionHistory(value: unknown): value is KpVerifiedSemanticMotionHistory {
  return typeof value === "object" && value !== null && verifiedHistories.has(value);
}

export function projectKpSemanticMotionHistory(
  history: KpVerifiedSemanticMotionHistory,
  direction: "forward" | "rewind"
): {
  readonly checkpoints: readonly KpSemanticMotionHistoryCheckpoint[];
  readonly transitions: readonly KpSemanticMotionHistoryTransition[];
} {
  assertHistory(history);
  return direction === "forward"
    ? { checkpoints: history.checkpoints, transitions: history.transitions }
    : { checkpoints: [...history.checkpoints].reverse(), transitions: [...history.transitions].reverse() };
}

export function resolveKpSemanticMotionHistoryCursor(
  history: KpVerifiedSemanticMotionHistory,
  cursor: KpSemanticMotionHistoryCursor
): KpSemanticMotionResolvedHistoryCursor | undefined {
  assertHistory(history);
  if (cursor.historyId !== history.id) return undefined;
  if (cursor.kind === "checkpoint") {
    const checkpoint = history.checkpoints.find(({ id }) => id === cursor.checkpointId);
    return checkpoint === undefined ? undefined : { kind: "checkpoint", checkpoint };
  }
  const transition = history.transitions.find(({ id }) => id === cursor.transitionId);
  const event = transition?.precedence.events.find(({ id }) => id === cursor.eventId);
  return transition === undefined || event === undefined
    ? undefined
    : { kind: "semantic-event", transition, event };
}

export function encodeKpSemanticMotionCheckpointCursor(
  cursor: Extract<KpSemanticMotionHistoryCursor, { readonly kind: "checkpoint" }>
): string {
  const params = new URLSearchParams({
    v: checkpointUrlVersion,
    history: cursor.historyId,
    checkpoint: cursor.checkpointId
  });
  return params.toString();
}

export function restoreKpSemanticMotionCheckpointCursor(
  history: KpVerifiedSemanticMotionHistory,
  encoded: string
): KpSemanticMotionResolvedHistoryCursor | undefined {
  assertHistory(history);
  const params = new URLSearchParams(encoded);
  if (params.get("v") !== checkpointUrlVersion) return undefined;
  const historyId = params.get("history");
  const checkpointId = params.get("checkpoint");
  if (historyId === null || checkpointId === null) return undefined;
  return resolveKpSemanticMotionHistoryCursor(history, {
    kind: "checkpoint",
    historyId,
    checkpointId
  });
}

function validateSeam(
  previous: KpSemanticMotionHistoryStepInput,
  next: KpSemanticMotionHistoryStepInput,
  path: string,
  issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][]
): void {
  if (!sameState(previous.request.targetState, next.request.sourceState)) {
    addIssue(issues, "endpoint-seam", path, `Target ${previous.request.targetState.id} is not the exact source ${next.request.sourceState.id}.`);
    return;
  }
  const previousIdentities = identityMap(previous.precedence);
  const nextIdentities = identityMap(next.precedence);
  previous.request.targetState.entityIds.forEach((entityId) => {
    if (previousIdentities.get(entityId) !== nextIdentities.get(entityId)) {
      addIssue(issues, "identity-seam", path, `Entity ${entityId} changes semantic identity across a composed seam.`);
    }
  });
}

function identityMapForCheckpoint(
  steps: readonly KpSemanticMotionHistoryStepInput[],
  checkpointIndex: number
): ReadonlyMap<string, string> {
  const step = checkpointIndex === steps.length ? steps[steps.length - 1]! : steps[checkpointIndex]!;
  return identityMap(step.precedence);
}

function identityMap(precedence: KpVerifiedSemanticMotionPrecedence): ReadonlyMap<string, string> {
  return new Map(precedence.structure.lifecycle.provenance.identityBindings.map(({ entityId, semanticIdentityId }) => [entityId, semanticIdentityId]));
}

function createCheckpoint(input: {
  readonly historyId: string;
  readonly sourceId: string;
  readonly revisionId: string;
  readonly state: KpSemanticMotionStateRefV1;
  readonly index: number;
  readonly identities: ReadonlyMap<string, string>;
}): KpSemanticMotionHistoryCheckpoint {
  const { historyId, sourceId, revisionId, state, index, identities } = input;
  return Object.freeze({
    id: `${historyId}.checkpoint.${index}.${state.id}`,
    index,
    stateId: state.id,
    objectIds: Object.freeze([...state.objectIds]),
    entityAddresses: Object.freeze(state.entityIds.map((entityId) => {
      const semanticIdentityId = identities.get(entityId);
      if (semanticIdentityId === undefined) throw new Error(`Verified history has no identity binding for ${entityId}.`);
      return Object.freeze({
        sourceId,
        revisionId,
        stateId: state.id,
        entityId,
        semanticIdentityId
      });
    }))
  });
}

function sameState(left: KpSemanticMotionStateRefV1, right: KpSemanticMotionStateRefV1): boolean {
  return left.id === right.id && sameStrings(left.objectIds, right.objectIds) && sameStrings(left.entityIds, right.entityIds);
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function assertHistory(history: KpVerifiedSemanticMotionHistory): void {
  if (!isKpVerifiedSemanticMotionHistory(history)) {
    throw new Error("Semantic history operations require original composition authority.");
  }
}

function addIssue(
  issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][],
  suffix: string,
  path: string,
  message: string
): void {
  issues.push({ code: `semantic-motion.history.${suffix}`, path, message });
}
