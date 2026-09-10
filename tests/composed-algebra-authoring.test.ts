import assert from "node:assert/strict";
import test from "node:test";
import { compileKpEquationTransformSeries } from "../src/authoring/compile-equation-transform-series.ts";

// Explicit operation names describe a requested chain, not mathematical proof.
function unverifiedChain(middle: string, final: string) {
  return { schemaVersion: "kp.equation-transform-series-request.v1", kind: "equation-transform-series-request",
    id: "series.composed-algebra.probe",
    states: ["2*(x+3)+3*(x+3)", middle, final].map((latex, i) => ({ id: `state.${i}`, latex })),
    adjacencies: ["kp.algebra.factor-common-term", "kp.algebra.simplify-constant-sum"].map((operationId, i) => ({
      id: `edge.${i}`, fromStateId: `state.${i}`, toStateId: `state.${i+1}`,
      intent: { mode: "explicit", operationId, semanticArguments: {} }
    })) };
}

test("valid-looking and invalid mixed chains cannot gain authority from operation labels", () => {
  for (const [middle, final] of [
    ["(2+3)*(x+3)", "5*(x+3)"],
    ["(2+4)*(x+3)", "6*(x+3)"],
    ["(2+3)*(x+3)", "6*(x+3)"],
    ["(2+3)*(x+3)", "5*(x+4)"]
  ]) {
    const result = compileKpEquationTransformSeries({ value: unverifiedChain(middle!, final!) });
    assert.equal(result.status, "repair-required");
    assert.equal(result.active, undefined);
    assert.ok(result.repairs.length > 0);
    assert.ok(result.repairs.every(repair => repair.path.startsWith("$")));
  }
});

test("disconnected chain endpoints cannot be repaired by a renderer", () => {
  const value = unverifiedChain("(2+3)*(x+3)", "5*(x+3)");
  value.adjacencies[1]!.fromStateId = "state.foreign";
  const result = compileKpEquationTransformSeries({ value });
  assert.equal(result.status, "repair-required");
  assert.equal(result.active, undefined);
});
