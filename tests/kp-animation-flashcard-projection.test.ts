import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationClozeProjection,
  createKpAnimationFlashcardProjection,
  createKpAnimationFlashcardProjections,
  createKpAnimationPredictNextProjection
} from "../src/animation/flashcard-projection.ts";
import {
  createKpAnimationFlashcardPreviewRendererData
} from "../src/animation/flashcard-preview-renderer-data.ts";
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

test("createKpAnimationClozeProjection exposes hidden selectors and answer", () => {
  const animation = createLinearSolveAnimationAsset();
  const semantic = createLinearSolveKpAssetBundle();
  const card = semantic.flashcards.find(
    (candidate) => candidate.id === "card.linear-solve.cloze-plus3"
  );

  assert.ok(card);

  const projection = createKpAnimationClozeProjection({
    animation,
    card
  });

  assert.equal(projection.interactionKind, "cloze");
  assert.deepEqual(projection.hiddenSelectorIds, [
    "equation.linear-solve.initial.lhs.plus3"
  ]);
  assert.deepEqual(projection.answer, {
    kind: "text",
    value: "+3"
  });
  assert.equal(projection.clock.progress, 0.5);
  assert.deepEqual(projection.diagnostics, []);
});

test("createKpAnimationPredictNextProjection exposes expected transformation candidates", () => {
  const animation = createLinearSolveAnimationAsset();
  const semantic = createLinearSolveKpAssetBundle();
  const card = semantic.flashcards.find(
    (candidate) => candidate.id === "card.linear-solve.predict-subtract"
  );

  assert.ok(card);

  const projection = createKpAnimationPredictNextProjection({
    animation,
    card
  });

  assert.equal(projection.interactionKind, "predict-next");
  assert.equal(
    projection.expectedTransformationId,
    "transform.linear-solve.subtract-both-sides-3"
  );
  assert.deepEqual(projection.candidateTransformationIds, [
    "transform.linear-solve.subtract-both-sides-3",
    "transform.linear-solve.cancel-left-additive-inverse",
    "transform.linear-solve.simplify-right-difference"
  ]);
  assert.equal(projection.clock.progress, 0);
  assert.deepEqual(projection.activeTransformationIds, [
    "transform.linear-solve.subtract-both-sides-3"
  ]);
  assert.deepEqual(projection.diagnostics, []);
});

test("createKpAnimationFlashcardPreviewRendererData summarizes projections for renderers", () => {
  const animation = createLinearSolveAnimationAsset();
  const semantic = createLinearSolveKpAssetBundle();
  const preview = createKpAnimationFlashcardPreviewRendererData({
    animation,
    cards: semantic.flashcards
  });

  assert.equal(
    preview.id,
    "flashcard-preview.animation.linear-solve.solve-x"
  );
  assert.equal(preview.animationId, "animation.linear-solve.solve-x");
  assert.equal(preview.itemCount, 4);
  assert.deepEqual(
    preview.items.map((item) => [
      item.cardId,
      item.cardKind,
      item.interactionKind
    ]),
    [
      ["card.linear-solve.cloze-plus3", "cloze", "cloze"],
      ["card.linear-solve.predict-subtract", "predict-next", "predict-next"],
      ["card.linear-solve.explain-cancel", "explain-transform", "review"],
      ["card.linear-solve.focus-x-persistence", "focus-relationship", "review"]
    ]
  );
  assert.deepEqual(preview.items[0]?.hiddenSelectorIds, [
    "equation.linear-solve.initial.lhs.plus3"
  ]);
  assert.equal(
    preview.items[1]?.expectedTransformationId,
    "transform.linear-solve.subtract-both-sides-3"
  );
  assert.deepEqual(preview.items[1]?.candidateTransformationIds, [
    "transform.linear-solve.subtract-both-sides-3",
    "transform.linear-solve.cancel-left-additive-inverse",
    "transform.linear-solve.simplify-right-difference"
  ]);
  assert.deepEqual(preview.diagnostics, []);
  assert.equal(preview.items[2]?.clock.progress, 0.5);
  assert.deepEqual(preview.items[2]?.activeTransformationIds, [
    "transform.linear-solve.cancel-left-additive-inverse"
  ]);
});
