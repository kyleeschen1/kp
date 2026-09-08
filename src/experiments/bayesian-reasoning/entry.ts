import "../authored-focus-card.css";
import "./style.css";
import { checkBayesDraft, createBayesDraft, type PreparedBayesDraft } from "./draft.ts";
import { createBayesAuthoringSession } from "./authoring.ts";
import { renderBayesCardRevision } from "./page.ts";
import { extractBayesDenominator, resolveBayesDenominatorReturn, type BayesDisclosure } from "./extraction.ts";
import { captureBayesLocation, validateBayesLocation, encodeBayesLocation, readBayesLocation, type BayesLocation } from "./location.ts";
import { projectBayesPrompts } from "./prompts.ts";
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
  let onChange: ((push: boolean) => void) | undefined;
  let changingView = false;
  const prompts = projectBayesPrompts(evidence), practicePanel = root.querySelector<HTMLElement>("[data-bayes-practice-panel]")!;
  const practiceAnswer = root.querySelector<HTMLElement>("[data-bayes-answer]")!;
  let practiceReturn: BayesLocation | undefined;
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
    if (!changingView && clock.getStatus() !== "playing" && !passage?.ownsTravel() && !scrub) onChange?.(false);
  };
  const seek = (step: number) => { cancel(); navigation.seek(step, !reduced.matches); };
  const practiceVisibility = (open: boolean) => {
    card.hidden = open; practicePanel.hidden = !open;
    root.querySelectorAll<HTMLElement>("[data-bayes-reading], [data-bayes-practice-choices]").forEach(node => { node.hidden = open; });
    explain.hidden = open || disclosure.view === "reason";
    reason.hidden = open || disclosure.view !== "reason"; returnButton.hidden = reason.hidden;
  };
  root.querySelectorAll<HTMLButtonElement>("[data-bayes-practice]").forEach(button => { button.onclick = () => {
    cancel(); clock.pause(); practiceReturn = captureBayesLocation(evidence, navigation.position(), disclosure);
    const prompt = prompts.find(item => item.kind === button.dataset["bayesPractice"])!;
    root.querySelector("[data-bayes-prompt-title]")!.textContent = prompt.card.title;
    root.querySelector("[data-bayes-prompt-text]")!.textContent = prompt.card.prompt;
    root.querySelector("[data-bayes-prompt-context]")!.textContent = `${prompt.context.definitions.map(event => `${event.symbol}: ${event.label}`).join("; ")}. ${prompt.context.jointMasses.join(", ")}. ${prompt.context.assumptions.join(" ")}`;
    practiceAnswer.textContent = prompt.card.answer!.value; practiceAnswer.hidden = true;
    practiceVisibility(true); root.querySelector<HTMLButtonElement>("[data-bayes-reveal]")!.focus();
  }; });
  root.querySelector<HTMLButtonElement>("[data-bayes-reveal]")!.onclick = () => { practiceAnswer.hidden = false; };
  root.querySelector<HTMLButtonElement>("[data-bayes-practice-return]")!.onclick = () => {
    if (!practiceReturn) return;
    const saved = validateBayesLocation(evidence, practiceReturn); practiceReturn = undefined;
    practiceVisibility(false); native.invalidate(); navigation.seek(saved.position.step); render(); card.focus();
  };
  explain.onclick = () => {
    changingView = true;
    cancel(); clock.pause();
    disclosure = { view: "reason", extraction: extractBayesDenominator(evidence, navigation.position()) };
    reason.hidden = false; returnButton.hidden = false; explain.hidden = true;
    seek(3); returnButton.focus(); changingView = false; onChange?.(true);
  };
  returnButton.onclick = () => {
    if (disclosure.view !== "reason") return;
    changingView = true;
    const position = resolveBayesDenominatorReturn(evidence, disclosure.extraction);
    cancel(); navigation.seek(position.step); disclosure = { view: "parent" };
    reason.hidden = true; returnButton.hidden = true; explain.hidden = false; explain.focus(); changingView = false; onChange?.(true);
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
    restore: (position: number) => { cancel(); navigation.seek(position); render(); }, position: navigation.position,
    capture: () => captureBayesLocation(evidence, navigation.position(), disclosure),
    onChange: (listener: (push: boolean) => void) => { onChange = listener; },
    restoreLocation: (value: unknown) => {
      const saved = validateBayesLocation(evidence, value);
      cancel(); clock.pause();
      disclosure = saved.view === "parent" ? { view: "parent" }
        : { view: "reason", extraction: extractBayesDenominator(evidence, saved.returnTo.step) };
      practiceReturn = undefined; practiceVisibility(false);
      reason.hidden = disclosure.view !== "reason"; returnButton.hidden = reason.hidden; explain.hidden = !reason.hidden;
      navigation.seek(saved.position.step); render();
    } };
}

