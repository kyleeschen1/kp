import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpCanonicalBalancedSolveEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../semantic/asset.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../semantic/transformation-composition.ts";
import {
  KP_LOG_PRODUCT_EQUIVALENCE_FRAME_ANIMATION_ID,
  kpLogProductEquivalenceFrame
} from "../semantic/log-product-equivalence-frame.ts";
import { listKpLogProductExpressionNodes } from
  "../semantic/log-product-states.ts";
import { kpCanonicalCompiledLogProductOperation } from
  "../semantic/log-product-transformation-compiler.ts";

const KP_LOG_PRODUCT_EQUIVALENCE_DURATION_MS = 4_800;
const KP_LOG_PRODUCT_EQUIVALENCE_BEAT_COUNT = 96;

export function createKpLogProductEquivalenceFrameAnimationAsset():
KpAnimationAsset {
  const operation = kpCanonicalCompiledLogProductOperation;
  const frame = kpLogProductEquivalenceFrame;
  const states = operation.contract.family.states;
  const objects = states.map((state) => createKpSemanticAssetObject({
    id: state.id,
    objectType: "equation",
    title: state.kind === "log-of-product"
      ? "Frozen logarithm of a product"
      : "Live sum of logarithms",
    value: Object.freeze({ latex: state.latex, stateKind: state.kind }),
    selectors: listKpLogProductExpressionNodes(state).map((node) => ({
      id: node.id,
      kind: node.kind,
      label: node.semanticId,
      metadata: { semanticId: node.semanticId, representation: "native-katex" }
    })),
    metadata: {
      latex: state.latex,
      semanticStateId: state.id,
      stateRetentionPolicy: frame.projection.policy
    }
  }));
  const relation = createKpSemanticAssetObject({
    id: "state.log-product-equivalence.relation",
    objectType: "equation",
    title: "Equality relation",
    value: Object.freeze({ latex: frame.relationLatex }),
    selectors: [{
      id: "selector.log-product-equivalence.relation",
      kind: "operator",
      label: "equals relation"
    }],
    metadata: { stateRetentionPolicy: frame.projection.policy }
  });
  const projection = createKpSemanticAssetObject({
    id: frame.projection.id,
    objectType: "state-retention-projection",
    title: "Logarithm product equivalence topology",
    value: frame.projection,
    metadata: {
      stateRetentionPolicy: frame.projection.policy,
      semanticTransitionId: frame.projection.semanticTransitionId
    }
  });
  const transformation = operation.transformation;
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
  const timelineId = "timeline.log-product.equivalence-frame";
  const renderTargetId = "render.log-product.equivalence-frame.equation";
  return createKpAnimationAsset({
    id: KP_LOG_PRODUCT_EQUIVALENCE_FRAME_ANIMATION_ID,
    title: "Keep the logarithm product law as an equivalence",
    bundle: createKpAssetBundle({
      id: "asset.log-product.equivalence-frame",
      title: "Persistent logarithm product equivalence",
      objects: [...objects, relation, projection]
    }),
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({ root }),
    timeline: {
      id: timelineId,
      durationMs: KP_LOG_PRODUCT_EQUIVALENCE_DURATION_MS,
      beatCount: KP_LOG_PRODUCT_EQUIVALENCE_BEAT_COUNT,
      markerIds: [transformation.id]
    },
    layout: { id: "layout.log-product.equivalence-frame", kind: "single",
      targetId: renderTargetId },
    renderTargets: [{
      id: renderTargetId,
      kind: "equation",
      objectIds: [...objects.map(({ id }) => id), relation.id],
      selectorIds: [
        ...objects.flatMap(({ selectors }) => selectors.map(({ id }) => id)),
        ...relation.selectors.map(({ id }) => id)
      ],
      transformationIds: [transformation.id],
      timelineId,
      summary:
        "Freeze one source occurrence, introduce equality, and construct a distinct live target occurrence through the approved log-product transition."
    }],
    checks: [{
      id: "check.log-product.equivalence-frame.projection",
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: frame.projection.id
    }, {
      id: "check.log-product.equivalence-frame.seek-rewind",
      lawId: "animation.seek-rewind",
      level: "strict",
      targetId: root.id
    }],
    exportTargets: [{
      id: "export.log-product.equivalence-frame.frames",
      kind: "frame-sequence",
      artifactId: "artifact.log-product.equivalence-frame.frames"
    }],
    dashboard: {
      rowId: "animation-algebra-log-product-equivalence-frame",
      tags: ["algebra", "animation", "equation", "equivalence", "katex",
        "logarithm", "persistent-state"],
      sourceRefIds: ["law.logarithm.product", frame.projection.id]
    },
    presentationProfile:
      createKpCanonicalBalancedSolveEquationPresentationProfileV1(),
    metadata: {
      sourceFamilyId: "family.algebra.log-exponent",
      stateRetentionProjectionId: frame.projection.id,
      reusedOperationId: frame.operationId,
      summary:
        "The approved log-product operation projected as a persistent equivalence frame."
    }
  });
}
