import "./style.css";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { renderGraph3DWebGLFallback } from "../../rendering/graph-webgl.ts";
import { inspectKpWebglContextLeasePool } from "../../rendering/webgl-context-lease-pool.ts";
import { createPilotGraph, createPilotObjects, INITIAL_VIEW, projectPilotLabels, type PilotView } from "./model.ts";
import { createPilotRenderer, type PilotColors, type PilotRenderer, type RGB } from "./renderer.ts";
import type { createReference } from "./reference.ts";
import { createSectionControls, SECTION_CONTROLS } from "./section-controls.ts";
import { renderSectionFallback } from "./section-fallback.ts";
import { SECTION_IDS } from "./section.ts";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Missing graph experiment host.");
app.innerHTML = `
  <h1>A surface and its sections.</h1>
  <p class="intro">Rotate the coordinates. Slice a saddle. Follow its parabola into 2D and back, using the same mathematics and camera.</p>
  <div class="toolbar">
    <div class="tabs" aria-label="Example"><button id="grid" aria-pressed="false">3D grid</button><button id="saddle" aria-pressed="true">Saddle surface</button><button id="section" aria-pressed="false">Cross-section</button></div>
    <button id="theme" aria-pressed="false">Dark theme</button>
  </div>
  <div class="stage" id="direct-stage" data-status="pending">
    <canvas id="direct-canvas" tabindex="0" role="img" aria-label="Interactive coordinate grid and saddle surface" aria-describedby="navigation-hint"></canvas>
    <div class="static-view" hidden></div>
    <span class="axis-label" data-axis="x">x</span><span class="axis-label" data-axis="y">y</span><span class="axis-label" data-axis="z">z</span>
    <span class="stage-note">Direct WebGL · one unit per grid square</span>
  </div>
  <p class="hint" id="navigation-hint">Drag to rotate · focus the graph and use arrow keys · Home resets the view</p>
  <p class="error" id="status" role="status" hidden></p><button id="retry" hidden>Retry graphics</button>
  ${SECTION_CONTROLS}
  <div class="controls" id="saddle-controls">
    <span class="formula"><var>z</var> = (<var>x</var>² − <var>y</var>²) / <var>d</var></span>
    <label><var>d</var> <input id="denominator" type="range" min="4" max="8" step="0.01" value="4" aria-label="Saddle denominator"><output id="denominator-value">4.00</output></label>
    <button id="play">Play</button><button id="reverse">Reverse</button>
  </div>
  <div class="controls options">
    <label><input id="lighting" type="checkbox" checked> Smooth lighting</label>
    <label><input id="mesh" type="checkbox" checked> Surface grid</label>
    <label><input id="planes" type="checkbox"> Coordinate planes</label>
    <button id="reset">Reset view</button><button id="compare" aria-expanded="false">Compare current renderer</button>
  </div>
  <section class="reference" id="reference" hidden aria-label="Current Three.js comparison">
    <h2>The current renderer</h2>
    <p class="reference-note">Same equation and camera. The existing Three.js adapter uses an unlit, translucent mesh and its native sampling and axes; the three coordinate-plane grids belong to the experiment above. Drag above to compare viewpoints.</p>
    <div class="stage" id="reference-stage"></div>
  </section>
  <details class="diagnostics"><summary>What is being computed?</summary>
    <p id="measurements"></p>
    <p>The saddle’s positions, gradients and section basis are sampled once. Curvature, slice position and camera changes update shader parameters; the GPU shades the retained triangles. Idle and offscreen views stop drawing. Labels and controls remain ordinary HTML.</p>
    <p id="loading">Three.js has not been requested. It loads only when you open the comparison.</p>
    <p>Submission time measures JavaScript and WebGL command submission, not GPU completion. This pilot does not establish that WebGL is inherently faster than Three.js.</p>
  </details>`;

function get<T extends HTMLElement>(selector: string): T {
  const value = document.querySelector<T>(selector);
  if (!value) throw new Error(`Missing graph control: ${selector}`);
  return value;
}
const stage = get("#direct-stage"), referenceStage = get("#reference-stage");
const denominator = get<HTMLInputElement>("#denominator"), denominatorValue = get<HTMLOutputElement>("#denominator-value");
const play = get<HTMLButtonElement>("#play"), status = get("#status"), retry = get<HTMLButtonElement>("#retry");
const compare = get<HTMLButtonElement>("#compare"), referenceSection = get("#reference");
const listeners = new AbortController();
let canvasListeners = new AbortController();
let canvas = get<HTMLCanvasElement>("#direct-canvas");
let view: PilotView = { ...INITIAL_VIEW, example: new URL(location.href).searchParams.get("example") === "section" ? "section" : "saddle" };
let renderer: PilotRenderer | undefined;
let reference: ReturnType<typeof createReference> | undefined;
let referenceRequest = 0, pendingFrame: number | undefined;
let disposed = false, directVisible = true, referenceVisible = false;
const clock = createKpReaderTimelinePlaybackClock({ id: "direct-webgl-saddle-pilot", durationMs: 5000 });
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const sizes = (element: HTMLElement) => ({ width: Math.max(1, element.clientWidth), height: Math.max(1, element.clientHeight) });
const sectionControls = createSectionControls({ host: app, read: () => view,
  update: (section) => { view = { ...view, section }; invalidate(); },
  beforeChange: () => { clock.pause(); play.textContent = "Play"; },
  reduced: () => reduced.matches, available: () => renderer !== undefined
});

