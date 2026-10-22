import "./author.css";
import { compile, serialize } from "../../authoring/matrix-columns/compile.ts";
import { session } from "../../authoring/matrix-columns/session.ts";
import { authorSourceByteLimit } from "../../authoring/author-source-limits.ts";
import { preparePreview } from "../../authoring/staged-preview.ts";
import { example } from "../../../content/authoring/convergence/matrix-example.ts";
import { columnExampleFromProduct } from "./model.ts";
import { columnPageHtml } from "./view.ts";
import { mountColumnPlayer } from "./player.ts";
import { prepareColumnFonts } from "./fonts.ts";

/** Optional local author host. It shares the accepted player, not reader URL
 * restoration: an unsaved draft must never masquerade as a reloadable edition. */
export function mountColumnAuthor(root: HTMLElement) {
  const initial = compile(example());
  root.innerHTML = `<div data-matrix-preview></div><details data-matrix-editor open>
    <summary>Edit matrix source</summary>
    <p>Finite numeric 2×2 factors and reading text. Apply explicitly to update the preview. Prose is editorial: changing numbers does not rewrite its claims.</p>
    <label>Load JSON into draft <input type="file" accept=".json,application/json" data-matrix-file></label>
    <label>Source JSON<textarea data-matrix-json rows="18" spellcheck="false"></textarea></label>
    <button type="button" data-matrix-apply>Apply source</button>
    <button type="button" data-matrix-draft>Download draft</button>
    <button type="button" data-matrix-download disabled>Download displayed source</button>
    <p data-matrix-status role="status">Preparing starter…</p><p data-matrix-revision></p>
    <p>Reload restores the starter. Download edits to keep them; no file is overwritten.</p>
    <p>Build an interactive edition from downloaded source: <code>npm run author:matrix-publication -- --source &lt;source.json&gt; --interactive</code></p>
    </details>`;
  const editor = root.querySelector<HTMLTextAreaElement>("[data-matrix-json]")!;
  const file = root.querySelector<HTMLInputElement>("[data-matrix-file]")!;
  const apply = root.querySelector<HTMLButtonElement>("[data-matrix-apply]")!;
  const draftDownload = root.querySelector<HTMLButtonElement>("[data-matrix-draft]")!;
  const displayedDownload = root.querySelector<HTMLButtonElement>("[data-matrix-download]")!;
  const status = root.querySelector<HTMLElement>("[data-matrix-status]")!;
  const revision = root.querySelector<HTMLElement>("[data-matrix-revision]")!;
  let display = root.querySelector<HTMLElement>("[data-matrix-preview]")!;
  type Prepared = Awaited<ReturnType<typeof preparePreview<ReturnType<typeof mountColumnPlayer>>>>;
  let active: Prepared | undefined, column = 0, disposed = false, fileGeneration = 0;
  editor.value = serialize(initial);
  const owner = session({ initial,
    async prepare(draft) {
      const selected = column, progress = active?.surface.progress() ?? 0;
      const scene = columnExampleFromProduct(draft.product, selected, draft.source.reading);
      await prepareColumnFonts();
      const prepared = await preparePreview(display, { className: "matrix-source-staging",
        html: columnPageHtml(scene, { selection: "author=1", hash: "" }),
        mount: async staging => mountColumnPlayer(staging, scene, progress, () => {}) });
      return { ...prepared, selected };
    },
    commit(prepared, draft) {
      const previous = active;
      // Retain the mounted root itself: the matrix player queries it on every
      // sample. Moving only its children would silently strand that ownership.
      prepared.staging.className = ""; prepared.staging.style.removeProperty("width");
      prepared.staging.inert = false; prepared.staging.removeAttribute("aria-hidden");
      prepared.staging.dataset["matrixPreview"] = "";
      display.replaceWith(prepared.staging); display = prepared.staging; active = prepared;
      previous?.dispose();
      document.querySelector("h1")!.textContent = draft.source.reading.title;
      document.title = draft.source.reading.title;
      document.querySelector("#matrix-story > p")!.textContent = draft.source.reading.introduction;
      root.dataset["ready"] = "true"; root.dataset["column"] = String(prepared.selected);
      root.dataset["revision"] = draft.revision; root.dataset["sourceId"] = draft.product.id;
      for (const link of display.querySelectorAll<HTMLAnchorElement>("[data-column-navigation] a"))
        link.setAttribute("aria-current", new URL(link.href).searchParams.get("column") === String(prepared.selected) ? "true" : "false");
      revision.textContent = `Displayed revision: ${draft.revision}`;
      displayedDownload.disabled = false;
    }
  });
  function invalidate() { ++fileGeneration; owner.invalidate(); root.setAttribute("aria-busy", "false"); }
  async function update(source?: string) {
    if (disposed) return;
    ++fileGeneration; active?.surface.pause(); root.setAttribute("aria-busy", "true");
    status.textContent = "Preparing preview…";
    const result = source === undefined ? await owner.applyDraft(owner.current()) : await owner.apply(source);
    if (result.status === "superseded") return;
    root.setAttribute("aria-busy", "false");
    status.textContent = result.status === "applied" ? "Displayed source is checked. Draft changes require Apply."
      : `${result.diagnostic.code} at ${result.diagnostic.path}: ${result.diagnostic.expected}`;
  }
  editor.oninput = () => { invalidate(); status.textContent = "Draft changed; preview unchanged. Apply to check it."; };
  apply.onclick = () => { void update(editor.value); };
  file.onchange = async () => {
    invalidate(); const ticket = fileGeneration, selected = file.files?.[0];
    if (!selected) return;
    try {
      if (selected.size > authorSourceByteLimit) throw new Error("Keep source within 100,000 UTF-8 bytes.");
      const text = new TextDecoder("utf-8", { fatal: true }).decode(await selected.arrayBuffer());
      if (disposed || ticket !== fileGeneration) return;
      editor.value = text; status.textContent = "File loaded into draft; Apply to check and preview it.";
    } catch (error) {
      if (!disposed && ticket === fileGeneration) status.textContent = `File not loaded: ${error instanceof Error ? error.message : String(error)}`;
    } finally { if (ticket === fileGeneration) file.value = ""; }
  };
  function download(text: string, name: string) {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    try { const link = document.createElement("a"); link.href = url; link.download = name; link.click(); }
    finally { URL.revokeObjectURL(url); }
  }
  draftDownload.onclick = () => download(editor.value, "matrix-draft.json");
  displayedDownload.onclick = () => { if (active) download(serialize(owner.current()), `${owner.current().source.id}.json`); };
  const click = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("[data-column-navigation] a") : null;
    if (!link) return;
    event.preventDefault(); column = Number(new URL(link.href).searchParams.get("column")); void update();
  };
  const pagehide = (event: PageTransitionEvent) => {
    if (!event.persisted) dispose();
    else { invalidate(); active?.surface.pause(); status.textContent = "Preview paused; draft retained."; }
  };
  const pageshow = (event: PageTransitionEvent) => { if (event.persisted && !disposed) active?.surface.prepare(); };
  function dispose() {
    if (disposed) return; disposed = true; ++fileGeneration; owner.dispose(); active?.dispose(); active = undefined;
    editor.oninput = null; file.onchange = null; apply.onclick = null; draftDownload.onclick = null; displayedDownload.onclick = null;
    displayedDownload.disabled = true;
    root.removeEventListener("click", click); window.removeEventListener("pagehide", pagehide); window.removeEventListener("pageshow", pageshow);
  }
  root.addEventListener("click", click); window.addEventListener("pagehide", pagehide); window.addEventListener("pageshow", pageshow);
  void update(serialize(initial));
  return dispose;
}
