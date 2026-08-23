import assert from "node:assert/strict";
import test from "node:test";
import {
  compileKpEquationGrammarV2,
  type KpCompiledEquationGrammarV2,
  type KpEquationGrammarV2Input
} from "../src/domain-ir/equation-grammar-v2.ts";
import {
  createKpEquationEvaluationAuthorityRegistryV2,
  kpEquationEvaluationAuthorityRegistryV2,
  resolveKpEquationEvaluationAuthoritiesV2,
  validateKpEquationEvaluationAuthorityFamilyProfilesV2
} from "../src/domain-ir/equation-evaluation-authority-registry-v2.ts";

test("mandatory registry covers every approved evaluation class", () => {
  assert.deepEqual(
    new Set(kpEquationEvaluationAuthorityRegistryV2.entries.map(
      ({ evaluationKind }) => evaluationKind
    )),
    new Set([
      "product", "quotient", "difference", "sum", "cancellation",
      "identity", "successor", "root"
    ])
  );
  assert.equal(kpEquationEvaluationAuthorityRegistryV2.genericFallback,
    "forbidden");
  assert.equal(
    kpEquationEvaluationAuthorityRegistryV2.callerAuthoredEvaluation,
    "forbidden"
  );
});

test("evaluation transitions receive only registry-owned authorities", () => {
  const grammar = compiledGrammar([
    ["kp.arithmetic.multiply", "evaluation"],
    ["kp.arithmetic.divide", "evaluation"],
    ["kp.arithmetic.subtract", "evaluation"],
    ["kp.arithmetic.add", "evaluation"],
    ["kp.algebra.cancel-additive-inverses", "evaluation"],
    ["kp.semantic-motion.absorb-additive-identity", "evaluation"],
    ["kp.core.merge", "evaluation"]
  ]);
  const result = resolveKpEquationEvaluationAuthoritiesV2({ grammar });
  assert.equal(result.status, "resolved");
  if (result.status !== "resolved") return;
  assert.deepEqual(result.evaluations.map(({ evaluationKind }) =>
    evaluationKind), [
    "product", "quotient", "difference", "sum", "cancellation",
    "identity", "successor"
  ]);
  assert.ok(result.evaluations.every(({ resolutionSource }) =>
    resolutionSource === "mandatory-evaluation-registry"));
  assert.ok(result.evaluations.every(({ presentationAuthority }) =>
    presentationAuthority.kind.startsWith("registered-")));
});

test("review-stage difference registration closes the authority claim", () => {
  assert.deepEqual(validateKpEquationEvaluationAuthorityFamilyProfilesV2(), []);
  const result = resolveKpEquationEvaluationAuthoritiesV2({
    grammar: compiledGrammar([["kp.arithmetic.subtract", "evaluation"]])
  });
  assert.equal(result.status, "resolved");
  if (result.status !== "resolved") return;
  assert.equal(result.evaluations[0]?.evaluationKind, "difference");
});

test("unregistered evaluations and misclassified registered operations fail", () => {
  const unregistered = resolveKpEquationEvaluationAuthoritiesV2({
    grammar: compiledGrammar([["project.evaluate.magic", "evaluation"]])
  });
  assert.equal(unregistered.status, "repair-required");
  if (unregistered.status === "repair-required") {
    assert.equal(unregistered.diagnostics[0]?.code,
      "evaluation-authority.unregistered");
  }
  const misclassified = resolveKpEquationEvaluationAuthoritiesV2({
    grammar: compiledGrammar([["kp.arithmetic.add", "transformation"]])
  });
  assert.equal(misclassified.status, "repair-required");
  if (misclassified.status === "repair-required") {
    assert.equal(misclassified.diagnostics[0]?.code,
      "evaluation-authority.misclassified");
  }
});

test("registry construction rejects duplicate operations and generic routes", () => {
  const entry = kpEquationEvaluationAuthorityRegistryV2.entries[0]!;
  assert.throws(() => createKpEquationEvaluationAuthorityRegistryV2({
    entries: [entry, { ...entry, id: `${entry.id}.duplicate` }]
  }), /Duplicate evaluation operation/);
  assert.throws(() => createKpEquationEvaluationAuthorityRegistryV2({
    entries: [{
      ...entry,
      id: "kp.evaluation-authority.invalid",
      presentationAuthority: { kind: "generic-fade" } as never
    }]
  }), /registered presentation/);
});

test("caller evaluation family and timing remain invalid grammar fields", () => {
  const input = grammarInput([["kp.arithmetic.add", "evaluation"]]);
  const transition = input.transitions[0]!;
  const result = compileKpEquationGrammarV2({
    ...input,
    transitions: [{
      ...transition,
      evaluationFamilyId: "caller.fade",
      durationMs: 300
    } as never]
  });
  assert.equal(result.status, "invalid");
  if (result.status !== "invalid") return;
  assert.deepEqual(result.diagnostics.map(({ path }) => path), [
    "$.transitions[0].evaluationFamilyId",
    "$.transitions[0].durationMs"
  ]);
});

function compiledGrammar(
  operations: readonly (readonly [
    string,
    "evaluation" | "transformation"
  ])[]
): KpCompiledEquationGrammarV2 {
  const result = compileKpEquationGrammarV2(grammarInput(operations));
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") throw new Error("Fixture failed.");
  return result.grammar;
}

function grammarInput(
  operations: readonly (readonly [
    string,
    "evaluation" | "transformation"
  ])[]
): KpEquationGrammarV2Input {
  const states = Array.from({ length: operations.length + 1 }, (_, index) => ({
    id: `state.${index}`,
    objectIds: [`object.${index}`],
    entityIds: ["entity.x"]
  }));
  return {
    schemaVersion: "kp.equation-grammar.v2",
    id: "grammar.equation.evaluation-authority",
    assetId: "animation.equation.evaluation-authority",
    policyEpochId: "policy.animation.governance-v2.preview.1",
    semanticSource: {
      sourceId: "source.equation.evaluation-authority",
      revisionId: "revision.1",
      operationPacks: [{ packId: "kp.core", version: "1.0.0" }]
    },
    clock: { authority: "kp.shared-normalized-clock.v1" },
    states,
    transitions: operations.map(([operationId, semanticClass], index) => ({
      id: `transition.${index}`,
      transformationId: `transformation.${index}`,
      sourceStateId: `state.${index}`,
      targetStateId: `state.${index + 1}`,
      operation: {
        operationId,
        semanticClass,
        roleBindings: { source: ["entity.x"], target: ["entity.x"] },
        correspondenceMap: {
          id: `correspondence.${index}`,
          records: [{
            id: `record.${index}`,
            relation: "identity",
            sourceSelectorIds: ["entity.x"],
            targetSelectorIds: ["entity.x"],
            summary: "Fixture lineage."
          }]
        },
        semanticAuthorityIds: [`authority.${index}`]
      },
      projection: { intent: "replacement" },
      typographyPolicyId: "typography.equation.fixture.v1",
      typographyRequirements: { largeOperators: [] },
      teachingIntent: {
        kind: "cause",
        primaryEntityIds: ["entity.x"],
        secondaryEntityIds: [],
        summary: "Evaluate through the registry."
      }
    }))
  };
}
