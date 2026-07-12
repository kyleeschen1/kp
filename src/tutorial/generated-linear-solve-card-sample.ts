import { sampleKpBehaviorAtProgress } from "../semantic/asset-behavior.ts";
import {
  createGeneratedLinearSolveTutorialFixture,
  getGeneratedLinearSolveTutorialFixtureSpec,
  type GeneratedLinearSolveTutorialFixture,
  type GeneratedLinearSolveTutorialFixtureSpec
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

export interface GeneratedLinearSolveTutorialCardSample
  extends LinearSolveTutorialCardSample {
  readonly fixtureId: string;
}

export function generatedLinearSolveTutorialCardSampleId(
  fixtureId: string
): string {
  return `tutorial.${fixtureId}.card.live-sample`;
}

export function createGeneratedLinearSolveTutorialCardSample(
  fixtureOrId: GeneratedLinearSolveTutorialFixtureSpec | string
): GeneratedLinearSolveTutorialCardSample {
  const fixture = createFixture(fixtureOrId);
  const cardSampler = createLinearSolveTutorialCardFrameSampler();
  const semanticEquationFrameBehavior = createLinearSolveEquationFrameBehavior(
    generatedFixtureAsLinearSolveAsset(fixture)
  );
  const equationAdapter = createKpTutorialEquationFrameAdapter(cardSampler, {
    semanticFrameSampler: {
      sample: (progress) =>
        sampleKpBehaviorAtProgress(semanticEquationFrameBehavior, progress)
    }
  });
  const graphAdapter = createKpTutorialGraphFrameAdapter(cardSampler);

  return {
    id: generatedLinearSolveTutorialCardSampleId(fixture.id),
    title: fixture.title,
    fixtureId: fixture.id,
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

function createFixture(
  fixtureOrId: GeneratedLinearSolveTutorialFixtureSpec | string
): GeneratedLinearSolveTutorialFixture {
  if (typeof fixtureOrId !== "string") {
    return createGeneratedLinearSolveTutorialFixture(fixtureOrId);
  }

  const spec = getGeneratedLinearSolveTutorialFixtureSpec(fixtureOrId);

  if (spec === undefined) {
    throw new Error(`Unknown generated linear-solve fixture: ${fixtureOrId}`);
  }

  return createGeneratedLinearSolveTutorialFixture(spec);
}

function generatedFixtureAsLinearSolveAsset(
  fixture: GeneratedLinearSolveTutorialFixture
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
