import assert from "node:assert/strict";
import test from "node:test";
import {
  compileKpEquationGrammarV2,
  isKpCompiledEquationGrammarV2,
  type KpEquationGrammarV2Input
} from "../src/domain-ir/equation-grammar-v2.ts";

function fixture(): KpEquationGrammarV2Input {
  return {
    schemaVersion: "kp.equation-grammar.v2",
    id: "grammar.equation.two-step",
    assetId: "animation.equation.two-step",
    policyEpochId: "policy.animation.governance-v2.preview.1",
    semanticSource: {
      sourceId: "source.equation.two-step",
      revisionId: "revision.1",
      operationPacks: [{ packId: "kp.core", version: "1.0.0" }]
    },
    clock: { authority: "kp.shared-normalized-clock.v1" },
    states: [
      { id: "state.0", objectIds: ["object.0"], entityIds: ["entity.x"] },
      { id: "state.1", objectIds: ["object.1"], entityIds: ["entity.x"] },
      { id: "state.2", objectIds: ["object.2"], entityIds: ["entity.y"] }
    ],
    transitions: [
      transition("transition.0", "state.0", "state.1", "kp.core.persist", "entity.x"),
      transition("transition.1", "state.1", "state.2", "kp.core.substitute", "entity.x", "entity.y")
    ]
  };
}

test("v2 mints a distinct grammar with per-transition authority", () => {
  const result = compileKpEquationGrammarV2(fixture());
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  assert.equal(isKpCompiledEquationGrammarV2(result.grammar), true);
  assert.equal(result.grammar.schemaVersion, "kp.equation-grammar.v2");
  assert.equal(result.grammar.operationResolution, "per-transition");
  assert.deepEqual(
    result.grammar.transitions.map(({ operation }) => operation.operationId),
    ["kp.core.persist", "kp.core.substitute"]
  );
  assert.equal(result.grammar.presentationAuthority, "policy-and-registries");
});

test("v2 rejects caller timing, paths, display mode, and asset defaults", () => {
  const input = {
    ...fixture(),
    durationMs: 900,
    displayMode: true,
    assetDefaultOperationId: "kp.core.persist"
  } as KpEquationGrammarV2Input;
  const result = compileKpEquationGrammarV2(input);
  assert.equal(result.status, "invalid");
  if (result.status !== "invalid") return;
  assert.deepEqual(
    result.diagnostics.map(({ path }) => path),
    ["$.durationMs", "$.displayMode", "$.assetDefaultOperationId"]
  );
});

test("v2 rejects missing transition operations and foreign role entities", () => {
  const base = fixture();
  const result = compileKpEquationGrammarV2({
    ...base,
    transitions: [{
      ...base.transitions[0]!,
      operation: {
        ...base.transitions[0]!.operation,
        operationId: "",
        roleBindings: { mover: ["entity.foreign"] },
        semanticAuthorityIds: []
      }
    }]
  });
  assert.equal(result.status, "invalid");
  if (result.status !== "invalid") return;
  assert.equal(result.diagnostics.some(({ code }) =>
    code === "grammar.operation"
  ), true);
  assert.equal(result.diagnostics.some(({ code }) =>
    code === "grammar.reference"
  ), true);
});

test("v2 requires correspondence, projection, typography, and the shared clock", () => {
  const base = fixture();
  const result = compileKpEquationGrammarV2({
    ...base,
    clock: { authority: "caller-clock" as never },
    transitions: [{
      ...base.transitions[0]!,
      operation: {
        ...base.transitions[0]!.operation,
        correspondenceMap: { id: "map.empty", records: [] }
      },
      projection: { intent: "unknown" as never },
      typographyPolicyId: "caller.display-mode" as never
    }]
  });
  assert.equal(result.status, "invalid");
  if (result.status !== "invalid") return;
  assert.deepEqual(new Set(result.diagnostics.map(({ code }) => code)), new Set([
    "grammar.clock",
    "grammar.correspondence",
    "grammar.projection",
    "grammar.typography"
  ]));
});

function transition(
  id: string,
  sourceStateId: string,
  targetStateId: string,
  operationId: string,
  sourceEntityId: string,
  targetEntityId = sourceEntityId
): KpEquationGrammarV2Input["transitions"][number] {
  return {
    id,
    transformationId: `transformation.${id}`,
    sourceStateId,
    targetStateId,
    operation: {
      operationId,
      roleBindings: { source: [sourceEntityId], target: [targetEntityId] },
      correspondenceMap: {
        id: `correspondence.${id}`,
        records: [{
          id: `record.${id}`,
          relation: sourceEntityId === targetEntityId ? "identity" : "role-change",
          sourceSelectorIds: [sourceEntityId],
          targetSelectorIds: [targetEntityId],
          summary: "Fixture lineage."
        }]
      },
      semanticAuthorityIds: [`law.${operationId}`]
    },
    projection: { intent: "replacement" },
    typographyPolicyId: "typography.equation.fixture.v1",
    teachingIntent: {
      kind: "transmit",
      primaryEntityIds: [targetEntityId],
      secondaryEntityIds: [],
      summary: "Follow the semantic transition."
    }
  };
}
