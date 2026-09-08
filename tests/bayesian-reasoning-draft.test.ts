import test from "node:test";
import assert from "node:assert/strict";
import { checkBayesDraft, createBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { sampleBayesTree } from "../src/experiments/bayesian-reasoning/tree-frame.ts";
import { runBayesAuthoringCli } from "../scripts/author-bayesian-reasoning.ts";

function compiled(value: unknown) {
  const result = checkBayesDraft(JSON.stringify(value));
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") throw new Error(JSON.stringify(result));
  return result.draft;
}
test("author checker accepts both exact source forms and pins semantic edits", () => {
  const source = createBayesDraft(), original = compiled(source);
  const { masses: _masses, ...base } = source.model;
  const rates = compiled({ ...source, model: { ...base, kind: "prior-likelihoods", prior: "1/5", likelihoods: ["4/5", "1/10"] } });
  assert.equal(original.revisionId, rates.revisionId);
  const changed = structuredClone(source);
  changed.model.masses = ["8/100", "12/100", "16/100", "64/100"];
  assert.notEqual(compiled(changed).revisionId, original.revisionId);
  changed.model.events[0]!.label = "<new label>";
  const labeled = compiled(changed);
  assert.match(labeled.score[0]!.html, /&lt;new label&gt;/);
  assert.equal(labeled.notation.query.value.numerator, 1n);
  assert.equal(labeled.notation.query.value.denominator, 3n);
  assert.equal(Object.isFrozen(labeled.model), true);
  assert.equal(compiled({ ...source, teaching: { ...source.teaching, detailLevel: "key-steps" } }).trace.states.length, 7);
  assert.notEqual(compiled({ ...source, teaching: { ...source.teaching, detailLevel: "key-steps" } }).revisionId, original.revisionId);
});

test("author order edits update branches, prose and leaf geometry without changing probability truth", () => {
  const source = createBayesDraft(), original = compiled(source);
  source.teaching.firstEventId = "flagged";
  const swapped = compiled(source);
  assert.notEqual(swapped.authority.revisionId, original.authority.revisionId);
  assert.deepEqual(swapped.model.outcomes, original.model.outcomes);
  assert.equal(swapped.tree.initial.first, 1);
  assert.equal(swapped.tree.reordered.first, 0);
  assert.match(swapped.score[1]!.html, /into B and not B/);
  assert.match(swapped.score[6]!.html, /Branch on A first, then B/);
  for (const [position, tree] of [[2, swapped.tree.initial], [6, swapped.tree.reordered]] as const) {
    const frame = sampleBayesTree(swapped.tree, position);
    tree.branches.forEach((branch, branchIndex) => {
      if (branch.status === "reachable") branch.leaves.forEach((leaf, leafIndex) => {
        assert.equal(frame.leaves.find(candidate => candidate.id === leaf.outcome.id)!.y, 75 + (branchIndex * 2 + leafIndex) * 90);
      });
    });
  }
  for (let sample = 0; sample <= 600; sample++) {
    const frame = sampleBayesTree(swapped.tree, sample / 100);
    frame.leaves.forEach((a, i) => frame.leaves.slice(i + 1).forEach(b => {
      assert.ok(Math.abs(a.x - b.x) >= 170 || Math.abs(a.y - b.y) >= 58, `overlap at ${sample / 100}`);
    }));
  }
});

test("malformed and unsupported authorship returns located repairs, never fallback animation", () => {
  for (const json of ["{", " ".repeat(100_001), "null", "[]"]) assert.equal(checkBayesDraft(json).status, "repair-gap");
  const source = createBayesDraft();
  for (const [value, path] of [
    [{ ...source, operations: ["invent-law"] }, "$.operations"],
    [{ ...source, timing: 1 }, "$.timing"],
    [{ ...source, geometry: {} }, "$.geometry"],
    [{ ...source, teaching: { ...source.teaching, firstEventId: "missing" } }, "$.teaching.firstEventId"],
    [{ ...source, teaching: { ...source.teaching, detailLevel: "whatever" } }, "$.teaching.detailLevel"],
    [{ ...source, model: { ...source.model, masses: ["1/1", "1/1", "0/1", "0/1"] } }, "$.model.masses"],
  ] as const) {
    const result = checkBayesDraft(JSON.stringify(value));
    assert.equal(result.status, "repair-gap");
    if (result.status === "repair-gap") assert.equal(result.diagnostic.path, path);
  }
  assert.deepEqual(runBayesAuthoringCli(["--example"]), source);
  assert.equal((runBayesAuthoringCli(["--unknown"]) as { status: string }).status, "repair-gap");
});
