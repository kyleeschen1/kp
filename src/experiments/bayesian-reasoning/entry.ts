import "../authored-focus-card.css";
import "./style.css";
import { checkBayesDraft, createBayesDraft, type PreparedBayesDraft } from "./draft.ts";
import { createBayesAuthoringSession } from "./authoring.ts";
import { renderBayesCardRevision } from "./page.ts";
import { extractBayesDenominator, resolveBayesDenominatorReturn, type BayesDisclosure } from "./extraction.ts";
import { mountBayesNativeSurface } from "./native-surface.ts";
import { createKpFocusDeckCheckpointPlayback } from "../../tutorial/focus-deck-checkpoint-playback.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { resolveKpFocusDeckVisibleBeat } from "../../tutorial/focus-deck-beat-navigation.ts";
import { bindKpFocusDeckKeyboard } from "../../tutorial/focus-deck-keyboard.ts";
import { mountKpFocusDeckNativeInput } from "../../tutorial/focus-deck-native-input.ts";
import { sampleBayesTree } from "./tree-frame.ts";
import { mountBayesTreeSvg, formatBayesMass } from "./tree-svg.ts";

async function mountCard(root: HTMLElement, evidence: PreparedBayesDraft) {
  const card = root.querySelector<HTMLElement>("[data-bayes-card]")!;
  const { score: beats, notation, tree: treePlan } = evidence;
  const tree = mountBayesTreeSvg(card.querySelector<HTMLElement>("[data-bayes-tree-host]")!, treePlan);
  const nativeHost = card.querySelector<HTMLElement>("[data-bayes-native-host]")!;
  const notationPanel = card.querySelector<HTMLElement>("[data-bayes-notation-phase]")!;
  const native = await mountBayesNativeSurface(nativeHost, root.querySelector<HTMLTemplateElement>("template[data-kp-reader-exemplar-template]")!, notation);
  const clock = createKpReaderTimelinePlaybackClock({ id: "clock.bayesian-reasoning", durationMs: 10800, ownerWindow: window });
  const navigation = createKpFocusDeckCheckpointPlayback(clock, beats.map(beat => beat.progress));
  const viewport = card.querySelector<HTMLElement>("[data-kp-focus-deck-viewport]")!;
  const slider = card.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
  const previous = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-previous]")!;
  const next = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-next]")!;
  const replay = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-replay]")!;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const explain = root.querySelector<HTMLButtonElement>("[data-bayes-explain]")!;
  const returnButton = root.querySelector<HTMLButtonElement>("[data-bayes-return]")!;
  const reason = root.querySelector<HTMLElement>("[data-bayes-reason]")!;
  let disclosure: BayesDisclosure = { view: "parent" };
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
    const notationPhase = position >= 3 ? "ratio" : "question";
    notationPanel.dataset["bayesNotationPhase"] = notationPhase;
    nativeHost.setAttribute("aria-hidden", String(notationPhase === "question"));
    card.querySelector("[data-bayes-formula-label]")!.textContent = position >= 3 ? "P(A | B) =" : "";
    native.seek(Math.max(0, Math.min(1, position - 3)));
    const frame = sampleBayesTree(treePlan, position); tree.paint(frame);
    card.querySelector<HTMLElement>("[data-bayes-tree-host]")!.dataset["semanticState"] = frame.stateId;
    card.querySelector("[data-bayes-population-label]")!.textContent = position === 4
      ? `Reference: B only · ${notation.denominatorUnits} of ${notation.unit} units; boxes retain joint masses`
      : position > 3 && position < 4 ? "Restricting the reference to B…"
      : position > 4 && position < 5 ? "Restoring the whole population…" : "Reference: whole population";
    nativeHost.dataset["bayesSalience"] = frame.hierarchy.find(entity => entity.id === treePlan.ratioId)!.salience;
    card.querySelector("#bayes-tree-description")!.textContent = `${beats[Math.min(6, Math.floor(position))]!.title}. Reference population: ${frame.referencePopulationId === treePlan.marginalId ? "B" : "whole population"}. Joint outcomes remain ${treePlan.trace.model.outcomes.map(outcome => `${outcome.key}: ${formatBayesMass(outcome.mass)}`).join(", ")}. P(A given B) = ${formatBayesMass(treePlan.query.value)}.`;
  };
  const seek = (step: number) => { cancel(); navigation.seek(step, !reduced.matches); };
  explain.onclick = () => {
    cancel(); clock.pause();
    disclosure = { view: "reason", extraction: extractBayesDenominator(evidence, navigation.position()) };
    reason.hidden = false; returnButton.hidden = false; explain.hidden = true;
    seek(3); returnButton.focus();
  };
  returnButton.onclick = () => {
    if (disclosure.view !== "reason") return;
    const position = resolveBayesDenominatorReturn(evidence, disclosure.extraction);
    cancel(); navigation.seek(position.step); disclosure = { view: "parent" };
    reason.hidden = true; returnButton.hidden = true; explain.hidden = false; explain.focus();
  };
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
  render(); card.dataset["kpFocusCardEnhancement"] = "ready";
  return { dispose, pause: () => { cancel(); clock.pause(); },
    restore: (position: number) => { cancel(); navigation.seek(position); render(); }, position: navigation.position };
}

