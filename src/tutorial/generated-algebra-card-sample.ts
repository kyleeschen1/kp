import { sampleKpBehaviorAtProgress } from "../semantic/asset-behavior.ts";
import {
  createGeneratedAlgebraTutorialFixture,
  listGeneratedAlgebraTutorialFixtureSpecs,
  type GeneratedAlgebraTutorialFixture,
  type GeneratedAlgebraTutorialFixtureSpec
} from "../semantic/generated-algebra-tutorial-fixture.ts";
import {
  createLinearSolveEquationFrameBehavior
} from "../semantic/linear-solve-equation-frame-interpreter.ts";
import type { LinearSolveKpAsset } from "../semantic/linear-solve-asset.ts";
import {
  createKpTutorialEquationFrameAdapter
} from "./equation-frame-adapter.ts";
import {
  createKpTutorialGraphFrameAdapter
} from "./graph-frame-adapter.ts";
import {
  createLinearSolveTutorialCardFrameSampler
} from "./card-frame-sampler.ts";
import type {
  LinearSolveTutorialCardSample,
  LinearSolveTutorialCardSampleFrame
} from "./linear-solve-card-sample.ts";

export interface GeneratedAlgebraTutorialCardSample
  extends LinearSolveTutorialCardSample {
  readonly fixtureId: string;
  readonly fixtureFamilyId: GeneratedAlgebraTutorialFixture["familyId"];
}

export function generatedAlgebraTutorialCardSampleId(
  fixtureId: string
): string {
  return `tutorial.${fixtureId}.card.live-sample`;
}

export function createGeneratedAlgebraTutorialCardSample(
  fixtureOrId: GeneratedAlgebraTutorialFixtureSpec | string
): GeneratedAlgebraTutorialCardSample {
  const fixture = createGeneratedAlgebraTutorialFixture(fixtureOrId);
  const cardSampler = createLinearSolveTutorialCardFrameSampler();
  const semanticEquationFrameBehavior = createLinearSolveEquationFrameBehavior(
    generatedAlgebraFixtureAsLinearSolveAsset(fixture)
  );
  const equationAdapter = createKpTutorialEquationFrameAdapter(cardSampler, {
    semanticFrameSampler: {
      sample: (progress) =>
        sampleKpBehaviorAtProgress(semanticEquationFrameBehavior, progress)
    }
  });
  const graphAdapter = createKpTutorialGraphFrameAdapter(cardSampler);

  return {
    id: generatedAlgebraTutorialCardSampleId(fixture.id),
    title: fixture.title,
    fixtureId: fixture.id,
    fixtureFamilyId: fixture.familyId,
    manifestId: cardSampler.manifestId,
    cardSampler,
    equationAdapter,
    graphAdapter,
    diagnostics: cardSampler.diagnostics,
    sample(progress): LinearSolveTutorialCardSampleFrame {
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

export function createGeneratedAlgebraTutorialCardSamples():
  readonly GeneratedAlgebraTutorialCardSample[] {
  return listGeneratedAlgebraTutorialFixtureSpecs().map((spec) =>
    createGeneratedAlgebraTutorialCardSample(spec)
  );
}

function generatedAlgebraFixtureAsLinearSolveAsset(
  fixture: GeneratedAlgebraTutorialFixture
): LinearSolveKpAsset {
  return {
    sourceAnimationId: "linear-equation-solve-x",
    bundle: fixture.bundle,
    transformations: fixture.transformations,
    diagram: fixture.diagram,
    drillDownHooks: fixture.drillDownHooks,
    flashcards: fixture.flashcards
  };
}
