import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../semantic/asset.ts";
import { createKpSemanticTransformation } from "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createAxis2DObject,
  createGraph2DObject
} from "../semantic/graph.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationParallel
} from "../semantic/transformation-composition.ts";

export const derivativeTangentAnimationId =
  "animation.derivative-rules.tangent-graph";

const timelineId = "timeline.derivative-rules.tangent-graph";
const renderTargetId = "render.derivative-rules.tangent-graph";
const graphId = "graph.derivative-rules.x-cubed";
const curveId = "curve.derivative-rules.x-cubed";
const sourceExpressionId = "expression.derivative-rules.x-cubed.source";
const targetExpressionId = "expression.derivative-rules.x-cubed.derivative";
const sourceStateId = "tangent-state.derivative-rules.x-cubed.start";
const targetStateId = "tangent-state.derivative-rules.x-cubed.end";
const powerRuleTransformationId =
  "transform.derivative-rules.tangent-graph.apply-power-rule";
const tangentTransformationId =
  "transform.derivative-rules.tangent-graph.move-tangent";

export interface DerivativeTangentState {
  readonly x: number;
  readonly y: number;
  readonly slope: number;
  readonly intercept: number;
}

export function createDerivativeTangentAnimationAsset(): KpAnimationAsset {
  const graph = createGraph2DObject({
    id: graphId,
    label: "Derivative tangent plane",
    xAxisId: `${graphId}.x-axis`,
    yAxisId: `${graphId}.y-axis`,
    xDomain: [-2, 3],
    yDomain: [-5, 10],
    width: 560,
    height: 380
  });
  const xAxis = createAxis2DObject({
    id: graph.xAxisId,
    graphId,
    label: "x",
    orientation: "x",
    domain: graph.xDomain,
    tickStep: 1
  });
  const yAxis = createAxis2DObject({
    id: graph.yAxisId,
    graphId,
    label: "y",
    orientation: "y",
    domain: graph.yDomain,
    tickStep: 2
  });
  const curve = {
    id: curveId,
    type: "curve-2d" as const,
    graphId,
    label: "f(x) = x^3",
    equation: "y = x^3",
    derivativeLatex: "f'(x) = 3x^2",
    xDomain: graph.xDomain,
    sampleCount: 121
  };
  const sourceExpression = expressionObject({
    id: sourceExpressionId,
    title: "Derivative of x cubed",
    latex: "\\frac{d}{dx}x^3",
    selectors: [
      ["operator", "derivative-operator", "d/dx"],
      ["base", "variable", "x"],
      ["exponent", "exponent", "3"]
    ]
  });
  const targetExpression = expressionObject({
    id: targetExpressionId,
    title: "Power-rule derivative",
    latex: "3x^2",
    selectors: [
      ["coefficient", "coefficient", "3"],
      ["base", "variable", "x"],
      ["exponent", "exponent", "2"]
    ]
  });
  const sourceState = tangentStateObject(
    sourceStateId,
    "Tangent at x = 0",
    tangentStateAt(0),
    "source"
  );
  const targetState = tangentStateObject(
    targetStateId,
    "Tangent at x = 2",
    tangentStateAt(2),
    "target"
  );
  const powerRuleTransformation = createKpSemanticTransformation({
    id: powerRuleTransformationId,
    definitionId: "definition.symbolic.calculus.derivative-power-rule",
    transformType: "derivativePowerRule",
    title: "Drop the exponent into coefficient position",
    sourceObjectIds: [sourceExpression.id],
    targetObjectIds: [targetExpression.id],
    preserves: ["value", "structure"],
    correspondence: [
      {
        sourceSelectorId: `${sourceExpressionId}.base`,
        targetSelectorId: `${targetExpressionId}.base`,
        preserves: ["identity", "role"]
      },
      {
        sourceSelectorId: `${sourceExpressionId}.exponent`,
        targetSelectorId: `${targetExpressionId}.coefficient`,
        preserves: ["value", "role"]
      }
    ],
    lawRefs: [
      {
        id: "law.calculus.derivative.power-rule",
        level: "strict"
      }
    ]
  });
  const tangentTransformation = createKpSemanticTransformation({
    id: tangentTransformationId,
    definitionId: "definition.graph.derivative.tangent-motion",
    transformType: "moveDerivativeTangent",
    title: "Move the tangent using the derivative slope",
    sourceObjectIds: [curveId, targetExpressionId, sourceStateId],
    targetObjectIds: [curveId, targetExpressionId, targetStateId],
    preserves: ["identity", "value", "role"],
    correspondence: [
      {
        sourceSelectorId: `${curveId}.body`,
        targetSelectorId: `${curveId}.body`,
        preserves: ["identity", "value", "presentation"]
      },
      {
        sourceSelectorId: `${sourceStateId}.point`,
        targetSelectorId: `${targetStateId}.point`,
        preserves: ["role"]
      },
      {
        sourceSelectorId: `${sourceStateId}.tangent`,
        targetSelectorId: `${targetStateId}.tangent`,
        preserves: ["role"]
      }
    ],
    lawRefs: [
      {
        id: "law.graph.derivative-tangent-slope",
        level: "sampled",
        summary: "The tangent slope equals 3x squared at every sampled point."
      }
    ]
  });
  const treeRoot = createSemanticTransformationParallel({
    id: "diagram.derivative-rules.tangent-graph.synchronized",
    label: "Synchronized derivative and tangent motion",
    children: [powerRuleTransformation, tangentTransformation].map(
      (transformation) =>
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
    ),
    summary:
      "The symbolic power rule and graph tangent consume the same animation clock."
  });
  const objects = [
    graphObject(graph),
    graphObject(xAxis),
    graphObject(yAxis),
    createKpSemanticAssetObject({
      id: curve.id,
      objectType: curve.type,
      title: curve.label,
      value: curve,
      selectors: [
        {
          id: `${curveId}.body`,
          kind: "curve",
          label: curve.label
        }
      ]
    }),
    sourceExpression,
    targetExpression,
    sourceState,
    targetState
  ];

  return createKpAnimationAsset({
    id: derivativeTangentAnimationId,
    title: "Power rule with synchronized tangent",
    bundle: createKpAssetBundle({
      id: "asset.derivative-rules.tangent-graph",
      title: "Derivative tangent graph assets",
      objects
    }),
    transformations: [powerRuleTransformation, tangentTransformation],
    transformationTree: createEditableSemanticTransformationTree({
      root: treeRoot,
      annotations: [
        {
          id: "focus.derivative-rules.tangent-graph.point",
          kind: "focus",
          targetNodeId: tangentTransformation.id,
          placement: "during",
          selectorIds: [
            `${sourceStateId}.point`,
            `${targetStateId}.point`,
            `${sourceStateId}.tangent`,
            `${targetStateId}.tangent`
          ]
        }
      ]
    }),
    timeline: {
      id: timelineId,
      durationMs: 2400,
      beatCount: 50
    },
    layout: {
      id: "layout.derivative-rules.tangent-graph",
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
        transformationIds: [
          powerRuleTransformation.id,
          tangentTransformation.id
        ],
        timelineId,
        summary:
          "Moves a point and tangent line along x cubed while the power-rule derivative drives slope.",
        metadata: {
          graphMotionKind: "derivative-tangent-motion",
          graphId,
          curveId,
          derivativeExpressionId: targetExpressionId,
          sourceStateId,
          targetStateId
        }
      }
    ],
    checks: [
      {
        id: "check.derivative-rules.tangent-graph.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: derivativeTangentAnimationId
      },
      {
        id: "check.derivative-rules.tangent-graph.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: treeRoot.id
      },
      {
        id: "check.derivative-rules.tangent-graph.slope",
        lawId: "law.graph.derivative-tangent-slope",
        level: "sampled",
        targetId: tangentTransformation.id
      }
    ],
    exportTargets: [
      {
        id: "export.derivative-rules.tangent-graph.frames",
        kind: "frame-sequence",
        artifactId: "artifact.derivative-rules.tangent-graph.frames"
      }
    ],
    dashboard: {
      rowId: "animation-derivative-rules-tangent-graph",
      tags: ["animation", "graph", "calculus", "derivative", "tangent"],
      sampleTargetIds: [renderTargetId],
      sourceRefIds: [
        "family.calculus.derivative-rules",
        "law.graph.derivative-tangent-slope"
      ]
    },
    metadata: {
      domain: "calculus",
      graphMotionKind: "derivative-tangent-motion",
      summary:
        "Synchronizes the power-rule derivative with a moving point and tangent line on x cubed."
    }
  });
}

export function tangentStateAt(x: number): DerivativeTangentState {
  const y = x ** 3;
  const slope = 3 * x ** 2;

  return {
    x,
    y,
    slope,
    intercept: y - slope * x
  };
}

function tangentStateObject(
  id: string,
  title: string,
  state: DerivativeTangentState,
  role: "source" | "target"
) {
  return createKpSemanticAssetObject({
    id,
    objectType: "derivative-tangent-state",
    title,
    value: state,
    selectors: [
      { id: `${id}.point`, kind: "point", label: `${role} point` },
      { id: `${id}.tangent`, kind: "line", label: `${role} tangent` },
      { id: `${id}.slope`, kind: "slope", label: String(state.slope) }
    ]
  });
}

function expressionObject(input: {
  readonly id: string;
  readonly title: string;
  readonly latex: string;
  readonly selectors: readonly (readonly [string, string, string])[];
}) {
  return createKpSemanticAssetObject({
    id: input.id,
    objectType: "derivative-expression",
    title: input.title,
    value: { latex: input.latex },
    selectors: input.selectors.map(([id, kind, label]) => ({
      id: `${input.id}.${id}`,
      kind,
      label
    })),
    metadata: { latex: input.latex }
  });
}

function graphObject(object: {
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
