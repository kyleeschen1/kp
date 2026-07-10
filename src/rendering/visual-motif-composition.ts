import {
  semanticTransformationForwardPhases,
  semanticTransformationRewindPhases,
  type EditableSemanticTransformationTree,
  type SemanticTransformationLeafNode,
  type SemanticTransformationNode,
  type SemanticTransformationTreeAnnotation,
  type SemanticTransformationTreeAnnotationPlacement
} from "../semantic/transformation-composition.ts";
import type { VisualMotifDescriptor } from "./visual-motif.ts";

export type TransformTreeVisualMotifDirection = "forward" | "rewind";

export interface TransformTreeVisualMotifRule<
  TKind extends string = string,
  TPrimitiveId extends string = string,
  TPhaseId extends string = string
> {
  readonly transformationKind: string;
  readonly descriptor: VisualMotifDescriptor<TKind, TPrimitiveId, TPhaseId>;
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
      semanticTransformationForwardPhases(input.tree.root),
      segmentIdByNodeId,
      annotations
    ),
    rewindPhases: createDirectionPhases(
      input.id,
      "rewind",
      semanticTransformationRewindPhases(input.tree.root),
      segmentIdByNodeId,
      annotations
    ),
    annotations
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
    motionPrimitiveIds: [...rule.descriptor.motionPrimitiveIds],
    phaseIds: [...rule.descriptor.phaseIds],
    summary: rule.summary ?? rule.descriptor.summary
  };
}

function createDirectionPhases(
  timelineId: string,
  direction: TransformTreeVisualMotifDirection,
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
    annotationIdsByPlacement: annotationIdsForPhase(
      nodeIds,
      direction,
      annotations
    )
  }));
}

function annotationIdsForPhase(
  nodeIds: readonly string[],
  direction: TransformTreeVisualMotifDirection,
  annotations: readonly SemanticTransformationTreeAnnotation[]
): TransformTreeVisualMotifPhaseAnnotationIds {
  const nodeIdSet = new Set(nodeIds);
  const idsByPlacement: {
    before: string[];
    during: string[];
    after: string[];
  } = {
    before: [],
    during: [],
    after: []
  };

  for (const annotation of annotations) {
    if (!nodeIdSet.has(annotation.targetNodeId)) {
      continue;
    }

    const placement =
      direction === "forward"
        ? annotation.placement
        : mirrorPlacement(annotation.placement);
    idsByPlacement[placement].push(annotation.id);
  }

  return idsByPlacement;
}

function mirrorPlacement(
  placement: SemanticTransformationTreeAnnotationPlacement
): SemanticTransformationTreeAnnotationPlacement {
  switch (placement) {
    case "before":
      return "after";
    case "during":
      return "during";
    case "after":
      return "before";
  }
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
