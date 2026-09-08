import "../authoring-distribution-focus-card/style.css";
import "./style.css";
import { createKpReasoningSource } from "./source.ts";
import { bindKpReasoningEvidence } from "./evidence.ts";
import { createKpReasoningNavigator, type KpReasoningScrub } from "./navigation.ts";
import { renderReasoningCard, renderReasoningPage, reasoningBeats, escapeReasoningText } from "./scaffold.ts";
import { mountReasoningNativeSurface } from "./native-surface.ts";
import { renderKpFocusDeckScaffold } from "../../tutorial/focus-deck-scaffold.ts";
import { bindKpFocusDeckKeyboard } from "../../tutorial/focus-deck-keyboard.ts";
import type { ReasoningReading } from "./readings.ts";
import type { ReasoningPromptKind } from "./prompts.ts";
import { createReasoningAuthoringSession } from "./authoring.ts";
import { mountReasoningPassageInput } from "./passage-input.ts";
import { reasoningVisibleBeat } from "./gesture.ts";

const root = document.querySelector<HTMLElement>("#authored-focus-card")!;
const report = (error: unknown) => {
  const output = root.querySelector<HTMLElement>("[data-reasoning-error]")!;
  output.hidden = false; output.textContent = error instanceof Error ? error.message : String(error);
  root.dataset["kpReasoningStatus"] = "repair-gap";
};

