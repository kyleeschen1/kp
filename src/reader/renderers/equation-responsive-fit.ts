import type { KpReaderLayoutRect } from "./equation-layout-snapshot.ts";
import type { KpReaderEquationPerceptualAlignmentPlan } from "./equation-perceptual-alignment.ts";
import type { KpReaderEquationSymbolMotionFrame } from "./equation-symbol-motion.ts";
import {
  assertKpEquationStageMeasurementIdentity,
  createKpEquationStageMeasurementIdentity,
  type KpEquationStageMeasurementIdentity
} from "../runtime/equation-stage-layout.ts";
import type {
  KpCorridorCertifiedEquationStageLayout
} from "../runtime/equation-stage-transit-corridor.ts";

export interface KpReaderEquationResponsiveFitPlan {
  readonly id: string;
  readonly kind: "reader-equation-responsive-fit-plan";
  readonly alignmentPlanId: string;
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
  readonly geometrySource:
    | "alignment-envelope"
    | "certified-stage-swept-envelope";
  readonly viewportWidth: number;
  readonly viewportHeight?: number | undefined;
  readonly horizontalPadding: number;
  readonly verticalPadding?: number | undefined;
  readonly contentBounds: KpReaderLayoutRect;
  readonly requiredScale: number;
  readonly scale: number;
  readonly translateX: number;
  readonly translateY: number;
  readonly status: "native" | "scaled" | "contained" | "overflow";
  readonly wrapAllowed: false;
}

const certifiedEquationStageResponsiveFitAuthority: unique symbol =
  Symbol("kp.certified-equation-stage-responsive-fit");

export interface KpReaderCertifiedEquationStageResponsiveFitPlan
  extends KpReaderEquationResponsiveFitPlan {
  readonly geometrySource: "certified-stage-swept-envelope";
  readonly stageLayout: KpCorridorCertifiedEquationStageLayout;
  readonly [certifiedEquationStageResponsiveFitAuthority]: true;
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
  readonly viewportHeight?: number | undefined;
  readonly horizontalPadding?: number | undefined;
  readonly verticalPadding?: number | undefined;
  readonly minScale?: number | undefined;
  readonly overflowStrategy?: "report" | "contain" | undefined;
}): KpReaderEquationResponsiveFitPlan {
  return planFit({
    id: `fit.${input.alignment.id}.${input.viewportWidth}`,
    alignmentPlanId: input.alignment.id,
    geometrySource: "alignment-envelope",
    alignments: [input.alignment],
    viewportWidth: input.viewportWidth,
    viewportHeight: input.viewportHeight,
    horizontalPadding: input.horizontalPadding,
    verticalPadding: input.verticalPadding,
    minScale: input.minScale,
    overflowStrategy: input.overflowStrategy
  });
}

export function planKpReaderEquationSequenceResponsiveFit(input: {
  readonly id: string;
  readonly alignments: readonly KpReaderEquationPerceptualAlignmentPlan[];
  readonly viewportWidth: number;
  readonly viewportHeight?: number | undefined;
  readonly horizontalPadding?: number | undefined;
  readonly verticalPadding?: number | undefined;
  readonly minScale?: number | undefined;
  readonly overflowStrategy?: "report" | "contain" | undefined;
}): KpReaderEquationResponsiveFitPlan {
  if (input.id.trim() === "" || input.alignments.length === 0) {
    throw new Error("Equation sequence fit requires an id and at least one alignment.");
  }
  return planFit({
    id: `fit.sequence.${input.id}.${input.viewportWidth}`,
    alignmentPlanId: `sequence.${input.id}`,
    geometrySource: "alignment-envelope",
    alignments: input.alignments,
    viewportWidth: input.viewportWidth,
    viewportHeight: input.viewportHeight,
    horizontalPadding: input.horizontalPadding,
    verticalPadding: input.verticalPadding,
    minScale: input.minScale,
    overflowStrategy: input.overflowStrategy
  });
}

export function planKpReaderCertifiedEquationStageResponsiveFit(input: {
  readonly layout: KpCorridorCertifiedEquationStageLayout;
  readonly viewportWidth: number;
  readonly viewportHeight?: number | undefined;
  readonly horizontalPadding?: number | undefined;
  readonly verticalPadding?: number | undefined;
  readonly minScale?: number | undefined;
  readonly overflowStrategy?: "report" | "contain" | undefined;
}): KpReaderCertifiedEquationStageResponsiveFitPlan {
  const fit = planFit({
    id:
      `fit.stage.${input.layout.measuredInput.intent.nodeId}.` +
      `${input.layout.measurementIdentity.revision}.${input.viewportWidth}`,
    alignmentPlanId:
      `certified-stage.${input.layout.measuredInput.intent.nodeId}`,
    geometrySource: "certified-stage-swept-envelope",
    alignments: [],
    contentBounds: input.layout.sweptBounds,
    measurementIdentity: input.layout.measurementIdentity,
    viewportWidth: input.viewportWidth,
    viewportHeight: input.viewportHeight,
    horizontalPadding: input.horizontalPadding,
    verticalPadding: input.verticalPadding,
    minScale: input.minScale,
    overflowStrategy: input.overflowStrategy
  });
  return Object.freeze({
    ...fit,
    geometrySource: "certified-stage-swept-envelope" as const,
    stageLayout: input.layout,
    [certifiedEquationStageResponsiveFitAuthority]: true as const
  });
}

