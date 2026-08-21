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
  listKpLogProductExpressionNodes
} from "../semantic/log-product-states.ts";
import {
  kpCanonicalCompiledLogProductOperation,
  kpLogProductCompiledOperations,
  type KpCompiledLogProductOperation
} from "../semantic/log-product-transformation-compiler.ts";
import { createKpLogProductEquivalenceFrameAnimationAsset } from
  "./log-product-equivalence-frame-adapter.ts";
export {
  kpLogProductAnimationId,
  kpLogProductAnimationIds,
  kpMultiFactorLogProductAnimationId
} from "../semantic/log-product-ids.ts";

const KP_LOG_PRODUCT_TIMELINE_DURATION_MS = 4_800;
const KP_LOG_PRODUCT_TIMELINE_BEAT_COUNT = 96;

export function createKpLogProductAnimationAsset(
  operation: KpCompiledLogProductOperation = kpCanonicalCompiledLogProductOperation
): KpAnimationAsset {
  const { contract } = operation;
  const { animationId } = contract;
  const factorKey = contract.family.factors.map(({ name }) => name).join("");
  const objects = contract.family.states.map((state) =>
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
  const timelineId = `timeline.${animationId}`;
  const renderTargetId = `render.log-product.${factorKey}-to-sum.equation`;

  return createKpAnimationAsset({
    id: animationId,
    title: contract.family.factors.length === 2
      ? "Expand a logarithm of a product"
      : "Expand a logarithm of multiple factors",
    bundle: createKpAssetBundle({
      id: `asset.log-product.${factorKey}-to-sum`,
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
      id: `layout.log-product.${factorKey}-to-sum`,
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
        `Fission one logarithm into ${contract.family.factors.length} applications ` +
        "while every ordered factor keeps identity."
    }],
    checks: [{
      id: `check.log-product.${factorKey}.reference-closure`,
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: animationId
    }, {
      id: `check.log-product.${factorKey}.seek-rewind`,
      lawId: "animation.seek-rewind",
      level: "strict",
      targetId: root.id
    }],
    exportTargets: [{
      id: `export.log-product.${factorKey}.frames`,
      kind: "frame-sequence",
      artifactId: `artifact.log-product.${factorKey}-to-sum.frames`
    }],
    dashboard: {
      rowId: `animation-algebra-log-product-${factorKey}-to-sum`,
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

export function createKpLogProductAnimationAssets(): readonly KpAnimationAsset[] {
  return Object.freeze([
    ...kpLogProductCompiledOperations.map(createKpLogProductAnimationAsset),
    createKpLogProductEquivalenceFrameAnimationAsset()
  ]);
}
