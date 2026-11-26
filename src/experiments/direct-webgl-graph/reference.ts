import { renderGraph3DWebGLShell } from "../../rendering/graph-webgl.ts";
import { disposeGraph3DWebGLShell, hydrateGraph3DWebGLShell, renderGraph3DWebGLShellFrame } from "../../rendering/graph-webgl-three.ts";
import type { KpGraph3DResolvedVisualRoles } from "../../rendering/graph-3d-runtime-protocol.ts";
import { createPilotGraph, createPilotObjects, type PilotView } from "./model.ts";
import type { PilotColors, RGB } from "./renderer.ts";

export function createReference(host: HTMLElement) {
  let shell: HTMLElement | undefined;
  let key = "";
  const hex = (value: RGB) => `#${value.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`;
  return {
    draw(view: PilotView, width: number, height: number, colors: PilotColors) {
      const graph = createPilotGraph(view, width, height);
      const objects = createPilotObjects(view, width, height);
      const role = (color: RGB, opacity = 1, apparentWidth = 1) => ({ color: hex(color), opacity, apparentWidth });
      const visualRoles: KpGraph3DResolvedVisualRoles = {
        background: role(colors.background), axis: role(colors.ink), "axis-accent": role(colors.z),
        "axis-occluded": role(colors.background), surface: role(colors.surface, 0.76),
        "surface-grid": role(colors.ink, view.mesh ? 0.64 : 0),
        "surface-border": role(colors.ink), shadow: role(colors.ink, 0.2)
      };
      // The existing adapter fixes canvas dimensions and clear color at mount.
      // Recreate only for those changes; ordinary samples use its public frame API.
      const nextKey = `${width}:${height}:${hex(colors.background)}`;
      if (!shell || key !== nextKey) {
        if (shell) disposeGraph3DWebGLShell(shell);
        host.innerHTML = renderGraph3DWebGLShell(objects, graph);
        const candidate = host.querySelector<HTMLElement>(".graph-webgl");
        if (!candidate) throw new Error("The reference renderer did not produce a shell.");
        shell = candidate; key = nextKey;
        hydrateGraph3DWebGLShell(shell, objects, { transitionProgress: 1, visualRoles });
      } else {
        renderGraph3DWebGLShellFrame(shell, objects, graph, { transitionProgress: 1, visualRoles });
      }
    },
    dispose() { if (shell) disposeGraph3DWebGLShell(shell); shell = undefined; host.replaceChildren(); }
  };
}
