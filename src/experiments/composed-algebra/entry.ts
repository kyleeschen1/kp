import "../authoring-distribution-focus-card/style.css";
import "../reusable-reasoning/style.css";
import "../common-factor/style.css";
import { prepareKpComposedAlgebraDraft, exportKpComposedAlgebraSource, createKpComposedAlgebraAuthoringSession } from "../../authoring/composed-algebra-session.ts";
import type { KpComposedAlgebraPresentation } from "../../authoring/composed-algebra-presentation.ts";
import { mountCanonicalComposedAlgebraPresentation } from "../common-factor/native.ts";
import { renderComposedAlgebraCard, composedAlgebraBeats } from "./page.ts";
import { resolveKpFocusDeckVisibleBeat } from "../../tutorial/focus-deck-beat-navigation.ts";

const root = document.querySelector<HTMLElement>("#authored-focus-card")!;
async function mountCard(container: HTMLElement, draft: KpComposedAlgebraPresentation) {
  const card = container.querySelector<HTMLElement>("[data-composed-card]")!;
  const surface = await mountCanonicalComposedAlgebraPresentation(card, draft), clock = surface.clock;
  const viewport = card.querySelector<HTMLElement>("[data-kp-focus-deck-viewport]")!;
  const slider = card.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)"), beats = composedAlgebraBeats(draft);
  let disposed = false, visible = 0;
  viewport.dataset["kpFocusDeckSnapDisabled"] = "true";
  card.querySelectorAll<HTMLButtonElement>("button").forEach(button => { button.disabled = true; });
  const render = () => {
    if (disposed) return;
    surface.render(reduced.matches);
    const position = surface.checkpoints.positionAt(clock.getSnapshot().progress);
    visible = resolveKpFocusDeckVisibleBeat(position, visible, surface.checkpoints.last);
    card.dataset["composedStep"] = String(position);
    slider.value = String(position); slider.setAttribute("aria-valuetext", `Step ${visible + 1} of 3: ${beats[visible]!.title}`);
    card.dataset["kpFocusDeckActiveBeat"] = beats[visible]!.slug;
    const counter = card.querySelector<HTMLElement>("[data-composed-count]")!;
    counter.textContent = `${visible + 1} / 3`; counter.setAttribute("aria-label", `Step ${visible + 1} of 3`);
    card.querySelector<HTMLOutputElement>("[data-kp-focus-deck-position]")!.value = slider.getAttribute("aria-valuetext")!;
    viewport.querySelectorAll<HTMLElement>("[data-kp-focus-deck-beat]").forEach((item, index) => {
      item.dataset["kpFocusDeckBeatActive"] = String(index === visible);
      if (index === visible) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current");
    });
    viewport.scrollLeft = position * viewport.clientWidth;
  };
  const unsubscribe = clock.subscribe(render);
  slider.oninput = () => { clock.pause(); clock.seek(surface.checkpoints.progressAt(Number(slider.value))); };
  const resize = () => { if (!disposed) { clock.pause(); surface.resize(); render(); } };
  const visibility = () => { if (document.hidden) clock.pause(); };
  const dispose = () => { if (disposed) return; disposed = true; unsubscribe(); surface.dispose(); slider.oninput = null;
    window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", resize); };
  window.addEventListener("resize", resize); document.addEventListener("visibilitychange", visibility); reduced.addEventListener("change", resize);
  render(); card.dataset["kpFocusCardEnhancement"] = "ready";
  return { card, clock, dispose };
}

async function mount() {
  const initial = prepareKpComposedAlgebraDraft();
  const display = root.querySelector<HTMLElement>("[data-composed-reader]")!;
  const editor = root.querySelector<HTMLTextAreaElement>("[data-reasoning-json]")!;
  const status = root.querySelector<HTMLElement>("[data-reasoning-draft-status]")!;
  const apply = root.querySelector<HTMLButtonElement>("[data-composed-apply]")!;
  const download = root.querySelector<HTMLButtonElement>("[data-composed-download]")!;
  let active = await mountCard(display, initial), disposed = false;
  const session = createKpComposedAlgebraAuthoringSession({ initial,
    prepare: async draft => {
      const staging = document.createElement("div"); staging.className = "common-factor-staging";
      staging.inert = true; staging.setAttribute("aria-hidden", "true"); staging.style.width = `${display.getBoundingClientRect().width}px`;
      staging.innerHTML = renderComposedAlgebraCard(draft); display.after(staging);
      try { const surface = await mountCard(staging, draft); return { staging, surface, dispose() { surface.dispose(); staging.remove(); } }; }
      catch (error) { staging.remove(); throw error; }
    },
    commit: (prepared, draft) => {
      const previous = active; previous.clock.pause();
      display.replaceChildren(...prepared.staging.childNodes); active = prepared.surface;
      prepared.staging.remove(); previous.dispose();
      root.querySelector<HTMLElement>("[data-composed-title]")!.textContent = draft.checked.source.editorial.title;
      root.querySelector<HTMLElement>("[data-composed-setup]")!.textContent = draft.checked.source.editorial.setup;
      root.querySelector<HTMLElement>("[data-composed-summary]")!.textContent = draft.checked.source.editorial.summary;
      root.querySelector<HTMLElement>("[data-reasoning-revision]")!.textContent = draft.revisionId;
      root.dataset["composedRevision"] = draft.revisionId;
    }
  });
  editor.value = exportKpComposedAlgebraSource(initial);
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
  const dispose = () => { if (disposed) return; disposed = true; session.dispose(); active.dispose(); editor.oninput = null; apply.onclick = null; download.onclick = null; window.removeEventListener("pagehide", pagehide); };
  const pagehide = (event: PageTransitionEvent) => { if (event.persisted) active.clock.pause(); else dispose(); };
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
