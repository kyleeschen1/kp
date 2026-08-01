import type { ExactRationalDto } from "../../protocols/public-api.ts";
import {
  sampleKpConstantForceWorkEnergyFrame,
  type KpConstantForceWorkEnergyFrameV1
} from "../../domains/physics/constant-force-work-energy-frame.ts";
import {
  createKpConstantForceWorkEnergyModel,
  type KpConstantForceWorkEnergyModelV1
} from "../../domains/physics/constant-force-work-energy-model.ts";
import type { KpAnimationAsset } from "./asset.ts";
import { constantForceWorkEnergyAnimationId } from "./constant-force-work-energy-adapter.ts";
import type { KpAnimationRuntimeFrame } from "./runtime-sampler.ts";
import {
  easeKpSynchronizedModelProgress,
  exactKpSynchronizedModelProgress,
  sampleKpSynchronizedModelProjectionProgress
} from "./synchronized-model-projection.ts";

export type KpConstantForceWorkEnergyChoreographyStage =
  | "establish"
  | "accumulate"
  | "connect"
  | "settle";

export interface KpConstantForceWorkEnergyRuntimeFrame {
  readonly id: string;
  readonly kind: "constant-force-work-energy-runtime-frame";
  readonly animationId: string;
  readonly runtimeFrameId: string;
  readonly renderTargetId: string;
  readonly progress: number;
  readonly presentationProgress: number;
  readonly modelProgress: number;
  readonly stage: KpConstantForceWorkEnergyChoreographyStage;
  readonly workAreaOpacity: number;
  readonly forceArrowEmphasis: number;
  readonly unitIdentityOpacity: number;
  readonly semanticFrame: KpConstantForceWorkEnergyFrameV1;
}

export function sampleKpConstantForceWorkEnergyRuntimeFrame(input: {
  readonly animation: KpAnimationAsset;
  readonly runtimeFrame: KpAnimationRuntimeFrame;
  readonly model?: KpConstantForceWorkEnergyModelV1 | undefined;
}): KpConstantForceWorkEnergyRuntimeFrame {
  if (input.animation.id !== constantForceWorkEnergyAnimationId) {
    throw new Error(
      `Animation ${input.animation.id} is not the constant-force work-energy exemplar.`
    );
  }
  const target = input.runtimeFrame.activeRenderTargets.find(
    (candidate) =>
      candidate.kind === "graph" &&
      input.animation.renderTargets.find(({ id }) => id === candidate.id)
        ?.metadata?.["graphMotionKind"] ===
        "physics-constant-force-work-energy"
  );
  if (target === undefined) {
    throw new Error(
      `Runtime frame ${input.runtimeFrame.id} does not activate the physics graph target.`
    );
  }

  const { progress, presentationProgress } =
    sampleKpSynchronizedModelProjectionProgress(input.runtimeFrame.clock);
  const choreography = sampleChoreography(presentationProgress);
  const model = input.model ?? physicsModelFromAnimation(input.animation);
  const semanticFrame = sampleKpConstantForceWorkEnergyFrame({
    model,
    progress: exactKpSynchronizedModelProgress(choreography.modelProgress)
  });

  return Object.freeze({
    id: `physics-frame.${input.runtimeFrame.id}`,
    kind: "constant-force-work-energy-runtime-frame",
    animationId: input.animation.id,
    runtimeFrameId: input.runtimeFrame.id,
    renderTargetId: target.id,
    progress,
    presentationProgress,
    modelProgress: choreography.modelProgress,
    stage: choreography.stage,
    workAreaOpacity: choreography.workAreaOpacity,
    forceArrowEmphasis: choreography.forceArrowEmphasis,
    unitIdentityOpacity: choreography.unitIdentityOpacity,
    semanticFrame
  });
}

function physicsModelFromAnimation(
  animation: KpAnimationAsset
): KpConstantForceWorkEnergyModelV1 {
  const target = animation.renderTargets.find(
    ({ metadata }) =>
      metadata?.["graphMotionKind"] === "physics-constant-force-work-energy"
  );
  const modelObjectId = target?.metadata?.["modelObjectId"];
  const object = animation.bundle.objects.find(({ id }) => id === modelObjectId);
  const value = object?.value as
    | Partial<KpConstantForceWorkEnergyModelV1>
    | undefined;
  if (
    value?.input === undefined ||
    value.parameterState?.netForceMagnitude === undefined
  ) {
    throw new Error(
      `Animation ${animation.id} does not contain its exact physics model.`
    );
  }
  return createKpConstantForceWorkEnergyModel({
    input: value.input,
    netForceMagnitude: value.parameterState.netForceMagnitude as ExactRationalDto
  });
}

function sampleChoreography(progress: number): {
  readonly stage: KpConstantForceWorkEnergyChoreographyStage;
  readonly modelProgress: number;
  readonly workAreaOpacity: number;
  readonly forceArrowEmphasis: number;
  readonly unitIdentityOpacity: number;
} {
  if (progress <= 0.14) {
    return {
      stage: "establish",
      modelProgress: 0,
      workAreaOpacity: 0.18,
      forceArrowEmphasis: 0.76,
      unitIdentityOpacity: 0.12
    };
  }
  if (progress <= 0.78) {
    const local = (progress - 0.14) / 0.64;
    const eased = easeKpSynchronizedModelProgress(local);
    return {
      stage: "accumulate",
      modelProgress: eased,
      workAreaOpacity: 0.22 + 0.34 * eased,
      forceArrowEmphasis: 0.82 + 0.18 * eased,
      unitIdentityOpacity: 0.12
    };
  }
  if (progress <= 0.92) {
    const local = (progress - 0.78) / 0.14;
    return {
      stage: "connect",
      modelProgress: 1,
      workAreaOpacity: 0.56,
      forceArrowEmphasis: 1,
      unitIdentityOpacity:
        0.15 + 0.65 * easeKpSynchronizedModelProgress(local)
    };
  }
  return {
    stage: "settle",
    modelProgress: 1,
    workAreaOpacity: 0.52,
    forceArrowEmphasis: 0.92,
    unitIdentityOpacity: 1
  };
}
