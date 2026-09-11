import "../authoring-distribution-focus-card/style.css";
import "../reusable-reasoning/style.css";
import "../common-factor/style.css";
import "../composed-algebra/style.css";
import { prepareKpComposedAlgebraDraftV2, exportKpComposedAlgebraSourceV2, createKpComposedAlgebraAuthoringSessionV2 } from "../../authoring/composed-algebra-session-v2.ts";
import { mountComposedAlgebraCardV2 } from "../composed-algebra/card.ts";
import { renderAlgebraIntuitionCard, renderAlgebraIntuitionLinks } from "./page.ts";
import { projectComposedAlgebraSubexplanations } from "../composed-algebra/subexplanations.ts";
import { captureComposedAlgebraPositionV2, resolveComposedAlgebraPositionV2 } from "../composed-algebra/practice.ts";
import { projectComposedAlgebraReadingV2 } from "../composed-algebra/readings.ts";
import { bindAlgebraIntuitionPractice } from "./practice.ts";

const root = document.querySelector<HTMLElement>("#authored-focus-card")!;
async function mount() {
  const initial = prepareKpComposedAlgebraDraftV2(), display = root.querySelector<HTMLElement>("[data-composed-reader]")!;
  const editor = root.querySelector<HTMLTextAreaElement>("[data-reasoning-json]")!, status = root.querySelector<HTMLElement>("[data-reasoning-draft-status]")!;
  const apply = root.querySelector<HTMLButtonElement>("[data-composed-apply]")!, download = root.querySelector<HTMLButtonElement>("[data-composed-download]")!;
  let active = await mountComposedAlgebraCardV2(display, initial), disposed = false;
  const reading = root.querySelector<HTMLSelectElement>("[data-composed-reading]")!, readingOutput = root.querySelector<HTMLElement>("[data-composed-reading-output]")!;
  let mode: "full" | "compact" = "full";
  const links = root.querySelector<HTMLElement>("[data-composed-subexplanations]")!, panel = root.querySelector<HTMLElement>("[data-composed-intuition-panel]")!;
  const returnButton = root.querySelector<HTMLButtonElement>("[data-composed-intuition-return]")!;
  let subGeneration = 0;
  let exploration: { surface: Awaited<ReturnType<typeof mountComposedAlgebraCardV2>>; position: ReturnType<typeof captureComposedAlgebraPositionV2>;
    reference: ReturnType<typeof projectComposedAlgebraSubexplanations>[number];
    scrollY: number; origin: HTMLElement | undefined; parentUrl: string } | undefined;
  const session = createKpComposedAlgebraAuthoringSessionV2({ initial,
    prepare: async draft => {
      const full = projectComposedAlgebraReadingV2(draft, "full"), compact = projectComposedAlgebraReadingV2(draft, "compact");
      const staging = document.createElement("div"); staging.className = "common-factor-staging";
      staging.inert = true; staging.setAttribute("aria-hidden", "true"); staging.style.width = `${display.getBoundingClientRect().width}px`;
      staging.innerHTML = renderAlgebraIntuitionCard(draft); display.after(staging);
      try { const surface = await mountComposedAlgebraCardV2(staging, draft); return { staging, surface, full, compact, dispose() { surface.dispose(); staging.remove(); } }; }
      catch (error) { staging.remove(); throw error; }
    },
    commit: (prepared, draft) => {
      closeIntuition();
      const previous = active; previous.cancel(); previous.clock.pause();
      display.replaceChildren(...prepared.staging.childNodes); active = prepared.surface; prepared.staging.remove(); previous.dispose();
      root.querySelector<HTMLElement>("[data-composed-title]")!.textContent = draft.checked.source.editorial.title;
      root.querySelector<HTMLElement>("[data-composed-setup]")!.textContent = draft.checked.source.editorial.setup;
      root.querySelector<HTMLElement>("[data-composed-summary]")!.textContent = draft.checked.source.editorial.summary;
      root.querySelector<HTMLElement>("[data-composed-sequence-summary]")!.textContent = `${draft.checked.source.states.length} states · ${draft.steps.length} verified moves`;
      root.querySelector<HTMLElement>("[data-reasoning-revision]")!.textContent = draft.revisionId;
      root.dataset["composedRevision"] = draft.revisionId;
      links.innerHTML = renderAlgebraIntuitionLinks(draft);
      readingOutput.innerHTML = prepared[mode].html; readingOutput.dataset["revision"] = draft.revisionId;
    }
  });
  const practice = bindAlgebraIntuitionPractice(root, () => ({ draft: session.current(), surface: exploration?.surface ?? active, reference: exploration?.reference }), () => session.invalidate());
  reading.onchange = () => { mode = reading.value === "compact" ? "compact" : "full"; readingOutput.innerHTML = projectComposedAlgebraReadingV2(session.current(), mode).html; };
  const parentElements = [display, links, readingOutput, root.querySelector<HTMLElement>("[data-composed-reading-toolbar]")!, root.querySelector<HTMLElement>("[data-composed-title]")!, root.querySelector<HTMLElement>("[data-composed-context]")!,
    root.querySelector<HTMLElement>(".review-help")!, root.querySelector<HTMLElement>("[data-composed-setup]")!,
    root.querySelector<HTMLElement>("[data-composed-summary]")!, root.querySelector<HTMLElement>("[data-reasoning-editor]")!,
    root.querySelector<HTMLElement>("[data-composed-sequence-summary]")!];
  function closeIntuition() {
    practice.close();
    subGeneration++;
    if (!exploration) return;
    const saved = exploration; exploration = undefined; saved.surface.dispose();
    panel.hidden = true; panel.querySelector<HTMLElement>("[data-composed-intuition-reader]")!.replaceChildren();
    parentElements.forEach(element => { element.hidden = false; });
    active.clock.seek(resolveComposedAlgebraPositionV2(session.current(), saved.position));
    history.replaceState(history.state, "", saved.parentUrl);
    (saved.origin?.isConnected ? saved.origin : active.card.querySelector<HTMLElement>("[data-kp-focus-deck-scrubber]"))?.focus({ preventScroll: true });
    window.scrollTo({ top: saved.scrollY, behavior: "instant" });
    root.dataset["intuitionStatus"] = "closed";
  }
  async function openIntuition(kind: string, origin?: HTMLElement) {
    closeIntuition(); session.invalidate(); active.cancel(); active.clock.pause();
    root.querySelector<HTMLElement>("[data-composed-error]")!.hidden = true;
    const generation = ++subGeneration, draft = session.current();
    const reference = projectComposedAlgebraSubexplanations(draft).find(candidate => candidate.kind === kind);
    if (!reference) throw new Error("Unknown question reference. Choose one of the two supported intuitions.");
    const position = captureComposedAlgebraPositionV2(draft, active.clock.getSnapshot().progress), scrollY = window.scrollY;
    const parentUrl = new URL(location.href); parentUrl.searchParams.delete("intuition"); parentUrl.searchParams.delete("revision");
    const staging = document.createElement("div"); staging.className = "common-factor-staging";
    staging.inert = true; staging.setAttribute("aria-hidden", "true"); staging.style.width = `${display.getBoundingClientRect().width}px`;
    staging.innerHTML = renderAlgebraIntuitionCard(draft, reference); display.after(staging);
    root.dataset["intuitionStatus"] = "preparing";
    try {
      const surface = await mountComposedAlgebraCardV2(staging, draft, reference);
      if (disposed || generation !== subGeneration || draft !== session.current()) { surface.dispose(); return; }
      exploration = { surface, reference, position, scrollY, origin, parentUrl: parentUrl.href };
      panel.querySelector<HTMLElement>("[data-composed-intuition-question]")!.textContent = reference.question;
      panel.querySelector<HTMLElement>("[data-composed-intuition-setup]")!.textContent = reference.setup;
      panel.querySelector<HTMLElement>("[data-composed-intuition-answer]")!.textContent = reference.answer;
      panel.querySelector<HTMLElement>("[data-composed-intuition-reader]")!.replaceChildren(...staging.childNodes);
      parentElements.forEach(element => { element.hidden = true; }); panel.hidden = false;
      const url = new URL(parentUrl); url.searchParams.set("intuition", kind); url.searchParams.set("revision", reference.revisionId);
      history.replaceState(history.state, "", url);
      surface.card.querySelector<HTMLElement>("[data-kp-focus-deck-scrubber]")!.focus({ preventScroll: true });
      panel.scrollIntoView({ block: "start", behavior: "instant" }); root.dataset["intuitionStatus"] = "ready";
    } finally { staging.remove(); }
  }
  const reportReferenceError = (error: unknown) => {
    root.dataset["intuitionStatus"] = "repair-gap";
    const output = root.querySelector<HTMLElement>("[data-composed-error]")!;
    output.hidden = false; output.textContent = error instanceof Error ? error.message : String(error);
  };
  links.onclick = event => {
    const anchor = (event.target as Element).closest<HTMLElement>("[data-composed-intuition]");
    if (!anchor) return; event.preventDefault();
    void openIntuition(anchor.dataset["composedIntuition"]!, anchor).catch(reportReferenceError);
  };
  returnButton.onclick = closeIntuition;
  editor.value = exportKpComposedAlgebraSourceV2(initial);
  editor.oninput = () => { session.invalidate(); status.textContent = "Draft changed. Apply to prepare a new displayed revision."; };
  apply.onclick = async () => {
    status.textContent = "Checking and preparing…";
    const result = await session.apply(editor.value);
    if (disposed || result.status === "superseded") return;
    status.dataset["status"] = result.status;
    status.textContent = result.status === "applied" ? "Displayed revision updated." : `${result.diagnostic.code} at ${result.diagnostic.path}: ${result.diagnostic.expected}`;
  };
  download.onclick = () => {
    const url = URL.createObjectURL(new Blob([exportKpComposedAlgebraSourceV2(session.current())], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "composed-algebra-intuition.json"; link.click(); URL.revokeObjectURL(url);
  };
  const dispose = () => { if (disposed) return; disposed = true; practice.dispose(); subGeneration++; exploration?.surface.dispose(); exploration = undefined;
    session.dispose(); active.dispose(); editor.oninput = null; reading.onchange = null; apply.onclick = null; download.onclick = null; links.onclick = null; returnButton.onclick = null;
    window.removeEventListener("pagehide", pagehide); };
  const pagehide = (event: PageTransitionEvent) => { if (event.persisted) { active.cancel(); active.clock.pause(); exploration?.surface.cancel(); exploration?.surface.clock.pause(); } else dispose(); };
  window.addEventListener("pagehide", pagehide); import.meta.hot?.dispose(dispose);
  root.dataset["composedStatus"] = "ready"; root.dataset["composedRevision"] = initial.revisionId;
  const requested = new URL(location.href).searchParams;
  if (requested.has("intuition")) {
    if (requested.has("revision") && requested.get("revision") !== initial.revisionId)
      reportReferenceError(new Error("This question link belongs to another source revision. Apply the matching saved JSON before opening that question; the current explanation has not been substituted."));
    else await openIntuition(requested.get("intuition")!).catch(reportReferenceError);
  }
}
void mount().catch(error => {
  root.dataset["composedStatus"] = "repair-gap";
  const output = root.querySelector<HTMLElement>("[data-composed-error]")!;
  output.hidden = false; output.textContent = error instanceof Error ? error.message : String(error);
  const card = root.querySelector<HTMLElement>("[data-composed-card]")!; card.dataset["kpFocusCardEnhancement"] = "repair-gap";
  card.querySelector<HTMLElement>("[data-distribution-stage]")!.textContent = "Figure could not be prepared. See the error below.";
  root.querySelectorAll<HTMLButtonElement | HTMLInputElement>("button, input").forEach(control => { control.disabled = true; });
});
