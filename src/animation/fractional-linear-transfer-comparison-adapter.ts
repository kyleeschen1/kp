import { createKpAnimationAsset, type KpAnimationAsset } from "./asset.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import { createKpCancellationPresentationAuthoringMetadata } from "../semantic/cancellation-presentation-authoring.ts";
import { createKpAssetBundle } from "../semantic/asset.ts";
import { createKpSemanticTransformation } from "../semantic/asset-transformation.ts";
import {
  createFractionalLinearCertifiedTransferProjection,
  kpFractionalLinearCertifiedTransferProxyRecordId
} from "../semantic/fractional-linear-certified-transfer.ts";
import {
  createFractionalLinearEquationKpAsset,
  fractionalLinearEquationAssetIds as ids
} from "../semantic/fractional-linear-equation-asset.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";

const comparisonObjectIds = [
  ids.rightSimplified,
  ids.multiplied,
  ids.denominatorCancelled,
  ids.solved
] as const;

export function createFractionalLinearTransferBalancedAnimationAsset(): KpAnimationAsset {
  const source = createFractionalLinearEquationKpAsset();
  const transformations = [ids.multiply, ids.cancelDenominator, ids.simplifyProduct]
    .map((id) => requiredTransformation(source, id));
  return comparisonAnimation({
    id: "animation.fractional-linear.x-over-2.balanced-proof",
    title: "Solve x/2 = 4 with balanced operations",
    source,
    transformations,
    durationMs: 2_700
  });
}

export function createFractionalLinearTransferFluentAnimationAsset(): KpAnimationAsset {
  const source = createFractionalLinearEquationKpAsset();
  const projection = createFractionalLinearCertifiedTransferProjection(source);
  const projectedTransfer = createKpSemanticTransformation({
    id: "transform.fractional-linear.project-certified-transfer",
    transformType: "projectCertifiedFractionTransfer",
    title: "Project the certified denominator transfer",
    sourceObjectIds: [projection.sourceObjectId],
    targetObjectIds: [projection.bridgeObjectId],
    preserves: ["value", "presentation"],
    correspondenceMap: {
      id: "transform.fractional-linear.project-certified-transfer.correspondence",
      records: [
        record("x-persists", "role-change", [selector(ids.rightSimplified, "fraction.numerator.x")], [selector(ids.denominatorCancelled, "lhs.x")], "The variable persists while the fraction structure retires."),
        record("relation-persists", "identity", [selector(ids.rightSimplified, "equals")], [selector(ids.denominatorCancelled, "equals")], "Equality persists."),
        record("four-persists", "identity", [selector(ids.rightSimplified, "rhs.4")], [selector(ids.denominatorCancelled, "rhs.4")], "Four persists as a product factor."),
        record("fraction-rule-retires", "removal", [selector(ids.rightSimplified, "fraction.rule")], [], "The fraction rule retires after the certified cancellation."),
        record("denominator-retires", "removal", [projection.denominatorProxy.sourceSelectorId], [], "The denominator retires through the hidden balanced cancellation."),
        record("multiplier-enters", "introduction", [], [projection.denominatorProxy.bridgeSelectorId], "The equal right-side factor enters through the hidden balanced multiplication."),
        record("product-enters", "introduction", [], [selector(ids.denominatorCancelled, "rhs.product")], "The product operator makes the resulting multiplication explicit.")
      ]
    },
    assumptions: [
      `Certified by ${projection.proofTransformationIds.join(", ")}.`
    ],
    lawRefs: [{
      id: "law.presentation.certified-fraction-transfer-projection",
      level: "strict",
      summary: "A presentation projection may compress, but may not replace, its strict balanced proof."
    }]
  });
  return comparisonAnimation({
    id: "animation.fractional-linear.x-over-2.fluent-projection",
    title: "Solve x/2 = 4 with a certified fluent projection",
    source,
    transformations: [
      projectedTransfer,
      requiredTransformation(source, ids.simplifyProduct)
    ],
    durationMs: 1_900,
    metadata: {
      certifiedTransferProjectionId: projection.id,
      certifiedTransferProxyRecordId: kpFractionalLinearCertifiedTransferProxyRecordId,
      certifiedTransferProof: projection.proofTransformationIds.join(",")
    }
  });
}

