import type {
  compileKpDistributionChoreography,
  sampleKpDistributionChoreography,
  KpDistributionChoreographyInput
} from "./distribution-choreography.ts";
import type {
  compileKpFactoringChoreography,
  sampleKpFactoringChoreography
} from "./factoring-choreography.ts";
import type {
  KpCanonicalReverseChoreographyCapability
} from "./canonical-reverse-capability.ts";
import type {
  KpSemanticMotionChoreographySample
} from "../domain-ir/public-api.ts";

export interface KpDistributionChoreographyCapability {
  readonly bindingForAnimationId: (
    animationId: string
  ) => KpDistributionChoreographyInput | undefined;
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

export interface KpSemanticMotionChoreographyCapability {
  readonly sampleForAnimationId: (input: {
    readonly animationId: string;
    readonly progress: number;
    readonly direction: "forward" | "rewind";
  }) => KpSemanticMotionChoreographySample | undefined;
}

export interface KpAnimationRuntimeCapabilities {
  readonly semanticMotion?:
    KpSemanticMotionChoreographyCapability | undefined;
  readonly distributionChoreography?:
    KpDistributionChoreographyCapability | undefined;
  readonly factoringChoreography?: KpFactoringChoreographyCapability | undefined;
  readonly canonicalReverseChoreography?:
    KpCanonicalReverseChoreographyCapability | undefined;
}

export const kpNoAnimationRuntimeCapabilities:
KpAnimationRuntimeCapabilities = Object.freeze({});
