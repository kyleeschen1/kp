import { createKpTypeScriptFreeShippingRuntimeProjection } from "../../public-web/typescript-free-shipping-runtime.ts";
import { sampleKpTypeScriptRefactorMotionFrame } from "../../animation/typescript-refactor-motion-frame.ts";
import { createKpTypeScriptRefactorTokenProgram, sampleKpTypeScriptRefactorTokenTheater } from "../../animation/typescript-refactor-token-theater.ts";
import { renderKpTypeScriptRefactorDomFrame } from "../../rendering/typescript-refactor-dom-session.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { sha256 } from "../../kernel/sha256.ts";

export function mountCodeReasoningInspection(root: HTMLElement): { pause(): void; dispose(): void } {
  const asset = createKpTypeScriptFreeShippingRuntimeProjection();
  if (root.dataset["codeSourcePin"] !== sha256(JSON.stringify(asset.semantics))) {
    throw new Error("Code source revision mismatch; reload the matching publication before inspection.");
  }
  const required = <T extends Element>(selector: string): T => {
    const node = root.querySelector<T>(selector);
    if (!node) throw new Error(`Code inspection is missing ${selector}`);
    return node;
  };
  const host = required<HTMLElement>("[data-code-stage-host]");
  const template = required<HTMLTemplateElement>("[data-code-stage-template]");
  const seek = required<HTMLInputElement>("[data-code-seek]");
  const play = required<HTMLButtonElement>("[data-code-play]");
  const previous = required<HTMLButtonElement>("[data-code-previous]");
  const next = required<HTMLButtonElement>("[data-code-next]");
  const position = required<HTMLOutputElement>("[data-code-position]");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const program = createKpTypeScriptRefactorTokenProgram(asset.semantics);
  host.replaceChildren(template.content.cloneNode(true));
  const stage = required<HTMLElement>("[data-code-stage-host] [data-kp-typescript-refactor-stage]");
  const clock = createKpReaderTimelinePlaybackClock({ id: "code-reasoning.inspection", durationMs: asset.score.durationMs });
  const stops = asset.score.stages.map(beat => beat.checkpointMs / asset.score.durationMs);
  const render = () => {
    const progress = clock.getSnapshot().progress;
    const motion = sampleKpTypeScriptRefactorMotionFrame({ score: asset.score, progress, reducedMotion: reduced.matches });
    renderKpTypeScriptRefactorDomFrame(stage, {
      motion,
      theater: sampleKpTypeScriptRefactorTokenTheater({ program, plan: asset.motionPlan, score: asset.score, progress, reducedMotion: reduced.matches })
    }, asset.accessibility.title);
    // Counter and narration share the score's boundary convention, including
    // exact midpoints; independently choosing a nearest stop can disagree.
    const index = asset.score.stages.findIndex(beat => beat.id === motion.stage.stageId);
    seek.value = String(progress);
    seek.setAttribute("aria-valuetext", `${Math.round(progress * 100)} percent; ${asset.score.stages[index]!.narration}`);
    position.value = `${index + 1} / ${stops.length}`;
    play.textContent = clock.getStatus() === "playing" ? "Pause" : progress === 1 ? "Replay" : "Play";
    previous.disabled = progress === 0;
    next.disabled = progress === 1;
    root.dataset["codeProgress"] = String(progress);
    root.dataset["codePlaying"] = String(clock.getStatus() === "playing");
  };
  const off = clock.subscribe(render);
  const pause = () => { clock.pause(); render(); };
  const move = (direction: "forward" | "rewind") => {
    const p = clock.getSnapshot().progress;
    const target = direction === "forward" ? stops.find(stop => stop > p + .0001) ?? 1
      : stops.filter(stop => stop < p - .0001).at(-1) ?? 0;
    if (reduced.matches) clock.seek(target);
    else clock.play({ direction, stopAt: target });
    render();
  };
  const abort = new AbortController();
  const options = { signal: abort.signal };
  seek.addEventListener("input", () => clock.seek(Number(seek.value)), options);
  previous.addEventListener("click", () => move("rewind"), options);
  next.addEventListener("click", () => move("forward"), options);
  play.addEventListener("click", () => {
    if (clock.getStatus() === "playing") { pause(); return; }
    if (clock.getSnapshot().progress === 1) clock.seek(0);
    // Reduced motion keeps explicit access to each pedagogical endpoint.
    if (reduced.matches) move("forward");
    else clock.play({ direction: "forward", stopAt: 1 });
    render();
  }, options);
  root.querySelector("[data-code-inspection]")!.addEventListener("keydown", event => {
    const key = event as KeyboardEvent;
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(key.key)) return;
    key.preventDefault();
    if (key.key === "Home" || key.key === "End") clock.seek(key.key === "Home" ? 0 : 1);
    else move(key.key === "ArrowRight" ? "forward" : "rewind");
  }, options);
  reduced.addEventListener("change", pause, options);
  // Closing, backgrounding or leaving the local inspection never runs hidden
  // motion; reopening samples the same held clock, not a fresh session.
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); }, options);
  const observer = new IntersectionObserver(entries => { if (!entries[0]?.isIntersecting) pause(); });
  observer.observe(host);
  render();
  seek.disabled = false;
  play.disabled = false;
  root.dataset["codeReady"] = "true";
  return { pause, dispose() { abort.abort(); observer.disconnect(); off(); clock.dispose(); host.replaceChildren(); delete root.dataset["codeReady"]; } };
}
