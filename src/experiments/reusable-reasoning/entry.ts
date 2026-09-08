import "../authoring-distribution-focus-card/style.css";
import "./style.css";
import { createKpReasoningSource } from "./source.ts";
import { bindKpReasoningEvidence } from "./evidence.ts";
import { createKpReasoningNavigator } from "./navigation.ts";
import { renderReasoningCard, renderReasoningPage, reasoningBeats, escapeReasoningText } from "./scaffold.ts";
import { mountReasoningNativeSurface } from "./native-surface.ts";
import { readKpFocusDeckScrubberKeyTarget, renderKpFocusDeckScaffold } from "../../tutorial/focus-deck-scaffold.ts";
import type { ReasoningReading } from "./readings.ts";
import type { ReasoningPromptKind } from "./prompts.ts";
import { createReasoningAuthoringSession } from "./authoring.ts";

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
  let alignedScroll = 0;
  let disposed = false;
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
    const index = Math.max(0, Math.min(beats.length - 1, Math.round(passagePosition)));
    const label = semanticBeats[Math.min(navigation.stepCount, Math.round(position))]!.title;
    slider.value = String(position);
    slider.setAttribute("aria-valuetext", label);
    previous.disabled = Boolean(practice) || position <= 0;
    next.disabled = Boolean(practice) || position >= navigation.stepCount;
    slider.disabled = Boolean(practice); replay.disabled = Boolean(practice);
    card.dataset["kpFocusDeckActiveBeat"] = beats[index]!.slug;
    card.querySelector<HTMLOutputElement>("[data-kp-focus-deck-position]")!.value = label;
    viewport.querySelectorAll<HTMLElement>("[data-kp-focus-deck-beat]").forEach((item, i) => {
      const active = practice ? i === 0 : i === index;
      item.dataset["kpFocusDeckBeatActive"] = String(active);
      if (active) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current");
    });
    if (align && !practice) { alignedScroll = passagePosition * Math.max(1, viewport.clientWidth); viewport.scrollLeft = alignedScroll; }
    root.dataset["kpReasoningView"] = navigation.getView();
  };
  const navigate = (index: number) => {
    clock.pause(); surface.prepare();
    navigation.seekStep(index, !reduced.matches);
  };
  const updateView = () => {
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
  previous.onclick = () => { surface.prepare(); navigation.step("rewind", !reduced.matches); };
  next.onclick = () => { surface.prepare(); navigation.step("forward", !reduced.matches); };
  replay.onclick = () => { navigation.seekStep(0); navigate(navigation.stepCount); };
  slider.oninput = () => { navigation.seekStep(Number(slider.value)); };
  slider.onkeydown = event => {
    const target = readKpFocusDeckScrubberKeyTarget(event, Number(slider.value), navigation.stepCount + 1);
    if (target === undefined) return;
    event.preventDefault(); navigate(target);
  };
  viewport.onscroll = () => {
    if (disposed || practice || Math.abs(viewport.scrollLeft - alignedScroll) < 2) return;
    const position = Math.max(0, Math.min(beats.length - 1, viewport.scrollLeft / Math.max(1, viewport.clientWidth)));
    alignedScroll = viewport.scrollLeft;
    // Physical passage travel drives the existing clock continuously. The
    // resulting paint must not snap the viewport back to a chosen destination.
    const actual = position / passageFactor();
    clock.seek(actual);
  };
  open.onclick = () => { navigation.open(); updateView(); back.focus(); };
  back.onclick = () => { navigation.returnToParent(); updateView(); open.focus(); };
  reading.onchange = () => {
    clock.pause(); mode = reading.value === "compact" ? "compact" : "full";
    updateView(); root.dataset["kpReasoningReading"] = mode;
  };
  const setPractice = (active: boolean) => {
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
    clock.pause(); navigation.dispose();
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
    draftStatus.textContent = "Applied to full/compact readings, reason, native endpoint and both practice answers. Reading reset to the beginning of the new revision. Draft remains local to this page.";
    draftStatus.dataset["status"] = "applied";
  };
  const resize = () => { if (!disposed) { clock.pause(); surface.resize(); render(); } };
  const motion = () => { clock.pause(); render(); };
  const visibility = () => { if (document.hidden) clock.pause(); };
  const dispose = () => {
    if (disposed) return;
    disposed = true; unsubscribe(); navigation.dispose(); surface.dispose();
    window.removeEventListener("resize", resize); window.removeEventListener("pagehide", dispose);
    reduced.removeEventListener("change", motion); document.removeEventListener("visibilitychange", visibility);
  };
  window.addEventListener("resize", resize); window.addEventListener("pagehide", dispose);
  reduced.addEventListener("change", motion); document.addEventListener("visibilitychange", visibility);
  import.meta.hot?.dispose(dispose);
  card.dataset["kpFocusCardEnhancement"] = "ready";
  root.dataset["kpReasoningStatus"] = "ready";
  stampRevision();
  updateView();
}
void mount().catch(report);
