import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { KpArticleImportLock } from
  "../src/article/kp-article-import-lock.ts";
import { createKpEconomicsSupplyTaxAnimationAsset } from
  "../src/animation/economics-supply-tax-asset.ts";
import { compileKpSupplyTaxScrollScoreArticle } from
  "../src/experiments/kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-article.ts";
import {
  projectKpSupplyTaxScrollScoreCoverageUnits,
  projectKpSupplyTaxScrollScorePhraseAttention,
  projectKpSupplyTaxScrollScoreReceptionWaveUnits,
  readKpSupplyTaxScrollScorePhraseFocusProfile
} from
  "../src/experiments/kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-attention.ts";
import {
  canonicalKpSupplyTaxScrollScorePhraseUnits,
  createKpSupplyTaxScrollScore,
  kpSupplyTaxScrollScorePhraseHash,
  readKpSupplyTaxScrollScorePhraseFromHash,
  sampleKpSupplyTaxScrollScore
} from
  "../src/experiments/kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-score.ts";
import {
  projectKpSupplyTaxScene,
  projectKpSupplyTaxSceneTransition
} from
  "../src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-scene.ts";
import { createKpSupplyTaxPedagogicalScore } from
  "../src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-score.ts";
import {
  isKpSupplyTaxScrollScoreRoute,
  KP_SUPPLY_TAX_SCROLL_SCORE_PATH
} from
  "../src/experiments/kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-route.ts";

const articleText = readFileSync(
  "content/lessons/economics-supply-tax-scroll-score.kp.md",
  "utf8"
);
const importLock = JSON.parse(readFileSync(
  "content/lessons/economics-supply-tax-scroll-score.kp.lock.json",
  "utf8"
)) as KpArticleImportLock;

function createScore() {
  const article = compileKpSupplyTaxScrollScoreArticle({
    text: articleText,
    lock: importLock
  });
  return createKpSupplyTaxScrollScore({
    document: article.document,
    score: createKpSupplyTaxPedagogicalScore()
  });
}

test("Scroll Score Article binds two paragraphs to eight existing semantic beats", () => {
  const score = createScore();
  assert.deepEqual(score.passages.map(({ id }) => id), [
    "market-adjustment",
    "welfare-accounting"
  ]);
  assert.equal(score.phrases.length, 8);
  assert.deepEqual(score.phrases.map(({ beat }) => beat.slug), [
    "baseline-market",
    "tax-input",
    "supply-translation",
    "price-wedge",
    "quantity-contraction",
    "surplus-redistribution",
    "government-revenue",
    "deadweight-loss"
  ]);
  assert.equal(new Set(score.phrases.map(({ referenceAddress }) =>
    referenceAddress)).size, 8);
  assert.equal(score.totalUnits, score.phrases.reduce((sum, phrase) =>
    sum + phrase.wordUnits + phrase.restUnits, 0));
  assert.ok(score.phrases.every(({ wordUnits, restUnits }) =>
    wordUnits > 0 && restUnits === 1));
});

test("uniform textual units sample deterministic phrase motion and rests", () => {
  const score = createScore();
  const phrase = score.phrases.find(({ id }) => id === "shift-supply")!;
  const passage = score.passages.find(({ id }) =>
    id === phrase.passageId)!;
  const midpoint = passage.offsetUnits + phrase.startUnits +
    phrase.wordUnits / 2;
  const first = sampleKpSupplyTaxScrollScore(score, midpoint);
  const second = sampleKpSupplyTaxScrollScore(score, midpoint);
  assert.deepEqual(second, first);
  assert.equal(first.fromBeat.slug, "tax-input");
  assert.equal(first.toBeat.slug, "supply-translation");
  assert.equal(first.phraseProgress, 0.5);
  assert.equal(first.resting, false);
  const endpoint = sampleKpSupplyTaxScrollScore(score,
    canonicalKpSupplyTaxScrollScorePhraseUnits(score, phrase));
  assert.equal(endpoint.phraseProgress, 1);
  assert.equal(endpoint.resting, true);
});

