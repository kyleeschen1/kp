import {
  createKpBehavior,
  type KpBehavior
} from "../semantic/asset-behavior.ts";
import {
  createLinearSolveTutorialCardSample,
  type LinearSolveTutorialCardSampleFrame
} from "./linear-solve-card-sample.ts";

export type LinearSolveKpBehavior =
  KpBehavior<LinearSolveTutorialCardSampleFrame>;

/** The wrapper belongs to the experience layer because its frame is a tutorial projection. */
export function createLinearSolveKpBehavior(): LinearSolveKpBehavior {
  const sample = createLinearSolveTutorialCardSample();

  return createKpBehavior({
    id: "behavior.linear-solve.card",
    durationMs: sample.cardSampler.parentTimeline.durationMs,
    sample: ({ progress }) => sample.sample(progress)
  });
}
