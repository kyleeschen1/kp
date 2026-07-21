export interface KpEquationMotionInkRect {
  readonly id: string;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly opacity: number;
}

export interface KpEquationMotionClearanceRequirement {
  readonly id: string;
  readonly movingIds: readonly string[];
  readonly protectedIds: readonly string[];
  readonly minClearancePx: number;
}

export interface KpEquationMotionClearanceFrame {
  readonly progress: number;
  readonly ink: readonly KpEquationMotionInkRect[];
}

export interface KpEquationMotionClearanceDiagnostic {
  readonly code: "motion.ink-overlap" | "motion.ink-clearance";
  readonly requirementId: string;
  readonly progress: number;
  readonly movingId: string;
  readonly protectedId: string;
  readonly measuredPx: number;
  readonly requiredPx: number;
  readonly message: string;
}

export interface KpEquationMotionClearanceReport {
  readonly kind: "equation-motion-clearance-report";
  readonly passed: boolean;
  readonly minimumClearancePx: number | null;
  readonly diagnostics: readonly KpEquationMotionClearanceDiagnostic[];
}

/**
 * Evaluates configured semantic pairs rather than every glyph pair. Adjacent
 * operators are allowed to touch by typography; authored moving/protected
 * relationships are the boundary that must remain collision-free.
 */
export function evaluateKpEquationMotionClearanceFrame(input: {
  readonly frame: KpEquationMotionClearanceFrame;
  readonly requirements: readonly KpEquationMotionClearanceRequirement[];
  readonly visibleOpacityThreshold?: number | undefined;
}): KpEquationMotionClearanceReport {
  const threshold = input.visibleOpacityThreshold ?? 0.05;
  finiteUnit(threshold, "visible opacity threshold");
  const progress = finite(input.frame.progress, "frame progress");
  const inkById = new Map<string, KpEquationMotionInkRect>();
  for (const ink of input.frame.ink) {
    validateInk(ink);
    if (inkById.has(ink.id)) throw new Error(`Duplicate motion ink id ${ink.id}.`);
    inkById.set(ink.id, ink);
  }

  const diagnostics: KpEquationMotionClearanceDiagnostic[] = [];
  let minimumClearancePx = Number.POSITIVE_INFINITY;
  for (const requirement of input.requirements) {
    validateRequirement(requirement);
    for (const movingId of requirement.movingIds) {
      const moving = requiredInk(inkById, movingId, requirement.id);
      if (moving.opacity <= threshold) continue;
      for (const protectedId of requirement.protectedIds) {
        if (movingId === protectedId) continue;
        const protectedInk = requiredInk(inkById, protectedId, requirement.id);
        if (protectedInk.opacity <= threshold) continue;
        const clearance = rectClearance(moving, protectedInk);
        minimumClearancePx = Math.min(minimumClearancePx, clearance.distancePx);
        if (clearance.overlaps) {
          diagnostics.push({
            code: "motion.ink-overlap",
            requirementId: requirement.id,
            progress,
            movingId,
            protectedId,
            measuredPx: 0,
            requiredPx: requirement.minClearancePx,
            message: `${movingId} overlaps protected ink ${protectedId}.`
          });
        } else if (clearance.distancePx < requirement.minClearancePx) {
          diagnostics.push({
            code: "motion.ink-clearance",
            requirementId: requirement.id,
            progress,
            movingId,
            protectedId,
            measuredPx: clearance.distancePx,
            requiredPx: requirement.minClearancePx,
            message: `${movingId} is ${clearance.distancePx.toFixed(2)}px from protected ink ${protectedId}.`
          });
        }
      }
    }
  }

  return {
    kind: "equation-motion-clearance-report",
    passed: diagnostics.length === 0,
    minimumClearancePx: Number.isFinite(minimumClearancePx)
      ? minimumClearancePx
      : null,
    diagnostics
  };
}

function rectClearance(
  left: KpEquationMotionInkRect,
  right: KpEquationMotionInkRect
): { readonly overlaps: boolean; readonly distancePx: number } {
  const horizontalOverlap = Math.min(left.left + left.width, right.left + right.width) -
    Math.max(left.left, right.left);
  const verticalOverlap = Math.min(left.top + left.height, right.top + right.height) -
    Math.max(left.top, right.top);
  if (horizontalOverlap > 0 && verticalOverlap > 0) {
    return { overlaps: true, distancePx: 0 };
  }
  const horizontalGap = Math.max(
    0,
    right.left - (left.left + left.width),
    left.left - (right.left + right.width)
  );
  const verticalGap = Math.max(
    0,
    right.top - (left.top + left.height),
    left.top - (right.top + right.height)
  );
  return { overlaps: false, distancePx: Math.hypot(horizontalGap, verticalGap) };
}

function requiredInk(
  inkById: ReadonlyMap<string, KpEquationMotionInkRect>,
  id: string,
  requirementId: string
): KpEquationMotionInkRect {
  const ink = inkById.get(id);
  if (ink === undefined) {
    throw new Error(`Clearance requirement ${requirementId} references missing ink ${id}.`);
  }
  return ink;
}

function validateInk(ink: KpEquationMotionInkRect): void {
  if (ink.id.trim().length === 0) throw new TypeError("Motion ink id must not be empty.");
  finite(ink.left, `${ink.id} left`);
  finite(ink.top, `${ink.id} top`);
  nonNegative(ink.width, `${ink.id} width`);
  nonNegative(ink.height, `${ink.id} height`);
  finiteUnit(ink.opacity, `${ink.id} opacity`);
}

function validateRequirement(requirement: KpEquationMotionClearanceRequirement): void {
  if (requirement.id.trim().length === 0) {
    throw new TypeError("Clearance requirement id must not be empty.");
  }
  if (requirement.movingIds.length === 0 || requirement.protectedIds.length === 0) {
    throw new Error(`Clearance requirement ${requirement.id} needs moving and protected ink.`);
  }
  nonNegative(requirement.minClearancePx, `${requirement.id} minimum clearance`);
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite.`);
  return value;
}

function finiteUnit(value: number, label: string): number {
  finite(value, label);
  if (value < 0 || value > 1) throw new RangeError(`${label} must be between 0 and 1.`);
  return value;
}

function nonNegative(value: number, label: string): number {
  finite(value, label);
  if (value < 0) throw new RangeError(`${label} must not be negative.`);
  return value;
}
