import "katex/dist/katex.min.css";
import "../../styles.css";
import "../focus-deck-scaffold.css";
import "../kinetic-figure-surface-contour/kinetic-figure-surface-contour.css";
import "./gradient-contour.css";
import { applyKpSemanticVisualDomTheme } from "../../rendering/semantic-visual-dom-theme.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { createKpFocusDeckCheckpointPlayback } from "../focus-deck-checkpoint-playback.ts";
import { mountKpFocusDeckNativeInput } from "../focus-deck-native-input.ts";
import { bindKpFocusDeckKeyboard } from "../focus-deck-keyboard.ts";
import { renderKpFocusDeckScaffold } from "../focus-deck-scaffold.ts";
import { createKpSurfaceContourStageAuthority, renderKpSurfaceContourStage, mountKpSurfaceContourStage,
  projectKpSurfaceContourPoint } from "../kinetic-figure-surface-contour/kinetic-figure-surface-contour-stage.ts";
import { gradientContourBeats as beats, gradientContourCheckpoints, gradientContourModel as model,
  gradientContourReference, sampleGradientContour } from "./gradient-contour-sequence.ts";

const root = document.querySelector<HTMLElement>("#app")!;
applyKpSemanticVisualDomTheme({ root, theme: "light" });
const authority = createKpSurfaceContourStageAuthority();
root.className = "gradient-page";
root.innerHTML = `<article><header class="gradient-intro"><p>Kinetic Press · micro-intuition</p><h1>Which way is uphill?</h1><p>And why does that direction cross the contours?</p></header>${renderKpFocusDeckScaffold({
  id: "gradient-contour", ariaLabel: "Which way is uphill, and why does that direction cross the contours?", activeBeatSlug: beats[0]!.slug, beats,
  headerTrailingHtml: '<span data-gradient-count>1 / 6</span>',
  stageHtml: renderKpSurfaceContourStage({ model: gradientContourReference, authority }), replayHidden: false
})}<p class="gradient-help">Drag or swipe the passage, scrub the rail, or use the arrows. Six stopping points; continuous motion between them.</p>
<details><summary>What the comparison means</summary><p>The field is f(x,y) = x² + 2y² at (1, ½). All direction comparisons are normalized. “Greatest rise” is the directional derivative at this point, not a finite-step endpoint comparison. Along a curved contour the height is constant; a straight tangent step need not stay level.</p></details>
<p class="gradient-reference"><a href="/experiments/kinetic-figure/surface-contour/">Original surface / contour reference</a> · Primary visual review; editing follows acceptance.</p></article>`;
const get = <T extends Element>(selector: string) => { const found = root.querySelector<T>(selector); if (!found) throw new Error(`Gradient card requires ${selector}`); return found; };
const card = get<HTMLElement>("[data-kp-focus-deck]");
const plot = get<HTMLElement>(".kp-surface-contour-stage__plot");
plot.insertAdjacentHTML("beforeend", `<svg class="gradient-overlay" viewBox="0 0 520 300" aria-hidden="true">
  <g data-gradient-tangent data-kp-semantic-entity="gradient.tangent"><path class="gradient-tangent"/><path class="gradient-right-angle"/></g>
  <g data-gradient-direction data-kp-semantic-entity="gradient.unit-direction"><path class="gradient-direction"/><path class="gradient-arrowhead"/></g>
  <circle class="gradient-origin" r="5" data-kp-semantic-entity="gradient.origin"/>
  <circle class="gradient-point" r="4.5" data-kp-semantic-entity="gradient.traveler"/>
</svg>`);
// The exemplar fixes c to the point's height. The reference's level control
// remains untouched on its own host; here it is replaced with derived evidence.
const levelControl = get<HTMLElement>(".kp-surface-contour-level-control");
levelControl.hidden = true;
levelControl.insertAdjacentHTML("afterend", `<div class="gradient-evidence"><div><span>Height on contour</span><output data-gradient-height>1.50</output></div>
  <div data-gradient-rate-panel><span>Rise per unit distance</span><output data-gradient-rate>0.00</output><div class="gradient-meter" aria-hidden="true"><i></i><b data-gradient-meter></b></div></div></div>`);
