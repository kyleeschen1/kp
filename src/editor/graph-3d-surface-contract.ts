import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpAnimationRuntimeFrame } from "../animation/runtime-sampler.ts";
import type { KpSemanticObject } from "../semantic/document.ts";
import type {
  Graph3DObject,
  Graph3DSurfaceMode,
  Surface3DObject
} from "../semantic/graph.ts";
import {
  createKpGraph3DRuntimeFrame,
  type KpGraph3DResolvedVisualRoles,
  type KpGraph3DRuntimeFrame
} from "../rendering/graph-3d-runtime-protocol.ts";
import { occludedAxisColor } from "../rendering/graph-svg.ts";
import { KP_WEBGL_CONTEXT_LEASE_LIMIT } from "../rendering/webgl-context-lease-pool.ts";

export const KP_EDITOR_GRAPH_3D_ANIMATION_ID =
  "animation.graph.surface-mode.mesh-to-donut";

export const KP_EDITOR_GRAPH_3D_HOST_SCHEMA =
  "kp.editor-animation.graph-3d-host.v1";

export interface KpEditorGraph3DHostContract {
  readonly schemaVersion: typeof KP_EDITOR_GRAPH_3D_HOST_SCHEMA;
  readonly animationId: typeof KP_EDITOR_GRAPH_3D_ANIMATION_ID;
  readonly slotKind: "graph";
  readonly graphId: string;
  readonly surfaceIds: readonly string[];
  readonly sourceMode: Graph3DSurfaceMode;
  readonly targetMode: Graph3DSurfaceMode;
  readonly capability: {
    readonly modulePath: "../rendering/graph-webgl-three.ts";
    readonly loadWhen: "selected-and-visible";
    readonly backend: "three";
  };
  readonly resource: {
    readonly pool: "kp-webgl-context-lease-pool";
    readonly contextLimit: number;
    readonly leasesPerMountedSurface: 1;
    readonly releaseWhen: readonly [
      "selection-replaced",
      "player-disposed",
      "context-lost"
    ];
  };
  readonly fallback: {
    readonly kind: "semantic-svg";
    readonly ownsPaintUntilWebglReady: true;
  };
  readonly accessibility: {
    readonly role: "img";
    readonly canvasHiddenFromAccessibilityTree: true;
    readonly descriptionTracksRuntimeFrame: true;
  };
}

export interface KpEditorGraph3DHostFrame {
  readonly animationId: typeof KP_EDITOR_GRAPH_3D_ANIMATION_ID;
  readonly runtimeFrameId: string;
  readonly direction: KpAnimationRuntimeFrame["clock"]["direction"];
  readonly requestedProgress: number;
  readonly transitionProgress: number;
  readonly graph: Graph3DObject;
  readonly sourceObjects: readonly KpSemanticObject[];
  readonly targetObjects: readonly KpSemanticObject[];
  readonly description: string;
}

export type KpEditorGraph3DRuntimeFrame = KpGraph3DRuntimeFrame<
  readonly KpSemanticObject[]
>;

export function supportsKpEditorGraph3DAnimation(
  animationId: string
): animationId is typeof KP_EDITOR_GRAPH_3D_ANIMATION_ID {
  return animationId === KP_EDITOR_GRAPH_3D_ANIMATION_ID;
}

export function createKpEditorGraph3DHostContract(
  animation: KpAnimationAsset
): KpEditorGraph3DHostContract {
  if (!supportsKpEditorGraph3DAnimation(animation.id)) {
    throw new Error(
      `Animation ${animation.id} is not the bounded catalogue Graph3D exemplar.`
    );
  }

  const target = animation.renderTargets.find(
    (candidate) =>
      candidate.kind === "graph" &&
      candidate.metadata?.["graphMotionKind"] === "surface-mode-transition"
  );
  if (target === undefined) {
    throw new Error(
      `Animation ${animation.id} must define one surface-mode graph render target.`
    );
  }

  const graphObjects = animation.bundle.objects.filter(
    (object) => object.objectType === "graph-3d"
  );
  const surfaceObjects = animation.bundle.objects.filter(
    (object) => object.objectType === "surface-3d"
  );
  if (graphObjects.length !== 1 || surfaceObjects.length === 0) {
    throw new Error(
      `Animation ${animation.id} must contain one graph-3d object and at least one surface-3d object.`
    );
  }

  const graph = requireGraph3DObject(graphObjects[0]?.value, animation.id);
  const surfaces = surfaceObjects.map((object) =>
    requireSurface3DObject(object.value, object.id)
  );
  if (
    !target.objectIds?.includes(graph.id) ||
    surfaces.some(
      (surface) =>
        surface.graphId !== graph.id || !target.objectIds?.includes(surface.id)
    )
  ) {
    throw new Error(
      `Animation ${animation.id} graph target must own its Graph3D surface objects.`
    );
  }

  const sourceMode = requireSurfaceMode(
    target.metadata?.["sourceMode"],
    `${target.id}.metadata.sourceMode`
  );
  const targetMode = requireSurfaceMode(
    target.metadata?.["targetMode"],
    `${target.id}.metadata.targetMode`
  );
  if (graph.surfaceMode !== sourceMode || sourceMode === targetMode) {
    throw new Error(
      `Animation ${animation.id} must begin at sourceMode and transition to a different targetMode.`
    );
  }

  return {
    schemaVersion: KP_EDITOR_GRAPH_3D_HOST_SCHEMA,
    animationId: KP_EDITOR_GRAPH_3D_ANIMATION_ID,
    slotKind: "graph",
    graphId: graph.id,
    surfaceIds: surfaces.map((surface) => surface.id),
    sourceMode,
    targetMode,
    capability: {
      modulePath: "../rendering/graph-webgl-three.ts",
      loadWhen: "selected-and-visible",
      backend: "three"
    },
    resource: {
      pool: "kp-webgl-context-lease-pool",
      contextLimit: KP_WEBGL_CONTEXT_LEASE_LIMIT,
      leasesPerMountedSurface: 1,
      releaseWhen: [
        "selection-replaced",
        "player-disposed",
        "context-lost"
      ]
    },
    fallback: {
      kind: "semantic-svg",
      ownsPaintUntilWebglReady: true
    },
    accessibility: {
      role: "img",
      canvasHiddenFromAccessibilityTree: true,
      descriptionTracksRuntimeFrame: true
    }
  };
}

