import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compileKpCanonicalTaxSource } from "../scripts/compile-canonical-tax-source.ts";
import { prepareKpAuthoredMarketSource } from "../src/experiments/authoring-market/authoring-market-prepare.ts";
import { buildKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-build.ts";
import { bindKpCanonicalTaxInstruction, KpCanonicalTaxInstructionGap } from "../src/experiments/kinetic-figure-supply-tax/canonical-tax-instruction.ts";
import { createKpAuthoringMarketCompanion } from "../src/experiments/authoring-market/authoring-market-companion.ts";
import { kpSupplyTaxScrollScoreStageFacts } from "../src/experiments/kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-stage-lens.ts";

const text = readFileSync(new URL("../content/lessons/economics-supply-tax-scroll-score.kp.md", import.meta.url), "utf8");
const lock = JSON.parse(readFileSync(new URL("../content/lessons/economics-supply-tax-scroll-score.kp.lock.json", import.meta.url), "utf8"));

test("prepared canonical instruction preserves exact Article, claims, eight stops and native formulas", () => {
  const { data } = compileKpCanonicalTaxSource();
  const prepared = prepareKpAuthoredMarketSource(data);
  const original = createKpAuthoringMarketCompanion({ authored: prepared.authored, text, lock });
  assert.equal(prepared.boundArticle.text, text);
  assert.deepEqual(prepared.companion.compiled, original.compiled);
  assert.deepEqual(prepared.companion.score, original.score);
  assert.deepEqual(prepared.companion.scrollScore, original.scrollScore);
  assert.deepEqual(prepared.companion.stops, original.stops);
  assert.deepEqual(prepared.companion.stageFacts, kpSupplyTaxScrollScoreStageFacts);
  assert.equal(prepared.companion.stops.length, 8);
  assert.equal(prepared.companion.modelRevisionId, prepared.facts.modelRevisionId);
  assert.equal(prepared.boundArticle.modelRevisionId, prepared.facts.modelRevisionId);
  for (const beat of prepared.companion.score.beats) assert.doesNotMatch(beat.claim, /\\frac|\\cdot/);
});

test("a different model cannot inherit the reviewed literal reference instruction", () => {
  assert.throws(() => bindKpCanonicalTaxInstruction(buildKpAuthoringMarketPreview("variation"), text), KpCanonicalTaxInstructionGap);
  const data = compileKpCanonicalTaxSource().data;
  assert.throws(() => prepareKpAuthoredMarketSource({ ...data, article: { ...data.article, modelRevisionId: "foreign" } }), /one explicit revision/);
  assert.throws(() => bindKpCanonicalTaxInstruction(buildKpAuthoringMarketPreview("reference"), text.replace("kp-ref:tax-market/tax", "kp-ref:tax-market/missing")), /Article/);
});
