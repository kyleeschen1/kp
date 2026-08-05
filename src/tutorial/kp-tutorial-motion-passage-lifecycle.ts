export type KpTutorialMotionPassageProximity =
  | "distant"
  | "near"
  | "visible";

export interface KpTutorialPresentMotionPassage<
  PassageId extends string = string,
  CapabilityId extends string = string
> {
  readonly id: PassageId;
  readonly capabilityId: CapabilityId;
  readonly disposition: "present";
  readonly proximity: KpTutorialMotionPassageProximity;
  /** Exact semantic state retained while the live renderer is absent. */
  readonly semanticProgress: number;
}

export interface KpTutorialDisposedMotionPassage<
  PassageId extends string = string,
  CapabilityId extends string = string
> {
  readonly id: PassageId;
  readonly capabilityId: CapabilityId;
  readonly disposition: "disposed";
  readonly proximity: "distant";
  /** Disposal releases runtime resources, not restorable lesson state. */
  readonly semanticProgress: number;
}

export type KpTutorialMotionPassage<
  PassageId extends string = string,
  CapabilityId extends string = string
> = KpTutorialPresentMotionPassage<PassageId, CapabilityId> |
  KpTutorialDisposedMotionPassage<PassageId, CapabilityId>;

export interface KpTutorialMotionPassageLifecyclePolicy {
  /** Includes the focused passage and every paused, prehydrated neighbor. */
  readonly maxHydratedPassages: number;
}

export interface KpTutorialMotionPassageProjection<
  PassageId extends string = string,
  CapabilityId extends string = string
> {
  readonly id: PassageId;
  readonly capabilityId: CapabilityId;
  readonly disposition: "present" | "disposed";
  readonly proximity: KpTutorialMotionPassageProximity;
  readonly semanticProgress: number;
  readonly attention: "background" | "focused";
  readonly geometry: "reserved" | "released";
  readonly runtime: "dehydrated" | "hydrated" | "disposed";
  readonly motion: "paused" | "active";
  readonly accessibility: "static" | "synchronized" | "removed";
}

export interface KpTutorialMotionPassageLifecyclePlan<
  PassageId extends string = string,
  CapabilityId extends string = string
> {
  readonly focusedPassageId: PassageId | undefined;
  readonly activeMotionPassageId: PassageId | undefined;
  readonly hydratedPassageIds: readonly PassageId[];
  readonly requiredCapabilityIds: readonly CapabilityId[];
  readonly passages: readonly KpTutorialMotionPassageProjection<
    PassageId,
    CapabilityId
  >[];
}

export type KpTutorialScrollPassagePhase =
  | "ordinary-document"
  | "entry-latched"
  | "scrubbing"
  | "terminal-latched"
  | "released";

export interface KpTutorialScrollPassageTimeline {
  readonly entryLatchScrollY: number;
  readonly motionStartScrollY: number;
  readonly terminalLatchScrollY: number;
  readonly releaseScrollY: number;
}

export interface KpTutorialScrollPassagePhaseProjection {
  readonly phase: KpTutorialScrollPassagePhase;
  readonly motionEligible: boolean;
}

export interface KpTutorialBoundaryCueSalienceProjection {
  readonly opacity: number;
  readonly endpointPinned: boolean;
}

/**
 * Physical scroll state is projected from position alone. Keeping direction
 * out of this contract makes browser history, direct seek, and reverse scroll
 * settle to the same state without reconstructing prior events.
 */
export function projectKpTutorialScrollPassagePhase(input: {
  readonly scrollY: number;
  readonly timeline: KpTutorialScrollPassageTimeline;
}): KpTutorialScrollPassagePhaseProjection {
  assertScrollPassageTimeline(input.timeline);
  if (!Number.isFinite(input.scrollY)) {
    throw new Error("Tutorial passage scroll position must be finite.");
  }
  const phase = input.scrollY < input.timeline.entryLatchScrollY
    ? "ordinary-document" as const
    : input.scrollY < input.timeline.motionStartScrollY
      ? "entry-latched" as const
      : input.scrollY < input.timeline.terminalLatchScrollY
        ? "scrubbing" as const
        : input.scrollY < input.timeline.releaseScrollY
          ? "terminal-latched" as const
          : "released" as const;
  return Object.freeze({
    phase,
    motionEligible: phase === "scrubbing"
  });
}

