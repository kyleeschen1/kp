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
  createSemanticTransformationParallel
} from "../semantic/transformation-composition.ts";

export const dotProjectionAnimationId = "animation.dot-projection.basic";

const graphId = "graph.dot-projection.vector-plane";
const leftVectorId = "vector.dot-projection.left";
const rightVectorId = "vector.dot-projection.right";
const projectionVectorId = "vector.dot-projection.projection";
const orthogonalVectorId = "vector.dot-projection.orthogonal";
const dotExpressionId = "expression.dot-projection.source";
const scalarResultId = "expression.dot-projection.scalar-result";
const dotTransformationId = "transform.dot-projection.compute-dot";
const projectionTransformationId = "transform.dot-projection.drop-projection";
const timelineId = "timeline.dot-projection.basic";
const renderTargetId = "render.dot-projection.basic";

interface VectorValue {
  readonly coordinates: readonly [number, number];
}

export function createDotProjectionAnimationAsset(): KpAnimationAsset {
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
  const left = vectorObject(leftVectorId, "u", [3, 4]);
  const right = vectorObject(rightVectorId, "v", [4, 0]);
  const projection = vectorObject(projectionVectorId, "proj_v(u)", [3, 0]);
  const orthogonal = vectorObject(orthogonalVectorId, "u - proj_v(u)", [0, 4]);
  const dotExpression = createKpSemanticAssetObject({
    id: dotExpressionId,
    objectType: "dot-product-expression",
    title: "Dot product of u and v",
    value: { latex: "(3,4)\\cdot(4,0)" },
    selectors: [
      { id: `${dotExpressionId}.left`, kind: "vector", label: "u" },
      { id: `${dotExpressionId}.right`, kind: "vector", label: "v" }
    ],
    metadata: { latex: "(3,4)\\cdot(4,0)" }
  });
  const scalarResult = createKpSemanticAssetObject({
    id: scalarResultId,
    objectType: "dot-product-interpretation",
    title: "Dot product scalar result",
    value: { latex: "12", scalar: 12 },
    selectors: [
      { id: `${scalarResultId}.value`, kind: "scalar", label: "12" }
    ],
    metadata: { latex: "12" }
  });
  const dotTransformation = createKpSemanticTransformation({
    id: dotTransformationId,
    definitionId: "definition.symbolic.linear-algebra.dot-product",
    transformType: "dotProduct",
    title: "Compute the component-pair dot product",
    sourceObjectIds: [dotExpression.id, left.id, right.id],
    targetObjectIds: [scalarResult.id, left.id, right.id],
    preserves: ["value", "structure", "role"],
    correspondence: [
      {
        sourceSelectorId: `${dotExpressionId}.left`,
        targetSelectorId: `${scalarResultId}.value`,
        preserves: ["value", "role"]
      },
      {
        sourceSelectorId: `${dotExpressionId}.right`,
        targetSelectorId: `${scalarResultId}.value`,
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
    title: "Drop u perpendicularly onto v",
    sourceObjectIds: [left.id, right.id],
    targetObjectIds: [projection.id, orthogonal.id, right.id],
    preserves: ["value", "structure", "role"],
    correspondence: [
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
    assumptions: ["The projection target v is non-zero."],
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
  const treeRoot = createSemanticTransformationParallel({
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
    projection,
    orthogonal,
    dotExpression,
    scalarResult
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
          scalarResultId
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
