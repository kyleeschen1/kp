import type { KpCentroidExtractionState } from "../../semantic/centroid-extraction-model.ts";
import { mountCodeSourceCopy } from "./code-source-copy.ts";

const labels = { original: "original calculation", extracted: "extracted helper", generalized: "renamed helper" } as const;
export function mountCentroidCopy(root: HTMLElement, stage: HTMLElement, snapshot: () => KpCentroidExtractionState, settleSelection: () => boolean) {
  const button = root.querySelector<HTMLButtonElement>("[data-centroid-copy]");
  const status = root.querySelector<HTMLElement>("[data-centroid-copy-status]");
  const fallback = root.querySelector<HTMLElement>("[data-centroid-copy-fallback]");
  const source = root.querySelector<HTMLTextAreaElement>("[data-centroid-copy-source]");
  if (!button || !status || !fallback || !source) throw new Error("Missing centroid copy controls");
  return mountCodeSourceCopy(stage, { button, status, fallback, source }, () => {
    const captured = snapshot(); return { source: captured.source, label: labels[captured.id] };
  }, settleSelection);
}
