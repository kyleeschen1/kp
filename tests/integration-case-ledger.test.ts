import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpIntegrationCaseLedger,
  kpIntegrationCaseLedger
} from "../src/semantic/integration-case-ledger.ts";

test("integration cases expose one candidate and typed repairs for every deferral", () => {
  assert.deepEqual(
    kpIntegrationCaseLedger.cases.map(({ operationClass, disposition }) => ({
      operationClass,
      disposition
    })),
    [
      { operationClass: "canonical-monic-quadratic", disposition: "exemplar-candidate" },
      { operationClass: "negative-one-exponent", disposition: "typed-gap" },
      { operationClass: "arbitrary-exponent", disposition: "typed-gap" },
      { operationClass: "definite-integral", disposition: "typed-gap" },
      { operationClass: "substitution", disposition: "typed-gap" },
      { operationClass: "area-accumulation", disposition: "typed-gap" },
      { operationClass: "fundamental-theorem", disposition: "typed-gap" },
      { operationClass: "unsupported-edited-variant", disposition: "typed-gap" }
    ]
  );
  const candidate = kpIntegrationCaseLedger.cases[0]!;
  assert.equal(candidate.targetLatex, "\\frac{x^3}{3}+C");
  assert.equal(candidate.repair, undefined);
  assert.deepEqual(
    kpIntegrationCaseLedger.cases.slice(1).map((entry) => entry.repair?.code),
    [
      "integration.logarithmic-case-required",
      "integration.symbolic-exponent-proof-required",
      "integration.definite-bounds-operation-required",
      "integration.substitution-operation-required",
      "integration.area-semantics-required",
      "integration.fundamental-theorem-operation-required",
      "integration.fixture-normalization-required"
    ]
  );
  assert.ok(kpIntegrationCaseLedger.cases.slice(1).every((entry) =>
    entry.targetLatex === undefined && entry.repair?.targetId !== undefined
  ));
});

test("integration ledgers reject duplicate classes and untyped gaps", () => {
  const first = kpIntegrationCaseLedger.cases[0]!;
  assert.throws(() => defineKpIntegrationCaseLedger({
    ...kpIntegrationCaseLedger,
    cases: [first, { ...first, id: "integration.duplicate" }]
  }), /Duplicate integration case class/u);
  const gap = kpIntegrationCaseLedger.cases[1]!;
  assert.throws(() => defineKpIntegrationCaseLedger({
    ...kpIntegrationCaseLedger,
    cases: [{ ...gap, repair: undefined }]
  }), /requires a repair/u);
  assert.throws(() => defineKpIntegrationCaseLedger({
    ...kpIntegrationCaseLedger,
    cases: [{ ...gap, targetLatex: "\\log|x|+C" }]
  }), /cannot claim a target/u);
});
