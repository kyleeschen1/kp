import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  createKpSymbolicFamilyAnimationResolutions
} from "../animation/symbolic-family-animation-resolver.ts";
import type {
  KpSymbolicManipulationFamily,
  KpSymbolicRuntimeSampleRef
} from "../animation/symbolic-manipulation-family.ts";
import {
  createKpEditorAnimationDescriptor,
  type KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";

export function projectKpAnimationAssetsToEditorDescriptors(input: {
  readonly assets: readonly KpAnimationAsset[];
  readonly families: readonly KpSymbolicManipulationFamily[];
}): readonly KpEditorAnimationDescriptor[] {
  const resolvedSamples = createKpSymbolicFamilyAnimationResolutions(input)
    .filter((resolution) => resolution.status === "resolved");
  const familiesById = new Map(input.families.map((family) => [family.id, family]));

  return input.assets.flatMap((asset) => {
    const matches = resolvedSamples.filter(
      (resolution) => resolution.animationId === asset.id
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
  asset: KpAnimationAsset
): KpEditorAnimationDescriptor {
  return createKpEditorAnimationDescriptor({
    animationId: asset.id,
    title: asset.title,
    summary: metadataSummary(asset) ?? asset.title,
    renderTargetKinds: asset.renderTargets.map((target) => target.kind),
    ...(asset.timeline?.durationMs === undefined
      ? {}
      : { durationMs: asset.timeline.durationMs }),
    ...(asset.timeline?.beatCount === undefined
      ? {}
      : { beatCount: asset.timeline.beatCount }),
    tags: asset.dashboard?.tags ?? []
  });
}

function descriptorForFamilySample(
  asset: KpAnimationAsset,
  family: KpSymbolicManipulationFamily,
  sample: KpSymbolicRuntimeSampleRef
): KpEditorAnimationDescriptor {
  return createKpEditorAnimationDescriptor({
    id: `editor-animation.${sample.id}`,
    animationId: asset.id,
    title: asset.title,
    summary: sample.summary ?? metadataSummary(asset) ?? asset.title,
    domain: family.domain,
    familyId: family.id,
    sampleId: sample.id,
    renderTargetKinds: asset.renderTargets.map((target) => target.kind),
    ...(asset.timeline?.durationMs === undefined
      ? {}
      : { durationMs: asset.timeline.durationMs }),
    ...(asset.timeline?.beatCount === undefined
      ? {}
      : { beatCount: asset.timeline.beatCount }),
    tags: [
      ...(asset.dashboard?.tags ?? []),
      "family-backed",
      family.domain
    ]
  });
}

function metadataSummary(asset: KpAnimationAsset): string | undefined {
  const summary = asset.metadata?.["summary"];
  return typeof summary === "string" && summary.trim().length > 0
    ? summary
    : undefined;
}
