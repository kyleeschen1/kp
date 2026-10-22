import "./walk.css";
import { dependentColumnsWalk as score } from "../../../content/authoring/linear-algebra/dependent-columns-walk.ts";
import { mountPresentation, stageHtml, calculationLatex } from "./presentation.ts";
import { prepareColumnFonts } from "./fonts.ts";
import { WalkGap } from "./walk.ts";
import { readMatrixConfig, observeMatrixConfig } from "../matrix-examples/config.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { createKpFocusDeckCheckpointPlayback } from "../../tutorial/focus-deck-checkpoint-playback.ts";
import { readKpFocusDeckScrubberKeyTarget } from "../../tutorial/focus-deck-scaffold.ts";
import { renderKpFocusDeckAnnotation } from "../../tutorial/focus-deck-annotation.ts";
import { encodeKpHtmlAttribute as escape } from "../../rendering/html-output-encoding.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";

/** Reversible local host, not a second glyph compositor or a promoted score API.
 * Two prepared native views share one clock and paint only at matching handoffs. */
export function mountMatrixWalk(root: HTMLElement) {
  let disposed = false, release = () => {};
  const dispose = () => {
    if (disposed) return; disposed = true; release();
    window.removeEventListener("pagehide", pagehide);
  };
  // Font loading can outlive a page that has not installed its player yet.
  const pagehide = (event: PageTransitionEvent) => { if (!event.persisted) dispose(); };
  window.addEventListener("pagehide", pagehide);
  root.setAttribute("aria-busy", "true");
  void prepareColumnFonts().then(() => {
    if (disposed) return;
    release = install(root);
  }).catch(error => {
    if (disposed) return;
    release(); root.textContent = String(error); root.setAttribute("aria-busy", "false");
    root.dataset["gap"] = "true";
  });
  return dispose;
}

