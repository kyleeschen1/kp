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
  labelKpLogProductExpressionNode
} from "../semantic/log-product-expression-protocol.ts";
import {
  kpCanonicalLogProductStates,
  listKpLogProductExpressionNodes
} from "../semantic/log-product-states.ts";
import {
  kpCanonicalCompiledLogProductOperation
} from "../semantic/log-product-transformation-compiler.ts";
export {
  kpLogProductAnimationId
} from "../semantic/log-product-ids.ts";
import {
  kpLogProductAnimationId
} from "../semantic/log-product-ids.ts";

const KP_LOG_PRODUCT_TIMELINE_DURATION_MS = 4_800;
const KP_LOG_PRODUCT_TIMELINE_BEAT_COUNT = 96;

export function createKpLogProductAnimationAsset(): KpAnimationAsset {
  const objects = kpCanonicalLogProductStates.map((state) =>
    createKpSemanticAssetObject({
      id: state.id,
      objectType: "equation",
      title: state.kind === "log-of-product"
        ? "Logarithm of a product"
        : "Sum of logarithms",
      value: Object.freeze({
        latex: state.latex,
        stateKind: state.kind
      }),
      selectors: listKpLogProductExpressionNodes(state).map((node) => ({
        id: node.id,
        kind: node.kind,
        label: labelKpLogProductExpressionNode(node),
        metadata: {
          semanticId: node.semanticId,
          representation: "native-katex"
        }
      })),
      metadata: {
        latex: state.latex,
        semanticStateId: state.id,
        settledEndpointAuthority: "native-katex"
      }
    })
  );
  const transformation = kpCanonicalCompiledLogProductOperation.transformation;
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
  const timelineId = `timeline.${kpLogProductAnimationId}`;
  const renderTargetId = "render.log-product.product-to-sum.equation";

  return createKpAnimationAsset({
    id: kpLogProductAnimationId,
    title: "Expand a logarithm of a product",
    bundle: createKpAssetBundle({
      id: "asset.log-product.product-to-sum",
      title: "Natural-log product law",
      objects
    }),
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({ root }),
    timeline: {
      id: timelineId,
      durationMs: KP_LOG_PRODUCT_TIMELINE_DURATION_MS,
      beatCount: KP_LOG_PRODUCT_TIMELINE_BEAT_COUNT,
      markerIds: [transformation.id]
    },
    layout: {
      id: "layout.log-product.product-to-sum",
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
      summary:
        "Fission one logarithm application while x and y keep identity in ordered target applications."
    }],
    checks: [{
      id: "check.log-product.reference-closure",
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: kpLogProductAnimationId
    }, {
      id: "check.log-product.seek-rewind",
      lawId: "animation.seek-rewind",
      level: "strict",
      targetId: root.id
    }],
    exportTargets: [{
      id: "export.log-product.frames",
      kind: "frame-sequence",
      artifactId: "artifact.log-product.product-to-sum.frames"
    }],
    dashboard: {
      rowId: "animation-algebra-log-product-product-to-sum",
      tags: [
        "algebra",
        "animation",
        "equation",
        "katex",
        "logarithm",
        "product"
      ],
      sourceRefIds: ["law.logarithm.product"]
    },
    presentationProfile:
      createKpCanonicalBalancedSolveEquationPresentationProfileV1(),
    metadata: {
      sourceFamilyId: "family.algebra.log-exponent",
      settledEndpointAuthority: "native-katex",
      summary:
        "A typed native-KaTeX exemplar for logarithm application fission."
    }
  });
}
