import type { KpSemanticObject } from "../semantic/document.ts";
import {
  createAxis3DObject,
  createGraph3DObject,
  createSaddleSurface3D,
  graph3DSurfaceResolution,
  type Graph3DObject
} from "../semantic/graph.ts";
import type { KpGraph3DSaddleParameterRuntimeFrame } from
  "../animation/graph-3d-saddle-parameter-asset.ts";
import type {
  KpGraph3DSaddleParameterContext,
  KpGraph3DSaddleParameterState
} from "../semantic/graph-3d-saddle-parameter-trace.ts";
import {
  createKpGraph3DRuntimeFrame,
  type KpGraph3DResolvedVisualRoles,
  type KpGraph3DRuntimeFrame
} from "./graph-3d-runtime-protocol.ts";
import {
  renderGraph3DWebGLFallback,
  renderGraph3DWebGLShell
} from "./graph-webgl.ts";
import { renderLatexToHtml } from "./katex-adapter.ts";
import { projectGraphPoint3D } from "./projection.ts";

export const KP_GRAPH_3D_SADDLE_PAINT_SCHEMA =
  "kp.graph-3d-saddle-parameter-paint.v1" as const;
export const KP_GRAPH_3D_SADDLE_PAINT_WIDTH = 720;
export const KP_GRAPH_3D_SADDLE_PAINT_HEIGHT = 460;

export type KpGraph3DSaddlePaintRuntimeFrame = KpGraph3DRuntimeFrame<
  readonly KpSemanticObject[]
>;

export interface KpGraph3DSaddlePaintHostFrame {
  readonly animationId: string;
  readonly runtimeFrameId: string;
  readonly direction: "forward" | "rewind";
  readonly requestedProgress: number;
  readonly visualProgress: number;
  readonly source: Readonly<{
    graphId: string;
    surface: KpGraph3DSaddleParameterState;
    context: KpGraph3DSaddleParameterContext;
  }>;
  readonly semanticFrame: KpGraph3DSaddleParameterRuntimeFrame;
  readonly description: string;
}

export const kpGraph3DSaddlePaintVisualRoles:
KpGraph3DResolvedVisualRoles = deepFreeze({
  background: { color: "#fbfaf7", opacity: 1, apparentWidth: 0 },
  axis: { color: "#46535f", opacity: 0.68, apparentWidth: 1 },
  "axis-accent": {
    color: "#275f70",
    opacity: 0.92,
    apparentWidth: 1.15
  },
  "axis-occluded": {
    color: "#88949c",
    opacity: 0.42,
    apparentWidth: 1
  },
  surface: { color: "#6faabd", opacity: 0.86, apparentWidth: 0 },
  "surface-grid": {
    color: "#356c7c",
    opacity: 0.54,
    apparentWidth: 0.85
  },
  "surface-border": {
    color: "#234f5d",
    opacity: 0.86,
    apparentWidth: 1.15
  },
  shadow: { color: "#12202a", opacity: 0.14, apparentWidth: 0 }
});

export function projectKpGraph3DSaddlePaintRuntimeFrame(input: {
  readonly hostFrame: KpGraph3DSaddlePaintHostFrame;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
}): KpGraph3DSaddlePaintRuntimeFrame {
  const width = input.width ?? KP_GRAPH_3D_SADDLE_PAINT_WIDTH;
  const height = input.height ?? KP_GRAPH_3D_SADDLE_PAINT_HEIGHT;
  const camera = input.hostFrame.source.context.camera;
  const graphCamera = {
    azimuthDegrees: camera.azimuthDegrees,
    elevationDegrees: camera.elevationDegrees,
    scale: 58,
    origin: [width / 2, height * 0.54] as const
  };
  const source = materializeScene({
    denominator: input.hostFrame.source.surface.denominator,
    width,
    height,
    camera: graphCamera,
    hostFrame: input.hostFrame
  });
  const current = materializeScene({
    denominator: input.hostFrame.semanticFrame.denominator,
    width,
    height,
    camera: graphCamera,
    hostFrame: input.hostFrame
  });

  return createKpGraph3DRuntimeFrame({
    identity: {
      animationId: input.hostFrame.animationId,
      frameId: input.hostFrame.runtimeFrameId,
      graphId: input.hostFrame.source.graphId
    },
    clock: {
      direction: input.hostFrame.direction,
      requestedProgress: input.hostFrame.requestedProgress,
      visualProgress: input.hostFrame.visualProgress
    },
    stage: {
      width,
      height,
      anchors: {
        plotOrigin: graphCamera.origin,
        cameraTarget: [0, 0, 0]
      }
    },
    camera: {
      projection: camera.projection,
      azimuthDegrees: camera.azimuthDegrees,
      elevationDegrees: camera.elevationDegrees,
      scale: graphCamera.scale
    },
    theme: {
      id: "kp.graph.saddle-paper.v1",
      roles: kpGraph3DSaddlePaintVisualRoles
    },
    // The protocol target is the current paint state. Endpoint truth remains
    // on the host frame, so neither SVG nor WebGL has to interpolate semantics.
    scene: { source, target: current },
    accessibility: { description: input.hostFrame.description }
  });
}

