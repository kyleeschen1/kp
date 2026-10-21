import { compileChangeSource } from "./model.ts";
import { mountChange as mount, required } from "./surface.ts";
import { preparePreview } from "../../authoring/staged-preview.ts";

const encoded: unknown = JSON.parse(required("#change-source-bytes").textContent ?? "null");
if (typeof encoded !== "string") throw new Error("Missing selected change-propagation source.");
const initial = compileChangeSource(encoded);
if (initial.status !== "checked") throw new Error(`${initial.path}: ${initial.message}`);
let active = mount(required(".change-card"), initial.model, { restore: true });
let closed = false;
let generation = 0;
const authorEvents = new AbortController();
required<HTMLElement>("[data-change-author]").hidden = false;
const editor = required<HTMLTextAreaElement>("#change-source"), diagnostic = required<HTMLElement>("[data-change-diagnostic]");
const apply = required<HTMLButtonElement>("[data-change-apply]");
editor.addEventListener("input", () => {
  ++generation;
  diagnostic.textContent = "Draft changed. The displayed source is unchanged until Preview succeeds.";
}, { signal: authorEvents.signal });
apply.addEventListener("click", async () => {
  if (apply.disabled || closed) return;
  const ticket = ++generation;
  const current = () => !closed && ticket === generation;
  const bytes = editor.value, result = compileChangeSource(bytes);
  if (result.status !== "checked") { diagnostic.textContent = `${result.path}: ${result.message} The previous card is unchanged.`; return; }
  apply.disabled = true;
  try {
    // Editing pays for KaTeX authoring lazily; ordinary reading uses the native
    // math HTML already produced by the publication compiler.
    const { renderChangePublication } = await import("./view.ts");
    if (!current()) return;
    const template = document.createElement("template"); template.innerHTML = renderChangePublication(result.model, bytes);
    const card = required<HTMLElement>(".change-card", template.content);
    const reading = required<HTMLElement>(".change-reading-source", template.content);
    const host = required<HTMLElement>("[data-change-host]");
    const prepared = await preparePreview(host, { className: "change-staging", html: card.outerHTML,
      mount: async staging => mount(required(".change-card", staging), result.model, { staged: true }) });
    if (!current()) { prepared.dispose(); return; }
    const previous = active;
    host.replaceChildren(...prepared.staging.childNodes);
    active = prepared.surface; prepared.staging.remove(); previous.dispose();
    required(".change-reading-source").replaceWith(reading);
    required("h1").textContent = result.model.source.title;
    document.title = `${result.model.source.title} · Kinetic Press`;
    const locationIssue = active.activate();
    diagnostic.textContent = "Preview updated from this source. Functions and derivatives were checked; prose remains author-supplied. Download to keep this draft." + (locationIssue ? ` ${locationIssue}` : "");
  } catch (error) { if (current()) diagnostic.textContent = `Preview failed: ${error instanceof Error ? error.message : String(error)}`; }
  finally { apply.disabled = false; }
}, { signal: authorEvents.signal });
required("[data-change-download]").addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob([editor.value], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = "change-propagation.json"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}, { signal: authorEvents.signal });
const close = () => { closed = true; ++generation; authorEvents.abort(); active.dispose(); };
window.addEventListener("pagehide", event => { if (!event.persisted) close(); }, { signal: authorEvents.signal });
if (import.meta.hot) import.meta.hot.dispose(close);
