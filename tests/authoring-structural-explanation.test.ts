import assert from "node:assert/strict";
import test from "node:test";
import { createKpAuthoredDistributionExplanation } from "../src/experiments/authoring-structural/distribution-explanation.ts";
import { defineKpAuthoredDistributionFamily } from "../src/experiments/authoring-structural/distribution-family.ts";
import { createKpSemanticProgress } from "../src/semantic-state/semantic-progress.ts";
import { pinKpAggregateSemanticSnapshot } from "../src/semantic-state/pinned-recovery.ts";

test("structural explanation has named addresses, discrete truth and bounded non-history samples", () => {
  const data = createKpAuthoredDistributionExplanation("explanation.distribution");
  const session = data.createSession();
  const target = data.authored.model.handles.refs.accessibleEquation;
  const initial = session.evaluate(data.before, target);
  const final = session.evaluate(data.after, target);
  assert.notEqual(initial, final);
  assert.equal(data.explanation.handles.root.name, "distribute");
  for (const n of [8n, 1n, 9n, 3n, 8n]) {
    assert.equal(session.evaluate(data.at(createKpSemanticProgress(n, 10n)), target), initial);
    assert.ok(session.inspect().entries <= 2);
  }
  assert.equal(session.evaluate(data.at(createKpSemanticProgress(1n, 1n)), target), final);
  assert.equal(session.history.snapshots.length, 2);
  const pin = pinKpAggregateSemanticSnapshot(data.explanation.chain.after);
  session.reset();
  assert.equal(session.recover(pin), data.explanation.chain.after);
  assert.equal(session.evaluate(data.after, target), final);
  session.dispose();
  assert.throws(() => session.recover(pin), /disposed/);
});

test("prepared family applications cannot reuse a receipt against a later snapshot", () => {
  const data = createKpAuthoredDistributionExplanation("explanation.stale");
  const family = defineKpAuthoredDistributionFamily(data.receipt);
  const prepared = family.prepareApplication({ applicationId: "again", sourceId: "test.again", parameters: { operation: "distribute" } });
  assert.throws(() => family.applyPreparedApplication(data.explanation.chain.after, prepared), /Repin/);
  assert.throws(() => family.apply(data.explanation.chain.before, { applicationId: "wrong", sourceId: "test.wrong",
    parameters: { operation: "generic-update" } as never }), /only applies verified/);
});
