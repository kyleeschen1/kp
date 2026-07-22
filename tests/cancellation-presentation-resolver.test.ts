import assert from "node:assert/strict";
import test from "node:test";
import { inferKpCancellationPresentationIntent } from "../src/semantic/cancellation-presentation-authoring.ts";
import { resolveKpCancellationPresentationRecipe } from "../src/rendering/cancellation-presentation-resolver.ts";

test("opposing arcs resolve to counter orbit on shared and distinct baselines", () => {
  const intent = inferKpCancellationPresentationIntent({
    operationId: "kp.algebra.cancel-multiplicative-inverses",
    teachingGoal: "preserve-flow"
  });

  assert.equal(resolveKpCancellationPresentationRecipe({
    intent,
    topology: { sourceCount: 2, sourceBaselines: "shared" }
  }), "counter-orbit-v1");
  assert.equal(resolveKpCancellationPresentationRecipe({
    intent,
    topology: { sourceCount: 2, sourceBaselines: "distinct" }
  }), "counter-orbit-v1");
});

test("direct convergence resolves only when its one-axis topology is safe", () => {
  const directIntent = {
    ...inferKpCancellationPresentationIntent({
      operationId: "kp.algebra.cancel-additive-inverses",
      teachingGoal: "make-identity-visible"
    }),
    approach: "direct-convergence"
  } as const;

  assert.equal(resolveKpCancellationPresentationRecipe({
    intent: directIntent,
    topology: { sourceCount: 2, sourceBaselines: "shared" }
  }), "witnessed-annihilation-v1");
  assert.equal(resolveKpCancellationPresentationRecipe({
    intent: directIntent,
    topology: { sourceCount: 2, sourceBaselines: "distinct" }
  }), undefined);
});

test("resolution refuses an incomplete cancellation source set", () => {
  assert.equal(resolveKpCancellationPresentationRecipe({
    intent: inferKpCancellationPresentationIntent({
      operationId: "kp.algebra.cancel-additive-inverses",
      teachingGoal: "preserve-flow"
    }),
    topology: { sourceCount: 1, sourceBaselines: "shared" }
  }), undefined);
});
