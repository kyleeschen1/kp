import { createGraph3DObject } from "../semantic/graph.ts";
import { projectGraphPoints3DToWebGLScreen } from "../rendering/graph-webgl.ts";
import { createSaddleProjection } from "./geometry.ts";
import { createSaddleRenderer, type SaddleColors } from "./gpu.ts";
import { createSaddlePlayback, saddleSource, type PreparedSaddleAnimation, type SaddlePlaybackSnapshot } from "./playback.ts";

export type PlayerRendererState = { readonly status: "ready" } | { readonly status: "unavailable"; readonly reason: string };
const mounted = new WeakSet<HTMLElement>();
export const saddlePlayerColors: SaddleColors = Object.freeze({
  background: [0.965, 0.945, 0.902] as const, ink: [0.19, 0.20, 0.18] as const,
  grid: [0.49, 0.47, 0.42] as const, surface: [0.67, 0.73, 0.60] as const,
  x: [0.64, 0.24, 0.20] as const, y: [0.26, 0.42, 0.56] as const, z: [0.66, 0.48, 0.16] as const,
  section: [0.64, 0.24, 0.20] as const, plane: [0.26, 0.42, 0.56] as const
});

/** A bounded saddle adapter. Hosts own sizing/controls; this owner releases only its own DOM and GPU lease. */
export function mountSaddlePlayer(host: HTMLElement, options: {
  readonly animation: PreparedSaddleAnimation; readonly initialProgress?: number;
  readonly colors?: SaddleColors; readonly onChange?: (snapshot: SaddlePlaybackSnapshot) => void;
}) {
  if (mounted.has(host)) throw new Error("Dispose the existing player before mounting in this host again.");
  const source = saddleSource(options.animation), doc = host.ownerDocument, ownerWindow = doc.defaultView;
  if (!ownerWindow) throw new Error("The player needs a live document window.");
  const colors = options.colors ?? saddlePlayerColors;
  const playback = createSaddlePlayback(options.animation, {
    ownerWindow, ...(options.initialProgress === undefined ? {} : { initialProgress: options.initialProgress })
  });
  const element = doc.createElement("div"); element.className = "kp-saddle-player";
  element.style.cssText = "position:relative;width:100%;height:100%;min-height:100px;overflow:hidden";
  const canvas = doc.createElement("canvas"); canvas.style.cssText = "display:block;width:100%;height:100%";
  canvas.setAttribute("role", "img"); canvas.setAttribute("aria-label", options.animation.title);
  const description = doc.createElement("p"); description.style.cssText = "position:absolute;left:12px;bottom:0;margin:0 0 8px;font:inherit;font-size:.8em";
  const notice = doc.createElement("p"); notice.setAttribute("role", "status"); notice.hidden = true;
  const labels = ["x", "y", "z"].map(axis => { const node = doc.createElement("span"); node.textContent = axis;
    node.style.cssText = "position:absolute;pointer-events:none;font:inherit;background:none"; element.append(node); return node; });
  element.prepend(canvas); element.append(description, notice); host.append(element); mounted.add(host);
  let disposed = false, visible = true;
  let rendererState: PlayerRendererState = { status: "ready" };
  const unavailable = (reason: string) => {
    rendererState = { status: "unavailable", reason }; playback.pause();
    canvas.hidden = true; labels.forEach(label => label.hidden = true);
    notice.hidden = false; notice.textContent = reason;
    element.dataset["renderer"] = "unavailable";
  };
  const result = createSaddleRenderer(canvas, () => {
    if (!disposed) unavailable("The graphics context was lost. Remount to retry; the equation remains available.");
  }, source.geometry, source.grid);
  if (result.status === "unavailable") unavailable(result.reason);
  else element.dataset["renderer"] = "ready";
  function render() {
    if (disposed) return;
    const current = playback.snapshot();
    element.dataset["progress"] = String(current.progress);
    element.dataset["denominator"] = String(current.frame.denominator);
    element.dataset["playback"] = current.status;
    description.textContent = `z = (x² − y²) / ${Number(current.frame.denominator.toFixed(2))}`;
    canvas.setAttribute("aria-label", current.frame.accessibilityDescription);
    const { width, height } = element.getBoundingClientRect();
    if (visible && width > 0 && height > 0 && result.status === "ready" && rendererState.status === "ready") {
      const camera = source.asset.trace.context.camera;
      const graph = createGraph3DObject({ id: current.frame.graphIdentityId, label: options.animation.title,
        xAxisId: "saddle-player:x", yAxisId: "saddle-player:y", zAxisId: "saddle-player:z",
        xDomain: [-3, 3], yDomain: [-3, 3], zDomain: [-3, 3], width, height, surfaceMode: "mesh", surfaceQuality: "balanced",
        camera: { azimuthDegrees: camera.azimuthDegrees, elevationDegrees: camera.elevationDegrees,
          origin: [width / 2, height / 2], scale: Math.min(width, height) / 9.3 } });
      result.renderer.draw({ projection: createSaddleProjection(graph), denominator: current.frame.denominator,
        lit: true, mesh: true, planes: false, surface: { kind: "slab", lower: -3, upper: 3 } }, width, height, colors);
      const points = projectGraphPoints3DToWebGLScreen(graph,
        [{ x: 3.65, y: 0, z: 0 }, { x: 0, y: 3.65, z: 0 }, { x: 0, y: 0, z: 3.65 }]);
      labels.forEach((label, index) => { const point = points[index]!;
        label.style.left = `${point.x}px`; label.style.top = `${point.y}px`; });
    }
    options.onChange?.(current);
  }
  const stop = playback.subscribe(render);
  const resize = new ResizeObserver(render); resize.observe(element);
  const visibility = new IntersectionObserver(entries => {
    if (disposed) return;
    visible = entries[0]?.isIntersecting ?? false;
    if (!visible) playback.pause(); else render();
  }); visibility.observe(element);
  const hidden = () => { if (doc.hidden && !disposed) playback.pause(); };
  doc.addEventListener("visibilitychange", hidden);
  render();
  return {
    snapshot: playback.snapshot,
    seek: playback.seek,
    pause: playback.pause,
    play(direction: "forward" | "rewind" = "forward") {
      if (disposed) throw new Error("This player has been disposed.");
      if (rendererState.status !== "ready") return;
      if (ownerWindow.matchMedia("(prefers-reduced-motion: reduce)").matches) playback.seek(direction === "forward" ? 1 : 0);
      else if (visible && !doc.hidden) playback.play(direction);
    },
    resize: render,
    inspect() { return { renderer: rendererState, ...(result.status === "ready" ? { gpu: result.renderer.inspect() } : {}) }; },
    dispose() {
      if (disposed) return; disposed = true;
      stop(); playback.dispose(); resize.disconnect(); visibility.disconnect();
      doc.removeEventListener("visibilitychange", hidden);
      if (result.status === "ready") result.renderer.dispose();
      element.remove(); mounted.delete(host);
    }
  };
}
export type SaddlePlayer = ReturnType<typeof mountSaddlePlayer>;
