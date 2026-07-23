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
const limitTransformationId =
  "transform.derivative-rules.tangent-graph.converge-difference-quotient";
const geometryTransformationId =
  "transform.derivative-rules.tangent-graph.converge-secant";
const anchorX = 1;
const sourceH = 1;

export interface DerivativeTangentState {
  readonly x: number;
  readonly y: number;
  readonly slope: number;
  readonly intercept: number;
}

export interface DerivativeSecantTangentState {
  readonly anchorX: number;
  readonly anchorY: number;
  readonly h: number;
  readonly movingX: number;
  readonly movingY: number;
  readonly secantSlope: number;
  readonly secantIntercept: number;
  readonly tangentSlope: number;
  readonly tangentIntercept: number;
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
    title: "Finite difference quotient",
    latex: "\\frac{f(a+h)-f(a)}{h}",
    selectors: [
      ["quotient", "fraction", "finite difference quotient"],
      ["moving-value", "function-value", "f(a+h)"],
      ["anchor-value", "function-value", "f(a)"],
      ["increment", "variable", "h"]
    ]
  });
  const targetExpression = expressionObject({
    id: targetExpressionId,
    title: "Derivative at the anchor",
    latex: "f'(1)=3",
    selectors: [
      ["derivative", "derivative-operator", "f'"],
      ["anchor", "argument", "1"],
      ["value", "value", "3"]
    ]
  });
  const sourceState = secantTangentStateObject(
    sourceStateId,
    "Finite secant at h = 1",
    secantTangentStateAt(anchorX, sourceH),
    "source"
  );
  const targetState = secantTangentStateObject(
    targetStateId,
    "Tangent limit at h = 0",
    secantTangentStateAt(anchorX, 0),
    "target"
  );
  const limitTransformation = createKpSemanticTransformation({
    id: limitTransformationId,
    definitionId: "definition.symbolic.calculus.derivative-limit",
    transformType: "convergeDifferenceQuotient",
    title: "Converge the finite difference quotient to the derivative",
    sourceObjectIds: [sourceExpression.id],
    targetObjectIds: [targetExpression.id],
    preserves: ["value", "role"],
    correspondenceMap: {
      id: `${limitTransformationId}.correspondence`,
      records: [
        {
          id: "quotient-becomes-derivative",
          relation: "role-change",
          sourceSelectorIds: [`${sourceExpressionId}.quotient`],
          targetSelectorIds: [`${targetExpressionId}.derivative`],
          summary:
            "The finite secant slope becomes the derivative at the anchor as h tends to zero."
        },
        {
          id: "anchor-persists",
          relation: "identity",
          sourceSelectorIds: [`${sourceExpressionId}.anchor-value`],
          targetSelectorIds: [`${targetExpressionId}.anchor`],
          summary: "The evaluation anchor remains fixed throughout the limit."
        },
        {
          id: "finite-values-resolve",
          relation: "fan-in",
          sourceSelectorIds: [
            `${sourceExpressionId}.moving-value`,
            `${sourceExpressionId}.increment`
          ],
          targetSelectorIds: [`${targetExpressionId}.value`],
          summary:
            "The moving function value and shrinking increment resolve into the derivative value."
        }
      ]
    },
    correspondence: [
      {
        sourceSelectorId: `${sourceExpressionId}.quotient`,
        targetSelectorId: `${targetExpressionId}.derivative`,
        preserves: ["role", "value"]
      },
      {
        sourceSelectorId: `${sourceExpressionId}.anchor-value`,
        targetSelectorId: `${targetExpressionId}.anchor`,
        preserves: ["identity", "role"]
      }
    ],
    lawRefs: [
      {
        id: "law.calculus.derivative.difference-quotient-limit",
        level: "sampled",
        summary:
          "For f(x)=x cubed at a=1, the finite quotient converges continuously to f'(1)=3."
      }
    ]
  });
  const geometryTransformation = createKpSemanticTransformation({
    id: geometryTransformationId,
    definitionId: "definition.graph.derivative.secant-tangent-convergence",
    transformType: "convergeDerivativeSecant",
    title: "Move the second point into the anchor and converge the secant",
    sourceObjectIds: [curveId, sourceExpressionId, sourceStateId],
    targetObjectIds: [curveId, targetExpressionId, targetStateId],
    preserves: ["identity", "value", "role"],
    correspondenceMap: {
      id: `${geometryTransformationId}.correspondence`,
      records: [
        {
          id: "curve-persists",
          relation: "identity",
          sourceSelectorIds: [`${curveId}.body`],
          targetSelectorIds: [`${curveId}.body`],
          summary: "The cubic curve remains fixed during convergence."
        },
        ...["anchor-point", "secant-point", "secant-line", "slope", "increment"].map((selector) => ({
          id: `${selector}-converges`,
          relation: "identity" as const,
          sourceSelectorIds: [`${sourceStateId}.${selector}`],
          targetSelectorIds: [`${targetStateId}.${selector}`],
          summary:
            `The ${selector} keeps its semantic identity as the finite secant becomes the tangent.`
        }))
      ]
    },
    correspondence: [
      {
        sourceSelectorId: `${curveId}.body`,
        targetSelectorId: `${curveId}.body`,
        preserves: ["identity", "value", "presentation"]
      },
      {
        sourceSelectorId: `${sourceStateId}.anchor-point`,
        targetSelectorId: `${targetStateId}.anchor-point`,
        preserves: ["identity", "role"]
      },
      {
        sourceSelectorId: `${sourceStateId}.secant-line`,
        targetSelectorId: `${targetStateId}.secant-line`,
        preserves: ["identity", "role"]
      }
    ],
    lawRefs: [
      {
        id: "law.graph.derivative-tangent-slope",
        level: "sampled",
        summary:
          "The secant slope equals the finite difference quotient and converges to the tangent slope."
      }
    ]
  });
  const treeRoot = createSemanticTransformationParallel({
    id: "diagram.derivative-rules.tangent-graph.synchronized",
    label: "Synchronized derivative and tangent motion",
    children: [limitTransformation, geometryTransformation].map(
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
      "The KaTeX difference quotient and SVG secant geometry consume the same convergence parameter."
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
    title: "Difference quotient converging to a tangent",
    bundle: createKpAssetBundle({
      id: "asset.derivative-rules.tangent-graph",
      title: "Derivative tangent graph assets",
      objects
    }),
    transformations: [limitTransformation, geometryTransformation],
    transformationTree: createEditableSemanticTransformationTree({
      root: treeRoot,
      annotations: [
        {
          id: "focus.derivative-rules.tangent-graph.point",
          kind: "focus",
          targetNodeId: geometryTransformation.id,
          placement: "during",
          selectorIds: [
            `${sourceStateId}.anchor-point`,
            `${targetStateId}.anchor-point`,
            `${sourceStateId}.secant-point`,
            `${targetStateId}.secant-point`,
            `${sourceStateId}.secant-line`,
            `${targetStateId}.secant-line`
          ]
        }
      ]
    }),
    timeline: {
      id: timelineId,
      durationMs: 3200,
      beatCount: 64
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
          limitTransformation.id,
          geometryTransformation.id
        ],
        timelineId,
        summary:
          "Moves the second point toward a fixed anchor while the finite difference quotient and secant converge to the derivative and tangent.",
        metadata: {
          graphMotionKind: "derivative-tangent-motion",
          graphId,
          curveId,
          sourceExpressionId,
          derivativeExpressionId: targetExpressionId,
          contextLatex: "f(x)=x^3,\\quad a=1",
          differenceQuotientLatex:
            "m_{\\mathrm{sec}}(h)=\\frac{f(a+h)-f(a)}{h}",
          derivativeDisplayLatex: "f'(1)=3",
          convergenceLatex:
            "h\\to 0\\quad\\Longrightarrow\\quad m_{\\mathrm{sec}}(h)\\to f'(1)=3",
          anchorX,
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
        targetId: geometryTransformation.id
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
        "law.calculus.derivative.difference-quotient-limit",
        "law.graph.derivative-tangent-slope"
      ]
    },
    metadata: {
      domain: "calculus",
      graphMotionKind: "derivative-tangent-motion",
      summary:
        "Synchronizes a KaTeX finite difference quotient with secant geometry converging to the tangent of x cubed."
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

export function secantTangentStateAt(
  anchor: number,
  h: number
): DerivativeSecantTangentState {
  const tangent = tangentStateAt(anchor);
  const movingX = anchor + h;
  const movingY = movingX ** 3;
  const secantSlope = h === 0
    ? tangent.slope
    : (movingY - tangent.y) / h;

  return {
    anchorX: anchor,
    anchorY: tangent.y,
    h,
    movingX,
    movingY,
    secantSlope,
    secantIntercept: tangent.y - secantSlope * anchor,
    tangentSlope: tangent.slope,
    tangentIntercept: tangent.intercept
  };
}

function secantTangentStateObject(
  id: string,
  title: string,
  state: DerivativeSecantTangentState,
  role: "source" | "target"
) {
  return createKpSemanticAssetObject({
    id,
    objectType: "derivative-secant-tangent-state",
    title,
    value: state,
    selectors: [
      { id: `${id}.anchor-point`, kind: "point", label: `${role} anchor point` },
      { id: `${id}.secant-point`, kind: "point", label: `${role} second point` },
      { id: `${id}.secant-line`, kind: "line", label: `${role} secant line` },
      { id: `${id}.slope`, kind: "slope", label: String(state.secantSlope) },
      { id: `${id}.increment`, kind: "increment", label: String(state.h) }
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
