import type { KpReaderLayoutRect } from "./equation-layout-snapshot.ts";
import type { KpReaderEquationPerceptualAlignmentPlan } from "./equation-perceptual-alignment.ts";
import type { KpReaderEquationSymbolMotionFrame } from "./equation-symbol-motion.ts";

export interface KpReaderEquationResponsiveFitPlan {
  readonly id: string;
  readonly kind: "reader-equation-responsive-fit-plan";
  readonly alignmentPlanId: string;
  readonly viewportWidth: number;
  readonly horizontalPadding: number;
  readonly contentBounds: KpReaderLayoutRect;
  readonly requiredScale: number;
  readonly scale: number;
  readonly translateX: number;
  readonly status: "native" | "scaled" | "overflow";
  readonly wrapAllowed: false;
}

export interface KpReaderEquationConformanceIssue {
  readonly code:
    | "equation-conformance.responsive-overflow"
    | "equation-conformance.owner-out-of-bounds"
    | "equation-conformance.invalid-owner-frame";
  readonly message: string;
  readonly ownerId?: string | undefined;
}

export function planKpReaderEquationResponsiveFit(input: {
  readonly alignment: KpReaderEquationPerceptualAlignmentPlan;
  readonly viewportWidth: number;
  readonly horizontalPadding?: number | undefined;
  readonly minScale?: number | undefined;
}): KpReaderEquationResponsiveFitPlan {
  const horizontalPadding = input.horizontalPadding ?? 16;
  const minScale = input.minScale ?? 0.72;
  if (!Number.isFinite(input.viewportWidth) || input.viewportWidth <= 0) {
    throw new Error("Equation fit viewport width must be finite and positive.");
  }
  if (!Number.isFinite(horizontalPadding) || horizontalPadding < 0) {
    throw new Error("Equation fit padding must be finite and non-negative.");
  }
  if (!Number.isFinite(minScale) || minScale <= 0 || minScale > 1) {
    throw new Error("Equation fit minimum scale must be within (0, 1].");
  }
  const availableWidth = input.viewportWidth - horizontalPadding * 2;
  if (availableWidth <= 0) {
    throw new Error("Equation fit padding leaves no available inline space.");
  }
  const contentBounds = unionRects(input.alignment.owners.flatMap((owner) => [
    ...(owner.sourceBounds === undefined ? [] : [owner.sourceBounds]),
    ...(owner.targetBounds === undefined ? [] : [owner.targetBounds])
  ]));
  const requiredScale = Math.min(1, availableWidth / contentBounds.width);
  const status = requiredScale >= 1
    ? "native" as const
    : requiredScale >= minScale
      ? "scaled" as const
      : "overflow" as const;
  const scale = status === "overflow" ? minScale : requiredScale;
  const translateX =
    horizontalPadding + (availableWidth - contentBounds.width * scale) / 2 -
    contentBounds.left * scale;

  return {
    id: `fit.${input.alignment.id}.${input.viewportWidth}`,
    kind: "reader-equation-responsive-fit-plan",
    alignmentPlanId: input.alignment.id,
    viewportWidth: input.viewportWidth,
    horizontalPadding,
    contentBounds,
    requiredScale,
    scale,
    translateX,
    status,
    wrapAllowed: false
  };
}

export function applyKpReaderEquationResponsiveFit(
  surface: HTMLElement,
  fit: KpReaderEquationResponsiveFitPlan
): void {
  surface.dataset["kpReaderEquationFitStatus"] = fit.status;
  surface.dataset["kpReaderEquationWrapAllowed"] = "false";
  surface.style.transformOrigin = "0 0";
  surface.style.transform =
    `translate3d(${fit.translateX}px, 0, 0) scale(${fit.scale})`;
  surface.style.whiteSpace = "nowrap";
}

export function checkKpReaderEquationMotionConformance(input: {
  readonly motion: KpReaderEquationSymbolMotionFrame;
  readonly fit: KpReaderEquationResponsiveFitPlan;
  readonly tolerancePx?: number | undefined;
}): readonly KpReaderEquationConformanceIssue[] {
  const tolerance = input.tolerancePx ?? 0.5;
  const issues: KpReaderEquationConformanceIssue[] = [];
  if (input.fit.status === "overflow") {
    issues.push({
      code: "equation-conformance.responsive-overflow",
      message:
        `Equation requires scale ${input.fit.requiredScale.toFixed(3)}, below the accepted minimum ${input.fit.scale.toFixed(3)}.`
    });
  }
  for (const owner of input.motion.owners) {
    const values = [
      owner.currentBounds.left,
      owner.currentBounds.top,
      owner.currentBounds.width,
      owner.currentBounds.height,
      owner.materialOpacity,
      owner.sourceNativeOpacity,
      owner.targetNativeOpacity,
      owner.focusStrength
    ];
    if (
      !values.every(Number.isFinite) ||
      owner.currentBounds.width <= 0 ||
      owner.currentBounds.height <= 0 ||
      ![owner.materialOpacity, owner.sourceNativeOpacity, owner.targetNativeOpacity]
        .every((opacity) => opacity >= 0 && opacity <= 1)
    ) {
      issues.push({
        code: "equation-conformance.invalid-owner-frame",
        message: `Equation material owner ${owner.ownerId} has invalid frame values.`,
        ownerId: owner.ownerId
      });
      continue;
    }
    if (input.fit.status === "overflow") continue;
    const left = owner.currentBounds.left * input.fit.scale + input.fit.translateX;
    const right =
      (owner.currentBounds.left + owner.currentBounds.width) * input.fit.scale +
      input.fit.translateX;
    const min = input.fit.horizontalPadding - tolerance;
    const max = input.fit.viewportWidth - input.fit.horizontalPadding + tolerance;
    if (left < min || right > max) {
      issues.push({
        code: "equation-conformance.owner-out-of-bounds",
        message: `Equation material owner ${owner.ownerId} exceeds the fitted inline viewport.`,
        ownerId: owner.ownerId
      });
    }
  }
  return issues;
}

function unionRects(rects: readonly KpReaderLayoutRect[]): KpReaderLayoutRect {
  if (rects.length === 0) {
    throw new Error("Equation responsive fit requires measured owner bounds.");
  }
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}
