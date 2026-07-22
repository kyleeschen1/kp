import assert from "node:assert/strict";
import test from "node:test";
import { compileKpGeneratedCancellationPresentation } from "../src/animation/generated-cancellation-presentation-boundary.ts";

test("generated cancellation receives a governed recipe", () => {
  assert.deepEqual(compileKpGeneratedCancellationPresentation({
    operationId: "kp.algebra.cancel-multiplicative-inverses",
    teachingGoal: "preserve-flow",
    topology: { sourceCount: 2, sourceBaselines: "distinct" }
  }), {
    kind: "accepted",
    resolution: { kind: "resolved", recipe: "counter-orbit-v1" }
  });
});

test("generated cancellation receives typed repair instead of fallback", () => {
  assert.deepEqual(compileKpGeneratedCancellationPresentation({
    operationId: "kp.algebra.cancel-additive-inverses",
    teachingGoal: "preserve-flow",
    topology: { sourceCount: 1, sourceBaselines: "shared" }
  }), {
    kind: "repair",
    resolution: {
      kind: "repair-source-topology",
      issue: "incomplete-cancellation-source-set",
      minimumSourceCount: 2
    }
  });
});

test("generated output cannot control recipe geometry timing or typography", () => {
  const result = compileKpGeneratedCancellationPresentation({
    operationId: "kp.algebra.cancel-additive-inverses",
    teachingGoal: "preserve-flow",
    topology: { sourceCount: 2, sourceBaselines: "shared" },
    recipe: "witnessed-annihilation-v1",
    durationMs: 20,
    fontFamily: "Comic Sans"
  });
  assert.deepEqual(result, {
    kind: "rejected",
    issues: ["unsupported generated fields: durationMs, fontFamily, recipe"]
  });
});
