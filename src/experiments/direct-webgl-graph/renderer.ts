import { createSaddleRenderer, type SaddleColors, type SaddleRenderer } from "../../animation-player/gpu.ts";
import { createGridGeometry, createPilotProjection, createSaddleGeometry, type PilotView } from "./model.ts";
import { createSectionGeometry, resolveSectionFrame } from "./section.ts";

export type { RGB } from "../../animation-player/gpu.ts";
export type PilotColors = SaddleColors;
export interface PilotRenderer {
  draw(view: PilotView, width: number, height: number, colors: PilotColors): void;
  inspect: SaddleRenderer["inspect"];
  dispose(): void;
}
export type PilotRendererResult = { status: "ready"; renderer: PilotRenderer } | { status: "unavailable"; reason: string };

/** The experiment retains camera/section policy; the shared pipeline owns GPU resources. */
export function createPilotRenderer(canvas: HTMLCanvasElement, onLost: () => void): PilotRendererResult {
  const result = createSaddleRenderer(canvas, onLost, createSaddleGeometry(),
    new Float32Array([...createGridGeometry(), ...createSectionGeometry()]));
  if (result.status !== "ready") return result;
  let disposed = false;
  return { status: "ready", renderer: {
    draw(view, width, height, colors) {
      if (disposed) return;
      const projection = createPilotProjection(view, width, height);
      const section = resolveSectionFrame(view.section, view);
      const inspecting = view.example === "section";
      result.renderer.draw({
        projection, denominator: view.denominator, lit: view.lit, mesh: view.mesh,
        planes: view.example === "grid" || view.planes,
        surface: view.example === "grid" ? { kind: "absent" } : inspecting
          ? section.surface : { kind: "slab", lower: -3, upper: 3 },
        ...(inspecting ? { section: { y: view.section.y, context: section.context, heightOffset: section.heightOffset } } : {})
      }, width, height, colors);
    },
    inspect: () => result.renderer.inspect(),
    dispose: () => { if (!disposed) { disposed = true; result.renderer.dispose(); } }
  } };
}
