import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  applyKpAnimationRepresentationTransform,
  createKpAnimationRepresentationTransform,
  type KpAnimationRepresentationTransform,
  type KpAnimationRepresentationTransformResult
} from "./representation-transform.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type KpAssetMetadataValue
} from "../semantic/asset.ts";
import {
  createKpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import {
  createGraphSceneFromLatexEquation
} from "../semantic/equation-graph.ts";
import {
  createSemanticTransformationRef
} from "../semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../semantic/transformation-composition.ts";

export interface EquationToGraphRepresentationSample {
  readonly sourceAnimation: KpAnimationAsset;
  readonly transform: KpAnimationRepresentationTransform;
  readonly result: KpAnimationRepresentationTransformResult;
  readonly graphSceneObjectIds: readonly string[];
}

const equationToGraphLatex = "y = x^2";
const equationToGraphScenePrefix = "representation.parabola";
const equationToGraphAnimationId = "animation.representation.equation-parabola";
const equationToGraphObjectId = "equation.representation.parabola";
const equationToGraphSelectorId = "equation.representation.parabola.full";
const equationToGraphTransformationId =
  "transform.representation.parabola.identity-view";
const equationToGraphRenderTargetId = "render.representation.parabola";

export function createEquationToGraphRepresentationSample():
  EquationToGraphRepresentationSample {
  const sourceAnimation = createEquationGraphRepresentationSourceAnimation();
  const transform = createEquationToGraphRepresentationTransform();
  const result = applyKpAnimationRepresentationTransform(
    transform,
    sourceAnimation
  );

  return {
    sourceAnimation,
    transform,
    result,
    graphSceneObjectIds: splitMetadataIds(
      result.targetAnimation.renderTargets[0]?.metadata?.["graphSceneObjectIds"]
    )
  };
}

export function createEquationGraphRepresentationSourceAnimation():
  KpAnimationAsset {
  const equation = createKpSemanticAssetObject({
    id: equationToGraphObjectId,
    objectType: "equation",
    title: "Parabola equation",
    value: { latex: equationToGraphLatex },
    selectors: [
      {
        id: equationToGraphSelectorId,
        kind: "equation",
        label: equationToGraphLatex
      }
    ],
    metadata: {
      latex: equationToGraphLatex,
      representation: "equation"
    }
  });
  const transformation = createKpSemanticTransformation({
    id: equationToGraphTransformationId,
    transformType: "holdEquationRepresentation",
    title: "Hold equation representation",
    sourceObjectIds: [equation.id],
    targetObjectIds: [equation.id],
    preserves: ["identity", "value", "presentation"],
    correspondence: [
      {
        sourceSelectorId: equationToGraphSelectorId,
        targetSelectorId: equationToGraphSelectorId,
        preserves: ["identity", "value", "presentation"]
      }
    ],
    lawRefs: [
      {
        id: "law.equation.same-expression-view",
        level: "strict"
      }
    ]
  });

  return createKpAnimationAsset({
    id: equationToGraphAnimationId,
    title: "Parabola equation representation",
    bundle: createKpAssetBundle({
      id: "asset.representation.equation-parabola",
      title: "Parabola equation representation assets",
      objects: [equation]
    }),
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({
      root: createSemanticTransformationLeaf(
        createSemanticTransformationRef({
          id: transformation.id,
          kind: transformation.transformType,
          sourceObjectIds: transformation.sourceObjectIds,
          targetObjectIds: transformation.targetObjectIds,
          preserves: transformation.preserves,
          summary: transformation.title
        })
      )
    }),
    timeline: {
      id: "timeline.representation.equation-parabola",
      durationMs: 1200,
      beatCount: 12
    },
    layout: {
      id: "layout.representation.equation-parabola",
      kind: "single",
      targetId: equationToGraphRenderTargetId
    },
    renderTargets: [
      {
        id: equationToGraphRenderTargetId,
        kind: "equation",
        objectIds: [equation.id],
        selectorIds: [equationToGraphSelectorId],
        transformationIds: [transformation.id],
        timelineId: "timeline.representation.equation-parabola",
        summary: "Source equation representation target.",
        metadata: {
          representation: "equation",
          sourceLatex: equationToGraphLatex
        }
      }
    ],
    checks: [
      {
        id: "check.representation.equation-parabola.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: equationToGraphAnimationId
      },
      {
        id: "check.representation.equation-parabola.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: equationToGraphTransformationId
      }
    ],
    exportTargets: [],
    metadata: {
      representation: "equation",
      sourceLatex: equationToGraphLatex,
      graphSceneIdPrefix: equationToGraphScenePrefix
    }
  });
}

export function createEquationToGraphRepresentationTransform():
  KpAnimationRepresentationTransform {
  return createKpAnimationRepresentationTransform({
    id: "representation.equation-to-graph.explicit-2d",
    title: "Equation to graph representation",
    sourceRepresentation: "equation",
    targetRepresentation: "graph",
    preservation: "strict",
    apply: (animation) => {
      const latex =
        metadataString(animation.metadata?.["sourceLatex"]) ??
        equationToGraphLatex;
      const scenePrefix =
        metadataString(animation.metadata?.["graphSceneIdPrefix"]) ??
        equationToGraphScenePrefix;
      const scene = createGraphSceneFromLatexEquation({
        idPrefix: scenePrefix,
        latex
      });
      const sceneObjectIds = scene.map((object) => object.id);
      const graphObject = scene.find((object) =>
        object.type === "graph-2d" || object.type === "graph-3d"
      );
      const primaryObject = scene.find((object) =>
        object.type === "curve-2d" || object.type === "surface-3d"
      );

      return createKpAnimationAsset({
        ...animation,
        renderTargets: animation.renderTargets.map((target) => ({
          ...target,
          kind: "graph" as const,
          summary:
            "Derived graph representation target with exact equation provenance.",
          metadata: {
            ...(target.metadata ?? {}),
            representation: "graph",
            sourceRepresentation: "equation",
            targetRepresentation: "graph",
            sourceLatex: latex,
            graphDerivationCapability: "equation.graph2d",
            graphDerivationStatus: "exact",
            graphSceneObjectIds: sceneObjectIds.join(" "),
            graphObjectId: graphObject?.id ?? "",
            graphPrimaryObjectId: primaryObject?.id ?? ""
          }
        })),
        metadata: {
          ...(animation.metadata ?? {}),
          representation: "graph",
          sourceRepresentation: "equation",
          targetRepresentation: "graph",
          sourceLatex: latex,
          graphDerivationCapability: "equation.graph2d",
          graphDerivationStatus: "exact"
        }
      });
    }
  });
}

function metadataString(
  value: KpAssetMetadataValue | undefined
): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function splitMetadataIds(
  value: KpAssetMetadataValue | undefined
): readonly string[] {
  return typeof value === "string"
    ? value.split(/\s+/).filter((part) => part.length > 0)
    : [];
}
