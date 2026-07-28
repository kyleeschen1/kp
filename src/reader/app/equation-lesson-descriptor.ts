import type { KpAnimationAsset } from "../../animation/asset.ts";
import type { KpSemanticAssetObject } from "../../semantic/asset.ts";
import type { KpReaderEquationPresentationProfile } from "../runtime/public-api.ts";
import {
  compileKpAnimationTransformationPhaseCohorts
} from "../../animation/transformation-phase-cohorts.ts";
import type {
  KpAppliedEquationStageLayout,
  KpEquationStageMeasurementIdentity,
  KpEquationStagePhaseIntent
} from "../runtime/public-api.ts";
import type {
  KpCorridorCertifiedEquationStageLayout
} from "../runtime/public-api.ts";

export interface KpReaderEquationStageLayoutCompiler {
  readonly apply: (input: {
    readonly phaseIntent: KpEquationStagePhaseIntent;
    readonly sourceObjectIds: readonly string[];
    readonly targetObjectIds: readonly string[];
    readonly measurementRoot: HTMLElement;
    readonly measurementIdentity: KpEquationStageMeasurementIdentity;
  }) => KpAppliedEquationStageLayout<KpCorridorCertifiedEquationStageLayout>;
}

export interface KpReaderEquationLessonDescriptor {
  readonly id: string;
  readonly createAnimation: (
    profile: KpReaderEquationPresentationProfile
  ) => KpAnimationAsset;
  readonly canonicalTransitionSelection?:
    | "all"
    | readonly string[]
    | undefined;
  readonly bindStructuralAnchors?: ((input: {
    readonly root: HTMLElement;
    readonly state: KpSemanticAssetObject;
  }) => void) | undefined;
  readonly stageKicker?: ((
    profile: KpReaderEquationPresentationProfile
  ) => string | undefined) | undefined;
  readonly compactTranscriptAvailable: boolean;
  readonly readerControls?: "foldable-distribution-v1" | undefined;
  readonly stageLayoutCompiler?:
    KpReaderEquationStageLayoutCompiler | undefined;
}

export interface KpReaderCanonicalTransitionPolicy {
  readonly transitionIds: readonly string[];
  readonly timingAuthority: "runtime-frame-clock";
  readonly lifecycleAuthority: "equation-transition-ir";
  readonly presentationIntent: "exclusive-native-scene";
}

/**
 * The registry is the equation composition boundary: a new lesson variant
 * declares its runtime differences once while retaining literal-key inference.
 */
export function defineKpReaderEquationLessonDescriptors<
  const TDescriptors extends Record<string, KpReaderEquationLessonDescriptor>
>(descriptors: TDescriptors): Readonly<TDescriptors> {
  for (const [id, descriptor] of Object.entries(descriptors)) {
    if (descriptor.id !== id) {
      throw new Error(
        `Reader equation lesson descriptor ${id} declared mismatched id ${descriptor.id}.`
      );
    }
  }
  return Object.freeze({ ...descriptors });
}

export function defineKpCanonicalEquationLessonDescriptor<
  const TDescriptor extends Omit<
    KpReaderEquationLessonDescriptor,
    "canonicalTransitionSelection"
  >
>(
  descriptor: TDescriptor
): Readonly<TDescriptor & { readonly canonicalTransitionSelection: "all" }> {
  return Object.freeze({
    ...descriptor,
    canonicalTransitionSelection: "all" as const
  });
}

