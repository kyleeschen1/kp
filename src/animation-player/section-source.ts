import { createGridGeometry, createSaddleGeometry } from "./geometry.ts";
import { createSectionGeometry, resolveSectionFrame, sectionHeight } from "./section-model.ts";

export interface SaddleSectionSource {
  readonly kind: "kp.saddle-section.v1";
  readonly id: string;
  readonly denominator: number;
  readonly y: number;
}
export interface SaddleSectionView {
  readonly inspection: number;
  readonly azimuth: number;
  readonly elevation: number;
}
export type SectionAdmission<T> = { readonly status: "ready"; readonly value: T }
  | { readonly status: "repair-required"; readonly code: "unsupported-section-source" | "invalid-section-view"; readonly message: string };
export const initialSectionView: SaddleSectionView = Object.freeze({ inspection: 0, azimuth: 48, elevation: 28 });
/** Keep substitution exact: a rounded c² must not appear as an equality to the source curve. */
export function describeSaddleSection(source: SaddleSectionSource): string {
  return `y = ${source.y} → z = (x² − (${source.y})²) / ${source.denominator}`;
}
const record = (input: unknown): input is Record<string, unknown> => typeof input === "object" && input !== null && !Array.isArray(input);

/** External data is admitted explicitly; unsupported surfaces never become a saddle silently. */
export function readSaddleSectionSource(input: unknown): SectionAdmission<SaddleSectionSource> {
  if (record(input) && Object.keys(input).sort().join(",") === "denominator,id,kind,y" && input["kind"] === "kp.saddle-section.v1"
    && typeof input["id"] === "string" && /^[a-zA-Z0-9][a-zA-Z0-9:._-]{0,127}$/.test(input["id"])
    && typeof input["denominator"] === "number" && Number.isFinite(input["denominator"]) && input["denominator"] >= 4 && input["denominator"] <= 8
    && typeof input["y"] === "number" && Number.isFinite(input["y"]) && Math.abs(input["y"]) <= 3) {
    return { status: "ready", value: Object.freeze({ kind: "kp.saddle-section.v1", id: input["id"], denominator: input["denominator"], y: input["y"] }) };
  }
  return { status: "repair-required", code: "unsupported-section-source", message: "Use kp.saddle-section.v1 with an id, denominator 4…8 and y in −3…3; other fields and surfaces are unsupported." };
}
export function readSaddleSectionView(input: unknown): SectionAdmission<SaddleSectionView> {
  if (record(input) && Object.keys(input).sort().join(",") === "azimuth,elevation,inspection" && typeof input["inspection"] === "number"
    && Number.isFinite(input["inspection"]) && input["inspection"] >= 0 && input["inspection"] <= 1
    && typeof input["azimuth"] === "number" && Number.isFinite(input["azimuth"])
    && typeof input["elevation"] === "number" && Number.isFinite(input["elevation"]) && Math.abs(input["elevation"]) <= 75) {
    return { status: "ready", value: Object.freeze({ inspection: input["inspection"], azimuth: input["azimuth"], elevation: input["elevation"] }) };
  }
  return { status: "repair-required", code: "invalid-section-view", message: "Use inspection 0…1, a finite azimuth and elevation in −75…75 degrees." };
}
const prepared = Symbol("prepared-section");
export interface PreparedSaddleSection { readonly [prepared]: true; readonly source: SaddleSectionSource }
const registrations = new WeakSet<PreparedSaddleSection>();
export function prepareSaddleSection(input: SaddleSectionSource): PreparedSaddleSection {
  const checked = readSaddleSectionSource(input);
  if (checked.status !== "ready") throw new Error(checked.message);
  const result: PreparedSaddleSection = Object.freeze({ [prepared]: true as const, source: checked.value });
  registrations.add(result); return result;
}
export function sectionSource(prepared: PreparedSaddleSection): SaddleSectionSource {
  if (!registrations.has(prepared)) throw new Error("Prepare this section before using it.");
  return prepared.source;
}
// Geometry depends on the bounded family, never the occurrence or parameters.
let geometry: { mesh: ReturnType<typeof createSaddleGeometry>; lines: Float32Array } | undefined;
export function sectionGeometry() {
  return geometry ??= { mesh: createSaddleGeometry(), lines: new Float32Array([...createGridGeometry(), ...createSectionGeometry()]) };
}
export function sampleSaddleSection(prepared: PreparedSaddleSection, input: SaddleSectionView) {
  const source = sectionSource(prepared), checked = readSaddleSectionView(input);
  if (checked.status !== "ready") throw new Error(checked.message);
  const view = checked.value;
  return { ...resolveSectionFrame({ y: source.y, inspection: view.inspection }, view),
    vertex: sectionHeight(0, source.y, source.denominator) };
}
