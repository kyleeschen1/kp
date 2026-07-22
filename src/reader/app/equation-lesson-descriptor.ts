import type { KpAnimationAsset } from "../../animation/asset.ts";
import { createDivideBothSidesEquationAnimationAsset } from "../../animation/divide-both-sides-equation-adapter.ts";
import { createFractionalLinearEquationAnimationAsset } from "../../animation/fractional-linear-equation-adapter.ts";
import {
  createFractionalLinearTransferBalancedAnimationAsset,
  createFractionalLinearTransferFluentAnimationAsset
} from "../../animation/fractional-linear-transfer-comparison-adapter.ts";
import {
  createLinearSolveAnimationAsset,
  createLinearSolveTeacherZeroAnimationAsset
} from "../../animation/linear-solve-adapter.ts";
import { createNumeratorSplitMergeEquationAnimationAsset } from "../../animation/numerator-split-merge-equation-adapter.ts";
import { bindKpDivideBothSidesStructuralAnchors } from "../../rendering/divide-both-sides-selector-annotated-latex.ts";
import { bindKpFractionalLinearStructuralAnchors } from "../../rendering/fractional-linear-selector-annotated-latex.ts";
import { bindKpNumeratorSplitMergeStructuralAnchors } from "../../rendering/numerator-split-merge-selector-annotated-latex.ts";
import type { KpSemanticAssetObject } from "../../semantic/asset.ts";
import type { KpReaderEquationPresentationProfile } from "../runtime/public-api.ts";

export interface KpReaderEquationLessonDescriptor {
  readonly id: string;
  readonly createAnimation: (
    profile: KpReaderEquationPresentationProfile
  ) => KpAnimationAsset;
  readonly bindStructuralAnchors?: ((input: {
    readonly root: ParentNode;
    readonly state: KpSemanticAssetObject;
  }) => void) | undefined;
  readonly stageKicker?: ((
    profile: KpReaderEquationPresentationProfile
  ) => string | undefined) | undefined;
  readonly compactTranscriptAvailable: boolean;
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

export const kpReaderEquationLessonDescriptors =
  defineKpReaderEquationLessonDescriptors({
    streamlined: {
      id: "streamlined",
      createAnimation: () => createLinearSolveAnimationAsset(),
      compactTranscriptAvailable: false
    },
    "teacher-zero": {
      id: "teacher-zero",
      createAnimation: () => createLinearSolveTeacherZeroAnimationAsset(),
      compactTranscriptAvailable: false
    },
    "fractional-linear": {
      id: "fractional-linear",
      createAnimation: () => createFractionalLinearEquationAnimationAsset(),
      bindStructuralAnchors: bindKpFractionalLinearStructuralAnchors,
      compactTranscriptAvailable: true
    },
    "fractional-transfer": {
      id: "fractional-transfer",
      createAnimation: (profile) => profile.derivation === "certified-transfer-v1"
        ? createFractionalLinearTransferFluentAnimationAsset()
        : createFractionalLinearTransferBalancedAnimationAsset(),
      bindStructuralAnchors: bindKpFractionalLinearStructuralAnchors,
      stageKicker: (profile) => profile.derivation === "certified-transfer-v1"
        ? "Follow the certified shortcut"
        : undefined,
      compactTranscriptAvailable: false
    },
    "divide-both-sides": {
      id: "divide-both-sides",
      createAnimation: () => createDivideBothSidesEquationAnimationAsset(),
      bindStructuralAnchors: bindKpDivideBothSidesStructuralAnchors,
      compactTranscriptAvailable: false
    },
    "numerator-split-merge": {
      id: "numerator-split-merge",
      createAnimation: () => createNumeratorSplitMergeEquationAnimationAsset(),
      bindStructuralAnchors: bindKpNumeratorSplitMergeStructuralAnchors,
      compactTranscriptAvailable: false
    }
  });

export type KpReaderEquationLessonVariant =
  keyof typeof kpReaderEquationLessonDescriptors;

export const kpReaderEquationLessonVariants = Object.freeze(
  Object.keys(kpReaderEquationLessonDescriptors) as KpReaderEquationLessonVariant[]
);

export function resolveKpReaderEquationLessonDescriptor(
  variant: string
): KpReaderEquationLessonDescriptor {
  if (!Object.hasOwn(kpReaderEquationLessonDescriptors, variant)) {
    throw new Error(`Unknown reader equation lesson variant ${variant}.`);
  }
  return kpReaderEquationLessonDescriptors[
    variant as KpReaderEquationLessonVariant
  ];
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
