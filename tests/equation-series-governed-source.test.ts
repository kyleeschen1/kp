import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  resolveKpEquationSeriesGovernedSource,
  type KpEquationSeriesGovernedSourceRequirement,
  type KpEquationSeriesVerifiedSemanticSource
} from "../src/authoring/equation-series-governed-source.ts";

const requirement: KpEquationSeriesGovernedSourceRequirement = {
  sourcePin: { sourceId: "source.example", revisionId: "revision.2" },
  operationId: "kp.example.transform",
  requiredEntityIds: ["entity.x", "entity.y"],
  requiredAssumptionEvidenceIds: ["assumption.x-nonzero"],
  requiredSemanticContractKinds: ["kp.contract.example.v1"],
  requiredAdjacency: {
    adjacencyId: "adjacency.example",
    fromStateId: "state.before",
    toStateId: "state.after"
  },
  requiredCorrespondenceIds: ["correspondence.x"]
};

const source: KpEquationSeriesVerifiedSemanticSource = {
  sourceId: "source.example",
  revisionId: "revision.2",
  operationIds: ["kp.example.transform"],
  entityIds: ["entity.x", "entity.y"],
  assumptionEvidenceIds: ["assumption.x-nonzero"],
  semanticContracts: [{
    kind: "kp.contract.example.v1",
    authority: Object.freeze({ verified: true })
  }],
  adjacencyEvidence: [{
    adjacencyId: "adjacency.example",
    fromStateId: "state.before",
    toStateId: "state.after",
    correspondenceIds: ["correspondence.x"],
    roleBindings: { variable: ["entity.x"] }
  }]
};

test("resolver selects one exact source with all required evidence", () => {
  const result = resolveKpEquationSeriesGovernedSource({
    requirement,
    sources: [source]
  });
  assert.equal(result.status, "resolved");
  if (result.status !== "resolved") return;
  assert.equal(result.source, source);
  assert.equal(Object.isFrozen(result), true);
});

test("resolver fails closed across pin operation evidence and contract gaps", () => {
  const cases = [
    {
      expected: "missing-source",
      requirement: { ...requirement, sourcePin: {
        sourceId: "source.missing",
        revisionId: "revision.2"
      } },
      sources: [source]
    },
    {
      expected: "revision-mismatch",
      requirement: { ...requirement, sourcePin: {
        sourceId: "source.example",
        revisionId: "revision.3"
      } },
      sources: [source]
    },
    {
      expected: "operation-unavailable",
      requirement: { ...requirement, operationId: "kp.example.other" },
      sources: [source]
    },
    {
      expected: "entities-unavailable",
      requirement: { ...requirement, requiredEntityIds: ["entity.z"] },
      sources: [source]
    },
    {
      expected: "evidence-unavailable",
      requirement: {
        ...requirement,
        requiredAssumptionEvidenceIds: ["assumption.missing"]
      },
      sources: [source]
    },
    {
      expected: "contracts-unavailable",
      requirement: {
        ...requirement,
        requiredSemanticContractKinds: ["kp.contract.missing.v1"]
      },
      sources: [source]
    },
    {
      expected: "adjacency-unavailable",
      requirement: {
        ...requirement,
        requiredAdjacency: {
          adjacencyId: "adjacency.other",
          fromStateId: "state.before",
          toStateId: "state.after"
        }
      },
      sources: [source]
    },
    {
      expected: "correspondences-unavailable",
      requirement: {
        ...requirement,
        requiredCorrespondenceIds: ["correspondence.missing"]
      },
      sources: [source]
    }
  ] as const;
  cases.forEach((entry) => assert.equal(
    resolveKpEquationSeriesGovernedSource({
      requirement: entry.requirement,
      sources: entry.sources
    }).status,
    entry.expected
  ));
});

test("duplicate exact pins are ambiguous instead of order dependent", () => {
  assert.equal(resolveKpEquationSeriesGovernedSource({
    requirement,
    sources: [source, { ...source }]
  }).status, "ambiguous-source");
});

test("source selection imports no model renderer or mathematical constructor", () => {
  const text = readFileSync(new URL(
    "../src/authoring/equation-series-governed-source.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(
    text,
    /(?:OpenAI|Anthropic|renderer|latex-parser|semantic\/.*operation|switch\s*\()/u
  );
});
