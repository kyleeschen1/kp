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
  KpFactoringChoreographyCapability,
  KpSemanticMotionChoreographyCapability
} from "./runtime-capabilities.ts";
import {
  kpAlgebraReverseChoreographyCapability
} from "./catalog-packs/algebra-reverse-capability.ts";
import {
  kpCanonicalDistributionPressureBinding
} from "./distribution-pressure-animation.ts";
import {
  sampleKpSemanticMotionChoreography
} from "../domain-ir/public-api.ts";
import {
  findKpWaveAEquationOperationPlanDeclaration,
  type KpEquationRuntimeBindingId
} from "../domain-ir/equation-surface-family-declarations.ts";
import {
  kpCanonicalCompiledCancellationPressureSemanticMotion
} from "../semantic/cancellation-pressure-semantic-motion.ts";

const semanticMotionByBindingId:
Readonly<Partial<Record<KpEquationRuntimeBindingId,
  typeof kpCanonicalCompiledCancellationPressureSemanticMotion>>> =
Object.freeze({
  "runtime-binding.semantic-motion.inverse-cancellation.v1":
    kpCanonicalCompiledCancellationPressureSemanticMotion
});

const distributionBindingById:
Readonly<Partial<Record<KpEquationRuntimeBindingId,
  typeof kpCanonicalDistributionPressureBinding>>> = Object.freeze({
  "runtime-binding.distribution-pressure.v1":
    kpCanonicalDistributionPressureBinding
});

export interface KpAlgebraChoreographyCapabilities
extends KpAnimationRuntimeCapabilities {
  readonly fissionFusion: KpFissionFusionCapability;
  readonly semanticMotion: KpSemanticMotionChoreographyCapability;
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
  const semanticMotion: KpSemanticMotionChoreographyCapability =
  Object.freeze({
    sampleForAnimationId: ({ animationId, progress, direction }:
      Parameters<KpSemanticMotionChoreographyCapability["sampleForAnimationId"]>[0]) => {
      const declaration =
        findKpWaveAEquationOperationPlanDeclaration(animationId);
      const choreography = declaration?.runtimeBindingIds
        .map((bindingId) => semanticMotionByBindingId[bindingId])
        .find((candidate) => candidate !== undefined);
      return choreography === undefined
        ? undefined
        : sampleKpSemanticMotionChoreography({
            choreography,
            progress,
            direction
          });
    }
  });
  const distributionChoreography: KpDistributionChoreographyCapability =
  Object.freeze({
    // Family-local bindings arrive with the lazy algebra pack; the generic
    // equation surface must not import generated fixtures or semantic contracts.
    bindingForAnimationId: (animationId: string) => {
      const declaration =
        findKpWaveAEquationOperationPlanDeclaration(animationId);
      return declaration?.runtimeBindingIds
        .map((bindingId) => distributionBindingById[bindingId])
        .find((candidate) => candidate !== undefined);
    },
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
    semanticMotion,
    distributionChoreography,
    factoringChoreography,
    canonicalReverseChoreography: kpAlgebraReverseChoreographyCapability
  });
}

export const kpAlgebraChoreographyCapabilities =
  createKpAlgebraChoreographyCapabilities();
