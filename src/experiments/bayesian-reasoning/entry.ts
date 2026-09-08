import "../authored-focus-card.css";
import "./style.css";
import { createFlaggedTicketSource } from "../../../domains/probability/binary-joint-model.ts";
import { bindBayesEvidence } from "./evidence.ts";
import { compileBayesNotation } from "./notation.ts";
import { createBayesScore } from "./score.ts";
import { mountBayesNativeSurface } from "./native-surface.ts";
import { createKpFocusDeckCheckpointPlayback } from "../../tutorial/focus-deck-checkpoint-playback.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { resolveKpFocusDeckVisibleBeat } from "../../tutorial/focus-deck-beat-navigation.ts";
import { bindKpFocusDeckKeyboard } from "../../tutorial/focus-deck-keyboard.ts";
import { mountKpFocusDeckNativeInput } from "../../tutorial/focus-deck-native-input.ts";
import { createBayesTreePlan, sampleBayesTree } from "./tree-frame.ts";
import { mountBayesTreeSvg, formatBayesMass } from "./tree-svg.ts";

async function mount() {
  const card = document.querySelector<HTMLElement>("[data-bayes-card]")!;
  const evidence = bindBayesEvidence(createFlaggedTicketSource()), beats = createBayesScore(evidence.trace);
  const notation = compileBayesNotation(evidence.trace);
  const treePlan = createBayesTreePlan(evidence.trace);
  const tree = mountBayesTreeSvg(card.querySelector<HTMLElement>("[data-bayes-tree-host]")!, treePlan);
  const nativeHost = card.querySelector<HTMLElement>("[data-bayes-native-host]")!;
  nativeHost.style.visibility = "hidden";
  const native = await mountBayesNativeSurface(nativeHost, document.querySelector<HTMLTemplateElement>("template[data-kp-reader-exemplar-template]")!, notation);
  const clock = createKpReaderTimelinePlaybackClock({ id: "clock.bayesian-reasoning", durationMs: 10800, ownerWindow: window });
  const navigation = createKpFocusDeckCheckpointPlayback(clock, beats.map(beat => beat.progress));
  const viewport = card.querySelector<HTMLElement>("[data-kp-focus-deck-viewport]")!;
  const slider = card.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
  const previous = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-previous]")!;
  const next = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-next]")!;
  const replay = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-replay]")!;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let disposed = false, visible = 0;
  let passage: ReturnType<typeof mountKpFocusDeckNativeInput> | undefined;
  let scrub: ReturnType<typeof navigation.begin> | undefined;
  const cancel = () => { passage?.cancel(); scrub?.cancel(); scrub = undefined; navigation.cancel(); };
  const render = () => {
    if (disposed) return;
    const position = navigation.position();
    visible = resolveKpFocusDeckVisibleBeat(position, visible, navigation.last);
    card.dataset["bayesPosition"] = String(position); card.dataset["bayesRevision"] = evidence.revisionId;
    card.dataset["kpFocusDeckActiveBeat"] = beats[visible]!.slug;
    slider.value = String(position); slider.setAttribute("aria-valuetext", `${visible + 1} / ${beats.length}: ${beats[visible]!.title}`);
    previous.disabled = position <= 0; next.disabled = position >= navigation.last;
    card.querySelector("[data-bayes-count]")!.textContent = `${visible + 1} / ${beats.length}`;
    card.querySelector<HTMLOutputElement>("[data-kp-focus-deck-position]")!.value = beats[visible]!.title;
    card.querySelectorAll<HTMLElement>("[data-kp-focus-deck-beat]").forEach((beat, index) => {
      beat.dataset["kpFocusDeckBeatActive"] = String(index === visible);
      if (index === visible) beat.setAttribute("aria-current", "page"); else beat.removeAttribute("aria-current");
    });
    if (!passage?.ownsTravel()) viewport.scrollLeft = position * viewport.clientWidth;
    nativeHost.style.visibility = position >= 3 ? "visible" : "hidden";
    card.querySelector("[data-bayes-formula-label]")!.textContent = position >= 3 ? "P(A | B) =" : "";
    card.querySelector<HTMLElement>("[data-bayes-question]")!.hidden = position >= 3;
    native.seek(Math.max(0, Math.min(1, position - 3)));
    const frame = sampleBayesTree(treePlan, position); tree.paint(frame);
    card.querySelector<HTMLElement>("[data-bayes-tree-host]")!.dataset["semanticState"] = frame.stateId;
    card.querySelector("[data-bayes-population-label]")!.textContent = position === 4
      ? `Reference: B only · ${notation.denominatorUnits} of ${notation.unit} tickets; boxes retain joint masses`
      : position > 3 && position < 4 ? "Restricting the reference to B…"
      : position > 4 && position < 5 ? "Restoring the whole population…" : "Reference: whole population";
    nativeHost.dataset["bayesSalience"] = frame.hierarchy.find(entity => entity.id === treePlan.ratioId)!.salience;
    card.querySelector("#bayes-tree-description")!.textContent = `${beats[Math.min(6, Math.floor(position))]!.title}. Reference population: ${frame.referencePopulationId === treePlan.marginalId ? "B" : "whole population"}. Joint outcomes remain ${treePlan.trace.model.outcomes.map(outcome => `${outcome.key}: ${formatBayesMass(outcome.mass)}`).join(", ")}. P(A given B) = ${formatBayesMass(treePlan.query.value)}.`;
  };
  const seek = (step: number) => { cancel(); navigation.seek(step, !reduced.matches); };
  previous.onclick = () => seek(Math.max(0, Math.ceil(navigation.position()) - 1));
  next.onclick = () => seek(Math.min(navigation.last, Math.floor(navigation.position()) + 1));
  replay.onclick = () => { cancel(); navigation.seek(0); seek(navigation.last); };
  slider.oninput = () => { if (!scrub) { cancel(); scrub = navigation.begin(performance.now()); } scrub.update(Number(slider.value), performance.now()); };
  const finish = () => { const session = scrub; scrub = undefined; session?.finish(performance.now(), !reduced.matches); };
  slider.onchange = finish; slider.onpointerup = finish; slider.onpointercancel = finish; slider.onblur = finish;
  const keys = bindKpFocusDeckKeyboard({ card, slider, enabled: () => !disposed, position: navigation.position, checkpointCount: () => beats.length, navigate: seek });
  passage = mountKpFocusDeckNativeInput({ viewport, region: card, enabled: () => !disposed, position: navigation.position,
    begin: navigation.begin, reduced: () => reduced.matches, interrupt: cancel });
  const resize = () => { cancel(); clock.pause(); native.invalidate(); render(); };
  const visibility = () => { if (document.hidden) { cancel(); clock.pause(); } };
  const unsubscribe = clock.subscribe(render);
  const dispose = () => { if (disposed) return; cancel(); disposed = true; passage?.dispose(); keys(); unsubscribe(); navigation.dispose(); clock.dispose(); native.dispose();
    window.removeEventListener("resize", resize); window.removeEventListener("pagehide", pagehide); document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", resize); };
  const pagehide = (event: PageTransitionEvent) => { cancel(); clock.pause(); if (!event.persisted) dispose(); };
  window.addEventListener("resize", resize); window.addEventListener("pagehide", pagehide); document.addEventListener("visibilitychange", visibility); reduced.addEventListener("change", resize);
  import.meta.hot?.dispose(dispose);
  render(); card.dataset["kpFocusCardEnhancement"] = "ready";
}
void mount().catch(error => { const output = document.querySelector<HTMLElement>("[data-bayes-error]")!; output.hidden = false; output.textContent = error instanceof Error ? error.message : String(error); });
