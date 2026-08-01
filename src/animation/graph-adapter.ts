import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type KpSemanticAssetObject
} from "../semantic/asset.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../semantic/transformation-composition.ts";
import {
  createDefaultGraph3DScene,
  createGraph2DObject,
  type Graph3DObject,
  type GraphSceneObject,
  type Surface3DObject
} from "../semantic/graph.ts";
import { createMatrixObject, type MatrixObject } from "../semantic/matrix.ts";
import {
  deriveLinearMapFromMatrix,
  type LinearMapObject
} from "../semantic/linear-map.ts";
import {
  createDerivativeTangentAnimationAsset
} from "./derivative-tangent-adapter.ts";
import { createDotProjectionAnimationAsset } from "./dot-projection-adapter.ts";
import {
  createIntegralAreaSweepAnimationAsset
} from "./integral-area-sweep-adapter.ts";

interface VectorObject {
  readonly id: string;
  readonly type: "vector";
  readonly label: string;
  readonly coordinates: readonly number[];
}

const graphSurfaceModeAnimationId = "animation.graph.surface-mode.mesh-to-donut";
const graphSurfaceModeTimelineId = "timeline.graph.surface-mode.mesh-to-donut";
const graphSurfaceModeRenderTargetId = "render.graph.surface-mode.mesh-to-donut";
const graphSurfaceModeTransformationId =
  "transform.graph.surface-mode.mesh-to-donut";

const vectorAnimationId = "animation.graph.vector.linear-map-scale";
const vectorTimelineId = "timeline.graph.vector.linear-map-scale";
const vectorRenderTargetId = "render.graph.vector.linear-map-scale";
const vectorTransformationId = "transform.graph.vector.apply-linear-map-scale";

export function createGraphAnimationAssets(): readonly KpAnimationAsset[] {
  return [
    createGraphSurfaceModeAnimationAsset(),
    createLinearMapVectorAnimationAsset(),
    createDerivativeTangentAnimationAsset(),
    createIntegralAreaSweepAnimationAsset(),
    createDotProjectionAnimationAsset()
  ];
}

export function createGraphSurfaceModeAnimationAsset(): KpAnimationAsset {
  const scene = createDefaultGraph3DScene();
  const graph = requireGraph3DObject(scene, "saddle-orbit-graph");
  const surface = requireSurface3DObject(scene, "saddle-surface");
  const axes = scene.filter((object) => object.type === "axis-3d");
  const graphObject = graphSemanticAssetObject(graph, {
    selectors: [
      {
        id: "saddle-orbit-graph.surfaceMode.mesh",
        kind: "surface-mode",
        label: "mesh"
      },
      {
        id: "saddle-orbit-graph.surfaceMode.donut",
        kind: "surface-mode",
        label: "donut"
      }
    ]
  });
  const surfaceObject = graphSemanticAssetObject(surface, {
    selectors: [
      {
        id: "saddle-surface.samples",
        kind: "surface-samples",
        label: "sampled surface"
      }
    ]
  });
  const transformation = createGraphSurfaceModeTransformation(graph.id);

  return createKpAnimationAsset({
    id: graphSurfaceModeAnimationId,
    title: "Saddle surface mesh to donut",
    bundle: createKpAssetBundle({
      id: "asset.graph.surface-mode.mesh-to-donut",
      title: "Saddle surface mode assets",
      objects: [
        graphObject,
        ...axes.map((axis) => graphSemanticAssetObject(axis, {
          selectors: [{
            id: `${axis.id}.body`,
            kind: "axis",
            label: axis.label
          }]
        })),
        surfaceObject
      ]
    }),
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({
      root: createSemanticTransformationLeaf(
        semanticTransformationRef(transformation)
      ),
      annotations: [
        {
          id: "focus.graph.surface-mode.surface",
          kind: "focus",
          targetNodeId: graphSurfaceModeTransformationId,
          placement: "during",
          selectorIds: ["saddle-surface.samples"],
          summary: "Keep attention on the sampled surface during the morph."
        }
      ]
    }),
    timeline: {
      id: graphSurfaceModeTimelineId,
      durationMs: 1800,
      beatCount: 24
    },
    layout: {
      id: "layout.graph.surface-mode",
      kind: "single",
      targetId: graphSurfaceModeRenderTargetId
    },
    renderTargets: [
      {
        id: graphSurfaceModeRenderTargetId,
        kind: "graph",
        objectIds: [graph.id, ...axes.map((axis) => axis.id), surface.id],
        selectorIds: [
          "saddle-orbit-graph.surfaceMode.mesh",
          "saddle-orbit-graph.surfaceMode.donut"
        ],
        transformationIds: [graphSurfaceModeTransformationId],
        timelineId: graphSurfaceModeTimelineId,
        summary: "Renderer-neutral WebGL/SVG surface mode animation target.",
        metadata: {
          graphMotionKind: "surface-mode-transition",
          sourceMode: "mesh",
          targetMode: "donut"
        }
      }
    ],
    checks: [
      {
        id: "check.graph.surface-mode.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: graphSurfaceModeAnimationId
      },
      {
        id: "check.graph.surface-mode.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: graphSurfaceModeTransformationId
      }
    ],
    dashboard: {
      rowId: "animation-graph-surface-mode-mesh-to-donut",
      tags: ["animation", "graph", "webgl", "surface-mode"],
      sampleTargetIds: [graphSurfaceModeRenderTargetId]
    },
    metadata: {
      domain: "graph",
      placeholderContract: true,
      graphMotionKind: "surface-mode-transition"
    }
  });
}

