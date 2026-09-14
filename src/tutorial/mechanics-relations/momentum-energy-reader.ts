import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { loadMomentumEnergyRuntimeSource } from "./momentum-energy-runtime-source.ts";
import { mountMomentumEnergyStage } from "./momentum-energy-stage.ts";
import { displayNumber } from "./momentum-energy-figure.ts";
import { projectMomentumEnergyAttention } from "./momentum-energy-attention.ts";

/** Enhancement leaves prose and its source order intact. Native document scroll
 * never consumes a beat, and no global key or wheel handler owns the page. */
function enhance(root: HTMLElement) {
  const get = <T extends Element>(selector: string): T => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing reader control ${selector}`);
    return element;
  };
  const manifest = get<HTMLScriptElement>("[data-physics-source]");
  const model = loadMomentumEnergyRuntimeSource(JSON.parse(manifest.textContent ?? "null"));
  const stage = mountMomentumEnergyStage(root, model);
  const slider = get<HTMLInputElement>("input[type=range]"), play = get<HTMLButtonElement>("[data-physics-play]");
  const output = get<HTMLOutputElement>("output"), controls = get<HTMLElement>("[data-physics-controls]");
  const clock = createKpReaderTimelinePlaybackClock({ id: `${root.id}.clock`, durationMs: model.durationSeconds * 2500 });
  const abort = new AbortController(), options = { signal: abort.signal };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const update = () => {
    const progress = clock.getSnapshot().progress;
    stage.project(progress);
    slider.value = String(progress * model.durationSeconds);
    slider.setAttribute("aria-valuetext", `${displayNumber(progress * model.durationSeconds)} seconds`);
    output.value = `${displayNumber(progress * model.durationSeconds)} / ${displayNumber(model.durationSeconds)} s`;
    play.textContent = clock.getStatus() === "playing" ? "Pause" : progress === 1 ? "Replay" : reduced.matches ? "Show end" : "Play";
    root.dataset["playing"] = String(clock.getStatus() === "playing");
    root.dataset["attention"] = projectMomentumEnergyAttention(root.id, progress).primaryTarget;
  };
  const pause = () => { clock.pause(); update(); };
  clock.subscribe(update);
  slider.addEventListener("input", () => clock.seek(Number(slider.value) / model.durationSeconds), options);
  play.addEventListener("click", () => {
    if (clock.getStatus() === "playing") { pause(); return; }
    if (clock.getSnapshot().progress === 1) clock.seek(0);
    if (reduced.matches) clock.seek(1);
    else { clock.play({ direction: "forward", stopAt: 1 }); update(); }
  }, options);
  get<HTMLButtonElement>("[data-physics-reset]").addEventListener("click", () => clock.seek(0), options);
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); }, options);
  reduced.addEventListener("change", pause, options);
  const observer = new IntersectionObserver(entries => { if (!entries[0]?.isIntersecting) pause(); });
  observer.observe(get<HTMLElement>("figure"));
  window.addEventListener("pagehide", event => {
    pause();
    // A cached document must retain its live owner when browser Back restores it.
    if (event.persisted) return;
    observer.disconnect(); abort.abort(); clock.dispose(); stage.dispose();
  }, options);
  controls.hidden = false;
  root.dataset["enhanced"] = "true";
  update();
}

// Static publication owns the initial paint. Mount each small session only as
// it approaches reading context; never hydrate the whole Article as an app.
const activation = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    activation.unobserve(entry.target);
    const root = entry.target as HTMLElement;
    try { enhance(root); }
    catch (error) {
      console.error("Physics reader enhancement requires repair", error);
      root.dataset["repair"] = "true";
    }
  }
}, { rootMargin: "400px" });
for (const root of document.querySelectorAll<HTMLElement>("[data-physics-motion]")) activation.observe(root);
window.addEventListener("pagehide", event => { if (!event.persisted) activation.disconnect(); });
