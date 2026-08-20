import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  defineKpExponentialSumToProductLaw,
  kpExponentialSumToProductLaw
} from "../src/semantic/exponential-homomorphism-law.ts";

test("exponential sum-to-product law names exact semantic roles", () => {
  assert.equal(kpExponentialSumToProductLaw.id,
    "law.exponential.sum-to-product");
  assert.equal(kpExponentialSumToProductLaw.application.kind, "power");
  assert.equal(kpExponentialSumToProductLaw.sourceCombination.kind, "sum");
  assert.equal(kpExponentialSumToProductLaw.targetCombination.kind, "product");
  assert.equal(kpExponentialSumToProductLaw.minimumPayloadCount, 2);
  assert.deepEqual(kpExponentialSumToProductLaw.invariants, [
    "ordered-payload-identity-persists",
    "derived-applications-are-successors-not-duplicates",
    "connector-law-does-not-imply-glyph-identity"
  ]);
  assert.equal(Object.isFrozen(kpExponentialSumToProductLaw.application), true);
});

test("exponential law rejects visually similar but false directions", () => {
  for (const mutation of [
    {
      sourceCombination: {
        ...kpExponentialSumToProductLaw.sourceCombination,
        kind: "difference" as const
      }
    },
    {
      targetCombination: {
        ...kpExponentialSumToProductLaw.targetCombination,
        kind: "sum" as const
      }
    },
    {
      application: {
        ...kpExponentialSumToProductLaw.application,
        kind: "logarithm" as const
      }
    }
  ]) {
    assert.throws(() => defineKpExponentialSumToProductLaw({
      ...kpExponentialSumToProductLaw,
      ...mutation
    }), /exponential sum law/u);
  }
});

test("bounded exponential law requires positive-real base evidence", () => {
  assert.throws(() => defineKpExponentialSumToProductLaw({
    ...kpExponentialSumToProductLaw,
    domainAssumptionIds: ["assumption.exponential.exponents-real"]
  }), /positive-real base/u);
});

test("semantic law remains independent of notation and rendering", async () => {
  const sources = await Promise.all([
    "../src/domain-ir/homomorphic-semantic-law.ts",
    "../src/semantic/exponential-homomorphism-law.ts"
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  for (const source of sources) {
    assert.doesNotMatch(source, /katex|renderer|geometry|timing|opacity|DOM/u);
  }
});