export function createLinearMapVectorAnimationAsset(): KpAnimationAsset {
  const matrix = createMatrixObject({
    id: "matrix.scale",
    label: "S",
    rows: [
      [2, 0],
      [0, 3]
    ]
  });
  const { object: linearMap } = deriveLinearMapFromMatrix(matrix, {
    id: "linear-map.scale",
    label: "Scale vector"
  });
  const graph = createGraph2DObject({
    id: "graph.vector-plane",
    label: "Vector plane",
    xAxisId: "graph.vector-plane.x-axis",
    yAxisId: "graph.vector-plane.y-axis",
    xDomain: [-1, 5],
    yDomain: [-1, 7],
    width: 520,
    height: 360
  });
  const sourceVector: VectorObject = {
    id: "vector.scale.source",
    type: "vector",
    label: "v",
    coordinates: [1, 2]
  };
  const targetVector: VectorObject = {
    id: "vector.scale.target",
    type: "vector",
    label: "Sv",
    coordinates: [2, 6]
  };
  const transformation = createLinearMapVectorTransformation();

  return createKpAnimationAsset({
    id: vectorAnimationId,
    title: "Apply a scale matrix to a vector",
    bundle: createKpAssetBundle({
      id: "asset.graph.vector.linear-map-scale",
      title: "Linear map vector motion assets",
      objects: [
        matrixSemanticAssetObject(matrix),
        linearMapSemanticAssetObject(linearMap),
        graphSemanticAssetObject(graph, {
          selectors: [
            {
              id: "graph.vector-plane.viewport",
              kind: "viewport",
              label: "vector plane"
            }
          ]
        }),
        vectorSemanticAssetObject(sourceVector),
        vectorSemanticAssetObject(targetVector)
      ]
    }),
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({
      root: createSemanticTransformationLeaf(
        semanticTransformationRef(transformation)
      )
    }),
    timeline: {
      id: vectorTimelineId,
      durationMs: 1600,
      beatCount: 20
    },
    layout: {
      id: "layout.graph.vector.linear-map-scale",
      kind: "single",
      targetId: vectorRenderTargetId
    },
    renderTargets: [
      {
        id: vectorRenderTargetId,
        kind: "graph",
        objectIds: [
          "graph.vector-plane",
          "linear-map.scale",
          "vector.scale.source",
          "vector.scale.target"
        ],
        selectorIds: [
          "vector.scale.source.body",
          "vector.scale.target.body"
        ],
        transformationIds: [vectorTransformationId],
        timelineId: vectorTimelineId,
        summary: "Renderer-neutral vector motion target for SVG or WebGL.",
        metadata: {
          graphMotionKind: "linear-map-vector-motion",
          linearMapId: "linear-map.scale",
          sourceVectorId: "vector.scale.source",
          targetVectorId: "vector.scale.target"
        }
      }
    ],
    checks: [
      {
        id: "check.graph.vector.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: vectorAnimationId
      },
      {
        id: "check.graph.vector.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: vectorTransformationId
      }
    ],
    dashboard: {
      rowId: "animation-graph-vector-linear-map-scale",
      tags: ["animation", "graph", "vector", "linear-algebra"],
      sampleTargetIds: [vectorRenderTargetId]
    },
    metadata: {
      domain: "linear-algebra",
      placeholderContract: true,
      graphMotionKind: "linear-map-vector-motion"
    }
  });
}

