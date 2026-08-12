import type {
  compileKpDistributionChoreography,
  sampleKpDistributionChoreography
} from "./distribution-choreography.ts";
import type {
  compileKpFactoringChoreography,
  sampleKpFactoringChoreography
} from "./factoring-choreography.ts";

export interface KpDistributionChoreographyCapability {
  readonly compile: (
    input: Parameters<typeof compileKpDistributionChoreography>[0]
  ) => ReturnType<typeof compileKpDistributionChoreography>;
  readonly sample: (
    input: Parameters<typeof sampleKpDistributionChoreography>[0]
  ) => ReturnType<typeof sampleKpDistributionChoreography>;
}

export interface KpFactoringChoreographyCapability {
  readonly compile: (
    input: Parameters<typeof compileKpFactoringChoreography>[0]
  ) => ReturnType<typeof compileKpFactoringChoreography>;
  readonly sample: (
    input: Parameters<typeof sampleKpFactoringChoreography>[0]
  ) => ReturnType<typeof sampleKpFactoringChoreography>;
}

export interface KpAnimationRuntimeCapabilities {
  readonly distributionChoreography?:
    KpDistributionChoreographyCapability | undefined;
  readonly factoringChoreography?: KpFactoringChoreographyCapability | undefined;
}

export const kpNoAnimationRuntimeCapabilities:
KpAnimationRuntimeCapabilities = Object.freeze({});
