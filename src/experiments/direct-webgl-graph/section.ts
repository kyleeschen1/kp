import { createKpAnimationSaliencePlan } from "../../animation/salience-plan.ts";
import { evaluateSaddleSurface } from "../../math/surface-examples.ts";
import { createKpSemanticEntity, createKpSemanticEntityRegistry } from "../../semantic/semantic-entity-provenance.ts";
import { createKpSemanticScene } from "../../semantic/semantic-scene-protocol.ts";

export const SECTION_IDS = Object.freeze({
  surface: "direct-webgl-graph-pilot:saddle", plane: "saddle-section:plane",
  curve: "saddle-section:curve", equation: "saddle-section:equation", basis: "saddle-section:xz-basis"
});
const authored = (id: string, semanticKind: string, label: string) => createKpSemanticEntity({
  id, semanticKind, label, provenance: { kind: "authored", sourceId: "math:saddle-section" }
});
export const SECTION_SCENE = createKpSemanticScene({
  id: "saddle-section:scene", surfaceKind: "mixed", title: "The same parabola in space and in its plane",
  registry: createKpSemanticEntityRegistry({ entities: [
    authored(SECTION_IDS.surface, "surface", "Saddle z = (x² − y²) / d"),
    authored(SECTION_IDS.plane, "plane", "The plane y = c"),
    createKpSemanticEntity({ id: SECTION_IDS.curve, semanticKind: "intersection", label: "Saddle section",
      provenance: { kind: "inferred", sourceEntityIds: [SECTION_IDS.surface, SECTION_IDS.plane], methodId: "fix-y" } }),
    createKpSemanticEntity({ id: SECTION_IDS.equation, semanticKind: "equation", label: "z = (x² − c²) / d",
      provenance: { kind: "inferred", sourceEntityIds: [SECTION_IDS.curve], methodId: "section-expression" } }),
    authored(SECTION_IDS.basis, "coordinate-basis", "The plane's x and z coordinates")
  ] }),
  relations: [{ id: "saddle-section:intersection", relationKind: "intersection",
    sourceEntityIds: [SECTION_IDS.surface, SECTION_IDS.plane], targetEntityIds: [SECTION_IDS.curve] },
  { id: "saddle-section:represents", relationKind: "represents",
    sourceEntityIds: [SECTION_IDS.equation], targetEntityIds: [SECTION_IDS.curve] }]
});
export const SECTION_ATTENTION = createKpAnimationSaliencePlan({
  id: "saddle-section:attention", scenes: [SECTION_SCENE], intents: [
    { id: "saddle-section:follow", kind: "notice", summary: "Follow the same section into its own coordinates.",
      targetEntityIds: [SECTION_IDS.curve, SECTION_IDS.equation] },
    { id: "saddle-section:context", kind: "supporting-context", summary: "Keep the section's source and coordinates available.",
      contextEntityIds: [SECTION_IDS.surface, SECTION_IDS.plane, SECTION_IDS.basis], supportsIntentIds: ["saddle-section:follow"] }
  ]
});
export interface SectionState { readonly y: number; readonly inspection: number }
interface SectionEntitySample { readonly id: string; readonly salience: "focus" | "context"; readonly present: boolean }
export const INITIAL_SECTION: SectionState = Object.freeze({ y: 1, inspection: 0 });
export function validateSection(state: SectionState): void {
  if (!Number.isFinite(state.y) || Math.abs(state.y) > 3 || !Number.isFinite(state.inspection) || state.inspection < 0 || state.inspection > 1) {
    throw new Error("The saddle section requires y in −3…3 and inspection progress in 0…1.");
  }
}

/** This is a specialization of the canonical saddle, not a general clipping or
 * algebra engine. The GPU's retained x²/4 samples share this exact source. */
export function sectionHeight(x: number, y: number, denominator: number): number {
  validateSection({ y, inspection: 0 });
  if (!Number.isFinite(x) || Math.abs(x) > 3 || !Number.isFinite(denominator) || denominator < 4 || denominator > 8) {
    throw new Error("Section samples require x in −3…3 and denominator 4…8.");
  }
  return evaluateSaddleSurface({ x, y }) * 4 / denominator;
}

export function resolveSectionFrame(state: SectionState, camera: { readonly azimuth: number; readonly elevation: number }) {
  validateSection(state);
  if (!Number.isFinite(camera.azimuth) || !Number.isFinite(camera.elevation) || Math.abs(camera.elevation) > 75) {
    throw new Error("Section inspection needs a finite saved camera with elevation ±75°.");
  }
  const progress = state.inspection, turn = progress * progress * (3 - 2 * progress);
  const normalized = ((camera.azimuth % 360) + 360) % 360;
  const delta = ((90 - normalized + 540) % 360) - 180;
  // Head-on to y=c is azimuth 90°, elevation 0° in the shared Graph3D projector.
  // The saved camera never changes. Endpoints are exact, including unwrapped azimuths.
  const projectedCamera = progress === 0 ? camera : progress === 1 ? { azimuth: 90, elevation: 0 }
    : { azimuth: camera.azimuth + delta * turn, elevation: camera.elevation * (1 - turn) };
  const entities = SECTION_ATTENTION.intents.flatMap<SectionEntitySample>((intent) => intent.kind === "notice"
    ? intent.targetEntityIds.map((id) => ({ id, salience: "focus" as const, present: true }))
    : intent.kind === "supporting-context" ? intent.contextEntityIds.map((id) => ({
      id, salience: "context" as const, present: id !== SECTION_IDS.surface || progress < 1
    })) : []);
  return { camera: projectedCamera, entities, turn, context: 1 - turn,
    heightOffset: evaluateSaddleSurface({ x: 0, y: state.y }) };
}

// Roles 0–3 belong to the existing coordinate grid. These retained segments use
// local y=0; only the curve's z is scaled, and all section segments move to y=c.
export const SECTION_ROLE = Object.freeze({ curve: 4, outline: 5, grid: 6, x: 7, z: 8 });
export function createSectionGeometry(samples = 97): Float32Array {
  if (!Number.isInteger(samples) || samples < 3 || samples > 129) throw new Error("Section samples must be 3–129.");
  const lines: number[] = [];
  const add = (a: readonly number[], b: readonly number[], role: number) => lines.push(...a, ...b, role);
  for (let n = 0; n < samples - 1; n += 1) {
    const a = -3 + 6 * n / (samples - 1), b = -3 + 6 * (n + 1) / (samples - 1);
    add([a, 0, sectionHeight(a, 0, 4)], [b, 0, sectionHeight(b, 0, 4)], SECTION_ROLE.curve);
  }
  for (const z of [-3, 3]) add([-3, 0, z], [3, 0, z], SECTION_ROLE.outline);
  for (const x of [-3, 3]) add([x, 0, -3], [x, 0, 3], SECTION_ROLE.outline);
  for (const n of [-2, -1, 1, 2]) {
    add([-3, 0, n], [3, 0, n], SECTION_ROLE.grid);
    add([n, 0, -3], [n, 0, 3], SECTION_ROLE.grid);
  }
  add([-3.25, 0, 0], [3.25, 0, 0], SECTION_ROLE.x);
  add([0, 0, -3.25], [0, 0, 3.25], SECTION_ROLE.z);
  return new Float32Array(lines);
}

export function sectionEquation(y: number, denominator: number): string {
  const offset = sectionHeight(0, y, denominator);
  return `z = (x² − ${Number((y * y).toFixed(4))}) / ${Number(denominator.toFixed(2))} · vertex (0, ${Number(offset.toFixed(3))})`;
}
