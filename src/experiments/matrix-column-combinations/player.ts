import { readMatrixConfig, observeMatrixConfig } from "../matrix-examples/config.ts";
import { durationMs, sample, type ColumnExample } from "./model.ts";
import { mountPresentation } from "./presentation.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { readKpFocusDeckScrubberKeyTarget } from "../../tutorial/focus-deck-scaffold.ts";
import { renderKpFocusDeckAnnotation } from "../../tutorial/focus-deck-annotation.ts";

/** One selected scene owns one clock, view and observer set. Navigation owns
 * replacement and history; the player owns only controls and sampled paint. */
export function mountColumnPlayer(root: HTMLElement, scene: ColumnExample,
  progress: number, onSettled: (progress: number) => void) {
  const { beats } = scene;
  const view = mountPresentation(root, scene);
  const clock = createKpReaderTimelinePlaybackClock({ id: "matrix-column-combinations", durationMs });
  let config = readMatrixConfig(document);
  const stepsOnly = () => reduced.matches || config.motion === "steps";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const slider = root.querySelector<HTMLInputElement>("[data-scrub]")!;
  const chooser = root.querySelector<HTMLSelectElement>("select")!;
  const play = root.querySelector<HTMLButtonElement>("[data-play]")!;
  const back = root.querySelector<HTMLButtonElement>("[data-back]")!;
  const next = root.querySelector<HTMLButtonElement>("[data-next]")!;
  let disposed = false, lastBeat = "";
  const render = () => {
    if (disposed) return;
    const frame = view.render(clock.getSnapshot().progress);
    slider.value = String(frame.progress); slider.setAttribute("aria-valuetext", frame.beat.cue);
    chooser.value = String(frame.index); back.disabled = frame.progress === 0; next.disabled = frame.progress === 1;
    play.textContent = clock.getStatus() === "playing" ? "Pause" : stepsOnly() ? "Next step" : frame.progress === 1 ? "Replay" : "Play";
    if (lastBeat !== frame.beat.id) {
      root.querySelector("[data-cue]")!.innerHTML = renderKpFocusDeckAnnotation({ entityId: frame.beat.id, text: frame.beat.cue });
      lastBeat = frame.beat.id;
    }
    root.dataset["milestone"] = frame.beat.id;
    if (clock.getStatus() !== "playing") onSettled(frame.progress);
  };
  const go = (index: number, animate = true) => {
    const i = Math.max(0, Math.min(beats.length - 1, index)), target = i / (beats.length - 1);
    clock.pause();
    if (animate && !stepsOnly()) clock.play({ direction: target < clock.getSnapshot().progress ? "rewind" : "forward", stopAt: target });
    else clock.seek(target);
    render();
  };
  const navigate = (offset: number) => {
    const phase = clock.getSnapshot().progress * (beats.length - 1);
    go(offset > 0 ? Math.floor(phase + 1e-8) + 1 : Math.ceil(phase - 1e-8) - 1);
  };
  slider.oninput = () => {
    // Pausing publishes a frame and can rewrite the input's displayed value.
    const target = Number(slider.value); clock.pause(); clock.seek(target);
  };
  slider.onkeydown = event => {
    const target = readKpFocusDeckScrubberKeyTarget(event, clock.getSnapshot().progress * (beats.length - 1), beats.length);
    if (target !== undefined) { event.preventDefault(); go(target, false); }
  };
  chooser.onchange = () => go(Number(chooser.value), false);
  back.onclick = () => navigate(-1); next.onclick = () => navigate(1);
  play.onclick = () => {
    if (clock.getStatus() === "playing") clock.pause();
    else if (stepsOnly()) { if (clock.getSnapshot().progress === 1) go(0, false); else navigate(1); }
    else { if (clock.getSnapshot().progress === 1) clock.seek(0); clock.play({ direction: "forward", stopAt: 1 }); }
    render();
  };
  const unsubscribe = clock.subscribe(render);
  const resize = () => { clock.pause(); view.prepare(); render(); };
  const stopConfig = observeMatrixConfig(document, next => { config = next; resize(); });
  const visibility = () => { if (document.hidden) { clock.pause(); render(); } };
  const motion = () => { clock.pause(); if (stepsOnly()) go(sample(clock.getSnapshot().progress, beats).index, false); render(); };
  const observer = new ResizeObserver(resize); observer.observe(root);
  document.addEventListener("visibilitychange", visibility);
  reduced.addEventListener("change", motion);
  const dispose = () => {
    if (disposed) return; disposed = true;
    stopConfig(); observer.disconnect(); unsubscribe(); clock.dispose(); view.dispose();
    document.removeEventListener("visibilitychange", visibility);
    reduced.removeEventListener("change", motion);
    slider.oninput = null; slider.onkeydown = null; chooser.onchange = null; play.onclick = null; back.onclick = null; next.onclick = null;
  };
  try { clock.seek(progress); render(); }
  catch (error) { dispose(); throw error; }
  return { dispose, prepare: resize, pause: () => { clock.pause(); render(); },
    progress: () => clock.getSnapshot().progress,
    seek: (value: number) => { clock.pause(); clock.seek(value); render(); } };
}
