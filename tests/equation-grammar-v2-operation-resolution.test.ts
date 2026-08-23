import assert from "node:assert/strict";
import test from "node:test";
import {
  compileKpEquationGrammarV2,
  type KpCompiledEquationGrammarV2,
  type KpEquationGrammarV2Input
} from "../src/domain-ir/equation-grammar-v2.ts";
import {
  createKpLegacyEquationOperationCompatibilityRecord,
  isKpResolvedEquationGrammarOperationsV2,
  resolveKpEquationGrammarV2Operations
} from "../src/domain-ir/equation-grammar-v2-operation-resolution.ts";

test("v2 resolves every transition independently under one host clock", () => {
  const resolution = resolveKpEquationGrammarV2Operations(compiledFixture());
  assert.equal(resolution.status, "resolved");
  if (resolution.status !== "resolved") return;
  assert.equal(isKpResolvedEquationGrammarOperationsV2(
    resolution.resolution
  ), true);
  assert.equal(resolution.resolution.hostClock,
    "kp.shared-normalized-clock.v1");
  assert.deepEqual(
    resolution.resolution.transitions.map((transition) => ({
      transitionId: transition.transitionId,
      operationId: transition.operationId,
      source: transition.resolutionSource,
      pack: transition.operationPack
    })),
    [
      {
        transitionId: "transition.0",
        operationId: "kp.core.persist",
        source: "transition-declaration",
        pack: { packId: "kp.core", version: "1.0.0" }
      },
      {
        transitionId: "transition.1",
        operationId: "kp.core.substitute",
        source: "transition-declaration",
        pack: { packId: "kp.core", version: "1.0.0" }
      }
    ]
  );
  resolution.resolution.transitions.forEach((transition) => {
    assert.equal("clock" in transition, false);
    assert.equal("durationMs" in transition, false);
  });
});

test("unknown operations and missing or mismatched pins require repair", () => {
  const unknown = resolveKpEquationGrammarV2Operations(compiledFixture({
    operationIds: ["kp.unknown.nope", "kp.core.persist"]
  }));
  assert.equal(unknown.status, "repair-required");
  if (unknown.status === "repair-required") {
    assert.deepEqual(unknown.diagnostics.map(({ code, transitionId }) => ({
      code, transitionId
    })), [{
      code: "operation-resolution.unknown-operation",
      transitionId: "transition.0"
    }]);
  }

  const missing = resolveKpEquationGrammarV2Operations(compiledFixture({
    pins: [{ packId: "kp.semantic-motion", version: "0.1.0" }]
  }));
  assert.equal(missing.status, "repair-required");
  if (missing.status === "repair-required") {
    assert.deepEqual(new Set(missing.diagnostics.map(({ code }) => code)),
      new Set(["operation-resolution.missing-pin"]));
  }

  const mismatch = resolveKpEquationGrammarV2Operations(compiledFixture({
    pins: [{ packId: "kp.core", version: "9.0.0" }]
  }));
  assert.equal(mismatch.status, "repair-required");
  if (mismatch.status === "repair-required") {
    assert.deepEqual(new Set(mismatch.diagnostics.map(({ code }) => code)),
      new Set(["operation-resolution.version-mismatch"]));
  }
});

test("resolution refuses grammar objects that were not compiler minted", () => {
  const raw = fixture() as unknown as KpCompiledEquationGrammarV2;
  const result = resolveKpEquationGrammarV2Operations(raw);
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.diagnostics[0]?.code,
    "operation-resolution.grammar-uncompiled");
});

test("asset defaults survive only as explicit evidence-bearing legacy records", () => {
  const record = createKpLegacyEquationOperationCompatibilityRecord({
    assetId: "animation.equation.legacy",
    defaultOperationId: "kp.core.persist",
    transformationIds: ["transformation.legacy.0"],
    reason: "The v1 authoring surface predates per-transition declarations.",
    evidenceIds: ["test.legacy-equation-operation-resolution"]
  });
  assert.equal(record.compatibilityOnly, true);
  assert.equal(record.kind, "legacy-asset-default");
  assert.throws(() => createKpLegacyEquationOperationCompatibilityRecord({
    assetId: record.assetId,
    defaultOperationId: record.defaultOperationId,
    transformationIds: [],
    reason: record.reason,
    evidenceIds: []
  }), /require identity/);
});

function compiledFixture(options: {
  readonly operationIds?: readonly [string, string];
  readonly pins?: readonly { readonly packId: string; readonly version: string }[];
} = {}): KpCompiledEquationGrammarV2 {
  const input = fixture();
  const operationIds = options.operationIds ??
    ["kp.core.persist", "kp.core.substitute"];
  const result = compileKpEquationGrammarV2({
    ...input,
    semanticSource: {
      ...input.semanticSource,
      operationPacks: options.pins ?? input.semanticSource.operationPacks
    },
    transitions: input.transitions.map((transition, index) => ({
      ...transition,
      operation: {
        ...transition.operation,
        operationId: operationIds[index]!
      }
    }))
  });
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") throw new Error("Fixture did not compile.");
  return result.grammar;
}

function fixture(): KpEquationGrammarV2Input {
  return {
    schemaVersion: "kp.equation-grammar.v2",
    id: "grammar.equation.resolution",
    assetId: "animation.equation.resolution",
    policyEpochId: "policy.animation.governance-v2.preview.1",
    semanticSource: {
      sourceId: "source.equation.resolution",
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
      transition("transition.0", "state.0", "state.1", "kp.core.persist"),
      transition("transition.1", "state.1", "state.2", "kp.core.substitute")
    ]
  };
}

function transition(
  id: string,
  sourceStateId: string,
  targetStateId: string,
  operationId: string
): KpEquationGrammarV2Input["transitions"][number] {
  return {
    id,
    transformationId: `transformation.${id}`,
    sourceStateId,
    targetStateId,
    operation: {
      operationId,
      roleBindings: { source: ["entity.x"], target: ["entity.x"] },
      correspondenceMap: {
        id: `correspondence.${id}`,
        records: [{
          id: `record.${id}`,
          relation: "identity",
          sourceSelectorIds: ["entity.x"],
          targetSelectorIds: ["entity.x"],
          summary: "Fixture lineage."
        }]
      },
      semanticAuthorityIds: [`law.${operationId}`]
    },
    projection: { intent: "replacement" },
    typographyPolicyId: "typography.equation.fixture.v1",
    teachingIntent: {
      kind: "transmit",
      primaryEntityIds: ["entity.x"],
      secondaryEntityIds: [],
      summary: "Resolve this transition independently."
    }
  };
}
