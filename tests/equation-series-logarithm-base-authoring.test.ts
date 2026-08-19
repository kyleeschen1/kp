import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileKpEquationTransformSeries } from
  "../src/authoring/compile-equation-transform-series.ts";
import {
  createKpEquationSeriesGovernedAuthoringRegistry,
  kpEquationSeriesGovernedAuthoringRegistry
} from "../src/authoring/equation-series-governed-authoring-registry.ts";
import {
  createKpEquationSeriesLogarithmBaseSemanticSource,
  KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID,
  KP_LOGARITHM_BASE_AUTHORING_PACK_PIN,
  KP_LOGARITHM_BASE_EQUATION_SERIES_AUTHORING_AUTHORITY,
  kpEquationSeriesLogarithmBaseAuthoringDeclaration,
  type KpEquationSeriesLogarithmBaseSemanticArguments
} from "../src/authoring/equation-series-logarithm-base-authoring.ts";
import { kpEquationSeriesOperationRegistry } from
  "../src/authoring/equation-series-operation-declarations.ts";
import { kpCanonicalLogarithmChangeOfBase } from
  "../src/semantic/logarithm-change-of-base.ts";
import { evaluateKpLogarithmBaseAuthoringEvidence } from
  "../src/authoring/logarithm-base-authoring-evidence.ts";

const source = createKpEquationSeriesLogarithmBaseSemanticSource({
  sourceId: "source.logarithm.change-of-base.canonical",
  revisionId: "revision.logarithm.change-of-base.canonical.v1",
  adjacencyId: "adjacency.logarithm.change-of-base.canonical",
  transformation: kpCanonicalLogarithmChangeOfBase
});

test("change of base is one governed equation-series declaration", () => {
  const declaration = kpEquationSeriesOperationRegistry.byId[
    KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID
  ];
  assert.ok(declaration);
  assert.equal(declaration.source, "governed-operation");
  assert.equal(declaration.governed?.authoringAuthorityId,
    KP_LOGARITHM_BASE_EQUATION_SERIES_AUTHORING_AUTHORITY);
  assert.deepEqual(declaration.governed?.operationPin,
    KP_LOGARITHM_BASE_AUTHORING_PACK_PIN);
  assert.deepEqual(declaration.recipeIds,
    kpEquationSeriesLogarithmBaseAuthoringDeclaration.recipeIds);
  assert.equal(kpEquationSeriesGovernedAuthoringRegistry.some(
    ({ operationIds }) => operationIds.includes(
      KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID
    )
  ), true);
});

test("verified source and semantic arguments compile exact ordered LaTeX", () => {
  const result = compileKpEquationTransformSeries({
    value: request(semanticArguments()),
    governedSources: [source]
  });
  assert.equal(result.status, "compiled");
  assert.deepEqual(result.active?.normalizedStates.map(({ endpoint }) =>
    endpoint.kind), ["expression", "expression"]);
  assert.equal(result.active?.runtime.plans[0]?.operationId,
    KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID);
  assert.equal(result.active?.runtime.plans[0]?.declaration.governed
    ?.authoringAuthorityId,
  KP_LOGARITHM_BASE_EQUATION_SERIES_AUTHORING_AUTHORITY);
});

test("numeric and symbolic alternative-base corpus binds through authoring", () => {
  const evidence = evaluateKpLogarithmBaseAuthoringEvidence();
  assert.equal(evidence.status, "passed");
  assert.equal(evidence.cases.length >= 2, true);
  assert.equal(evidence.cases.every(({ passed }) => passed), true);
});

