import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpBothSidesCausalRecipe,
  isKpBothSidesCausalRecipe,
  runKpBothSidesCausalRecipeReverseLaw
} from "../src/animation/both-sides-causal-recipe.ts";
import {
  verifyKpBothSidesOperation,
  type KpBothSidesOperationDraft
} from "../src/semantic/both-sides-operation-family.ts";

test("the causal recipe owns exactly four semantic phases", () => {
  const operation = verifyKpBothSidesOperation(addDraft());
  const recipe = compileKpBothSidesCausalRecipe({
    operation,
    direction: "forward"
  });
  assert.equal(isKpBothSidesCausalRecipe(recipe), true);
  assert.deepEqual(recipe.phases.map(({ id }) => id), [
    "prepare-branches",
    "synchronize-application",
    "preserve-relation",
    "settle-branches"
  ]);
  assert.deepEqual(recipe.phases[1], {
    id: "synchronize-application",
    action: "apply",
    synchronization: "same-causal-beat",
    applications: [
      { side: "lhs", entityIds: ["target.lhs.plus-three"] },
      { side: "rhs", entityIds: ["target.rhs.plus-three"] }
    ]
  });
});

test("forward and rewind exchange endpoints without changing identity", () => {
  const operation = verifyKpBothSidesOperation(addDraft());
  const forward = compileKpBothSidesCausalRecipe({
    operation,
    direction: "forward"
  });
  const rewind = compileKpBothSidesCausalRecipe({
    operation,
    direction: "rewind"
  });
  assert.deepEqual(
    runKpBothSidesCausalRecipeReverseLaw({ forward, rewind }),
    []
  );
  assert.equal(forward.phases[0].endpoint, "source");
  assert.equal(forward.phases[3].endpoint, "target");
  assert.equal(rewind.phases[0].endpoint, "target");
  assert.equal(rewind.phases[3].endpoint, "source");
  assert.equal(rewind.phases[1].action, "withdraw");
});

test("injective function application uses the same causal grammar", () => {
  const operation = verifyKpBothSidesOperation(logDraft());
  const recipe = compileKpBothSidesCausalRecipe({
    operation,
    direction: "forward"
  });
  assert.equal(recipe.operationKind, "apply-injective-function");
  assert.equal(recipe.lawId, "law.equation.apply-injective-function");
  assert.deepEqual(
    recipe.phases[1].applications.flatMap(({ entityIds }) => entityIds),
    ["target.lhs.ln-wrapper", "target.rhs.ln-wrapper"]
  );
});

test("the causal layer has no timing, geometry, topology, or optics authority", () => {
  const operation = verifyKpBothSidesOperation(addDraft());
  const recipe = compileKpBothSidesCausalRecipe({
    operation,
    direction: "forward"
  });
  const serialized = JSON.stringify(recipe);
  for (const forbidden of [
    "duration",
    "window",
    "path",
    "route",
    "topology",
    "opacity",
    "scale",
    "coordinate",
    "geometry"
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
  assert.throws(
    () => compileKpBothSidesCausalRecipe({
      operation,
      direction: "forward",
      durationMs: 500
    } as unknown as Parameters<typeof compileKpBothSidesCausalRecipe>[0]),
    /accepts only operation and direction/
  );
});

test("raw semantic drafts cannot bypass operation verification", () => {
  assert.throws(
    () => compileKpBothSidesCausalRecipe({
      operation: addDraft() as unknown as ReturnType<
        typeof verifyKpBothSidesOperation
      >,
      direction: "forward"
    }),
    /verifier-minted semantic authority/
  );
});

function addDraft(): KpBothSidesOperationDraft {
  return {
    ...base("operation.add"),
    operation: { kind: "add", operandSemanticId: "semantic.value.three" },
    lawAuthority: {
      id: "law.equation.add-both-sides",
      authorityRefId: "definition.generated.linear-solve.add-both-sides",
      level: "strict"
    },
    domainEvidence: {
      kind: "declared-relation-domain",
      evidenceIds: ["evidence.real-equality"]
    }
  };
}

function logDraft(): KpBothSidesOperationDraft {
  const common = base("operation.apply-log");
  return {
    ...common,
    branches: {
      lhs: {
        ...common.branches.lhs,
        appliedEntityIds: ["target.lhs.ln-wrapper"]
      },
      rhs: {
        ...common.branches.rhs,
        appliedEntityIds: ["target.rhs.ln-wrapper"]
      }
    },
    operation: {
      kind: "apply-injective-function",
      functionSemanticId: "semantic.function.ln",
      lhsArgumentSemanticId: "semantic.argument.lhs",
      rhsArgumentSemanticId: "semantic.argument.rhs"
    },
    lawAuthority: {
      id: "law.equation.apply-injective-function",
      authorityRefId: "transformation.log-exponent.apply-log-both-sides",
      level: "strict"
    },
    domainEvidence: {
      kind: "injective-function-domain",
      functionSemanticId: "semantic.function.ln",
      lhsDomainEvidenceId: "assumption.log-exponent.power-positive",
      rhsDomainEvidenceId: "assumption.log-exponent.right-positive",
      injectivityEvidenceId: "assumption.log-exponent.log-injective"
    }
  };
}

function base(id: string) {
  return {
    schemaVersion: "kp.both-sides-operation.v1" as const,
    id,
    relation: {
      kind: "equality" as const,
      semanticId: "semantic.relation.equal",
      sourceEntityId: "source.equals",
      targetEntityId: "target.equals"
    },
    branches: {
      lhs: {
        side: "lhs" as const,
        sourceExpressionEntityIds: ["source.lhs"] as const,
        targetExpressionEntityIds: ["target.lhs"] as const,
        appliedEntityIds: ["target.lhs.plus-three"] as const
      },
      rhs: {
        side: "rhs" as const,
        sourceExpressionEntityIds: ["source.rhs"] as const,
        targetExpressionEntityIds: ["target.rhs"] as const,
        appliedEntityIds: ["target.rhs.plus-three"] as const
      }
    }
  };
}
