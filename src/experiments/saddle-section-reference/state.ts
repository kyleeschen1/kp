import { initialSectionView, readSaddleSectionSource, readSaddleSectionView,
  type SaddleSectionSource, type SaddleSectionView } from "../../animation-player/public-api.ts";

export interface ReferenceOccurrence { readonly source: SaddleSectionSource; readonly view: SaddleSectionView }
export const initialOccurrences: readonly ReferenceOccurrence[] = [0, 1].map(index => ({
  source: { kind: "kp.saddle-section.v1", id: `saddle-section:reference-${index + 1}`, denominator: 4, y: 1 }, view: initialSectionView
}));
export function readReferenceState(raw: string | null): { status: "ready"; occurrences: readonly ReferenceOccurrence[] }
  | { status: "repair-required"; message: string } {
  if (raw === null) return { status: "ready", occurrences: initialOccurrences };
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || value.length !== 2) throw new Error("Expected two section occurrences.");
    const occurrences = value.map((item: unknown) => {
      if (!item || typeof item !== "object" || !("source" in item) || !("view" in item) || Object.keys(item).length !== 2) throw new Error("Each occurrence needs only source and view.");
      const source = readSaddleSectionSource(item.source), view = readSaddleSectionView(item.view);
      if (source.status !== "ready") throw new Error(source.message);
      if (view.status !== "ready") throw new Error(view.message);
      return { source: source.value, view: view.value };
    });
    return { status: "ready", occurrences };
  } catch (error) { return { status: "repair-required", message: error instanceof Error ? error.message : "Invalid section reference." }; }
}
