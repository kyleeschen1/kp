import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import transfer from "../src/authoring/examples/composed-algebra-intuition-transfer.json" with { type: "json" };
import { prepareKpComposedAlgebraDraftV2 } from "../src/authoring/composed-algebra-session-v2.ts";
import { projectComposedAlgebraReadingV2 } from "../src/experiments/composed-algebra/readings.ts";

test("Full and Compact retain all extended endpoints context and revision-pinned references", () => {
  for (const source of [primary, transfer]) {
    const draft = prepareKpComposedAlgebraDraftV2(source);
    for (const mode of ["full", "compact"] as const) {
      const reading = projectComposedAlgebraReadingV2(draft, mode);
      assert.deepEqual(reading.facts.states, source.states.map(({ id, latex }) => ({ id, latex })));
      assert.equal(reading.facts.operationIds.length, source.states.length - 1);
      assert.equal(reading.references.length, source.states.length * 2 - 1);
      assert.ok(reading.references.every(ref => ref.revisionId === draft.revisionId));
      assert.match(reading.html, /Required context/);
      assert.match(reading.html, /katex/);
      assert.equal(reading.revisionId, draft.revisionId);
    }
    assert.throws(() => projectComposedAlgebraReadingV2({ ...draft }, "full"), /issued/);
  }
});
