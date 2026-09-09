import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { checkBayesDraft, createBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { renderBayesCardRevision } from "../src/experiments/bayesian-reasoning/page.ts";
import { projectBayesReading } from "../src/experiments/bayesian-reasoning/readings.ts";
import { projectBayesPrompts } from "../src/experiments/bayesian-reasoning/prompts.ts";
import { createBayesDisplayUnits } from "../src/experiments/bayesian-reasoning/display-units.ts";
import { sha256 } from "../src/kernel/sha256.ts";

test("editorial extension preserves the accepted v1 revision and exact default projections", () => {
  const result = checkBayesDraft(JSON.stringify(createBayesDraft()));
  assert.equal(result.status, "compiled"); if (result.status !== "compiled") return;
  const d = result.draft;
  // These pre-extension hashes pin the compatibility path, not new editorial aesthetics.
  assert.equal(d.revisionId, "sha256:31ba2d4acf89a34b33533e516efebcc2cb9fa7ef1744b633ea652701b0c3ec91");
  assert.equal(d.authority.revisionId, "sha256:00af6d2fe0a7eb140b8951017265eb7d661f554bd6780d2983a62bc22d9b1100");
  assert.equal(sha256(renderBayesCardRevision(d)), "6b2a1d53c7acd3682bcb8b0e36571ca6b00d84ec747ca9f4f64c6d520095da93");
  assert.equal(sha256(projectBayesReading(d, "full").html), "d2301c25d20f72d62b4e284b86be34ed1dde60c1bf3053b3ba604bfd0b7a6f17");
  assert.equal(sha256(projectBayesReading(d, "compact").html), "028f56efda4642709fa00fc8eaa56ff24ab586608a5cdb6e1eb5e22ab8f0db9c");
  assert.equal(sha256(JSON.stringify(projectBayesPrompts(d).map(p => p.card))), "e3f6288722b0cf0f2b6f2383c043227121192d63afb319832e26395a8299f545");
});

test("spam-filter task uses exact existing probability and native display mechanisms", () => {
  const result = checkBayesDraft(readFileSync("content/authoring/r4b-spam-filter.bayes.json", "utf8"));
  assert.equal(result.status, "compiled"); if (result.status !== "compiled") return;
  const d = result.draft, units = createBayesDisplayUnits(d.model);
  assert.equal(units.unit, 2000n);
  assert.deepEqual(d.model.outcomes.map(o => units.count(o.mass)), [18n, 2n, 99n, 1881n]);
  assert.equal(units.count(d.tree.query.denominator), 117n);
  assert.deepEqual(d.tree.query.value, { numerator: 2n, denominator: 13n });
  assert.equal(d.trace.states.length, 7);
  assert.deepEqual(d.score.map(s => s.slug), ["population", "first-branches", "joint-tree", "marginal", "conditioned", "full-population", "reordered"]);
});
