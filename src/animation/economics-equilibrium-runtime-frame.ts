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
import type { ExactRationalDto } from "../../protocols/public-api.ts";
import {
  easeKpSynchronizedModelProgress,
  exactKpSynchronizedModelProgress,
  sampleKpSynchronizedModelProjectionProgress
} from "./synchronized-model-projection.ts";

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
  readonly initialEquilibrium: {
    readonly quantity: ExactRationalDto;
    readonly price: ExactRationalDto;
  };
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

  const { progress, presentationProgress } =
    sampleKpSynchronizedModelProjectionProgress(input.runtimeFrame.clock);
  const choreography = sampleChoreography(presentationProgress);
  const model = input.model ?? economicsModelFromAnimation(input.animation);
  const semanticFrame = sampleKpSupplyDemandEquilibriumFrame({
    model,
    progress: exactKpSynchronizedModelProgress(choreography.modelProgress)
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
    initialEquilibrium: Object.freeze({
      quantity: model.states.before.equilibrium.quantity,
      price: model.states.before.equilibrium.price
    }),
    semanticFrame
  });
}

function economicsModelFromAnimation(
  animation: KpAnimationAsset
): KpSupplyDemandEquilibriumModelV1 {
  const target = animation.renderTargets.find(
    ({ metadata }) =>
      metadata?.["graphMotionKind"] ===
      "economics-supply-demand-equilibrium-shift"
  );
  const modelObjectId = target?.metadata?.["modelObjectId"];
  const object = animation.bundle.objects.find(
    ({ id }) => id === modelObjectId
  );
  const value = object?.value as
    | Partial<KpSupplyDemandEquilibriumModelV1>
    | undefined;
  if (value?.input === undefined) {
    throw new Error(
      `Animation ${animation.id} does not contain its exact economics model.`
    );
  }
  // Reconstructing validates parameterized asset state instead of trusting a
  // renderer-side cache or mutable object payload.
  return createKpSupplyDemandEquilibriumModel(value.input);
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
    const eased = easeKpSynchronizedModelProgress(local);
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
      initialEquilibriumReferenceOpacity:
        0.62 - 0.34 * easeKpSynchronizedModelProgress(local)
    };
  }
  return {
    stage: "settle",
    modelProgress: 1,
    initialDemandReferenceOpacity: 0.24,
    initialEquilibriumReferenceOpacity: 0.28
  };
}