test("semantic phrase hashes restore canonical endpoints", () => {
  const score = createScore();
  const phrase = score.phrases.find(({ id }) => id === "trace-revenue")!;
  assert.equal(kpSupplyTaxScrollScorePhraseHash(phrase),
    "#phrase.trace-revenue");
  assert.equal(readKpSupplyTaxScrollScorePhraseFromHash(
    score,
    "#phrase.trace-revenue"
  )?.id, phrase.id);
  assert.equal(readKpSupplyTaxScrollScorePhraseFromHash(score, "#unknown"),
    undefined);
});

test("reading light transfers early, holds, and snaps in reduced motion", () => {
  const score = createScore();
  const passage = score.passages[0]!;
  const phrase = passage.phrases.find(({ id }) => id === "shift-supply")!;
  const sampleAtHalfReception = sampleKpSupplyTaxScrollScore(
    score,
    passage.offsetUnits + phrase.startUnits + phrase.wordUnits * 0.09
  );
  const attention = projectKpSupplyTaxScrollScorePhraseAttention({
    score,
    sample: sampleAtHalfReception,
    discrete: false,
    profile: "reception"
  });
  const byId = new Map(attention.map((entry) => [entry.phraseId, entry]));
  assert.equal(byId.get("shift-supply")?.role, "focus");
  assert.ok(Math.abs((byId.get("shift-supply")?.strength ?? 0) - 0.5) <
    Number.EPSILON * 8);
  assert.equal(byId.get("introduce-tax")?.role, "releasing");
  assert.ok(Math.abs((byId.get("introduce-tax")?.strength ?? 0) - 0.5) <
    Number.EPSILON * 8);
  assert.equal(byId.get("orient-market")?.role, "context");
  assert.equal(byId.get("orient-market")?.strength, 0);

  const heldSample = sampleKpSupplyTaxScrollScore(
    score,
    passage.offsetUnits + phrase.startUnits + phrase.wordUnits * 0.5
  );
  const held = projectKpSupplyTaxScrollScorePhraseAttention({
    score,
    sample: heldSample,
    discrete: false,
    profile: "reception"
  });
  assert.equal(held.find(({ phraseId }) => phraseId === phrase.id)?.strength, 1);
  const discrete = projectKpSupplyTaxScrollScorePhraseAttention({
    score,
    sample: sampleAtHalfReception,
    discrete: true,
    profile: "reception"
  });
  assert.equal(discrete.find(({ phraseId }) =>
    phraseId === phrase.id)?.strength, 1);
});

test("word progress advances in reading order and preserves profile choice", () => {
  const score = createScore();
  const passage = score.passages[0]!;
  const phrase = passage.phrases.find(({ id }) => id === "shift-supply")!;
  const sample = sampleKpSupplyTaxScrollScore(
    score,
    passage.offsetUnits + phrase.startUnits + phrase.wordUnits * 0.5
  );
  const attention = projectKpSupplyTaxScrollScorePhraseAttention({
    score,
    sample,
    discrete: false,
    profile: "karaoke"
  });
  const active = attention.find(({ phraseId }) => phraseId === phrase.id)!;
  assert.equal(active.strength, 1);
  assert.equal(active.coverage, 0.5);
  const units = projectKpSupplyTaxScrollScoreCoverageUnits({
    unitCount: 7,
    coverage: active.coverage
  });
  assert.equal(units[0]?.strength, 1);
  assert.ok((units[3]?.strength ?? 0) > 0);
  assert.ok((units[3]?.strength ?? 0) < 1);
  assert.equal(units[6]?.strength, 0);
  assert.ok(units.every((unit, index) => index === 0 ||
    unit.strength <= units[index - 1]!.strength));
  assert.deepEqual(
    projectKpSupplyTaxScrollScoreCoverageUnits({ unitCount: 7, coverage: 0.5 }),
    units
  );
  assert.equal(projectKpSupplyTaxScrollScorePhraseAttention({
    score,
    sample,
    discrete: false,
    profile: "coverage"
  }).find(({ phraseId }) => phraseId === phrase.id)?.coverage, 0.5);
  assert.equal(readKpSupplyTaxScrollScorePhraseFocusProfile(""),
    "reception-wave");
  assert.equal(readKpSupplyTaxScrollScorePhraseFocusProfile(
    "?phrase-focus=karaoke"
  ), "karaoke");
  assert.equal(readKpSupplyTaxScrollScorePhraseFocusProfile(
    "?phrase-focus=coverage"
  ), "coverage");
  assert.equal(readKpSupplyTaxScrollScorePhraseFocusProfile(
    "?phrase-focus=reception"
  ), "reception");
});

