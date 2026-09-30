import "./style.css";
import { example, numberOf, durationMs, sample } from "./model.ts";
import { stageHtml, mountPresentation, calculationLatex } from "./presentation.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { readKpFocusDeckScrubberKeyTarget } from "../../tutorial/focus-deck-scaffold.ts";
import { renderKpFocusDeckAnnotation } from "../../tutorial/focus-deck-annotation.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";

async function mount() {
  const query = new URLSearchParams(location.search);
  const scene = example(query.get("example") ?? "columns", Number(query.get("column") ?? "0"));
  const { beats } = scene;
  document.querySelector("h1")!.textContent = scene.title;
  document.title = scene.title;
  const intro = document.querySelector("#matrix-story > p")!;
  intro.textContent = scene.evidence ? "Each entry of QᵀQ is a dot product between two columns of Q. Diagonal entries measure squared length; off-diagonal entries measure orthogonality." : "Each column of the right matrix tells us how to combine the columns of the left matrix.";
  const links = ["columns", "identity", "orthonormality"].map((kind, i) => `<a href="?example=${kind}&column=0#weights">${["Column combinations", "Identity", "Orthonormality"][i]}</a>`).join(" · ");
  const root = document.querySelector<HTMLElement>("#comb-player")!;
  root.innerHTML = `<nav aria-label="Matrix examples">${links}</nav>
    <p>Result column: <a href="?example=${scene.kind}&column=0#weights">1</a> · <a href="?example=${scene.kind}&column=1#weights">2</a></p>
    <section class="matrix-card kp-focus-deck" aria-label="Column combination animation">
    <div class="matrix-cue" data-cue aria-live="polite"></div>
    <div class="matrix-scroll" tabindex="0" role="region" aria-label="Column combination; scroll horizontally on narrow screens">${stageHtml(scene)}</div>
    <div class="matrix-controls"><button data-back aria-label="Previous milestone">Previous</button><button data-play>Play</button><button data-next aria-label="Next milestone">Next</button>
    <input data-scrub type="range" min="0" max="1" step="0.0001" value="0" aria-label="Animation position">
    <select aria-label="Milestone">${beats.map((beat, i) => `<option value="${i}">${i + 1}. ${beat.id}</option>`).join("")}</select></div></section>
    <p class="matrix-help">Follow the columns, then watch each scalar reach every entry. Use the scrubber to revisit any moment. On narrow screens, scroll the stage horizontally.</p>
    <details><summary>Read the calculation</summary><div class="comb-static">${renderLatexToHtml(calculationLatex(scene), { output: "htmlAndMathml" })}</div>
    <p>The copied columns and weights refer to the original entries of the two factors. Multiplication produces derived entries; addition produces the result column. The columns of the left matrix do not need to form a basis.</p></details>
    ${scene.evidence ? `<section aria-label="Column dot products"><h2>Why the result is the identity</h2>
      <p>The columns of Q are (0.6, 0.8) and (−0.8, 0.6). Each has squared length 1, and their dot product is 0.</p>
      ${scene.evidence.gram.cells.map(cell => `<p>${renderLatexToHtml(`q_${cell.rowIndex + 1} \\cdot q_${cell.columnIndex + 1} = ${cell.dot.pairs.map(pair => `(${numberOf(pair.left)})(${numberOf(pair.right)})`).join("+")} = ${numberOf(cell.result)}`, { output: "htmlAndMathml" })}</p>`).join("")}
      <p>Numerical check for this Q: ${scene.evidence.status}; tolerance ${scene.evidence.tolerance}. This checks the displayed example, not a symbolic proof for arbitrary matrices.</p></section>` : ""}
    <p><a href="/experiments/matrix-column-product/">Compare the row–column dot-product view</a></p>`;
  await document.fonts.ready;
  const view = mountPresentation(root, scene);
  const clock = createKpReaderTimelinePlaybackClock({ id: "matrix-column-combinations", durationMs });
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
    play.textContent = clock.getStatus() === "playing" ? "Pause" : reduced.matches ? "Next step" : frame.progress === 1 ? "Replay" : "Play";
    if (lastBeat !== frame.beat.id) {
      root.querySelector("[data-cue]")!.innerHTML = renderKpFocusDeckAnnotation({ entityId: frame.beat.id, text: frame.beat.cue });
      lastBeat = frame.beat.id;
    }
    root.dataset["milestone"] = frame.beat.id;
  };
  const go = (index: number, animate = true) => {
    const i = Math.max(0, Math.min(beats.length - 1, index)), target = i / (beats.length - 1);
    clock.pause(); history.replaceState(null, "", `#${beats[i]!.id}`);
    if (animate && !reduced.matches) clock.play({ direction: target < clock.getSnapshot().progress ? "rewind" : "forward", stopAt: target });
    else clock.seek(target);
    render();
  };
  const navigate = (offset: number) => {
    const phase = clock.getSnapshot().progress * (beats.length - 1);
    go(offset > 0 ? Math.floor(phase + 1e-8) + 1 : Math.ceil(phase - 1e-8) - 1);
  };
  slider.oninput = () => { clock.pause(); clock.seek(Number(slider.value)); };
  slider.onkeydown = event => {
    const target = readKpFocusDeckScrubberKeyTarget(event, clock.getSnapshot().progress * (beats.length - 1), beats.length);
    if (target !== undefined) { event.preventDefault(); go(target, false); }
  };
  chooser.onchange = () => go(Number(chooser.value), false);
  back.onclick = () => navigate(-1); next.onclick = () => navigate(1);
  play.onclick = () => {
    if (clock.getStatus() === "playing") clock.pause();
    else if (reduced.matches) { if (clock.getSnapshot().progress === 1) go(0, false); else navigate(1); }
    else { if (clock.getSnapshot().progress === 1) clock.seek(0); clock.play({ direction: "forward", stopAt: 1 }); }
    render();
  };
  const unsubscribe = clock.subscribe(render);
  const restore = () => { const i = beats.findIndex(beat => beat.id === location.hash.slice(1)); go(i < 0 ? 0 : i, false); };
  const resize = () => { clock.pause(); view.prepare(); render(); };
  const visibility = () => { if (document.hidden) { clock.pause(); render(); } };
  const motion = () => { clock.pause(); if (reduced.matches) go(sample(clock.getSnapshot().progress, beats).index, false); render(); };
  const pagehide = (event: PageTransitionEvent) => { if (event.persisted) clock.pause(); else dispose(); };
  const pageshow = (event: PageTransitionEvent) => { if (event.persisted) resize(); };
  const observer = new ResizeObserver(resize); observer.observe(root);
  window.addEventListener("hashchange", restore); document.addEventListener("visibilitychange", visibility);
  window.addEventListener("pagehide", pagehide); window.addEventListener("pageshow", pageshow); reduced.addEventListener("change", motion);
  const dispose = () => {
    if (disposed) return; disposed = true;
    observer.disconnect(); unsubscribe(); clock.dispose(); view.dispose();
    window.removeEventListener("hashchange", restore); document.removeEventListener("visibilitychange", visibility);
    window.removeEventListener("pagehide", pagehide); window.removeEventListener("pageshow", pageshow); reduced.removeEventListener("change", motion);
    slider.oninput = null; slider.onkeydown = null; chooser.onchange = null; play.onclick = null; back.onclick = null; next.onclick = null;
  };
  import.meta.hot?.dispose(dispose);
  restore(); root.setAttribute("aria-busy", "false"); root.dataset["ready"] = "true";
}
void mount().catch(error => {
  const root = document.querySelector<HTMLElement>("#comb-player")!;
  root.setAttribute("aria-busy", "false"); root.dataset["gap"] = "true";
  root.textContent = `The column combination could not be prepared: ${error instanceof Error ? error.message : String(error)}`;
});
