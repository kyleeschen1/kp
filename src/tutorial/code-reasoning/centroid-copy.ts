import type { KpCentroidExtractionState } from "../../semantic/centroid-extraction-model.ts";
import { writeSourceClipboard } from "../../reader/runtime/source-clipboard.ts";

const labels = { original: "original calculation", extracted: "extracted helper", generalized: "renamed helper" } as const;

/** Copy checked source, never concatenate spatially animated token spans.
 * Capture before awaiting clipboard permission so an advancing clock cannot
 * change the version the reader asked to copy. */
export function mountCentroidCopy(root: HTMLElement, stage: HTMLElement, snapshot: () => KpCentroidExtractionState, settleSelection: () => boolean) {
  const button = root.querySelector<HTMLButtonElement>("[data-centroid-copy]");
  const status = root.querySelector<HTMLElement>("[data-centroid-copy-status]");
  const fallback = root.querySelector<HTMLElement>("[data-centroid-copy-fallback]");
  const source = root.querySelector<HTMLTextAreaElement>("[data-centroid-copy-source]");
  if (!button || !status || !fallback || !source) throw new Error("Missing centroid copy controls");
  const abort = new AbortController(), options = { signal: abort.signal };
  const settle = () => {
    if (!settleSelection()) return false;
    stage.focus({ preventScroll: true });
    status.textContent = "Code settled. Drag to select, or press Cmd/Ctrl+C to copy all.";
    return true;
  };
  stage.addEventListener("pointerdown", event => {
    // Touch starts may be scrolling; keep that gesture native. Touch users
    // retain Copy code without having to distinguish scrolling from selection.
    if (event.button !== 0 || event.pointerType === "touch") return;
    // Settling can replace the text node under the pointer. Consume this first
    // press rather than anchoring a browser selection to a detached node.
    if (settle()) event.preventDefault();
  }, { ...options, capture: true });
  stage.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); settle(); }
  }, options);
  button.addEventListener("click", async () => {
    const captured = snapshot();
    button.disabled = true;
    const result = await writeSourceClipboard(captured.source, abort.signal);
    if (result === "disposed") return;
    if (result === "copied") {
      fallback.hidden = true;
      status.textContent = `Copied ${labels[captured.id]}.`;
    } else {
      status.textContent = "Clipboard unavailable. Copy the selected code below.";
      source.value = captured.source;
      fallback.hidden = false;
      source.focus(); source.select();
    }
    button.disabled = false;
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