async function mount() {
  let evidence = bindKpReasoningEvidence(createKpReasoningSource());
  const card = root.querySelector<HTMLElement>("[data-kp-reasoning-card]")!;
  const surface = await mountReasoningNativeSurface(card, evidence);
  const authoring = createReasoningAuthoringSession(surface.animation);
  evidence = authoring.getCurrent().evidence;
  let navigation = createKpReasoningNavigator(evidence, surface.clock);
  let prompts = authoring.getCurrent().prompts;
  const clock = surface.clock;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const viewport = card.querySelector<HTMLElement>("[data-kp-focus-deck-viewport]")!;
  // This host preserves intermediate playhead positions, including interrupted
  // returns. CSS endpoint snapping must not become a second clock authority.
  viewport.dataset["kpFocusDeckSnapDisabled"] = "true";
  const slider = card.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
  const previous = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-previous]")!;
  const next = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-next]")!;
  const replay = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-replay]")!;
  const open = root.querySelector<HTMLButtonElement>("[data-reasoning-open]")!;
  const back = root.querySelector<HTMLButtonElement>("[data-reasoning-return]")!;
  const reading = root.querySelector<HTMLSelectElement>("[data-reasoning-reading]")!;
  let mode: ReasoningReading = "full";
  let beats = reasoningBeats(evidence, "parent");
  let semanticBeats = reasoningBeats(evidence, "reason", "full");
  let visibleBeat = 0;
  let disposed = false;
  let restoringHistory = true;
  const readLocation = (): unknown => {
    const encoded = new URLSearchParams(location.hash.slice(1)).get("reasoning");
    if (encoded === null) return history.state?.kpReasoning;
    try {
      if (encoded.length > 10_000) throw new Error("Reasoning location exceeds its bounded size.");
      return JSON.parse(encoded);
    } catch { return { navigation: null }; }
  };
  const savedHistory = readLocation();
  const remember = (push = false) => {
    if (disposed || restoringHistory || practice) return;
    const state = { ...history.state, kpReasoning: { navigation: navigation.capture(), mode } };
    // The revision-pinned address survives reload even if a browser drops its
    // opaque history state. It is transport only, validated again on restore.
    const url = new URL(location.href);
    url.hash = new URLSearchParams({ reasoning: JSON.stringify(state.kpReasoning) }).toString();
    if (push) history.pushState(state, "", url); else history.replaceState(state, "", url);
  };
  let input: { kind: "idle" } | { kind: "slider"; session: KpReasoningScrub } = { kind: "idle" };
  let passageInput: ReturnType<typeof mountReasoningPassageInput> | undefined;
  const cancelInput = () => {
    passageInput?.cancel();
    if (input.kind !== "idle") input.session.cancel();
    input = { kind: "idle" };
  };
  const beginInput = (kind: "slider") => {
    if (disposed || practice) return;
    if (input.kind === kind) return;
    cancelInput();
    const session = navigation.beginScrub();
    input = { kind, session };
  };
  const finishInput = (kind: "slider") => {
    if (input.kind !== kind) return;
    const session = input.session;
    input = { kind: "idle" };
    session.finish(!reduced.matches);
  };
  let practiceReturn: ReturnType<typeof navigation.capture> | undefined;
  let practice: (typeof prompts)[number] | undefined;
  const practicePanel = root.querySelector<HTMLElement>("[data-reasoning-practice-panel]")!;
  const answer = root.querySelector<HTMLElement>("[data-reasoning-answer]")!;
  const passageFactor = () => (beats.length - 1) / navigation.end;
  const render = (align = true) => {
    if (disposed) return;
    surface.render(reduced.matches);
    const position = navigation.getStepPosition();
    const passagePosition = clock.getSnapshot().progress * passageFactor();
    visibleBeat = reasoningVisibleBeat(position, visibleBeat, navigation.stepCount);
    const index = visibleBeat;
    const label = semanticBeats[index]!.title;
    slider.value = String(position);
    slider.setAttribute("aria-valuetext", label);
    previous.disabled = Boolean(practice) || position <= 0;
    next.disabled = Boolean(practice) || position >= navigation.stepCount;
    slider.disabled = Boolean(practice); replay.disabled = Boolean(practice);
    card.dataset["kpFocusDeckActiveBeat"] = beats[index]!.slug;
    card.querySelector<HTMLOutputElement>("[data-kp-focus-deck-position]")!.value = label;
    const counter = card.querySelector<HTMLElement>("[data-reasoning-beat-count]")!;
    counter.hidden = Boolean(practice);
    const countText = `${index + 1} / ${beats.length}`;
    if (counter.textContent !== countText) {
      counter.textContent = countText;
      counter.setAttribute("aria-label", `Beat ${index + 1} of ${beats.length}`);
    }
    viewport.querySelectorAll<HTMLElement>("[data-kp-focus-deck-beat]").forEach((item, i) => {
      const active = practice ? i === 0 : i === index;
      item.dataset["kpFocusDeckBeatActive"] = String(active);
      if (active) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current");
    });
    if (align && !practice && !passageInput?.ownsTravel()) viewport.scrollLeft = passagePosition * Math.max(1, viewport.clientWidth);
    root.dataset["kpReasoningView"] = navigation.getView();
    if (clock.getStatus() !== "playing" && input.kind === "idle" && !passageInput?.ownsTravel()) remember();
  };
  const navigate = (index: number) => {
    cancelInput();
    clock.pause(); surface.prepare();
    navigation.seekStep(index, !reduced.matches);
  };
  const updateView = () => {
    cancelInput();
    // A restored intermediate view has no active gesture origin. Orient its
    // count to the nearest beat without quantizing the exact saved playhead.
    visibleBeat = Math.round(navigation.getStepPosition());
    const view = navigation.getView();
    const template = document.createElement("div");
    template.innerHTML = renderReasoningCard(evidence, view, mode);
    beats = reasoningBeats(evidence, view, mode);
    semanticBeats = reasoningBeats(evidence, "reason", "full");
    viewport.innerHTML = template.querySelector("[data-kp-focus-deck-viewport]")!.innerHTML;
    // Timeline controls expose operations even when the prose has fewer pages.
    card.querySelector(".kp-focus-deck__ticks")!.innerHTML = Array.from({ length: navigation.stepCount + 1 },
      (_, index) => `<span style="left:${index / navigation.stepCount * 100}%"></span>`).join("");
    slider.max = String(navigation.stepCount);
    open.hidden = view === "reason"; back.hidden = view === "parent";
    root.querySelector<HTMLElement>("[data-reasoning-location]")!.textContent = view === "parent" ? "Argument" : "Supporting reason";
    card.querySelector<HTMLElement>("[data-reasoning-view-label]")!.textContent = view === "parent" ? "Argument" : "Supporting reason";
    render();
  };
  const unsubscribe = clock.subscribe(() => render());
  previous.onclick = () => { cancelInput(); surface.prepare(); navigation.step("rewind", !reduced.matches); };
  next.onclick = () => { cancelInput(); surface.prepare(); navigation.step("forward", !reduced.matches); };
  replay.onclick = () => { navigation.seekStep(0); navigate(navigation.stepCount); };
  slider.oninput = () => {
    beginInput("slider");
    if (input.kind === "slider") input.session.update(Number(slider.value));
  };
  slider.onchange = () => finishInput("slider");
  slider.onpointerup = () => finishInput("slider");
  slider.onpointercancel = () => finishInput("slider");
  slider.onblur = () => finishInput("slider");
  const unbindKeyboard = bindKpFocusDeckKeyboard({ card, slider,
    enabled: () => !disposed && !practice,
    position: () => navigation.getStepPosition(),
    checkpointCount: () => navigation.stepCount + 1, navigate });
  passageInput = mountReasoningPassageInput({ viewport, region: card,
    enabled: () => !disposed && !practice,
    position: () => navigation.getStepPosition(),
    begin: now => navigation.beginPassageGesture(now),
    reduced: () => reduced.matches,
    interrupt: cancelInput
  });
  const disclose = (action: () => unknown) => {
    remember(); restoringHistory = true;
    try { action(); updateView(); } finally { restoringHistory = false; }
    remember(true);
  };
  open.onclick = () => { disclose(() => navigation.open()); back.focus(); };
  back.onclick = () => { disclose(() => navigation.returnToParent()); open.focus(); };
  reading.onchange = () => {
    clock.pause(); mode = reading.value === "compact" ? "compact" : "full";
    updateView(); root.dataset["kpReasoningReading"] = mode;
  };
  const setPractice = (active: boolean) => {
    cancelInput();
    card.querySelector<HTMLElement>(".kp-focus-deck__navigation")!.inert = active;
    root.querySelector<HTMLElement>("[data-reasoning-context] details")!.hidden = active;
    root.querySelector<HTMLElement>(".reasoning-toolbar")!.hidden = active;
    practicePanel.hidden = !active;
    root.dataset["kpReasoningPractice"] = active ? practice!.kind : "none";
  };
  root.querySelectorAll<HTMLButtonElement>("[data-reasoning-practice]").forEach(button => {
    button.onclick = () => {
      practiceReturn = navigation.capture(); clock.pause();
      practice = prompts.find(item => item.kind === button.dataset["reasoningPractice"] as ReasoningPromptKind)!;
      root.querySelector<HTMLElement>("[data-reasoning-prompt-title]")!.textContent = practice.card.title;
      root.querySelector<HTMLElement>("[data-reasoning-prompt]")!.textContent = practice.card.prompt;
      root.querySelector<HTMLTextAreaElement>("[data-reasoning-working]")!.value = "";
      answer.hidden = true; answer.textContent = "";
      const template = document.createElement("div");
      template.innerHTML = renderKpFocusDeckScaffold({ id: "reasoning-practice", ariaLabel: practice.card.title,
        stageHtml: "", activeBeatSlug: "question", beats: [{ slug: "question", title: practice.card.title,
          html: `<p>${escapeReasoningText(practice.card.prompt)}</p>` }] });
      viewport.innerHTML = template.querySelector("[data-kp-focus-deck-viewport]")!.innerHTML;
      viewport.scrollLeft = 0;
      setPractice(true); clock.seek(practice.startProgress);
      root.querySelector<HTMLTextAreaElement>("[data-reasoning-working]")!.focus();
    };
  });
  root.querySelector<HTMLButtonElement>("[data-reasoning-reveal]")!.onclick = () => {
    if (!practice) return;
    // Disclosure changes presentation only; the immutable prompt carries the
    // same revision and verified answer before and after comparison.
    clock.seek(practice.answerProgress); answer.hidden = false;
    const steps = reasoningBeats(evidence, "reason", "full");
    answer.dataset["reasoningAnswerOperations"] = practice.answerOperations.map(item => item.id).join(" ");
    answer.textContent = `Verified sequence: ${practice.answerOperations.map(item =>
      steps[evidence.steps.findIndex(step => step.id === item.id) + 1]!.title).join(" → ")}. Compare the equation above; your wording is not automatically graded.`;
  };
  root.querySelector<HTMLButtonElement>("[data-reasoning-practice-return]")!.onclick = () => {
    if (!practiceReturn) return;
    navigation.restore(practiceReturn); practice = undefined; practiceReturn = undefined;
    setPractice(false); updateView(); (navigation.getView() === "reason" ? back : open).focus();
  };
  const editor = root.querySelector<HTMLTextAreaElement>("[data-reasoning-json]")!;
  const draftStatus = root.querySelector<HTMLElement>("[data-reasoning-draft-status]")!;
  editor.value = JSON.stringify(evidence.source, null, 2);
  root.querySelector<HTMLButtonElement>("[data-reasoning-download]")!.onclick = () => {
    // Export the applied source, never a broken editor draft or serialized proof.
    const url = URL.createObjectURL(new Blob([JSON.stringify(evidence.source, null, 2) + "\n"], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = "reasoning.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  const stampRevision = () => {
    root.dataset["kpReasoningRevision"] = evidence.revisionId;
    root.querySelector<HTMLElement>("[data-reasoning-revision]")!.textContent = evidence.revisionId;
  };
  const loadDraft = (short: boolean) => {
    const source = createKpReasoningSource();
    editor.value = JSON.stringify(short ? { ...source,
      title: "Stop before the final quotient",
      parent: { ...source.parent, statement: "Distribute, normalize, and evaluate the constant numerator.", targetStateId: "fraction-solve.state.constant-product" },
      reason: { ...source.reason, operationIds: source.reason.operationIds.slice(0, 3), explanation: "Distribute to both terms, normalize, then multiply the constant numerator. Leave the quotient unevaluated." },
      compact: "Distribute and evaluate the numerator; retain the quotient." } : source, null, 2);
    draftStatus.textContent = "Draft loaded, not applied. Choose Apply source to update all views.";
  };
  root.querySelector<HTMLButtonElement>("[data-reasoning-short-draft]")!.onclick = () => loadDraft(true);
  root.querySelector<HTMLButtonElement>("[data-reasoning-reset-draft]")!.onclick = () => loadDraft(false);
  root.querySelector<HTMLButtonElement>("[data-reasoning-apply]")!.onclick = () => {
    const result = authoring.apply(editor.value);
    if (result.status === "repair-gap") {
      draftStatus.textContent = `${result.diagnostic.code} at ${result.diagnostic.path}: ${result.diagnostic.expected} Last valid lesson retained.`;
      draftStatus.dataset["status"] = "repair-gap";
      return;
    }
    restoringHistory = true;
    cancelInput(); clock.pause(); navigation.dispose();
    clock.seek(0);
    evidence = result.current.evidence; prompts = result.current.prompts;
    navigation = createKpReasoningNavigator(evidence, clock);
    practice = undefined; practiceReturn = undefined; setPractice(false);
    const template = document.createElement("div");
    template.innerHTML = renderReasoningPage(evidence);
    root.querySelector<HTMLElement>("[data-reasoning-context]")!.innerHTML = template.querySelector("[data-reasoning-context]")!.innerHTML;
    root.querySelector<HTMLElement>("[data-reasoning-title]")!.textContent = evidence.source.title;
    open.textContent = evidence.source.reason.title;
    card.setAttribute("aria-label", evidence.source.title);
    updateView(); clock.seek(0); stampRevision();
    restoringHistory = false; remember();
    draftStatus.textContent = "Applied to full/compact readings, reason, native endpoint and both practice answers. Reading reset to the beginning of the new revision. Draft remains local to this page.";
    draftStatus.dataset["status"] = "applied";
  };
  const resize = () => { if (!disposed) { cancelInput(); clock.pause(); surface.resize(); render(); } };
  const motion = () => { cancelInput(); clock.pause(); render(); };
  const visibility = () => { if (document.hidden) { cancelInput(); clock.pause(); } };
  const restoreHistory = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    const saved = value as { navigation?: unknown; mode?: unknown };
    restoringHistory = true;
    try {
      // History is untrusted transport; the navigator validates revision and
      // semantic anchors atomically before replacing the last valid position.
      navigation.restore(saved.navigation);
      practice = undefined; practiceReturn = undefined; setPractice(false);
      mode = saved.mode === "compact" ? "compact" : "full"; reading.value = mode;
      root.dataset["kpReasoningReading"] = mode;
      updateView();
    } catch (error) {
      draftStatus.textContent = `Cannot restore this historical revision: ${error instanceof Error ? error.message : String(error)}`;
      draftStatus.dataset["status"] = "repair-gap";
    } finally { restoringHistory = false; }
  };
  const popstate = () => restoreHistory(readLocation());
  const pagehide = (event: PageTransitionEvent) => {
    cancelInput(); clock.pause(); remember();
    // A bfcache document retains its owners; disposing it would revive a dead
    // card on browser Back. Freeze playback but leave restoration possible.
    if (!event.persisted) dispose();
  };
  const dispose = () => {
    if (disposed) return;
    cancelInput(); disposed = true; unsubscribe(); navigation.dispose(); surface.dispose();
    window.removeEventListener("resize", resize); window.removeEventListener("pagehide", pagehide);
    window.removeEventListener("popstate", popstate);
    passageInput?.dispose(); unbindKeyboard();
    reduced.removeEventListener("change", motion); document.removeEventListener("visibilitychange", visibility);
  };
  window.addEventListener("resize", resize); window.addEventListener("pagehide", pagehide);
  window.addEventListener("popstate", popstate);
  reduced.addEventListener("change", motion); document.addEventListener("visibilitychange", visibility);
  import.meta.hot?.dispose(dispose);
  card.dataset["kpFocusCardEnhancement"] = "ready";
  root.dataset["kpReasoningStatus"] = "ready";
  stampRevision();
  updateView();
  restoringHistory = false;
  restoreHistory(savedHistory);
  remember();
}
void mount().catch(report);
