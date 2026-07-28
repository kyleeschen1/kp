import {
  semanticTransformationAnnotationIdsForPhase,
  semanticTransformationForwardPhases,
  semanticTransformationRewindPhases,
  type EditableSemanticTransformationTree,
  type SemanticTransformationLeafNode,
  type SemanticTransformationNode,
  type SemanticTransformationTreeAnnotation
} from "../../semantic/transformation-composition.ts";
import type {
  KpLawCheckResult,
  KpLawFailure
} from "../../semantic/asset-laws.ts";
import type { VisualMotifDescriptor } from "./visual-motif.ts";

export type TransformTreeVisualMotifDirection = "forward" | "rewind";

export interface TransformTreeVisualMotifRule<
  TKind extends string = string,
  TPrimitiveId extends string = string,
  TPhaseId extends string = string
> {
  readonly transformationKind: string;
  readonly descriptor: VisualMotifDescriptor<TKind, TPrimitiveId, TPhaseId>;
  readonly definitionIds?: readonly string[] | undefined;
  readonly canonicalOperationIds?: readonly string[] | undefined;
  readonly trustedMotifIds?: readonly string[] | undefined;
  readonly summary?: string | undefined;
}

export interface CreateTransformTreeVisualMotifTimelineInput<
  TKind extends string = string,
  TPrimitiveId extends string = string,
  TPhaseId extends string = string
> {
  readonly id: string;
  readonly tree: EditableSemanticTransformationTree;
  readonly rules: readonly TransformTreeVisualMotifRule<
    TKind,
    TPrimitiveId,
    TPhaseId
  >[];
}

export interface TransformTreeVisualMotifTimeline<
  TKind extends string = string,
  TPrimitiveId extends string = string,
  TPhaseId extends string = string
> {
  readonly id: string;
  readonly segments: readonly TransformTreeVisualMotifSegment<
    TKind,
    TPrimitiveId,
    TPhaseId
  >[];
  readonly forwardPhases: readonly TransformTreeVisualMotifPhase[];
  readonly rewindPhases: readonly TransformTreeVisualMotifPhase[];
  readonly annotations: readonly SemanticTransformationTreeAnnotation[];
}

export interface TransformTreeVisualMotifSegment<
  TKind extends string = string,
  TPrimitiveId extends string = string,
  TPhaseId extends string = string
> {
  readonly id: string;
  readonly transformationNodeId: string;
  readonly transformationKind: string;
  readonly motifKind: TKind;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly definitionIds?: readonly string[] | undefined;
  readonly canonicalOperationIds?: readonly string[] | undefined;
  readonly trustedMotifIds?: readonly string[] | undefined;
  readonly motionPrimitiveIds: readonly TPrimitiveId[];
  readonly phaseIds: readonly TPhaseId[];
  readonly summary: string;
}

export interface TransformTreeVisualMotifPhase {
  readonly id: string;
  readonly direction: TransformTreeVisualMotifDirection;
  readonly segmentIds: readonly string[];
  readonly annotationIdsByPlacement: TransformTreeVisualMotifPhaseAnnotationIds;
}

export interface TransformTreeVisualMotifPhaseAnnotationIds {
  readonly before: readonly string[];
  readonly during: readonly string[];
  readonly after: readonly string[];
}

// This adapter keeps semantic tree structure intact while projecting it into
// presentation motif phases that renderers can sample forward or backward.
export function createTransformTreeVisualMotifTimeline<
  TKind extends string,
  TPrimitiveId extends string,
  TPhaseId extends string
>(
  input: CreateTransformTreeVisualMotifTimelineInput<
    TKind,
    TPrimitiveId,
    TPhaseId
  >
): TransformTreeVisualMotifTimeline<TKind, TPrimitiveId, TPhaseId> {
  const ruleByTransformationKind = createRuleMap(input.rules);
  const leaves = collectLeafNodes(input.tree.root);
  const segments = leaves.map((leaf) =>
    createSegmentForLeaf(input.id, leaf, ruleByTransformationKind)
  );
  const segmentIdByNodeId = new Map(
    segments.map((segment) => [segment.transformationNodeId, segment.id])
  );
  const annotations = input.tree.annotations.map((annotation) =>
    cloneTreeAnnotation(annotation)
  );

  return {
    id: input.id,
    segments,
    forwardPhases: createDirectionPhases(
      input.id,
      "forward",
      input.tree.root,
      semanticTransformationForwardPhases(input.tree.root),
      segmentIdByNodeId,
      annotations
    ),
    rewindPhases: createDirectionPhases(
      input.id,
      "rewind",
      input.tree.root,
      semanticTransformationRewindPhases(input.tree.root),
      segmentIdByNodeId,
      annotations
    ),
    annotations
  };
}

export function checkTransformTreeVisualMotifRewindLaw(
  timeline: TransformTreeVisualMotifTimeline
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];
  const expectedRewindSegmentIds = [...timeline.forwardPhases]
    .reverse()
    .map((phase) => phase.segmentIds);
  const actualRewindSegmentIds = timeline.rewindPhases.map(
    (phase) => phase.segmentIds
  );

  if (!segmentPhaseListsEqual(actualRewindSegmentIds, expectedRewindSegmentIds)) {
    failures.push({
      path: `${timeline.id}.rewindPhases`,
      message:
        `Visual motif timeline ${timeline.id} rewind phases must mirror forward phase segment order.`
    });
  }

  return {
    lawId: "transform-tree-visual-motif.rewind-phase-mirror",
    passed: failures.length === 0,
    failures
  };
}

