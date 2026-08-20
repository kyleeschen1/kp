import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpExponentialHomomorphismCorrespondence,
  isKpExponentialHomomorphismCorrespondenceAuthority,
  type KpExponentialSumToProductLaw
} from "../src/semantic/exponential-homomorphism-correspondence.ts";
import { kpExponentialSumToProductLaw } from
  "../src/semantic/exponential-homomorphism-law.ts";
import { normalizeKpPowerApplicationEndpoint } from
  "../src/semantic/power-application-endpoint-normalizer.ts";

const sourceResult = normalizeKpPowerApplicationEndpoint("b^{x+y}");
if (sourceResult.status !== "normalized") {
  throw new Error("The correspondence fixture requires a normalized source.");
}

const authority = compileKpExponentialHomomorphismCorrespondence({
  id: "exponential.sum-to-product.xy",
  source: sourceResult.endpoint,
  baseReferentId: "semantic.exponential.base.b",
  operandReferentIds: [
    "semantic.exponential.operand.x",
    "semantic.exponential.operand.y"
  ]
});

test("exponent payloads persist as exact ordered referents", () => {
  const payloads = authority.occurrences.filter(({ role }) =>
    role === "exponent-payload"
  );
  assert.deepEqual(payloads.map(({ endpoint, ordinal, referentId }) => ({
    endpoint,
    ordinal,
    referentId
  })), [
    { endpoint: "source", ordinal: 0,
      referentId: "semantic.exponential.operand.x" },
    { endpoint: "source", ordinal: 1,
      referentId: "semantic.exponential.operand.y" },
    { endpoint: "target", ordinal: 0,
      referentId: "semantic.exponential.operand.x" },
    { endpoint: "target", ordinal: 1,
      referentId: "semantic.exponential.operand.y" }
  ]);
  assert.deepEqual(authority.correspondenceMap.records.filter(({ id }) =>
    id.includes("payload")
  ).map(({ relation }) => relation), ["role-change", "role-change"]);
});

test("base applications and superscripts derive distinct target occurrences", () => {
  const targetBases = authority.occurrences.filter(({ endpoint, role }) =>
    endpoint === "target" && role === "base"
  );
  assert.equal(targetBases.length, 2);
  assert.equal(new Set(targetBases.map(({ id }) => id)).size, 2);
  assert.deepEqual(new Set(targetBases.map(({ referentId }) => referentId)),
    new Set(["semantic.exponential.base.b"]));
  assert.deepEqual(authority.successorCohorts.slice(0, 3).map((cohort) => ({
    relation: cohort.relation,
    targets: cohort.targetOccurrenceIds.length
  })), [
    { relation: "one-to-many-derived", targets: 2 },
    { relation: "one-to-many-derived", targets: 2 },
    { relation: "one-to-many-derived", targets: 2 }
  ]);
});

test("connector lineage is explicit while glyph identity is forbidden", () => {
  const connectorSuccessor = authority.successorCohorts.find(({ id }) =>
    id.endsWith("connector-0")
  );
  assert.equal(connectorSuccessor?.relation, "one-to-one-derived");
  assert.equal(authority.forbiddenIdentityPairs.length, 2);
  assert.ok(authority.forbiddenIdentityPairs.every(({ sourceOccurrenceId,
    targetOccurrenceId }) => sourceOccurrenceId !== targetOccurrenceId));
  assert.deepEqual(authority.correspondenceMap.records.filter(({ id }) =>
    id.includes("connector")
  ).map(({ relation }) => relation), ["removal", "introduction"]);
});

test("authority classifies every endpoint occurrence exactly once", () => {
  const sourceCoverage = authority.correspondenceMap.records.flatMap(
    ({ sourceSelectorIds }) => sourceSelectorIds
  );
  const targetCoverage = authority.correspondenceMap.records.flatMap(
    ({ targetSelectorIds }) => targetSelectorIds
  );
  assert.deepEqual([...sourceCoverage].sort(),
    [...authority.sourceOccurrenceIds].sort());
  assert.deepEqual([...targetCoverage].sort(),
    [...authority.targetOccurrenceIds].sort());
  assert.equal(new Set(sourceCoverage).size, sourceCoverage.length);
  assert.equal(new Set(targetCoverage).size, targetCoverage.length);
  assert.equal(isKpExponentialHomomorphismCorrespondenceAuthority(authority),
    true);
});

test("illegal or inferred authoring cannot mint correspondence authority", () => {
  assert.throws(() => compileKpExponentialHomomorphismCorrespondence({
    id: "exponential.invalid.duplicate-referent",
    source: sourceResult.endpoint,
    baseReferentId: "semantic.same",
    operandReferentIds: ["semantic.same", "semantic.y"]
  }), /distinct non-empty authored referents/u);
  assert.throws(() => compileKpExponentialHomomorphismCorrespondence({
    id: "exponential.invalid.cardinality",
    source: sourceResult.endpoint,
    baseReferentId: "semantic.b",
    operandReferentIds: ["semantic.x", "semantic.y", "semantic.z"]
  }), /one authored referent per ordered exponent operand/u);
  assert.throws(() => compileKpExponentialHomomorphismCorrespondence({
    id: "exponential.invalid.law",
    law: {
      ...kpExponentialSumToProductLaw,
      sourceCombination: {
        ...kpExponentialSumToProductLaw.sourceCombination,
        kind: "difference"
      }
    } as unknown as KpExponentialSumToProductLaw,
    source: sourceResult.endpoint,
    baseReferentId: "semantic.b",
    operandReferentIds: ["semantic.x", "semantic.y"]
  }), /authoritative additive power source/u);
});
