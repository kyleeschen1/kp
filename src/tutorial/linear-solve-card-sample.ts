import type { KpAnimationSampler } from "../animation/kernel.ts";
import {
  createLinearSolveTutorialCardFrameSampler,
  type KpTutorialCardFrame,
  type KpTutorialCardFrameSampler,
  type KpTutorialCardFrameSamplerDiagnostic
} from "./card-frame-sampler.ts";
import {
  createKpTutorialEquationFrameAdapter,
  type KpTutorialEquationFrame,
  type KpTutorialEquationFrameAdapter
} from "./equation-frame-adapter.ts";
import {
  createKpTutorialGraphFrameAdapter,
  type KpTutorialGraphFrame,
  type KpTutorialGraphFrameAdapter
} from "./graph-frame-adapter.ts";

export interface LinearSolveTutorialCardSample
  extends KpAnimationSampler<LinearSolveTutorialCardSampleFrame> {
  readonly id: "tutorial.linear-solve.card.live-sample";
  readonly manifestId: string;
  readonly cardSampler: KpTutorialCardFrameSampler;
  readonly equationAdapter: KpTutorialEquationFrameAdapter;
  readonly graphAdapter: KpTutorialGraphFrameAdapter;
  readonly diagnostics: readonly KpTutorialCardFrameSamplerDiagnostic[];
}

export interface LinearSolveTutorialCardSampleFrame {
  readonly progress: number;
  readonly cardFrame: KpTutorialCardFrame;
  readonly equationFrame: KpTutorialEquationFrame;
  readonly graphFrame: KpTutorialGraphFrame;
  readonly diagnostics: readonly KpTutorialCardFrameSamplerDiagnostic[];
}

export function createLinearSolveTutorialCardSample(): LinearSolveTutorialCardSample {
  const cardSampler = createLinearSolveTutorialCardFrameSampler();
  const equationAdapter = createKpTutorialEquationFrameAdapter(cardSampler);
  const graphAdapter = createKpTutorialGraphFrameAdapter(cardSampler);

  return {
    id: "tutorial.linear-solve.card.live-sample",
    manifestId: cardSampler.manifestId,
    cardSampler,
    equationAdapter,
    graphAdapter,
    diagnostics: cardSampler.diagnostics,
    sample(progress) {
      const cardFrame = cardSampler.sample(progress);

      return {
        progress: cardFrame.progress,
        cardFrame,
        equationFrame: equationAdapter.sample(cardFrame.progress),
        graphFrame: graphAdapter.sample(cardFrame.progress),
        diagnostics: cardSampler.diagnostics
      };
    }
  };
}
