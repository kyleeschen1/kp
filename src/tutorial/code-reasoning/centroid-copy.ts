import type { KpCentroidExtractionState } from "../../semantic/centroid-extraction-model.ts";

const labels = { original: "original calculation", extracted: "extracted helper", generalized: "renamed helper" } as const;

/** Copy checked source, never concatenate spatially animated token spans.
 * Capture before awaiting clipboard permission so an advancing clock cannot
 * change the version the reader asked to copy. */
export function mountCentroidCopy(root: HTMLElement, stage: HTMLElement, snapshot: () => KpCentroidExtractionState) {
  const button = root.querySelector<HTMLButtonElement>("[data-centroid-copy]");
  const status = root.querySelector<HTMLElement>("[data-centroid-copy-status]");
  const fallback = root.querySelector<HTMLElement>("[data-centroid-copy-fallback]");
  const source = root.querySelector<HTMLTextAreaElement>("[data-centroid-copy-source]");
  if (!button || !status || !fallback || !source) throw new Error("Missing centroid copy controls");
  const abort = new AbortController(), options = { signal: abort.signal };
  button.addEventListener("click", async () => {
    const captured = snapshot();
    button.disabled = true;
    try {
      await navigator.clipboard.writeText(captured.source);
      if (abort.signal.aborted) return;
      fallback.hidden = true;
      status.textContent = `Copied ${labels[captured.id]}.`;
    } catch {
      if (abort.signal.aborted) return;
      status.textContent = "Clipboard unavailable. Copy the selected code below.";
      source.value = captured.source;
      fallback.hidden = false;
      source.focus(); source.select();
    } finally {
      if (!abort.signal.aborted) button.disabled = false;
    }
  }, options);
  stage.addEventListener("copy", event => {
    const selection = window.getSelection();
    // Preserve ordinary partial selection at native endpoints. With the code
    // region focused and no selection, Cmd/Ctrl+C copies its complete snapshot.
    if (selection && !selection.isCollapsed) return;
    if (!event.clipboardData) return;
    const captured = snapshot();
    event.clipboardData.setData("text/plain", captured.source);
    event.preventDefault();
    status.textContent = `Copied ${labels[captured.id]}.`;
  }, options);
  return () => abort.abort();
}
