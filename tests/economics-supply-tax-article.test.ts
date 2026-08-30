import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { KpArticleImportLock } from
  "../src/article/kp-article-import-lock.ts";
import { serializeKpVignetteReleasePayload } from
  "../src/article/kp-article-import-lock.ts";
import { economicsSupplyTaxVignetteRelease } from
  "../src/article/vignettes/economics-supply-tax-vignette.ts";
import {
  compileKpSupplyTaxArticle,
  kpEconomicsSupplyTaxArticleSourceId
} from "../src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-article.ts";

const articleText = readFileSync(kpEconomicsSupplyTaxArticleSourceId, "utf8");
const lock = JSON.parse(readFileSync(
  "content/lessons/economics-supply-tax.kp.lock.json",
  "utf8"
)) as KpArticleImportLock;

test("supply-tax vignette release is content-addressed and locally locked", () => {
  const integrity = `sha256:${createHash("sha256")
    .update(serializeKpVignetteReleasePayload(economicsSupplyTaxVignetteRelease))
    .digest("hex")}`;

  assert.equal(economicsSupplyTaxVignetteRelease.integrity, integrity);
  assert.equal(lock.entries[0]?.integrity, integrity);
  assert.equal(lock.entries[0]?.version, "1.0.0");
});

test("one Article source derives exactly eight score-backed deck scenes", () => {
  const compiled = compileKpSupplyTaxArticle({ text: articleText, lock });

  assert.equal(compiled.article.document.id, "lesson.economics.supply-tax");
  assert.equal(compiled.deck.scenes.length, 8);
  assert.deepEqual(compiled.deck.scenes.map(({ beat }) => beat.slug),
    compiled.score.beats.map(({ slug }) => slug));
  assert.deepEqual(compiled.deck.scenes.map(({ articleScene }) => articleScene.kind), [
    "reading", "reading", "motion", "reading", "reading", "reading", "reading", "reading"
  ]);
});

test("the tax transition is one indivisible Article motion scene", () => {
  const compiled = compileKpSupplyTaxArticle({ text: articleText, lock });
  const scene = compiled.deck.scenes[2]!.articleScene;

  assert.equal(scene.kind, "motion");
  if (scene.kind !== "motion") return;
  assert.equal(scene.id, "supply-translation");
  assert.deepEqual(scene.transition, {
    kind: "run",
    path: "lesson.economics.supply-tax#tax-market/impose-tax"
  });
  assert.match(scene.beforeMarkdown, /S_t\(Q\)=S\(Q\)\+t=6\+Q/u);
  assert.match(scene.afterMarkdown ?? "", /original supply schedule does not disappear/u);
});

test("Article focus cues retain semantic target and context roles", () => {
  const compiled = compileKpSupplyTaxArticle({ text: articleText, lock });
  const baseline = compiled.deck.scenes[0]!.articleScene;
  const deadweightLoss = compiled.deck.scenes[7]!.articleScene;

  assert.equal(baseline.kind, "reading");
  assert.equal(deadweightLoss.kind, "reading");
  if (baseline.kind !== "reading" || deadweightLoss.kind !== "reading") return;
  assert.deepEqual(baseline.focusCues[0]?.targets, [
    "lesson.economics.supply-tax#tax-market/demand",
    "lesson.economics.supply-tax#tax-market/supply",
    "lesson.economics.supply-tax#tax-market/untaxed-equilibrium",
    "lesson.economics.supply-tax#tax-market/untaxed-price"
  ]);
  assert.ok(deadweightLoss.focusCues[0]?.context.includes(
    "lesson.economics.supply-tax#tax-market/government-revenue"
  ));
});
