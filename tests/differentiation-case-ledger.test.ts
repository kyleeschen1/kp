import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpDifferentiationCaseLedger,
  kpDifferentiationCaseLedger
} from "../src/semantic/differentiation-case-ledger.ts";

test("differentiation cases separate the reviewed exemplar from unsupported rules", () => {
  assert.deepEqual(
    kpDifferentiationCaseLedger.cases.map(({ operationClass, disposition }) => ({
      operationClass,
      disposition
    })),
    [
      { operationClass: "canonical-positive-integer-power", disposition: "verified-exemplar" },
      { operationClass: "other-positive-integer-power", disposition: "semantic-only" },
      { operationClass: "symbolic-exponent", disposition: "typed-gap" },
      { operationClass: "constant", disposition: "typed-gap" },
      { operationClass: "negative-power", disposition: "typed-gap" },
      { operationClass: "compound-base", disposition: "typed-gap" },
      { operationClass: "chain-rule", disposition: "typed-gap" }
    ]
  );
  assert.equal(
    kpDifferentiationCaseLedger.cases[0]?.targetLatex,
    "3x^2"
  );
  assert.ok(kpDifferentiationCaseLedger.cases.slice(2).every(
    ({ targetLatex }) => targetLatex === undefined
  ));
});

test("differentiation ledgers reject duplicate classes and targets on gaps", () => {
  const first = kpDifferentiationCaseLedger.cases[0]!;
  assert.throws(() => defineKpDifferentiationCaseLedger({
    ...kpDifferentiationCaseLedger,
    cases: [first, { ...first, id: "differentiation.duplicate" }]
  }), /Duplicate differentiation case class/u);
  const gap = kpDifferentiationCaseLedger.cases.find(
    ({ disposition }) => disposition === "typed-gap"
  )!;
  assert.throws(() => defineKpDifferentiationCaseLedger({
    ...kpDifferentiationCaseLedger,
    cases: [{ ...gap, targetLatex: "0" }]
  }), /cannot claim a target/u);
});