export function projectKpEditorGraph3DHostFrame(input: {
  readonly animation: KpAnimationAsset;
  readonly runtimeFrame: KpAnimationRuntimeFrame;
}): KpEditorGraph3DHostFrame {
  const contract = createKpEditorGraph3DHostContract(input.animation);
  if (input.runtimeFrame.animationId !== contract.animationId) {
    throw new Error(
      `Runtime frame ${input.runtimeFrame.id} belongs to ${input.runtimeFrame.animationId}, not ${contract.animationId}.`
    );
  }

  const graph = requireGraph3DObject(
    input.animation.bundle.objects.find(
      (object) => object.id === contract.graphId
    )?.value,
    contract.graphId
  );
  const transitionProgress = input.runtimeFrame.clock.direction === "rewind"
    ? 1 - input.runtimeFrame.clock.progress
    : input.runtimeFrame.clock.progress;
  const sourceGraph = { ...graph, surfaceMode: contract.sourceMode };
  const targetGraph = { ...graph, surfaceMode: contract.targetMode };
  const semanticObjects = input.animation.bundle.objects.map((object) =>
    object.value as KpSemanticObject
  );

  return {
    animationId: contract.animationId,
    runtimeFrameId: input.runtimeFrame.id,
    direction: input.runtimeFrame.clock.direction,
    requestedProgress: input.runtimeFrame.clock.progress,
    transitionProgress,
    graph: targetGraph,
    sourceObjects: replaceGraph(semanticObjects, sourceGraph),
    targetObjects: replaceGraph(semanticObjects, targetGraph),
    description:
      `${graph.label}: ${contract.sourceMode} to ${contract.targetMode}, ` +
      `${Math.round(transitionProgress * 100)} percent complete.`
  };
}

export function projectKpEditorGraph3DRuntimeFrame(
  frame: KpEditorGraph3DHostFrame
): KpEditorGraph3DRuntimeFrame {
  const { graph } = frame;
  return createKpGraph3DRuntimeFrame({
    identity: {
      animationId: frame.animationId,
      frameId: frame.runtimeFrameId,
      graphId: graph.id
    },
    clock: {
      direction: frame.direction,
      requestedProgress: frame.requestedProgress,
      visualProgress: frame.transitionProgress
    },
    stage: {
      width: graph.width,
      height: graph.height,
      anchors: {
        plotOrigin: graph.camera.origin,
        cameraTarget: [0, 0, 0]
      }
    },
    camera: {
      projection: "orthographic",
      azimuthDegrees: graph.camera.azimuthDegrees,
      elevationDegrees: graph.camera.elevationDegrees,
      scale: graph.camera.scale
    },
    theme: {
      id: "kp.graph.paper.v1",
      roles: currentGraph3DVisualRoles(graph)
    },
    scene: {
      source: frame.sourceObjects,
      target: frame.targetObjects
    },
    accessibility: { description: frame.description }
  });
}

function currentGraph3DVisualRoles(
  graph: Graph3DObject
): KpGraph3DResolvedVisualRoles {
  return Object.freeze({
    background: role("#fffdf8", 1, 0),
    axis: role("#394756", 1, 1),
    "axis-accent": role("#2b6f59", 1, 1),
    "axis-occluded": role(
      occludedAxisColor(graph.occludedAxisLightness),
      0.62,
      1
    ),
    surface: role("#7faabd", 0.76, 0),
    "surface-grid": role("#53798a", 0.64, 1),
    "surface-border": role("#315e6d", 1, 1),
    shadow: role("#0f172a", graph.shadow.opacity, 0)
  });
}

function role(
  color: string,
  opacity: number,
  apparentWidth: number
) {
  return Object.freeze({ color, opacity, apparentWidth });
}

function replaceGraph(
  objects: readonly KpSemanticObject[],
  graph: Graph3DObject
): readonly KpSemanticObject[] {
  return objects.map((object) => object.id === graph.id ? graph : object);
}

function requireGraph3DObject(
  value: unknown,
  ownerId: string
): Graph3DObject {
  if (!isRecord(value) || value["type"] !== "graph-3d") {
    throw new Error(`${ownerId} must contain a valid Graph3D value.`);
  }
  return value as unknown as Graph3DObject;
}

function requireSurface3DObject(
  value: unknown,
  ownerId: string
): Surface3DObject {
  if (!isRecord(value) || value["type"] !== "surface-3d") {
    throw new Error(`${ownerId} must contain a valid Surface3D value.`);
  }
  return value as unknown as Surface3DObject;
}

function requireSurfaceMode(
  value: unknown,
  path: string
): Graph3DSurfaceMode {
  if (value !== "mesh" && value !== "donut" && value !== "hyperplanes") {
    throw new Error(`${path} must name a supported Graph3D surface mode.`);
  }
  return value;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}
