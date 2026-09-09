import "../authoring-distribution-focus-card/style.css";
import "../reusable-reasoning/style.css";
import "./style.css";
import { createKpCommonFactorExample } from "../../authoring/common-factor-author-check.ts";
import { prepareKpCommonFactorDraft, exportKpCommonFactorSource, type KpPreparedCommonFactorDraft } from "../../authoring/common-factor-draft.ts";
import { createKpCommonFactorAuthoringSession } from "../../authoring/common-factor-session.ts";
import { renderCommonFactorCard, commonFactorBeats } from "./page.ts";
import { mountCommonFactorNativeSurface } from "./native.ts";
import { createKpFocusDeckCheckpointPlayback } from "../../tutorial/focus-deck-checkpoint-playback.ts";
import { mountKpFocusDeckNativeInput } from "../../tutorial/focus-deck-native-input.ts";
import { bindKpFocusDeckKeyboard } from "../../tutorial/focus-deck-keyboard.ts";
import { resolveKpFocusDeckVisibleBeat } from "../../tutorial/focus-deck-beat-navigation.ts";
import { projectCommonFactorReading } from "./readings.ts";
import { projectCommonFactorPrompts, captureCommonFactorPosition, resolveCommonFactorPosition } from "./practice.ts";
import { renderKpFocusDeckScaffold } from "../../tutorial/focus-deck-scaffold.ts";
import { escapeCommonFactorText } from "./page.ts";

const root = document.querySelector<HTMLElement>("#authored-focus-card")!;
const report = (error: unknown) => {
  const output = root.querySelector<HTMLElement>("[data-common-factor-error]")!;
  output.hidden = false; output.textContent = error instanceof Error ? error.message : String(error);
  root.dataset["commonFactorStatus"] = "repair-gap";
  // A rejected preparation is terminal, not a figure still loading offscreen.
  const card = root.querySelector<HTMLElement>("[data-common-factor-card]");
  if (card) {
    card.dataset["kpFocusCardEnhancement"] = "repair-gap";
    const stage = card.querySelector<HTMLElement>("[data-distribution-stage]");
    if (stage) stage.textContent = "Figure could not be prepared. See the error below.";
    card.querySelectorAll<HTMLButtonElement | HTMLInputElement>("button, input").forEach(control => { control.disabled = true; });
  }
};

