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
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";
import {
  kpVectorDotProjectionExemplarContract
} from "./vector-dot-projection-exemplar-contract.ts";
import {
  compileKpVectorDotProjectionSemanticModel,
  type KpVectorDotProjectionComponentLineage
} from "./vector-dot-projection-semantic-model.ts";

export const dotProjectionAnimationId =
  kpVectorDotProjectionExemplarContract.animationId;

const graphId = "graph.dot-projection.vector-plane";
const leftVectorId = "vector.dot-projection.left";
const rightVectorId = "vector.dot-projection.right";
const projectionVectorId = "vector.dot-projection.projection";
const orthogonalVectorId = "vector.dot-projection.orthogonal";
const dotExpressionId = "expression.dot-projection.source";
const scalarResultId = "expression.dot-projection.scalar-result";
const projectionScaleId = "expression.dot-projection.projection-scale";
const magnitudeRelationId = "expression.dot-projection.magnitudes";
const angleRelationId = "expression.dot-projection.angle";
const orthogonalityRelationId = "expression.dot-projection.orthogonality";
const dotTransformationId = "transform.dot-projection.compute-dot";
const projectionTransformationId = "transform.dot-projection.drop-projection";
const timelineId = "timeline.dot-projection.basic";
const renderTargetId = "render.dot-projection.basic";

interface VectorValue {
  readonly coordinates: readonly [number, number];
}

