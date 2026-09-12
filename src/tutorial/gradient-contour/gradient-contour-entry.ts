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
import { renderKpSurfaceContourStage, mountKpSurfaceContourStage } from "../kinetic-figure-surface-contour/kinetic-figure-surface-contour-stage.ts";
import { mountGradientContourOverlay } from "./gradient-contour-overlay.ts";
import { gradientContourReference, gradientContourBrief, gradientComparisonBounds } from "./gradient-contour-sequence.ts";
import { gradientContourPrimary } from "./gradient-contour-model.ts";
import { gradientNumber as number } from "./gradient-contour-story.ts";
import { checkGradientExplanation, checkGradientExplanationText, gradientContourVariant, type CheckedGradientExplanation } from "./gradient-contour-authoring.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";

function mountExplanation(root: HTMLElement, lesson: CheckedGradientExplanation) {
const { authority, sequence } = lesson;
const { model, beats, checkpoints: gradientContourCheckpoints, reading: gradientComparisonReading, sample: sampleGradientContour } = sequence;
const { a, b, point } = model.source, g = model.atPoint.gradient;
applyKpSemanticVisualDomTheme({ root, theme: "light" });
root.className = "gradient-page";
root.innerHTML = `<article><header class="gradient-intro"><p>Kinetic Press · micro-intuition</p><h1>Which way climbs fastest?</h1><p>${gradientContourBrief.question}</p></header>${renderKpFocusDeckScaffold({
  id: "gradient-contour", ariaLabel: gradientContourBrief.question, activeBeatSlug: beats[0]!.slug, beats,
  headerTrailingHtml: `<span data-gradient-count>1 / ${beats.length}</span>`,
  stageHtml: renderKpSurfaceContourStage({ model: gradientContourReference, authority }), replayHidden: false
})}<p class="gradient-help">Drag blank space or swipe the passage, scrub the rail, or use the arrows. ${beats.length} stopping points; continuous motion between them.</p>
<details><summary>What the comparison means</summary><p>The field is ${renderLatexToHtml(`f(x,y)=${model.latex}`, { displayMode: false, output: "htmlAndMathml" })} at (${number(point.x)}, ${number(point.y)}). All direction comparisons are normalized. “Greatest rise” is the directional derivative at this point, not a finite-step endpoint comparison. Along a curved contour the height is constant; a straight tangent step need not stay level.</p></details>
<details class="gradient-why"><summary>Additional notation: the projection identity</summary>
<p>A partial derivative is the local slope when only one coordinate changes. Here ${renderLatexToHtml(`f_x=${number(2 * a)}x=${number(g.x)}`, { displayMode: false, output: "htmlAndMathml" })} and ${renderLatexToHtml(`f_y=${number(2 * b)}y=${number(g.y)}`, { displayMode: false, output: "htmlAndMathml" })} at the marked point. The local flat approximation adds those two contributions.</p>
${renderLatexToHtml("\\Delta f\\approx f_x\\Delta x+f_y\\Delta y=\\nabla f\\cdot\\Delta\\mathbf r", { output: "htmlAndMathml" })}
<p>A dot product measures projection: only the part of the move along the gradient contributes. For a unit direction and angle θ to the gradient:</p>
${renderLatexToHtml("D_{\\mathbf u}f=\\nabla f\\cdot\\mathbf u=\\lVert\\nabla f\\rVert\\cos\\theta", { output: "htmlAndMathml" })}
<p>The cosine is at most one, reached when the direction aligns with the gradient. Along the contour it is zero; in the opposite direction it is negative. Thus the gradient is perpendicular to the locally level direction and points toward greatest increase. This is a local claim, not a comparison of distant endpoints.</p></details>
<details class="gradient-prediction"><summary>Check your reasoning</summary><p>A negative eastward slope and positive northward slope put the gradient northwest. West reverses the negative eastward change; north adds positively. Their relative magnitudes determine the exact angle. Moving east initially lowers the quantity.</p><p>A same-length move tilted away has a shorter projection along the gradient. Its perpendicular part contributes no first-order change.</p></details>
<details class="gradient-calculation"><summary>Where did the two slopes come from?</summary><p>Our field is ${renderLatexToHtml(`f(x,y)=${model.latex}`, { displayMode: false, output: "htmlAndMathml" })} at (${number(point.x)}, ${number(point.y)}), with height ${number(model.level)}. Expanding after a small move gives:</p>${renderLatexToHtml(`f(${number(point.x)}+\\Delta x,${number(point.y)}+\\Delta y)=${number(model.level)}+${number(g.x)}\\Delta x+${number(g.y)}\\Delta y+${number(a)}(\\Delta x)^2+${number(b)}(\\Delta y)^2`, { output: "htmlAndMathml" })}<p>The linear terms give our two slopes. The remaining terms are quadratic: halving both movements quarters those terms. This is why the local linear prediction becomes accurate close to the point.</p></details>
<p class="gradient-reference"><a href="/experiments/kinetic-figure/surface-contour/">Original surface / contour reference</a> · Source edits apply to this lesson only.</p></article>`;
root.dataset["gradientSource"] = lesson.sourceText;
const get = <T extends Element>(selector: string) => { const found = root.querySelector<T>(selector); if (!found) throw new Error(`Gradient card requires ${selector}`); return found; };
const card = get<HTMLElement>("[data-kp-focus-deck]");
const plot = get<HTMLElement>(".kp-surface-contour-stage__plot");
// One fitted viewport keeps native paint and semantic overlays in the same
// aspect-preserving box. CSS owns sizing; playback never measures text/layout.
const plotSlot = document.createElement("div"); plotSlot.className = "gradient-plot-slot";
plot.before(plotSlot); plotSlot.append(plot);
const projectOverlay = mountGradientContourOverlay(plot, authority, model);
// The exemplar fixes c to the point's height. The reference's level control
// remains untouched on its own host; here it is replaced with derived evidence.
const levelControl = get<HTMLElement>(".kp-surface-contour-level-control");
levelControl.hidden = true;
levelControl.insertAdjacentHTML("afterend", `<div class="gradient-evidence" data-gradient-evidence><div><span>Starting height</span><output data-gradient-height>1.50</output></div>
  <div data-gradient-rate-panel><span>Rise per unit distance</span><output data-gradient-rate>0.00</output><div class="gradient-meter" aria-hidden="true"><i></i><b data-gradient-meter></b></div></div></div>`);
levelControl.insertAdjacentHTML("afterend", `<div class="gradient-component-evidence" data-gradient-component-evidence><span class="gradient-across-label">Across (adds rise): <output data-gradient-across>0.00</output></span><span>Sideways (no rise): <output data-gradient-along>1.00</output></span><span>Local rise = <output data-gradient-rise-rule></output></span></div>`);
const clock = createKpReaderTimelinePlaybackClock({ id: "clock.gradient-contour.primary", durationMs: 1700 * (beats.length - 1) });
const playback = createKpFocusDeckCheckpointPlayback(clock, gradientContourCheckpoints);
const stage = mountKpSurfaceContourStage({ root: card, authority, initialProjection: sampleGradientContour(0).stage });
const viewport = get<HTMLElement>("[data-kp-focus-deck-viewport]");
viewport.dataset["kpFocusDeckSnapDisabled"] = "true";
// Preserve the native scroll lane as input geometry. Only this comparison's
// reading projection stays stationary, so touch/wheel never need a second clock
// or compensating scroll writes that would fight the input owner.
const passageShell = document.createElement("div"); passageShell.className = "gradient-passage-shell";
viewport.before(passageShell); passageShell.append(viewport);
// Move the actual narrative owner, not a duplicate caption. Its native lane
// and the figure retain fixed slots throughout the comparison and its replay.
get<HTMLElement>(".kp-focus-deck__card").prepend(passageShell);
passageShell.insertAdjacentHTML("beforeend", `<section class="gradient-guided-passage kp-focus-deck__narrative" data-gradient-guided-passage hidden aria-label="Compare equal-length directions"><div class="kp-focus-deck__passage-page">
  <div class="gradient-instruction-role" data-gradient-instruction-role>Before the move</div>
  <p class="gradient-comparison-reading"><span data-gradient-reading-lead>${gradientComparisonReading.prepare.lead}</span> <span data-gradient-reading-body>${gradientComparisonReading.prepare.body}</span></p>
  <div class="gradient-handoff">
    <p class="gradient-viewing-cue" id="gradient-comparison-cue"></p>
    <button type="button" data-gradient-play-comparison aria-describedby="gradient-comparison-cue">Turn toward uphill</button>
  </div>
</div></section>`);
const guidedPassage = get<HTMLElement>("[data-gradient-guided-passage]");
const viewingCue = get<HTMLElement>(".gradient-viewing-cue");
const instructionRole = get<HTMLElement>("[data-gradient-instruction-role]");
const readingLead = get<HTMLElement>("[data-gradient-reading-lead]"), readingBody = get<HTMLElement>("[data-gradient-reading-body]");
const playComparison = get<HTMLButtonElement>("[data-gradient-play-comparison]");
// Supporting numbers stay live and available, but outside the attentional
// surface: expanding them must never shrink or move the demonstration.
const numericalDetails = document.createElement("details"); numericalDetails.className = "gradient-numerical-details";
numericalDetails.innerHTML = "<summary>Inspect the numbers</summary>";
get<HTMLElement>(".gradient-help").before(numericalDetails);
numericalDetails.append(get<HTMLElement>("[data-gradient-component-evidence]"), get<HTMLElement>("[data-gradient-evidence]"));
const slider = get<HTMLInputElement>("[data-kp-focus-deck-scrubber]"); slider.step = "any";
const previous = get<HTMLButtonElement>("[data-kp-focus-deck-previous]"), next = get<HTMLButtonElement>("[data-kp-focus-deck-next]");
const replay = get<HTMLButtonElement>("[data-kp-focus-deck-replay]");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let disposed = false;
let input: ReturnType<typeof mountKpFocusDeckNativeInput> | undefined;
const cancel = () => { input?.cancel(); playback.cancel(); };
const render = () => {
  if (disposed) return;
  const state = sampleGradientContour(clock.getSnapshot().progress), { position, visible } = state;
  const attention = state.attention;
  card.dataset["gradientAttentionPhase"] = attention?.phaseKind ?? "none";
  card.dataset["gradientAttentionPrimary"] = attention?.primaryTarget ?? "none";
  passageShell.dataset["gradientGuided"] = String(attention !== undefined);
  if (!attention && guidedPassage.contains(document.activeElement)) viewport.focus({ preventScroll: true });
  guidedPassage.hidden = attention === undefined;
  if (attention) {
    // Keeping these nodes intact also preserves selection during inspection.
    if (readingLead.textContent !== attention.reading.lead) readingLead.textContent = attention.reading.lead;
    if (readingBody.textContent !== attention.reading.body) readingBody.textContent = attention.reading.body;
    if (viewingCue.textContent !== attention.cue) viewingCue.textContent = attention.cue;
    if (instructionRole.textContent !== attention.instructionRole) instructionRole.textContent = attention.instructionRole;
    const label = attention.readingKind === "conclude" ? "Replay this turn" : "Turn toward uphill";
    if (playComparison.textContent !== label) playComparison.textContent = label;
  }
  const replayLabel = attention ? "Replay this turn" : "Replay whole explanation";
  replay.setAttribute("aria-label", replayLabel); replay.title = replayLabel;
  stage.project(state.stage);
  projectOverlay(state);
  get<HTMLElement>(".kp-surface-contour-stage__equations").hidden = state.rampPresence > .5;
  if (state.rampPresence > .5) get<HTMLElement>("[data-kp-surface-contour-view-label]").textContent = state.localViewProgress === 1 ? "Top-down · equal horizontal length" : "Local ramp · first-order model";
  plot.setAttribute("aria-label", state.rampPresence > .5
    ? "Local flat approximation: the vertical segment measures rise. In top-down view, the direction tip stays on a unit circle; its across projection grows to the full radius while its along part adds no rise."
    : `Surface and contour map at height ${model.level.toFixed(2)}; compare horizontal directions at the marked point.`);
  get<HTMLElement>("[data-gradient-component-evidence]").style.visibility = state.componentPresence > 0 ? "visible" : "hidden";
  get<HTMLOutputElement>("[data-gradient-across]").value = state.components.across.toFixed(2);
  get<HTMLOutputElement>("[data-gradient-along]").value = state.components.along.toFixed(2);
  get<HTMLOutputElement>("[data-gradient-rise-rule]").value = `${model.atPoint.magnitude.toFixed(2)} × ${state.components.across.toFixed(2)} + 0`;
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
const replayComparison = () => { cancel(); clock.seek(gradientContourCheckpoints[gradientComparisonBounds.start]!); navigate(gradientComparisonBounds.end); };
playComparison.onclick = replayComparison;
previous.onclick = () => navigate(Math.max(0, Math.ceil(playback.position()) - 1));
next.onclick = () => navigate(Math.min(playback.last, Math.floor(playback.position()) + 1));
replay.onclick = () => {
  if (sampleGradientContour(clock.getSnapshot().progress).attention) { replayComparison(); return; }
  cancel(); clock.seek(0); navigate(playback.last);
};
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
render(); card.dataset["kpFocusCardEnhancement"] = "ready";
return dispose;
}

const app = document.querySelector<HTMLElement>("#app")!;
const lessonRoot = document.createElement("div");
const editor = document.createElement("details");
editor.className = "gradient-page gradient-source-editor";
editor.innerHTML = `<summary>Edit the bounded source</summary><p>Change positive quadratic coefficients and the marked point. Apply rebuilds the explanation through the same renderer and returns to the first step. Invalid drafts leave the last valid lesson active.</p><label for="gradient-source">Source JSON</label><textarea id="gradient-source" rows="12" spellcheck="false"></textarea><p><button type="button" data-gradient-apply>Apply source</button> <button type="button" data-gradient-variant>Load unequal-slope example</button> <button type="button" data-gradient-primary>Load original example</button> <button type="button" data-gradient-current>Restore applied source</button></p><p data-gradient-source-status role="status" aria-live="polite"></p>`;
app.append(lessonRoot, editor);
const sourceInput = editor.querySelector<HTMLTextAreaElement>("textarea")!;
const status = editor.querySelector<HTMLElement>("[data-gradient-source-status]")!;
const initial = checkGradientExplanation(gradientContourPrimary);
if (initial.status !== "checked") throw new Error(initial.expected);
let current = initial.lesson;
let disposeLesson = mountExplanation(lessonRoot, current);
sourceInput.value = current.sourceText;
editor.querySelector<HTMLButtonElement>("[data-gradient-apply]")!.onclick = () => {
  const checked = checkGradientExplanationText(sourceInput.value);
  if (checked.status === "repair") {
    status.dataset["status"] = "repair";
    status.textContent = `${checked.code} at ${checked.path}: ${checked.expected} The last valid lesson remains active.`;
    return;
  }
  // Validate semantics and stage fit before retiring the live session. Each
  // successful Apply owns exactly one clock, input binding and GPU session.
  disposeLesson();
  current = checked.lesson;
  disposeLesson = mountExplanation(lessonRoot, current);
  sourceInput.value = current.sourceText;
  status.dataset["status"] = "applied";
  status.textContent = "Applied. Surface, contours, slopes and explanation now use this source. Returned to step 1.";
};
editor.querySelector<HTMLButtonElement>("[data-gradient-variant]")!.onclick = () => { sourceInput.value = JSON.stringify(gradientContourVariant, null, 2); status.textContent = "Unequal-slope draft loaded. Choose Apply source to show it."; };
editor.querySelector<HTMLButtonElement>("[data-gradient-primary]")!.onclick = () => { sourceInput.value = JSON.stringify(gradientContourPrimary, null, 2); status.textContent = "Original draft loaded. Choose Apply source to show it."; };
editor.querySelector<HTMLButtonElement>("[data-gradient-current]")!.onclick = () => { sourceInput.value = current.sourceText; status.textContent = "Restored the applied source; lesson unchanged."; };
const dispose = () => disposeLesson();
window.addEventListener("pagehide", dispose, { once: true });
if (import.meta.hot) import.meta.hot.dispose(dispose);
