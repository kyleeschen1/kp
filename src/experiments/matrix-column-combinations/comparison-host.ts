import "./comparison.css";
import { comparison as source } from "../../../content/authoring/linear-algebra/dependent-columns-comparison.ts";
import { comparisonHtml, comparisonStatic, mountComparisonView } from "./comparison-view.ts";
import { prepareColumnFonts } from "./fonts.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { createKpFocusDeckCheckpointPlayback } from "../../tutorial/focus-deck-checkpoint-playback.ts";
import { readKpFocusDeckScrubberKeyTarget } from "../../tutorial/focus-deck-scaffold.ts";
import { renderKpFocusDeckAnnotation } from "../../tutorial/focus-deck-annotation.ts";
import { encodeKpHtmlAttribute as escape } from "../../rendering/html-output-encoding.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { observeMatrixConfig, readMatrixConfig } from "../matrix-examples/config.ts";

export function mountMatrixComparison(root: HTMLElement) {
  let disposed = false, release = () => {};
  const dispose = () => { if (disposed) return; disposed = true; release(); window.removeEventListener("pagehide", pagehide); };
  const pagehide = (event: PageTransitionEvent) => { if (!event.persisted) dispose(); };
  window.addEventListener("pagehide", pagehide); root.setAttribute("aria-busy", "true");
  // Unlike the numeric column reader, this scene introduces italic u, v and A.
  // Request that actual face before measuring: fonts.ready before insertion
  // cannot wait for a face the document has not requested yet.
  void Promise.all([prepareColumnFonts(), document.fonts.load("italic 20px KaTeX_Math")]).then(() => { if (!disposed) release = install(root); }).catch(error => {
    if (disposed) return;
    dispose(); root.textContent = String(error); root.setAttribute("aria-busy", "false"); root.dataset["gap"] = "true";
  });
  return dispose;
}

