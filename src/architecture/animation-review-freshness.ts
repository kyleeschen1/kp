import type {
  KpAnimationConformanceManifest
} from "./animation-conformance-manifest.ts";
import type {
  KpAnimationPolicyEpochId
} from "./animation-policy-epoch.ts";

export type KpAnimationReviewFreshnessState =
  | "current"
  | "stale-by-policy"
  | "stale-by-renderer"
  | "unreviewed"
  | "waived";

export interface KpAnimationReviewSnapshot {
  readonly schemaVersion: "kp.animation-review-snapshot.v1";
  readonly assetId: string;
  readonly decision: "approved" | "waived";
  readonly reviewedPolicyEpochId: KpAnimationPolicyEpochId;
  readonly reviewedProfileFingerprints: readonly string[];
  readonly reviewedRendererAdapterIds: readonly string[];
  readonly evidenceSourceIds: readonly string[];
}

export interface KpAnimationReviewFreshness {
  readonly schemaVersion: "kp.animation-review-freshness.v1";
  readonly assetId: string;
  readonly state: KpAnimationReviewFreshnessState;
  readonly reason: string;
  readonly evidenceSourceIds: readonly string[];
}

/** Capturing a current snapshot is an explicit review act, never a side effect. */
export function captureKpAnimationReviewSnapshot(input: {
  readonly manifest: KpAnimationConformanceManifest;
  readonly decision: "approved" | "waived";
  readonly evidenceSourceIds: readonly [string, ...string[]];
}): KpAnimationReviewSnapshot {
  return Object.freeze({
    schemaVersion: "kp.animation-review-snapshot.v1" as const,
    assetId: input.manifest.assetId,
    decision: input.decision,
    reviewedPolicyEpochId: input.manifest.policy.epochId,
    reviewedProfileFingerprints: Object.freeze(
      input.manifest.resolvedProfiles.map(({ profileFingerprint }) =>
        profileFingerprint
      )
    ),
    reviewedRendererAdapterIds: Object.freeze([
      ...input.manifest.projection.adapterIds
    ]),
    evidenceSourceIds: Object.freeze([...input.evidenceSourceIds])
  });
}

export function resolveKpAnimationReviewFreshness(input: {
  readonly manifest: KpAnimationConformanceManifest;
  readonly snapshot?: KpAnimationReviewSnapshot | undefined;
}): KpAnimationReviewFreshness {
  const { manifest, snapshot } = input;
  if (snapshot === undefined) {
    if (manifest.reviewProvenance.humanDisposition === "unreviewed") {
      return freshness(manifest, "unreviewed",
        "No human review provenance is registered for this artifact.", []);
    }
    return freshness(
      manifest,
      "stale-by-policy",
      "Legacy review provenance does not pin a policy epoch and cannot be assumed current.",
      manifest.reviewProvenance.evidenceSourceIds
    );
  }
  if (snapshot.assetId !== manifest.assetId) {
    throw new Error(
      `Review snapshot ${snapshot.assetId} cannot assess ${manifest.assetId}.`
    );
  }
  if (
    snapshot.reviewedPolicyEpochId !== manifest.policy.epochId ||
    !sameMembers(
      snapshot.reviewedProfileFingerprints,
      manifest.resolvedProfiles.map(({ profileFingerprint }) =>
        profileFingerprint
      )
    )
  ) {
    return freshness(
      manifest,
      "stale-by-policy",
      "Policy epoch or resolved presentation profile changed after review.",
      snapshot.evidenceSourceIds
    );
  }
  if (!sameMembers(
    snapshot.reviewedRendererAdapterIds,
    manifest.projection.adapterIds
  )) {
    return freshness(
      manifest,
      "stale-by-renderer",
      "Renderer adapter provenance changed after review.",
      snapshot.evidenceSourceIds
    );
  }
  return freshness(
    manifest,
    snapshot.decision === "waived" ? "waived" : "current",
    snapshot.decision === "waived"
      ? "Human review was explicitly waived for this exact policy and renderer snapshot."
      : "Human review matches the current policy, profile, and renderer snapshot.",
    snapshot.evidenceSourceIds
  );
}

function freshness(
  manifest: KpAnimationConformanceManifest,
  state: KpAnimationReviewFreshnessState,
  reason: string,
  evidenceSourceIds: readonly string[]
): KpAnimationReviewFreshness {
  return Object.freeze({
    schemaVersion: "kp.animation-review-freshness.v1" as const,
    assetId: manifest.assetId,
    state,
    reason,
    evidenceSourceIds: Object.freeze([...evidenceSourceIds])
  });
}

function sameMembers(
  left: readonly string[],
  right: readonly string[]
): boolean {
  if (left.length !== right.length) return false;
  const orderedLeft = [...left].sort();
  const orderedRight = [...right].sort();
  return orderedLeft.every((value, index) => value === orderedRight[index]);
}