export function createDotProjectionAnimationAsset(): KpAnimationAsset {
  const modelResult = compileKpVectorDotProjectionSemanticModel({
    id: "model.dot-projection.basic",
    sourceVectorId: leftVectorId,
    targetVectorId: rightVectorId,
    projectionVectorId,
    residualVectorId: orthogonalVectorId,
    sourceVector: kpVectorDotProjectionExemplarContract.sourceVector,
    targetVector: kpVectorDotProjectionExemplarContract.targetVector
  });
  if (modelResult.status !== "compiled") {
    throw new Error(modelResult.diagnostics[0]?.message ??
      "Canonical vector projection model failed to compile.");
  }
  const model = modelResult.model;
  const graph = createGraph2DObject({
    id: graphId,
    label: "Dot product and projection plane",
    xAxisId: `${graphId}.x-axis`,
    yAxisId: `${graphId}.y-axis`,
    xDomain: [-1, 5],
    yDomain: [-1, 5],
    width: 540,
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
    tickStep: 1
  });
  const left = vectorObject(leftVectorId, "a", model.sourceVector);
  const right = vectorObject(rightVectorId, "b", model.targetVector);
  const projection = vectorObject(
    projectionVectorId,
    "proj_b(a)",
    model.projectionVector
  );
  const orthogonal = vectorObject(
    orthogonalVectorId,
    "a - proj_b(a)",
    model.residualVector
  );
  const componentPairs = model.componentLineage.map(componentPairObject);
  const dotExpression = createKpSemanticAssetObject({
    id: dotExpressionId,
    objectType: "dot-product-expression",
    title: "Dot product of a and b",
    value: {
      latex: kpVectorDotProjectionExemplarContract.exactLatex.componentDotProduct
    },
    selectors: [
      { id: `${dotExpressionId}.left`, kind: "vector", label: "a" },
      { id: `${dotExpressionId}.right`, kind: "vector", label: "b" }
    ],
    metadata: {
      latex: kpVectorDotProjectionExemplarContract.exactLatex.componentDotProduct
    }
  });
  const scalarResult = createKpSemanticAssetObject({
    id: scalarResultId,
    objectType: "dot-product-interpretation",
    title: "Dot product scalar result",
    value: { latex: "6", scalar: model.dotProduct },
    selectors: [
      { id: `${scalarResultId}.value`, kind: "scalar", label: "6" }
    ],
    metadata: { latex: "6" }
  });
  const projectionScale = relationObject({
    id: projectionScaleId,
    objectType: "projection-scale",
    title: "Exact projection scale",
    latex: kpVectorDotProjectionExemplarContract.exactLatex.projectionScale,
    value: {
      numerator: model.projectionScale.numerator,
      denominator: model.projectionScale.denominator,
      scalar: model.projectionScale.value
    },
    selectors: [
      { id: `${projectionScaleId}.value`, kind: "scalar", label: "3" }
    ]
  });
  const magnitudeRelation = relationObject({
    id: magnitudeRelationId,
    objectType: "vector-magnitude-relation",
    title: "Exact vector magnitudes",
    latex: kpVectorDotProjectionExemplarContract.exactLatex.magnitudeRelation,
    value: {
      sourceNormSquared: model.sourceNormSquared,
      targetNormSquared: model.targetNormSquared
    },
    selectors: [
      { id: `${magnitudeRelationId}.source`, kind: "length", label: "2√5" },
      { id: `${magnitudeRelationId}.target`, kind: "length", label: "√2" }
    ]
  });
  const angleRelation = relationObject({
    id: angleRelationId,
    objectType: "vector-angle-relation",
    title: "Exact angle relation",
    latex: kpVectorDotProjectionExemplarContract.exactLatex.angleRelation,
    value: { cosineNumerator: 3, cosineRadicand: 10 },
    selectors: [
      { id: `${angleRelationId}.cosine`, kind: "angle", label: "3/√10" }
    ]
  });
  const orthogonalityRelation = relationObject({
    id: orthogonalityRelationId,
    objectType: "vector-orthogonality-witness",
    title: "Residual orthogonality witness",
    latex:
      kpVectorDotProjectionExemplarContract.exactLatex.orthogonalDecomposition,
    value: { dotProduct: model.residualTargetDotProduct },
    selectors: [
      { id: `${orthogonalityRelationId}.witness`, kind: "witness", label: "0" }
    ]
  });
  const dotTransformation = createKpSemanticTransformation({
    id: dotTransformationId,
    definitionId: "definition.symbolic.linear-algebra.dot-product",
    transformType: "dotProduct",
    title: "Compute the component-pair dot product",
    sourceObjectIds: [dotExpression.id, left.id, right.id],
    targetObjectIds: [
      ...componentPairs.map(({ id }) => id),
      scalarResult.id,
      magnitudeRelation.id,
      angleRelation.id,
      left.id,
      right.id
    ],
    preserves: ["value", "structure", "role"],
    correspondence: [
      {
        sourceSelectorId: `${leftVectorId}.x`,
        targetSelectorId: `${componentPairs[0]!.id}.source`,
        preserves: ["value", "role"]
      },
      {
        sourceSelectorId: `${rightVectorId}.x`,
        targetSelectorId: `${componentPairs[0]!.id}.target`,
        preserves: ["value", "role"]
      },
      {
        sourceSelectorId: `${leftVectorId}.y`,
        targetSelectorId: `${componentPairs[1]!.id}.source`,
        preserves: ["value", "role"]
      },
      {
        sourceSelectorId: `${rightVectorId}.y`,
        targetSelectorId: `${componentPairs[1]!.id}.target`,
        preserves: ["value", "role"]
      }
    ],
    lawRefs: [
      { id: "law.linear-algebra.dot-product", level: "strict" }
    ]
  });
  const projectionTransformation = createKpSemanticTransformation({
    id: projectionTransformationId,
    definitionId: "definition.symbolic.linear-algebra.vector-projection",
    transformType: "vectorProjection",
    title: "Project a onto b and retain the perpendicular residual",
    sourceObjectIds: [
      left.id,
      right.id,
      scalarResult.id,
      magnitudeRelation.id,
      angleRelation.id
    ],
    targetObjectIds: [
      projectionScale.id,
      projection.id,
      orthogonal.id,
      orthogonalityRelation.id,
      right.id
    ],
    preserves: ["value", "structure", "role"],
    correspondence: [
      {
        sourceSelectorId: `${scalarResultId}.value`,
        targetSelectorId: `${projectionScaleId}.value`,
        preserves: ["value", "role"]
      },
      {
        sourceSelectorId: `${leftVectorId}.body`,
        targetSelectorId: `${projectionVectorId}.body`,
        preserves: ["value", "role"]
      },
      {
        sourceSelectorId: `${rightVectorId}.body`,
        targetSelectorId: `${rightVectorId}.body`,
        preserves: ["identity", "value", "presentation"]
      }
    ],
    assumptions: ["The projection target b is non-zero."],
    lawRefs: [
      { id: "law.linear-algebra.vector-projection", level: "strict" },
      {
        id: "law.graph.dot-projection-geometry",
        level: "strict",
        summary: "The residual u - proj_v(u) is orthogonal to v."
      }
    ]
  });
  const transformations = [dotTransformation, projectionTransformation];
  const treeRoot = createSemanticTransformationSequence({
    id: "diagram.dot-projection.synchronized",
    label: "Synchronized dot product and projection",
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
  const objects = [
    semanticObject(graph),
    semanticObject(xAxis),
    semanticObject(yAxis),
    left,
    right,
    ...componentPairs,
    projection,
    orthogonal,
    dotExpression,
    scalarResult,
    magnitudeRelation,
    angleRelation,
    projectionScale,
    orthogonalityRelation
  ];

  return createKpAnimationAsset({
    id: dotProjectionAnimationId,
    title: "Dot product and vector projection",
    bundle: createKpAssetBundle({
      id: "asset.dot-projection.basic",
      title: "Dot-product projection assets",
      objects
    }),
    transformations,
    transformationTree: createEditableSemanticTransformationTree({
      root: treeRoot,
      annotations: [
        {
          id: "focus.dot-projection.drop",
          kind: "focus",
          targetNodeId: projectionTransformation.id,
          placement: "during",
          selectorIds: [
            `${leftVectorId}.body`,
            `${projectionVectorId}.body`,
            `${orthogonalVectorId}.body`
          ]
        }
      ]
    }),
    timeline: { id: timelineId, durationMs: 2200, beatCount: 44 },
    layout: {
      id: "layout.dot-projection.basic",
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
        transformationIds: transformations.map((transformation) =>
          transformation.id
        ),
        timelineId,
        summary:
          "Aligns component products with an exact perpendicular projection drop.",
        metadata: {
          graphMotionKind: "dot-projection-motion",
          graphId,
          leftVectorId,
          rightVectorId,
          projectionVectorId,
          orthogonalVectorId,
          scalarResultId,
          projectionScaleId,
          componentPairObjectIds: componentPairs.map(({ id }) => id).join(","),
          semanticModelId: model.id,
          accessibleDescription: model.accessibleDescription
        }
      }
    ],
    checks: [
      {
        id: "check.dot-projection.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: dotProjectionAnimationId
      },
      {
        id: "check.dot-projection.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: treeRoot.id
      },
      {
        id: "check.dot-projection.geometry",
        lawId: "law.graph.dot-projection-geometry",
        level: "strict",
        targetId: projectionTransformation.id
      }
    ],
    exportTargets: [
      {
        id: "export.dot-projection.frames",
        kind: "frame-sequence",
        artifactId: "artifact.dot-projection.frames"
      }
    ],
    dashboard: {
      rowId: "animation-dot-projection-basic",
      tags: ["animation", "graph", "linear-algebra", "dot-product", "projection"],
      sampleTargetIds: [renderTargetId],
      sourceRefIds: ["family.linear-algebra.dot-projection"]
    },
    metadata: {
      domain: "linear-algebra",
      graphMotionKind: "dot-projection-motion",
      summary:
        "Computes a dot product while dropping one vector onto its exact projection."
    }
  });
}

function vectorObject(id: string, title: string, coordinates: readonly [number, number]) {
  return createKpSemanticAssetObject<VectorValue>({
    id,
    objectType: "vector",
    title,
    value: { coordinates },
    selectors: [
      { id: `${id}.body`, kind: "vector", label: title },
      { id: `${id}.x`, kind: "component", label: "x" },
      { id: `${id}.y`, kind: "component", label: "y" }
    ]
  });
}

function componentPairObject(
  lineage: KpVectorDotProjectionComponentLineage
) {
  return relationObject({
    id: lineage.productObjectId,
    objectType: "dot-product-component-pair",
    title: `${lineage.axis}-component product`,
    latex:
      `${lineage.sourceComponent}\\cdot${lineage.targetComponent}=${lineage.product}`,
    value: {
      index: lineage.index,
      axis: lineage.axis,
      sourceComponent: lineage.sourceComponent,
      targetComponent: lineage.targetComponent,
      product: lineage.product,
      cumulativeDotProduct: lineage.cumulativeDotProduct,
      sourceGeometryId: lineage.sourceGeometryId,
      targetGeometryId: lineage.targetGeometryId,
      projectionGeometryId: lineage.projectionGeometryId
    },
    selectors: [
      {
        id: `${lineage.productObjectId}.source`,
        kind: "component",
        label: String(lineage.sourceComponent)
      },
      {
        id: `${lineage.productObjectId}.target`,
        kind: "component",
        label: String(lineage.targetComponent)
      },
      {
        id: `${lineage.productObjectId}.product`,
        kind: "scalar",
        label: String(lineage.product)
      }
    ]
  });
}

function relationObject(input: {
  readonly id: string;
  readonly objectType: string;
  readonly title: string;
  readonly latex: string;
  readonly value: Readonly<Record<string, unknown>>;
  readonly selectors: readonly {
    readonly id: string;
    readonly kind: string;
    readonly label: string;
  }[];
}) {
  return createKpSemanticAssetObject({
    id: input.id,
    objectType: input.objectType,
    title: input.title,
    value: { ...input.value, latex: input.latex },
    selectors: input.selectors,
    metadata: { latex: input.latex }
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
