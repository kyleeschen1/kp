import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpCarrierPreservingSimplificationRecipe
} from "../src/animation/carrier-preserving-simplification-recipe.ts";
import {
  resolveKpOperationEvaluationFamilyCandidate
} from "../src/animation/operation-evaluation-family-profile.ts";
import {
  createKpTwoTimesOneCarrierEvidenceCandidate,
  createKpTwoTimesOneCarrierExemplar,
  kpTwoTimesOneCarrierSelectorIds
} from "../src/semantic/carrier-preserving-simplification-exemplar.ts";
import {
  verifyKpCarrierPreservingSimplificationEvidence
} from "../src/semantic/carrier-preserving-simplification-evidence.ts";

test("verified carrier authority compiles to one deterministic neutral recipe", () => {
  const resolution = canonicalResolution();
  const first = compileKpCarrierPreservingSimplificationRecipe(resolution);
  const second = compileKpCarrierPreservingSimplificationRecipe(resolution);
  assert.equal(first.status, "compiled");
  assert.deepEqual(first, second);
  if (first.status !== "compiled") return;

  assert.deepEqual(first.recipe.carrier, {
    correspondenceRecordId:
      "transform.operation-evaluation.two-times-one-carrier." +
      "simplify-identity.carrier-persists",
    sourceSelectorRef: kpTwoTimesOneCarrierSelectorIds.sourceCarrier,
    targetSelectorRef: kpTwoTimesOneCarrierSelectorIds.targetCarrier,
    ownership: "exclusive-transit-owner",
    anchorPolicy: "measured-ink-center",
    baselinePolicy: "preserve-measured-ink-baseline"
  });
  assert.deepEqual(first.recipe.removedSyntaxCohort.selectorRefs, [
    kpTwoTimesOneCarrierSelectorIds.sourceOperator,
    kpTwoTimesOneCarrierSelectorIds.sourceIdentityWitness
  ]);
  assert.deepEqual(first.recipe.stationaryContext, []);
  assert.deepEqual(first.recipe.settlement, {
    targetSelectorRef: kpTwoTimesOneCarrierSelectorIds.targetCarrier,
    ownership: "native-target",
    policy: "exact-native-ink"
  });
});

test("the recipe contains no caller-authored presentation values", () => {
  const compilation = compileKpCarrierPreservingSimplificationRecipe(
    canonicalResolution()
  );
  assert.equal(compilation.status, "compiled");
  if (compilation.status !== "compiled") return;
  const keys = collectKeys(compilation.recipe);
  for (const forbidden of [
    "duration",
    "timing",
    "progress",
    "opacity",
    "coordinates",
    "geometry",
    "domNode",
    "rendererNode"
  ]) {
    assert.equal(keys.has(forbidden), false, forbidden);
  }
});

test("an unresolved family request cannot compile a recipe", () => {
  const unresolved = resolveKpOperationEvaluationFamilyCandidate({
    family: "carrier-preserving-simplification",
    handoff: "persistent-carrier-transfer",
    transformationKind: "simplifyMultiplicativeIdentity"
  });
  assert.deepEqual(
    compileKpCarrierPreservingSimplificationRecipe(unresolved),
    {
      status: "unresolved-candidate",
      resolutionStatus: "missing-carrier-evidence",
      message:
        "Family carrier-preserving-simplification requires verified carrier evidence."
    }
  );
});

function canonicalResolution() {
  const exemplar = createKpTwoTimesOneCarrierExemplar();
  const verification = verifyKpCarrierPreservingSimplificationEvidence({
    candidate: createKpTwoTimesOneCarrierEvidenceCandidate(),
    bundle: exemplar.bundle,
    transformation: exemplar.transformation
  });
  assert.equal(verification.status, "verified");
  if (verification.status !== "verified") {
    throw new Error("Canonical carrier evidence failed verification.");
  }
  return resolveKpOperationEvaluationFamilyCandidate({
    family: "carrier-preserving-simplification",
    handoff: "persistent-carrier-transfer",
    transformationKind: "simplifyMultiplicativeIdentity",
    evidence: verification.evidence
  });
}

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (typeof value !== "object" || value === null) return keys;
  for (const [key, child] of Object.entries(value)) {
    keys.add(key);
    collectKeys(child, keys);
  }
  return keys;
}
