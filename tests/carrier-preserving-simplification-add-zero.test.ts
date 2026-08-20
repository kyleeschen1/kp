import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpCarrierPreservingSimplificationRecipe
} from "../src/animation/carrier-preserving-simplification-recipe.ts";
import {
  resolveKpOperationEvaluationFamilyCandidate
} from "../src/animation/operation-evaluation-family-profile.ts";
import {
  verifyKpCarrierPreservingSimplificationEvidence
} from "../src/semantic/carrier-preserving-simplification-evidence.ts";
import {
  createKpGeneratedAddZeroCarrierSource,
  kpGeneratedAddZeroCarrierSelectorIds
} from "../src/semantic/generated-add-zero-carrier-preserving-simplification.ts";

test("the accepted add-zero draft gains code-owned carrier evidence without source drift", () => {
  const source = createKpGeneratedAddZeroCarrierSource();
  assert.equal(source.animation.id, "animation.generated.add-zero");
  assert.deepEqual(
    source.animation.bundle.objects.map(({ id, value }) => ({ id, value })),
    [
      {
        id: "equation.generated.add-zero.before",
        value: { latex: "x + 0 = 4" }
      },
      {
        id: "equation.generated.add-zero.after",
        value: { latex: "x = 4" }
      }
    ]
  );
  assert.deepEqual(source.transformation.lawRefs, [{
    id: "law.algebra.additive-identity",
    level: "strict"
  }]);
  assert.equal(source.animation.transformations[0]?.lawRefs, undefined);
});

test("add-zero compiles through the shared carrier recipe with stationary equality context", () => {
  const source = createKpGeneratedAddZeroCarrierSource();
  const verified = verifyKpCarrierPreservingSimplificationEvidence({
    candidate: source.evidenceCandidate,
    bundle: source.animation.bundle,
    transformation: source.transformation
  });
  assert.equal(verified.status, "verified");
  if (verified.status !== "verified") return;
  const resolution = resolveKpOperationEvaluationFamilyCandidate({
    family: "carrier-preserving-simplification",
    handoff: "persistent-carrier-transfer",
    transformationKind: source.transformation.transformType,
    evidence: verified.evidence
  });
  assert.equal(resolution.status, "candidate-resolved");
  const compiled = compileKpCarrierPreservingSimplificationRecipe(resolution);
  assert.equal(compiled.status, "compiled");
  if (compiled.status !== "compiled") return;

  const ids = kpGeneratedAddZeroCarrierSelectorIds;
  assert.equal(compiled.recipe.carrier.sourceSelectorRef, ids.sourceCarrier);
  assert.equal(compiled.recipe.carrier.targetSelectorRef, ids.targetCarrier);
  assert.deepEqual(compiled.recipe.removedSyntaxCohort.selectorRefs, [
    ids.sourceOperator,
    ids.sourceIdentityWitness
  ]);
  assert.deepEqual(compiled.recipe.stationaryContext, [
    {
      correspondenceRecordId: "relation.generated.add-zero.equals",
      sourceSelectorRef: ids.sourceEquals,
      targetSelectorRef: ids.targetEquals,
      ownership: "native-stationary"
    },
    {
      correspondenceRecordId: "relation.generated.add-zero.four",
      sourceSelectorRef: ids.sourceFour,
      targetSelectorRef: ids.targetFour,
      ownership: "native-stationary"
    }
  ]);
  assert.equal(
    /timing|opacity|coordinates|geometry|domNode|rendererNode/u.test(
      JSON.stringify(compiled.recipe)
    ),
    false
  );
});
