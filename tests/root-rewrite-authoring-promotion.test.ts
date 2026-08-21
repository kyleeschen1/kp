import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpRootRewriteAuthoringRequest,
  evaluateKpRootRewriteAuthoringCorpus,
  kpRootRewriteAuthoringCorpus,
  kpRootRewritePromotionAuthorities
} from "../src/authoring/root-rewrite-authoring-corpus.ts";
import { isKpVerifiedRootRewritePlan } from
  "../src/semantic/root-rewrite-plan.ts";

test("root authoring pressure accepts exact classes and repairs blocked law", () => {
  const evaluation = evaluateKpRootRewriteAuthoringCorpus();
  assert.deepEqual(evaluation, {
    status: "passed",
    acceptedCount: 3,
    repairCount: 1
  });
  const results = kpRootRewriteAuthoringCorpus.cases.map(({ request }) =>
    compileKpRootRewriteAuthoringRequest(request));
  assert.equal(results.filter(({ status }) => status === "accepted").every(
    (result) => result.status === "accepted" &&
      isKpVerifiedRootRewritePlan(result.plan)
  ), true);
  const repair = results.find(({ status }) => status === "repair-required");
  assert.equal(repair?.status, "repair-required");
  if (repair?.status === "repair-required") {
    assert.equal(repair.code, "root-rewrite.no-valid-law");
  }
});

test("factoring-first authoring remains a sequence rather than direct motion", () => {
  const entry = kpRootRewriteAuthoringCorpus.cases.find(({ id }) =>
    id === "root-authoring.factoring-first");
  assert.ok(entry);
  const result = compileKpRootRewriteAuthoringRequest(entry.request);
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.equal(result.plan.execution, "sequence-only");
  assert.deepEqual(result.plan.priorOperationIds,
    ["operation.equation.factor-perfect-square"]);
});

test("promotion authorities name the exact reviewed asset and bounded seam", () => {
  assert.deepEqual(kpRootRewritePromotionAuthorities, {
    operationAuthorityId: "compiler.equation.root-rewrite-plan.v1",
    recipeAuthorityId: "recipe.equation.radical-inversion.v1",
    authoringAuthorityId: "authoring.equation.radical-inversion.v1",
    corpusAuthorityId: "corpus.equation.radical-inversion.v1",
    exemplarAnimationId:
      "animation.algebra.radical.compound-carrier-normalization"
  });
  assert.doesNotMatch(JSON.stringify(kpRootRewriteAuthoringCorpus),
    /geometry|keyframe|opacity|duration|renderer|domNode/iu);
});
