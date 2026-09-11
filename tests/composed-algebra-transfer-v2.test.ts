import assert from "node:assert/strict";
import test from "node:test";
import source from "../src/authoring/examples/composed-algebra-intuition-transfer.json" with { type: "json" };
import { prepareKpComposedAlgebraDraftV2 } from "../src/authoring/composed-algebra-session-v2.ts";
import { composedAlgebraSequenceV2, composedAlgebraWindowV2, sampleComposedAlgebraSequence } from "../src/experiments/composed-algebra/sequence.ts";
import { projectComposedAlgebraSubexplanations } from "../src/experiments/composed-algebra/subexplanations.ts";

test("two-symbol transfer uses the canonical four-state chain and two-stop distribution window", () => {
  const draft = prepareKpComposedAlgebraDraftV2(source), sequence = composedAlgebraSequenceV2(draft);
  assert.equal(draft.checked.chain.steps.length, 3);
  assert.equal(draft.animation.transformations.length, 3);
  assert.equal(sequence.beats.length, 4);
  assert.equal(sampleComposedAlgebraSequence(sequence, 1, 0).fraction, "4 / 4");
  const references = projectComposedAlgebraSubexplanations(draft);
  assert.deepEqual(references.map(ref => ref.range), [[0, 2], [2, 3]]);
  const distribution = composedAlgebraWindowV2(draft, references[1]!);
  assert.equal(distribution.beats.length, 2);
  assert.equal(sampleComposedAlgebraSequence(distribution, 1, 0).fraction, "2 / 2");
  assert.match(references[1]!.setup, /x\+y/);
});
