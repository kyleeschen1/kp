import assert from "node:assert/strict";
import test from "node:test";
import { inferKpCancellationPresentationIntent } from "../src/semantic/cancellation-presentation-authoring.ts";
import {
  resolveKpCancellationPresentation,
  resolveKpCancellationPresentationRecipe
} from "../src/rendering/cancellation-presentation-resolver.ts";

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

test("unsafe distinct-baseline convergence returns an actionable intent repair", () => {
  const intent = {
    ...inferKpCancellationPresentationIntent({
      operationId: "kp.algebra.cancel-multiplicative-inverses",
      teachingGoal: "preserve-flow"
    }),
    approach: "direct-convergence"
  } as const;
  const repair = resolveKpCancellationPresentation({
    intent,
    topology: { sourceCount: 2, sourceBaselines: "distinct" }
  });

  assert.deepEqual(repair, {
    kind: "repair-intent",
    issue: "distinct-baselines-require-two-axis-contact",
    repairedIntent: { ...intent, approach: "opposing-arcs" }
  });
  assert.equal(Object.isFrozen(repair), true);
  if (repair.kind === "repair-intent") {
    assert.equal(Object.isFrozen(repair.repairedIntent), true);
    assert.deepEqual(resolveKpCancellationPresentation({
      intent: repair.repairedIntent,
      topology: { sourceCount: 2, sourceBaselines: "distinct" }
    }), { kind: "resolved", recipe: "counter-orbit-v1" });
  }
});

test("incomplete semantic sources return a topology repair, never a fallback", () => {
  const result = resolveKpCancellationPresentation({
    intent: inferKpCancellationPresentationIntent({
      operationId: "kp.algebra.cancel-additive-inverses",
      teachingGoal: "preserve-flow"
    }),
    topology: { sourceCount: 1, sourceBaselines: "shared" }
  });
  assert.deepEqual(result, {
    kind: "repair-source-topology",
    issue: "incomplete-cancellation-source-set",
    minimumSourceCount: 2
  });
});
