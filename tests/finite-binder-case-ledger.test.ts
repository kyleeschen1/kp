import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpFiniteBinderCaseLedger,
  kpFiniteBinderCaseLedger
} from "../src/semantic/finite-binder-case-ledger.ts";
import {
  kpSymbolicCaseCoverageRegistry,
  projectKpSymbolicCaseCoverage
} from "../src/architecture/symbolic-mathematics-case-coverage.ts";

test("finite binder ledger exhaustively names approved and deferred shapes", () => {
  assert.deepEqual(
    kpFiniteBinderCaseLedger.cases.map(({ operationClass }) => operationClass),
    [
      "canonical-sum",
      "singleton-sum",
      "negative-bound-sum",
      "finite-product-pressure",
      "unbounded-binder",
      "symbolic-upper-bound",
      "descending-range",
      "mismatched-body-reference",
      "compound-body-template",
      "oversized-expansion",
      "nested-binder"
    ]
  );
  assert.equal(Object.isFrozen(kpFiniteBinderCaseLedger), true);
});

test("only proved direct sums claim authority before visual promotion", () => {
  const direct = kpFiniteBinderCaseLedger.cases.filter(({ disposition }) =>
    disposition === "verified-direct-expansion"
  );
  assert.deepEqual(direct.map(({ operationClass }) => operationClass), [
    "canonical-sum",
    "singleton-sum",
    "negative-bound-sum"
  ]);
  assert.equal(
    kpFiniteBinderCaseLedger.cases.find(({ operationClass }) =>
      operationClass === "finite-product-pressure")?.disposition,
    "pressure-required"
  );
});

test("typed gaps never claim transformed targets", () => {
  const gaps = kpFiniteBinderCaseLedger.cases.filter(({ disposition }) =>
    disposition === "typed-gap"
  );
  assert.equal(gaps.length, 7);
  assert.ok(gaps.every(({ targetLatex }) => targetLatex === undefined));
});

test("symbolic coverage projects finite binder maturity without Direct claims", () => {
  const projection = projectKpSymbolicCaseCoverage({
    capabilityId: "capability.equation.finite-binder-expansion",
    isDirect: false
  });
  assert.equal(projection.status, "tracked");
  if (projection.status !== "tracked") return;
  assert.equal(projection.caseCount, kpFiniteBinderCaseLedger.cases.length);
  const canonical = projection.cases.find(({ operationClass }) =>
    operationClass === "canonical-sum"
  );
  assert.equal(canonical?.maturity.find(({ dimensionId }) =>
    dimensionId === "operation-authoritative")?.status, "satisfied");
  assert.equal(canonical?.maturity.find(({ dimensionId }) =>
    dimensionId === "exemplar-executable")?.status, "missing");
});

test("ledger rejects duplicate classes and targets on typed gaps", () => {
  const base = kpFiniteBinderCaseLedger.cases[0]!;
  assert.throws(() => defineKpFiniteBinderCaseLedger({
    ...kpFiniteBinderCaseLedger,
    cases: [base, { ...base, id: "finite-binder.duplicate" }]
  }), /Duplicate finite-binder case class/u);
  assert.throws(() => defineKpFiniteBinderCaseLedger({
    ...kpFiniteBinderCaseLedger,
    cases: [{
      ...base,
      id: "finite-binder.invalid-gap",
      operationClass: "unbounded-binder",
      disposition: "typed-gap"
    }]
  }), /cannot claim a target/u);
});

test("registry remains unique after adding the finite binder family", () => {
  assert.deepEqual(
    kpSymbolicCaseCoverageRegistry.families.map(({ capabilityId }) =>
      capabilityId
    ),
    [
      "capability.equation.radical-inversion",
      "capability.equation.finite-binder-expansion"
    ]
  );
});
