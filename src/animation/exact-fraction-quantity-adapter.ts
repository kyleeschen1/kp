import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../semantic/asset.ts";
import {
  createKpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";
import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../reader/compiler/exact-fraction-quantity-preservation-manifest.ts";
import {
  createKpExactFractionQuantityTrace
} from "../semantic/exact-fraction-quantity-trace.ts";

export const kpExactFractionQuantityAnimationId =
  "animation.exact-fraction-quantity.third-plus-sixth";

export function createKpExactFractionQuantityAnimationAsset():
KpAnimationAsset {
  const trace = createKpExactFractionQuantityTrace();
  const objects = trace.states.map((state, stateIndex) =>
    createKpSemanticAssetObject({
      id: state.id,
      objectType: "exact-fraction-quantity-state",
      title: manifest.checkpoints[stateIndex]!.label,
      value: Object.freeze({
        traceId: trace.id,
        checkpointId: state.checkpointId,
        semanticStage: state.semanticStage
      }),
      selectors: state.symbolicForms.map((form, index) => ({
        id: `${state.id}.quantity.${index}`,
        kind: "exact-fraction-selection",
        label: `${form.numerator}/${form.denominator}`
      }))
    })
  );
  const transformations = trace.beats.slice(1).map((beat, beatIndex) =>
    createKpSemanticTransformation({
      id: beat.id,
      transformType: beat.operation,
      title: manifest.checkpoints[beatIndex + 1]!.label,
      sourceObjectIds: [beat.fromStateId!],
      targetObjectIds: [beat.toStateId],
      preserves: ["identity", "value", "structure"],
      lawRefs: [{
        id: "exact-fraction-quantity.conservation",
        level: "strict",
        summary: "The verified trace preserves one exact selected quantity."
      }]
    })
  );
  const root = createSemanticTransformationSequence({
    id: "animation-tree.exact-fraction-quantity.third-plus-sixth",
    label: "Add one third and one sixth",
    children: transformations.map((transformation) =>
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
  const timelineId =
    "timeline.exact-fraction-quantity.third-plus-sixth.shared";
  const renderTargetId =
    "render.exact-fraction-quantity.third-plus-sixth.synchronized";

  return createKpAnimationAsset({
    id: kpExactFractionQuantityAnimationId,
    title: "One third plus one sixth",
    bundle: createKpAssetBundle({
      id: "bundle.exact-fraction-quantity.third-plus-sixth",
      title: "Exact fraction quantity: one third plus one sixth",
      objects
    }),
    transformations,
    transformationTree: createEditableSemanticTransformationTree({ root }),
    timeline: {
      id: timelineId,
      durationMs: 7_500,
      beatCount: manifest.checkpoints.length,
      markerIds: manifest.checkpoints.map(({ id }) => id)
    },
    layout: {
      id: "layout.exact-fraction-quantity.third-plus-sixth",
      kind: "grid",
      targetId: renderTargetId,
      metadata: {
        widePolicy: manifest.presentation.widePolicy,
        phonePolicy: manifest.presentation.phonePolicy
      }
    },
    renderTargets: [{
      id: renderTargetId,
      kind: "diagram",
      objectIds: objects.map(({ id }) => id),
      transformationIds: transformations.map(({ id }) => id),
      timelineId,
      summary:
        "One synchronized symbolic, circle, bar, and number-line surface."
    }],
    checks: [
      {
        id: "check.exact-fraction-quantity.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: kpExactFractionQuantityAnimationId
      },
      {
        id: "check.exact-fraction-quantity.exact-conservation",
        lawId: "exact-fraction-quantity.conservation",
        level: "strict",
        targetId: kpExactFractionQuantityAnimationId
      }
    ],
    exportTargets: [
      {
        id: "export.exact-fraction-quantity.static-step",
        kind: "static-step",
        artifactId: "artifact.exact-fraction-quantity.static-checkpoints"
      }
    ],
    dashboard: {
      rowId: "animation-exact-fraction-quantity-third-plus-sixth",
      tags: [
        "animation",
        "arithmetic",
        "exact-quantity",
        "fraction",
        "multi-representation",
        "promoted"
      ],
      sourceRefIds: [
        trace.id,
        manifest.stablePromotionId
      ]
    },
    metadata: {
      sourceTraceId: trace.id,
      summary:
        "See 1/3 + 1/6 become the same exact half across four synchronized representations.",
      canonicalHost: "editor-animation-library",
      lazyCapabilityPack: "exact-quantity"
    }
  });
}
