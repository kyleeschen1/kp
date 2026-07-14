import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationFlashcardProjection,
  createKpAnimationFlashcardProjections
} from "../src/animation/flashcard-projection.ts";
import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { createKpFlashcardSpec } from "../src/semantic/asset-flashcard.ts";
import { createLinearSolveKpAssetBundle } from "../src/semantic/linear-solve-asset.ts";

test("createKpAnimationFlashcardProjection binds flashcards to runtime frames", () => {
  const animation = createLinearSolveAnimationAsset();
  const semantic = createLinearSolveKpAssetBundle();
  const card = semantic.flashcards.find(
    (candidate) => candidate.id === "card.linear-solve.explain-cancel"
  );

  assert.ok(card);

  const projection = createKpAnimationFlashcardProjection({
    animation,
    card
  });

  assert.equal(
    projection.id,
    "projection.animation.linear-solve.solve-x.card.linear-solve.explain-cancel"
  );
  assert.equal(projection.kind, "animation-flashcard-projection");
  assert.equal(projection.animationId, "animation.linear-solve.solve-x");
  assert.equal(projection.cardId, "card.linear-solve.explain-cancel");
  assert.equal(projection.cardKind, "explain-transform");
  assert.equal(projection.clock.progress, 0.5);
  assert.equal(projection.clock.elapsedMs, 1200);
  assert.deepEqual(projection.objectIds, [
    "equation.linear-solve.after-subtract",
    "equation.linear-solve.left-simplified"
  ]);
  assert.deepEqual(projection.transformationIds, [
    "transform.linear-solve.cancel-left-additive-inverse"
  ]);
  assert.deepEqual(projection.activeTransformationIds, [
    "transform.linear-solve.cancel-left-additive-inverse"
  ]);
  assert.deepEqual(projection.diagnostics, []);
});

test("createKpAnimationFlashcardProjections projects card families", () => {
  const animation = createLinearSolveAnimationAsset();
  const semantic = createLinearSolveKpAssetBundle();
  const projections = createKpAnimationFlashcardProjections({
    animation,
    cards: semantic.flashcards
  });

  assert.deepEqual(
    projections.map((projection) => [projection.cardId, projection.cardKind]),
    [
      ["card.linear-solve.cloze-plus3", "cloze"],
      ["card.linear-solve.predict-subtract", "predict-next"],
      ["card.linear-solve.explain-cancel", "explain-transform"],
      ["card.linear-solve.focus-x-persistence", "focus-relationship"]
    ]
  );
});

test("flashcard projection reports missing animation references", () => {
  const animation = createLinearSolveAnimationAsset();
  const card = createKpFlashcardSpec({
    id: "card.bad",
    kind: "predict-next",
    title: "Bad reference",
    assetId: animation.bundle.id,
    prompt: "Which transformation is next?",
    transformationIds: ["transform.missing"]
  });
  const projection = createKpAnimationFlashcardProjection({
    animation,
    card
  });

  assert.deepEqual(projection.diagnostics, [
    {
      path: "transformationIds[0]",
      message:
        "Flashcard card.bad references missing transformation transform.missing."
    }
  ]);
});

