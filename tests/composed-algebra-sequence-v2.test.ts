import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import { checkKpComposedAlgebraProofV2 } from "../src/authoring/composed-algebra-proof-v2.ts";
import { resolveKpComposedAlgebraPresentationV2 } from "../src/authoring/composed-algebra-presentation-v2.ts";
import { composedAlgebraSequenceV2, sampleComposedAlgebraSequence } from "../src/experiments/composed-algebra/sequence.ts";

test("beats, fractions and continuous progress share the exact canonical sequence for four and five states", () => {
  for (const value of [primary, { ...primary, states: primary.states.slice(0, 4) }]) {
    const draft = resolveKpComposedAlgebraPresentationV2(checkKpComposedAlgebraProofV2(value)), sequence = composedAlgebraSequenceV2(draft);
    assert.equal(sequence.checkpointProgress, draft.checkpointProgress);
    assert.deepEqual(sequence.beats.map(beat => beat.slug), value.states.map(state => state.id));
    for (let index = 0; index < sequence.beats.length; index++) {
      const state = sampleComposedAlgebraSequence(sequence, sequence.checkpointProgress[index]!, 0);
      assert.equal(state.position, index); assert.equal(state.fraction, `${index + 1} / ${value.states.length}`);
    }
    for (const position of [1.37, .37, 2.83, .25, 0]) {
      const state = sampleComposedAlgebraSequence(sequence, sequence.checkpoints.progressAt(position), sequence.checkpoints.last);
      assert.ok(Math.abs(state.position - position) < 1e-9);
      assert.equal(state.total, value.states.length);
    }
    assert.throws(() => sampleComposedAlgebraSequence({ ...sequence }, 0, 0), /issued/);
  }
});
