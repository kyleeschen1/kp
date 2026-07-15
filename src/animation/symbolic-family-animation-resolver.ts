import type { KpAnimationAsset } from "./asset.ts";
import {
  symbolicRuntimeSampleAvailability,
  type KpSymbolicManipulationFamily,
  type KpSymbolicRuntimeSampleAvailability,
  type KpSymbolicRuntimeSampleRef
} from "./symbolic-manipulation-family.ts";

export type KpSymbolicFamilyAnimationResolutionStatus =
  | "planned"
  | "resolved"
  | "missing"
  | "ambiguous";

export interface KpSymbolicFamilyAnimationResolution {
  readonly familyId: string;
  readonly sampleId: string;
  readonly animationId: string;
  readonly availability: KpSymbolicRuntimeSampleAvailability;
  readonly status: KpSymbolicFamilyAnimationResolutionStatus;
  readonly asset?: KpAnimationAsset | undefined;
}

export function resolveKpSymbolicFamilyAnimationSample(input: {
  readonly family: KpSymbolicManipulationFamily;
  readonly sample: KpSymbolicRuntimeSampleRef;
  readonly assets: readonly KpAnimationAsset[];
}): KpSymbolicFamilyAnimationResolution {
  const availability = symbolicRuntimeSampleAvailability(input.sample);

  if (availability === "planned") {
    return resolutionBase(input, availability, "planned");
  }

  // Exact ids keep catalog closure deterministic; aliases must be authored
  // explicitly instead of letting similarly named animations resolve silently.
  const matches = input.assets.filter(
    (asset) => asset.id === input.sample.animationId
  );

  if (matches.length === 0) {
    return resolutionBase(input, availability, "missing");
  }

  if (matches.length > 1) {
    return resolutionBase(input, availability, "ambiguous");
  }

  return {
    ...resolutionBase(input, availability, "resolved"),
    asset: matches[0]
  };
}

export function createKpSymbolicFamilyAnimationResolutions(input: {
  readonly families: readonly KpSymbolicManipulationFamily[];
  readonly assets: readonly KpAnimationAsset[];
}): readonly KpSymbolicFamilyAnimationResolution[] {
  return input.families.flatMap((family) =>
    family.runtimeSamples.map((sample) =>
      resolveKpSymbolicFamilyAnimationSample({
        family,
        sample,
        assets: input.assets
      })
    )
  );
}

function resolutionBase(
  input: {
    readonly family: KpSymbolicManipulationFamily;
    readonly sample: KpSymbolicRuntimeSampleRef;
  },
  availability: KpSymbolicRuntimeSampleAvailability,
  status: KpSymbolicFamilyAnimationResolutionStatus
): KpSymbolicFamilyAnimationResolution {
  return {
    familyId: input.family.id,
    sampleId: input.sample.id,
    animationId: input.sample.animationId,
    availability,
    status
  };
}
