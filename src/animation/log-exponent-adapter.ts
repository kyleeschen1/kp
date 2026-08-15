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
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";
import {
  kpCanonicalLogExponentSolveStates,
  listKpLogExponentExpressionNodes,
  renderKpLogExponentExpressionNodeLatex
} from "../semantic/log-exponent-solve-states.ts";
import {
  kpCanonicalLogExponentTransformationTree
} from "../semantic/log-exponent-transformation-tree.ts";
import {
  kpCanonicalLogExponentSequenceTimeline
} from "./log-exponent-timeline.ts";

export const kpLogExponentAnimationId =
  "animation.algebra.log-exponent.solve-two-power-x";

export function createKpLogExponentAnimationAsset(): KpAnimationAsset {
  const objects = kpCanonicalLogExponentSolveStates.map((state) =>
    createKpSemanticAssetObject({
      id: state.id,
      objectType: "equation",
      title: titleForState(state.kind),
      value: Object.freeze({
        latex: state.latex,
        stateKind: state.kind
      }),
      selectors: listKpLogExponentExpressionNodes(state).map((node) => ({
        id: node.id,
        kind: node.kind,
        label: renderKpLogExponentExpressionNodeLatex(node),
        metadata: {
          semanticId: node.semanticId,
          representation: "native-katex"
        }
      })),
      metadata: {
        latex: state.latex,
        semanticStateId: state.id
      }
    })
  );
  const operations = kpCanonicalLogExponentTransformationTree.operations;
  const transformations = operations.map(({ transformation }) => transformation);
  const root = createSemanticTransformationSequence({
    id: "sequence.log-exponent.solve-two-power-x",
    label: "Solve two to the x equals seven with logarithms",
    children: transformations.map((transformation) =>
      createSemanticTransformationLeaf(
        createSemanticTransformationRef({
          id: transformation.id,
          kind: transformation.transformType,
          sourceObjectIds: transformation.sourceObjectIds,
          targetObjectIds: transformation.targetObjectIds,
          preserves: transformation.preserves,
          summary: transformation.title
        })
      )
    )
  });
  const timelineId = kpCanonicalLogExponentSequenceTimeline.id;
  const renderTargetId = "render.log-exponent.solve-two-power-x.equation";

  return createKpAnimationAsset({
    id: kpLogExponentAnimationId,
    title: "Solve an exponential equation with logarithms",
    bundle: createKpAssetBundle({
      id: "asset.log-exponent.solve-two-power-x",
      title: "Logarithmic solution of two to the x equals seven",
      objects
    }),
    transformations,
    transformationTree: createEditableSemanticTransformationTree({ root }),
    timeline: {
      id: timelineId,
      durationMs: 8_400,
      beatCount: 168,
      markerIds: kpCanonicalLogExponentSequenceTimeline.windows.map(
        ({ operationId }) => operationId
      )
    },
    layout: {
      id: "layout.log-exponent.solve-two-power-x",
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
      transformationIds: transformations.map(({ id }) => id),
      timelineId,
      summary:
        "Apply logarithms, extract the exponent, and isolate x while preserving semantic identity."
    }],
    checks: [{
      id: "check.log-exponent.reference-closure",
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: kpLogExponentAnimationId
    }, {
      id: "check.log-exponent.seek-rewind",
      lawId: "animation.seek-rewind",
      level: "strict",
      targetId: root.id
    }],
    exportTargets: [{
      id: "export.log-exponent.frames",
      kind: "frame-sequence",
      artifactId: "artifact.log-exponent.solve-two-power-x.frames"
    }],
    dashboard: {
      rowId: "animation-algebra-log-exponent-solve-two-power-x",
      tags: [
        "algebra",
        "animation",
        "equation",
        "exponent",
        "katex",
        "logarithm"
      ],
      sourceRefIds: [
        "law.logarithm.power",
        "law.equation.apply-injective-function",
        "law.equation.divide-both-sides"
      ]
    },
    presentationProfile:
      createKpCanonicalBalancedSolveEquationPresentationProfileV1(),
    metadata: {
      sourceFamilyId: "family.algebra.log-exponent",
      sequenceTimelineId: timelineId,
      settledEndpointAuthority: "native-katex",
      summary:
        "A typed native-KaTeX operation sequence for solving 2^x = 7."
    }
  });
}

function titleForState(
  kind: (typeof kpCanonicalLogExponentSolveStates)[number]["kind"]
): string {
  switch (kind) {
    case "source-equation":
      return "Exponential equation";
    case "logged-both-sides":
      return "Natural logarithm applied to both sides";
    case "exponent-extracted":
      return "Exponent extracted by the logarithm power law";
    case "solved-equation":
      return "Unknown isolated";
  }
}