function createGraphSurfaceModeTransformation(
  graphId: string
): KpSemanticTransformation {
  // Surface mode changes are presentation-level graph transforms: the graph
  // object identity persists while renderers tween between visual modes.
  return createKpSemanticTransformation({
    id: graphSurfaceModeTransformationId,
    definitionId: "definition.graph.surface-mode-change",
    transformType: "changeGraphSurfaceMode",
    title: "Change surface mode from mesh to donut",
    sourceObjectIds: [graphId],
    targetObjectIds: [graphId],
    preserves: ["identity", "structure", "presentation"],
    correspondence: [
      {
        sourceSelectorId: "saddle-orbit-graph.surfaceMode.mesh",
        targetSelectorId: "saddle-orbit-graph.surfaceMode.donut",
        preserves: ["identity", "presentation"],
        summary: "The same graph surface is viewed through a different mode."
      }
    ],
    lawRefs: [
      {
        id: "law.graph.surface-mode.same-graph",
        level: "sampled",
        summary: "Surface-mode tweens preserve graph identity and domain."
      }
    ]
  });
}

function createLinearMapVectorTransformation(): KpSemanticTransformation {
  return createKpSemanticTransformation({
    id: vectorTransformationId,
    definitionId: "definition.graph.vector.apply-linear-map",
    transformType: "applyLinearMapToVector",
    title: "Apply scale linear map to vector",
    sourceObjectIds: ["linear-map.scale", "vector.scale.source"],
    targetObjectIds: ["linear-map.scale", "vector.scale.target"],
    preserves: ["identity", "value", "structure"],
    correspondence: [
      {
        sourceSelectorId: "linear-map.scale.map",
        targetSelectorId: "linear-map.scale.map",
        preserves: ["identity", "structure"]
      },
      {
        sourceSelectorId: "vector.scale.source.body",
        targetSelectorId: "vector.scale.target.body",
        preserves: ["value", "role"],
        summary: "The vector value changes according to the linear map."
      }
    ],
    lawRefs: [
      {
        id: "law.linear-map.apply-vector",
        level: "strict",
        summary: "Target vector is the matrix product S times v."
      }
    ]
  });
}

function graphSemanticAssetObject<TGraph extends GraphSceneObject>(
  object: TGraph,
  input: {
    readonly selectors: Parameters<typeof createKpSemanticAssetObject>[0]["selectors"];
  }
): KpSemanticAssetObject<TGraph> {
  return createKpSemanticAssetObject({
    id: object.id,
    objectType: object.type,
    title: object.label,
    value: object,
    selectors: input.selectors
  });
}

function matrixSemanticAssetObject(
  matrix: MatrixObject
): KpSemanticAssetObject<MatrixObject> {
  return createKpSemanticAssetObject({
    id: matrix.id,
    objectType: matrix.type,
    title: matrix.label,
    value: matrix,
    selectors: [
      {
        id: "matrix.scale.entries",
        kind: "entries",
        label: "matrix entries"
      }
    ]
  });
}

function linearMapSemanticAssetObject(
  linearMap: LinearMapObject
): KpSemanticAssetObject<LinearMapObject> {
  return createKpSemanticAssetObject({
    id: linearMap.id,
    objectType: linearMap.type,
    title: linearMap.label,
    value: linearMap,
    selectors: [
      {
        id: "linear-map.scale.map",
        kind: "map",
        label: "linear map"
      }
    ]
  });
}

function vectorSemanticAssetObject(
  vector: VectorObject
): KpSemanticAssetObject<VectorObject> {
  return createKpSemanticAssetObject({
    id: vector.id,
    objectType: vector.type,
    title: vector.label,
    value: vector,
    selectors: [
      {
        id: `${vector.id}.body`,
        kind: "vector",
        label: vector.label
      },
      {
        id: `${vector.id}.x`,
        kind: "component",
        label: "x"
      },
      {
        id: `${vector.id}.y`,
        kind: "component",
        label: "y"
      }
    ]
  });
}

function semanticTransformationRef(transformation: KpSemanticTransformation) {
  return createSemanticTransformationRef({
    id: transformation.id,
    kind: transformation.transformType,
    sourceObjectIds: transformation.sourceObjectIds,
    targetObjectIds: transformation.targetObjectIds,
    preserves: transformation.preserves,
    summary: transformation.title
  });
}

function requireGraph3DObject(
  scene: readonly GraphSceneObject[],
  id: string
): Graph3DObject {
  const graph = scene.find(
    (object): object is Graph3DObject =>
      object.type === "graph-3d" && object.id === id
  );

  if (graph === undefined) {
    throw new Error(`Graph scene missing graph ${id}.`);
  }

  return graph;
}

function requireSurface3DObject(
  scene: readonly GraphSceneObject[],
  id: string
): Surface3DObject {
  const surface = scene.find(
    (object): object is Surface3DObject =>
      object.type === "surface-3d" && object.id === id
  );

  if (surface === undefined) {
    throw new Error(`Graph scene missing surface ${id}.`);
  }

  return surface;
}