function readColors(): PilotColors {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string): RGB => {
    const raw = style.getPropertyValue(name).trim();
    if (!/^#[0-9a-f]{6}$/i.test(raw)) throw new Error(`Expected a palette color for ${name}.`);
    return [parseInt(raw.slice(1, 3), 16) / 255, parseInt(raw.slice(3, 5), 16) / 255, parseInt(raw.slice(5, 7), 16) / 255];
  };
  const background = read("--color-paper"), accent = read("--graph-surface");
  const mix = (index: number) => accent[index]! * 0.68 + background[index]! * 0.32;
  return { background, ink: read("--color-ink"), grid: read("--graph-grid"),
    surface: [mix(0), mix(1), mix(2)], x: read("--graph-x"), y: read("--graph-y"), z: read("--graph-z"),
    section: read("--graph-section"), plane: read("--graph-section-plane") };
}
let colors = readColors();

function renderFallback(): void {
  const { width, height } = sizes(stage);
  get(".static-view").innerHTML = view.example === "section" ? renderSectionFallback(view, width, height)
    : renderGraph3DWebGLFallback(createPilotObjects(view, width, height), createPilotGraph(view, width, height));
}
function draw(): void {
  pendingFrame = undefined;
  if (disposed || document.hidden) return;
  if (directVisible) {
    const { width, height } = sizes(stage);
    if (renderer) {
      renderer.draw(view, width, height, colors);
      const stats = renderer.inspect();
      stage.dataset["frames"] = String(stats.frames);
      get("#measurements").textContent = `${stats.vertices.toLocaleString()} retained vertices · ${stats.triangles.toLocaleString()} triangles · ${(stats.bufferBytes / 1024).toFixed(0)} KiB of geometry · ${stats.uploads} buffer uploads · ${stats.frames} drawn frames · ${stats.submitP95Ms.toFixed(2)} ms p95 submission (last 240 draws).`;
    } else renderFallback();
    projectPilotLabels(view, width, height).forEach((point, index) => {
      const label = stage.querySelectorAll<HTMLElement>(".axis-label")[index]!;
      label.hidden = !renderer && view.example !== "section";
      label.style.left = `${point.x}px`; label.style.top = `${point.y}px`;
      if (index === 1) label.textContent = view.example === "section" ? `y = ${Number(view.section.y.toFixed(2))}` : "y";
    });
  }
  if (reference && referenceVisible) {
    const { width, height } = sizes(referenceStage);
    reference.draw(view, width, height, colors);
  }
  stage.dataset["denominator"] = String(view.denominator);
  stage.dataset["azimuth"] = String(view.azimuth);
  stage.dataset["sectionY"] = String(view.section.y);
  stage.dataset["inspection"] = String(view.section.inspection);
  stage.dataset["cameraLocked"] = String(view.example === "section" && view.section.inspection > 0);
}
function invalidate(): void {
  if (!disposed && pendingFrame === undefined && !document.hidden && (directVisible || referenceVisible)) pendingFrame = requestAnimationFrame(draw);
}
function pause(): void { clock.pause(); sectionControls.pause(); play.textContent = "Play"; }
function showFailure(reason: string): void {
  pause(); renderer?.dispose(); renderer = undefined;
  stage.dataset["status"] = "fallback"; canvas.hidden = true; get(".static-view").hidden = false;
  get(".stage-note").textContent = view.example === "section" ? "Static section · surface shading unavailable" : "Static fallback · same mathematical sample";
  stage.querySelectorAll<HTMLElement>(".axis-label").forEach((label) => { label.hidden = true; });
  status.textContent = reason; status.hidden = false; retry.hidden = false;
  play.disabled = true; get<HTMLButtonElement>("#reverse").disabled = true;
  sectionControls.sync();
  get("#measurements").textContent = "The static fallback is active; GPU rendering is unavailable.";
  invalidate();
}
function rotate(dx: number, dy: number): void {
  if (view.example === "section" && view.section.inspection > 0) return;
  view = { ...view, azimuth: ((view.azimuth + dx) % 360 + 360) % 360,
    elevation: Math.max(-75, Math.min(75, view.elevation + dy)) };
  invalidate();
}
function bindCanvas(): void {
  canvasListeners.abort(); canvasListeners = new AbortController();
  const options = { signal: canvasListeners.signal };
  let drag: { x: number; y: number; id: number } | undefined;
  canvas.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0 || (view.example === "section" && view.section.inspection > 0)) return;
    drag = { x: event.clientX, y: event.clientY, id: event.pointerId };
    canvas.setPointerCapture(event.pointerId); canvas.focus({ preventScroll: true });
  }, options);
  canvas.addEventListener("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    rotate((event.clientX - drag.x) * 0.4, (event.clientY - drag.y) * 0.3);
    drag = { x: event.clientX, y: event.clientY, id: event.pointerId };
  }, options);
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) canvas.addEventListener(name, () => { drag = undefined; }, options);
  canvas.addEventListener("keydown", (event) => {
    const amount = event.shiftKey ? 10 : 3;
    if (event.key === "ArrowLeft") rotate(-amount, 0);
    else if (event.key === "ArrowRight") rotate(amount, 0);
    else if (event.key === "ArrowUp") rotate(0, amount);
    else if (event.key === "ArrowDown") rotate(0, -amount);
    else if (event.key === "Home") resetCamera();
    else return;
    event.preventDefault();
  }, options);
}
function mount(): void {
  const result = createPilotRenderer(canvas, () => showFailure("Graphics context lost. Your camera and saddle are preserved; retry to restore the interactive view."));
  if (result.status === "unavailable") { showFailure(result.reason); return; }
  renderer = result.renderer; stage.dataset["status"] = "ready";
  get(".stage-note").textContent = "Direct WebGL · one unit per grid square";
  canvas.hidden = false; get(".static-view").hidden = true; status.hidden = true; retry.hidden = true;
  play.disabled = false; get<HTMLButtonElement>("#reverse").disabled = false;
  sectionControls.sync();
  stage.querySelectorAll<HTMLElement>(".axis-label").forEach((label) => { label.hidden = false; });
  bindCanvas(); invalidate();
}
function on(id: string, event: string, handler: () => void): void {
  get(id).addEventListener(event, handler, { signal: listeners.signal });
}
on("#retry", "click", () => {
  renderer?.dispose();
  const replacement = canvas.cloneNode(false);
  if (!(replacement instanceof HTMLCanvasElement)) throw new Error("Invalid graphics replacement.");
  canvas.replaceWith(replacement); canvas = replacement; mount();
});
function chooseExample(example: PilotView["example"]): void {
  pause(); view = { ...view, example };
  for (const name of ["grid", "saddle", "section"]) get(`#${name}`).setAttribute("aria-pressed", String(example === name));
  get("#saddle-controls").hidden = example === "grid";
  get("#section-controls").hidden = example !== "section";
  get<HTMLInputElement>("#lighting").disabled = example === "grid";
  get<HTMLInputElement>("#mesh").disabled = example === "grid";
  get<HTMLInputElement>("#planes").disabled = example !== "saddle";
  get<HTMLInputElement>("#planes").checked = example === "grid" || view.planes;
  compare.hidden = example === "section";
  stage.dataset["entityId"] = example === "section" ? SECTION_IDS.curve : SECTION_IDS.surface;
  canvas.setAttribute("aria-label", example === "section" ? "Interactive saddle and highlighted section in the plane y = c" : "Interactive coordinate grid and saddle surface");
  canvas.setAttribute("aria-describedby", example === "section" ? "navigation-hint section-equation" : "navigation-hint");
  if (example === "section") closeComparison();
  get("#navigation-hint").textContent = example === "section"
    ? "Drag or use arrow keys in 3D · scrub 3D ↔ 2D below · Home resets the camera"
    : "Drag to rotate · focus the graph and use arrow keys · Home resets the view";
  if (!renderer) get(".stage-note").textContent = example === "section" ? "Static section · surface shading unavailable" : "Static fallback · same mathematical sample";
  invalidate();
}
for (const example of ["grid", "saddle", "section"] as const) on(`#${example}`, "click", () => chooseExample(example));
clock.subscribe((sample) => {
  view = { ...view, denominator: 4 + sample.progress * 4 };
  denominator.value = String(view.denominator); denominatorValue.value = view.denominator.toFixed(2);
  play.textContent = clock.getStatus() === "playing" ? "Pause" : "Play";
  sectionControls.sync();
  invalidate();
});
on("#denominator", "input", () => {
  const progress = (Number(denominator.value) - 4) / 4;
  sectionControls.pause(); clock.seek(progress);
});
function start(direction: "forward" | "rewind"): void {
  sectionControls.pause();
  const stopAt = direction === "forward" ? 1 : 0;
  if (reduced.matches) { clock.seek(stopAt); return; }
  if (clock.getSnapshot().progress === stopAt) clock.seek(1 - stopAt);
  clock.play({ direction, stopAt }); play.textContent = "Pause";
}
on("#play", "click", () => clock.getStatus() === "playing" ? pause() : start("forward"));
on("#reverse", "click", () => start("rewind"));
on("#lighting", "change", () => { view = { ...view, lit: get<HTMLInputElement>("#lighting").checked }; invalidate(); });
on("#mesh", "change", () => { view = { ...view, mesh: get<HTMLInputElement>("#mesh").checked }; invalidate(); });
on("#planes", "change", () => { view = { ...view, planes: get<HTMLInputElement>("#planes").checked }; invalidate(); });
function resetCamera(): void {
  sectionControls.reset(); view = { ...view, azimuth: INITIAL_VIEW.azimuth, elevation: INITIAL_VIEW.elevation }; invalidate();
}
on("#reset", "click", resetCamera);
on("#theme", "click", () => {
  const dark = document.documentElement.dataset["notebookTheme"] !== "dark";
  document.documentElement.dataset["notebookTheme"] = dark ? "dark" : "light";
  get("#theme").setAttribute("aria-pressed", String(dark)); colors = readColors(); invalidate();
});
function closeComparison(): void {
  ++referenceRequest; referenceSection.hidden = true; compare.setAttribute("aria-expanded", "false");
  compare.textContent = "Compare current renderer"; reference?.dispose(); reference = undefined;
}
on("#compare", "click", () => {
  const open = referenceSection.hidden;
  referenceSection.hidden = !open; compare.setAttribute("aria-expanded", String(open));
  compare.textContent = open ? "Close comparison" : "Compare current renderer";
  const request = ++referenceRequest;
  if (!open) {
    reference?.dispose(); reference = undefined;
    get("#loading").textContent = "Comparison closed. Direct rendering remains active.";
    return;
  }
  get("#loading").textContent = "Loading the existing Three.js adapter…";
  void import("./reference.ts").then((module) => {
    if (disposed || request !== referenceRequest) return;
    reference = module.createReference(referenceStage);
    get("#loading").textContent = "Three.js was loaded explicitly for this comparison.";
    invalidate();
  }).catch((error: unknown) => {
    if (disposed || request !== referenceRequest) return;
    referenceStage.textContent = error instanceof Error ? error.message : "The comparison could not load.";
    get("#loading").textContent = "Comparison failed to load; close and reopen it to retry.";
  });
});
const resize = new ResizeObserver(invalidate); resize.observe(stage); resize.observe(referenceStage);
const visibility = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.target === stage) directVisible = entry.isIntersecting;
    if (entry.target === referenceStage) referenceVisible = entry.isIntersecting;
  });
  if (!directVisible && !referenceVisible) pause();
  invalidate();
});
visibility.observe(stage); visibility.observe(referenceStage);
document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); else invalidate(); }, { signal: listeners.signal });
reduced.addEventListener("change", () => { if (reduced.matches) pause(); }, { signal: listeners.signal });
function dispose(): void {
  if (disposed) return;
  disposed = true; ++referenceRequest;
  if (pendingFrame !== undefined) cancelAnimationFrame(pendingFrame);
  listeners.abort(); canvasListeners.abort(); resize.disconnect(); visibility.disconnect();
  clock.dispose(); sectionControls.dispose(); renderer?.dispose(); reference?.dispose();
}
window.addEventListener("pagehide", (event) => { if (event.persisted) pause(); else dispose(); }, { signal: listeners.signal });
window.addEventListener("pageshow", invalidate, { signal: listeners.signal });
if (import.meta.hot) import.meta.hot.dispose(dispose);
if (import.meta.env.DEV) window.__kpGraphPilot = {
  inspect: () => ({ view, stats: renderer?.inspect(), pool: inspectKpWebglContextLeasePool(document), playing: clock.getStatus(), sectionClocks: sectionControls.inspect(), disposed }), dispose
};
declare global {
  interface Window { __kpGraphPilot?: { inspect(): { view: PilotView; stats: ReturnType<PilotRenderer["inspect"]> | undefined; pool: ReturnType<typeof inspectKpWebglContextLeasePool>; playing: string; sectionClocks: ReturnType<ReturnType<typeof createSectionControls>["inspect"]>; disposed: boolean }; dispose(): void } }
}
mount();
chooseExample(view.example);