function comparisonAnimation(input: {
  readonly id: string;
  readonly title: string;
  readonly source: ReturnType<typeof createFractionalLinearEquationKpAsset>;
  readonly transformations: readonly ReturnType<typeof createKpSemanticTransformation>[];
  readonly durationMs: number;
  readonly metadata?: Readonly<Record<string, string>>;
}): KpAnimationAsset {
  const bundle = createKpAssetBundle({
    id: `${input.id}.bundle`,
    title: input.title,
    objects: input.source.bundle.objects.filter((object) =>
      comparisonObjectIds.includes(object.id as typeof comparisonObjectIds[number])
    )
  });
  const root = createSemanticTransformationSequence({
    id: `${input.id}.sequence`,
    label: input.title,
    children: input.transformations.map((transformation) =>
      createSemanticTransformationLeaf(createSemanticTransformationRef({
        id: transformation.id,
        kind: transformation.transformType,
        sourceObjectIds: transformation.sourceObjectIds,
        targetObjectIds: transformation.targetObjectIds,
        preserves: transformation.preserves,
        summary: transformation.title
      }))
    )
  });
  const timelineId = `${input.id}.timeline`;
  return createKpAnimationAsset({
    id: input.id,
    title: input.title,
    bundle,
    transformations: input.transformations,
    transformationTree: createEditableSemanticTransformationTree({
      root,
      annotations: input.transformations.map((transformation) => ({
        id: `focus.${transformation.id}`,
        kind: "focus" as const,
        targetNodeId: transformation.id,
        placement: "during" as const,
        selectorIds: causalSelectors(transformation)
      }))
    }),
    timeline: { id: timelineId, durationMs: input.durationMs, beatCount: 48 },
    layout: {
      id: `${input.id}.layout`,
      kind: "single",
      targetId: `${input.id}.render`
    },
    renderTargets: [{
      id: `${input.id}.render`,
      kind: "equation",
      objectIds: comparisonObjectIds,
      transformationIds: input.transformations.map((transformation) => transformation.id),
      timelineId
    }],
    checks: [{
      id: `${input.id}.reference-closure`,
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: input.id
    }],
    metadata: {
      sourceTraceId: input.source.sourceTraceId,
      equationMotionPresentationRecipe: "continuity-v1",
      equationNativeHandoffRecipe: "atomic-v1",
      ...createKpCancellationPresentationAuthoringMetadata("preserve-flow"),
      equationSuccessorPresentationRecipe: "convergence-v1",
      equationDepthPresentationRecipe: "semantic-depth-v1",
      equationContinuantPresentationRecipe: "transit-then-reflow-v1",
      ...(input.metadata ?? {})
    }
  });
}

function requiredTransformation(
  source: ReturnType<typeof createFractionalLinearEquationKpAsset>,
  id: string
) {
  const transformation = source.transformations.find((candidate) => candidate.id === id);
  if (transformation === undefined) throw new Error(`Missing fractional transformation ${id}.`);
  return transformation;
}

function causalSelectors(
  transformation: ReturnType<typeof createKpSemanticTransformation>
): readonly string[] {
  return transformation.correspondenceMap?.records
    .filter((recordValue) => recordValue.relation !== "identity")
    .flatMap((recordValue) => [
      ...recordValue.sourceSelectorIds,
      ...recordValue.targetSelectorIds
    ]) ?? [];
}

function record(
  id: string,
  relation: "identity" | "role-change" | "introduction" | "removal",
  sourceSelectorIds: readonly string[],
  targetSelectorIds: readonly string[],
  summary: string
) {
  return { id, relation, sourceSelectorIds, targetSelectorIds, summary };
}

function selector(objectId: string, path: string): string {
  return `${objectId}.${path}`;
}
