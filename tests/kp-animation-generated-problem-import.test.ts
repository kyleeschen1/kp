import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw
} from "../src/animation/asset.ts";
import {
  createKpAnimationFlashcardProjections
} from "../src/animation/flashcard-projection.ts";
import {
  createGeneratedProblemAnimationAsset
} from "../src/animation/generated-problem-import.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  createGeneratedAlgebraTutorialFixture
} from "../src/semantic/generated-algebra-tutorial-fixture.ts";
import {
  createGeneratedCalculusProblemFixture
} from "../src/semantic/generated-calculus-problem-fixture.ts";
import {
  createGeneratedLinearAlgebraProblemFixture
} from "../src/semantic/generated-linear-algebra-problem-fixture.ts";

test("createGeneratedProblemAnimationAsset imports generated solution steps into an AnimationAsset", () => {
  const fixture = createGeneratedAlgebraTutorialFixture(
    "generated.linear-solve.y-plus-5"
  );
  const animation = createGeneratedProblemAnimationAsset(fixture);

  assert.equal(animation.id, "animation.generated.linear-solve.y-plus-5");
  assert.equal(animation.bundle.id, "asset.generated.linear-solve.y-plus-5");
  assert.deepEqual(
    animation.transformations.map((transformation) => transformation.id),
    fixture.transformations.map((transformation) => transformation.id)
  );
  assert.deepEqual(animation.timeline, {
    id: "timeline.generated.linear-solve.y-plus-5.shared",
    durationMs: 2400,
    beatCount: 50
  });
  assert.deepEqual(animation.metadata, {
    generatedProblemImport: true,
    sourceFixtureId: "generated.linear-solve.y-plus-5",
    sourceFixtureFamilyId: "generated.linear-solve",
    sourceTraceId: "trace.generated.linear-solve.y-plus-5"
  });
  assert.equal(checkKpAnimationAssetReferenceClosure(animation).passed, true);
  assert.equal(checkKpAnimationAssetSeekRewindLaw(animation).passed, true);
  assert.equal(animation.timeline?.durationMs, 2_400);

  const frame = sampleKpAnimationRuntimeFrame({
    animation,
    progress: 0.5
  });

  assert.deepEqual(frame.activeTransformationIds, [
    "transform.generated.linear-solve.y-plus-5.cancel-additive-inverse"
  ]);

  const projections = createKpAnimationFlashcardProjections({
    animation,
    cards: fixture.flashcards
  });

  assert.equal(projections.length, fixture.flashcards.length);
  assert.deepEqual(
    projections.flatMap((projection) => projection.diagnostics),
    []
  );
});

test("createGeneratedProblemAnimationAsset imports generated calculus derivative steps", () => {
  const fixture = createGeneratedCalculusProblemFixture(
    "generated.calculus.derivative.power-rule-x-cubed"
  );
  const animation = createGeneratedProblemAnimationAsset(fixture);

  assert.equal(
    animation.id,
    "animation.generated.calculus.derivative.power-rule-x-cubed"
  );
  assert.equal(
    animation.bundle.id,
    "asset.generated.calculus.derivative.power-rule-x-cubed"
  );
  assert.deepEqual(
    animation.transformations.map((transformation) => transformation.id),
    fixture.transformations.map((transformation) => transformation.id)
  );
  const dashboard = animation.dashboard;
  assert.ok(dashboard);
  assert.deepEqual(dashboard.tags, [
    "animation",
    "generated-problem",
    "generated.calculus.derivative"
  ]);
  assert.deepEqual(animation.metadata, {
    generatedProblemImport: true,
    sourceFixtureId: "generated.calculus.derivative.power-rule-x-cubed",
    sourceFixtureFamilyId: "generated.calculus.derivative",
    sourceTraceId: "trace.generated.calculus.derivative.power-rule-x-cubed"
  });
  assert.equal(checkKpAnimationAssetReferenceClosure(animation).passed, true);
  assert.equal(checkKpAnimationAssetSeekRewindLaw(animation).passed, true);

  const frame = sampleKpAnimationRuntimeFrame({
    animation,
    progress: 0.25
  });

  assert.deepEqual(frame.activeTransformationIds, [
    "transform.generated.calculus.derivative.power-rule-x-cubed.apply-power-rule"
  ]);
  assert.deepEqual(sampleKpAnimationRuntimeFrame({
    animation,
    progress: 0.75
  }).activeTransformationIds, [
    "transform.generated.calculus.derivative.power-rule-x-cubed.evaluate-exponent-decrement"
  ]);

  const projections = createKpAnimationFlashcardProjections({
    animation,
    cards: fixture.flashcards
  });

  assert.equal(projections.length, fixture.flashcards.length);
  assert.deepEqual(
    projections.flatMap((projection) => projection.diagnostics),
    []
  );
});

test("createGeneratedProblemAnimationAsset imports generated linear algebra matrix-vector steps", () => {
  const fixture = createGeneratedLinearAlgebraProblemFixture(
    "generated.linear-algebra.matrix-vector.two-by-two"
  );
  const animation = createGeneratedProblemAnimationAsset(fixture);

  assert.equal(
    animation.id,
    "animation.generated.linear-algebra.matrix-vector.two-by-two"
  );
  assert.equal(
    animation.bundle.id,
    "asset.generated.linear-algebra.matrix-vector.two-by-two"
  );
  assert.deepEqual(
    animation.transformations.map((transformation) => transformation.id),
    fixture.transformations.map((transformation) => transformation.id)
  );
  const dashboard = animation.dashboard;
  assert.ok(dashboard);
  assert.deepEqual(dashboard.tags, [
    "animation",
    "generated-problem",
    "generated.linear-algebra.matrix-vector"
  ]);
  assert.deepEqual(animation.metadata, {
    generatedProblemImport: true,
    sourceFixtureId: "generated.linear-algebra.matrix-vector.two-by-two",
    sourceFixtureFamilyId: "generated.linear-algebra.matrix-vector",
    sourceTraceId: "trace.generated.linear-algebra.matrix-vector.two-by-two"
  });
  assert.equal(checkKpAnimationAssetReferenceClosure(animation).passed, true);
  assert.equal(checkKpAnimationAssetSeekRewindLaw(animation).passed, true);

  const frame = sampleKpAnimationRuntimeFrame({
    animation,
    progress: 0.5
  });

  assert.deepEqual(frame.activeTransformationIds, [
    "transform.generated.linear-algebra.matrix-vector.two-by-two.multiply-matrix-vector"
  ]);

  const projections = createKpAnimationFlashcardProjections({
    animation,
    cards: fixture.flashcards
  });

  assert.equal(projections.length, fixture.flashcards.length);
  assert.deepEqual(
    projections.flatMap((projection) => projection.diagnostics),
    []
  );
});

test("matrix-matrix imports reserve one full duration window per result cell", () => {
  const fixture = createGeneratedLinearAlgebraProblemFixture(
    "generated.linear-algebra.matrix-matrix.two-by-two"
  );
  const animation = createGeneratedProblemAnimationAsset(fixture);

  assert.equal(animation.timeline?.durationMs, 4_400);
});