const clock = createKpReaderTimelinePlaybackClock({ id: "clock.gradient-contour.primary", durationMs: 8500 });
const playback = createKpFocusDeckCheckpointPlayback(clock, gradientContourCheckpoints);
const stage = mountKpSurfaceContourStage({ root: card, authority, initialProjection: sampleGradientContour(0).stage });
const viewport = get<HTMLElement>("[data-kp-focus-deck-viewport]");
viewport.dataset["kpFocusDeckSnapDisabled"] = "true";
const slider = get<HTMLInputElement>("[data-kp-focus-deck-scrubber]"); slider.step = "any";
const previous = get<HTMLButtonElement>("[data-kp-focus-deck-previous]"), next = get<HTMLButtonElement>("[data-kp-focus-deck-next]");
const replay = get<HTMLButtonElement>("[data-kp-focus-deck-replay]");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let disposed = false;
let input: ReturnType<typeof mountKpFocusDeckNativeInput> | undefined;
const cancel = () => { input?.cancel(); playback.cancel(); };
const path = (points: readonly { x: number; y: number }[]) => points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(" ");
const render = () => {
  if (disposed) return;
  const state = sampleGradientContour(clock.getSnapshot().progress), { position, visible } = state;
  stage.project(state.stage);
  const screen = (x: number, y: number) => projectKpSurfaceContourPoint(authority, state.stage.viewProgress, { x, y, z: model.level * (1 - state.stage.viewProgress) });
  const p = model.source.point, origin = screen(p.x, p.y), traveler = screen(state.point.x, state.point.y);
  const place = (selector: string, point: { x: number; y: number }) => { const circle = get<SVGCircleElement>(selector); circle.setAttribute("cx", String(point.x)); circle.setAttribute("cy", String(point.y)); };
  place(".gradient-origin", origin); place(".gradient-point", traveler);
  const atPoint = model.atPoint;
  if (atPoint.kind !== "regular") throw new Error("The reviewed primary requires a regular point.");
  const tangent = atPoint.tangent;
  get<SVGPathElement>(".gradient-tangent").setAttribute("d", path([screen(p.x - tangent.x * .7, p.y - tangent.y * .7), screen(p.x + tangent.x * .7, p.y + tangent.y * .7)]));
  get<SVGGElement>("[data-gradient-tangent]").setAttribute("opacity", String(state.tangentPresence));
  get<SVGGElement>("[data-gradient-direction]").setAttribute("opacity", String(state.directionPresence));
  const d = state.direction, tip = screen(p.x + d.x * .72, p.y + d.y * .72);
  get<SVGPathElement>(".gradient-direction").setAttribute("d", path([origin, tip]));
  const dx = tip.x - origin.x, dy = tip.y - origin.y, length = Math.hypot(dx, dy), ux = dx / length, uy = dy / length;
  get<SVGPathElement>(".gradient-arrowhead").setAttribute("d", path([{ x: tip.x - ux * 8 - uy * 4, y: tip.y - uy * 8 + ux * 4 }, tip, { x: tip.x - ux * 8 + uy * 4, y: tip.y - uy * 8 - ux * 4 }]));
  const uphill = atPoint.uphill;
  get<SVGPathElement>(".gradient-right-angle").setAttribute("d", path([screen(p.x + tangent.x * .16, p.y + tangent.y * .16), screen(p.x + (tangent.x + uphill.x) * .16, p.y + (tangent.y + uphill.y) * .16), screen(p.x + uphill.x * .16, p.y + uphill.y * .16)]));
  get<SVGPathElement>(".gradient-right-angle").setAttribute("opacity", String(Math.max(0, (position - 4.8) * 5)));
  get<HTMLOutputElement>("[data-gradient-height]").value = state.height.toFixed(2);
  get<HTMLOutputElement>("[data-gradient-rate]").value = state.slope.toFixed(2);
  get<HTMLElement>("[data-gradient-rate-panel]").style.visibility = position >= 2.5 ? "visible" : "hidden";
  const meter = get<HTMLElement>("[data-gradient-meter]"), rate = state.slope / model.atPoint.magnitude;
  meter.style.left = `${50 + Math.min(0, rate) * 50}%`; meter.style.width = `${Math.abs(rate) * 50}%`;
  card.dataset["gradientStep"] = String(position); card.dataset["gradientSlope"] = String(state.slope);
  card.dataset["kpFocusDeckActiveBeat"] = beats[visible]!.slug;
  previous.disabled = position <= 0; next.disabled = position >= playback.last;
  slider.value = String(position); slider.setAttribute("aria-valuetext", state.accessiblePosition);
  get<HTMLElement>("[data-gradient-count]").textContent = state.fraction;
  get<HTMLOutputElement>("[data-kp-focus-deck-position]").value = state.accessiblePosition;
  viewport.querySelectorAll<HTMLElement>("[data-kp-focus-deck-beat]").forEach((item, i) => {
    item.dataset["kpFocusDeckBeatActive"] = String(i === visible);
    if (i === visible) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current");
  });
  if (!input?.ownsTravel()) viewport.scrollLeft = position * viewport.clientWidth;
};
const navigate = (step: number) => { cancel(); clock.pause(); playback.seek(step, !reduced.matches); };
const unsubscribe = clock.subscribe(render);
previous.onclick = () => navigate(Math.max(0, Math.ceil(playback.position()) - 1));
next.onclick = () => navigate(Math.min(playback.last, Math.floor(playback.position()) + 1));
replay.onclick = () => { cancel(); clock.seek(0); navigate(playback.last); };
slider.oninput = () => { cancel(); clock.pause(); clock.seek(Number(slider.value) / playback.last); };
const release = () => playback.seek(Math.round(playback.position()), !reduced.matches, true);
slider.onchange = release; slider.onpointerup = release; slider.onpointercancel = release;
const unbindKeyboard = bindKpFocusDeckKeyboard({ card, slider, enabled: () => !disposed, position: playback.position, checkpointCount: () => beats.length, navigate });
input = mountKpFocusDeckNativeInput({ viewport, region: card, enabled: () => !disposed, position: playback.position,
  begin: playback.begin, reduced: () => reduced.matches, interrupt: cancel });
const resize = () => { cancel(); clock.pause(); render(); };
const visibility = () => { if (document.hidden) { cancel(); clock.pause(); } };
const dispose = () => {
  if (disposed) return; disposed = true; input?.dispose(); playback.dispose(); unsubscribe(); unbindKeyboard(); stage.dispose(); clock.dispose();
  window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", resize);
};
window.addEventListener("resize", resize); document.addEventListener("visibilitychange", visibility); reduced.addEventListener("change", resize);
window.addEventListener("pagehide", dispose, { once: true });
if (import.meta.hot) import.meta.hot.dispose(dispose);
render(); card.dataset["kpFocusCardEnhancement"] = "ready";
