import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpCanonicalOperationPackPin } from "../semantic/canonical-operation-pack.ts";
import type {
  SemanticTransformationNode,
  SemanticTransformationTreeAnnotation
} from "../semantic/transformation-composition.ts";
import {
  createKpCanonicalAnimationConstruction,
  type KpCanonicalAnimationConstructionArtifact
} from "./canonical-animation-construction.ts";

export interface CompileKpCanonicalAnimationConstructionInput {
  readonly animation: KpAnimationAsset;
  readonly constructionId?: string | undefined;
  readonly sourceId: string;
  readonly revisionId: string;
  readonly operationPacks: readonly KpCanonicalOperationPackPin[];
}

/**
 * Projects existing verified semantic authority into the construction seam.
 * It deliberately does not compile presentation: runtime, static, and export
 * consumers continue to project the same animation asset independently.
 */
export function compileKpCanonicalAnimationConstruction(
  input: CompileKpCanonicalAnimationConstructionInput
): KpCanonicalAnimationConstructionArtifact {
  const { animation } = input;
  const stepIdByTransformationId = new Map(
    animation.transformations.map((transformation) => [
      transformation.id,
      `step.${transformation.id}`
    ])
  );

  return createKpCanonicalAnimationConstruction({
    id: input.constructionId ?? `construction.${animation.id}`,
    title: animation.title,
    semanticSource: {
      sourceId: input.sourceId,
      revisionId: input.revisionId,
      operationPacks: input.operationPacks
    },
    objects: animation.bundle.objects.map((object) => ({
      objectId: object.id,
      entityIds: object.selectors.map(({ id }) => id),
      // Equation states are already the verified expression authorities.
      expressionIds: [object.id]
    })),
    operations: animation.transformations.map((transformation) => {
      if (
        transformation.definitionId === undefined ||
        transformation.correspondenceMap === undefined
      ) {
        throw new Error(
          `Transformation ${transformation.id} requires a definition and canonical lineage.`
        );
      }
      const lineage = transformation.correspondenceMap.records.map((record) => ({
        id: record.id,
        relation: record.relation,
        sourceEntityIds: record.sourceSelectorIds,
        targetEntityIds: record.targetSelectorIds
      }));

      return {
        stepId: stepIdByTransformationId.get(transformation.id)!,
        transformationId: transformation.id,
        definitionId: transformation.definitionId,
        sourceObjectIds: transformation.sourceObjectIds,
        targetObjectIds: transformation.targetObjectIds,
        // A correspondence record is already a verified semantic lifecycle
        // role. Slice 8 may enrich bindings, but it must not infer from glyphs.
        roleBindings: Object.fromEntries(lineage.map((record) => [
          `correspondence.${record.id}`,
          unique([...record.sourceEntityIds, ...record.targetEntityIds])
        ])),
        lineage
      };
    }),
    explanationIntents: compileExplanationIntents(
      animation.transformationTree.root,
      animation.transformationTree.annotations,
      stepIdByTransformationId
    ),
    composition: {
      id: `composition.${animation.transformationTree.root.id}`,
      kind:
        animation.transformationTree.root.kind === "parallel"
          ? "parallel"
          : "sequence",
      operationStepIds: leafTransformationIds(
        animation.transformationTree.root
      ).map((transformationId) => stepIdByTransformationId.get(transformationId)!)
    },
    checkpoints: compileCheckpoints(animation, stepIdByTransformationId)
  });
}

function compileExplanationIntents(
  root: SemanticTransformationNode,
  annotations: readonly SemanticTransformationTreeAnnotation[],
  stepIdByTransformationId: ReadonlyMap<string, string>
) {
  const nodeTransformationIds = indexNodeTransformationIds(root);
  const intents = annotations.flatMap((annotation) => {
    if (annotation.selectorIds === undefined || annotation.selectorIds.length === 0) {
      return [];
    }
    const operationStepIds = (
      nodeTransformationIds.get(annotation.targetNodeId) ?? []
    ).map((id) => stepIdByTransformationId.get(id)!);
    if (operationStepIds.length === 0) return [];

    return [{
      id: `intent.${annotation.id}`,
      kind: "notice" as const,
      operationStepIds,
      entityIds: annotation.selectorIds,
      detail: "key-steps" as const
    }];
  });
  if (intents.length === 0) {
    throw new Error(
      "Canonical construction requires at least one selector-backed explanation annotation."
    );
  }
  return intents;
}

function compileCheckpoints(
  animation: KpAnimationAsset,
  stepIdByTransformationId: ReadonlyMap<string, string>
) {
  const transformations = animation.transformations;
  const allStepIds = transformations.map(({ id }) =>
    stepIdByTransformationId.get(id)!
  );
  const sourceObjectIds = transformations[0]?.sourceObjectIds;
  if (sourceObjectIds === undefined) {
    throw new Error(`Animation ${animation.id} has no transformation checkpoints.`);
  }

  return [
    {
      id: `checkpoint.${animation.id}.source`,
      kind: "source" as const,
      afterOperationStepIds: [],
      objectIds: sourceObjectIds,
      focusEntityIds: []
    },
    ...transformations.map((transformation, index) => ({
      id: `checkpoint.${animation.id}.${index + 1}`,
      kind: index === transformations.length - 1
        ? "target" as const
        : "operation" as const,
      afterOperationStepIds: allStepIds.slice(0, index + 1),
      objectIds: transformation.targetObjectIds,
      focusEntityIds: []
    }))
  ];
}

function indexNodeTransformationIds(
  node: SemanticTransformationNode,
  index = new Map<string, readonly string[]>()
): ReadonlyMap<string, readonly string[]> {
  index.set(node.id, leafTransformationIds(node));
  if (node.kind !== "leaf") {
    node.children.forEach((child) => indexNodeTransformationIds(child, index));
  }
  return index;
}

function leafTransformationIds(
  node: SemanticTransformationNode
): readonly string[] {
  return node.kind === "leaf"
    ? [node.transformation.id]
    : node.children.flatMap(leafTransformationIds);
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
