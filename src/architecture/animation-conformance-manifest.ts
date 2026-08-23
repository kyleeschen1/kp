import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpAnimationGovernanceBypassCode } from
  "./animation-governance-inventory.ts";
import type {
  KpAnimationGovernanceDomain,
  KpAnimationGovernanceInventory
} from "./animation-governance-inventory.ts";
import {
  resolveKpAnimationPolicyEpoch,
  resolveKpAnimationProfileProvenance,
  type KpAnimationPolicyEpochId,
  type KpResolvedAnimationProfileProvenance
} from "./animation-policy-epoch.ts";
import type {
  KpAnimationPrincipleContractId,
  KpAnimationPrincipleId
} from "./animation-principle-ledger.ts";
import {
  resolveKpAnimationReviewFreshness,
  type KpAnimationReviewFreshness
} from "./animation-review-freshness.ts";

export type KpAnimationConformanceGapCode =
  | KpAnimationGovernanceBypassCode
  | "asset-presentation-constraints-missing";

export type KpAnimationConformanceDisposition =
  | {
      readonly status: "conformant";
      readonly gapCodes: readonly [];
    }
  | {
      readonly status: "compatibility";
      readonly gapCodes: readonly [
        KpAnimationConformanceGapCode,
        ...KpAnimationConformanceGapCode[]
      ];
    }
  | {
      readonly status: "unsupported";
      readonly gapCodes: readonly [KpAnimationConformanceGapCode, ...KpAnimationConformanceGapCode[]];
    };

export interface KpAnimationConformanceManifest {
  readonly schemaVersion: "kp.animation-conformance-manifest.v1";
  readonly kind: "animation-conformance-manifest";
  readonly assetId: string;
  readonly domains: readonly KpAnimationGovernanceDomain[];
  readonly semanticAuthority: {
    readonly assetBundleId: string;
    readonly transformationIds: readonly string[];
    readonly transformationTreeRootId: string;
    readonly lineage: "canonical-semantic-transformation";
  };
  readonly projection: {
    readonly renderTargetIds: readonly string[];
    readonly renderTargetKinds: readonly string[];
    readonly surfaceKind: string;
    readonly adapterIds: readonly string[];
  };
  readonly clock: {
    readonly authority: "kp-animation-runtime-clock";
    readonly timelineId?: string | undefined;
    readonly seekPolicy: "deterministic-normalized-playhead";
  };
  readonly policy: {
    readonly epochId: KpAnimationPolicyEpochId;
    readonly requiredPrincipleIds: readonly KpAnimationPrincipleId[];
    readonly principleContractIds:
      readonly KpAnimationPrincipleContractId[];
  };
  readonly resolvedProfiles:
    readonly KpResolvedAnimationProfileProvenance[];
  readonly capabilities: {
    readonly surfaceSlotKinds: readonly string[];
    readonly rendererCapabilityIds: readonly string[];
    readonly interactive: readonly string[];
    readonly exports: readonly string[];
  };
  readonly reviewProvenance: {
    readonly humanDisposition: string;
    readonly maturity: string;
    readonly evidenceSourceIds: readonly string[];
  };
  readonly reviewFreshness: KpAnimationReviewFreshness;
  readonly disposition: KpAnimationConformanceDisposition;
}

export interface KpAnimationConformanceManifestSet {
  readonly schemaVersion: "kp.animation-conformance-manifest-set.v1";
  readonly kind: "animation-conformance-manifest-set";
  readonly manifests: readonly KpAnimationConformanceManifest[];
}

export class KpAnimationConformanceManifestError extends Error {
  override readonly name = "KpAnimationConformanceManifestError";
  readonly diagnostics: readonly string[];

  constructor(diagnostics: readonly string[]) {
    super(diagnostics.join("\n"));
    this.diagnostics = diagnostics;
  }
}

export function compileKpAnimationConformanceManifestSet(input: {
  readonly assets: readonly KpAnimationAsset[];
  readonly inventory: KpAnimationGovernanceInventory;
}): KpAnimationConformanceManifestSet {
  const diagnostics: string[] = [];
  const assetsById = uniqueMap(input.assets, ({ id }) => id, "asset", diagnostics);
  const manifests = input.inventory.entries.flatMap((entry) => {
    const asset = assetsById.get(entry.assetId);
    if (asset === undefined) {
      diagnostics.push(`Inventory entry ${entry.assetId} has no animation asset.`);
      return [];
    }
    assetsById.delete(entry.assetId);
    return [compileManifest(asset, entry)];
  });
  for (const assetId of assetsById.keys()) {
    diagnostics.push(`Animation asset ${assetId} has no governance inventory entry.`);
  }
  if (diagnostics.length > 0) {
    throw new KpAnimationConformanceManifestError(Object.freeze(diagnostics));
  }
  return Object.freeze({
    schemaVersion: "kp.animation-conformance-manifest-set.v1" as const,
    kind: "animation-conformance-manifest-set" as const,
    manifests: Object.freeze(manifests.sort((left, right) =>
      left.assetId.localeCompare(right.assetId)
    ))
  });
}

