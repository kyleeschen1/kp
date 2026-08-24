import type { Graph3DObject } from "../semantic/graph.ts";
import {
  disposeGraph3DWebGLShell,
  hydrateGraph3DWebGLShell,
  renderGraph3DWebGLShellFrame,
  type Graph3DWebGLHydrationOutcome
} from "./graph-webgl-three.ts";
import type { KpGraph3DSaddlePaintRuntimeFrame } from
  "./graph-3d-saddle-parameter-paint.ts";

export function hydrateKpGraph3DSaddleWebGL(
  shell: HTMLElement,
  frame: KpGraph3DSaddlePaintRuntimeFrame
): Graph3DWebGLHydrationOutcome {
  requireGraph(frame);
  return hydrateGraph3DWebGLShell(shell, frame.scene.target, {
    visualRoles: frame.theme.roles
  });
}

export function renderKpGraph3DSaddleWebGLFrame(
  shell: HTMLElement,
  frame: KpGraph3DSaddlePaintRuntimeFrame
): boolean {
  const graph = requireGraph(frame);
  return renderGraph3DWebGLShellFrame(shell, frame.scene.target, graph, {
    visualRoles: frame.theme.roles
  });
}

export function disposeKpGraph3DSaddleWebGL(shell: HTMLElement): void {
  disposeGraph3DWebGLShell(shell);
}

function requireGraph(
  frame: KpGraph3DSaddlePaintRuntimeFrame
): Graph3DObject {
  const graph = frame.scene.target.find(
    (object): object is Graph3DObject =>
      object.type === "graph-3d" && object.id === frame.identity.graphId
  );
  if (graph === undefined) throw new Error(
    `Graph3D saddle port lacks ${frame.identity.graphId}.`
  );
  return graph;
}
