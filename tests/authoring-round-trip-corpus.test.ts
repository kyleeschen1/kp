import assert from "node:assert/strict";
import test from "node:test";
import { compileKpEquationTransformSeries } from "../src/authoring/compile-equation-transform-series.ts";
import { createRoundTripLogRequest } from "./helpers/authoring-round-trip-log-request.ts";
import { roundTripUnboundChains } from "./fixtures/authoring-round-trip-chains.ts";

const canonical = createRoundTripLogRequest();
const changedTarget = structuredClone(canonical.value);
changedTarget.states[1]!.latex = "\\frac{\\ln(2)}{\\ln(7)}";
const badAssumption = { ...canonical.value, adjacencies: canonical.value.adjacencies.map(adjacency => ({
  ...adjacency, intent: { ...adjacency.intent, semanticArguments: {
    ...adjacency.intent.semanticArguments, domainEvidenceIds: {
      ...adjacency.intent.semanticArguments.domainEvidenceIds,
      sourceArgumentPositiveEvidenceId: "evidence.missing"
    }
  } }
})) };
const malformed = structuredClone(canonical.value);
malformed.states[0]!.latex = "\\frac{";
const unknown = { ...canonical.value, adjacencies: canonical.value.adjacencies.map(adjacency => ({
  ...adjacency, intent: { ...adjacency.intent, operationId: "operation.not-registered" }
})) };
const narrated = structuredClone(canonical.value);
const positives = [
  { id: "governed-log", value: canonical.value, sources: [canonical.source], expected: "compiled" },
  { id: "governed-log-narration", value: { ...narrated, states: narrated.states.map(state => ({ ...state, narration: "Read the same logarithm in a different base." })) }, sources: [canonical.source], expected: "compiled" },
  { id: "missing-source", value: canonical.value, sources: [], expected: "repair-required" },
  { id: "wrong-endpoint", value: changedTarget, sources: [canonical.source], expected: "repair-required" },
  { id: "missing-assumption", value: badAssumption, sources: [canonical.source], expected: "repair-required" },
  { id: "malformed-latex", value: malformed, sources: [canonical.source], expected: "repair-required" },
  { id: "unknown-operation", value: unknown, sources: [canonical.source], expected: "repair-required" }
];

test("R1 corpus has 24 distinct author tasks and separates bound evidence from unbound requests", () => {
  const ids = [...positives.map(row => row.id), ...roundTripUnboundChains.map(row => row[0])];
  assert.equal(ids.length, 24);
  assert.equal(new Set(ids).size, 24);
  assert.equal(new Set(roundTripUnboundChains.map(row => row[1])).size, 8);
});

for (const fixture of positives) test(`R1 corpus bound case: ${fixture.id}`, () => {
  const result = compileKpEquationTransformSeries({ value: fixture.value, governedSources: fixture.sources });
  assert.equal(result.status, fixture.expected);
  assert.equal(result.active !== undefined, fixture.expected === "compiled");
  if (result.status === "repair-required") assert.ok(result.repairs.length > 0);
});

for (const [id, domain, from, to, instruction] of roundTripUnboundChains) {
  test(`R1 corpus unbound ${domain}: ${id}`, () => {
    const result = compileKpEquationTransformSeries({ value: {
      schemaVersion: "kp.equation-transform-series-request.v1", kind: "equation-transform-series-request",
      id: `series.round-trip.${id}`,
      states: [{ id: `state.${id}.source`, latex: from }, { id: `state.${id}.target`, latex: to }],
      adjacencies: [{ id: `adjacency.${id}`, fromStateId: `state.${id}.source`, toStateId: `state.${id}.target`,
        intent: { mode: "proposed", instruction } }]
    } });
    // No planner or trusted binding is supplied: rejection is a frontend gap,
    // not a verdict that these deductions are mathematically false or absent KP-wide.
    assert.equal(result.status, "repair-required");
    assert.equal(result.active, undefined);
    assert.ok(result.repairs.length > 0);
  });
}
