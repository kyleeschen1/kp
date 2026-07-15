import { createKpAnimationAsset, type KpAnimationAsset } from "./asset.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../semantic/asset.ts";
import { createKpSemanticTransformation } from "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import { createAxis2DObject, createGraph2DObject } from "../semantic/graph.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../semantic/transformation-composition.ts";

export const integralAreaSweepAnimationId =
  "animation.integral-ftc.area-sweep";

const graphId = "graph.integral-ftc.area-sweep";
const curveId = "curve.integral-ftc.quadratic";
const expressionId = "expression.integral-ftc.accumulation";
const sourceStateId = "area-state.integral-ftc.start";
const targetStateId = "area-state.integral-ftc.end";
const transformationId = "transform.integral-ftc.sweep-upper-bound";
const timelineId = "timeline.integral-ftc.area-sweep";
const renderTargetId = "render.integral-ftc.area-sweep";

export interface IntegralAreaSweepState {
  readonly lowerBound: number;
  readonly upperBound: number;
  readonly accumulatedArea: number;
  readonly integrandAtUpperBound: number;
}

export function createIntegralAreaSweepAnimationAsset(): KpAnimationAsset {
  const graph = createGraph2DObject({
    id: graphId,
    label: "Accumulated area under t squared",
    xAxisId: `${graphId}.x-axis`,
    yAxisId: `${graphId}.y-axis`,
    xDomain: [-0.5, 3.5],
    yDomain: [-1, 10],
    width: 560,
    height: 380
  });
  const xAxis = createAxis2DObject({
    id: graph.xAxisId,
    graphId,
    label: "t",
    orientation: "x",
    domain: graph.xDomain,
    tickStep: 0.5
  });
  const yAxis = createAxis2DObject({
    id: graph.yAxisId,
    graphId,
    label: "f(t)",
    orientation: "y",
    domain: graph.yDomain,
    tickStep: 1
  });
  const curve = createKpSemanticAssetObject({
    id: curveId,
    objectType: "curve-2d",
    title: "f(t) = t squared",
    value: {
      id: curveId,
      type: "curve-2d",
      graphId,
      equation: "y = t^2",
      xDomain: [0, 3],
      sampleCount: 121
    },
    selectors: [
      { id: `${curveId}.body`, kind: "curve", label: "f(t) = t²" }
    ]
  });
  const expression = createKpSemanticAssetObject({
    id: expressionId,
    objectType: "integral-expression",
    title: "Accumulation function",
    value: { latex: "A(x)=\\int_0^x t^2\\,dt" },
    selectors: [
      { id: `${expressionId}.integrand`, kind: "integrand", label: "t²" },
      { id: `${expressionId}.lower-bound`, kind: "bound", label: "0" },
      { id: `${expressionId}.upper-bound`, kind: "bound", label: "x" }
    ],
    metadata: { latex: "A(x)=\\int_0^x t^2\\,dt" }
  });
  const sourceState = areaStateObject(
    sourceStateId,
    "Area at upper bound 0",
    areaSweepStateAt(0),
    "source"
  );
  const targetState = areaStateObject(
    targetStateId,
    "Area at upper bound 3",
    areaSweepStateAt(3),
    "target"
  );
  const transformation = createKpSemanticTransformation({
    id: transformationId,
    definitionId:
      "definition.symbolic.calculus.accumulation-derivative-ftc",
    transformType: "accumulationDerivativeFtc",
    title: "Sweep the upper bound and accumulate area",
    sourceObjectIds: [curve.id, expression.id, sourceState.id],
    targetObjectIds: [curve.id, expression.id, targetState.id],
    preserves: ["identity", "value", "role"],
    correspondence: [
      {
        sourceSelectorId: `${curveId}.body`,
        targetSelectorId: `${curveId}.body`,
        preserves: ["identity", "value", "presentation"]
      },
      {
        sourceSelectorId: `${sourceStateId}.upper-bound`,
        targetSelectorId: `${targetStateId}.upper-bound`,
        preserves: ["role"]
      },
      {
        sourceSelectorId: `${sourceStateId}.area-region`,
        targetSelectorId: `${targetStateId}.area-region`,
        preserves: ["role"]
      }
    ],
    assumptions: ["The integrand t squared is continuous on [0, 3]."],
    lawRefs: [
      {
        id: "law.graph.integral-area-accumulation",
        level: "sampled",
        summary: "The swept area equals x cubed divided by three."
      },
      {
        id: "law.graph.integral-area-sweep-provenance",
        level: "sampled",
        summary: "The moving graph bound retains the integral upper-bound role."
      }
    ]
  });
  const treeRoot = createSemanticTransformationLeaf(
    createSemanticTransformationRef({
      id: transformation.id,
      kind: transformation.transformType,
      sourceObjectIds: transformation.sourceObjectIds,
      targetObjectIds: transformation.targetObjectIds,
      preserves: transformation.preserves,
      summary: transformation.title
    })
  );
  const objects = [
    semanticObject(graph),
    semanticObject(xAxis),
    semanticObject(yAxis),
    curve,
    expression,
    sourceState,
    targetState
  ];

  return createKpAnimationAsset({
    id: integralAreaSweepAnimationId,
    title: "Integral area sweep",
    bundle: createKpAssetBundle({
      id: "asset.integral-ftc.area-sweep",
      title: "Integral area-sweep assets",
      objects
    }),
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({
      root: treeRoot,
      annotations: [
        {
          id: "focus.integral-ftc.area-sweep.region",
          kind: "focus",
          targetNodeId: transformation.id,
          placement: "during",
          selectorIds: [
            `${sourceStateId}.upper-bound`,
            `${targetStateId}.upper-bound`,
            `${sourceStateId}.area-region`,
            `${targetStateId}.area-region`
          ]
        }
      ]
    }),
    timeline: { id: timelineId, durationMs: 2400, beatCount: 50 },
    layout: {
      id: "layout.integral-ftc.area-sweep",
      kind: "single",
      targetId: renderTargetId
    },
    renderTargets: [
      {
        id: renderTargetId,
        kind: "graph",
        objectIds: objects.map((object) => object.id),
        selectorIds: objects.flatMap((object) =>
          object.selectors.map((selector) => selector.id)
        ),
        transformationIds: [transformation.id],
        timelineId,
        summary:
          "Sweeps the upper bound across t squared while filling accumulated area.",
        metadata: {
          graphMotionKind: "integral-area-sweep",
          graphId,
          curveId,
          expressionId,
          sourceStateId,
          targetStateId
        }
      }
    ],
    checks: [
      {
        id: "check.integral-ftc.area-sweep.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: integralAreaSweepAnimationId
      },
      {
        id: "check.integral-ftc.area-sweep.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: transformation.id
      },
      {
        id: "check.integral-ftc.area-sweep.accumulation",
        lawId: "law.graph.integral-area-accumulation",
        level: "sampled",
        targetId: transformation.id
      }
    ],
    exportTargets: [
      {
        id: "export.integral-ftc.area-sweep.frames",
        kind: "frame-sequence",
        artifactId: "artifact.integral-ftc.area-sweep.frames"
      }
    ],
    dashboard: {
      rowId: "animation-integral-ftc-area-sweep",
      tags: ["animation", "graph", "calculus", "integral", "area-sweep"],
      sampleTargetIds: [renderTargetId],
      sourceRefIds: [
        "family.calculus.integral-ftc",
        "law.graph.integral-area-accumulation"
      ]
    },
    metadata: {
      domain: "calculus",
      graphMotionKind: "integral-area-sweep",
      summary:
        "Sweeps a provenance-preserving upper bound while accumulating the exact area under t squared."
    }
  });
}

export function areaSweepStateAt(upperBound: number): IntegralAreaSweepState {
  return {
    lowerBound: 0,
    upperBound,
    accumulatedArea: upperBound ** 3 / 3,
    integrandAtUpperBound: upperBound ** 2
  };
}

function areaStateObject(
  id: string,
  title: string,
  state: IntegralAreaSweepState,
  role: "source" | "target"
) {
  return createKpSemanticAssetObject({
    id,
    objectType: "integral-area-state",
    title,
    value: state,
    selectors: [
      { id: `${id}.upper-bound`, kind: "bound", label: `${role} upper bound` },
      { id: `${id}.area-region`, kind: "area", label: `${role} area region` },
      { id: `${id}.height`, kind: "integrand-value", label: String(state.integrandAtUpperBound) }
    ]
  });
}

function semanticObject(object: {
  readonly id: string;
  readonly type: string;
  readonly label: string;
}) {
  return createKpSemanticAssetObject({
    id: object.id,
    objectType: object.type,
    title: object.label,
    value: object
  });
}
