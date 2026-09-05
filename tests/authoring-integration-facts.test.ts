import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { KpArticleImportLock } from "../src/article/kp-article-import-lock.ts";
import { createKpAuthoredMarketSource } from "../src/experiments/typed-linear-supply-demand/authoring-market-source.ts";
import { createKpAuthoringMarketFacts, KpAuthoringMarketFactGap, renderKpAuthoringMarketStaticFacts } from "../src/experiments/authoring-market/authoring-market-facts.ts";
import { authorKpMarketArticle } from "../src/experiments/authoring-market/authoring-market-article-source.ts";
import { createKpAuthoringMarketCompanion, KpAuthoringMarketCompanionError } from "../src/experiments/authoring-market/authoring-market-companion.ts";
import { kpSupplyTaxScrollScoreStageFacts } from "../src/experiments/kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-stage-lens.ts";

const lock = JSON.parse(readFileSync(new URL("../content/lessons/economics-supply-tax-scroll-score.kp.lock.json", import.meta.url), "utf8")) as KpArticleImportLock;
const canonical = () => createKpAuthoredMarketSource({ kind: "impose-per-unit-tax" });

test("explicit tax-four facts preserve canonical formulas and bind Article and plain static output", () => {
  const authored = canonical();
  const facts = createKpAuthoringMarketFacts(authored);
  assert.deepEqual(facts.stageFacts, kpSupplyTaxScrollScoreStageFacts);
  assert.equal(facts.text("before.quantity"), "5");
  assert.equal(facts.latex("after.consumerSurplus"), "\\frac{9}{2}");
  assert.equal(facts.text("after.revenue"), "12");
  const article = authorKpMarketArticle(facts);
  const companion = createKpAuthoringMarketCompanion({ authored, text: article.text, boundArticle: article, lock });
  assert.equal(companion.stops.length, 8);
  assert.equal(companion.stageFacts, facts.stageFacts);
  assert.match(companion.score.beats[0]!.claim, /5 units.*7/);
  const staticHtml = renderKpAuthoringMarketStaticFacts(facts);
  assert.match(staticHtml, /<dt>after.revenue<\/dt><dd>12<\/dd>/);
  assert.match(staticHtml, /<dt>after.consumerSurplus<\/dt><dd>9\/2<\/dd>/);
  assert.doesNotMatch(staticHtml, /<script|katex|canvas|requestAnimationFrame/);
  assert.equal(facts.ref("before.quantity").address.kind, "settled");
  assert.equal(facts.ref("after.quantity").modelRevisionId, authored.source.authority.revisionId);
});

test("unknown, missing, cloned and foreign fact capabilities fail explicitly", () => {
  const authored = canonical();
  const facts = createKpAuthoringMarketFacts(authored);
  const foreign = createKpAuthoringMarketFacts(authored);
  // @ts-expect-error Only the closed fact-name union is addressable.
  assert.throws(() => facts.ref("after.arbitraryExpression"), KpAuthoringMarketFactGap);
  // @ts-expect-error A missing capability cannot be evaluated.
  assert.throws(() => facts.read(undefined), KpAuthoringMarketFactGap);
  assert.throws(() => facts.read({ ...facts.ref("after.revenue") }), KpAuthoringMarketFactGap);
  assert.throws(() => facts.read(foreign.ref("after.revenue")), KpAuthoringMarketFactGap);
});

test("declared slots recompute for another model without scanning or rewriting prose", () => {
  const authored = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax", parameters: {
    demandPriceIntercept: { numerator: "14", denominator: "1" }, taxAmount: { numerator: "2", denominator: "1" }
  } });
  const facts = createKpAuthoringMarketFacts(authored);
  const article = authorKpMarketArticle(facts);
  const companion = createKpAuthoringMarketCompanion({ authored, text: article.text, boundArticle: article, lock });
  assert.match(article.text, /Q_0=6/);
  assert.match(article.text, /P_0=8/);
  assert.match(article.text, /P_p=7/);
  assert.match(article.text, /2\\cdot5=10/);
  assert.equal(facts.text("after.totalSurplus"), "35");
  assert.match(companion.score.beats[3]!.claim, /receive 7/);
  assert.throws(() => createKpAuthoringMarketCompanion({ authored: canonical(), text: article.text,
    boundArticle: article, lock }), KpAuthoringMarketCompanionError);
  const edited = { ...article, text: article.text.replace("Before the tax, demand", "In this example, demand") };
  assert.match(createKpAuthoringMarketCompanion({ authored, text: edited.text, boundArticle: edited, lock }).stops[0]!.phrase.label, /In this example/);
  const source = readFileSync(new URL("../src/experiments/authoring-market/authoring-market-article-source.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /eval\(|new Function|\.replace\(/);
});
