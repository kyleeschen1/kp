import {
  compileKpDistributionChoreography,
  sampleKpDistributionChoreography
} from "./distribution-choreography.ts";
import {
  compileKpFactoringChoreography,
  sampleKpFactoringChoreography
} from "./factoring-choreography.ts";
import {
  kpFissionFusionCapability,
  type KpFissionFusionCapability
} from "./fission-fusion-capability.ts";
import type {
  KpAnimationRuntimeCapabilities,
  KpDistributionChoreographyCapability,
  KpFactoringChoreographyCapability
} from "./runtime-capabilities.ts";
import {
  kpAlgebraReverseChoreographyCapability
} from "./catalog-packs/algebra-reverse-capability.ts";

export interface KpAlgebraChoreographyCapabilities
extends KpAnimationRuntimeCapabilities {
  readonly fissionFusion: KpFissionFusionCapability;
  readonly distributionChoreography: KpDistributionChoreographyCapability;
  readonly factoringChoreography: KpFactoringChoreographyCapability;
  readonly canonicalReverseChoreography:
    typeof kpAlgebraReverseChoreographyCapability;
}

export function createKpAlgebraChoreographyCapabilities(input: {
  readonly fissionFusion?: KpFissionFusionCapability | undefined;
} = {}): KpAlgebraChoreographyCapabilities {
  const fissionFusion = input.fissionFusion ?? kpFissionFusionCapability;
  const dependencies = Object.freeze({ fissionFusion });
  const distributionChoreography: KpDistributionChoreographyCapability =
  Object.freeze({
    compile: (
      choreographyInput: Parameters<typeof compileKpDistributionChoreography>[0]
    ) =>
      compileKpDistributionChoreography(choreographyInput, dependencies),
    sample: (
      choreographyInput: Parameters<typeof sampleKpDistributionChoreography>[0]
    ) =>
      sampleKpDistributionChoreography(choreographyInput, dependencies)
  });
  const factoringChoreography: KpFactoringChoreographyCapability =
  Object.freeze({
    compile: (
      choreographyInput: Parameters<typeof compileKpFactoringChoreography>[0]
    ) =>
      compileKpFactoringChoreography(choreographyInput, dependencies),
    sample: (
      choreographyInput: Parameters<typeof sampleKpFactoringChoreography>[0]
    ) =>
      sampleKpFactoringChoreography(choreographyInput, dependencies)
  });

  return Object.freeze({
    fissionFusion,
    distributionChoreography,
    factoringChoreography,
    canonicalReverseChoreography: kpAlgebraReverseChoreographyCapability
  });
}

export const kpAlgebraChoreographyCapabilities =
  createKpAlgebraChoreographyCapabilities();
