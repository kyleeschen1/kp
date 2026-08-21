import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpRootCompositionPressureCorpus,
  isKpVerifiedRootCompositionPressureCorpus
} from "../src/semantic/root-composition-pressure-corpus.ts";
import { isKpVerifiedRootRewritePlan } from
  "../src/semantic/root-rewrite-plan.ts";

test("the root composition pressure corpus is nominal and immutable", () => {
  const corpus = createKpRootCompositionPressureCorpus();
  assert.equal(isKpVerifiedRootCompositionPressureCorpus(corpus), true);
  assert.equal(Object.isFrozen(corpus), true);
  assert.equal(Object.isFrozen(corpus.cases), true);
  assert.equal(corpus.cases.length, 3);
  assert.equal(isKpVerifiedRootCompositionPressureCorpus({ ...corpus }), false);
});

test("a root over a sum of squares produces a typed gap and no motion", () => {
  const blocked = createKpRootCompositionPressureCorpus().cases[0]!;
  assert.equal(blocked.kind, "blocked-root-pressure-case");
  if (blocked.kind !== "blocked-root-pressure-case") return;
  assert.equal(blocked.source.latex, "\\sqrt{x^{2}+y^{2}}");
  assert.equal(blocked.result.status, "typed-gap");
  assert.equal(blocked.result.diagnostic.code,
    "root-rewrite.no-valid-law");
  assert.equal(blocked.transitionPolicy, "none");
  assert.equal("plan" in blocked, false);
  assert.equal("target" in blocked, false);
});

test("nested roots compose operators while preserving the carrier", () => {
  const nested = createKpRootCompositionPressureCorpus().cases[1]!;
  assert.equal(nested.kind, "nested-root-pressure-case");
  if (nested.kind !== "nested-root-pressure-case") return;
  assert.deepEqual(nested.states.map(({ latex }) => latex), [
    "\\sqrt{\\sqrt{x}}",
    "\\sqrt[4]{x}"
  ]);
  assert.equal(isKpVerifiedRootRewritePlan(nested.plan), true);
  assert.equal(nested.plan.execution, "atomic");
  assert.deepEqual(nested.plan.dispositions.map(({ kind }) => kind),
    ["persist", "fuse"]);
  assert.equal(nested.carrierIdentity.sourceEntityId,
    "nested.source.x");
  assert.equal(nested.carrierIdentity.targetEntityId, "nested.target.x");
  assert.equal(nested.carrierIdentity.semanticId, "semantic.variable.x");
  assert.equal(nested.carrierIdentity.subtreeId, "subtree.variable.x");
});

test("the factoring-first derivation exposes all ordered semantic states", () => {
  const composed = createKpRootCompositionPressureCorpus().cases[2]!;
  assert.equal(composed.kind, "composed-root-pressure-case");
  if (composed.kind !== "composed-root-pressure-case") return;
  assert.deepEqual(composed.states.map(({ latex }) => latex), [
    "\\sqrt{x^{2}+2x+1}",
    "\\sqrt{(x+1)^{2}}",
    "\\left\\lvert x+1\\right\\rvert"
  ]);
  assert.equal(composed.plan.execution, "sequence-only");
  assert.deepEqual(composed.plan.priorOperationIds,
    ["operation.equation.factor-perfect-square"]);
  assert.deepEqual(composed.operationSequence, [
    "operation.equation.factor-perfect-square",
    "operation.root.compound-carrier-normalization"
  ]);
  assert.equal(composed.transitionPolicy, "ordered-states-only");
  assert.equal(composed.plan.dispositions.length, 0);
});

test("composition fixtures contain no presentation authority", () => {
  const serialized = JSON.stringify(createKpRootCompositionPressureCorpus());
  assert.doesNotMatch(serialized,
    /geometry|keyframe|opacity|duration|renderer|domNode/iu);
});
