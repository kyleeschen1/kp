import assert from "node:assert/strict";
import test from "node:test";

import { createKpContinuityEquationPresentationProfileV1 } from
  "../src/animation/equation-presentation-profile.ts";
import {
  kpAnimationPolicyEpochs,
  resolveKpAnimationPolicyEpoch,
  resolveKpAnimationProfileProvenance
} from "../src/architecture/animation-policy-epoch.ts";

test("policy epochs are immutable snapshots with unique IDs", () => {
  assert.equal(
    new Set(kpAnimationPolicyEpochs.map(({ id }) => id)).size,
    kpAnimationPolicyEpochs.length
  );
  assert.equal(Object.isFrozen(kpAnimationPolicyEpochs), true);
  for (const epoch of kpAnimationPolicyEpochs) {
    assert.equal(Object.isFrozen(epoch), true);
    assert.equal(Object.isFrozen(epoch.requiredPrincipleIds), true);
    assert.equal(Object.isFrozen(epoch.principleContractIds), true);
  }
});

test("legacy implicit profiles remain reproducible under their frozen epoch", () => {
  const first = resolveKpAnimationProfileProvenance({
    epochId: "policy.animation.legacy.v1",
    domain: "equation"
  });
  const second = resolveKpAnimationProfileProvenance({
    epochId: "policy.animation.legacy.v1",
    domain: "equation"
  });
  assert.deepEqual(first, second);
  assert.equal(first.source, "legacy-policy-default");
  assert.equal(first.profileId, "profile.equation.legacy-implicit.v1");
});

test("declared profile provenance is structural and deterministic", () => {
  const profile = createKpContinuityEquationPresentationProfileV1();
  const first = resolveKpAnimationProfileProvenance({
    epochId: "policy.animation.legacy.v1",
    domain: "equation",
    declaredProfile: profile
  });
  const second = resolveKpAnimationProfileProvenance({
    epochId: "policy.animation.legacy.v1",
    domain: "equation",
    declaredProfile: {
      ...profile,
      payload: { ...profile.payload }
    }
  });
  assert.deepEqual(first, second);
  assert.equal(first.source, "asset-declared");
});

test("v2 preview rejects implicit equation profiles without changing legacy", () => {
  assert.throws(
    () => resolveKpAnimationProfileProvenance({
      epochId: "policy.animation.governance-v2.preview.1",
      domain: "equation"
    }),
    /rejects an implicit equation presentation profile/u
  );
  assert.equal(
    resolveKpAnimationPolicyEpoch("policy.animation.legacy.v1")
      .implicitProfilePolicy,
    "preserve-legacy"
  );
});
