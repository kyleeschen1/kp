import { checkGradientExplanation, type CheckedGradientExplanation } from "./gradient-contour-authoring.ts";
import type { GradientBeatSlug } from "./gradient-contour-story.ts";

export interface GradientReturnPosition {
  readonly revisionId: string;
  readonly progress: number;
  readonly from: GradientBeatSlug;
  readonly to: GradientBeatSlug;
  readonly timelineAuthority: "none";
}
export function pinGradientPosition(lesson: CheckedGradientExplanation, progress: number): GradientReturnPosition {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) throw new RangeError("Return progress must be inside this lesson.");
  const beats = lesson.sequence.beats, index = Math.floor(progress * (beats.length - 1));
  return Object.freeze({ revisionId: lesson.revisionId, progress, from: beats[index]!.slug,
    to: beats[Math.min(index + 1, beats.length - 1)]!.slug, timelineAuthority: "none" as const });
}
/** A bookmark names semantic neighbors and a source revision. The existing
 * clock still owns time; a detached reading cannot issue animation authority. */
export function resolveGradientPosition(lesson: CheckedGradientExplanation, value: unknown): GradientReturnPosition {
  if (!value || typeof value !== "object") throw new TypeError("Supply a revision-pinned return position.");
  const candidate = value as Partial<GradientReturnPosition>;
  const expected = pinGradientPosition(lesson, candidate.progress!);
  if (candidate.revisionId !== expected.revisionId || candidate.from !== expected.from || candidate.to !== expected.to || candidate.timelineAuthority !== "none")
    throw new TypeError("The return reference must match this exact source revision and semantic interval.");
  return expected;
}
export interface GradientTangentExtraction {
  readonly schemaVersion: "kp.gradient-tangent-extraction.v1";
  readonly reasonId: "gradient.contour-tangent.first-order";
  readonly source: CheckedGradientExplanation["sequence"]["model"]["source"];
  readonly returnTo: GradientReturnPosition;
}
export function extractGradientTangent(lesson: CheckedGradientExplanation, progress: number): GradientTangentExtraction {
  return Object.freeze({ schemaVersion: "kp.gradient-tangent-extraction.v1", reasonId: "gradient.contour-tangent.first-order",
    source: lesson.sequence.model.source, returnTo: pinGradientPosition(lesson, progress) });
}
export function gradientTangentAddress(extraction: GradientTangentExtraction): string {
  return `#${new URLSearchParams({ gradient: JSON.stringify(extraction) })}`;
}
export function readGradientTangentAddress(hash: string):
  | { readonly status: "absent" }
  | { readonly status: "repair"; readonly message: string }
  | { readonly status: "checked"; readonly lesson: CheckedGradientExplanation; readonly extraction: GradientTangentExtraction } {
  if (!hash) return { status: "absent" };
  try {
    if (hash.length > 8000) throw new Error("This gradient address exceeds its bounded size.");
    const params = new URLSearchParams(hash.slice(1));
    if (params.getAll("gradient").length !== 1 || [...params.keys()].some(key => key !== "gradient")) throw new Error("Use one gradient extraction address.");
    const value: unknown = JSON.parse(params.get("gradient")!);
    if (!value || typeof value !== "object") throw new Error("Provide a gradient extraction.");
    const candidate = value as Partial<GradientTangentExtraction>;
    if (candidate.schemaVersion !== "kp.gradient-tangent-extraction.v1" || candidate.reasonId !== "gradient.contour-tangent.first-order") throw new Error("Unsupported gradient explanation reference.");
    const checked = checkGradientExplanation(candidate.source);
    if (checked.status === "repair") throw new Error(`${checked.path}: ${checked.expected}`);
    const position = resolveGradientPosition(checked.lesson, candidate.returnTo);
    return { status: "checked", lesson: checked.lesson, extraction: extractGradientTangent(checked.lesson, position.progress) };
  } catch (error) {
    return { status: "repair", message: error instanceof Error ? error.message : "Invalid gradient address." };
  }
}
