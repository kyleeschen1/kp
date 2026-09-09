import assert from "node:assert/strict";
import test from "node:test";
import { checkBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { editorialFixture } from "./fixtures/bayes-editorial-source.ts";

function compile(value: unknown) {
  const result = checkBayesDraft(JSON.stringify(value));
  if (result.status !== "compiled") throw new Error(result.diagnostic.expected);
  return result.draft;
}
test("editorial revision is deterministic and distinct from probability evidence", () => {
  const raw = editorialFixture(), initial = compile(raw);
  const reordered = compile({ editorial: { ...raw.editorial, prompts: {
    reconstruction: raw.editorial.prompts.reconstruction, prediction: raw.editorial.prompts.prediction } },
    teaching: raw.teaching, model: Object.fromEntries(Object.entries(raw.model).reverse()), schemaVersion: raw.schemaVersion });
  assert.equal(initial.revisionId, reordered.revisionId);
  assert.equal(initial.sourceText, reordered.sourceText);
  const spaced = checkBayesDraft(JSON.stringify(raw, null, 4));
  assert.equal(spaced.status === "compiled" && spaced.draft.revisionId, initial.revisionId);
  raw.editorial.setup = ["A revised explanation."];
  const edited = compile(raw);
  assert.notEqual(edited.revisionId, initial.revisionId);
  assert.equal(edited.authority.revisionId, initial.authority.revisionId);
  assert.deepEqual(edited.trace.operations.map(op => op.id), initial.trace.operations.map(op => op.id));
  const changed = compile({ ...raw, model: { kind: "prior-likelihoods", sourceId: raw.model.sourceId,
    events: raw.model.events, prior: "1/100", likelihoods: ["9/10", "1/20"] } });
  assert.notEqual(changed.authority.revisionId, edited.authority.revisionId);
  assert.notEqual(changed.revisionId, edited.revisionId);
  assert.equal(changed.editorial?.passages[0]!.body, "The selected share is 2/13");
});

test("invalid editorial references never acquire prepared revision authority", () => {
  const raw = editorialFixture(); raw.editorial.passages[2]!.stateId = "other.state.joint-tree";
  const result = checkBayesDraft(JSON.stringify(raw));
  assert.equal(result.status, "repair-gap");
  if (result.status === "repair-gap") assert.equal(result.diagnostic.path, "$.editorial.passages[2].stateId");
  assert.equal("draft" in result, false);
});
