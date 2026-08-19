import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileKpEquationTransformSeries } from
  "../src/authoring/compile-equation-transform-series.ts";
import { compileNaturalLanguageKpEquationSeries } from
  "../src/authoring/compile-natural-language-equation-series.ts";
import {
  createKpEquationSeriesFractionEquivalenceSemanticSource,
  KP_FRACTION_EQUIVALENCE_AUTHORING_OPERATION_ID,
  KP_FRACTION_EQUIVALENCE_AUTHORING_PACK_PIN,
  KP_FRACTION_EQUIVALENCE_EQUATION_SERIES_AUTHORING_AUTHORITY,
  kpEquationSeriesFractionEquivalenceAuthoringDeclaration,
  type KpEquationSeriesFractionEquivalenceSemanticArguments
} from "../src/authoring/equation-series-fraction-equivalence-authoring.ts";
import { kpEquationSeriesGovernedAuthoringRegistry } from
  "../src/authoring/equation-series-governed-authoring-registry.ts";
import type { KpEquationSeriesNaturalLanguagePlannerPort } from
  "../src/authoring/equation-series-natural-language-planner-port.ts";
import { kpEquationSeriesOperationRegistry } from
  "../src/authoring/equation-series-operation-declarations.ts";
import type { KpEquationTransformSeriesRequest } from
  "../src/authoring/equation-transform-series-request.ts";
import { kpCanonicalFractionEquivalence } from
  "../src/semantic/fraction-equivalence.ts";

const adjacencyId = "adjacency.fraction-equivalence.canonical";
const source = createKpEquationSeriesFractionEquivalenceSemanticSource({
  sourceId: "source.fraction-equivalence.canonical",
  revisionId: "revision.fraction-equivalence.canonical.v1",
  adjacencyId,
  transformation: kpCanonicalFractionEquivalence
});

test("fraction equivalence is one planner-exposed governed operation", () => {
  const declaration = kpEquationSeriesOperationRegistry.byId[
    KP_FRACTION_EQUIVALENCE_AUTHORING_OPERATION_ID
  ];
  assert.ok(declaration);
  assert.equal(declaration.source, "governed-operation");
  assert.equal(declaration.plannerExposure.kind, "exposed");
  assert.equal(declaration.governed?.authoringAuthorityId,
    KP_FRACTION_EQUIVALENCE_EQUATION_SERIES_AUTHORING_AUTHORITY);
  assert.deepEqual(declaration.governed?.operationPin,
    KP_FRACTION_EQUIVALENCE_AUTHORING_PACK_PIN);
  assert.equal(kpEquationSeriesGovernedAuthoringRegistry.some(
    ({ operationIds }) => operationIds.includes(
      KP_FRACTION_EQUIVALENCE_AUTHORING_OPERATION_ID
    )), true);
  assert.deepEqual(declaration.roleIds,
    kpEquationSeriesFractionEquivalenceAuthoringDeclaration.roleIds);
});

test("verified fraction-equivalence source compiles exact native LaTeX", () => {
  const result = compileKpEquationTransformSeries({
    value: explicitRequest(semanticArguments()),
    governedSources: [source]
  });
  assert.equal(result.status, "compiled");
  assert.equal(result.active?.runtime.plans[0]?.operationId,
    KP_FRACTION_EQUIVALENCE_AUTHORING_OPERATION_ID);
});

test("natural language selects while deterministic binding supplies truth", async () => {
  const request = proposedRequest();
  const result = await compileNaturalLanguageKpEquationSeries({
    request,
    naturalLanguageIntent:
      "Multiply the numerator and denominator by the same nonzero factor.",
    planner: planner(request),
    governedSources: [source]
  });
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  const intent = result.boundRequest.adjacencies[0]?.intent;
  assert.equal(intent?.mode, "explicit");
  assert.deepEqual(
    (intent as { semanticArguments: KpEquationSeriesFractionEquivalenceSemanticArguments })
      .semanticArguments.correspondenceIds,
    kpCanonicalFractionEquivalence.correspondence.map(({ id }) => id)
  );
  assert.equal(JSON.stringify(result.plannerRecord)
    .includes("semanticArguments"), false);
});

test("pins roles evidence correspondences and endpoints fail closed", () => {
  assert.equal(repairKind({
    ...semanticArguments(),
    operationPin: { packId: "kp.fraction-equivalence", version: "9.9.9" }
  }), "operation-pin");
  assert.equal(repairKind(semanticArguments(), []), "semantic-source");
  assert.equal(repairKind({
    ...semanticArguments(),
    roleBindings: {
      ...semanticArguments().roleBindings,
      "scale-factor": ["entity.fabricated.factor"]
    }
  }), "invalid-role");
  assert.equal(repairKind({
    ...semanticArguments(),
    nonzeroEvidenceIds: {
      ...semanticArguments().nonzeroEvidenceIds,
      scaleFactorNonzeroEvidenceId: "evidence.fabricated"
    }
  }), "assumption-evidence");
  assert.equal(repairKind({
    ...semanticArguments(),
    correspondenceIds: ["correspondence.fabricated"]
  }), "semantic-source");
  assert.equal(repairKind(semanticArguments(), [source],
    "\\frac{a*3}{b*2}"), "semantic-source");
});

