import { checkGradientContourSource, gradientContourPrimary } from "./gradient-contour-model.ts";
import { createGradientContourSequence } from "./gradient-contour-sequence.ts";
import { createKpSurfaceContourStageAuthority } from "../kinetic-figure-surface-contour/kinetic-figure-surface-contour-stage.ts";

const lessonBrand = Symbol("checked-gradient-explanation");
export interface CheckedGradientExplanation {
  readonly [lessonBrand]: true;
  readonly sequence: ReturnType<typeof createGradientContourSequence>;
  readonly authority: ReturnType<typeof createKpSurfaceContourStageAuthority>;
  readonly sourceText: string;
}
export type GradientExplanationCheck =
  | { readonly status: "checked"; readonly lesson: CheckedGradientExplanation }
  | { readonly status: "repair"; readonly code: string; readonly path: string; readonly expected: string };

export const gradientContourVariant = Object.freeze({ ...gradientContourPrimary, a: 2, b: 1, point: Object.freeze({ x: .75, y: .5 }) });

/** This host teaches a nonzero uphill direction in the first quadrant. The
 * mathematical model supports more points; unsupported pedagogy is a gap,
 * never permission to reuse a false compass claim or a degenerate picture. */
export function checkGradientExplanation(value: unknown): GradientExplanationCheck {
  const checked = checkGradientContourSource(value);
  if (checked.status === "repair") return checked;
  const model = checked.model;
  if (model.atPoint.kind === "stationary" || model.source.point.x <= 0 || model.source.point.y <= 0)
    return { status: "repair", code: "unsupported-explanation", path: "$.point", expected: "This explanation currently needs positive x and y. Other quadrants and stationary-point stories are not yet authored; the current lesson is preserved." };
  if (model.level < .25 || model.level > 4)
    return { status: "repair", code: "unsupported-stage-range", path: "$.point", expected: "Choose a point with field height between 0.25 and 4 for this contour stage." };
  const authority = createKpSurfaceContourStageAuthority(model.field);
  if (authority.fitPlan.gap)
    return { status: "repair", code: "stage-fit", path: "$", expected: "This source does not fit the existing readable stage. Retain the current lesson; do not shrink required text or invent a new camera treatment." };
  return { status: "checked", lesson: Object.freeze({ [lessonBrand]: true as const, authority,
    sequence: createGradientContourSequence(model), sourceText: JSON.stringify(model.source, null, 2) }) };
}

export function checkGradientExplanationText(text: string): GradientExplanationCheck {
  let value: unknown;
  try { value = JSON.parse(text) as unknown; }
  catch { return { status: "repair", code: "invalid-json", path: "$", expected: "Enter valid JSON. The current lesson is unchanged." }; }
  return checkGradientExplanation(value);
}
