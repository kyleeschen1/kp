import { projectGraphPoints3DToWebGLScreen } from "../rendering/graph-webgl.ts";
import { createSaddleProjection } from "./geometry.ts";
import { createSaddleRenderer, type SaddleColors } from "./gpu.ts";
import { saddlePlayerColors, type PlayerRendererState } from "./mount.ts";
import { createSectionPlayback, type SectionPlaybackSnapshot } from "./section-playback.ts";
import { sectionFallback, sectionGraph } from "./section-projection.ts";
import { describeSaddleSection, sectionGeometry, type PreparedSaddleSection, type SaddleSectionView } from "./section-source.ts";

const mounted = new WeakSet<HTMLElement>();
export function mountSaddleSection(host: HTMLElement, options: {
  readonly section: PreparedSaddleSection; readonly view?: SaddleSectionView; readonly colors?: SaddleColors;
  readonly onChange?: (snapshot: SectionPlaybackSnapshot) => void;
}) {
  if (mounted.has(host)) throw new Error("Dispose the existing section before mounting here again.");
  const doc = host.ownerDocument, win = doc.defaultView;
  if (!win) throw new Error("Section playback needs a live document window.");
  const playback = createSectionPlayback(options.section, { ownerWindow: win, ...(options.view ? { view: options.view } : {}) });
  let colors = options.colors ?? saddlePlayerColors;
  const element = doc.createElement("div"); element.className = "kp-section-player";
  element.style.cssText = "position:relative;width:100%;height:100%;overflow:hidden";
  const canvas = doc.createElement("canvas"); canvas.style.cssText = "width:100%;height:100%";
  canvas.setAttribute("role", "img");
  const fallback = doc.createElement("div"); fallback.style.cssText = "position:absolute;inset:0";
  const notice = doc.createElement("p"); notice.setAttribute("role", "status");
  notice.style.cssText = "position:absolute;bottom:0;left:1em;right:1em;margin:0;font:inherit";
  const labels = ["x", "y", "z"].map(axis => { const node = doc.createElement("span"); node.dataset["axis"] = axis;
    node.style.cssText = "position:absolute;pointer-events:none;font:inherit;background:none;transform:translate(-50%,-50%)";
    return node; });
  element.append(canvas, fallback, ...labels, notice); host.append(element); mounted.add(host);
  let disposed = false, visible = true, width = 0, height = 0;
  let rendererState: PlayerRendererState = { status: "ready" };
  const unavailable = (reason: string) => {
    if (disposed) return;
    rendererState = { status: "unavailable", reason }; playback.pause();
  };
  const geometry = sectionGeometry();
  const result = createSaddleRenderer(canvas, () => unavailable("Graphics context lost. The static section remains; remount to retry."), geometry.mesh, geometry.lines);
  if (result.status === "unavailable") rendererState = { status: "unavailable", reason: result.reason };
  function render() {
    if (disposed) return;
    const state = playback.snapshot(), ready = rendererState.status === "ready";
    element.dataset["renderer"] = rendererState.status;
    element.dataset["inspection"] = String(state.view.inspection);
    element.dataset["surface"] = state.frame.surface.kind;
    element.dataset["playback"] = state.status;
    canvas.hidden = !ready; fallback.hidden = ready; notice.hidden = ready;
    notice.textContent = rendererState.status === "unavailable" ? rendererState.reason : "";
    const equation = describeSaddleSection(state.source);
    canvas.setAttribute("aria-label", equation);
    if (visible && width > 0 && height > 0) {
      const graph = sectionGraph(state, width, height);
      if (ready && result.status === "ready") {
        result.renderer.draw({ projection: createSaddleProjection(graph), denominator: state.source.denominator,
          lit: true, mesh: true, planes: false, surface: state.frame.surface,
          section: { y: state.source.y, context: state.frame.context, heightOffset: state.frame.heightOffset } }, width, height, colors);
      } else fallback.innerHTML = sectionFallback(graph, state.source.y, state.source.denominator, state.frame.heightOffset, colors);
      const points = projectGraphPoints3DToWebGLScreen(graph, [{ x: 3.55, y: state.source.y, z: 0 },
        { x: -2.6, y: state.source.y, z: 3.45 }, { x: 0, y: state.source.y, z: 3.55 }]);
      labels.forEach((label, i) => { label.textContent = i === 1 ? `y = ${state.source.y}` : i === 0 ? "x" : "z";
        label.style.left = `${points[i]!.x}px`; label.style.top = `${points[i]!.y}px`;
        const color = i === 0 ? colors.x : i === 1 ? colors.y : colors.z;
        label.style.color = `rgb(${color.map(n => Math.round(n * 255)).join(",")})`; });
    }
    options.onChange?.(state);
  }
  const stop = playback.subscribe(render);
  // Resize owns geometry measurement; animation frames only change uniforms and native label positions.
  const resize = new ResizeObserver(entries => { if (disposed) return;
    const box = entries[0]?.contentRect; if (box) { width = Math.min(8192, box.width); height = Math.min(8192, box.height); render(); } });
  resize.observe(element);
  const intersection = new IntersectionObserver(entries => { if (disposed) return;
    visible = entries[0]?.isIntersecting ?? false; if (!visible) playback.pause(); else render(); });
  intersection.observe(element);
  const hidden = () => { if (doc.hidden && !disposed) playback.pause(); };
  doc.addEventListener("visibilitychange", hidden);
  render();
  return {
    snapshot: playback.snapshot, subscribe: playback.subscribe, seek: playback.seek, pause: playback.pause,
    updateSource: playback.updateSource, setCamera: playback.setCamera,
    play(direction: "forward" | "rewind" = "forward") {
      if (disposed) throw new Error("This section player has been disposed.");
      if (rendererState.status !== "ready" || win.matchMedia("(prefers-reduced-motion: reduce)").matches) playback.seek(direction === "forward" ? 1 : 0);
      else if (visible && !doc.hidden) playback.play(direction);
    },
    setColors(next: SaddleColors) { if (disposed) throw new Error("This section player has been disposed."); colors = next; render(); },
    inspect() { return { renderer: rendererState, ...(result.status === "ready" ? { gpu: result.renderer.inspect() } : {}) }; },
    dispose() { if (disposed) return; disposed = true; stop(); playback.dispose(); resize.disconnect(); intersection.disconnect();
      doc.removeEventListener("visibilitychange", hidden); if (result.status === "ready") result.renderer.dispose(); element.remove(); mounted.delete(host); }
  };
}
export type SaddleSectionPlayer = ReturnType<typeof mountSaddleSection>;