test("pins sources identities evidence and endpoints fail with typed repairs", () => {
  assert.equal(repairKind({
    ...semanticArguments(),
    operationPin: { packId: "kp.logarithm-change-of-base", version: "9.9.9" }
  }), "operation-pin");
  assert.equal(repairKind(semanticArguments(), []), "semantic-source");
  assert.equal(repairKind({
    ...semanticArguments(),
    semanticBindings: {
      ...semanticArguments().semanticBindings,
      sourceBaseSemanticId: "semantic.fabricated.base"
    }
  }), "semantic-source");
  assert.equal(repairKind({
    ...semanticArguments(),
    domainEvidenceIds: {
      ...semanticArguments().domainEvidenceIds,
      sourceBaseNotOneEvidenceId: "evidence.fabricated"
    }
  }), "assumption-evidence");
  assert.equal(repairKind({
    ...semanticArguments(),
    correspondenceIds: ["correspondence.fabricated"]
  }), "semantic-source");
  assert.equal(repairKind(semanticArguments(), [{
    ...source,
    adjacencyEvidence: source.adjacencyEvidence?.map((entry) => ({
      ...entry,
      fromStateId: "state.fabricated.source"
    }))
  }]), "semantic-source");
  assert.equal(repairKind(semanticArguments(), [source],
    "\\frac{\\ln(2)}{\\ln(7)}"), "semantic-source");
});

test("a failed edit retains the previous deterministic candidate", () => {
  const valid = compileKpEquationTransformSeries({
    value: request(semanticArguments()),
    governedSources: [source]
  });
  const invalid = compileKpEquationTransformSeries({
    value: request({
      ...semanticArguments(),
      domainEvidenceIds: {
        ...semanticArguments().domainEvidenceIds,
        sourceArgumentPositiveEvidenceId: "evidence.fabricated"
      }
    }),
    governedSources: [source],
    previous: valid
  });
  assert.equal(invalid.status, "repair-required");
  assert.equal(invalid.active, valid.active);
});

test("governance dispatch rejects duplicate ownership and stays switch-free", () => {
  const validator = kpEquationSeriesGovernedAuthoringRegistry[0]!;
  assert.throws(() => createKpEquationSeriesGovernedAuthoringRegistry([
    validator,
    { ...validator, id: "governance.duplicate" }
  ]), /Duplicate governed authoring owner/u);
  const registrySource = readFileSync(new URL(
    "../src/authoring/equation-series-governed-authoring-registry.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(registrySource, /switch\s*\(/u);
  assert.doesNotMatch(registrySource,
    /(?:HTMLElement|SVGElement|WebGL|requestAnimationFrame|setTimeout)/u);
});

function request(
  argumentsValue: KpEquationSeriesLogarithmBaseSemanticArguments,
  targetLatex = "\\frac{\\ln(7)}{\\ln(2)}"
) {
  return {
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: "series.logarithm.change-of-base.canonical.v1",
    states: [{
      id: kpCanonicalLogarithmChangeOfBase.source.stateId,
      latex: "\\log_2(7)"
    }, {
      id: kpCanonicalLogarithmChangeOfBase.target.stateId,
      latex: targetLatex
    }],
    adjacencies: [{
      id: "adjacency.logarithm.change-of-base.canonical",
      fromStateId: kpCanonicalLogarithmChangeOfBase.source.stateId,
      toStateId: kpCanonicalLogarithmChangeOfBase.target.stateId,
      intent: {
        mode: "explicit",
        operationId: KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID,
        semanticArguments: argumentsValue
      }
    }]
  };
}

function semanticArguments():
KpEquationSeriesLogarithmBaseSemanticArguments {
  const transformation = kpCanonicalLogarithmChangeOfBase;
  return {
    schemaVersion: "kp.equation-series.logarithm-base-intent.v1",
    sourcePin: {
      sourceId: source.sourceId,
      revisionId: source.revisionId
    },
    operationPin: { ...KP_LOGARITHM_BASE_AUTHORING_PACK_PIN },
    semanticBindings: {
      sourceBaseSemanticId: transformation.source.base.semanticId,
      sourceArgumentSemanticId: transformation.source.argument.semanticId,
      targetLogarithmFunction: "natural-logarithm"
    },
    domainEvidenceIds: { ...transformation.domainEvidence },
    correspondenceIds: transformation.correspondence.map(({ id }) => id)
  };
}

function repairKind(
  argumentsValue: KpEquationSeriesLogarithmBaseSemanticArguments,
  sources = [source],
  targetLatex?: string
): string | undefined {
  const result = compileKpEquationTransformSeries({
    value: request(argumentsValue, targetLatex),
    governedSources: sources
  });
  assert.equal(result.status, "repair-required");
  return result.repairs[0]?.kind;
}