function createRuleMap<
  TKind extends string,
  TPrimitiveId extends string,
  TPhaseId extends string
>(
  rules: readonly TransformTreeVisualMotifRule<TKind, TPrimitiveId, TPhaseId>[]
): ReadonlyMap<string, TransformTreeVisualMotifRule<TKind, TPrimitiveId, TPhaseId>> {
  const ruleByTransformationKind = new Map<
    string,
    TransformTreeVisualMotifRule<TKind, TPrimitiveId, TPhaseId>
  >();

  for (const rule of rules) {
    if (ruleByTransformationKind.has(rule.transformationKind)) {
      throw new Error(
        `Duplicate visual motif rule for transformation kind ${rule.transformationKind}.`
      );
    }

    ruleByTransformationKind.set(rule.transformationKind, rule);
  }

  return ruleByTransformationKind;
}

function collectLeafNodes(
  node: SemanticTransformationNode
): readonly SemanticTransformationLeafNode[] {
  switch (node.kind) {
    case "leaf":
      return [node];
    case "sequence":
    case "parallel":
      return node.children.flatMap(collectLeafNodes);
  }
}

function createSegmentForLeaf<
  TKind extends string,
  TPrimitiveId extends string,
  TPhaseId extends string
>(
  timelineId: string,
  leaf: SemanticTransformationLeafNode,
  ruleByTransformationKind: ReadonlyMap<
    string,
    TransformTreeVisualMotifRule<TKind, TPrimitiveId, TPhaseId>
  >
): TransformTreeVisualMotifSegment<TKind, TPrimitiveId, TPhaseId> {
  const rule = ruleByTransformationKind.get(leaf.transformation.kind);

  if (rule === undefined) {
    throw new Error(
      `No visual motif rule for transformation kind ${leaf.transformation.kind} in timeline ${timelineId}.`
    );
  }

  return {
    id: `${leaf.id}.visual.${rule.descriptor.kind}`,
    transformationNodeId: leaf.id,
    transformationKind: leaf.transformation.kind,
    motifKind: rule.descriptor.kind,
    sourceObjectIds: [...leaf.sourceObjectIds],
    targetObjectIds: [...leaf.targetObjectIds],
    definitionIds: [...(rule.definitionIds ?? [])],
    canonicalOperationIds: [...(rule.canonicalOperationIds ?? [])],
    trustedMotifIds: [...(rule.trustedMotifIds ?? [])],
    motionPrimitiveIds: [...rule.descriptor.motionPrimitiveIds],
    phaseIds: [...rule.descriptor.phaseIds],
    summary: rule.summary ?? rule.descriptor.summary
  };
}

function createDirectionPhases(
  timelineId: string,
  direction: TransformTreeVisualMotifDirection,
  root: SemanticTransformationNode,
  nodePhases: readonly (readonly string[])[],
  segmentIdByNodeId: ReadonlyMap<string, string>,
  annotations: readonly SemanticTransformationTreeAnnotation[]
): readonly TransformTreeVisualMotifPhase[] {
  return nodePhases.map((nodeIds, index) => ({
    id: `${timelineId}.${direction}.${index}`,
    direction,
    segmentIds: nodeIds.map((nodeId) => {
      const segmentId = segmentIdByNodeId.get(nodeId);

      if (segmentId === undefined) {
        throw new Error(
          `No visual motif segment for transformation node ${nodeId} in timeline ${timelineId}.`
        );
      }

      return segmentId;
    }),
    annotationIdsByPlacement: semanticTransformationAnnotationIdsForPhase({
      root,
      phaseNodeIds: nodeIds,
      direction,
      annotations
    })
  }));
}

function cloneTreeAnnotation(
  annotation: SemanticTransformationTreeAnnotation
): SemanticTransformationTreeAnnotation {
  return {
    id: annotation.id,
    kind: annotation.kind,
    targetNodeId: annotation.targetNodeId,
    placement: annotation.placement,
    ...(annotation.selectorIds === undefined
      ? {}
      : { selectorIds: [...annotation.selectorIds] }),
    ...(annotation.durationBeats === undefined
      ? {}
      : { durationBeats: annotation.durationBeats }),
    ...(annotation.summary === undefined ? {} : { summary: annotation.summary })
  };
}

function segmentPhaseListsEqual(
  actual: readonly (readonly string[])[],
  expected: readonly (readonly string[])[]
): boolean {
  if (actual.length !== expected.length) {
    return false;
  }

  return actual.every((segmentIds, index) =>
    stringListsEqual(segmentIds, expected[index] ?? [])
  );
}

function stringListsEqual(
  actual: readonly string[],
  expected: readonly string[]
): boolean {
  if (actual.length !== expected.length) {
    return false;
  }

  return actual.every((value, index) => value === expected[index]);
}
