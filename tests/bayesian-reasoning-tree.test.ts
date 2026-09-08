import { test } from "node:test";
import assert from "node:assert/strict";
import { createFlaggedTicketSource, BinaryJointModel } from "../domains/probability/binary-joint-model.ts";
import { compileBinaryProbabilityTrace } from "../domains/probability/binary-probability-trace.ts";
import { createBayesTreePlan, sampleBayesTree } from "../src/experiments/bayesian-reasoning/tree-frame.ts";
import { renderBayesTreeSvg } from "../src/experiments/bayesian-reasoning/tree-svg.ts";

test("tree sampling preserves four semantic owners, exact masses and explicit population transitions", () => {
  const plan = createBayesTreePlan(compileBinaryProbabilityTrace(BinaryJointModel.from(createFlaggedTicketSource())));
  const samples = [0, .5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];
  const forward = samples.map(position => sampleBayesTree(plan, position));
  assert.deepEqual([...samples].reverse().map(position => sampleBayesTree(plan, position)).reverse(), forward);
  for (const frame of forward) {
    assert.deepEqual(frame.leaves.map(leaf => leaf.id), plan.trace.model.outcomes.map(outcome => outcome.id));
    assert.deepEqual(frame.leaves.map(leaf => leaf.mass), plan.trace.model.outcomes.map(outcome => outcome.mass));
    assert.equal(new Set(frame.hierarchy.map(entity => entity.id)).size, frame.hierarchy.length);
  }
  assert.equal(sampleBayesTree(plan, 3).referencePopulationId, plan.rootId);
  assert.equal(sampleBayesTree(plan, 4).referencePopulationId, plan.marginalId);
  assert.equal(sampleBayesTree(plan, 5).referencePopulationId, plan.rootId);
  assert.equal(sampleBayesTree(plan, 6).referencePopulationId, plan.rootId);
  assert.equal(sampleBayesTree(plan, 0).leaves.every(leaf => leaf.presence === 0), true);
  assert.equal(sampleBayesTree(plan, 6).leaves.every(leaf => leaf.presence === 1), true);
  const ordered = [...sampleBayesTree(plan, 6).leaves].sort((a, b) => a.y - b.y).map(leaf => leaf.key);
  assert.deepEqual(ordered, ["tt", "ft", "tf", "ff"]);
  assert.throws(() => sampleBayesTree(plan, NaN), /seven semantic stops/);
  // Protect the semantic owner's full label box, not merely its center point.
  for (const position of [2.1, 2.2, 2.5, 2.8, 2.9, 4.2, 4.5, 4.8, 5.3, 5.5, 5.7]) {
    const leaves = sampleBayesTree(plan, position).leaves;
    for (const [i, left] of leaves.entries()) for (const right of leaves.slice(i + 1))
      assert.ok(Math.abs(left.x - right.x) >= 170 || Math.abs(left.y - right.y) >= 58, `overlapping joint owners at ${position}`);
  }
  const html = renderBayesTreeSvg(plan);
  assert.equal((html.match(/data-bayes-outcome=/g) ?? []).length, 4);
  assert.match(html, /role="img"/);
});

test("accepted Bayes motif keeps endpoints, collision clearance and named attention at every sample", () => {
  const plan = createBayesTreePlan(compileBinaryProbabilityTrace(BinaryJointModel.from(createFlaggedTicketSource())));
  const initial = sampleBayesTree(plan, 0), joint = sampleBayesTree(plan, 2), gathered = sampleBayesTree(plan, 3), flipped = sampleBayesTree(plan, 6);
  assert.equal(initial.rootX, 350);
  assert.equal(joint.rootX, 60);
  assert.equal(joint.branchPresence, 1);
  assert.equal(gathered.branchPresence, 0);
  assert.equal(gathered.gather, 1);
  assert.equal(flipped.targetPresence, 1);
  assert.equal(flipped.branchPresence, 0);
  const known = new Set(plan.scene.registry.entities.map(entity => entity.id));
  for (let sample = 0; sample <= 600; sample++) {
    const frame = sampleBayesTree(plan, sample / 100);
    assert.ok(frame.hierarchy.every(entity => known.has(entity.id)));
    assert.ok(frame.hierarchy.some(entity => entity.salience === "focus"));
    for (const [index, left] of frame.leaves.entries()) for (const right of frame.leaves.slice(index + 1))
      assert.ok(Math.abs(left.x - right.x) >= 170 || Math.abs(left.y - right.y) >= 58, `collision at ${frame.position}`);
    assert.deepEqual(frame, sampleBayesTree(plan, sample / 100));
  }
});
