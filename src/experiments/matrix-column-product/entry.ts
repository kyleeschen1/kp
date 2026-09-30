import "./style.css";
import source from "./score.ts?raw";
import { matrixColumnStory, timeline, sampleStory } from "./score.ts";
import { matrixStageHtml, mountMatrixColumnPresentation } from "./presentation.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { readKpFocusDeckScrubberKeyTarget } from "../../tutorial/focus-deck-scaffold.ts";
import { renderKpFocusDeckAnnotation } from "../../tutorial/focus-deck-annotation.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";

async function mount() {
  const root = document.querySelector<HTMLElement>("#matrix-player")!;
  const story = matrixColumnStory();
  const { duration, stops } = timeline(story);
  root.innerHTML = `<section class="matrix-card kp-focus-deck" aria-label="Matrix multiplication animation">
    <div class="matrix-cue" data-cue aria-live="polite"></div>
    <div class="matrix-scroll" tabindex="0" role="region" aria-label="Matrix stage; scroll horizontally on narrow screens">${matrixStageHtml(story.state.env)}</div>
    <div class="matrix-controls"><button data-back aria-label="Previous milestone">Previous</button><button data-play>Play</button><button data-next aria-label="Next milestone">Next</button>
    <input data-scrub type="range" min="0" max="1" step="0.0001" value="0" aria-label="Animation position">
    <select data-step aria-label="Milestone">${story.steps.map((step, i) => `<option value="${i}">${i + 1}. ${step.name}</option>`).join("")}</select></div></section>
    <p class="matrix-help">Play the sequence, drag the scrubber, or choose a milestone. Arrow keys on the scrubber move between milestones. On a narrow screen, scroll the equation horizontally.</p>
    <details><summary>The four dot products</summary><div class="matrix-static">${story.state.env.cells.map(c => renderLatexToHtml(`${c.left[0]}\\times ${c.right[0]} + ${c.left[1]}\\times ${c.right[1]} = ${c.result}`, { output: "htmlAndMathml" })).join("")}</div></details>
    <details><summary>The chained transform score</summary><p>This is the executable, bounded score for this example. It is not the full proposed general-purpose math API.</p><pre><code data-score></code></pre></details>`;
  root.querySelector("[data-score]")!.textContent = source.slice(source.indexOf("export function matrixColumnStory"), source.indexOf("// Candidate presentation cadence"));
  await document.fonts.ready;
  const view = mountMatrixColumnPresentation(root, story);
  const clock = createKpReaderTimelinePlaybackClock({ id: "matrix-column-product", durationMs: duration });
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const slider = root.querySelector<HTMLInputElement>("[data-scrub]")!;
  const chooser = root.querySelector<HTMLSelectElement>("[data-step]")!;
  const play = root.querySelector<HTMLButtonElement>("[data-play]")!;
  const previous = root.querySelector<HTMLButtonElement>("[data-back]")!;
  const next = root.querySelector<HTMLButtonElement>("[data-next]")!;
  let lastCue = "", disposed = false;
  const render = () => {
    if (disposed) return;
    const p = clock.getSnapshot().progress;
    const frame = view.render(p)!;
    slider.value = String(p); slider.setAttribute("aria-valuetext", frame.step.cue);
    chooser.value = String(frame.index);
    previous.disabled = p === 0; next.disabled = p === 1;
    play.textContent = clock.getStatus() === "playing" ? "Pause" : p === 1 ? "Replay" : reduced.matches ? "Next step" : "Play";
    if (lastCue !== frame.step.name) {
      root.querySelector("[data-cue]")!.innerHTML = renderKpFocusDeckAnnotation({ entityId: frame.step.name, text: frame.step.cue });
      lastCue = frame.step.name;
    }
    root.dataset["milestone"] = frame.step.name;
  };
  const go = (index: number, animate = true) => {
    clock.pause();
    const target = stops[Math.max(0, Math.min(stops.length - 1, index))]!;
    history.replaceState(null, "", `#${story.steps[Math.max(0, Math.min(stops.length - 1, index))]!.name}`);
    if (animate && !reduced.matches) clock.play({ direction: target < clock.getSnapshot().progress ? "rewind" : "forward", stopAt: target });
    else clock.seek(target);
    render();
  };
  const navigate = (offset: number) => {
    const p = clock.getSnapshot().progress;
    const index = offset > 0 ? stops.findIndex(t => t > p + 1e-8) : stops.reduce((found, t, i) => t < p - 1e-8 ? i : found, -1);
    go(index < 0 ? offset > 0 ? stops.length - 1 : 0 : index);
  };
  slider.oninput = () => { clock.pause(); clock.seek(Number(slider.value)); };
  slider.onkeydown = event => {
    const f = sampleStory(story, clock.getSnapshot().progress);
    const position = f.index === 0 ? 0 : f.index - 1 + f.local;
    const target = readKpFocusDeckScrubberKeyTarget(event, position, stops.length);
    if (target !== undefined) { event.preventDefault(); go(target, false); }
  };
  chooser.onchange = () => go(Number(chooser.value), false);
  previous.onclick = () => navigate(-1); next.onclick = () => navigate(1);
  play.onclick = () => {
    if (clock.getStatus() === "playing") clock.pause();
    else if (reduced.matches) navigate(1);
    else { if (clock.getSnapshot().progress === 1) clock.seek(0); clock.play({ direction: "forward", stopAt: 1 }); }
    render();
  };
  const unsubscribe = clock.subscribe(render);
  const restore = () => { const i = story.steps.findIndex(s => s.name === location.hash.slice(1)); go(i < 0 ? 0 : i, false); };
  const resize = () => { clock.pause(); view.prepare(); render(); };
  const visibility = () => { if (document.hidden) { clock.pause(); render(); } };
  const motion = () => { clock.pause(); render(); };
  const pagehide = (event: PageTransitionEvent) => { if (event.persisted) clock.pause(); else dispose(); };
  const pageshow = (event: PageTransitionEvent) => { if (event.persisted) resize(); };
  const observer = new ResizeObserver(resize); observer.observe(root);
  window.addEventListener("hashchange", restore); document.addEventListener("visibilitychange", visibility);
  window.addEventListener("pagehide", pagehide); window.addEventListener("pageshow", pageshow);
  reduced.addEventListener("change", motion);
  const dispose = () => {
    if (disposed) return; disposed = true;
    observer.disconnect(); unsubscribe(); clock.dispose(); view.dispose();
    window.removeEventListener("hashchange", restore); document.removeEventListener("visibilitychange", visibility);
    window.removeEventListener("pagehide", pagehide); window.removeEventListener("pageshow", pageshow);
    reduced.removeEventListener("change", motion);
    slider.oninput = null; slider.onkeydown = null; chooser.onchange = null;
    play.onclick = null; previous.onclick = null; next.onclick = null;
  };
  import.meta.hot?.dispose(dispose);
  restore(); root.setAttribute("aria-busy", "false"); root.dataset["ready"] = "true";
}
void mount().catch(error => {
  const root = document.querySelector<HTMLElement>("#matrix-player")!;
  root.setAttribute("aria-busy", "false"); root.dataset["gap"] = "true";
  root.textContent = `The matrix presentation could not be prepared: ${error instanceof Error ? error.message : String(error)}`;
});