async function mountCard(container: HTMLElement, draft: KpPreparedCommonFactorDraft) {
  const card = container.querySelector<HTMLElement>("[data-common-factor-card]")!;
  const surface = await mountCommonFactorNativeSurface(card, draft), clock = surface.clock;
  const playback = createKpFocusDeckCheckpointPlayback(clock, [0, 1]);
  const viewport = card.querySelector<HTMLElement>("[data-kp-focus-deck-viewport]")!;
  const slider = card.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
  const previous = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-previous]")!;
  const next = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-next]")!;
  const replay = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-replay]")!;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const beats = commonFactorBeats(draft);
  let disposed = false, visible = 0, practicing = false;
  const originalPassage = viewport.innerHTML;
  let input: ReturnType<typeof mountKpFocusDeckNativeInput> | undefined;
  viewport.dataset["kpFocusDeckSnapDisabled"] = "true";
  const cancel = () => { input?.cancel(); playback.cancel(); };
  const render = () => {
    if (disposed) return;
    surface.render(reduced.matches);
    if (practicing) return;
    const position = playback.position();
    visible = resolveKpFocusDeckVisibleBeat(position, visible, playback.last);
    slider.value = String(position); slider.setAttribute("aria-valuetext", beats[visible]!.title);
    previous.disabled = position <= 0; next.disabled = position >= 1;
    card.dataset["kpFocusDeckActiveBeat"] = beats[visible]!.slug;
    card.querySelector<HTMLOutputElement>("[data-kp-focus-deck-position]")!.value = beats[visible]!.title;
    const counter = card.querySelector<HTMLElement>("[data-common-factor-count]")!;
    counter.textContent = `${visible + 1} / 2`; counter.setAttribute("aria-label", `Beat ${visible + 1} of 2`);
    viewport.querySelectorAll<HTMLElement>("[data-kp-focus-deck-beat]").forEach((item, index) => {
      item.dataset["kpFocusDeckBeatActive"] = String(index === visible);
      if (index === visible) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current");
    });
    if (!input?.ownsTravel()) viewport.scrollLeft = position * viewport.clientWidth;
  };
  const navigate = (step: number) => { cancel(); clock.pause(); surface.prepare(); playback.seek(step, !reduced.matches); };
  const unsubscribe = clock.subscribe(render);
  previous.onclick = () => navigate(0); next.onclick = () => navigate(1);
  replay.onclick = () => { cancel(); clock.seek(0); navigate(1); };
  slider.oninput = () => { cancel(); clock.pause(); clock.seek(Number(slider.value)); };
  const release = () => playback.seek(Math.round(playback.position()), !reduced.matches, true);
  slider.onchange = release; slider.onpointerup = release; slider.onpointercancel = release;
  const unbindKeyboard = bindKpFocusDeckKeyboard({ card, slider, enabled: () => !disposed && !practicing,
    position: playback.position, checkpointCount: () => 2, navigate });
  input = mountKpFocusDeckNativeInput({ viewport, region: card, enabled: () => !disposed && !practicing,
    position: playback.position, begin: playback.begin, reduced: () => reduced.matches, interrupt: cancel });
  const resize = () => { if (!disposed) { cancel(); clock.pause(); surface.resize(); render(); } };
  const visibility = () => { if (document.hidden) { cancel(); clock.pause(); } };
  const dispose = () => { if (disposed) return; disposed = true; input?.dispose(); playback.dispose(); unsubscribe(); unbindKeyboard(); surface.dispose();
    previous.onclick = null; next.onclick = null; replay.onclick = null;
    slider.oninput = null; slider.onchange = null; slider.onpointerup = null; slider.onpointercancel = null;
    window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", resize); };
  window.addEventListener("resize", resize); document.addEventListener("visibilitychange", visibility); reduced.addEventListener("change", resize);
  render(); card.dataset["kpFocusCardEnhancement"] = "ready";
  return { card, clock, dispose, render, cancel, reveal: () => navigate(1),
    practice(prompt?: string) {
      cancel(); clock.pause(); practicing = prompt !== undefined;
      card.querySelector<HTMLElement>(".kp-focus-deck__navigation")!.inert = practicing;
      card.querySelector<HTMLElement>("[data-common-factor-count]")!.hidden = practicing;
      if (prompt !== undefined) {
        const template = document.createElement("div");
        template.innerHTML = renderKpFocusDeckScaffold({ id: "common-factor-question", ariaLabel: "Practice", stageHtml: "", activeBeatSlug: "question",
          beats: [{ slug: "question", title: "Your turn", html: `<p>${escapeCommonFactorText(prompt)}</p>` }] });
        viewport.innerHTML = template.querySelector<HTMLElement>("[data-kp-focus-deck-viewport]")!.innerHTML;
        viewport.scrollLeft = 0; clock.seek(0);
      } else { viewport.innerHTML = originalPassage; render(); }
    } };
}

