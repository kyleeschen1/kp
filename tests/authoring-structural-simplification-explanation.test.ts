import assert from "node:assert/strict";
import test from "node:test";
import { createKpAuthoredSimplificationExplanation, createKpAuthoredSimplificationModel, pinKpAuthoredSimplificationSelection, defineKpAuthoredSimplificationFamily } from "../src/experiments/authoring-structural/simplification-explanation.ts";
import { createKpSemanticProgress } from "../src/semantic-state/semantic-progress.ts";
import { pinKpAggregateSemanticSnapshot } from "../src/semantic-state/pinned-recovery.ts";

test("simplification uses retained aggregate versions and bounded discrete queries", () => {
  const data = createKpAuthoredSimplificationExplanation();
  const session = data.createSession();
  const ref = data.authored.model.handles.refs.notation;
  assert.equal(session.evaluate(data.before, ref), "2 \\times 1");
  assert.equal(session.evaluate(data.after, ref), "2");
  for (const n of [9n, 1n, 5n, 9n, 0n, 10n, 2n]) {
    assert.equal(session.evaluate(data.at(createKpSemanticProgress(n, 10n)), ref), n === 10n ? "2" : "2 \\times 1");
    assert.ok(session.inspect().entries <= 2);
  }
  assert.equal(session.history.snapshots.length, 2);
  assert.equal(data.definition.selection.recover(session.history).id, data.definition.selection.reference.selectorId);
  const targetPin = pinKpAggregateSemanticSnapshot(data.explanation.chain.after);
  session.reset();
  assert.equal(session.recover(targetPin), data.explanation.chain.after);
  session.dispose();
  assert.throws(() => session.evaluate(data.after, ref), /disposed/);
});

test("simplification selection rejects stale or foreign occurrences without changing its predecessor", () => {
  const data = createKpAuthoredSimplificationExplanation("simplification.pins");
  const family = data.definition;
  const before = JSON.stringify(data.explanation.chain.before);
  const prepared = family.prepareApplication({ applicationId: "again", sourceId: "test", parameters: { operation: "simplify" } });
  assert.throws(() => family.applyPreparedApplication(data.explanation.chain.after, prepared), /Repin/);
  assert.throws(() => family.selection.assertCurrent(createKpAuthoredSimplificationModel("foreign").model.initial), /selected simplification/);
  assert.throws(() => pinKpAuthoredSimplificationSelection({ authored: data.authored, snapshot: data.explanation.chain.before, selectorId: "2" }), /existing semantic occurrence/);
  assert.equal(JSON.stringify(data.explanation.chain.before), before);
  assert.throws(() => defineKpAuthoredSimplificationFamily({ ...data.authored, target: { ...data.authored.target, value: { latex: "3" } } }), /source integrity/);
});
