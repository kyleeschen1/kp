import { createKpTypeScriptFreeShippingRuntimeProjection } from "../../public-web/typescript-free-shipping-runtime.ts";
import { sampleKpTypeScriptRefactorMotionFrame } from "../../animation/typescript-refactor-motion-frame.ts";
import { createKpTypeScriptRefactorTokenProgram, sampleKpTypeScriptRefactorTokenTheater } from "../../animation/typescript-refactor-token-theater.ts";
import { renderKpTypeScriptRefactorDomFrame } from "../../rendering/typescript-refactor-dom-session.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { sha256 } from "../../kernel/sha256.ts";
import { mountShippingFocus } from "./shipping-focus.ts";

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
  const original = required<HTMLButtonElement>("[data-code-original]");
  const position = required<HTMLOutputElement>("[data-code-position]");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const program = createKpTypeScriptRefactorTokenProgram(asset.semantics);
  host.replaceChildren(template.content.cloneNode(true));
  const stage = required<HTMLElement>("[data-code-stage-host] [data-kp-typescript-refactor-stage]");
  const clock = createKpReaderTimelinePlaybackClock({ id: "code-reasoning.inspection", durationMs: asset.score.durationMs });
  const stops = asset.score.stages.map(beat => beat.checkpointMs / asset.score.durationMs);
  let focus: ReturnType<typeof mountShippingFocus> | undefined;
  let selectionSettled = false;
  const render = () => {
    const progress = clock.getSnapshot().progress;
    const native = reduced.matches || selectionSettled;
    const motion = sampleKpTypeScriptRefactorMotionFrame({ score: asset.score, progress, reducedMotion: native });
    const theater = sampleKpTypeScriptRefactorTokenTheater({ program, plan: asset.motionPlan, score: asset.score, progress, reducedMotion: native });
    renderKpTypeScriptRefactorDomFrame(stage, {
      motion,
      theater
    }, asset.accessibility.title);
    stage.style.userSelect = theater.active ? "none" : "text";
    stage.style.setProperty("-webkit-user-select", theater.active ? "none" : "text");
    focus?.render(progress);
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
    resumeInspection();
    const p = clock.getSnapshot().progress;
    const target = direction === "forward" ? stops.find(stop => stop > p + .0001) ?? 1
      : stops.filter(stop => stop < p - .0001).at(-1) ?? 0;
    if (reduced.matches) clock.seek(target);
    else clock.play({ direction, stopAt: target });
    render();
  };
  const abort = new AbortController();
  const options = { signal: abort.signal };
  const resumeInspection = () => {
    selectionSettled = false;
    root.dataset["codeView"] = "inspection";
    required<HTMLElement>("[data-code-source-label]").textContent = "Inspection · original available below";
    original.setAttribute("aria-pressed", "false");
    original.textContent = "Show original";
  };
  original.addEventListener("click", () => {
    pause();
    const show = root.dataset["codeView"] !== "original";
    root.dataset["codeView"] = show ? "original" : "inspection";
    required<HTMLElement>("[data-code-source-label]").textContent = show ? "Original · inspection paused" : "Inspection · original available below";
    original.setAttribute("aria-pressed", String(show));
    original.textContent = show ? "Return to inspection" : "Show original";
  }, options);
  seek.addEventListener("input", () => { resumeInspection(); clock.seek(Number(seek.value)); }, options);
  previous.addEventListener("click", () => move("rewind"), options);
  next.addEventListener("click", () => move("forward"), options);
  play.addEventListener("click", () => {
    resumeInspection();
    if (clock.getStatus() === "playing") { pause(); return; }
    if (clock.getSnapshot().progress === 1) clock.seek(0);
    // Reduced motion keeps explicit access to each pedagogical endpoint.
    if (reduced.matches) move("forward");
    else clock.play({ direction: "forward", stopAt: 1 });
    render();
  }, options);
  root.querySelector("[data-code-inspection]")!.addEventListener("keydown", event => {
    const key = event as KeyboardEvent;
    if (key.defaultPrevented || (key.target instanceof HTMLElement && key.target.closest("textarea"))) return;
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(key.key)) return;
    key.preventDefault();
    if (key.key === "Home" || key.key === "End") { resumeInspection(); clock.seek(key.key === "Home" ? 0 : 1); }
    else move(key.key === "ArrowRight" ? "forward" : "rewind");
  }, options);
  if (new URL(location.href).searchParams.get("reading") === "focus") {
    focus = mountShippingFocus(root, stage, asset, {
      progress: () => clock.getSnapshot().progress,
      seek(p) { resumeInspection(); clock.pause(); clock.seek(p); render(); },
      travel(p) {
        resumeInspection();
        if (reduced.matches) clock.seek(p);
        else clock.play({ direction: p < clock.getSnapshot().progress ? "rewind" : "forward", stopAt: p });
        render();
      },
      settle(p) {
        const changed = stage.style.userSelect === "none" || clock.getSnapshot().progress !== p;
        clock.pause(); selectionSettled = true;
        // A checkpoint may also start the next token track. Explicit selection
        // uses that checkpoint's native projection, then holds the same clock.
        clock.seek(p); render(); return changed;
      }
    });
  }
  reduced.addEventListener("change", pause, options);
  // Closing, backgrounding or leaving the local inspection never runs hidden
  // motion; reopening samples the same held clock, not a fresh session.
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); }, options);
  const observer = new IntersectionObserver(entries => { if (!entries[0]?.isIntersecting) pause(); });
  observer.observe(stage);
  render();
  seek.disabled = false;
  play.disabled = false;
  original.disabled = false;
  root.dataset["codeReady"] = "true";
  return { pause, dispose() { abort.abort(); observer.disconnect(); off(); focus?.dispose(); clock.dispose(); host.replaceChildren(); delete root.dataset["codeReady"]; } };
}