export function projectKpTutorialBoundaryCueSalience(input: {
  readonly phase: KpTutorialScrollPassagePhase;
  readonly cueIndex: number;
  readonly cueCount: number;
  readonly projectedOpacity: number;
}): KpTutorialBoundaryCueSalienceProjection {
  if (!Number.isInteger(input.cueCount) || input.cueCount < 1) {
    throw new Error("Tutorial passage cue count must be a positive integer.");
  }
  if (!Number.isInteger(input.cueIndex) ||
      input.cueIndex < 0 || input.cueIndex >= input.cueCount) {
    throw new Error("Tutorial passage cue index is outside its cue count.");
  }
  if (!Number.isFinite(input.projectedOpacity) ||
      input.projectedOpacity < 0 || input.projectedOpacity > 1) {
    throw new Error("Tutorial passage cue opacity must be within [0, 1].");
  }
  const firstBeforeEntry = input.cueIndex === 0 &&
    input.phase === "ordinary-document";
  const lastAfterTerminal = input.cueIndex === input.cueCount - 1 &&
    (input.phase === "terminal-latched" || input.phase === "released");
  const endpointPinned = firstBeforeEntry || lastAfterTerminal;
  return Object.freeze({
    opacity: endpointPinned ? 1 : input.projectedOpacity,
    endpointPinned
  });
}

/**
 * Pure lifecycle policy stops before DOM, framework, and renderer ownership.
 * Hosts may realize reserved geometry differently while sharing one bounded
 * hydration and motion-authority contract.
 */
export function projectKpTutorialMotionPassageLifecycle<
  PassageId extends string,
  CapabilityId extends string
>(input: {
  /** Document order is the stable tie-breaker for hydration. */
  readonly passages: readonly KpTutorialMotionPassage<
    PassageId,
    CapabilityId
  >[];
  readonly focusedPassageId?: PassageId | undefined;
  readonly reducedMotion: boolean;
  readonly policy: KpTutorialMotionPassageLifecyclePolicy;
}): KpTutorialMotionPassageLifecyclePlan<PassageId, CapabilityId> {
  assertLifecycleInput(input);
  const focusedIndex = input.focusedPassageId === undefined
    ? -1
    : input.passages.findIndex(({ id }) => id === input.focusedPassageId);
  const hydrationCandidates = input.passages
    .map((passage, index) => ({ passage, index }))
    .filter(({ passage }) =>
      passage.disposition === "present" && passage.proximity !== "distant"
    )
    .sort((left, right) => {
      const focusedPriority = Number(
        right.passage.id === input.focusedPassageId
      ) - Number(left.passage.id === input.focusedPassageId);
      if (focusedPriority !== 0) return focusedPriority;
      const proximityPriority = proximityRank(right.passage.proximity) -
        proximityRank(left.passage.proximity);
      if (proximityPriority !== 0) return proximityPriority;
      if (focusedIndex >= 0) {
        const distance = Math.abs(left.index - focusedIndex) -
          Math.abs(right.index - focusedIndex);
        if (distance !== 0) return distance;
      }
      return left.index - right.index;
    })
    .slice(0, input.policy.maxHydratedPassages);
  const hydratedPassageIds = Object.freeze(
    hydrationCandidates.map(({ passage }) => passage.id)
  );
  const hydratedIds = new Set(hydratedPassageIds);
  const activeMotionPassageId = input.reducedMotion
    ? undefined
    : input.focusedPassageId;
  const requiredCapabilityIds = Object.freeze(
    [...new Set(hydrationCandidates.map(({ passage }) => passage.capabilityId))]
  );
  const passages = Object.freeze(input.passages.map((passage) => {
    const disposed = passage.disposition === "disposed";
    const hydrated = !disposed && hydratedIds.has(passage.id);
    const focused = passage.id === input.focusedPassageId;
    return Object.freeze({
      id: passage.id,
      capabilityId: passage.capabilityId,
      disposition: passage.disposition,
      proximity: passage.proximity,
      semanticProgress: passage.semanticProgress,
      attention: focused ? "focused" as const : "background" as const,
      geometry: disposed ? "released" as const : "reserved" as const,
      runtime: disposed
        ? "disposed" as const
        : hydrated
          ? "hydrated" as const
          : "dehydrated" as const,
      motion: passage.id === activeMotionPassageId
        ? "active" as const
        : "paused" as const,
      accessibility: disposed
        ? "removed" as const
        : hydrated
          ? "synchronized" as const
          : "static" as const
    });
  }));
  return Object.freeze({
    focusedPassageId: input.focusedPassageId,
    activeMotionPassageId,
    hydratedPassageIds,
    requiredCapabilityIds,
    passages
  });
}

