import assert from "node:assert/strict";
import test from "node:test";
import {
  captureKpAnimationReviewSnapshot,
  resolveKpAnimationReviewFreshness
} from "../src/architecture/animation-review-freshness.ts";
import type {
  KpAnimationConformanceManifest
} from "../src/architecture/animation-conformance-manifest.ts";

const manifest = {
  schemaVersion: "kp.animation-conformance-manifest.v1",
  kind: "animation-conformance-manifest",
  assetId: "animation.review.fixture",
  domains: ["equation"],
  semanticAuthority: {
    assetBundleId: "bundle.review.fixture",
    transformationIds: ["transformation.review.fixture"],
    transformationTreeRootId: "tree.review.fixture",
    lineage: "canonical-semantic-transformation"
  },
  projection: {
    renderTargetIds: ["target.review.fixture"],
    renderTargetKinds: ["equation"],
    surfaceKind: "single-slot",
    adapterIds: ["adapter.equation.v1"]
  },
  clock: {
    authority: "kp-animation-runtime-clock",
    seekPolicy: "deterministic-normalized-playhead"
  },
  policy: {
    epochId: "policy.animation.legacy.v1",
    requiredPrincipleIds: ["principle.animation.semantic-lineage-authority"],
    principleContractIds: ["contract.animation.semantic-lineage.v1"]
  },
  resolvedProfiles: [{
    schemaVersion: "kp.resolved-animation-profile-provenance.v1",
    domain: "equation",
    epochId: "policy.animation.legacy.v1",
    source: "asset-declared",
    profileId: "profile.fixture",
    profileSchemaVersion: "profile.v1",
    profileFingerprint: "kp-profile-fixture"
  }],
  dependencies: {
    principleIds: ["principle.animation.semantic-lineage-authority"],
    motifIds: ["motif.review.fixture"],
    rendererIds: ["adapter.equation.v1"],
    typographyPolicyIds: ["profile.fixture"]
  },
  capabilities: {
    surfaceSlotKinds: ["equation"],
    rendererCapabilityIds: ["equation-katex"],
    interactive: ["direct-seek"],
    exports: []
  },
  reviewProvenance: {
    humanDisposition: "keep",
    maturity: "gold",
    evidenceSourceIds: ["review.legacy"]
  },
  disposition: { status: "conformant", gapCodes: [] },
  reviewFreshness: undefined as never
} as const satisfies KpAnimationConformanceManifest;

test("only an exact explicit review snapshot becomes current or waived", () => {
  const approved = captureKpAnimationReviewSnapshot({
    manifest,
    decision: "approved",
    evidenceSourceIds: ["review.current"]
  });
  assert.equal(
    resolveKpAnimationReviewFreshness({ manifest, snapshot: approved }).state,
    "current"
  );
  const waived = captureKpAnimationReviewSnapshot({
    manifest,
    decision: "waived",
    evidenceSourceIds: ["review.waived"]
  });
  assert.equal(
    resolveKpAnimationReviewFreshness({ manifest, snapshot: waived }).state,
    "waived"
  );
});

test("policy and renderer changes make prior review stale", () => {
  const snapshot = captureKpAnimationReviewSnapshot({
    manifest,
    decision: "approved",
    evidenceSourceIds: ["review.current"]
  });
  const policyChanged = {
    ...manifest,
    resolvedProfiles: [{
      ...manifest.resolvedProfiles[0],
      profileFingerprint: "kp-profile-changed"
    }]
  } as KpAnimationConformanceManifest;
  assert.equal(resolveKpAnimationReviewFreshness({
    manifest: policyChanged,
    snapshot
  }).state, "stale-by-policy");

  const rendererChanged = {
    ...manifest,
    projection: {
      ...manifest.projection,
      adapterIds: ["adapter.equation.v2"]
    }
  } as KpAnimationConformanceManifest;
  assert.equal(resolveKpAnimationReviewFreshness({
    manifest: rendererChanged,
    snapshot
  }).state, "stale-by-renderer");
});

test("legacy review and absent review never silently become current", () => {
  assert.equal(
    resolveKpAnimationReviewFreshness({ manifest }).state,
    "stale-by-policy"
  );
  const unreviewed = {
    ...manifest,
    reviewProvenance: {
      humanDisposition: "unreviewed",
      maturity: "reviewable",
      evidenceSourceIds: []
    }
  } as KpAnimationConformanceManifest;
  assert.equal(
    resolveKpAnimationReviewFreshness({ manifest: unreviewed }).state,
    "unreviewed"
  );
});
