import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { KpArticleImportLock } from
  "../src/article/kp-article-import-lock.ts";
import { kpCanonicalLogExponentSequenceTimeline } from
  "../src/animation/log-exponent-timeline.ts";
import { compileKpLogExponentFocusCardArticle } from
  "../src/experiments/kinetic-figure-log-exponent-focus-card/kinetic-figure-log-exponent-focus-card-article.ts";
import {
  createKpLogExponentFocusCardScore,
  kpLogExponentFocusCardBeatHash,
  readKpLogExponentFocusCardBeatIndexFromHash,
  sampleKpLogExponentFocusCardPlayback,
  sampleKpLogExponentFocusCardPosition
} from
  "../src/experiments/kinetic-figure-log-exponent-focus-card/kinetic-figure-log-exponent-focus-card-model.ts";

const articleText = readFileSync(
  "content/lessons/algebra-log-exponent-focus-card.kp.md",
  "utf8"
);
const importLock = JSON.parse(readFileSync(
  "content/lessons/algebra-log-exponent-focus-card.kp.lock.json",
  "utf8"
)) as KpArticleImportLock;

function createScore() {
  return createKpLogExponentFocusCardScore(
    compileKpLogExponentFocusCardArticle({
      text: articleText,
      lock: importLock
    }).document
  );
}

test("Article prose binds six explanatory beats to three canonical rewrites", () => {
  const score = createScore();
  const windows = kpCanonicalLogExponentSequenceTimeline.windows;

  assert.deepEqual(score.beats.map(({ slug }) => slug), [
    "locate-the-unknown",
    "choose-logarithms",
    "apply-logarithms",
    "match-the-power-law",
    "extract-the-exponent",
    "isolate-x"
  ]);
  assert.deepEqual(score.beats.map(({ timelineProgress }) => timelineProgress), [
    0,
    0,
    windows[0]!.end,
    windows[0]!.end,
    windows[1]!.end,
    windows[2]!.end
  ]);
  assert.deepEqual(score.beats.map(({ ownsMotionFromPrevious }) =>
    ownsMotionFromPrevious), [false, false, true, false, true, true]);
  assert.ok(score.beats.every(({ label, referenceAddress }) =>
    label.length > 0 && referenceAddress.startsWith("log-solve/")));
});

test("semantic equation hashes restore deterministic beat endpoints", () => {
  const score = createScore();
  const extraction = score.beats.find(({ slug }) =>
    slug === "extract-the-exponent")!;
  assert.equal(kpLogExponentFocusCardBeatHash(extraction),
    "#beat.log-exponent.extract-the-exponent");
  assert.equal(readKpLogExponentFocusCardBeatIndexFromHash(
    score,
    "#beat.log-exponent.extract-the-exponent"
  ), 4);
  assert.equal(readKpLogExponentFocusCardBeatIndexFromHash(score, "#unknown"),
    0);
});

test("one semantic deck position samples prose travel and equation time", () => {
  const score = createScore();
  const firstMotion = sampleKpLogExponentFocusCardPosition(score, 1.5);
  assert.equal(firstMotion.lowerIndex, 1);
  assert.equal(firstMotion.upperIndex, 2);
  assert.equal(firstMotion.edgeProgress, 0.5);
  const firstWindow = kpCanonicalLogExponentSequenceTimeline.windows[0]!;
  const act = firstWindow.timeline.phases.find(({ phaseId }) =>
    phaseId === "act")!;
  assert.equal(firstMotion.timelineProgress,
    firstWindow.start + (firstWindow.end - firstWindow.start) *
      (act.start + (act.end - act.start) / 2));

  const attentionOnly = sampleKpLogExponentFocusCardPosition(score, 2.5);
  assert.equal(attentionOnly.timelineProgress,
    score.beats[2]!.timelineProgress);
  assert.deepEqual(sampleKpLogExponentFocusCardPosition(score, 1.5),
    firstMotion);
});

test("automatic playback gives card travel to the visible rewrite phase", () => {
  const score = createScore();
  const source = score.beats[1]!.timelineProgress;
  const target = score.beats[2]!.timelineProgress;
  const middle = sampleKpLogExponentFocusCardPosition(score, 1.5);
  const playback = sampleKpLogExponentFocusCardPlayback({
    sourceProgress: source,
    targetProgress: target,
    currentProgress: middle.timelineProgress
  });

  assert.equal(playback.phaseId, "act");
  assert.equal(playback.edgeProgress, 0.5);
  assert.equal(playback.tempoMultiplier, 0.85);

  const reverse = sampleKpLogExponentFocusCardPlayback({
    sourceProgress: target,
    targetProgress: source,
    currentProgress: middle.timelineProgress
  });
  assert.equal(reverse.edgeProgress, 0.5);

  const roleTransferSource = score.beats[3]!.timelineProgress;
  const roleTransferTarget = score.beats[4]!.timelineProgress;
  const roleTransferMiddle = sampleKpLogExponentFocusCardPosition(score, 3.5);
  const roleTransfer = sampleKpLogExponentFocusCardPlayback({
    sourceProgress: roleTransferSource,
    targetProgress: roleTransferTarget,
    currentProgress: roleTransferMiddle.timelineProgress
  });
  assert.equal(roleTransfer.phaseId, "act");
  assert.equal(roleTransfer.tempoMultiplier, playback.tempoMultiplier);
});

test("equation Focus Deck reuses the shared shell and canonical player seam", () => {
  const source = readFileSync(
    "src/experiments/kinetic-figure-log-exponent-focus-card/kinetic-figure-log-exponent-focus-card.ts",
    "utf8"
  );
  assert.match(source, /renderKpFocusDeckScaffold\(/u);
  assert.match(source, /createKpLogExponentAnimationAsset\(/u);
  assert.match(source, /renderKpEditorAnimationPlayerShell\(/u);
  assert.match(source, /registerKpEditorLogExponentSurfaceCapability\(/u);
  assert.doesNotMatch(source, /katex\.render/u);
  assert.doesNotMatch(source, /innerHTML\s*=\s*.*ln\(/u);
});
