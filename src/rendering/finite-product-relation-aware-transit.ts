import {
  planKpEquationMotionPathBetweenPoints,
  type KpEquationMotionPathPlan
} from "./equation-motion-path-planner.ts";
import type { KpStageRelativeRect } from
  "./native-katex-fragment-observer.ts";

const KP_FINITE_PRODUCT_ROUTE_CLEARANCE_ATTEMPTS = Object.freeze([
  1, 1.25, 1.5, 1.75, 2, 2.5, 3
]);
const KP_FINITE_PRODUCT_RELATION_MARGIN_PX = 2;

export function planKpFiniteProductRelationClearingTransit(input: {
  readonly id: string;
  readonly relationOccurrenceId: string;
  readonly startPaintRect: KpStageRelativeRect;
  readonly endPaintRect: KpStageRelativeRect;
  readonly relationInkRect: KpStageRelativeRect;
}): KpEquationMotionPathPlan {
  const start = center(input.startPaintRect);
  const end = center(input.endPaintRect);
  const moverRadius = Math.hypot(
    Math.max(input.startPaintRect.width, input.endPaintRect.width),
    Math.max(input.startPaintRect.height, input.endPaintRect.height)
  ) / 2;
  const minimumClearance = Math.max(
    14,
    Math.abs(end.x - start.x) * 0.18,
    input.relationInkRect.height + moverRadius * 2 +
      KP_FINITE_PRODUCT_RELATION_MARGIN_PX
  );
  for (const multiplier of KP_FINITE_PRODUCT_ROUTE_CLEARANCE_ATTEMPTS) {
    const plan = planKpEquationMotionPathBetweenPoints({
      id: input.id,
      relationRecordId: input.relationOccurrenceId,
      start,
      end,
      obstacles: [input.relationInkRect],
      moverRadius,
      variants: ["arc-above", "arc-below"],
      clearance: minimumClearance * multiplier
    });
    if (plan.selected.collisionCount === 0) return plan;
  }
  throw new Error(
    `Finite-product transit ${input.id} cannot clear retained relation ` +
    `${input.relationOccurrenceId}.`
  );
}

function center(rect: KpStageRelativeRect): {
  readonly x: number;
  readonly y: number;
} {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}
