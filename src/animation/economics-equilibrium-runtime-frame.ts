import {
  sampleKpSupplyDemandEquilibriumFrame,
  type KpSupplyDemandEquilibriumFrameV1
} from "../../domains/economics/supply-demand-equilibrium-frame.ts";
import {
  createKpSupplyDemandEquilibriumModel,
  type KpSupplyDemandEquilibriumModelV1
} from "../../domains/economics/supply-demand-equilibrium-model.ts";
import type { KpAnimationAsset } from "./asset.ts";
import {
  economicsEquilibriumAnimationId
} from "./economics-equilibrium-adapter.ts";
import type { KpAnimationRuntimeFrame } from "./runtime-sampler.ts";

export type KpEconomicsEquilibriumChoreographyStage =
  | "establish"
  | "shift"
  | "handoff"
  | "settle";

export interface KpEconomicsEquilibriumRuntimeFrame {
  readonly id: string;
  readonly kind: "economics-equilibrium-runtime-frame";
  readonly animationId: string;
  readonly runtimeFrameId: string;
  readonly renderTargetId: string;
  readonly progress: number;
  readonly presentationProgress: number;
  readonly modelProgress: number;
  readonly stage: KpEconomicsEquilibriumChoreographyStage;
  readonly initialDemandReferenceOpacity: number;
  readonly initialEquilibriumReferenceOpacity: number;
  readonly semanticFrame: KpSupplyDemandEquilibriumFrameV1;
}

export function sampleKpEconomicsEquilibriumRuntimeFrame(input: {
  readonly animation: KpAnimationAsset;
  readonly runtimeFrame: KpAnimationRuntimeFrame;
  readonly model?: KpSupplyDemandEquilibriumModelV1 | undefined;
}): KpEconomicsEquilibriumRuntimeFrame {
  if (input.animation.id !== economicsEquilibriumAnimationId) {
    throw new Error(
      `Animation ${input.animation.id} is not the economics equilibrium exemplar.`
    );
  }
  const target = input.runtimeFrame.activeRenderTargets.find(
    (candidate) =>
      candidate.kind === "graph" &&
      input.animation.renderTargets.find(({ id }) => id === candidate.id)
        ?.metadata?.["graphMotionKind"] ===
        "economics-supply-demand-equilibrium-shift"
  );
  if (target === undefined) {
    throw new Error(
      `Runtime frame ${input.runtimeFrame.id} does not activate the economics graph target.`
    );
  }

  const progress = clamp01(input.runtimeFrame.clock.progress);
  // Quantization removes the tiny complement drift from `1 - progress`, so
  // direct forward seek and the matching rewind seek sample identical paint.
  const presentationProgress = quantize01(
    input.runtimeFrame.clock.direction === "forward" ? progress : 1 - progress
  );
  const choreography = sampleChoreography(presentationProgress);
  const model = input.model ?? createKpSupplyDemandEquilibriumModel();
  const semanticFrame = sampleKpSupplyDemandEquilibriumFrame({
    model,
    progress: decimalExact(choreography.modelProgress)
  });

  return Object.freeze({
    id: `economics-frame.${input.runtimeFrame.id}`,
    kind: "economics-equilibrium-runtime-frame",
    animationId: input.animation.id,
    runtimeFrameId: input.runtimeFrame.id,
    renderTargetId: target.id,
    progress,
    presentationProgress,
    modelProgress: choreography.modelProgress,
    stage: choreography.stage,
    initialDemandReferenceOpacity:
      choreography.initialDemandReferenceOpacity,
    initialEquilibriumReferenceOpacity:
      choreography.initialEquilibriumReferenceOpacity,
    semanticFrame
  });
}

function sampleChoreography(progress: number): {
  readonly stage: KpEconomicsEquilibriumChoreographyStage;
  readonly modelProgress: number;
  readonly initialDemandReferenceOpacity: number;
  readonly initialEquilibriumReferenceOpacity: number;
} {
  if (progress <= 0.16) {
    return {
      stage: "establish",
      modelProgress: 0,
      initialDemandReferenceOpacity: 0,
      initialEquilibriumReferenceOpacity: 0
    };
  }
  if (progress <= 0.72) {
    const local = (progress - 0.16) / 0.56;
    const eased = smoothstep(local);
    return {
      stage: "shift",
      modelProgress: eased,
      initialDemandReferenceOpacity: 0.24 * eased,
      initialEquilibriumReferenceOpacity: 0.62 * eased
    };
  }
  if (progress <= 0.9) {
    const local = (progress - 0.72) / 0.18;
    return {
      stage: "handoff",
      modelProgress: 1,
      initialDemandReferenceOpacity: 0.24,
      initialEquilibriumReferenceOpacity: 0.62 - 0.34 * smoothstep(local)
    };
  }
  return {
    stage: "settle",
    modelProgress: 1,
    initialDemandReferenceOpacity: 0.24,
    initialEquilibriumReferenceOpacity: 0.28
  };
}

function decimalExact(value: number) {
  const denominator = 1_000_000;
  const numerator = Math.round(clamp01(value) * denominator);
  return {
    numerator: String(numerator),
    denominator: String(denominator)
  };
}

function smoothstep(value: number): number {
  const bounded = clamp01(value);
  return bounded * bounded * (3 - 2 * bounded);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function quantize01(value: number): number {
  return Math.round(clamp01(value) * 1_000_000) / 1_000_000;
}