function planFit(input: {
  readonly id: string;
  readonly alignmentPlanId: string;
  readonly geometrySource: KpReaderEquationResponsiveFitPlan["geometrySource"];
  readonly alignments: readonly KpReaderEquationPerceptualAlignmentPlan[];
  readonly contentBounds?: KpReaderLayoutRect | undefined;
  readonly measurementIdentity?: KpEquationStageMeasurementIdentity | undefined;
  readonly viewportWidth: number;
  readonly viewportHeight?: number | undefined;
  readonly horizontalPadding?: number | undefined;
  readonly verticalPadding?: number | undefined;
  readonly minScale?: number | undefined;
  readonly overflowStrategy?: "report" | "contain" | undefined;
}): KpReaderEquationResponsiveFitPlan {
  const firstIdentity =
    input.measurementIdentity ?? input.alignments[0]?.measurementIdentity;
  if (firstIdentity === undefined) {
    throw new Error("Equation responsive fit requires measured alignment identity.");
  }
  const measurementIdentity =
    createKpEquationStageMeasurementIdentity(firstIdentity);
  for (const alignment of input.alignments.slice(1)) {
    assertKpEquationStageMeasurementIdentity(
      measurementIdentity,
      alignment.measurementIdentity,
      `Equation responsive fit alignment ${alignment.id}`
    );
  }
  const horizontalPadding = input.horizontalPadding ?? 16;
  const verticalPadding = input.verticalPadding ?? 0;
  const minScale = input.minScale ?? 0.72;
  const overflowStrategy = input.overflowStrategy ?? "report";
  if (!Number.isFinite(input.viewportWidth) || input.viewportWidth <= 0) {
    throw new Error("Equation fit viewport width must be finite and positive.");
  }
  if (!Number.isFinite(horizontalPadding) || horizontalPadding < 0) {
    throw new Error("Equation fit padding must be finite and non-negative.");
  }
  if (
    input.viewportHeight !== undefined &&
    (!Number.isFinite(input.viewportHeight) || input.viewportHeight <= 0)
  ) {
    throw new Error("Equation fit viewport height must be finite and positive.");
  }
  if (!Number.isFinite(verticalPadding) || verticalPadding < 0) {
    throw new Error(
      "Equation fit vertical padding must be finite and non-negative."
    );
  }
  if (!Number.isFinite(minScale) || minScale <= 0 || minScale > 1) {
    throw new Error("Equation fit minimum scale must be within (0, 1].");
  }
  const availableWidth = input.viewportWidth - horizontalPadding * 2;
  if (availableWidth <= 0) {
    throw new Error("Equation fit padding leaves no available inline space.");
  }
  const contentBounds = input.contentBounds ?? unionRects(
    input.alignments.flatMap((alignment) =>
      alignment.owners.flatMap((owner) => [
        ...(owner.sourceBounds === undefined ? [] : [owner.sourceBounds]),
        ...(owner.targetBounds === undefined ? [] : [owner.targetBounds])
      ])
    )
  );
  const availableHeight = input.viewportHeight === undefined
    ? undefined
    : input.viewportHeight - verticalPadding * 2;
  if (availableHeight !== undefined && availableHeight <= 0) {
    throw new Error("Equation fit padding leaves no available block space.");
  }
  const requiredScale = Math.min(
    1,
    availableWidth / contentBounds.width,
    ...(availableHeight === undefined
      ? []
      : [availableHeight / contentBounds.height])
  );
  const status = requiredScale >= 1
    ? "native" as const
    : requiredScale >= minScale
      ? "scaled" as const
      : overflowStrategy === "contain"
        ? "contained" as const
        : "overflow" as const;
  const scale = status === "overflow" ? minScale : requiredScale;
  const translateX =
    horizontalPadding + (availableWidth - contentBounds.width * scale) / 2 -
    contentBounds.left * scale;
  const translateY = availableHeight === undefined
    ? 0
    : verticalPadding +
      (availableHeight - contentBounds.height * scale) / 2 -
      contentBounds.top * scale;

  return {
    id: input.id,
    kind: "reader-equation-responsive-fit-plan",
    alignmentPlanId: input.alignmentPlanId,
    measurementIdentity,
    geometrySource: input.geometrySource,
    viewportWidth: input.viewportWidth,
    ...(input.viewportHeight === undefined
      ? {}
      : { viewportHeight: input.viewportHeight }),
    horizontalPadding,
    ...(input.viewportHeight === undefined ? {} : { verticalPadding }),
    contentBounds,
    requiredScale,
    scale,
    translateX,
    translateY,
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
  surface.dataset["kpReaderEquationFitScale"] = String(fit.scale);
  surface.dataset["kpReaderEquationFitBounds"] = JSON.stringify(
    fit.contentBounds
  );
  surface.style.transformOrigin = "0 0";
  surface.style.transform =
    `translate3d(${fit.translateX}px, ${fit.translateY}px, 0) ` +
    `scale(${fit.scale})`;
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
    const top =
      owner.currentBounds.top * input.fit.scale + input.fit.translateY;
    const bottom =
      (owner.currentBounds.top + owner.currentBounds.height) * input.fit.scale +
      input.fit.translateY;
    const minimumTop = (input.fit.verticalPadding ?? 0) - tolerance;
    const maximumBottom = input.fit.viewportHeight === undefined
      ? Number.POSITIVE_INFINITY
      : input.fit.viewportHeight - (input.fit.verticalPadding ?? 0) + tolerance;
    if (
      left < min ||
      right > max ||
      top < minimumTop ||
      bottom > maximumBottom
    ) {
      issues.push({
        code: "equation-conformance.owner-out-of-bounds",
        message: `Equation material owner ${owner.ownerId} exceeds the fitted viewport.`,
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
