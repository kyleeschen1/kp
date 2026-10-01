import { readMatrixConfig, observeMatrixConfig, applyMatrixConfig } from "../matrix-examples/config.ts";
import { beats, durationMs, sample, type DotPassage } from "./model.ts";
import { stageHtml, mountPresentation, calculationLatex } from "./presentation.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { readKpFocusDeckScrubberKeyTarget } from "../../tutorial/focus-deck-scaffold.ts";
import { renderKpFocusDeckAnnotation } from "../../tutorial/focus-deck-annotation.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { defaultDotDepth, type DotDepthSettings } from './depth.ts';
import type { RectangularContext } from '../rectangular-product/model.ts';

/** One independently owned player per mount root; URL ownership is opt-in.
 * Hosts import style.css once (page.css composes it for the standalone page). */
export async function mountDotPlayer(root: HTMLElement, passage: DotPassage, syncHash = false, matrix?: RectangularContext) {
  if (matrix && matrix.passage !== passage) throw new Error('Matrix context must own this exact dot passage.');
  const storyBeats = matrix?.beats ?? beats;
  const readFrame = (progress: number) => matrix ? matrix.sample(progress) : sample(progress);
  if (!/^[A-Za-z][\w-]*$/.test(root.id) || root.ownerDocument.getElementById(root.id) !== root || root.dataset["dotMounted"] === "true") {
    throw new Error("Dot players require a unique, attached, unmounted root with a simple HTML id.");
  }
  root.dataset["dotMounted"] = "true";
  root.classList.add("dot-player", "matrix-player");
  root.innerHTML = `<section class="matrix-card kp-focus-deck" aria-label="Three-term dot product animation">
    <div class="matrix-cue" data-cue aria-live="polite"></div>
    <div class="matrix-scroll" tabindex="0" role="region" aria-label="Dot product; scroll horizontally on narrow screens">${stageHtml(passage)}</div>
    <div class="matrix-controls"><button data-back aria-label="Previous milestone">Previous</button><button data-play>Play</button><button data-next aria-label="Next milestone">Next</button>
    <input data-scrub type="range" min="0" max="1" step="0.0001" value="0" aria-label="Animation position">
    <select aria-label="Milestone">${storyBeats.map((beat, i) => `<option value="${i}">${i + 1}. ${beat.id}</option>`).join("")}</select></div>
    <div class="matrix-controls" aria-label="Depth comparison">
      <label>Background opacity <input data-background-opacity aria-label="Background opacity" type="range" min="0" max="100" step="1" value="${defaultDotDepth.backgroundOpacity * 100}"><output data-opacity-value>${defaultDotDepth.backgroundOpacity * 100}%</output></label>
      <label>Foreground lift <select data-foreground-lift aria-label="Foreground lift"><option value="on" selected>On</option><option value="off">Off</option></select></label>
      <label>Lift height <input data-lift-height aria-label="Lift height" type="range" min="0" max="24" step="1" value="${defaultDotDepth.liftHeight}"><output data-lift-value>${defaultDotDepth.liftHeight} px</output></label>
      <label>Math size <input data-math-size aria-label="Math size" type="range" min="20" max="32" step="0.1" value="20"><output data-size-value>20 px</output></label>
      <button data-light-mode type="button" aria-pressed="false">Light mode</button>
    </div>
    </section>
    <p class="matrix-help">Use Next to inspect each step, or scrub backward through the calculation. On narrow screens, scroll the stage horizontally.</p>
    <details><summary>Read the calculation</summary><div class="dot-static">${renderLatexToHtml(calculationLatex(passage, true), { output: "htmlAndMathml", trust: true })}</div>
    <p>The row and column change arrangement while their entries retain the same mathematical identities. Multiplication produces three new values; addition produces the final result. In real Euclidean coordinates, this pairing also represents the dot product uᵀv.</p></details>`;
  await document.fonts.ready;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let depth: DotDepthSettings = defaultDotDepth;
  const opacityControl = root.querySelector<HTMLInputElement>('[data-background-opacity]')!;
  const liftControl = root.querySelector<HTMLSelectElement>('[data-foreground-lift]')!;
  const heightControl = root.querySelector<HTMLInputElement>('[data-lift-height]')!;
  const sizeControl = root.querySelector<HTMLInputElement>('[data-math-size]')!;
  // Load the second caller only when requested; standalone delivery stays bounded.
  const context = matrix ? (await import('../rectangular-product/presentation.ts')).mountMatrixContext(root, matrix) : undefined;
  const view = mountPresentation(root, passage, () => ({ ...depth, reducedMotion: reduced.matches }));
  context?.prepare();
  const clock = createKpReaderTimelinePlaybackClock({ id: root.id, durationMs: durationMs + (matrix ? 2100 : 0) });
  let config = readMatrixConfig(document);
  const stepsOnly = () => reduced.matches || config.motion === "steps";
  const slider = root.querySelector<HTMLInputElement>("[data-scrub]")!;
  const chooser = root.querySelector<HTMLSelectElement>("select")!;
  const play = root.querySelector<HTMLButtonElement>("[data-play]")!;
  const back = root.querySelector<HTMLButtonElement>("[data-back]")!;
  const next = root.querySelector<HTMLButtonElement>("[data-next]")!;
  const theme = root.querySelector<HTMLButtonElement>('[data-light-mode]')!;
  let disposed = false, lastBeat = "";
  const render = () => {
    if (disposed) return;
    const frame = readFrame(clock.getSnapshot().progress);
    view.render(matrix ? matrix.sample(frame.progress).dotProgress : frame.progress);
    context?.render(frame.progress);
    theme.setAttribute('aria-pressed', String(config.theme === 'light'));
    slider.value = String(frame.progress); slider.setAttribute("aria-valuetext", frame.beat.cue);
    chooser.value = String(frame.index); back.disabled = frame.progress === 0; next.disabled = frame.progress === 1;
    play.textContent = clock.getStatus() === "playing" ? "Pause" : stepsOnly() ? "Next step" : frame.progress === 1 ? "Replay" : "Play";
    if (lastBeat !== frame.beat.id) {
      root.querySelector("[data-cue]")!.innerHTML = renderKpFocusDeckAnnotation({ entityId: frame.beat.id, text: frame.beat.cue });
      lastBeat = frame.beat.id;
    }
    root.dataset["milestone"] = frame.beat.id;
  };
  const go = (index: number, animate = true) => {
    const i = Math.max(0, Math.min(storyBeats.length - 1, index)), target = i / (storyBeats.length - 1);
    clock.pause(); if (syncHash) history.replaceState(null, "", `#${storyBeats[i]!.id}`);
    if (animate && !stepsOnly()) clock.play({ direction: target < clock.getSnapshot().progress ? "rewind" : "forward", stopAt: target });
    else clock.seek(target);
    render();
  };
  const navigate = (offset: number) => {
    const phase = clock.getSnapshot().progress * (storyBeats.length - 1);
    go(offset > 0 ? Math.floor(phase + 1e-8) + 1 : Math.ceil(phase - 1e-8) - 1);
  };
  slider.oninput = () => { clock.pause(); clock.seek(Number(slider.value)); };
  slider.onkeydown = event => {
    const target = readKpFocusDeckScrubberKeyTarget(event, clock.getSnapshot().progress * (storyBeats.length - 1), storyBeats.length);
    if (target !== undefined) { event.preventDefault(); go(target, false); }
  };
  chooser.onchange = () => go(Number(chooser.value), false);
  theme.onclick = () => applyMatrixConfig(document, { ...config, theme: config.theme === 'dark' ? 'light' : 'dark' });
  const updateDepth = () => {
    depth = { ...depth, backgroundOpacity: Number(opacityControl.value) / 100, foregroundLift: liftControl.value === 'on', liftHeight: Number(heightControl.value) };
    root.querySelector('[data-opacity-value]')!.textContent = `${opacityControl.value}%`;
    root.querySelector('[data-lift-value]')!.textContent = `${heightControl.value} px`;
    render();
  };
  opacityControl.oninput = heightControl.oninput = liftControl.onchange = updateDepth;
  back.onclick = () => navigate(-1); next.onclick = () => navigate(1);
  play.onclick = () => {
    if (clock.getStatus() === "playing") clock.pause();
    else if (stepsOnly()) { if (clock.getSnapshot().progress === 1) go(0, false); else navigate(1); }
    else { if (clock.getSnapshot().progress === 1) clock.seek(0); clock.play({ direction: "forward", stopAt: 1 }); }
    render();
  };
  const unsubscribe = clock.subscribe(render);
  const restore = () => { const i = storyBeats.findIndex(beat => beat.id === location.hash.slice(1)); go(i < 0 ? 0 : i, false); };
  const updateSizeControl = () => {
    const actual = parseFloat(getComputedStyle(root.querySelector('.dot-stage .katex')!).fontSize);
    const original = config.theme === 'light' && !root.style.getPropertyValue('--dot-light-math-size');
    sizeControl.min = config.theme === 'light' ? '16' : '20';
    sizeControl.value = actual.toFixed(1);
    const label = original ? `Original (${actual.toFixed(1)} px)` : `${Number(actual.toFixed(1))} px`;
    root.querySelector('[data-size-value]')!.textContent = label;
    sizeControl.setAttribute('aria-valuetext', label);
  };
  const resize = () => { clock.pause(); view.prepare(); context?.prepare(); updateSizeControl(); render(); };
  sizeControl.oninput = () => {
    root.style.setProperty(`--dot-${config.theme}-math-size`, `${sizeControl.value}px`);
    // Re-measure native endpoints and rebuild material at the held playhead.
    resize();
  };
  updateSizeControl();
  const stopConfig = observeMatrixConfig(document, next => { config = next; resize(); });
  const visibility = () => { if (document.hidden) { clock.pause(); render(); } };
  const motion = () => { clock.pause(); if (stepsOnly()) go(readFrame(clock.getSnapshot().progress).index, false); render(); };
  const pagehide = (event: PageTransitionEvent) => { if (event.persisted) clock.pause(); else dispose(); };
  const pageshow = (event: PageTransitionEvent) => { if (event.persisted) resize(); };
  // Cue text can change the card height during playback without changing the
  // math stage. Only stage geometry invalidates its measured endpoints.
  const stage = root.querySelector<HTMLElement>('.dot-stage')!;
  let measuredWidth = stage.clientWidth, measuredHeight = stage.clientHeight;
  const observer = new ResizeObserver(() => {
    if (stage.clientWidth === measuredWidth && stage.clientHeight === measuredHeight) return;
    measuredWidth = stage.clientWidth; measuredHeight = stage.clientHeight;
    resize();
  });
  observer.observe(stage);
  if (syncHash) window.addEventListener("hashchange", restore);
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("pagehide", pagehide); window.addEventListener("pageshow", pageshow); reduced.addEventListener("change", motion);
  const dispose = () => {
    if (disposed) return; disposed = true;
    stopConfig(); observer.disconnect(); unsubscribe(); clock.dispose(); view.dispose(); context?.dispose();
    window.removeEventListener("hashchange", restore); document.removeEventListener("visibilitychange", visibility);
    window.removeEventListener("pagehide", pagehide); window.removeEventListener("pageshow", pageshow); reduced.removeEventListener("change", motion);
    slider.oninput = null; slider.onkeydown = null; chooser.onchange = null; play.onclick = null; back.onclick = null; next.onclick = null;
    opacityControl.oninput = heightControl.oninput = liftControl.onchange = null;
    sizeControl.oninput = null;
    theme.onclick = null;
    root.style.removeProperty('--dot-light-math-size'); root.style.removeProperty('--dot-dark-math-size');
    root.dataset["dotMounted"] = "false";
    delete root.dataset["ready"];
  };
  if (syncHash) restore(); else go(0, false);
  root.setAttribute("aria-busy", "false"); root.dataset["ready"] = "true";
  // Hosts can select semantic milestones without dispatching synthetic UI events
  // or creating a second clock. The callable cleanup preserves existing mounts.
  return Object.assign(dispose, {
    go,
    pause: () => { clock.pause(); render(); },
    seek: (progress: number) => { clock.pause(); clock.seek(progress); },
    progress: () => clock.getSnapshot().progress,
  });
}
