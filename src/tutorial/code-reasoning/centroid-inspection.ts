import { createCentroidMotion, sampleCentroidMotion, centroidStops, centroidNarration } from "../../animation/centroid-extraction-motion.ts";
import { renderKpTypeScriptTokenTheater } from "../../rendering/typescript-refactor-dom-session.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { renderCentroidNativeCode } from "../../rendering/centroid-native-code-html.ts";

export function mountCentroidInspection(root: HTMLElement) {
  const require = <T extends HTMLElement>(selector: string) => {
    const node = root.querySelector<T>(selector);
    if (!node) throw new Error(`Missing centroid inspection element ${selector}`);
    return node;
  };
  const plan = createCentroidMotion();
  if (root.dataset["centroidSourcePin"] !== plan.artifact.sourcePin) throw new Error("Centroid source and motion differ. Regenerate checked evidence before inspection.");
  const open = require<HTMLButtonElement>("[data-centroid-open]");
  const close = require<HTMLButtonElement>("[data-centroid-close]");
  const controls = require<HTMLElement>("[data-centroid-controls]");
  const stage = require<HTMLElement>("[data-centroid-stage]");
  const native = require<HTMLElement>("[data-centroid-native]");
  const seek = require<HTMLInputElement>("[data-centroid-seek]");
  const previous = require<HTMLButtonElement>("[data-centroid-previous]");
  const next = require<HTMLButtonElement>("[data-centroid-next]");
  const output = require<HTMLOutputElement>("[data-centroid-position]");
  const narration = require<HTMLElement>("[data-centroid-narration]");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const clock = createKpReaderTimelinePlaybackClock({ id: "centroid.first-loop", durationMs: 6000 });
  const render = () => {
    const p = clock.getSnapshot().progress;
    const frame = sampleCentroidMotion(plan, p);
    // Reserve the complete inspection once: native endpoint handoffs must not
    // move the slider or shift the prose below it.
    stage.style.setProperty("--centroid-lines", String(frame.theater.maxLineCount));
    renderKpTypeScriptTokenTheater(stage, frame.theater);
    if (stage.dataset["centroidNativeState"] !== frame.native.id) native.innerHTML = renderCentroidNativeCode(frame.native);
    native.style.opacity = frame.theater.active ? "0" : "1";
    stage.dataset["centroidNativeState"] = frame.native.id;
    root.dataset["centroidProgress"] = String(p);
    seek.value = String(p);
    seek.setAttribute("aria-valuetext", `${Math.round(p * 100)} percent; ${centroidNarration[frame.beat]}`);
    output.value = `${frame.beat + 1} / 3`;
    narration.textContent = centroidNarration[frame.beat]!;
    previous.disabled = p === 0; next.disabled = p === 1;
  };
  const off = clock.subscribe(render);
  const abort = new AbortController(), options = { signal: abort.signal };
  const move = (direction: "forward" | "rewind") => {
    const p = clock.getSnapshot().progress;
    const stopAt = direction === "forward" ? centroidStops.find(stop => stop > p + .00001) ?? 1 : centroidStops.filter(stop => stop < p - .00001).at(-1) ?? 0;
    if (reduced.matches) clock.seek(stopAt);
    else clock.play({ direction, stopAt });
  };
  open.addEventListener("click", () => {
    root.dataset["centroidInspecting"] = "true";
    controls.hidden = false; stage.hidden = false; open.hidden = true;
    render(); next.focus();
  }, options);
  close.addEventListener("click", () => {
    clock.pause(); delete root.dataset["centroidInspecting"];
    controls.hidden = true; stage.hidden = true; open.hidden = false; open.focus();
  }, options);
  previous.addEventListener("click", () => move("rewind"), options);
  next.addEventListener("click", () => move("forward"), options);
  seek.addEventListener("input", () => clock.seek(Number(seek.value)), options);
  controls.addEventListener("keydown", event => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home" || event.key === "End") clock.seek(event.key === "Home" ? 0 : 1);
    else move(event.key === "ArrowRight" ? "forward" : "rewind");
  }, options);
  const pause = () => { clock.pause(); render(); };
  reduced.addEventListener("change", pause, options);
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); }, options);
  const observer = new IntersectionObserver(entries => { if (!entries[0]?.isIntersecting) pause(); });
  observer.observe(root);
  render(); open.hidden = false;
  return () => { abort.abort(); observer.disconnect(); off(); clock.dispose(); };
}
