import {
  createKpFoldableDistributionEvaluationTree
} from "./foldable-distribution-evaluation-tree.ts";
import type {
  KpFoldableDistributionProjection
} from "./foldable-distribution-fold-projection.ts";
import {
  semanticTransformationLeafRefs
} from "./transformation-composition.ts";

export interface KpFoldableDistributionTimelinePhase {
  readonly nodeId: string;
  readonly operationIds: readonly string[];
  readonly detail: "expanded" | "collapsed" | "leaf";
  readonly startBeat: number;
  readonly endBeat: number;
  readonly minimumVisibleBeats: number;
}

export interface KpFoldableDistributionTimeline {
  readonly schemaVersion: "kp.foldable-distribution-timeline.v1";
  readonly id: "timeline.foldable-distribution.shared";
  readonly totalBeats: number;
  readonly phases: readonly KpFoldableDistributionTimelinePhase[];
  readonly checkpoints: Readonly<Record<
    "factored" | "distributed" | "products-evaluated" | "grouped" | "collected",
    number
  >>;
}

export interface KpFoldableDistributionTimelineSample {
  readonly progress: number;
  readonly beat: number;
  readonly activeNodeId: string;
  readonly phaseProgress: number;
}

const GROUP_BEATS = Object.freeze({
  expanded: 18,
  collapsed: 9
});
const LEAF_BEATS = 14;
const MINIMUM_VISIBLE_BEATS = 5;

/**
 * Folding changes presentation density, never the semantic phase order or the
 * operation cohort assigned to a phase.
 */
export function compileKpFoldableDistributionFoldTimeline(
  projection: KpFoldableDistributionProjection
): KpFoldableDistributionTimeline {
  const tree = createKpFoldableDistributionEvaluationTree();
  if (tree.root.kind !== "sequence") {
    throw new Error("Foldable distribution timeline requires a sequence root.");
  }
  const expanded = new Set(projection.expandedNodeIds);
  const collapsed = new Set(projection.collapsedNodeIds);
  let cursor = 0;
  const phases = tree.root.children.map((node) => {
    const detail = node.kind === "leaf"
      ? "leaf"
      : expanded.has(node.id)
        ? "expanded"
        : collapsed.has(node.id)
          ? "collapsed"
          : undefined;
    if (detail === undefined) {
      throw new Error(`Fold timing is missing presentation state for ${node.id}.`);
    }
    const duration = detail === "leaf" ? LEAF_BEATS : GROUP_BEATS[detail];
    const phase = Object.freeze({
      nodeId: node.id,
      operationIds: Object.freeze(
        semanticTransformationLeafRefs(node).map(({ id }) => id)
      ),
      detail,
      startBeat: cursor,
      endBeat: cursor + duration,
      minimumVisibleBeats: MINIMUM_VISIBLE_BEATS
    });
    cursor += duration;
    return phase;
  });
  const [distribution, products, grouping, collection] = phases;
  if (
    distribution === undefined ||
    products === undefined ||
    grouping === undefined ||
    collection === undefined
  ) {
    throw new Error("Foldable distribution timeline requires four phases.");
  }

  return Object.freeze({
    schemaVersion: "kp.foldable-distribution-timeline.v1" as const,
    id: "timeline.foldable-distribution.shared" as const,
    totalBeats: cursor,
    phases: Object.freeze(phases),
    checkpoints: Object.freeze({
      factored: 0,
      distributed: distribution.endBeat / cursor,
      "products-evaluated": products.endBeat / cursor,
      grouped: grouping.endBeat / cursor,
      collected: collection.endBeat / cursor
    })
  });
}

export function sampleKpFoldableDistributionTimeline(input: {
  readonly timeline: KpFoldableDistributionTimeline;
  readonly progress: number;
}): KpFoldableDistributionTimelineSample {
  const progress = clamp(input.progress, 0, 1);
  const beat = progress * input.timeline.totalBeats;
  const active =
    input.timeline.phases.find(({ endBeat }) => beat < endBeat) ??
    input.timeline.phases.at(-1);
  if (active === undefined) {
    throw new Error("Cannot sample an empty foldable distribution timeline.");
  }
  const phaseProgress = clamp(
    (beat - active.startBeat) / (active.endBeat - active.startBeat),
    0,
    1
  );
  return Object.freeze({
    progress,
    beat,
    activeNodeId: active.nodeId,
    phaseProgress
  });
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
