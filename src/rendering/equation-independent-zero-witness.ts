import type { KpMeasuredEquationTransitionGeometry } from "./equation-motion-dom.ts";
import type { KpEquationTokenMotionPose } from "./semantic-equation-token-renderer.ts";

export interface KpIndependentZeroWitnessPlan {
  readonly kind: "independent-zero-witness-plan";
  readonly id: string;
  readonly relationRecordId: string;
  readonly latex: "+0";
  readonly contactPoint: { readonly x: number; readonly y: number };
}

export interface KpIndependentZeroWitnessFrame {
  readonly kind: "independent-zero-witness-frame";
  readonly planId: string;
  readonly phase: "hidden" | "enter" | "dwell" | "exit";
  readonly readable: boolean;
  readonly pose: KpEquationTokenMotionPose;
}

export function createKpIndependentZeroWitnessPlan(
  geometry: KpMeasuredEquationTransitionGeometry
): KpIndependentZeroWitnessPlan | undefined {
  if (geometry.zeroWitnessPresentationRecipe !== "independent-zero-v1") {
    return undefined;
  }
  if (geometry.linearRearrangementKind !== "cancel-additive-inverses") {
    return undefined;
  }
  const cancellation = geometry.relations.find((relation) =>
    relation.lifecycle === "cancel" && relation.source !== undefined
  );
  if (cancellation?.source === undefined) {
    throw new Error(
      `Independent zero witness ${geometry.transitionId} requires a measured cancellation source.`
    );
  }
  const bounds = cancellation.source.bounds;
  return Object.freeze({
    kind: "independent-zero-witness-plan",
    id: `independent-zero.${geometry.transitionId}.${cancellation.recordId}`,
    relationRecordId: cancellation.recordId,
    latex: "+0",
    contactPoint: Object.freeze({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2
    })
  });
}

export function sampleKpIndependentZeroWitness(
  plan: KpIndependentZeroWitnessPlan,
  progress: number
): KpIndependentZeroWitnessFrame {
  const p = clamp01(progress);
  const enter = smooth(windowProgress(p, 0.8, 0.84));
  const exit = smooth(windowProgress(p, 0.89, 0.94));
  const opacity = enter * (1 - exit);
  const phase = enter === 0
    ? "hidden" as const
    : enter < 1
      ? "enter" as const
      : exit === 0
        ? "dwell" as const
        : "exit" as const;
  return Object.freeze({
    kind: "independent-zero-witness-frame",
    planId: plan.id,
    phase,
    readable: opacity >= 0.85,
    pose: Object.freeze({
      opacity,
      x: 0,
      y: 3 * (1 - enter),
      scale: 0.84 + 0.16 * enter - 0.06 * exit
    })
  });
}

function windowProgress(progress: number, start: number, end: number): number {
  return clamp01((progress - start) / (end - start));
}

function smooth(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
