import "../authoring-distribution-focus-card/style.css";
import "./style.css";
import { createKpReasoningSource } from "./source.ts";
import { bindKpReasoningEvidence } from "./evidence.ts";
import { createKpReasoningNavigator } from "./navigation.ts";
import { renderReasoningCard, reasoningBeats, escapeReasoningText } from "./scaffold.ts";
import { mountReasoningNativeSurface } from "./native-surface.ts";
import { readKpFocusDeckScrubberKeyTarget } from "../../tutorial/focus-deck-scaffold.ts";
import type { ReasoningReading } from "./readings.ts";
import { projectReasoningPrompts, type ReasoningPromptKind } from "./prompts.ts";

const root = document.querySelector<HTMLElement>("#authored-focus-card")!;
const report = (error: unknown) => {
  const output = root.querySelector<HTMLElement>("[data-reasoning-error]")!;
  output.hidden = false; output.textContent = error instanceof Error ? error.message : String(error);
  root.dataset["kpReasoningStatus"] = "repair-gap";
};

async function mount() {
  const evidence = bindKpReasoningEvidence(createKpReasoningSource());
  const card = root.querySelector<HTMLElement>("[data-kp-reasoning-card]")!;
  const surface = await mountReasoningNativeSurface(card, evidence);
  const navigation = createKpReasoningNavigator(evidence, surface.clock);
  const prompts = projectReasoningPrompts(evidence, surface.animation);
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
  let alignedScroll = 0;
  let disposed = false;
  let practiceReturn: ReturnType<typeof navigation.capture> | undefined;
  let practice: (typeof prompts)[number] | undefined;
  const practicePanel = root.querySelector<HTMLElement>("[data-reasoning-practice-panel]")!;
  const answer = root.querySelector<HTMLElement>("[data-reasoning-answer]")!;
  const factor = () => (beats.length - 1) / navigation.end;
  const render = (align = true) => {
    if (disposed) return;
    surface.render(reduced.matches);
    const position = clock.getSnapshot().progress * factor();
    const index = Math.max(0, Math.min(beats.length - 1, Math.round(position)));
    slider.value = String(position);
    slider.setAttribute("aria-valuetext", beats[index]!.title);
    previous.disabled = position <= 0; next.disabled = position >= beats.length - 1;
    card.dataset["kpFocusDeckActiveBeat"] = beats[index]!.slug;
    card.querySelector<HTMLOutputElement>("[data-kp-focus-deck-position]")!.value = beats[index]!.title;
    viewport.querySelectorAll<HTMLElement>("[data-kp-focus-deck-beat]").forEach((item, i) => {
      item.dataset["kpFocusDeckBeatActive"] = String(i === index);
      if (i === index) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current");
    });
    if (align && !practice) { alignedScroll = position * Math.max(1, viewport.clientWidth); viewport.scrollLeft = alignedScroll; }
    root.dataset["kpReasoningView"] = navigation.getView();
  };
  const navigate = (index: number) => {
    const target = Math.max(0, Math.min(beats.length - 1, index)) / factor();
    clock.pause(); surface.prepare();
    if (reduced.matches) clock.seek(target);
    else clock.play({ direction: target >= clock.getSnapshot().progress ? "forward" : "rewind", stopAt: target });
  };
  const updateView = () => {
    const view = navigation.getView();
    const template = document.createElement("div");
    template.innerHTML = renderReasoningCard(evidence, view, mode);
    beats = reasoningBeats(evidence, view, mode);
    viewport.innerHTML = template.querySelector("[data-kp-focus-deck-viewport]")!.innerHTML;
    card.querySelector(".kp-focus-deck__ticks")!.innerHTML = template.querySelector(".kp-focus-deck__ticks")!.innerHTML;
    slider.max = String(beats.length - 1);
    open.hidden = view === "reason"; back.hidden = view === "parent";
    root.querySelector<HTMLElement>("[data-reasoning-location]")!.textContent = view === "parent" ? "Argument" : "Supporting reason";
    card.querySelector<HTMLElement>("[data-reasoning-view-label]")!.textContent = view === "parent" ? "Argument" : "Supporting reason";
    render();
  };
  const unsubscribe = clock.subscribe(() => render());
  previous.onclick = () => navigate(Math.ceil(clock.getSnapshot().progress * factor()) - 1);
  next.onclick = () => navigate(Math.floor(clock.getSnapshot().progress * factor()) + 1);
  replay.onclick = () => { clock.seek(0); navigate(beats.length - 1); };
  slider.oninput = () => { clock.seek(Number(slider.value) / factor()); };
  slider.onkeydown = event => {
    const target = readKpFocusDeckScrubberKeyTarget(event, Number(slider.value), beats.length);
    if (target === undefined) return;
    event.preventDefault(); navigate(target);
  };
  viewport.onscroll = () => {
    if (disposed || practice || Math.abs(viewport.scrollLeft - alignedScroll) < 2) return;
    const position = Math.max(0, Math.min(beats.length - 1, viewport.scrollLeft / Math.max(1, viewport.clientWidth)));
    alignedScroll = viewport.scrollLeft;
    // Physical passage travel drives the existing clock continuously. The
    // resulting paint must not snap the viewport back to a chosen destination.
    const actual = position / factor();
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
      viewport.innerHTML = `<p>${escapeReasoningText(practice.card.prompt)}</p>`;
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
    answer.textContent = `Verified sequence: ${practice.answerOperations.map(item => item.id).join(" → ")}. Compare the equation above; your wording is not automatically graded.`;
  };
  root.querySelector<HTMLButtonElement>("[data-reasoning-practice-return]")!.onclick = () => {
    if (!practiceReturn) return;
    navigation.restore(practiceReturn); practice = undefined; practiceReturn = undefined;
    setPractice(false); updateView(); open.focus();
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
  render();
}
void mount().catch(report);
