import assert from "node:assert/strict";
import test from "node:test";
import {
  compileKpEquationGrammarV2,
  type KpCompiledEquationGrammarV2,
  type KpEquationGrammarV2Input,
  type KpEquationProjectionIntentV2
} from "../src/domain-ir/equation-grammar-v2.ts";
import {
  resolveKpEquationGrammarV2Operations,
  type KpResolvedEquationGrammarOperationsV2
} from "../src/domain-ir/equation-grammar-v2-operation-resolution.ts";
import {
  createKpEquationProjectionChoreographyRegistryV2,
  isKpResolvedEquationProjectionChoreographiesV2,
  kpEquationProjectionChoreographyRegistryV2,
  resolveKpEquationProjectionChoreographiesV2
} from "../src/domain-ir/equation-projection-choreography-v2.ts";

test("one semantic operation projects through three representation topologies", () => {
  const { grammar, operations } = fixture([
    "replacement", "equivalence", "derivation"
  ]);
  const result = resolveKpEquationProjectionChoreographiesV2({
    grammar,
    operations
  });
  assert.equal(result.status, "resolved");
  if (result.status !== "resolved") return;
  assert.equal(isKpResolvedEquationProjectionChoreographiesV2(
    result.choreography
  ), true);
  assert.deepEqual(result.choreography.transitions.map(({ profile }) => ({
    intent: profile.intent,
    retention: profile.retentionPolicy,
    source: profile.sourceSettlement
  })), [
    {
      intent: "replacement",
      retention: "replacement",
      source: "retire-after-transit"
    },
    {
      intent: "equivalence",
      retention: "equivalence-frame",
      source: "retain-frozen-context"
    },
    {
      intent: "derivation",
      retention: "derivation-trail",
      source: "promote-to-history"
    }
  ]);
  result.choreography.transitions.forEach((transition, index) => {
    assert.strictEqual(
      transition.semanticOperation,
      operations.transitions[index]
    );
    assert.equal(transition.semanticOperation.operationId, "kp.core.persist");
  });
});

test("projection profiles contain no semantic operation copies or motion", () => {
  kpEquationProjectionChoreographyRegistryV2.entries.forEach((profile) => {
    assert.equal("operationId" in profile, false);
    assert.equal("durationMs" in profile, false);
    assert.equal("path" in profile, false);
    assert.equal("coordinates" in profile, false);
  });
});

test("mismatched operation resolutions and missing profiles fail closed", () => {
  const first = fixture(["replacement"]);
  const second = fixture(["replacement"], "grammar.other");
  const mismatch = resolveKpEquationProjectionChoreographiesV2({
    grammar: first.grammar,
    operations: second.operations
  });
  assert.equal(mismatch.status, "repair-required");
  if (mismatch.status === "repair-required") {
    assert.equal(mismatch.diagnostics[0]?.code,
      "projection-choreography.operation-mismatch");
  }

  const missing = resolveKpEquationProjectionChoreographiesV2({
    grammar: first.grammar,
    operations: first.operations,
    registry: createKpEquationProjectionChoreographyRegistryV2({
      entries: kpEquationProjectionChoreographyRegistryV2.entries.filter(
        ({ intent }) => intent !== "replacement"
      )
    })
  });
  assert.equal(missing.status, "repair-required");
  if (missing.status === "repair-required") {
    assert.equal(missing.diagnostics[0]?.code,
      "projection-choreography.unregistered-intent");
  }
});

test("projection registry rejects duplicate intents", () => {
  const replacement = kpEquationProjectionChoreographyRegistryV2.entries[0]!;
  assert.throws(() => createKpEquationProjectionChoreographyRegistryV2({
    entries: [replacement, {
      ...replacement,
      id: "kp.projection-choreography.replacement-copy.v2" as never
    }]
  }), /Duplicate projection intent replacement/);
});

function fixture(
  intents: readonly KpEquationProjectionIntentV2[],
  grammarId = "grammar.equation.projections"
): {
  readonly grammar: KpCompiledEquationGrammarV2;
  readonly operations: KpResolvedEquationGrammarOperationsV2;
} {
  const states = Array.from({ length: intents.length + 1 }, (_, index) => ({
    id: `state.${index}`,
    objectIds: [`object.${index}`],
    entityIds: ["entity.x"]
  }));
  const input: KpEquationGrammarV2Input = {
    schemaVersion: "kp.equation-grammar.v2",
    id: grammarId,
    assetId: `animation.${grammarId}`,
    policyEpochId: "policy.animation.governance-v2.preview.1",
    semanticSource: {
      sourceId: `source.${grammarId}`,
      revisionId: "revision.1",
      operationPacks: [{ packId: "kp.core", version: "1.0.0" }]
    },
    clock: { authority: "kp.shared-normalized-clock.v1" },
    states,
    transitions: intents.map((intent, index) => ({
      id: `transition.${index}`,
      transformationId: `transformation.${index}`,
      sourceStateId: `state.${index}`,
      targetStateId: `state.${index + 1}`,
      operation: {
        operationId: "kp.core.persist",
        semanticClass: "transformation",
        roleBindings: { before: ["entity.x"], after: ["entity.x"] },
        correspondenceMap: {
          id: `correspondence.${index}`,
          records: [{
            id: `record.${index}`,
            relation: "identity",
            sourceSelectorIds: ["entity.x"],
            targetSelectorIds: ["entity.x"],
            summary: "The entity persists across projections."
          }]
        },
        semanticAuthorityIds: ["law.fixture.persistence"]
      },
      projection: { intent },
      typographyPolicyId: "typography.equation.fixture.v1",
      teachingIntent: {
        kind: "transmit",
        primaryEntityIds: ["entity.x"],
        secondaryEntityIds: [],
        summary: "Change only representation topology."
      }
    }))
  };
  const compiled = compileKpEquationGrammarV2(input);
  assert.equal(compiled.status, "compiled");
  if (compiled.status !== "compiled") throw new Error("Fixture failed.");
  const resolved = resolveKpEquationGrammarV2Operations(compiled.grammar);
  assert.equal(resolved.status, "resolved");
  if (resolved.status !== "resolved") throw new Error("Resolution failed.");
  return { grammar: compiled.grammar, operations: resolved.resolution };
}
