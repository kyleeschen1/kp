import {
  isKpCompiledSemanticMotionChoreography,
  sampleKpSemanticMotionChoreography,
  type KpCompiledSemanticMotionChoreography,
  type KpSemanticMotionChoreographySample
} from "./semantic-motion-choreography-compiler.ts";

export interface KpSemanticMotionStageHistoryEntryInput {
  readonly id: string;
  readonly choreography: KpCompiledSemanticMotionChoreography;
}

export interface KpSemanticMotionStageHistoryEntry {
  readonly id: string;
  readonly index: number;
  readonly animationId: string;
  readonly sourceStateId: string;
  readonly targetStateId: string;
  readonly choreography: KpCompiledSemanticMotionChoreography;
}

export interface KpSemanticMotionNativeEndpointHandoff {
  readonly id: string;
  readonly boundaryIndex: number;
  readonly outgoingEntryId: string;
  readonly outgoingTargetStateId: string;
  readonly incomingEntryId: string;
  readonly incomingSourceStateId: string;
  readonly kind: "native-endpoint-cut";
}

declare const kpSemanticMotionStageHistoryAuthority: unique symbol;

export type KpVerifiedSemanticMotionStageHistory = Readonly<{
  kind: "verified-semantic-motion-stage-history";
  id: string;
  clockCoupling: "external-shared-progress";
  entries: readonly KpSemanticMotionStageHistoryEntry[];
  handoffs: readonly KpSemanticMotionNativeEndpointHandoff[];
  [kpSemanticMotionStageHistoryAuthority]: true;
}>;

export interface KpSemanticMotionStageHistoryFrame {
  readonly historyId: string;
  readonly requestedProgress: number;
  readonly semanticProgress: number;
  readonly direction: "forward" | "rewind";
  readonly activeOwnerCount: 1;
  readonly activeEntryId: string;
  readonly activeEntryIndex: number;
  readonly activeAnimationId: string;
  readonly localSemanticProgress: number;
  readonly choreography: KpSemanticMotionChoreographySample;
  readonly handoff?: KpSemanticMotionNativeEndpointHandoff | undefined;
}

const verifiedStageHistories = new WeakSet<object>();
const boundaryTolerance = 1e-9;

/**
 * Composes independent native equation stages without inventing identity at
 * their seams. Contiguous transformations still belong in semantic motion
 * history; this higher-level history owns only endpoint cuts and one clock.
 */
export function compileKpSemanticMotionStageHistory(input: {
  readonly id: string;
  readonly entries: readonly KpSemanticMotionStageHistoryEntryInput[];
}): KpVerifiedSemanticMotionStageHistory {
  if (input.id.trim().length === 0) {
    throw new Error("Semantic motion stage history requires a stable id.");
  }
  if (input.entries.length === 0) {
    throw new Error("Semantic motion stage history requires at least one entry.");
  }
  const entryIds = new Set<string>();
  const choreographyIds = new Set<string>();
  const requestIds = new Set<string>();
  const entries = input.entries.map((entry, index) => {
    if (entry.id.trim().length === 0 || entryIds.has(entry.id)) {
      throw new Error(`Semantic motion stage history has invalid entry id ${entry.id}.`);
    }
    if (!isKpCompiledSemanticMotionChoreography(entry.choreography)) {
      throw new Error("Semantic motion stage history requires original compiler authority.");
    }
    if (entry.choreography.clockCoupling !== "external-shared-progress") {
      throw new Error("Semantic motion stage history requires one shared external clock.");
    }
    if (choreographyIds.has(entry.choreography.id)) {
      throw new Error(`Semantic motion stage history repeats choreography ${entry.choreography.id}.`);
    }
    if (requestIds.has(entry.choreography.requestId)) {
      throw new Error(`Semantic motion stage history repeats request ${entry.choreography.requestId}.`);
    }
    entryIds.add(entry.id);
    choreographyIds.add(entry.choreography.id);
    requestIds.add(entry.choreography.requestId);
    const request = requestFor(entry.choreography);
    return Object.freeze({
      id: entry.id,
      index,
      animationId: request.assetId,
      sourceStateId: request.sourceState.id,
      targetStateId: request.targetState.id,
      // Retaining the nominal authority by reference prevents a second plan or
      // renderer session from appearing at this orchestration boundary.
      choreography: entry.choreography
    });
  });
  const handoffs = entries.slice(1).map((incoming, index) => {
    const outgoing = entries[index]!;
    return Object.freeze({
      id: `${input.id}.handoff.${index + 1}`,
      boundaryIndex: index + 1,
      outgoingEntryId: outgoing.id,
      outgoingTargetStateId: outgoing.targetStateId,
      incomingEntryId: incoming.id,
      incomingSourceStateId: incoming.sourceStateId,
      kind: "native-endpoint-cut" as const
    });
  });
  const history = Object.freeze({
    kind: "verified-semantic-motion-stage-history" as const,
    id: input.id,
    clockCoupling: "external-shared-progress" as const,
    entries: Object.freeze(entries),
    handoffs: Object.freeze(handoffs)
  }) as KpVerifiedSemanticMotionStageHistory;
  verifiedStageHistories.add(history);
  return history;
}