export function renderKpGraph3DSaddlePaintShell(
  frame: KpGraph3DSaddlePaintRuntimeFrame
): string {
  const graph = requireGraph(frame.scene.target, frame.identity.graphId);
  return `<div class="kp-graph-3d-saddle-stage" data-kp-graph-3d-saddle-paint="${KP_GRAPH_3D_SADDLE_PAINT_SCHEMA}" data-kp-graph-3d-salience-target="surface" data-kp-saddle-denominator="${currentDenominator(frame)}" data-kp-camera-state="camera.graph-3d.saddle-parameter.fixed">
    ${renderGraph3DWebGLShell(frame.scene.target, graph)}
    <div class="kp-graph-3d-saddle-labels" data-kp-graph-3d-saddle-labels aria-hidden="true">
      ${renderKpGraph3DSaddleKatexLabels(frame)}
    </div>
  </div>`;
}

export function renderKpGraph3DSaddleSvgFallback(
  frame: KpGraph3DSaddlePaintRuntimeFrame
): string {
  const graph = requireGraph(frame.scene.target, frame.identity.graphId);
  const svg = renderGraph3DWebGLFallback(frame.scene.target, graph);
  if (/<text(?:\s|>)/u.test(svg)) throw new Error(
    "Graph3D saddle fallback cannot emit raw SVG text under KaTeX-only paint."
  );
  return svg;
}

export function renderKpGraph3DSaddleKatexLabels(
  frame: KpGraph3DSaddlePaintRuntimeFrame
): string {
  const graph = requireGraph(frame.scene.target, frame.identity.graphId);
  const denominator = currentDenominator(frame);
  const axisLabels = ([
    ["x", { x: graph.xDomain[1], y: 0, z: 0 }],
    ["y", { x: 0, y: graph.yDomain[1], z: 0 }],
    ["z", { x: 0, y: 0, z: graph.zDomain[1] }]
  ] as const).map(([latex, point]) => {
    const projected = projectGraphPoint3D(graph, point);
    const left = clamp(projected.x / graph.width * 100, 4, 94);
    const top = clamp(projected.y / graph.height * 100, 6, 92);
    return latexLabel(latex, "axis", `left:${format(left)}%;top:${format(top)}%`);
  }).join("");
  return `${latexLabel(
    String.raw`z=\frac{x^2-y^2}{a}`,
    "equation"
  )}${latexLabel(
    `a=${format(denominator)}`,
    "parameter"
  )}${axisLabels}`;
}

function materializeScene(input: {
  readonly denominator: number;
  readonly width: number;
  readonly height: number;
  readonly camera: Graph3DObject["camera"];
  readonly hostFrame: KpGraph3DSaddlePaintHostFrame;
}): readonly KpSemanticObject[] {
  const context = input.hostFrame.source.context;
  const graph = createGraph3DObject({
    id: context.graphIdentityId,
    label: "Saddle surface",
    xAxisId: context.xAxisId,
    yAxisId: context.yAxisId,
    zAxisId: context.zAxisId,
    xDomain: context.xDomain,
    yDomain: context.yDomain,
    zDomain: context.zDomain,
    width: input.width,
    height: input.height,
    surfaceMode: "mesh",
    surfaceQuality: "balanced",
    camera: input.camera
  });
  const resolution = graph3DSurfaceResolution(graph.surfaceQuality);
  const axes = ([
    [context.xAxisId, "x", graph.xDomain],
    [context.yAxisId, "y", graph.yDomain],
    [context.zAxisId, "z", graph.zDomain]
  ] as const).map(([id, orientation, domain]) => createAxis3DObject({
    id,
    graphId: graph.id,
    label: orientation,
    orientation,
    domain,
    tickStep: 1
  }));
  const surface = createSaddleSurface3D({
    id: input.hostFrame.source.surface.surfaceIdentityId,
    graphId: graph.id,
    denominator: input.denominator,
    xDomain: graph.xDomain,
    yDomain: graph.yDomain,
    xSampleCount: resolution.xSampleCount,
    ySampleCount: resolution.ySampleCount
  });
  return deepFreeze([graph, ...axes, surface] as KpSemanticObject[]);
}

function requireGraph(
  objects: readonly KpSemanticObject[],
  graphId: string
): Graph3DObject {
  const graph = objects.find(
    (object): object is Graph3DObject =>
      object.type === "graph-3d" && object.id === graphId
  );
  if (graph === undefined) throw new Error(
    `Graph3D saddle paint frame lacks ${graphId}.`
  );
  return graph;
}

function currentDenominator(frame: KpGraph3DSaddlePaintRuntimeFrame): number {
  const surface = frame.scene.target.find((object) =>
    object.type === "surface-3d" &&
    object.id === "surface.graph-3d.saddle-parameter.primary"
  );
  if (surface?.type !== "surface-3d" ||
      surface.parameterization?.kind !== "saddle") throw new Error(
    "Graph3D saddle paint frame lacks its parameterized surface."
  );
  return surface.parameterization.denominator;
}

function latexLabel(
  latex: string,
  role: "axis" | "equation" | "parameter",
  style?: string
): string {
  return `<span class="kp-graph-3d-saddle-label kp-graph-3d-saddle-label--${role}" data-kp-latex="${escapeHtml(latex)}" data-kp-graph-label-role="${role}"${style === undefined ? "" : ` style="${style}"`}>${renderLatexToHtml(latex, {
    displayMode: false,
    output: "htmlAndMathml"
  })}</span>`;
}

function format(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/u, "").replace(/\.$/u, "");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
