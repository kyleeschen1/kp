import { initialSectionView, readSaddleSectionView, type SaddleSectionView } from "../../animation-player/public-api.ts";
import { readReferenceState, type ReferenceOccurrence } from "./state.ts";

export interface SectionReturnPoint {
  readonly slot: 0 | 1; readonly sourceId: string; readonly object: "section-curve"; readonly offset: number;
  readonly expanded: readonly [boolean, boolean];
}
export type SectionPrediction = { readonly status: "pending"; readonly choice: "same" | "different" | "unsure" | null }
  | { readonly status: "revealed"; readonly choice: "same" | "different" | "unsure" | null };
export interface SectionDetour {
  readonly kind: "kp.section-detour.v1"; readonly question: "opposite-plane";
  readonly origin: readonly ReferenceOccurrence[]; readonly returnTo: SectionReturnPoint;
  readonly prediction: SectionPrediction; readonly comparison: "original" | "opposite"; readonly view: SaddleSectionView;
}
type Admission<T> = { readonly status: "ready"; readonly value: T }
  | { readonly status: "repair-required"; readonly code: "invalid-section-context"; readonly message: string };
const record = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
const keys = (x: Record<string, unknown>, expected: string) => Object.keys(x).sort().join(",") === expected;
const gap = (message: string): Admission<never> => ({ status: "repair-required", code: "invalid-section-context", message });

export function readSectionReturnPoint(input: unknown, origin: readonly ReferenceOccurrence[]): Admission<SectionReturnPoint> {
  if (!record(input) || !keys(input, "expanded,object,offset,slot,sourceId") || (input["slot"] !== 0 && input["slot"] !== 1)
    || input["object"] !== "section-curve" || typeof input["offset"] !== "number" || !Number.isFinite(input["offset"])
    || Math.abs(input["offset"]) > 8192 || typeof input["sourceId"] !== "string" || input["sourceId"] !== origin[input["slot"]]?.source.id)
    return gap("Return context must name this section copy and curve, with a finite viewport offset.");
  const expanded = input["expanded"];
  if (!Array.isArray(expanded) || expanded.length !== 2 || typeof expanded[0] !== "boolean" || typeof expanded[1] !== "boolean")
    return gap("Return context must preserve both source disclosures.");
  return { status: "ready", value: Object.freeze({ slot: input["slot"], sourceId: input["sourceId"], object: "section-curve", offset: input["offset"],
    expanded: Object.freeze([expanded[0], expanded[1]] as const) }) };
}
export function readSectionDetour(input: unknown): Admission<SectionDetour> {
  try {
    if (!record(input) || !keys(input, "comparison,kind,origin,prediction,question,returnTo,view")
      || input["kind"] !== "kp.section-detour.v1" || input["question"] !== "opposite-plane") return gap("This link must contain the supported opposite-plane question.");
    const origin = readReferenceState(JSON.stringify(input["origin"]));
    if (origin.status !== "ready") return gap(origin.message);
    const point = readSectionReturnPoint(input["returnTo"], origin.occurrences), view = readSaddleSectionView(input["view"]);
    if (point.status !== "ready") return point;
    if (view.status !== "ready") return gap(view.message);
    const prediction = input["prediction"], comparison = input["comparison"];
    if (!record(prediction) || !keys(prediction, "choice,status") || (prediction["status"] !== "pending" && prediction["status"] !== "revealed")
      || (prediction["choice"] !== null && prediction["choice"] !== "same" && prediction["choice"] !== "different" && prediction["choice"] !== "unsure")
      || (comparison !== "original" && comparison !== "opposite") || (prediction["status"] === "pending" && comparison !== "original"))
      return gap("Use a supported prediction; reveal before comparing the other plane.");
    return { status: "ready", value: Object.freeze({ kind: "kp.section-detour.v1", question: "opposite-plane",
      origin: Object.freeze(origin.occurrences.map(item => Object.freeze(item))), returnTo: point.value,
      prediction: Object.freeze({ status: prediction["status"], choice: prediction["choice"] }), comparison, view: view.value }) };
  } catch { return gap("Malformed section context; reopen the question from its reference."); }
}
export function createSectionDetour(origin: readonly ReferenceOccurrence[], point: SectionReturnPoint): SectionDetour {
  const admitted = readSectionDetour({ kind: "kp.section-detour.v1", question: "opposite-plane", origin, returnTo: point,
    prediction: { status: "pending", choice: null }, comparison: "original", view: { ...initialSectionView, inspection: 1 } });
  if (admitted.status !== "ready") throw new Error(admitted.message); return admitted.value;
}
export function parseSectionContext(raw: string | null): Admission<SectionDetour> {
  if (raw === null || raw.length > 12000) return gap("Missing or oversized question context; reopen it from the reference.");
  try { return readSectionDetour(JSON.parse(raw)); } catch { return gap("Invalid question JSON; reopen it from the reference."); }
}
export function sectionReturnHref(state: SectionDetour, theme: "light" | "dark"): string {
  const checked = readSectionDetour(state); if (checked.status !== "ready") throw new Error(checked.message);
  return `/experiments/saddle-section-reference/?${new URLSearchParams({ sections: JSON.stringify(checked.value.origin),
    returnPoint: JSON.stringify(checked.value.returnTo), theme })}#section-${checked.value.returnTo.slot + 1}`;
}