test("source creation rejects structural brand forgery", () => {
  assert.throws(() => createKpEquationSeriesFractionEquivalenceSemanticSource({
    sourceId: "source.forged",
    revisionId: "revision.forged",
    adjacencyId,
    transformation: { ...kpCanonicalFractionEquivalence }
  }), /requires verified authority/u);
});

test("fraction authoring remains renderer-neutral and registry-owned", () => {
  const authoring = readFileSync(new URL(
    "../src/authoring/equation-series-fraction-equivalence-authoring.ts",
    import.meta.url
  ), "utf8");
  const registry = readFileSync(new URL(
    "../src/authoring/equation-series-governed-source-binding.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(authoring,
    /(?:\.svelte|HTMLElement|SVGElement|WebGL|requestAnimationFrame|setTimeout)/u);
  assert.doesNotMatch(registry, /switch\s*\(/u);
});

function explicitRequest(
  semanticArgumentsValue: KpEquationSeriesFractionEquivalenceSemanticArguments,
  targetLatex = "\\frac{a*2}{b*2}"
): KpEquationTransformSeriesRequest {
  const transformation = kpCanonicalFractionEquivalence;
  return {
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: "series.fraction-equivalence.canonical.v1",
    states: [{
      id: transformation.source.stateId,
      latex: "\\frac{a}{b}"
    }, {
      id: transformation.target.stateId,
      latex: targetLatex
    }],
    adjacencies: [{
      id: adjacencyId,
      fromStateId: transformation.source.stateId,
      toStateId: transformation.target.stateId,
      intent: {
        mode: "explicit",
        operationId: KP_FRACTION_EQUIVALENCE_AUTHORING_OPERATION_ID,
        semanticArguments: semanticArgumentsValue
      }
    }]
  };
}

function proposedRequest(): KpEquationTransformSeriesRequest {
  const request = explicitRequest(semanticArguments());
  return {
    ...request,
    adjacencies: request.adjacencies.map((adjacency) => ({
      ...adjacency,
      intent: {
        mode: "proposed" as const,
        instruction: "Scale the fraction without changing its value."
      }
    }))
  };
}

function semanticArguments():
KpEquationSeriesFractionEquivalenceSemanticArguments {
  const transformation = kpCanonicalFractionEquivalence;
  const evidence = source.adjacencyEvidence![0]!;
  return {
    schemaVersion: "kp.equation-series.fraction-equivalence-intent.v1",
    sourcePin: { sourceId: source.sourceId, revisionId: source.revisionId },
    operationPin: { ...KP_FRACTION_EQUIVALENCE_AUTHORING_PACK_PIN },
    roleBindings: {
      "source-numerator": [transformation.source.numerator.entityId],
      "source-denominator": [transformation.source.denominator.entityId],
      "scale-factor": [transformation.factor.entityId],
      "target-numerator-factor": [
        transformation.target.numeratorFactorOccurrenceEntityId
      ],
      "target-denominator-factor": [
        transformation.target.denominatorFactorOccurrenceEntityId
      ]
    },
    nonzeroEvidenceIds: { ...transformation.nonzeroEvidence },
    correspondenceIds: [...evidence.correspondenceIds]
  };
}

function planner(
  request: KpEquationTransformSeriesRequest
): KpEquationSeriesNaturalLanguagePlannerPort {
  return {
    id: "planner.fraction-equivalence.fixture.v1",
    propose: async () => ({
      schemaVersion: "kp.equation-series-planner-record.v1",
      kind: "equation-series-planner-record",
      requestId: request.id,
      plannerId: "planner.fraction-equivalence.fixture.v1",
      status: "proposed",
      proposals: [{
        adjacencyId,
        kind: "single",
        operationId: KP_FRACTION_EQUIVALENCE_AUTHORING_OPERATION_ID
      }],
      diagnostics: []
    })
  };
}

function repairKind(
  semanticArgumentsValue: KpEquationSeriesFractionEquivalenceSemanticArguments,
  sources = [source],
  targetLatex?: string
): string | undefined {
  const result = compileKpEquationTransformSeries({
    value: explicitRequest(semanticArgumentsValue, targetLatex),
    governedSources: sources
  });
  assert.equal(result.status, "repair-required");
  return result.repairs[0]?.kind;
}
