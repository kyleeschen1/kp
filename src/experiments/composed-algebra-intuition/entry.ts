import "../authoring-distribution-focus-card/style.css";
import "../reusable-reasoning/style.css";
import "../common-factor/style.css";
import "../composed-algebra/style.css";
import { prepareKpComposedAlgebraDraftV2, exportKpComposedAlgebraSourceV2, createKpComposedAlgebraAuthoringSessionV2 } from "../../authoring/composed-algebra-session-v2.ts";
import { mountComposedAlgebraCardV2 } from "../composed-algebra/card.ts";
import { renderAlgebraIntuitionCard } from "./page.ts";

const root = document.querySelector<HTMLElement>("#authored-focus-card")!;
async function mount() {
  const initial = prepareKpComposedAlgebraDraftV2(), display = root.querySelector<HTMLElement>("[data-composed-reader]")!;
  const editor = root.querySelector<HTMLTextAreaElement>("[data-reasoning-json]")!, status = root.querySelector<HTMLElement>("[data-reasoning-draft-status]")!;
  const apply = root.querySelector<HTMLButtonElement>("[data-composed-apply]")!, download = root.querySelector<HTMLButtonElement>("[data-composed-download]")!;
  let active = await mountComposedAlgebraCardV2(display, initial), disposed = false;
  const session = createKpComposedAlgebraAuthoringSessionV2({ initial,
    prepare: async draft => {
      const staging = document.createElement("div"); staging.className = "common-factor-staging";
      staging.inert = true; staging.setAttribute("aria-hidden", "true"); staging.style.width = `${display.getBoundingClientRect().width}px`;
      staging.innerHTML = renderAlgebraIntuitionCard(draft); display.after(staging);
      try { const surface = await mountComposedAlgebraCardV2(staging, draft); return { staging, surface, dispose() { surface.dispose(); staging.remove(); } }; }
      catch (error) { staging.remove(); throw error; }
    },
    commit: (prepared, draft) => {
      const previous = active; previous.cancel(); previous.clock.pause();
      display.replaceChildren(...prepared.staging.childNodes); active = prepared.surface; prepared.staging.remove(); previous.dispose();
      root.querySelector<HTMLElement>("[data-composed-title]")!.textContent = draft.checked.source.editorial.title;
      root.querySelector<HTMLElement>("[data-composed-setup]")!.textContent = draft.checked.source.editorial.setup;
      root.querySelector<HTMLElement>("[data-composed-summary]")!.textContent = draft.checked.source.editorial.summary;
      root.querySelector<HTMLElement>("[data-composed-sequence-summary]")!.textContent = `${draft.checked.source.states.length} states · ${draft.steps.length} verified moves`;
      root.querySelector<HTMLElement>("[data-reasoning-revision]")!.textContent = draft.revisionId;
      root.dataset["composedRevision"] = draft.revisionId;
    }
  });
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
  const dispose = () => { if (disposed) return; disposed = true; session.dispose(); active.dispose(); editor.oninput = null; apply.onclick = null; download.onclick = null;
    window.removeEventListener("pagehide", pagehide); };
  const pagehide = (event: PageTransitionEvent) => { if (event.persisted) { active.cancel(); active.clock.pause(); } else dispose(); };
  window.addEventListener("pagehide", pagehide); import.meta.hot?.dispose(dispose);
  root.dataset["composedStatus"] = "ready"; root.dataset["composedRevision"] = initial.revisionId;
}
void mount().catch(error => {
  root.dataset["composedStatus"] = "repair-gap";
  const output = root.querySelector<HTMLElement>("[data-composed-error]")!;
  output.hidden = false; output.textContent = error instanceof Error ? error.message : String(error);
  const card = root.querySelector<HTMLElement>("[data-composed-card]")!; card.dataset["kpFocusCardEnhancement"] = "repair-gap";
  card.querySelector<HTMLElement>("[data-distribution-stage]")!.textContent = "Figure could not be prepared. See the error below.";
  root.querySelectorAll<HTMLButtonElement | HTMLInputElement>("button, input").forEach(control => { control.disabled = true; });
});