async function mount() {
  const display = document.querySelector<HTMLElement>("[data-bayes-display]")!;
  const textarea = document.querySelector<HTMLTextAreaElement>("[data-bayes-draft]")!;
  const apply = document.querySelector<HTMLButtonElement>("[data-bayes-apply]")!;
  const restore = document.querySelector<HTMLButtonElement>("[data-bayes-restore]")!;
  const status = document.querySelector<HTMLElement>("[data-bayes-author-status]")!;
  const initial = checkBayesDraft(JSON.stringify(createBayesDraft()));
  if (initial.status !== "compiled") throw new Error(initial.diagnostic.expected);
  let active = await mountCard(display, initial.draft), disposed = false;
  const session = createBayesAuthoringSession({ initial: initial.draft,
    prepare: async draft => {
      const staging = document.createElement("div");
      staging.className = "bayes-staging"; staging.inert = true; staging.setAttribute("aria-hidden", "true");
      staging.style.width = `${display.getBoundingClientRect().width}px`;
      staging.innerHTML = renderBayesCardRevision(draft); display.after(staging);
      try {
        const surface = await mountCard(staging, draft);
        return { staging, surface, dispose: () => { surface.dispose(); staging.remove(); } };
      } catch (error) { staging.remove(); throw error; }
    },
    commit: prepared => {
      // Restore before acquiring display authority. No await is permitted in
      // this commit: prose, SVG, native ink and controls enter together.
      const position = active.position(); prepared.surface.restore(position);
      const previous = active;
      display.replaceChildren(...prepared.staging.childNodes);
      active = prepared.surface; prepared.staging.remove(); previous.dispose();
    }
  });
  textarea.oninput = () => { session.invalidate(); status.textContent = "Unapplied draft. The complete last valid card remains displayed."; };
  apply.onclick = async () => {
    active.pause(); status.textContent = "Preparing all projections; the last valid card remains displayed.";
    const result = await session.apply(textarea.value);
    if (disposed || result.status === "superseded") return;
    status.textContent = result.status === "applied" ? "Applied all seven steps together. No source file changed."
      : `Last valid card retained. ${result.diagnostic.path}: ${result.diagnostic.expected}`;
    status.dataset["bayesApplyStatus"] = result.status;
  };
  restore.onclick = () => { session.invalidate(); textarea.value = session.current().sourceText;
    status.textContent = "Restored the displayed source. No source file changed."; };
  apply.disabled = false; restore.disabled = false; status.textContent = "Displayed source is valid. Edit and apply to update the whole card.";
  const dispose = () => { if (disposed) return; disposed = true; session.dispose(); active.dispose();
    apply.onclick = null; restore.onclick = null; textarea.oninput = null; window.removeEventListener("pagehide", pagehide); };
  const pagehide = (event: PageTransitionEvent) => { session.invalidate(); if (!event.persisted) dispose(); };
  window.addEventListener("pagehide", pagehide); import.meta.hot?.dispose(dispose);
}
void mount().catch(error => { const output = document.querySelector<HTMLElement>("[data-bayes-error]")!; output.hidden = false; output.textContent = error instanceof Error ? error.message : String(error); });
