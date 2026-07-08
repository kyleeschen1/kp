import type { EquationMotionPlan } from "./equation-motion-plan.ts";
import {
  sampleEquationMotion,
  type EquationMotionFrame
} from "./equation-motion-sampler.ts";

export interface EquationMotionPlayerRenderer {
  render(frame: EquationMotionFrame): void;
}

export interface EquationMotionStepOptions {
  readonly steps: number;
}

export interface EquationMotionPlayer {
  setProgress(nextProgress: number): void;
  playTo(targetProgress: number, options: EquationMotionStepOptions): void;
  rewindTo(targetProgress: number, options: EquationMotionStepOptions): void;
  getProgress(): number;
}

export function createEquationMotionPlayer(
  plan: EquationMotionPlan,
  renderer: EquationMotionPlayerRenderer
): EquationMotionPlayer {
  let progress = 0;

  const setProgress = (nextProgress: number): void => {
    const frame = sampleEquationMotion(plan, nextProgress);
    renderer.render(frame);
    progress = frame.progress;
  };

  const stepTo = (
    targetProgress: number,
    options: EquationMotionStepOptions
  ): void => {
    assertPositiveIntegerSteps(options.steps);

    const targetFrame = sampleEquationMotion(plan, targetProgress);
    const startProgress = progress;
    const delta = targetFrame.progress - startProgress;

    for (let step = 1; step < options.steps; step += 1) {
      setProgress(startProgress + (delta * step) / options.steps);
    }
    setProgress(targetFrame.progress);
  };

  return {
    setProgress,
    playTo: stepTo,
    rewindTo: stepTo,
    getProgress: () => progress
  };
}

function assertPositiveIntegerSteps(steps: number): void {
  if (!Number.isInteger(steps) || steps <= 0) {
    throw new Error("Equation motion steps must be a positive integer.");
  }
}