function install(root: HTMLElement) {
  document.querySelector("h1")!.textContent = "Different inputs, the same output";
  document.title = "A walk through dependent columns";
  document.querySelector("#matrix-story > p")!.textContent = "Use Next to pause at each point in the argument. The explanation revisits the same equation, then changes which input we inspect.";
  root.innerHTML = `<p><a href="?input=dependent-columns">Original column reader</a> · <a href="?author=1">Edit the matrix source</a></p>
    <section class="matrix-card kp-focus-deck" aria-label="Authored matrix explanation">
      <div class="matrix-cue" data-cue aria-live="polite"></div>
      <div class="matrix-scroll" tabindex="0" role="region" aria-label="Matrix explanation; scroll horizontally on narrow screens">
        <div class="comb-walk-views">${score.scenes.map((scene, i) => `<div class="comb-walk-view" data-view="${i}" aria-hidden="true" inert>${stageHtml(scene)}</div>`).join("")}</div>
      </div>
      <div class="matrix-controls"><button data-back aria-label="Previous explanation stop">Previous</button><button data-play>Play all</button><button data-next aria-label="Next explanation stop">Next</button>
      <input data-scrub type="range" min="0" max="1" step="0.0001" value="0" aria-label="Explanation position">
      <select aria-label="Explanation stop">${score.stops.map((stop, i) => `<option value="${i}">${i + 1}. ${escape(stop.id.replaceAll("-", " "))}</option>`).join("")}</select></div>
    </section>
    <p class="matrix-help">Next pauses for reading. Play all runs continuously; pause or scrub at any time. Rewinding changes the display, not the mathematical map.</p>
    <details><summary>Read both calculations</summary>${score.scenes.map((scene, i) => `<p>Input ${i + 1}</p><div class="comb-static">${renderLatexToHtml(calculationLatex(scene), { output: "htmlAndMathml" })}</div>`).join("")}</details>
    <details><summary>See the authored stops</summary><p>These stops choose the explanation’s order. The original matrix presentation supplies all motion between them.</p><pre><code>${escape(JSON.stringify(score.stops, null, 2))}</code></pre></details>`;
  const panels = [...root.querySelectorAll<HTMLElement>("[data-view]")];
  const views: ReturnType<typeof mountPresentation>[] = [];
  const clock = createKpReaderTimelinePlaybackClock({ id: "matrix-explanation-walk", durationMs: score.durationMs });
  const navigation = createKpFocusDeckCheckpointPlayback(clock, score.checkpoints);
  const slider = root.querySelector<HTMLInputElement>("[data-scrub]")!;
  const chooser = root.querySelector<HTMLSelectElement>("select")!;
  const back = root.querySelector<HTMLButtonElement>("[data-back]")!;
  const next = root.querySelector<HTMLButtonElement>("[data-next]")!;
  const play = root.querySelector<HTMLButtonElement>("[data-play]")!;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let config = readMatrixConfig(document), disposed = false, restoring = false, lastCue = -1;
  let unsubscribe = () => {}, stopConfig = () => {}, observer: ResizeObserver | undefined;
  const stepsOnly = () => reduced.matches || config.motion === "steps";
  const render = () => {
    if (disposed) return;
    const progress = clock.getSnapshot().progress, frame = score.sample(progress);
    views[frame.column]!.render(frame.nativeProgress);
    panels.forEach((panel, i) => { panel.style.opacity = i === frame.column ? "1" : "0"; });
    slider.value = String(progress); slider.setAttribute("aria-valuetext", `${frame.index + 1} of ${score.stops.length}. ${frame.stop.text}`);
    chooser.value = String(frame.index); back.disabled = progress === 0; next.disabled = progress === 1;
    play.textContent = clock.getStatus() === "playing" ? "Pause" : stepsOnly() ? "Next step" : progress === 1 ? "Replay all" : "Play all";
    if (lastCue !== frame.index) {
      root.querySelector("[data-cue]")!.innerHTML = renderKpFocusDeckAnnotation({ entityId: frame.stop.id, text: frame.stop.text });
      lastCue = frame.index;
    }
    root.dataset["stop"] = frame.stop.id; root.dataset["column"] = String(frame.column);
    root.dataset["nativeProgress"] = String(frame.nativeProgress);
    if (!restoring && clock.getStatus() !== "playing" && Number.isInteger(frame.position)) {
      const url = new URL(location.href); url.hash = frame.stop.id;
      if (url.href !== location.href) history.replaceState(null, "", url);
    }
  };
  const go = (index: number, animate = true) => { navigation.seek(index, animate && !stepsOnly()); render(); };
  const adjacent = (direction: number) => {
    const at = navigation.position(), last = navigation.last;
    go(Math.max(0, Math.min(last, direction > 0 ? Math.floor(at + 1e-8) + 1 : Math.ceil(at - 1e-8) - 1)));
  };
  const restore = () => {
    const id = location.hash.slice(1), index = id ? score.stops.findIndex(stop => stop.id === id) : 0;
    if (index < 0) throw new WalkGap("stop", "location.hash", "Choose a named explanation stop.");
    go(index, false);
  };
  const restoreEvent = () => {
    // A hash navigation can deliver both popstate and hashchange. Do not replace
    // a rejected URL with the old stop: the second event would erase its error.
    restoring = true;
    try { restore(); root.querySelector("[data-walk-error]")?.remove(); }
    catch (error) {
      clock.pause(); render();
      let alert = root.querySelector<HTMLElement>("[data-walk-error]");
      if (!alert) { alert = document.createElement("p"); alert.dataset["walkError"] = "true"; alert.setAttribute("role", "alert"); root.append(alert); }
      alert.textContent = String(error);
    }
    finally { restoring = false; }
  };
  const visibility = () => { if (document.hidden) { clock.pause(); render(); } };
  const motion = () => { clock.pause(); if (stepsOnly()) go(Math.ceil(navigation.position()), false); render(); };
  const resize = () => { clock.pause(); for (const view of views) view.prepare(); render(); };
  const pagehide = (event: PageTransitionEvent) => { if (event.persisted) { clock.pause(); render(); } else dispose(); };
  // Read the restored URL before any reprepare can publish the old checkpoint.
  const pageshow = (event: PageTransitionEvent) => { if (event.persisted) { restoreEvent(); resize(); } };
  const dispose = () => {
    if (disposed) return; disposed = true;
    stopConfig(); observer?.disconnect(); unsubscribe(); navigation.dispose(); clock.dispose();
    for (const view of views) view.dispose();
    document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", motion);
    window.removeEventListener("hashchange", restoreEvent); window.removeEventListener("popstate", restoreEvent);
    window.removeEventListener("pagehide", pagehide); window.removeEventListener("pageshow", pageshow);
    slider.oninput = null; slider.onkeydown = null; chooser.onchange = null;
    back.onclick = null; next.onclick = null; play.onclick = null;
    delete root.dataset["ready"];
  };
  try {
    panels.forEach((panel, i) => views.push(mountPresentation(panel, score.scenes[i]!)));
    unsubscribe = clock.subscribe(render);
    slider.oninput = () => { const value = Number(slider.value); clock.pause(); clock.seek(value); };
    slider.onkeydown = event => {
      const target = readKpFocusDeckScrubberKeyTarget(event, navigation.position(), score.stops.length);
      if (target !== undefined) { event.preventDefault(); go(target, false); }
    };
    chooser.onchange = () => go(Number(chooser.value), false);
    back.onclick = () => adjacent(-1); next.onclick = () => adjacent(1);
    play.onclick = () => {
      if (clock.getStatus() === "playing") clock.pause();
      else if (stepsOnly()) { if (clock.getSnapshot().progress === 1) go(0, false); else adjacent(1); }
      else { if (clock.getSnapshot().progress === 1) clock.seek(0); clock.play({ direction: "forward", stopAt: 1 }); }
      render();
    };
    stopConfig = observeMatrixConfig(document, value => {
      const geometry = value.layout !== config.layout || value.spacing !== config.spacing || value.theme !== config.theme;
      const changedMotion = value.motion !== config.motion; config = value;
      if (geometry) resize(); else if (changedMotion) motion();
    });
    const stage = panels[0]!.querySelector<HTMLElement>(".comb-stage")!;
    let width = stage.clientWidth, height = stage.clientHeight;
    observer = new ResizeObserver(() => {
      if (width === stage.clientWidth && height === stage.clientHeight) return;
      width = stage.clientWidth; height = stage.clientHeight; resize();
    });
    observer.observe(stage);
    document.addEventListener("visibilitychange", visibility); reduced.addEventListener("change", motion);
    window.addEventListener("hashchange", restoreEvent); window.addEventListener("popstate", restoreEvent);
    window.addEventListener("pagehide", pagehide); window.addEventListener("pageshow", pageshow);
    restore(); root.dataset["ready"] = "true"; root.setAttribute("aria-busy", "false");
  } catch (error) { dispose(); throw error; }
  return dispose;
}
