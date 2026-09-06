import assert from "node:assert/strict";
import test from "node:test";
import { createKpAuthoredDistributionExplanation } from "../src/experiments/authoring-structural/distribution-explanation.ts";
import { createKpAuthoredSimplificationExplanation } from "../src/experiments/authoring-structural/simplification-explanation.ts";
import { createKpSemanticProgress } from "../src/semantic-state/semantic-progress.ts";
import { pinKpAggregateSemanticSnapshot } from "../src/semantic-state/pinned-recovery.ts";

test("interleaved callers retain isolated revisions and bounded history across query cache disposal", () => {
  const distribution = createKpAuthoredDistributionExplanation("cross.distribution");
  const simplification = createKpAuthoredSimplificationExplanation("cross.simplification");
  const first = distribution.createSession();
  const second = simplification.createSession();
  const retained = [JSON.stringify(distribution.explanation.chain), JSON.stringify(simplification.explanation.chain)];
  const d = distribution.authored.model.handles.refs.accessibleEquation;
  const s = simplification.authored.model.handles.refs.notation;
  for (let i = 0; i <= 64; i++) {
    const progress = createKpSemanticProgress(BigInt(i % 2 ? 64 - i : i), 64n);
    first.evaluate(distribution.at(progress), d);
    second.evaluate(simplification.at(progress), s);
    assert.ok(first.inspect().entries <= 2); assert.ok(second.inspect().entries <= 2);
    assert.equal(first.history.snapshots.length, 2); assert.equal(second.history.snapshots.length, 2);
  }
  assert.throws(() => first.recover(pinKpAggregateSemanticSnapshot(simplification.explanation.chain.after)), /no snapshot/);
  assert.throws(() => second.recover(pinKpAggregateSemanticSnapshot(distribution.explanation.chain.after)), /no snapshot/);
  first.dispose();
  assert.equal(second.evaluate(simplification.after, s), "2");
  second.reset();
  assert.equal(second.evaluate(simplification.before, s), "2 \\times 1");
  second.dispose();
  assert.deepEqual([JSON.stringify(distribution.explanation.chain), JSON.stringify(simplification.explanation.chain)], retained);
});
