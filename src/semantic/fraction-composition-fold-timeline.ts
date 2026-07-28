import {
  createKpFractionCompositionEvaluationTree
} from "./fraction-composition-evaluation-tree.ts";
import type {
  KpFractionCompositionFoldProjection
} from "./fraction-composition-fold-projection.ts";
import {
  semanticTransformationLeafRefs
} from "./transformation-composition.ts";

export interface KpFractionCompositionTimelinePhase {
  readonly nodeId: string;
  readonly operationIds: readonly string[];
  readonly detail: "expanded" | "collapsed";
  readonly startBeat: number;
  readonly endBeat: number;
  readonly minimumVisibleBeats: number;
}

export interface KpFractionCompositionTimeline {
  readonly schemaVersion: "kp.fraction-composition-timeline.v1";
  readonly id: "timeline.fraction-composition.shared";
  readonly totalBeats: number;
  readonly phases: readonly KpFractionCompositionTimelinePhase[];
  readonly checkpoints: Readonly<Record<
    "factored" | "normalized" | "constant-quotient" |
      "difference-simplified" | "right-product-simplified" | "solved",
    number
  >>;
}

export interface KpFractionCompositionTimelineSample {
  readonly progress: number;
  readonly beat: number;
  readonly activeNodeId: string;
  readonly phaseProgress: number;
}

const EXPANDED_BEATS_PER_OPERATION = 12;
const COLLAPSED_BEATS_PER_OPERATION = 4;
const MINIMUM_VISIBLE_BEATS = 5;

/**
 * Folding changes how long a certified operation group is exposed, not which
 * operations exist or their order. Runtime progress is projected separately
 * onto all thirteen canonical transformations.
 */
export function compileKpFractionCompositionFoldTimeline(
  projection: KpFractionCompositionFoldProjection
): KpFractionCompositionTimeline {
  const tree = createKpFractionCompositionEvaluationTree();
  if (tree.root.kind !== "sequence") {
    throw new Error("Fraction composition timeline requires a sequence root.");
  }
  const expanded = new Set(projection.expandedNodeIds);
  const collapsed = new Set(projection.collapsedNodeIds);
  let cursor = 0;
  const phases = tree.root.children.map((node) => {
    const detail = expanded.has(node.id)
      ? "expanded"
      : collapsed.has(node.id)
        ? "collapsed"
        : undefined;
    if (detail === undefined) {
      throw new Error(
        `Fraction composition timing is missing presentation state for ${node.id}.`
      );
    }
    const operationIds = Object.freeze(
      semanticTransformationLeafRefs(node).map(({ id }) => id)
    );
    const duration = Math.max(
      MINIMUM_VISIBLE_BEATS,
      operationIds.length * (
        detail === "expanded"
          ? EXPANDED_BEATS_PER_OPERATION
          : COLLAPSED_BEATS_PER_OPERATION
      )
    );
    const phase = Object.freeze({
      nodeId: node.id,
      operationIds,
      detail,
      startBeat: cursor,
      endBeat: cursor + duration,
      minimumVisibleBeats: MINIMUM_VISIBLE_BEATS
    });
    cursor += duration;
    return phase;
  });
  const [fractions, constants, subtraction, multiplication, division] = phases;
  if (
    fractions === undefined ||
    constants === undefined ||
    subtraction === undefined ||
    multiplication === undefined ||
    division === undefined
  ) {
    throw new Error("Fraction composition timeline requires five phases.");
  }

  return Object.freeze({
    schemaVersion: "kp.fraction-composition-timeline.v1" as const,
    id: "timeline.fraction-composition.shared" as const,
    totalBeats: cursor,
    phases: Object.freeze(phases),
    checkpoints: Object.freeze({
      factored: 0,
      normalized: fractions.endBeat / cursor,
      "constant-quotient": constants.endBeat / cursor,
      "difference-simplified": subtraction.endBeat / cursor,
      "right-product-simplified": multiplication.endBeat / cursor,
      solved: division.endBeat / cursor
    })
  });
}

export function sampleKpFractionCompositionTimeline(input: {
  readonly timeline: KpFractionCompositionTimeline;
  readonly progress: number;
}): KpFractionCompositionTimelineSample {
  const progress = clamp(input.progress, 0, 1);
  const rawBeat = progress * input.timeline.totalBeats;
  const beat = [
    0,
    ...input.timeline.phases.map(({ endBeat }) => endBeat)
  ].find((boundary) => Math.abs(boundary - rawBeat) <= 1e-9) ?? rawBeat;
  const active =
    input.timeline.phases.find(({ endBeat }) => beat < endBeat) ??
    input.timeline.phases.at(-1);
  if (active === undefined) {
    throw new Error("Cannot sample an empty fraction composition timeline.");
  }
  return Object.freeze({
    progress,
    beat,
    activeNodeId: active.nodeId,
    phaseProgress: clamp(
      (beat - active.startBeat) / (active.endBeat - active.startBeat),
      0,
      1
    )
  });
}

export function projectKpFractionCompositionAnimationProgress(input: {
  readonly timeline: KpFractionCompositionTimeline;
  readonly sample: KpFractionCompositionTimelineSample;
}): number {
  const phaseIndex = input.timeline.phases.findIndex(
    ({ nodeId }) => nodeId === input.sample.activeNodeId
  );
  if (phaseIndex < 0) {
    throw new Error(
      `Unknown fraction composition phase ${input.sample.activeNodeId}.`
    );
  }
  const operationOffset = input.timeline.phases
    .slice(0, phaseIndex)
    .reduce((sum, phase) => sum + phase.operationIds.length, 0);
  const activeOperationCount =
    input.timeline.phases[phaseIndex]!.operationIds.length;
  const operationCount = input.timeline.phases.reduce(
    (sum, phase) => sum + phase.operationIds.length,
    0
  );
  return clamp(
    (
      operationOffset +
      input.sample.phaseProgress * activeOperationCount
    ) / operationCount,
    0,
    1
  );
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
