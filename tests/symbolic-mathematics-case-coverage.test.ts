import assert from "node:assert/strict";
import test from "node:test";

import {
  KP_SYMBOLIC_CASE_COVERAGE_SCHEMA,
  defineKpSymbolicCaseCoverageRegistry,
  kpLegacyDirectCaseCoverageExemptionCapabilityIds,
  kpSymbolicCaseCoverageRegistry,
  projectKpSymbolicCaseCoverage
} from "../src/architecture/symbolic-mathematics-case-coverage.ts";

test("root case coverage exhaustively projects the accepted vocabulary", () => {
  const family = kpSymbolicCaseCoverageRegistry.families.find(
    ({ capabilityId }) =>
      capabilityId === "capability.equation.radical-inversion"
  );
  assert.ok(family);
  assert.equal(family.cases.length, 10);
  assert.deepEqual(family.cases.map(({ operationClass }) => operationClass), [
    "closed-evaluation",
    "inverse-normalization",
    "compound-carrier-normalization",
    "assumption-qualified-cancellation",
    "exponent-index-composition",
    "mixed-evaluation",
    "partial-extraction",
    "nested-root-composition",
    "blocked-rewrite",
    "composed-derivation"
  ]);
  assert.ok(family.cases.every(({ maturity }) => maturity.length === 6));
  assert.equal(
    family.cases.find(({ operationClass }) =>
      operationClass === "blocked-rewrite")?.outcome,
    "typed-gap"
  );
  assert.equal(
    family.cases.find(({ operationClass }) =>
      operationClass === "composed-derivation")?.outcome,
    "ordered-sequence"
  );
});

test("case maturity distinguishes polished exemplars from pressure evidence", () => {
  const cases = kpSymbolicCaseCoverageRegistry.families[0]!.cases;
  const compound = cases.find(({ operationClass }) =>
    operationClass === "compound-carrier-normalization"
  );
  assert.equal(compound?.maturity.find(({ dimensionId }) =>
    dimensionId === "exemplar-executable")?.status, "satisfied");
  const closed = cases.find(({ operationClass }) =>
    operationClass === "closed-evaluation"
  );
  assert.equal(closed?.maturity.find(({ dimensionId }) =>
    dimensionId === "exemplar-executable")?.status, "pressure");
  const assumption = cases.find(({ operationClass }) =>
    operationClass === "assumption-qualified-cancellation"
  );
  assert.equal(assumption?.maturity.find(({ dimensionId }) =>
    dimensionId === "exemplar-executable")?.status, "missing");
});

test("differentiation coverage exposes one exemplar without overstating the family", () => {
  const family = kpSymbolicCaseCoverageRegistry.families.find(
    ({ capabilityId }) =>
      capabilityId === "capability.equation.differentiation-transformations"
  );
  assert.ok(family);
  assert.equal(family.cases.length, 7);
  assert.equal(family.cases[0]?.outcome, "animated-transition");
  assert.equal(family.cases[1]?.outcome, "semantic-only");
  assert.ok(family.cases.slice(2).every(({ outcome }) =>
    outcome === "typed-gap"
  ));
  assert.equal(family.cases[0]?.maturity.find(({ dimensionId }) =>
    dimensionId === "family-promoted")?.status, "pressure");
  assert.equal(family.cases[0]?.maturity.find(({ dimensionId }) =>
    dimensionId === "generation-governed")?.status, "missing");
});

test("a new Direct symbolic family cannot bypass case enumeration", () => {
  assert.throws(() => projectKpSymbolicCaseCoverage({
    capabilityId: "capability.equation.future-direct-family",
    isDirect: true,
    registry: kpSymbolicCaseCoverageRegistry,
    legacyExemptionCapabilityIds:
      kpLegacyDirectCaseCoverageExemptionCapabilityIds
  }), /requires a case ledger/u);
  assert.deepEqual(projectKpSymbolicCaseCoverage({
    capabilityId: "capability.equation.future-missing-family",
    isDirect: false
  }), {
    status: "not-declared",
    promotionGate: "required-before-direct"
  });
});

test("case ledgers reject incomplete maturity and typed gaps with targets", () => {
  const base = kpSymbolicCaseCoverageRegistry.families[0]!.cases[0]!;
  assert.throws(() => defineKpSymbolicCaseCoverageRegistry({
    schemaVersion: KP_SYMBOLIC_CASE_COVERAGE_SCHEMA,
    kind: "symbolic-case-coverage-registry",
    families: [{
      schemaVersion: KP_SYMBOLIC_CASE_COVERAGE_SCHEMA,
      kind: "symbolic-case-coverage-family",
      capabilityId: "capability.equation.invalid",
      authorityId: "coverage.invalid",
      cases: [{ ...base, maturity: base.maturity.slice(0, 5) }]
    }]
  }), /every maturity dimension/u);
  assert.throws(() => defineKpSymbolicCaseCoverageRegistry({
    schemaVersion: KP_SYMBOLIC_CASE_COVERAGE_SCHEMA,
    kind: "symbolic-case-coverage-registry",
    families: [{
      schemaVersion: KP_SYMBOLIC_CASE_COVERAGE_SCHEMA,
      kind: "symbolic-case-coverage-family",
      capabilityId: "capability.equation.invalid-gap",
      authorityId: "coverage.invalid-gap",
      cases: [{
        ...base,
        id: "case.invalid-gap",
        outcome: "typed-gap",
        targetLatex: "x"
      }]
    }]
  }), /cannot claim a target/u);
});
