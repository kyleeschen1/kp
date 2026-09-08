import test from "node:test";
import assert from "node:assert/strict";
import { checkBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { createUrnBayesDraft } from "../src/experiments/bayesian-reasoning/urn-source.ts";
import { projectBayesPrompts } from "../src/experiments/bayesian-reasoning/prompts.ts";
import { compileBayesPublication } from "../scripts/build-bayesian-edition.ts";
import { runBayesAuthoringCli } from "../scripts/author-bayesian-reasoning.ts";

test("second original problem is source-only and reuses every probability projection", () => {
  const source = createUrnBayesDraft(), result = checkBayesDraft(JSON.stringify(source));
  assert.equal(result.status, "compiled"); if (result.status !== "compiled") return;
  const draft = result.draft;
  assert.equal(draft.trace.states.length, 7); assert.equal(draft.trace.operations.length, 6);
  assert.equal(draft.tree.initial.first, 1); assert.equal(draft.tree.reordered.first, 0);
  assert.deepEqual(draft.model.outcomes.map(outcome => `${outcome.mass.numerator}/${outcome.mass.denominator}`), ["1/8", "3/8", "3/8", "1/8"]);
  assert.equal(draft.notation.query.value.numerator, 1n); assert.equal(draft.notation.query.value.denominator, 4n);
  assert.equal(projectBayesPrompts(draft)[0]!.direction, "lower");
  const publication = compileBayesPublication(JSON.stringify(source), "urn.json");
  assert.equal(publication.payload.revisionId, draft.revisionId);
  assert.equal(publication.payload.context.posterior, "1/4");
  assert.deepEqual(runBayesAuthoringCli(["--example", "urn"]), source);
});
