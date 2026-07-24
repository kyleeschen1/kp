import type { KpAnimationAsset } from "../animation/asset.ts";
import { resolveKpAnimationPromotionFacet } from "../animation/artifact-promotion.ts";
import {
  projectKpAnimationAsset,
  type KpAnimationAssetProjections
} from "../animation/asset-projections.ts";
import type {
  KpSymbolicManipulationFamily,
  KpSymbolicRuntimeSampleRef
} from "../animation/symbolic-manipulation-family.ts";
import {
  symbolicRuntimeSampleAvailability
} from "../animation/symbolic-manipulation-family.ts";
import {
  createKpEditorAnimationDescriptor,
  type KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";

export function projectKpAnimationAssetsToEditorDescriptors(input: {
  readonly assets: readonly (
    KpAnimationAsset | KpAnimationAssetProjections
  )[];
  readonly families: readonly KpSymbolicManipulationFamily[];
}): readonly KpEditorAnimationDescriptor[] {
  // The catalog is an outward product consumer: normalize the aggregate at
  // entry and read only the projections that own each displayed field.
  const projectedAssets = input.assets.map(normalizeAssetProjections);
  const assetIdentityCounts = new Map<string, number>();
  for (const { identity } of projectedAssets) {
    assetIdentityCounts.set(
      identity.id,
      (assetIdentityCounts.get(identity.id) ?? 0) + 1
    );
  }
  const resolvedSamples = input.families.flatMap((family) =>
    family.runtimeSamples.flatMap((sample) =>
      symbolicRuntimeSampleAvailability(sample) === "concrete" &&
      assetIdentityCounts.get(sample.animationId) === 1
        ? [{
            familyId: family.id,
            sampleId: sample.id,
            animationId: sample.animationId
          }]
        : []
    )
  );
  const familiesById = new Map(input.families.map((family) => [family.id, family]));

  return projectedAssets.flatMap((asset) => {
    const matches = resolvedSamples.filter(
      (resolution) => resolution.animationId === asset.identity.id
    );

    // One concrete asset may demonstrate multiple family transformations. Each
    // association remains separately addressable while the stable asset-level
    // descriptor remains available across later family promotions.
    return [descriptorForAsset(asset), ...matches.flatMap((resolution) => {
      const family = familiesById.get(resolution.familyId);
      const sample = family?.runtimeSamples.find(
        (candidate) => candidate.id === resolution.sampleId
      );

      return family === undefined || sample === undefined
        ? []
        : [descriptorForFamilySample(asset, family, sample)];
    })];
  });
}

function descriptorForAsset(
  asset: KpAnimationAssetProjections
): KpEditorAnimationDescriptor {
  return createKpEditorAnimationDescriptor({
    animationId: asset.identity.id,
    title: asset.identity.title,
    summary: metadataSummary(asset) ?? asset.identity.title,
    renderTargetKinds: asset.semanticAnimation.renderTargets.map(
      (target) => target.kind
    ),
    ...(asset.semanticAnimation.timeline?.durationMs === undefined
      ? {}
      : { durationMs: asset.semanticAnimation.timeline.durationMs }),
    ...(asset.semanticAnimation.timeline?.beatCount === undefined
      ? {}
      : { beatCount: asset.semanticAnimation.timeline.beatCount }),
    tags: asset.productManifest.dashboard?.tags ?? [],
    promotion: resolveKpAnimationPromotionFacet({
      animationId: asset.identity.id
    })
  });
}

function descriptorForFamilySample(
  asset: KpAnimationAssetProjections,
  family: KpSymbolicManipulationFamily,
  sample: KpSymbolicRuntimeSampleRef
): KpEditorAnimationDescriptor {
  return createKpEditorAnimationDescriptor({
    id: `editor-animation.${sample.id}`,
    animationId: asset.identity.id,
    title: asset.identity.title,
    summary:
      sample.summary ?? metadataSummary(asset) ?? asset.identity.title,
    domain: family.domain,
    familyId: family.id,
    sampleId: sample.id,
    renderTargetKinds: asset.semanticAnimation.renderTargets.map(
      (target) => target.kind
    ),
    ...(asset.semanticAnimation.timeline?.durationMs === undefined
      ? {}
      : { durationMs: asset.semanticAnimation.timeline.durationMs }),
    ...(asset.semanticAnimation.timeline?.beatCount === undefined
      ? {}
      : { beatCount: asset.semanticAnimation.timeline.beatCount }),
    tags: [
      ...(asset.productManifest.dashboard?.tags ?? []),
      "family-backed",
      family.domain
    ],
    promotion: resolveKpAnimationPromotionFacet({
      animationId: asset.identity.id
    })
  });
}

function metadataSummary(
  asset: KpAnimationAssetProjections
): string | undefined {
  const summary = asset.productManifest.metadata?.["summary"];
  return typeof summary === "string" && summary.trim().length > 0
    ? summary
    : undefined;
}

function normalizeAssetProjections(
  asset: KpAnimationAsset | KpAnimationAssetProjections
): KpAnimationAssetProjections {
  return "semanticAnimation" in asset
    ? asset
    : projectKpAnimationAsset(asset);
}
