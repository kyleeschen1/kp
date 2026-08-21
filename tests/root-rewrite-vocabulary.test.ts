import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpRootRewriteVocabulary,
  kpRootRewriteNegativeCorpus,
  kpRootRewriteVocabulary,
  type KpRootRewriteClass,
  type KpRootRewriteVocabulary
} from "../src/semantic/root-rewrite-vocabulary.ts";

const expectedClasses = [
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
] satisfies readonly KpRootRewriteClass[];

test("root rewrite vocabulary is exhaustive unique and semantic-only", () => {
  assert.deepEqual(
    kpRootRewriteVocabulary.cases.map(({ operationClass }) => operationClass),
    expectedClasses
  );
  assert.equal(new Set(kpRootRewriteVocabulary.cases.map(({ id }) => id)).size,
    expectedClasses.length);
  assert.equal(Object.isFrozen(kpRootRewriteVocabulary), true);
  assert.doesNotMatch(JSON.stringify(kpRootRewriteVocabulary),
    /geometry|keyframe|opacity|renderer|domNode|duration/u);
});

test("the compound carrier is the only pre-pressure visual exemplar", () => {
  const exemplars = kpRootRewriteVocabulary.cases.filter(({ pressureRole }) =>
    pressureRole === "visual-exemplar"
  );
  assert.deepEqual(exemplars.map(({ operationClass, sourceLatex, targetLatex,
    carrierPolicy }) => ({ operationClass, sourceLatex, targetLatex,
    carrierPolicy })), [{
    operationClass: "compound-carrier-normalization",
    sourceLatex: "\\sqrt{(x+1)^2}",
    targetLatex: "\\lvert x+1 \\rvert",
    carrierPolicy: "preserve-largest-shared-subtree"
  }]);
});

test("negative corpus fails closed rather than licensing hidden motion", () => {
  assert.deepEqual(kpRootRewriteNegativeCorpus.map(({ operationClass,
    disposition, carrierPolicy }) => ({ operationClass, disposition,
    carrierPolicy })), [{
    operationClass: "blocked-rewrite",
    disposition: "typed-gap",
    carrierPolicy: "no-motion"
  }, {
    operationClass: "composed-derivation",
    disposition: "ordered-composition-required",
    carrierPolicy: "preserve-largest-shared-subtree"
  }]);
});

test("assumption and residual-enclosure cases retain distinct proof obligations", () => {
  const byClass = new Map(kpRootRewriteVocabulary.cases.map((entry) =>
    [entry.operationClass, entry]
  ));
  assert.deepEqual(byClass.get("assumption-qualified-cancellation")
    ?.requiredEvidence, ["even-positive-integer-power", "nonnegative-domain"]);
  assert.deepEqual(byClass.get("partial-extraction")?.requiredEvidence,
    ["perfect-power-factor", "residual-radicand"]);
  assert.equal(byClass.get("partial-extraction")?.carrierPolicy,
    "retain-residual-enclosure");
  assert.equal(byClass.get("blocked-rewrite")?.targetLatex, undefined);
});

test("declaration rejects duplicate classes and motion-authorizing gaps", () => {
  const base = kpRootRewriteVocabulary.cases[0]!;
  const invalidCases: readonly KpRootRewriteVocabulary[] = [{
    ...kpRootRewriteVocabulary,
    cases: [base, { ...base, id: "root-rewrite.duplicate" }]
  }, {
    ...kpRootRewriteVocabulary,
    cases: [{
      ...base,
      operationClass: "blocked-rewrite",
      id: "root-rewrite.invalid-gap",
      disposition: "typed-gap",
      carrierPolicy: "preserve-largest-shared-subtree"
    }]
  }];
  for (const invalid of invalidCases) {
    assert.throws(() => defineKpRootRewriteVocabulary(invalid));
  }
});

