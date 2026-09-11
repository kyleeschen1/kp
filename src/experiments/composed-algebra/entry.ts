import "../authoring-distribution-focus-card/style.css";
import "../reusable-reasoning/style.css";
import "../common-factor/style.css";
import "./style.css";
import { prepareKpComposedAlgebraDraft, exportKpComposedAlgebraSource, createKpComposedAlgebraAuthoringSession } from "../../authoring/composed-algebra-session.ts";
import { renderComposedAlgebraCard } from "./page.ts";
import { mountComposedAlgebraCard as mountCard } from "./card.ts";
import { projectComposedAlgebraReading } from "./readings.ts";
import { projectComposedAlgebraPrompts, captureComposedAlgebraPosition, resolveComposedAlgebraPosition } from "./practice.ts";

const root = document.querySelector<HTMLElement>("#authored-focus-card")!;

async function mount() {
  const initial = prepareKpComposedAlgebraDraft();
  const display = root.querySelector<HTMLElement>("[data-composed-reader]")!;
  const editor = root.querySelector<HTMLTextAreaElement>("[data-reasoning-json]")!;
  const status = root.querySelector<HTMLElement>("[data-reasoning-draft-status]")!;
  const apply = root.querySelector<HTMLButtonElement>("[data-composed-apply]")!;
  const download = root.querySelector<HTMLButtonElement>("[data-composed-download]")!;
  const reading = root.querySelector<HTMLSelectElement>("[data-composed-reading]")!;
  const readingOutput = root.querySelector<HTMLElement>("[data-composed-reading-output]")!;
  let mode: "full" | "compact" = "full";
  let practice: { prompt: ReturnType<typeof projectComposedAlgebraPrompts>[number]; position: ReturnType<typeof captureComposedAlgebraPosition>; scrollY: number; origin: HTMLButtonElement } | undefined;
  let active = await mountCard(display, initial), disposed = false;
  const session = createKpComposedAlgebraAuthoringSession({ initial,
    prepare: async draft => {
      const full = projectComposedAlgebraReading(draft, "full"), compact = projectComposedAlgebraReading(draft, "compact");
      projectComposedAlgebraPrompts(draft);
      const staging = document.createElement("div"); staging.className = "common-factor-staging";
      staging.inert = true; staging.setAttribute("aria-hidden", "true"); staging.style.width = `${display.getBoundingClientRect().width}px`;
      staging.innerHTML = renderComposedAlgebraCard(draft); display.after(staging);
      try { const surface = await mountCard(staging, draft); return { staging, surface, full, compact, dispose() { surface.dispose(); staging.remove(); } }; }
      catch (error) { staging.remove(); throw error; }
    },
    commit: (prepared, draft) => {
      const previous = active; previous.cancel(); previous.clock.pause();
      display.replaceChildren(...prepared.staging.childNodes); active = prepared.surface;
      prepared.staging.remove(); previous.dispose();
      root.querySelector<HTMLElement>("[data-composed-title]")!.textContent = draft.checked.source.editorial.title;
      root.querySelector<HTMLElement>("[data-composed-setup]")!.textContent = draft.checked.source.editorial.setup;
      root.querySelector<HTMLElement>("[data-composed-summary]")!.textContent = draft.checked.source.editorial.summary;
      root.querySelector<HTMLElement>("[data-reasoning-revision]")!.textContent = draft.revisionId;
      root.dataset["composedRevision"] = draft.revisionId;
      readingOutput.innerHTML = prepared[mode].html; readingOutput.dataset["revision"] = draft.revisionId;
    }
  });
  editor.value = exportKpComposedAlgebraSource(initial);
  reading.onchange = () => { mode = reading.value === "compact" ? "compact" : "full";
    readingOutput.innerHTML = projectComposedAlgebraReading(session.current(), mode).html; };
  const panel = root.querySelector<HTMLElement>("[data-composed-practice-panel]")!;
  const answer = root.querySelector<HTMLElement>("[data-composed-answer]")!;
  const togglePractice = (enabled: boolean) => {
    for (const node of [readingOutput, root.querySelector<HTMLElement>("[data-composed-summary]")!, root.querySelector<HTMLElement>("[data-composed-setup]")!,
      root.querySelector<HTMLElement>("[data-reasoning-editor]")!, root.querySelector<HTMLElement>("[data-composed-reading-toolbar]")!]) node.hidden = enabled;
    panel.hidden = !enabled;
  };
  root.querySelectorAll<HTMLButtonElement>("[data-composed-practice]").forEach(button => { button.onclick = () => {
    session.invalidate(); active.cancel(); active.clock.pause();
    const prompt = projectComposedAlgebraPrompts(session.current()).find(p => p.kind === button.dataset["composedPractice"]);
    if (!prompt) throw new Error("Unknown composed practice mode.");
    practice = { prompt, position: captureComposedAlgebraPosition(session.current(), active.clock.getSnapshot().progress), scrollY: window.scrollY, origin: button };
    root.querySelector<HTMLElement>("[data-composed-prompt-title]")!.textContent = prompt.card.title;
    root.querySelector<HTMLElement>("[data-composed-prompt]")!.textContent = prompt.card.prompt;
    root.querySelector<HTMLTextAreaElement>("[data-composed-working]")!.value = "";
    answer.hidden = true; answer.textContent = ""; togglePractice(true); active.practice(prompt.card.prompt);
    root.querySelector<HTMLTextAreaElement>("[data-composed-working]")!.focus();
  }; });
  root.querySelector<HTMLButtonElement>("[data-composed-reveal]")!.onclick = () => {
    if (!practice) return; answer.hidden = false;
    answer.textContent = `${practice.prompt.answerLatex}. ${practice.prompt.answerExplanation}`; active.reveal(practice.prompt.answerStep);
  };
  root.querySelector<HTMLButtonElement>("[data-composed-return]")!.onclick = () => {
    if (!practice) return;
    const progress = resolveComposedAlgebraPosition(session.current(), practice.position), { scrollY, origin } = practice;
    practice = undefined; togglePractice(false); active.practice(); active.clock.seek(progress);
    origin.focus({ preventScroll: true }); window.scrollTo({ top: scrollY, behavior: "instant" });
  };
  editor.oninput = () => { session.invalidate(); status.textContent = "Draft changed. Apply to prepare a new displayed revision."; };
  apply.onclick = async () => {
    status.textContent = "Checking and preparing…";
    const result = await session.apply(editor.value);
    if (disposed || result.status === "superseded") return;
    status.dataset["status"] = result.status;
    status.textContent = result.status === "applied" ? "Displayed revision updated." : `${result.diagnostic.code} at ${result.diagnostic.path}: ${result.diagnostic.expected}`;
  };
  download.onclick = () => {
    const url = URL.createObjectURL(new Blob([exportKpComposedAlgebraSource(session.current())], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "composed-algebra.json"; link.click(); URL.revokeObjectURL(url);
  };
  const dispose = () => { if (disposed) return; disposed = true; session.dispose(); active.dispose(); editor.oninput = null; reading.onchange = null; apply.onclick = null; download.onclick = null;
    root.querySelectorAll<HTMLButtonElement>("[data-composed-practice], [data-composed-reveal], [data-composed-return]").forEach(button => { button.onclick = null; });
    window.removeEventListener("pagehide", pagehide); };
  const pagehide = (event: PageTransitionEvent) => { if (event.persisted) { active.cancel(); active.clock.pause(); } else dispose(); };
  window.addEventListener("pagehide", pagehide); import.meta.hot?.dispose(dispose);
  root.dataset["composedStatus"] = "ready"; root.dataset["composedRevision"] = initial.revisionId;
}
void mount().catch(error => {
  root.dataset["composedStatus"] = "repair-gap";
  const output = root.querySelector<HTMLElement>("[data-composed-error]")!;
  output.hidden = false; output.textContent = error instanceof Error ? error.message : String(error);
  const card = root.querySelector<HTMLElement>("[data-composed-card]")!;
  card.dataset["kpFocusCardEnhancement"] = "repair-gap";
  card.querySelector<HTMLElement>("[data-distribution-stage]")!.textContent = "Figure could not be prepared. See the error below.";
  root.querySelectorAll<HTMLButtonElement | HTMLInputElement>("button, input").forEach(control => { control.disabled = true; });
});
