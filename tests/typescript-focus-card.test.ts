import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { KpArticleImportLock } from
  "../src/article/kp-article-import-lock.ts";
import {
  createKpTypeScriptFocusCardScore,
  kpTypeScriptFocusCardBeatHash,
  readKpTypeScriptFocusCardBeatIndexFromHash,
  sampleKpTypeScriptFocusCardPosition
} from
  "../src/experiments/kinetic-figure-typescript-focus-card/kinetic-figure-typescript-focus-card-model.ts";
import {
  compileKpTypeScriptFreeShippingPublicLesson
} from "../src/public-web/typescript-free-shipping-publication.ts";
import { createKpTypeScriptFreeShippingRuntimeProjection } from
  "../src/public-web/typescript-free-shipping-runtime.ts";

const articleText = readFileSync(
  "content/lessons/typescript-free-shipping.kp.md",
  "utf8"
);
const importLock = JSON.parse(readFileSync(
  "content/lessons/typescript-free-shipping.kp.lock.json",
  "utf8"
)) as KpArticleImportLock;

function createScore() {
  const runtime = createKpTypeScriptFreeShippingRuntimeProjection();
  const lesson = compileKpTypeScriptFreeShippingPublicLesson({
    text: articleText,
    lock: importLock
  });
  return createKpTypeScriptFocusCardScore({
    article: lesson.article.document,
    score: runtime.score
  });
}

test("TypeScript Focus Deck derives seven beats from the canonical Article and score", () => {
  const score = createScore();

  assert.deepEqual(score.beats.map(({ slug }) => slug), [
    "orient",
    "compare-duplicates",
    "introduce-helper",
    "move-shared-rule",
    "replace-cost-call",
    "replace-message-call",
    "verify-parity"
  ]);
  assert.deepEqual(score.beats.map(({ ownsMotionFromPrevious }) =>
    ownsMotionFromPrevious), [false, false, true, true, true, true, false]);
  assert.match(score.beats[0]!.sourceBlockId, /^markdown:\d+$/u);
  assert.deepEqual(score.beats.slice(1).map(({ sourceBlockId }) => sourceBlockId), [
    "find-duplication",
    "extract-rule",
    "extract-rule",
    "update-price",
    "update-message",
    "verify-behavior"
  ]);
  assert.ok(score.beats.every(({ label, focusSelectorIds }) =>
    label.length > 0 && focusSelectorIds.length > 0));
  assert.equal(score.animationId,
    "animation.programming.typescript-free-shipping-refactor");
});

test("TypeScript Focus Deck samples the canonical timeline between semantic stops", () => {
  const score = createScore();
  const sample = sampleKpTypeScriptFocusCardPosition(score, 2.5);

  assert.equal(sample.lowerIndex, 2);
  assert.equal(sample.upperIndex, 3);
  assert.equal(sample.edgeProgress, 0.5);
  assert.equal(sample.timelineProgress,
    (score.beats[2]!.timelineProgress +
      score.beats[3]!.timelineProgress) / 2);
  assert.deepEqual(sampleKpTypeScriptFocusCardPosition(score, 2.5), sample);
});

test("TypeScript Focus Deck hashes restore exact score checkpoints", () => {
  const score = createScore();
  const message = score.beats[5]!;

  assert.equal(kpTypeScriptFocusCardBeatHash(message),
    "#beat.typescript.replace-message-call");
  assert.equal(readKpTypeScriptFocusCardBeatIndexFromHash(
    score,
    "#beat.typescript.replace-message-call"
  ), 5);
  assert.equal(readKpTypeScriptFocusCardBeatIndexFromHash(
    score,
    "#beat.log-exponent.apply-logarithms"
  ), 0);
});

test("TypeScript card is a projection over the existing code renderer and clock", () => {
  const source = readFileSync(
    "src/experiments/kinetic-figure-typescript-focus-card/kinetic-figure-typescript-focus-card.ts",
    "utf8"
  );

  assert.match(source, /renderKpFocusDeckScaffold\(/u);
  assert.match(source, /createKpTypeScriptFreeShippingRuntimeProjection\(/u);
  assert.match(source, /renderKpTypeScriptRefactorCodeHtml\(/u);
  assert.match(source, /renderKpTypeScriptRefactorDomFrame\(/u);
  assert.match(source, /createKpReaderTimelinePlaybackClock\(/u);
  assert.doesNotMatch(source, /setInterval|setTimeout/u);
  assert.doesNotMatch(source, /shippingCost\s*\(/u);
});
