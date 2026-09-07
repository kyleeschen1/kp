import assert from "node:assert/strict";
import test from "node:test";
import { compileKpEquationSeriesLogarithmBaseExample as compile,
  createKpEquationSeriesLogarithmBaseExample as example } from "../src/authoring/equation-series-logarithm-base-example.ts";
import { sampleKpEquationSeriesRuntime } from "../src/authoring/equation-series-runtime.ts";

test("successive invalid equation edits retain the last valid deterministic candidate", () => {
  const { value } = example();
  const valid = compile(value);
  assert.equal(valid.status, "compiled");
  const adjacency = value.adjacencies[0]!;
  const arguments_ = adjacency.intent.semanticArguments;
  const drafts: unknown[] = [
    { ...value, states: [value.states[0], { ...value.states[1], latex: "\\frac{\\ln(2)}{\\ln(7)}" }] },
    { ...value, states: [value.states[0], { ...value.states[1], latex: "\\frac{" }] },
    { ...value, adjacencies: [{ ...adjacency, intent: { mode: "proposed", instruction: "Maybe expand or simplify" } }] },
    { ...value, adjacencies: [{ ...adjacency, intent: { ...adjacency.intent,
      semanticArguments: { ...arguments_, sourcePin: { ...arguments_.sourcePin, revisionId: "revision.stale" } } } }] },
    { ...value, adjacencies: [{ ...adjacency, intent: { ...adjacency.intent,
      semanticArguments: { ...arguments_, domainEvidenceIds: {} } } }] }
  ];
  let previous = valid;
  for (const draft of drafts) {
    const invalid = compile(draft, previous);
    assert.equal(invalid.status, "repair-required");
    assert.equal(invalid.active, valid.active);
    assert.ok(invalid.repairs.length > 0);
    for (const repair of invalid.repairs) {
      assert.ok(repair.path.startsWith("$"));
      assert.ok(repair.sourceCode.length > 0);
      assert.ok(repair.message.length > 0);
      assert.ok(repair.action.kind.length > 0);
    }
    for (const progress of [0, 0.25, 1, 0.75, 0]) {
      assert.deepEqual(sampleKpEquationSeriesRuntime(invalid.active!.runtime, { direction: "forward", progress }),
        sampleKpEquationSeriesRuntime(valid.active!.runtime, { direction: "forward", progress }));
    }
    previous = invalid;
  }
  const repaired = compile(value, previous);
  assert.equal(repaired.status, "compiled");
  assert.deepEqual(repaired.active, valid.active);
  assert.deepEqual(repaired.repairs, []);
});

test("an invalid first draft never creates a fallback candidate", () => {
  const invalid = compile({});
  assert.equal(invalid.status, "repair-required");
  assert.equal(invalid.active, undefined);
});