/** Disposal is terminal and idempotent for a retained passage record. */
export function disposeKpTutorialMotionPassage<
  PassageId extends string,
  CapabilityId extends string
>(
  passage: KpTutorialMotionPassage<PassageId, CapabilityId>
): KpTutorialDisposedMotionPassage<PassageId, CapabilityId> {
  if (passage.disposition === "disposed") return passage;
  return Object.freeze({
    id: passage.id,
    capabilityId: passage.capabilityId,
    disposition: "disposed",
    proximity: "distant",
    semanticProgress: passage.semanticProgress
  });
}

/** Semantic settlement follows document order and does not depend on hydration. */
export function projectKpTutorialMotionPassageSettlement<
  PassageId extends string,
  CapabilityId extends string
>(input: {
  readonly passages: readonly KpTutorialPresentMotionPassage<
    PassageId,
    CapabilityId
  >[];
  readonly activePassageId: PassageId;
  readonly localProgress: number;
}): readonly KpTutorialPresentMotionPassage<PassageId, CapabilityId>[] {
  if (!Number.isFinite(input.localProgress) ||
      input.localProgress < 0 || input.localProgress > 1) {
    throw new Error("Tutorial passage local progress must be within [0, 1].");
  }
  const ids = new Set(input.passages.map(({ id }) => id));
  if (ids.size !== input.passages.length) {
    throw new Error("Tutorial passage settlement ids must be unique.");
  }
  const activeIndex = input.passages.findIndex(
    ({ id }) => id === input.activePassageId
  );
  if (activeIndex < 0) {
    throw new Error(`Unknown active tutorial passage: ${input.activePassageId}`);
  }
  return Object.freeze(input.passages.map((passage, index) => Object.freeze({
    ...passage,
    semanticProgress: index < activeIndex
      ? 1
      : index === activeIndex
        ? input.localProgress
        : 0
  })));
}

function assertLifecycleInput<PassageId extends string, CapabilityId extends string>(
  input: {
    readonly passages: readonly KpTutorialMotionPassage<
      PassageId,
      CapabilityId
    >[];
    readonly focusedPassageId?: PassageId | undefined;
    readonly policy: KpTutorialMotionPassageLifecyclePolicy;
  }
): void {
  if (!Number.isInteger(input.policy.maxHydratedPassages) ||
      input.policy.maxHydratedPassages < 1) {
    throw new Error("Tutorial passage hydration limit must be a positive integer.");
  }
  const ids = new Set<string>();
  for (const passage of input.passages) {
    if (passage.id.trim() === "") {
      throw new Error("Tutorial passage id must not be empty.");
    }
    if (ids.has(passage.id)) {
      throw new Error(`Duplicate tutorial motion passage id: ${passage.id}`);
    }
    ids.add(passage.id);
    if (passage.capabilityId.trim() === "") {
      throw new Error(`Tutorial passage ${passage.id} needs a capability id.`);
    }
    if (!Number.isFinite(passage.semanticProgress) ||
        passage.semanticProgress < 0 || passage.semanticProgress > 1) {
      throw new Error(
        `Tutorial passage ${passage.id} semantic progress must be within [0, 1].`
      );
    }
  }
  if (input.focusedPassageId === undefined) return;
  const focused = input.passages.find(({ id }) => id === input.focusedPassageId);
  if (focused === undefined) {
    throw new Error(`Unknown focused tutorial passage: ${input.focusedPassageId}`);
  }
  if (focused.disposition === "disposed") {
    throw new Error(`Disposed tutorial passage cannot own focus: ${focused.id}`);
  }
  if (focused.proximity !== "visible") {
    throw new Error(`Focused tutorial passage must be visible: ${focused.id}`);
  }
}

function proximityRank(proximity: KpTutorialMotionPassageProximity): number {
  if (proximity === "visible") return 2;
  if (proximity === "near") return 1;
  return 0;
}

function assertScrollPassageTimeline(
  timeline: KpTutorialScrollPassageTimeline
): void {
  const thresholds = [
    timeline.entryLatchScrollY,
    timeline.motionStartScrollY,
    timeline.terminalLatchScrollY,
    timeline.releaseScrollY
  ];
  if (thresholds.some((value) => !Number.isFinite(value))) {
    throw new Error("Tutorial passage timeline thresholds must be finite.");
  }
  for (let index = 1; index < thresholds.length; index += 1) {
    if (thresholds[index]! < thresholds[index - 1]!) {
      throw new Error("Tutorial passage timeline thresholds must be ordered.");
    }
  }
}
