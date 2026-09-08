import "../authored-focus-card.css";
import "./style.css";
import "../../rendering/typescript-refactor.css";
import "../../tutorial/kinetic-figure-typescript-focus-card/kinetic-figure-typescript-focus-card.css";
import { bindCodeReasoningEvidence } from "./code-evidence.ts";
import { createCodeReasoningNavigator } from "./code-navigation.ts";
import { reasoningVisibleBeat } from "./gesture.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { bindKpFocusDeckKeyboard } from "../../tutorial/focus-deck-keyboard.ts";
import { mountKpFocusDeckNativeInput } from "../../tutorial/focus-deck-native-input.ts";
import { createKpTypeScriptRefactorTokenProgram, sampleKpTypeScriptRefactorTokenTheater } from "../../animation/typescript-refactor-token-theater.ts";
import { sampleKpTypeScriptRefactorMotionFrame } from "../../animation/typescript-refactor-motion-frame.ts";
import { renderKpTypeScriptRefactorDomFrame } from "../../rendering/typescript-refactor-dom-session.ts";

function mount() {
  const root = document.querySelector<HTMLElement>("#authored-focus-card")!;
  const card = root.querySelector<HTMLElement>("[data-code-reasoning-card]")!;
  const evidence = bindCodeReasoningEvidence(), { runtime, context } = evidence;
  const stage = card.querySelector<HTMLElement>("[data-kp-typescript-refactor-stage]")!;
  const viewport = card.querySelector<HTMLElement>("[data-kp-focus-deck-viewport]")!;
  const slider = card.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
  const previous = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-previous]")!;
  const next = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-next]")!;
  const replay = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-replay]")!;
  const open = root.querySelector<HTMLButtonElement>("[data-code-reasoning-open]")!;
  const back = root.querySelector<HTMLButtonElement>("[data-code-reasoning-return]")!;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const clock = createKpReaderTimelinePlaybackClock({ id: "clock.reasoning.typescript", durationMs: runtime.score.durationMs, ownerWindow: window });
  const navigation = createCodeReasoningNavigator(evidence, clock);
  const program = createKpTypeScriptRefactorTokenProgram(runtime.semantics);
  let disposed = false, visible = 0;
  let passage: ReturnType<typeof mountKpFocusDeckNativeInput> | undefined;
  let scrub: ReturnType<typeof navigation.begin> | undefined;
  const cancel = () => { passage?.cancel(); scrub?.cancel(); scrub = undefined; };
  const render = () => {
    if (disposed) return;
    const progress = clock.getSnapshot().progress, position = navigation.position();
    renderKpTypeScriptRefactorDomFrame(stage, {
      motion: sampleKpTypeScriptRefactorMotionFrame({ score: runtime.score, progress, reducedMotion: reduced.matches }),
      theater: sampleKpTypeScriptRefactorTokenTheater({ program, plan: runtime.motionPlan, score: runtime.score, progress, reducedMotion: reduced.matches })
    }, runtime.accessibility.title);
    visible = reasoningVisibleBeat(position, visible, navigation.last);
    slider.value = String(position); slider.setAttribute("aria-valuetext", context.steps[visible]!.title);
    previous.disabled = position <= 0; next.disabled = position >= navigation.last;
    card.querySelector("[data-code-reasoning-count]")!.textContent = `${visible + 1} / ${navigation.last + 1}`;
    card.querySelectorAll<HTMLElement>("[data-kp-focus-deck-beat]").forEach((beat, index) => {
      if (index === visible) beat.setAttribute("aria-current", "page"); else beat.removeAttribute("aria-current");
      beat.dataset["kpFocusDeckBeatActive"] = String(index === visible);
    });
    if (!passage?.ownsTravel()) viewport.scrollLeft = position * viewport.clientWidth;
    card.dataset["codeReasoningProgress"] = String(progress);
    card.dataset["codeReasoningView"] = navigation.getView();
    card.dataset["kpFocusDeckActiveBeat"] = context.steps[visible]!.slug;
    card.querySelector<HTMLOutputElement>("[data-kp-focus-deck-position]")!.value = context.steps[visible]!.title;
    const reason = navigation.getView() === "reason";
    open.hidden = reason; back.hidden = !reason;
    root.querySelector("[data-code-reasoning-view-label]")!.textContent = reason ? "Supporting reason" : "Argument";
  };
  const seek = (step: number) => { cancel(); navigation.seek(step, !reduced.matches); };
  previous.onclick = () => seek(Math.max(0, Math.ceil(navigation.position()) - 1));
  next.onclick = () => seek(Math.min(navigation.last, Math.floor(navigation.position()) + 1));
  replay.onclick = () => { cancel(); navigation.seek(0); seek(navigation.last); };
  slider.oninput = () => {
    if (!scrub) { cancel(); scrub = navigation.begin(performance.now()); }
    scrub.update(Number(slider.value), performance.now());
  };
  const finish = () => { if (!scrub) return; const session = scrub; scrub = undefined; session.finish(performance.now(), !reduced.matches); };
  slider.onchange = finish; slider.onpointerup = finish; slider.onpointercancel = finish; slider.onblur = finish;
  const unbindKeys = bindKpFocusDeckKeyboard({ card, slider, enabled: () => !disposed, position: navigation.position,
    checkpointCount: () => navigation.last + 1, navigate: seek });
  passage = mountKpFocusDeckNativeInput({ viewport, region: card, enabled: () => !disposed,
    position: navigation.position, begin: navigation.begin, reduced: () => reduced.matches, interrupt: cancel });
  open.onclick = () => {
    cancel(); navigation.open(); visible = 0;
    viewport.querySelector("[data-kp-focus-deck-beat] p")!.textContent = evidence.source.explanation;
    render(); back.focus();
  };
  back.onclick = () => {
    cancel(); navigation.returnToParent(); visible = Math.round(navigation.position());
    viewport.querySelector("[data-kp-focus-deck-beat] .kp-focus-deck__passage-page")!.innerHTML = context.steps[0]!.html;
    render(); open.focus();
  };
  const resize = () => { cancel(); clock.pause(); render(); };
  const visibility = () => { if (document.hidden) { cancel(); clock.pause(); } };
  const pagehide = (event: PageTransitionEvent) => { cancel(); clock.pause(); if (!event.persisted) dispose(); };
  const unsubscribe = clock.subscribe(render);
  const dispose = () => {
    if (disposed) return;
    cancel(); disposed = true; passage?.dispose(); unbindKeys(); unsubscribe(); navigation.dispose(); clock.dispose();
    window.removeEventListener("resize", resize); window.removeEventListener("pagehide", pagehide);
    document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", resize);
  };
  window.addEventListener("resize", resize); window.addEventListener("pagehide", pagehide);
  document.addEventListener("visibilitychange", visibility); reduced.addEventListener("change", resize);
  import.meta.hot?.dispose(dispose);
  render(); card.dataset["kpFocusCardEnhancement"] = "ready";
}
try { mount(); } catch (error) {
  const output = document.querySelector<HTMLElement>("[data-code-reasoning-error]")!;
  output.hidden = false; output.textContent = error instanceof Error ? error.message : String(error);
}
