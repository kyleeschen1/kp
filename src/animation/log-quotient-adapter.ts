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
  kpCanonicalLogQuotientStates,
  listKpLogQuotientExpressionNodes,
  type KpLogQuotientExpressionNode
} from "../semantic/log-quotient-states.ts";
import {
  kpCanonicalCompiledLogQuotientOperation
} from "../semantic/log-quotient-transformation-compiler.ts";

export const kpLogQuotientAnimationId =
  "animation.algebra.log-quotient.difference-to-quotient";

export function createKpLogQuotientAnimationAsset(): KpAnimationAsset {
  const objects = kpCanonicalLogQuotientStates.map((state) => {
    return createKpSemanticAssetObject({
      id: state.id,
      objectType: "equation",
      title: state.kind === "log-difference"
        ? "Difference of logarithms"
        : "Logarithm of a quotient",
      value: Object.freeze({
        latex: state.latex,
        stateKind: state.kind
      }),
      selectors: listKpLogQuotientExpressionNodes(state).map((node) => ({
        id: node.id,
        kind: node.kind === "fraction-bar" ? "artifact" : node.kind,
        label: labelForNode(node),
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
    });
  });
  const transformation =
    kpCanonicalCompiledLogQuotientOperation.transformation;
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
  const timelineId = `timeline.${kpLogQuotientAnimationId}`;
  const renderTargetId = "render.log-quotient.difference-to-quotient.equation";

  return createKpAnimationAsset({
    id: kpLogQuotientAnimationId,
    title: "Combine a difference of logarithms",
    bundle: createKpAssetBundle({
      id: "asset.log-quotient.difference-to-quotient",
      title: "Natural-log quotient law",
      objects
    }),
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({ root }),
    timeline: {
      id: timelineId,
      durationMs: 4_800,
      beatCount: 96,
      markerIds: [transformation.id]
    },
    layout: {
      id: "layout.log-quotient.difference-to-quotient",
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
        "Fuse both logarithm operators while x and y move into quotient roles."
    }],
    checks: [{
      id: "check.log-quotient.reference-closure",
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: kpLogQuotientAnimationId
    }, {
      id: "check.log-quotient.seek-rewind",
      lawId: "animation.seek-rewind",
      level: "strict",
      targetId: root.id
    }],
    exportTargets: [{
      id: "export.log-quotient.frames",
      kind: "frame-sequence",
      artifactId: "artifact.log-quotient.difference-to-quotient.frames"
    }],
    dashboard: {
      rowId: "animation-algebra-log-quotient-difference-to-quotient",
      tags: [
        "algebra",
        "animation",
        "equation",
        "katex",
        "logarithm",
        "quotient"
      ],
      sourceRefIds: ["law.logarithm.quotient"]
    },
    presentationProfile:
      createKpCanonicalBalancedSolveEquationPresentationProfileV1(),
    metadata: {
      sourceFamilyId: "family.algebra.log-exponent",
      settledEndpointAuthority: "native-katex",
      summary:
        "A typed native-KaTeX pressure caller for the logarithm quotient law."
    }
  });
}

function labelForNode(node: KpLogQuotientExpressionNode): string {
  switch (node.kind) {
    case "symbol":
      return node.name;
    case "function-operator":
      return "\\ln";
    case "delimiter":
      return node.value;
    case "subtraction-operator":
      return node.value;
    case "fraction-bar":
      return "structural:frac-line";
    case "natural-log":
      return "natural-log-wrapper";
    case "difference":
      return "log-difference";
    case "quotient":
      return "quotient";
  }
}
