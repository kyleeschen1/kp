import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type {
  KpArticleImportLock
} from "../src/article/kp-article-import-lock.ts";
import type {
  KpArticleDeckMotionScene
} from "../src/article/kp-article-deck.ts";
import {
  compileKpFractionCompositionArticle
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-article-compiler.ts";

const text = readFileSync(
  "content/lessons/algebra-fraction-composition.kp.md",
  "utf8"
);
const lock = JSON.parse(readFileSync(
  "content/lessons/algebra-fraction-composition.kp.lock.json",
  "utf8"
)) as KpArticleImportLock;

test("fraction composition compiles every generic Article v1 projection", () => {
  const compiled = compileKpFractionCompositionArticle({ text, lock });

  assert.equal(compiled.article.document.id, lock.documentId);
  assert.equal(compiled.stageManifests.length, 1);
  assert.equal(compiled.accessibility.stages.length, 1);
  assert.equal(
    compiled.deck.scenes.filter(({ kind }) => kind === "motion").length,
    5
  );
  assert.equal(compiled.staticMarkdown.assets.length, 6);
  assert.deepEqual(
    compiled.staticMarkdown.assets.map(({ checkpointId }) => checkpointId),
    [
      "factored",
      "normalized",
      "constant-quotient",
      "difference-simplified",
      "right-product-simplified",
      "solved"
    ]
  );
});

test("fraction static publication is complete, searchable, and build-rendered", () => {
  const compiled = compileKpFractionCompositionArticle({ text, lock });
  const html = compiled.staticHtml;

  assert.match(html.articleHtml, /What does the fraction multiply\?/u);
  assert.match(
    html.articleHtml,
    /The exact <a href="#kp-ref:solve\/solution">solution<\/a>/u
  );
  assert.match(html.articleHtml, /Substitute/u);
  assert.match(html.articleHtml, /class="katex-mathml"/u);
  assert.ok(html.math.inlineCount >= 20);
  assert.equal(html.math.displayCount, 2);
  assert.equal(html.math.clientRuntimeRequired, false);
  assert.equal(html.assets.length, 6);
  assert.ok(html.assets.every(({ assetPath }) => assetPath.endsWith(".svg")));
  assert.doesNotMatch(compiled.staticMarkdown.markdown, /:::kp-/u);
  assert.doesNotMatch(compiled.staticMarkdown.markdown, /\]\(kp-ref:/u);
});

test("fraction stage manifest restores the semantic root independent of sort order", () => {
  const compiled = compileKpFractionCompositionArticle({ text, lock });
  const stage = compiled.stageManifests[0]!;

  assert.equal(stage.stageId, "solve");
  assert.equal(
    stage.activation.initialCheckpointId,
    "lesson.algebra.fraction-composition.article#solve/factored"
  );
  assert.equal(stage.semantic.objectPaths.length, 12);
  assert.equal(stage.semantic.transitionPaths.length, 5);
  assert.equal(stage.semantic.checkpointPaths.length, 6);
  assert.deepEqual(stage.activation.triggers, ["direct-address", "near-viewport"]);
});

test("fraction accessibility and deck retain all five indivisible motions", () => {
  const compiled = compileKpFractionCompositionArticle({ text, lock });
  const stage = compiled.accessibility.stages[0]!;
  const motions = compiled.deck.scenes.filter(
    (scene): scene is KpArticleDeckMotionScene => scene.kind === "motion"
  );

  assert.equal(stage.checkpoints.length, 6);
  assert.equal(stage.reducedMotionSeeks.length, 5);
  assert.ok(stage.reducedMotionSeeks.every(
    ({ behavior }) => behavior === "direct-checkpoint-seek"
  ));
  assert.deepEqual(motions.map(({ id }) => id), [
    "distribute",
    "evaluate-constant",
    "subtract-four",
    "clear-denominator",
    "divide-by-two"
  ]);
  assert.ok(motions.every(({ afterMarkdown }) => afterMarkdown !== undefined));
});

test("fraction article compilation is deterministic", () => {
  assert.deepEqual(
    compileKpFractionCompositionArticle({ text, lock }),
    compileKpFractionCompositionArticle({ text, lock })
  );
});
