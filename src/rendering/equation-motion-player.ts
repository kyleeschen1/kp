import type {
  KpAnimationProgressPlayer,
  KpAnimationRenderer,
  KpAnimationStepOptions
} from "../animation/kernel.ts";
import { animationStepProgresses } from "../animation/kernel.ts";
import type { EquationMotionPlan } from "./equation-motion-plan.ts";
import {
  createEquationMotionSampler,
  type EquationMotionFrame
} from "./equation-motion-sampler.ts";

export type EquationMotionPlayerRenderer =
  KpAnimationRenderer<EquationMotionFrame>;

export type EquationMotionStepOptions = KpAnimationStepOptions;

export type EquationMotionPlayer = KpAnimationProgressPlayer;

export function createEquationMotionPlayer(
  plan: EquationMotionPlan,
  renderer: EquationMotionPlayerRenderer
): EquationMotionPlayer {
  const sampler = createEquationMotionSampler(plan);
  let progress = 0;

  const setProgress = (nextProgress: number): void => {
    const frame = sampler.sample(nextProgress);
    renderer.render(frame);
    progress = frame.progress;
  };

  const stepTo = (
    targetProgress: number,
    options: EquationMotionStepOptions
  ): void => {
    const targetFrame = sampler.sample(targetProgress);
    for (const nextProgress of animationStepProgresses({
      startProgress: progress,
      targetProgress: targetFrame.progress,
      steps: options.steps,
      label: "Equation motion"
    })) {
      setProgress(nextProgress);
    }
  };

  return {
    setProgress,
    playTo: stepTo,
    rewindTo: stepTo,
    getProgress: () => progress
  };
}