const kpReaderEquationLessonDescriptorLoaders = {
  streamlined: () => import("./equation-lesson-descriptors/linear.ts")
    .then(({ streamlinedDescriptor }) => streamlinedDescriptor),
  "teacher-zero": () => import("./equation-lesson-descriptors/linear.ts")
    .then(({ teacherZeroDescriptor }) => teacherZeroDescriptor),
  "fractional-linear": () =>
    import("./equation-lesson-descriptors/fractional-linear.ts")
      .then(({ fractionalLinearDescriptor }) => fractionalLinearDescriptor),
  "fractional-transfer": () =>
    import("./equation-lesson-descriptors/fractional-transfer.ts")
      .then(({ fractionalTransferDescriptor }) => fractionalTransferDescriptor),
  "divide-both-sides": () =>
    import("./equation-lesson-descriptors/divide-both-sides.ts")
      .then(({ divideBothSidesDescriptor }) => divideBothSidesDescriptor),
  "numerator-split-merge": () =>
    import("./equation-lesson-descriptors/numerator-split-merge.ts")
      .then(({ numeratorSplitMergeDescriptor }) => numeratorSplitMergeDescriptor),
  "radical-succession": () =>
    import("./equation-lesson-descriptors/radical-succession.ts")
      .then(({ radicalSuccessionDescriptor }) => radicalSuccessionDescriptor),
  "foldable-distribution": () =>
    import("./equation-lesson-descriptors/foldable-distribution.ts")
      .then(({ foldableDistributionDescriptor }) =>
        foldableDistributionDescriptor
      )
} as const;

export type KpReaderEquationLessonVariant =
  keyof typeof kpReaderEquationLessonDescriptorLoaders;

export const kpReaderEquationLessonVariants = Object.freeze(
  Object.keys(
    kpReaderEquationLessonDescriptorLoaders
  ) as KpReaderEquationLessonVariant[]
);

export async function resolveKpReaderEquationLessonDescriptor(
  variant: string
): Promise<KpReaderEquationLessonDescriptor> {
  if (!Object.hasOwn(kpReaderEquationLessonDescriptorLoaders, variant)) {
    throw new Error(`Unknown reader equation lesson variant ${variant}.`);
  }
  return kpReaderEquationLessonDescriptorLoaders[
    variant as KpReaderEquationLessonVariant
  ]();
}

export function compileKpReaderCanonicalTransitionPolicy(input: {
  readonly descriptor: KpReaderEquationLessonDescriptor;
  readonly animation: KpAnimationAsset;
}): KpReaderCanonicalTransitionPolicy | undefined {
  const selection = input.descriptor.canonicalTransitionSelection;
  if (selection === undefined) return undefined;
  const availableIds = compileKpAnimationTransformationPhaseCohorts(
    input.animation
  ).map(({ id }) => id);
  const transitionIds = selection === "all"
    ? availableIds
    : [...selection];
  if (
    transitionIds.length === 0 ||
    new Set(transitionIds).size !== transitionIds.length
  ) {
    throw new Error(
      `${input.descriptor.id} canonical transition selection must be non-empty and unique.`
    );
  }
  for (const transitionId of transitionIds) {
    if (!availableIds.includes(transitionId)) {
      throw new Error(
        `${input.descriptor.id} selected unknown canonical transition ${transitionId}.`
      );
    }
  }
  return Object.freeze({
    transitionIds: Object.freeze(transitionIds),
    timingAuthority: "runtime-frame-clock" as const,
    lifecycleAuthority: "equation-transition-ir" as const,
    presentationIntent: "exclusive-native-scene" as const
  });
}

export function bindKpReaderEquationLessonStructuralAnchors(input: {
  readonly root: ParentNode;
  readonly animation: KpAnimationAsset;
  readonly descriptor: KpReaderEquationLessonDescriptor;
}): void {
  const bind = input.descriptor.bindStructuralAnchors;
  if (bind === undefined) return;
  const states = new Map(input.animation.bundle.objects.map((state) => [state.id, state]));
  for (const element of input.root.querySelectorAll<HTMLElement>(
    "[data-kp-reader-equation-state]"
  )) {
    const stateId = requiredData(element, "kpReaderEquationState");
    const state = states.get(stateId);
    if (state === undefined) {
      throw new Error(
        `Missing ${input.descriptor.id} equation state ${stateId}.`
      );
    }
    bind({ root: element, state });
  }
}

function requiredData(element: HTMLElement, key: string): string {
  const value = element.dataset[key];
  if (value === undefined || value === "") throw new Error(`Missing data-${key}.`);
  return value;
}