async function mount() {
  const initial = prepareKpCommonFactorDraft(createKpCommonFactorExample());
  const display = root.querySelector<HTMLElement>("[data-common-factor-reader]")!;
  const editor = root.querySelector<HTMLTextAreaElement>("[data-reasoning-json]")!;
  const status = root.querySelector<HTMLElement>("[data-reasoning-draft-status]")!;
  const title = root.querySelector<HTMLElement>("[data-common-factor-title]")!;
  const setup = root.querySelector<HTMLElement>("[data-common-factor-setup]")!;
  const summary = root.querySelector<HTMLElement>("[data-common-factor-summary]")!;
  const revision = root.querySelector<HTMLElement>("[data-reasoning-revision]")!;
  const reading = root.querySelector<HTMLSelectElement>("[data-common-factor-reading]")!;
  const readingOutput = root.querySelector<HTMLElement>("[data-common-factor-reading-output]")!;
  let mode: "full" | "compact" = "full";
  let practice: { prompt: ReturnType<typeof projectCommonFactorPrompts>[number]; position: ReturnType<typeof captureCommonFactorPosition>; scrollY: number; origin: HTMLButtonElement } | undefined;
  let active = await mountCard(display, initial), disposed = false;
  const session = createKpCommonFactorAuthoringSession({ initial,
    prepare: async draft => {
      const full = projectCommonFactorReading(draft, "full"), compact = projectCommonFactorReading(draft, "compact");
      projectCommonFactorPrompts(draft);
      const staging = document.createElement("div"); staging.className = "common-factor-staging";
      staging.inert = true; staging.setAttribute("aria-hidden", "true"); staging.style.width = `${display.getBoundingClientRect().width}px`;
      staging.innerHTML = renderCommonFactorCard(draft); display.after(staging);
      try { const surface = await mountCard(staging, draft); return { staging, surface, full, compact, dispose() { surface.dispose(); staging.remove(); } }; }
      catch (error) { staging.remove(); throw error; }
    },
    commit: (prepared, draft) => {
      const previous = active; previous.cancel(); previous.clock.pause();
      display.replaceChildren(...prepared.staging.childNodes); active = prepared.surface;
      prepared.staging.remove(); previous.dispose();
      title.textContent = draft.source.editorial.title; setup.textContent = draft.source.editorial.setup;
      summary.textContent = draft.source.editorial.summary; revision.textContent = draft.revisionId;
      root.dataset["commonFactorRevision"] = draft.revisionId;
      readingOutput.innerHTML = prepared[mode].html; readingOutput.dataset["revision"] = draft.revisionId;
    }
  });
  editor.value = exportKpCommonFactorSource(initial);
  reading.onchange = () => { mode = reading.value === "compact" ? "compact" : "full";
    readingOutput.innerHTML = projectCommonFactorReading(session.current(), mode).html; };
  const panel = root.querySelector<HTMLElement>("[data-common-factor-practice-panel]")!;
  const answer = root.querySelector<HTMLElement>("[data-common-factor-answer]")!;
  const togglePractice = (enabled: boolean) => {
    for (const node of [readingOutput, summary, setup, root.querySelector<HTMLElement>("[data-reasoning-editor]")!, root.querySelector<HTMLElement>("[data-common-factor-reading-toolbar]")!]) node.hidden = enabled;
    panel.hidden = !enabled;
  };
  root.querySelectorAll<HTMLButtonElement>("[data-common-factor-practice]").forEach(button => { button.onclick = () => {
    session.invalidate(); active.cancel(); active.clock.pause();
    const prompt = projectCommonFactorPrompts(session.current()).find(p => p.kind === button.dataset["commonFactorPractice"]);
    if (!prompt) throw new Error("Unknown factoring practice mode.");
    practice = { prompt, position: captureCommonFactorPosition(session.current(), active.clock.getSnapshot().progress), scrollY: window.scrollY, origin: button };
    root.querySelector<HTMLElement>("[data-common-factor-prompt-title]")!.textContent = prompt.card.title;
    root.querySelector<HTMLElement>("[data-common-factor-prompt]")!.textContent = prompt.card.prompt;
    root.querySelector<HTMLTextAreaElement>("[data-common-factor-working]")!.value = "";
    answer.hidden = true; answer.textContent = ""; togglePractice(true); active.practice(prompt.card.prompt);
    root.querySelector<HTMLTextAreaElement>("[data-common-factor-working]")!.focus();
  }; });
  root.querySelector<HTMLButtonElement>("[data-common-factor-reveal]")!.onclick = () => {
    if (!practice) return; answer.hidden = false;
    answer.textContent = `${practice.prompt.answerLatex}. ${practice.prompt.answerExplanation}`; active.reveal();
  };
  root.querySelector<HTMLButtonElement>("[data-common-factor-return]")!.onclick = () => {
    if (!practice) return;
    const progress = resolveCommonFactorPosition(session.current(), practice.position), { scrollY, origin } = practice;
    practice = undefined; togglePractice(false); active.practice(); active.clock.seek(progress);
    origin.focus({ preventScroll: true }); window.scrollTo({ top: scrollY, behavior: "instant" });
  };
  editor.oninput = () => { session.invalidate(); status.textContent = "Draft changed. Apply to prepare a new displayed revision."; };
  root.querySelector<HTMLButtonElement>("[data-common-factor-apply]")!.onclick = async () => {
    status.textContent = "Checking and preparing…";
    const result = await session.apply(editor.value);
    if (disposed || result.status === "superseded") return;
    status.dataset["status"] = result.status;
    status.textContent = result.status === "applied" ? "Displayed revision updated." : `${result.diagnostic.code} at ${result.diagnostic.path}: ${result.diagnostic.expected}`;
  };
  root.querySelector<HTMLButtonElement>("[data-common-factor-download]")!.onclick = () => {
    const url = URL.createObjectURL(new Blob([exportKpCommonFactorSource(session.current())], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "common-factor.json"; link.click(); URL.revokeObjectURL(url);
  };
  const dispose = () => { if (disposed) return; disposed = true; session.dispose(); active.dispose(); editor.oninput = null; reading.onchange = null; window.removeEventListener("pagehide", pagehide); };
  const pagehide = (event: PageTransitionEvent) => { if (event.persisted) { active.cancel(); active.clock.pause(); } else dispose(); };
  window.addEventListener("pagehide", pagehide); import.meta.hot?.dispose(dispose);
  root.dataset["commonFactorStatus"] = "ready"; root.dataset["commonFactorRevision"] = initial.revisionId;
}
void mount().catch(report);