function compileManifest(
  asset: KpAnimationAsset,
  entry: KpAnimationGovernanceInventory["entries"][number]
): KpAnimationConformanceManifest {
  const epoch = resolveKpAnimationPolicyEpoch("policy.animation.legacy.v1");
  const gaps: KpAnimationConformanceGapCode[] = [...entry.bypasses];
  if (asset.presentationConstraints === undefined) {
    gaps.push("asset-presentation-constraints-missing");
  }
  const uniqueGaps = unique(gaps);
  const manifestWithoutFreshness = {
    schemaVersion: "kp.animation-conformance-manifest.v1" as const,
    kind: "animation-conformance-manifest" as const,
    assetId: asset.id,
    domains: Object.freeze([...entry.domains]),
    semanticAuthority: Object.freeze({
      assetBundleId: asset.bundle.id,
      transformationIds: Object.freeze(
        asset.transformations.map(({ id }) => id)
      ),
      transformationTreeRootId: asset.transformationTree.root.id,
      lineage: "canonical-semantic-transformation" as const
    }),
    projection: Object.freeze({
      renderTargetIds: Object.freeze(asset.renderTargets.map(({ id }) => id)),
      renderTargetKinds: Object.freeze([...entry.renderTargetKinds]),
      surfaceKind: entry.surface.kind,
      adapterIds: Object.freeze([...entry.renderer.adapterIds])
    }),
    clock: Object.freeze({
      authority: "kp-animation-runtime-clock" as const,
      ...(asset.timeline === undefined
        ? {}
        : { timelineId: asset.timeline.id }),
      seekPolicy: "deterministic-normalized-playhead" as const
    }),
    policy: Object.freeze({
      epochId: epoch.id,
      requiredPrincipleIds: Object.freeze([...epoch.requiredPrincipleIds]),
      principleContractIds: Object.freeze([...epoch.principleContractIds])
    }),
    resolvedProfiles: Object.freeze(entry.domains.map((domain) =>
      resolveKpAnimationProfileProvenance({
        epochId: epoch.id,
        domain,
        ...(domain === "equation" && asset.presentationProfile !== undefined
          ? { declaredProfile: asset.presentationProfile }
          : {})
      })
    )),
    capabilities: Object.freeze({
      surfaceSlotKinds: Object.freeze([...entry.surface.slotKinds]),
      rendererCapabilityIds: Object.freeze([
        ...entry.renderer.capabilityIds
      ]),
      interactive: Object.freeze([
        ...(asset.presentationConstraints?.requiredCapabilities ?? [])
      ]),
      exports: Object.freeze(asset.exportTargets.map(({ kind }) => kind))
    }),
    reviewProvenance: Object.freeze({
      humanDisposition: entry.review.humanDisposition,
      maturity: entry.review.maturity,
      evidenceSourceIds: Object.freeze([...entry.review.evidenceSourceIds])
    }),
    disposition: disposition(entry.surface.kind, uniqueGaps)
  } satisfies Omit<KpAnimationConformanceManifest, "reviewFreshness">;
  const manifest = manifestWithoutFreshness as KpAnimationConformanceManifest;
  return Object.freeze({
    ...manifestWithoutFreshness,
    reviewFreshness: resolveKpAnimationReviewFreshness({ manifest })
  });
}

function disposition(
  surfaceKind: string,
  gaps: readonly KpAnimationConformanceGapCode[]
): KpAnimationConformanceDisposition {
  if (surfaceKind === "unsupported") {
    return Object.freeze({
      status: "unsupported" as const,
      gapCodes: Object.freeze([...gaps]) as [
        KpAnimationConformanceGapCode,
        ...KpAnimationConformanceGapCode[]
      ]
    });
  }
  if (gaps.length > 0) {
    return Object.freeze({
      status: "compatibility" as const,
      gapCodes: Object.freeze([...gaps]) as [
        KpAnimationConformanceGapCode,
        ...KpAnimationConformanceGapCode[]
      ]
    });
  }
  return Object.freeze({
    status: "conformant" as const,
    gapCodes: Object.freeze([]) as readonly []
  });
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function uniqueMap<T>(
  values: readonly T[],
  keyFor: (value: T) => string,
  label: string,
  diagnostics: string[]
): Map<string, T> {
  const result = new Map<string, T>();
  for (const value of values) {
    const key = keyFor(value);
    if (result.has(key)) diagnostics.push(`Duplicate ${label} ${key}.`);
    result.set(key, value);
  }
  return result;
}
