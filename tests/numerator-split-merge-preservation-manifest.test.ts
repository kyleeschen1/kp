import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createKpFractionMergeClozeProjection,
  createKpFractionSplitClozeProjection
} from "../src/animation/semantic-glyph-reconciliation-cloze.ts";
import { compileKpNumeratorSplitMergeEquationLessonModel } from "../src/reader/compiler/numerator-split-merge-equation-lesson-model.ts";
import { kpNumeratorSplitMergePreservationManifest as manifest } from "../src/reader/compiler/numerator-split-merge-preservation-manifest.ts";

const markdown = readFileSync(
  new URL("../content/lessons/numerator-split-merge.md", import.meta.url),
  "utf8"
);

test("fraction reader preservation manifest matches current semantic and product authority", () => {
  const model = compileKpNumeratorSplitMergeEquationLessonModel(markdown);
  const animation = model.animation;

  assert.equal(model.document.id, manifest.document.id);
  assert.equal(model.document.title, manifest.document.title);
  assert.ok(model.prose.articleHtml.includes(manifest.document.searchableText));
  assert.equal(animation.id, manifest.animation.id);
  assert.deepEqual(
    animation.bundle.objects.map(({ id }) => id),
    manifest.animation.stateIds
  );
  assert.deepEqual(
    animation.bundle.objects.map(({ value }) => (value as { latex: string }).latex),
    manifest.animation.latex
  );
  assert.deepEqual(
    animation.transformations.map(({ id }) => id),
    manifest.animation.transformationIds
  );
  assert.deepEqual(
    animation.transformations.map(({ definitionId }) => definitionId),
    manifest.animation.definitionIds
  );
  assert.deepEqual(
    animation.transformations.flatMap(({ correspondenceMap }) =>
      correspondenceMap!.records.map(({ relation }) => relation)
    ),
    manifest.animation.lineageRelations
  );
  assert.deepEqual(animation.timeline, {
    id: manifest.animation.timelineId,
    durationMs: manifest.animation.durationMs,
    beatCount: manifest.animation.beatCount
  });
  assert.equal(animation.layout?.id, manifest.presentation.layoutId);
  assert.equal(animation.layout?.kind, manifest.presentation.layoutKind);
});

test("fraction prose checkpoints, focus, hydration, and Cloze remain frozen", () => {
  const model = compileKpNumeratorSplitMergeEquationLessonModel(markdown);
  const block = model.hydration.blocks[0]!;
  const focus = [
    ...new Set([
      ...model.animation.transformationTree.annotations.flatMap(
        ({ selectorIds }) => selectorIds ?? []
      ),
      "equation.numerator-split-merge.combined.fraction.numerator.plus"
    ])
  ];

  assert.deepEqual(
    block.checkpoints.map(({ beatId, progressPermille }) => ({
      beatId,
      progressPermille
    })),
    manifest.checkpoints
  );
  assert.deepEqual(focus, manifest.focusSelectorIds);
  assert.equal(block.adapterId, manifest.payload.adapterId);
  assert.equal(block.presentation, manifest.payload.presentation);

  const cloze = [
    createKpFractionMergeClozeProjection(),
    createKpFractionSplitClozeProjection()
  ];
  assert.deepEqual(
    cloze.map(({ cardId, hiddenSelectorIds }) => ({
      cardId,
      hiddenSelectorIds
    })),
    manifest.cloze
  );
  assert.ok(cloze.every(({ diagnostics }) => diagnostics.length === 0));
});
