import {
  createDivideBothSidesEquationAnimationAsset
} from "../../../animation/divide-both-sides-equation-adapter.ts";
import {
  bindKpDivideBothSidesStructuralAnchors
} from "../../../rendering/divide-both-sides-selector-annotated-latex.ts";
import type {
  KpReaderEquationLessonDescriptor
} from "../equation-lesson-descriptor.ts";

export const divideBothSidesDescriptor = {
  id: "divide-both-sides",
  createAnimation: () => createDivideBothSidesEquationAnimationAsset(),
  bindStructuralAnchors: bindKpDivideBothSidesStructuralAnchors,
  compactTranscriptAvailable: false
} satisfies KpReaderEquationLessonDescriptor;