async function mount() {
  const display = document.querySelector<HTMLElement>("[data-bayes-display]")!;
  const textarea = document.querySelector<HTMLTextAreaElement>("[data-bayes-draft]")!;
  const apply = document.querySelector<HTMLButtonElement>("[data-bayes-apply]")!;
  const restore = document.querySelector<HTMLButtonElement>("[data-bayes-restore]")!;
  const download = document.querySelector<HTMLButtonElement>("[data-bayes-download]")!;
  const status = document.querySelector<HTMLElement>("[data-bayes-author-status]")!;
  const errorOutput = document.querySelector<HTMLElement>("[data-bayes-error]")!;
  const initial = checkBayesDraft(JSON.stringify(createBayesDraft()));
  if (initial.status !== "compiled") throw new Error(initial.diagnostic.expected);
  let active = await mountCard(display, initial.draft), disposed = false;
  let restoring = true, restoreTarget: BayesLocation | undefined, restoreSequence = 0;
  const remember = (push = false) => {
    if (disposed || restoring) return;
    const navigation = active.capture(), hash = encodeBayesLocation(navigation);
    const state = { ...history.state, kpBayes: { sourceText: session.current().sourceText, navigation } };
    if (push) history.pushState(state, "", hash); else if (location.hash !== hash) history.replaceState(state, "", hash);
  };
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
      const position = active.position();
      if (restoreTarget) prepared.surface.restoreLocation(restoreTarget); else prepared.surface.restore(position);
      const previous = active;
      display.replaceChildren(...prepared.staging.childNodes);
      active = prepared.surface; active.onChange(remember); prepared.staging.remove(); previous.onChange(() => {}); previous.dispose();
    }
  });
  const cancelHistory = () => { ++restoreSequence; restoreTarget = undefined; restoring = false; session.invalidate(); };
  textarea.oninput = () => { cancelHistory(); status.textContent = "Unapplied draft. The complete last valid card remains displayed."; };
  apply.onclick = async () => {
    cancelHistory();
    active.pause(); status.textContent = "Preparing all projections; the last valid card remains displayed.";
    const result = await session.apply(textarea.value);
    if (disposed || result.status === "superseded") return;
    status.textContent = result.status === "applied" ? "Applied all seven steps together. No source file changed."
      : `Last valid card retained. ${result.diagnostic.path}: ${result.diagnostic.expected}`;
    status.dataset["bayesApplyStatus"] = result.status;
    if (result.status === "applied") { errorOutput.hidden = true; remember(true); }
  };
  restore.onclick = () => { cancelHistory(); textarea.value = session.current().sourceText;
    status.textContent = "Restored the displayed source. No source file changed."; };
  download.onclick = () => {
    const current = session.current(), blob = new Blob([current.sourceText], { type: "application/json" });
    const url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url; link.download = `bayes-${current.revisionId.slice(7, 19)}.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    status.textContent = "Downloaded the displayed valid source, not the draft. Build and verify the selected file locally.";
  };
  apply.disabled = false; restore.disabled = false; download.disabled = false; status.textContent = "Displayed source is valid. Edit and apply to update the whole card.";
  active.onChange(remember);
  const restoreHistory = async () => {
    const ticket = ++restoreSequence; restoring = true; session.invalidate(); active.pause();
    try {
      const saved = readBayesLocation(location.hash) ?? history.state?.kpBayes?.navigation;
      if (saved === undefined) { restoring = false; remember(); return; }
      const historySource: unknown = history.state?.kpBayes?.sourceText;
      const candidate = typeof historySource === "string" ? checkBayesDraft(historySource) : initial;
      if (candidate.status !== "compiled") throw new Error("This history entry has no valid probability source.");
      restoreTarget = validateBayesLocation(candidate.draft, saved);
      if (candidate.draft.revisionId === session.current().revisionId) active.restoreLocation(restoreTarget);
      else {
        const result = await session.apply(candidate.draft.sourceText);
        if (result.status === "repair-gap") throw new Error(result.diagnostic.expected);
        if (result.status === "superseded") return;
      }
      if (ticket !== restoreSequence || disposed) return;
      textarea.value = session.current().sourceText;
      errorOutput.hidden = true;
      status.textContent = "Restored the exact source revision and position, paused.";
    } catch (error) {
      if (ticket !== restoreSequence || disposed) return;
      status.textContent = `Address not restored; last valid card retained. ${error instanceof Error ? error.message : String(error)}`;
      errorOutput.textContent = status.textContent; errorOutput.hidden = false;
    } finally { if (ticket === restoreSequence) { restoring = false; restoreTarget = undefined; } }
  };
  const onHistory = () => { void restoreHistory(); };
  const pageshow = (event: PageTransitionEvent) => { if (event.persisted) onHistory(); };
  window.addEventListener("popstate", onHistory); window.addEventListener("hashchange", onHistory); window.addEventListener("pageshow", pageshow);
  const dispose = () => { if (disposed) return; disposed = true; session.dispose(); active.dispose();
    apply.onclick = null; restore.onclick = null; download.onclick = null; textarea.oninput = null; window.removeEventListener("pagehide", pagehide);
    window.removeEventListener("popstate", onHistory); window.removeEventListener("hashchange", onHistory); window.removeEventListener("pageshow", pageshow); };
  const pagehide = (event: PageTransitionEvent) => { session.invalidate(); active.pause(); remember(); if (!event.persisted) dispose(); };
  window.addEventListener("pagehide", pagehide); import.meta.hot?.dispose(dispose);
  await restoreHistory();
}
void mount().catch(error => { const output = document.querySelector<HTMLElement>("[data-bayes-error]")!; output.hidden = false; output.textContent = error instanceof Error ? error.message : String(error); });
