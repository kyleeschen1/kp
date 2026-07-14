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
import {
  createKpAnimationClozeVisualMaskData
} from "../src/animation/flashcard-cloze-visual-mask.ts";
import {
  createKpAnimationPredictNextAnswerState
} from "../src/animation/flashcard-predict-next-answer-state.ts";
import {
  createLinearSolveFlashcardRendererSample
} from "../src/animation/flashcard-renderer-sample.ts";
import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { createKpFlashcardSpec } from "../src/semantic/asset-flashcard.ts";
import { createLinearSolveKpAssetBundle } from "../src/semantic/linear-solve-asset.ts";
import {
  createLinearSolveRuntimeVisualFrameSample
} from "../src/rendering/linear-solve-runtime-visual-sample.ts";

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

test("createKpAnimationClozeVisualMaskData maps hidden selectors to visual nodes", () => {
  const animation = createLinearSolveAnimationAsset();
  const semantic = createLinearSolveKpAssetBundle();
  const preview = createKpAnimationFlashcardPreviewRendererData({
    animation,
    cards: semantic.flashcards,
    progress: 0
  });
  const clozeItem = preview.items.find(
    (item) => item.cardId === "card.linear-solve.cloze-plus3"
  );
  const sample = createLinearSolveRuntimeVisualFrameSample({ progress: 0 });

  assert.ok(clozeItem);

  const mask = createKpAnimationClozeVisualMaskData({
    item: clozeItem,
    visualFrame: sample.visualFrame
  });

  assert.equal(
    mask.id,
    "cloze-mask.visual.linear-solve.visual-sample.card.linear-solve.cloze-plus3"
  );
  assert.deepEqual(mask.hiddenSelectorIds, [
    "equation.linear-solve.initial.lhs.plus3"
  ]);
  assert.deepEqual(
    mask.masks.map((entry) => [
      entry.selectorId,
      entry.nodeId,
      entry.nodeRef,
      entry.geometry?.x
    ]),
    [
      [
        "equation.linear-solve.initial.lhs.plus3",
        "katex-selector.equation.linear-solve.initial.lhs.plus3.tok.plus",
        "tok.plus",
        18
      ],
      [
        "equation.linear-solve.initial.lhs.plus3",
        "katex-selector.equation.linear-solve.initial.lhs.plus3.tok.plus-three",
        "tok.plus-three",
        30
      ]
    ]
  );
  assert.deepEqual(mask.diagnostics, []);
});

test("createKpAnimationPredictNextAnswerState evaluates selected transformation answers", () => {
  const animation = createLinearSolveAnimationAsset();
  const semantic = createLinearSolveKpAssetBundle();
  const preview = createKpAnimationFlashcardPreviewRendererData({
    animation,
    cards: semantic.flashcards
  });
  const predictItem = preview.items.find(
    (item) => item.cardId === "card.linear-solve.predict-subtract"
  );

  assert.ok(predictItem);

  const pending = createKpAnimationPredictNextAnswerState({
    item: predictItem
  });
  const correct = createKpAnimationPredictNextAnswerState({
    item: predictItem,
    selectedTransformationId: "transform.linear-solve.subtract-both-sides-3"
  });
  const incorrect = createKpAnimationPredictNextAnswerState({
    item: predictItem,
    selectedTransformationId: "transform.linear-solve.cancel-left-additive-inverse"
  });
  const unavailable = createKpAnimationPredictNextAnswerState({
    item: predictItem,
    selectedTransformationId: "transform.linear-solve.missing"
  });

  assert.equal(pending.status, "pending");
  assert.equal(correct.status, "correct");
  assert.equal(incorrect.status, "incorrect");
  assert.equal(unavailable.status, "unavailable");
  assert.deepEqual(
    pending.candidates.map((candidate) => [
      candidate.transformationId,
      candidate.state
    ]),
    [
      ["transform.linear-solve.subtract-both-sides-3", "expected"],
      ["transform.linear-solve.cancel-left-additive-inverse", "available"],
      ["transform.linear-solve.simplify-right-difference", "available"]
    ]
  );
  assert.deepEqual(
    incorrect.candidates.map((candidate) => [
      candidate.transformationId,
      candidate.state
    ]),
    [
      ["transform.linear-solve.subtract-both-sides-3", "expected"],
      ["transform.linear-solve.cancel-left-additive-inverse", "incorrect"],
      ["transform.linear-solve.simplify-right-difference", "available"]
    ]
  );
  assert.deepEqual(unavailable.diagnostics, [
    {
      severity: "warning",
      code: "predict-next-answer.unavailable-selection",
      path: "selectedTransformationId",
      message:
        "Selected transformation transform.linear-solve.missing is not a candidate for card.linear-solve.predict-subtract."
    }
  ]);
});

test("createLinearSolveFlashcardRendererSample surfaces renderable flashcard state", () => {
  const sample = createLinearSolveFlashcardRendererSample();

  assert.equal(
    sample.id,
    "flashcard-renderer-sample.animation.linear-solve.solve-x"
  );
  assert.equal(sample.kind, "animation-flashcard-renderer-sample");
  assert.equal(sample.animationId, "animation.linear-solve.solve-x");
  assert.equal(
    sample.previewDataId,
    "flashcard-preview.animation.linear-solve.solve-x"
  );
  assert.equal(sample.visualFrameId, "visual.linear-solve.visual-sample");
  assert.deepEqual(sample.itemIds, [
    "flashcard-preview-item.animation.linear-solve.solve-x.card.linear-solve.cloze-plus3",
    "flashcard-preview-item.animation.linear-solve.solve-x.card.linear-solve.predict-subtract"
  ]);
  assert.deepEqual(sample.clozeMask.hiddenSelectorIds, [
    "equation.linear-solve.initial.lhs.plus3"
  ]);
  assert.deepEqual(
    sample.clozeMask.masks.map((entry) => [entry.nodeRef, entry.geometry?.x]),
    [
      ["tok.plus", 18],
      ["tok.plus-three", 30]
    ]
  );
  assert.equal(sample.predictNextPending.status, "pending");
  assert.equal(sample.predictNextCorrect.status, "correct");
  assert.deepEqual(sample.diagnostics, []);
});