function install(root: HTMLElement) {
  document.querySelector("h1")!.textContent = source.title; document.title = source.title;
  document.querySelector("#matrix-story > p")!.textContent = source.introduction;
  root.innerHTML = `<p><a href="?input=dependent-columns">Inspect the original multiplication</a></p>
    <section class="matrix-card kp-focus-deck" aria-label="What the map loses">
      <div class="matrix-cue" data-cue aria-live="polite"></div>
      <div class="matrix-scroll" tabindex="0" role="region" aria-label="Input comparison; scroll horizontally on narrow screens">${comparisonHtml(source.relation)}</div>
      <div class="matrix-controls"><button data-back>Previous</button><button data-next>Next</button>
        <input data-scrub type="range" min="0" max="1" step="0.0001" value="0" aria-label="Comparison position">
        <select aria-label="Explanation step">${source.beats.map((beat, i) => `<option value="${i}">${i + 1}. ${beat.id}</option>`).join("")}</select>
      </div>
    </section>
    <p>For a linear map, applying the map to a difference gives the difference of the outputs:</p>
    <div class="comparison-static">${renderLatexToHtml("A(v-u)=Av-Au", { output: "htmlAndMathml" })}</div>
    <p>${escape(source.conclusion)}</p>
    <p>${escape(source.question)}</p><details><summary>Check your reasoning</summary><p>${escape(source.answer)}</p></details>
    <details><summary>Read the complete comparison</summary><div class="comparison-static">${comparisonStatic(source.relation)}</div></details>`;
  const { beats } = source, last = beats.length - 1;
  // Keep the existing matrix interval cadence; timing stays outside the source.
  const clock = createKpReaderTimelinePlaybackClock({ id: "matrix-input-comparison", durationMs: 2100 * last });
  const playback = createKpFocusDeckCheckpointPlayback(clock, beats.map((_, i) => i / last));
  let view: ReturnType<typeof mountComparisonView> | undefined;
  const slider = root.querySelector<HTMLInputElement>("[data-scrub]")!;
  const chooser = root.querySelector<HTMLSelectElement>("select")!;
  const back = root.querySelector<HTMLButtonElement>("[data-back]")!, next = root.querySelector<HTMLButtonElement>("[data-next]")!;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let config = readMatrixConfig(document), disposed = false, restoring = false, lastCue = -1;
  let unsubscribe = () => {}, stopConfig = () => {}, observer: ResizeObserver | undefined;
  const stepsOnly = () => reduced.matches || config.motion === "steps";
  const render = () => {
    if (disposed || !view) return;
    const progress = clock.getSnapshot().progress, index = Math.ceil(progress * last), beat = beats[index]!;
    view.render(progress, beat.targets);
    slider.value = String(progress); slider.setAttribute("aria-valuetext", `${index + 1} of ${beats.length}. ${beat.text}`);
    chooser.value = String(index); back.disabled = progress === 0; next.disabled = progress === 1;
    if (index !== lastCue) { root.querySelector("[data-cue]")!.innerHTML = renderKpFocusDeckAnnotation({ entityId: beat.id, text: beat.text }); lastCue = index; }
    root.dataset["step"] = beat.id; root.dataset["progress"] = String(progress);
    if (!restoring && clock.getStatus() !== "playing" && Number.isInteger(progress * last)) {
      const url = new URL(location.href); url.hash = beat.id;
      if (url.href !== location.href) history.replaceState(null, "", url);
    }
  };
  const go = (index: number, animate = true) => { playback.seek(index, animate && !stepsOnly()); render(); };
  const restore = () => {
    const id = location.hash.slice(1), index = id ? beats.findIndex(beat => beat.id === id) : 0;
    if (index < 0) throw new Error("Choose a named comparison step.");
    go(index, false);
  };
  const restoreEvent = () => {
    restoring = true;
    try { restore(); root.querySelector("[data-location-error]")?.remove(); }
    catch (error) {
      clock.pause(); render();
      let alert = root.querySelector<HTMLElement>("[data-location-error]");
      if (!alert) { alert = document.createElement("p"); alert.dataset["locationError"] = "true"; alert.setAttribute("role", "alert"); root.append(alert); }
      alert.textContent = String(error);
    } finally { restoring = false; }
  };
  const resize = () => { if (!disposed) { clock.pause(); view?.prepare(); render(); } };
  const visibility = () => { if (document.hidden) { clock.pause(); render(); } };
  const motion = () => { clock.pause(); if (stepsOnly()) go(Math.ceil(playback.position()), false); render(); };
  const pageshow = (event: PageTransitionEvent) => { if (event.persisted) { restoreEvent(); resize(); } };
  const pagehide = () => { clock.pause(); render(); };
  const dispose = () => {
    if (disposed) return; disposed = true;
    unsubscribe(); stopConfig(); observer?.disconnect(); playback.dispose(); clock.dispose(); view?.dispose();
    slider.oninput = null; slider.onkeydown = null; chooser.onchange = null; back.onclick = null; next.onclick = null;
    document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", motion);
    window.removeEventListener("hashchange", restoreEvent); window.removeEventListener("popstate", restoreEvent);
    window.removeEventListener("pageshow", pageshow); window.removeEventListener("pagehide", pagehide);
    delete root.dataset["ready"];
  };
  try {
    view = mountComparisonView(root, source.relation); unsubscribe = clock.subscribe(render);
    slider.oninput = () => { const value = Number(slider.value); clock.pause(); clock.seek(value); };
    slider.onkeydown = event => {
      const target = readKpFocusDeckScrubberKeyTarget(event, playback.position(), beats.length);
      if (target !== undefined) { event.preventDefault(); go(target, false); }
    };
    chooser.onchange = () => go(Number(chooser.value), false);
    back.onclick = () => go(Math.max(0, Math.ceil(playback.position() - 1e-8) - 1));
    next.onclick = () => go(Math.min(last, Math.floor(playback.position() + 1e-8) + 1));
    stopConfig = observeMatrixConfig(document, value => {
      const geometry = value.theme !== config.theme || value.spacing !== config.spacing || value.layout !== config.layout;
      const changedMotion = value.motion !== config.motion; config = value;
      if (geometry) resize(); else if (changedMotion) motion();
    });
    const stage = root.querySelector<HTMLElement>(".comparison-stage")!;
    let width = stage.clientWidth, height = stage.clientHeight;
    observer = new ResizeObserver(() => {
      if (width === stage.clientWidth && height === stage.clientHeight) return;
      width = stage.clientWidth; height = stage.clientHeight; resize();
    }); observer.observe(stage);
    document.addEventListener("visibilitychange", visibility); reduced.addEventListener("change", motion);
    window.addEventListener("hashchange", restoreEvent); window.addEventListener("popstate", restoreEvent);
    window.addEventListener("pageshow", pageshow); window.addEventListener("pagehide", pagehide);
    restore(); root.dataset["ready"] = "true"; root.setAttribute("aria-busy", "false");
  } catch (error) { dispose(); throw error; }
  return dispose;
}
