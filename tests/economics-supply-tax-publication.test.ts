import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { KpArticleImportLock } from
  "../src/article/kp-article-import-lock.ts";
import { compileKpSupplyTaxStaticPublication } from
  "../src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-publication.ts";

const articleText = readFileSync(
  "content/lessons/economics-supply-tax.kp.md",
  "utf8"
);
const importLock = JSON.parse(readFileSync(
  "content/lessons/economics-supply-tax.kp.lock.json",
  "utf8"
)) as KpArticleImportLock;

test("static supply-tax publication contains every explanation once", () => {
  const publication = compilePublication();
  const phrases = [
    "This first state is the reference",
    "Now impose a per-unit tax",
    "Translate buyer-facing supply",
    "The original supply schedule does not disappear",
    "The tax does not create one new market price",
    "not merely movement on the page",
    "Private surplus therefore falls",
    "Revenue changes who receives surplus",
    "The accounting now closes"
  ];

  for (const phrase of phrases) {
    assert.equal(count(publication.articleHtml, phrase), 1, phrase);
  }
  assert.doesNotMatch(publication.articleHtml, /:::kp-|::after/u);
  assert.doesNotMatch(publication.articleHtml, /hidden[^>]*>[^<]*(This first state|Now impose)/u);
});

test("publication is semantic HTML with build-time accessible KaTeX", () => {
  const publication = compilePublication();

  assert.match(publication.articleHtml, /^<article data-kp-article=/u);
  assert.match(publication.articleHtml, /<h1 id="how-does-a-per-unit-tax-change-a-competitive-market">/u);
  assert.match(publication.articleHtml, /class="katex-mathml"/u);
  assert.equal(publication.math.renderer, "katex-build-time");
  assert.equal(publication.math.clientRuntimeRequired, false);
  assert.ok(publication.math.inlineCount > 20);
  assert.match(publication.tocHtml, /Identify deadweight loss/u);
});

test("static checkpoints and reduced motion resolve without client history", () => {
  const publication = compilePublication();
  const stage = publication.accessibility.stages[0]!;

  assert.deepEqual(publication.staticAssets.map(({ checkpointId }) => checkpointId), [
    "baseline-market",
    "supply-translation"
  ]);
  assert.deepEqual(stage.reducedMotionSeeks, [{
    transitionId: "impose-tax",
    fromCheckpointId: "lesson.economics.supply-tax#tax-market/baseline-market",
    toCheckpointId: "lesson.economics.supply-tax#tax-market/supply-translation",
    behavior: "direct-checkpoint-seek"
  }]);
});

function compilePublication() {
  return compileKpSupplyTaxStaticPublication({ articleText, importLock });
}

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}
