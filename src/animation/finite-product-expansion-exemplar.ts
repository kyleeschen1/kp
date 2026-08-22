import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpSemanticMaterialEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";
import {
  kpCanonicalFiniteProductExpansionPresentationPlan
} from "./finite-product-expansion-presentation-plan.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../semantic/asset.ts";
import { createKpSemanticTransformation } from
  "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../semantic/transformation-composition.ts";
import {
  KP_CANONICAL_FINITE_PRODUCT_SOURCE_LATEX,
  KP_CANONICAL_FINITE_PRODUCT_SOURCE_STATE_ID,
  KP_CANONICAL_FINITE_PRODUCT_TARGET_LATEX,
  KP_CANONICAL_FINITE_PRODUCT_TARGET_STATE_ID,
  kpCanonicalFiniteProductExpansionOperation
} from "../semantic/canonical-finite-product-expansion.ts";
import { KP_FINITE_PRODUCT_EXPANSION_ANIMATION_ID } from
  "../domain-ir/finite-binder-authorities.ts";

export const kpFiniteProductExpansionExemplarId =
  KP_FINITE_PRODUCT_EXPANSION_ANIMATION_ID;

export function createKpFiniteProductExpansionExemplarAsset():
KpAnimationAsset {
  const operation = kpCanonicalFiniteProductExpansionOperation;
  const source = operation.source.semantic;
  const sourceReference = source.body.references[0]!;
  const sourceObject = createKpSemanticAssetObject({
    id: KP_CANONICAL_FINITE_PRODUCT_SOURCE_STATE_ID,
    objectType: "equation",
    title: "Finite product notation",
    value: Object.freeze({
      latex: KP_CANONICAL_FINITE_PRODUCT_SOURCE_LATEX,
      stateKind: "source" as const
    }),
    selectors: [
      source.operator,
      source.binder,
      source.lowerBound,
      source.upperBound,
      source.body,
      sourceReference
    ].map(({ id, role }) => ({
      id,
      kind: role,
      label: role,
      metadata: { representation: "native-katex" }
    })),
    metadata: {
      latex: KP_CANONICAL_FINITE_PRODUCT_SOURCE_LATEX,
      settledEndpointAuthority: "native-katex"
    }
  });
  const targetObject = createKpSemanticAssetObject({
    id: KP_CANONICAL_FINITE_PRODUCT_TARGET_STATE_ID,
    objectType: "equation",
    title: "Expanded finite product",
    value: Object.freeze({
      latex: KP_CANONICAL_FINITE_PRODUCT_TARGET_LATEX,
      stateKind: "target" as const
    }),
    selectors: [
      ...operation.target.instances.flatMap((instance) => [{
        id: instance.id,
        kind: instance.role,
        label: instance.role,
        metadata: { representation: "native-katex" }
      }, {
        id: instance.references[0]!.id,
        kind: instance.references[0]!.role,
        label: instance.references[0]!.role,
        metadata: { representation: "native-katex" }
      }]),
      ...operation.target.adjacencies.map((adjacency) => ({
        id: adjacency.id,
        kind: adjacency.role,
        label: adjacency.role,
        metadata: { representation: "implicit-layout-adjacency" }
      }))
    ],
    metadata: {
      latex: KP_CANONICAL_FINITE_PRODUCT_TARGET_LATEX,
      settledEndpointAuthority: "native-katex"
    }
  });
  const transformation = createKpSemanticTransformation({
    id: "transformation.equation.finite-product-expand.v1",
    transformType: "finiteBinderExpand",
    title: "Expand a bounded product into its ordered factors",
    sourceObjectIds: [KP_CANONICAL_FINITE_PRODUCT_SOURCE_STATE_ID],
    targetObjectIds: [KP_CANONICAL_FINITE_PRODUCT_TARGET_STATE_ID],
    preserves: ["value", "structure", "role"],
    correspondenceMap: {
      id: "correspondence.finite-product-expansion.canonical",
      records: [{
        id: "correspondence.finite-product.body-template",
        relation: "fan-out",
        sourceSelectorIds: [source.body.id],
        targetSelectorIds: operation.target.instances.map(({ id }) => id),
        summary: "Instantiate one product body at each ordered range value."
      }, {
        id: "correspondence.finite-product.bound-reference",
        relation: "fan-out",
        sourceSelectorIds: [sourceReference.id],
        targetSelectorIds: operation.target.instances.map(
          ({ references }) => references[0]!.id
        ),
        summary: "Substitute each integer for the locally bound reference."
      }, {
        id: "correspondence.finite-product.adjacency",
        relation: "fan-out",
        sourceSelectorIds: [source.operator.id],
        targetSelectorIds: operation.target.adjacencies.map(({ id }) => id),
        summary: "Resolve product syntax into implicit factor adjacency."
      }]
    },
    correspondence: operation.target.instances.map((instance) => ({
      sourceSelectorId: source.body.id,
      targetSelectorId: instance.id,
      preserves: ["structure", "role"],
      summary: `Instantiate the body at index ${instance.indexValue}.`
    })),
    assumptions: [
      "The binder has verified local scope.",
      "The inclusive finite range is ordered and capture-free.",
      "Juxtaposition denotes product adjacency without an explicit glyph."
    ],
    lawRefs: [{
      id: operation.operation,
      level: "strict",
      summary:
        "A finite product expands to one ordered body factor per bound value."
    }]
  });
  const root = createSemanticTransformationLeaf(
    createSemanticTransformationRef({
      id: transformation.id,
      kind: transformation.transformType,
      sourceObjectIds: transformation.sourceObjectIds,
      targetObjectIds: transformation.targetObjectIds,
      preserves: transformation.preserves,
      summary: transformation.title
    })
  );
  const timelineId = `timeline.${kpFiniteProductExpansionExemplarId}`;
  const renderTargetId = "render.finite-product-expansion.equation";
  const objects = [sourceObject, targetObject];
  return createKpAnimationAsset({
    id: kpFiniteProductExpansionExemplarId,
    title: "Expand a finite product",
    bundle: createKpAssetBundle({
      id: "asset.finite-product-expansion.canonical",
      title: "Product from zero to two of x sub k",
      objects
    }),
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({ root }),
    timeline: {
      id: timelineId,
      durationMs: 6_000,
      beatCount: 120,
      markerIds: [transformation.id]
    },
    layout: {
      id: "layout.finite-product-expansion",
      kind: "single",
      targetId: renderTargetId
    },
    renderTargets: [{
      id: renderTargetId,
      kind: "equation",
      objectIds: objects.map(({ id }) => id),
      selectorIds: objects.flatMap(({ selectors }) =>
        selectors.map(({ id }) => id)
      ),
      transformationIds: [transformation.id],
      timelineId,
      summary: "Unfold one finite product into three adjacent factors."
    }],
    checks: [{
      id: "check.finite-product-expansion.reference-closure",
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: kpFiniteProductExpansionExemplarId
    }, {
      id: "check.finite-product-expansion.seek-rewind",
      lawId: "animation.seek-rewind",
      level: "strict",
      targetId: root.id
    }],
    exportTargets: [{
      id: "export.finite-product-expansion.frames",
      kind: "frame-sequence",
      artifactId: "artifact.finite-product-expansion.frames"
    }],
    dashboard: {
      rowId: "exemplar-equation-finite-product-expansion-v1",
      tags: ["algebra", "animation", "equation", "katex", "product"]
    },
    presentationProfile:
      createKpSemanticMaterialEquationPresentationProfileV1(),
    metadata: {
      sourceFamilyId: "family.equation.finite-binder-expansion.v1",
      presentationPlanId:
        kpCanonicalFiniteProductExpansionPresentationPlan.id,
      settledEndpointAuthority: "native-katex",
      maturity: "product-pressure-candidate"
    }
  });
}