test("reception wave is local, reversible, and disappears into stable focus", () => {
  const score = createScore();
  const passage = score.passages[0]!;
  const phrase = passage.phrases.find(({ id }) => id === "shift-supply")!;
  const sample = sampleKpSupplyTaxScrollScore(
    score,
    passage.offsetUnits + phrase.startUnits + phrase.wordUnits * 0.09
  );
  const attention = projectKpSupplyTaxScrollScorePhraseAttention({
    score,
    sample,
    discrete: false,
    profile: "reception-wave"
  }).find(({ phraseId }) => phraseId === phrase.id)!;
  assert.ok(Math.abs(attention.strength - 0.5) < Number.EPSILON * 8);
  assert.ok(Math.abs(attention.coverage - 0.5) < Number.EPSILON * 8);
  const midpoint = projectKpSupplyTaxScrollScoreReceptionWaveUnits({
    unitCount: 9,
    progress: 0.5
  });
  assert.equal(midpoint[4]?.strength, 1);
  assert.equal(midpoint[0]?.strength, 0);
  assert.equal(midpoint[8]?.strength, 0);
  assert.ok(midpoint.filter(({ strength }) => strength > 0).length <= 3);
  assert.deepEqual(projectKpSupplyTaxScrollScoreReceptionWaveUnits({
    unitCount: 9,
    progress: 0.5
  }), midpoint);
  assert.ok(projectKpSupplyTaxScrollScoreReceptionWaveUnits({
    unitCount: 9,
    progress: 0
  }).every(({ strength }) => strength === 0));
  assert.ok(projectKpSupplyTaxScrollScoreReceptionWaveUnits({
    unitCount: 9,
    progress: 1
  }).every(({ strength }) => strength < Number.EPSILON));
});

test("scrub profile is linear, reversible, and suppresses playback bloom", () => {
  const authority = createKpEconomicsSupplyTaxAnimationAsset();
  const beats = createKpSupplyTaxPedagogicalScore(authority).beats;
  const from = projectKpSupplyTaxScene({ authority, beat: beats[5]! });
  const to = projectKpSupplyTaxScene({ authority, beat: beats[6]! });
  const revenueId = authority.semantics.entities.regions.find(({ role }) =>
    role === "government-revenue")!.id;
  const forward = projectKpSupplyTaxSceneTransition({
    from,
    to,
    progress: 0.25,
    profile: "scrub"
  });
  const reverseSample = projectKpSupplyTaxSceneTransition({
    from: to,
    to: from,
    progress: 0.75,
    profile: "scrub"
  });
  const entity = (projection: typeof forward) => projection.entities.find(
    ({ entityId }) => entityId === revenueId
  )!;
  assert.equal(entity(forward).presence, 0.25);
  assert.equal(entity(forward).focus, 0.25);
  assert.equal(entity(forward).bloom, 0);
  assert.equal(entity(reverseSample).presence, 0.25);
  assert.equal(entity(reverseSample).focus, 0.25);
  assert.equal(entity(reverseSample).bloom, 0);
});

test("Scroll Score owns one normalized standalone route", () => {
  assert.equal(KP_SUPPLY_TAX_SCROLL_SCORE_PATH,
    "/experiments/kinetic-figure/supply-tax-scroll-score/");
  assert.equal(isKpSupplyTaxScrollScoreRoute(
    "/experiments/kinetic-figure/supply-tax-scroll-score"), true);
  const html = readFileSync(
    "experiments/kinetic-figure/supply-tax-scroll-score/index.html",
    "utf8"
  );
  const entry = readFileSync(
    "src/experiments/kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-entry.ts",
    "utf8"
  );
  assert.match(html, /kinetic-figure-supply-tax-scroll-score-page\.ts/u);
  assert.match(entry, /economics-supply-tax-scroll-score\.kp\.md\?raw/u);
  assert.match(entry, /sampleKpEconomicsSupplyTaxAnimationFrame/u);
  assert.match(entry, /profile: "scrub"/u);
  assert.doesNotMatch(entry, /createKpReaderTimelinePlaybackClock|clock\.play/u);
});