export function isKpVerifiedSemanticMotionStageHistory(
  value: unknown
): value is KpVerifiedSemanticMotionStageHistory {
  return typeof value === "object" && value !== null &&
    verifiedStageHistories.has(value);
}

export function sampleKpSemanticMotionStageHistory(input: {
  readonly history: KpVerifiedSemanticMotionStageHistory;
  readonly progress: number;
  readonly direction: "forward" | "rewind";
  readonly reducedMotion?: boolean | undefined;
}): KpSemanticMotionStageHistoryFrame {
  if (!isKpVerifiedSemanticMotionStageHistory(input.history)) {
    throw new Error("Stage-history sampling requires original composition authority.");
  }
  const requestedProgress = clamp01(input.progress);
  const semanticProgress = input.direction === "forward"
    ? requestedProgress
    : 1 - requestedProgress;
  const scaled = semanticProgress * input.history.entries.length;
  const boundaryIndex = internalBoundaryIndex(
    scaled,
    input.history.entries.length
  );
  const activeEntryIndex = activeIndex({
    scaled,
    entryCount: input.history.entries.length,
    direction: input.direction,
    boundaryIndex
  });
  const activeEntry = input.history.entries[activeEntryIndex]!;
  const localSemanticProgress = clamp01(scaled - activeEntryIndex);
  const localRequestedProgress = input.direction === "forward"
    ? localSemanticProgress
    : 1 - localSemanticProgress;
  const choreography = sampleKpSemanticMotionChoreography({
    choreography: activeEntry.choreography,
    progress: localRequestedProgress,
    direction: input.direction,
    reducedMotion: input.reducedMotion
  });
  const handoff = boundaryIndex === undefined
    ? undefined
    : input.history.handoffs[boundaryIndex - 1];
  return Object.freeze({
    historyId: input.history.id,
    requestedProgress,
    semanticProgress: round(semanticProgress),
    direction: input.direction,
    activeOwnerCount: 1 as const,
    activeEntryId: activeEntry.id,
    activeEntryIndex,
    activeAnimationId: activeEntry.animationId,
    localSemanticProgress: round(localSemanticProgress),
    choreography,
    ...(handoff === undefined ? {} : { handoff })
  });
}

function requestFor(choreography: KpCompiledSemanticMotionChoreography) {
  return choreography.resolution.precedence.structure.lifecycle.provenance
    .endpointFrontier.request;
}

function activeIndex(input: {
  readonly scaled: number;
  readonly entryCount: number;
  readonly direction: "forward" | "rewind";
  readonly boundaryIndex: number | undefined;
}): number {
  if (input.scaled <= 0) return 0;
  if (input.scaled >= input.entryCount) return input.entryCount - 1;
  if (input.boundaryIndex !== undefined) {
    return input.direction === "forward"
      ? input.boundaryIndex
      : input.boundaryIndex - 1;
  }
  return Math.floor(input.scaled);
}

function internalBoundaryIndex(
  scaled: number,
  entryCount: number
): number | undefined {
  const nearest = Math.round(scaled);
  return nearest > 0 && nearest < entryCount &&
      Math.abs(scaled - nearest) <= boundaryTolerance
    ? nearest
    : undefined;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Semantic motion stage history progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
