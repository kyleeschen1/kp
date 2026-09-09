import assert from "node:assert/strict";
import test from "node:test";
import { compileKpEquationTransformSeries } from "../src/authoring/compile-equation-transform-series.ts";
import { createDistributionFactoringAnimationAsset } from "../src/animation/distribution-adapter.ts";

function request(before: string, after: string) {
  return { schemaVersion: "kp.equation-transform-series-request.v1", kind: "equation-transform-series-request",
    id: "series.common-factor.test", states: [{ id: "state.before", latex: before }, { id: "state.after", latex: after }],
    adjacencies: [{ id: "edge.factor", fromStateId: "state.before", toStateId: "state.after",
      intent: { mode: "explicit", operationId: "kp.algebra.factor-common-term", semanticArguments: {} } }] };
}

test("baseline: an explicit factoring label compiles a candidate, not a verified deduction", () => {
  // s08 replaces this characterization with fail-closed governed-family tests.
  // Do not preserve invalid candidate acceptance as a compatibility requirement.
  for (const [before, after] of [["a*b+a*c", "a*(b+c)"], ["a*b+a*c", "a*(b+d)"], ["2*x+2*y", "3*(x+y)"]]) {
    const result = compileKpEquationTransformSeries({ value: request(before!, after!) });
    assert.equal(result.status, "compiled");
    assert.equal(result.active?.runtime.plans[0]?.authority, "explicit-request");
  }
});

test("baseline: ordinary implicit factoring notation returns a located syntax repair", () => {
  const result = compileKpEquationTransformSeries({ value: request("ab+ac", "a(b+c)") });
  assert.equal(result.status, "repair-required");
  assert.ok(result.repairs.some(r => r.sourceCode === "equation-series.endpoint.unsupported-syntax" && r.path === "$.states[1].latex"));
});

test("existing factoring fixture has distinct fan-in identity and exactly one operation", () => {
  const asset = createDistributionFactoringAnimationAsset();
  assert.equal(asset.id, "animation.generated.distribution.factor-common-a");
  assert.equal(asset.transformations.length, 1);
  assert.equal(asset.transformations[0]!.transformType, "factorCommonTerm");
  assert.equal(asset.transformations[0]!.correspondenceMap!.records.filter(r => r.relation === "fan-in").length, 1);
});
