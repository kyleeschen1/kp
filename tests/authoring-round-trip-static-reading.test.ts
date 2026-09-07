import assert from "node:assert/strict";
import test from "node:test";
import { buildKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-build.ts";
import { compileKpAuthoredTaxSource } from "../scripts/compile-canonical-tax-source.ts";
import { compileKpAuthoringMarketStaticReading as market, compileKpAuthoringEquationStaticReading as equation } from "../src/experiments/authoring-market/authoring-market-static-reading.ts";
import { createKpEquationSeriesLogarithmBaseExample } from "../src/authoring/equation-series-logarithm-base-example.ts";

test("reading-only market output preserves author prose, exact facts and semantic links without stale figures", () => {
  const source = buildKpAuthoringMarketPreview("variation");
  const text = source.article.text.replace("How does a tax reshape a market?", "A separately authored reading title");
  const result = market(compileKpAuthoredTaxSource({ ...source, article: { ...source.article, text } }));
  assert.equal(result.mode, "text-and-exact-facts");
  assert.match(result.html, /A separately authored reading title/);
  assert.match(result.html, /<dt>after.revenue<\/dt><dd>10<\/dd>/);
  assert.match(result.html, /<math /);
  assert.match(result.html, /graphical motion is not included/);
  assert.doesNotMatch(result.html, /<script|<img|<iframe|<canvas|economics-supply-tax-baseline.svg/);
  for (const match of result.html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(result.html.includes(`id="${match[1]}"`), `Missing semantic target ${match[1]}`);
  }
});

test("equation static output retains ordered native MathML and rejects invalid drafts", () => {
  const { value } = createKpEquationSeriesLogarithmBaseExample();
  const html = equation(value);
  assert.equal((html.match(/<math /g) ?? []).length, 2);
  assert.equal((html.match(/<li>/g) ?? []).length, 2);
  assert.match(html, /positive base other than one/);
  assert.doesNotMatch(html, /<script|katex-error/);
  assert.throws(() => equation({ ...value, states: [] }), /Repair the equation draft/);
});
