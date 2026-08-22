import {
  kpCanonicalFiniteProductExpansionPresentationPlan,
  type KpFiniteProductExpansionPresentationPlan,
  type KpFiniteProductPresentationWindow
} from "./finite-product-expansion-presentation-plan.ts";

export type KpFiniteProductMotionMode = "full" | "reduced" | "static";

export interface KpFiniteProductExpansionMotionFrame {
  readonly kind: "finite-product-expansion-motion-frame";
  readonly progress: number;
  readonly mode: KpFiniteProductMotionMode;
  readonly phase: "source-hold" | "ordered-generation" | "target-hold";
  readonly endpoint: "source" | "transition" | "target";
  readonly factors: readonly Readonly<{
    ordinal: number;
    factorTransitProgress: number;
    factorPresence: number;
    referencePresence: number;
  }>[];
}

export function sampleKpFiniteProductExpansionMotion(
  progress: number,
  mode: KpFiniteProductMotionMode = "full",
  plan: KpFiniteProductExpansionPresentationPlan =
    kpCanonicalFiniteProductExpansionPresentationPlan
): KpFiniteProductExpansionMotionFrame {
  const boundedProgress = bounded(progress);
  if (mode === "static") {
    const target = boundedProgress >= 0.5;
    return frame(boundedProgress, mode,
      target ? "target-hold" : "source-hold",
      target ? "target" : "source",
      plan.factors.map(({ ordinal }) => ({
        ordinal,
        factorTransitProgress: target ? 1 : 0,
        factorPresence: target ? 1 : 0,
        referencePresence: target ? 1 : 0
      })));
  }
  const factors = plan.factors.map((factor) => {
    const transit = sampleWindow(factor.factorTransitWindow, boundedProgress);
    return {
      ordinal: factor.ordinal,
      factorTransitProgress: transit,
      factorPresence: transit === 0
        ? factor.ordinal === 0 && boundedProgress > 0 ? 1 : 0
        : 1,
      referencePresence: sampleWindow(
        factor.referenceReceptionWindow,
        boundedProgress
      )
    };
  });
  return frame(
    boundedProgress,
    mode,
    boundedProgress <= plan.sourceHoldWindow.end
      ? "source-hold"
      : boundedProgress < plan.targetHoldWindow.start
        ? "ordered-generation"
        : "target-hold",
    boundedProgress === 0
      ? "source"
      : boundedProgress === 1 ? "target" : "transition",
    factors
  );
}

function frame(
  progress: number,
  mode: KpFiniteProductMotionMode,
  phase: KpFiniteProductExpansionMotionFrame["phase"],
  endpoint: KpFiniteProductExpansionMotionFrame["endpoint"],
  factors: KpFiniteProductExpansionMotionFrame["factors"]
): KpFiniteProductExpansionMotionFrame {
  return Object.freeze({
    kind: "finite-product-expansion-motion-frame" as const,
    progress,
    mode,
    phase,
    endpoint,
    factors: Object.freeze(factors.map((factor) => Object.freeze(factor)))
  });
}

function sampleWindow(
  motionWindow: KpFiniteProductPresentationWindow,
  progress: number
): number {
  const local = Math.max(0, Math.min(1,
    (progress - motionWindow.start) /
    (motionWindow.end - motionWindow.start)
  ));
  return local * local * (3 - 2 * local);
}

function bounded(progress: number): number {
  if (!Number.isFinite(progress)) {
    throw new Error("Finite-product motion progress must be finite.");
  }
  return Math.max(0, Math.min(1, progress));
}
