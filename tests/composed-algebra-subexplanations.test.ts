import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import { compile } from "../src/authoring/algebra/compile.ts";
import { projectComposedAlgebraSubexplanations } from "../src/experiments/composed-algebra/subexplanations.ts";
import { composedAlgebraWindowV2, sampleComposedAlgebraSequence } from "../src/experiments/composed-algebra/sequence.ts";
import { captureComposedAlgebraPositionV2, resolveComposedAlgebraPositionV2 } from "../src/experiments/composed-algebra/practice.ts";

test("both independently entered questions retain context and exact parent references without copying motion", () => {
  const draft = compile(primary), references = projectComposedAlgebraSubexplanations(draft);
  assert.deepEqual(references.map(ref => ref.kind), ["collect", "distribute"]);
  for (const ref of references) {
    const sequence = composedAlgebraWindowV2(draft, ref), [start, end] = ref.range;
    assert.match(ref.question, /\?$/); assert.match(ref.setup, /x.*3/);
    assert.ok(ref.answer.length > 60);
    assert.equal(ref.parent, draft);
    assert.deepEqual(sequence.beats.map(beat => beat.slug), draft.checked.source.states.slice(start, end + 1).map(state => state.id));
    assert.equal(sampleComposedAlgebraSequence(sequence, draft.checkpointProgress[start]!, 0).fraction, "1 / 3");
    assert.equal(sampleComposedAlgebraSequence(sequence, draft.checkpointProgress[end]!, 0).fraction, "3 / 3");
    assert.ok(ref.references.every(item => item.revisionId === draft.revisionId && item.sourceId === draft.checked.source.id));
    assert.throws(() => composedAlgebraWindowV2(draft, { ...ref }), /issued/);
    assert.throws(() => composedAlgebraWindowV2(compile(primary), ref), /exact/);
  }
});

test("exact return reuses existing reference protocol and rejects changed revision or reference", () => {
  const draft = compile(primary);
  for (const progress of [0, .137, .4999, .625, 1]) {
    const position = captureComposedAlgebraPositionV2(draft, progress);
    assert.equal(resolveComposedAlgebraPositionV2(draft, JSON.parse(JSON.stringify(position))), progress);
    assert.throws(() => resolveComposedAlgebraPositionV2(draft, { ...position, revisionId: "old" }), /another/);
    assert.throws(() => resolveComposedAlgebraPositionV2(draft, { ...position, referenceId: "unrelated" }), /another/);
  }
});
