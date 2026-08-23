import assert from "node:assert/strict";
import test from "node:test";
import {
  compileKpEquationGrammarV2,
  type KpCompiledEquationGrammarV2,
  type KpEquationGrammarTransitionV2,
  type KpEquationGrammarV2Input
} from "../src/domain-ir/equation-grammar-v2.ts";
import {
  createKpEquationTypographyPolicyRegistryV2,
  kpEquationTypographyPolicyRegistryV2,
  resolveKpEquationTypographyV2
} from "../src/domain-ir/equation-typography-policy-v2.ts";

test("flow, TeX math style, and optical scale resolve independently", () => {
  const result = resolveKpEquationTypographyV2({
    grammar: fixture("typography.equation.inline.v2")
  });
  assert.equal(result.status, "resolved");
  if (result.status !== "resolved") return;
  const policy = result.typography[0]!.policy;
  assert.deepEqual(policy.flow, { kind: "inline-with-prose" });
  assert.deepEqual(policy.mathStyle, { kind: "text" });
  assert.deepEqual(policy.scale, { profile: "prose", relativeEm: 1 });
  assert.equal("displayMode" in policy, false);
});

test("large operators require semantic identity and compatible typography", () => {
  const sum = {
    entityId: "entity.sum",
    kind: "sum" as const,
    limitPlacement: "bounds" as const
  };
  const result = resolveKpEquationTypographyV2({
    grammar: fixture("typography.equation.large-operator.v2", [sum])
  });
  assert.equal(result.status, "resolved");
  if (result.status !== "resolved") return;
  assert.equal(result.typography[0]!.policy.mathStyle.kind, "display");
  assert.deepEqual(result.typography[0]!.semanticLargeOperators, [sum]);

  const inline = resolveKpEquationTypographyV2({
    grammar: fixture("typography.equation.inline.v2", [sum])
  });
  assert.equal(inline.status, "repair-required");
  if (inline.status === "repair-required") {
    assert.equal(inline.diagnostics[0]?.code,
      "typography.unsupported-large-operator");
  }
  const missing = resolveKpEquationTypographyV2({
    grammar: fixture("typography.equation.large-operator.v2")
  });
  assert.equal(missing.status, "repair-required");
  if (missing.status === "repair-required") {
    assert.equal(missing.diagnostics[0]?.code,
      "typography.large-operator-required");
  }
});

test("unknown policies and invalid registries fail closed", () => {
  const unknown = resolveKpEquationTypographyV2({
    grammar: fixture("typography.equation.unknown.v2")
  });
  assert.equal(unknown.status, "repair-required");
  if (unknown.status === "repair-required") {
    assert.equal(unknown.diagnostics[0]?.code, "typography.unknown-policy");
  }
  const stage = kpEquationTypographyPolicyRegistryV2.policies[1]!;
  assert.throws(() => createKpEquationTypographyPolicyRegistryV2({
    policies: [stage, { ...stage, scale: { ...stage.scale, relativeEm: 0 } }]
  }), /Duplicate equation typography policy|positive scale/);
});

test("grammar rejects large-operator requirements for foreign entities", () => {
  const input = fixtureInput("typography.equation.large-operator.v2", [{
    entityId: "entity.foreign",
    kind: "sum",
    limitPlacement: "bounds"
  }]);
  const result = compileKpEquationGrammarV2(input);
  assert.equal(result.status, "invalid");
  if (result.status !== "invalid") return;
  assert.equal(result.diagnostics.some(({ code }) =>
    code === "grammar.typography"), true);
});

function fixture(
  typographyPolicyId: `typography.equation.${string}`,
  largeOperators: KpEquationGrammarTransitionV2["typographyRequirements"]["largeOperators"] = []
): KpCompiledEquationGrammarV2 {
  const result = compileKpEquationGrammarV2(
    fixtureInput(typographyPolicyId, largeOperators)
  );
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") throw new Error("Fixture failed.");
  return result.grammar;
}

function fixtureInput(
  typographyPolicyId: `typography.equation.${string}`,
  largeOperators: KpEquationGrammarTransitionV2["typographyRequirements"]["largeOperators"]
): KpEquationGrammarV2Input {
  return {
    schemaVersion: "kp.equation-grammar.v2",
    id: "grammar.equation.typography",
    assetId: "animation.equation.typography",
    policyEpochId: "policy.animation.governance-v2.preview.1",
    semanticSource: {
      sourceId: "source.equation.typography",
      revisionId: "revision.1",
      operationPacks: [{ packId: "kp.core", version: "1.0.0" }]
    },
    clock: { authority: "kp.shared-normalized-clock.v1" },
    states: [
      {
        id: "state.0",
        objectIds: ["object.0"],
        entityIds: ["entity.sum", "entity.x"]
      },
      {
        id: "state.1",
        objectIds: ["object.1"],
        entityIds: ["entity.sum", "entity.x"]
      }
    ],
    transitions: [{
      id: "transition.0",
      transformationId: "transformation.0",
      sourceStateId: "state.0",
      targetStateId: "state.1",
      operation: {
        operationId: "kp.core.persist",
        semanticClass: "transformation",
        roleBindings: { before: ["entity.x"], after: ["entity.x"] },
        correspondenceMap: {
          id: "correspondence.0",
          records: [{
            id: "record.0",
            relation: "identity",
            sourceSelectorIds: ["entity.x"],
            targetSelectorIds: ["entity.x"],
            summary: "Fixture lineage."
          }]
        },
        semanticAuthorityIds: ["law.fixture.persistence"]
      },
      projection: { intent: "replacement" },
      typographyPolicyId,
      typographyRequirements: { largeOperators },
      teachingIntent: {
        kind: "notice",
        primaryEntityIds: ["entity.x"],
        secondaryEntityIds: [],
        summary: "Resolve typography semantically."
      }
    }]
  };
}
