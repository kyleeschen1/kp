import {
  createKpFractionCompositionEquationAnimationAsset
} from "../../../animation/fraction-composition-equation-adapter.ts";
import {
  bindKpFractionCompositionStructuralAnchors
} from "../../../rendering/fraction-composition-selector-annotated-latex.ts";
import {
  applyKpFractionCompositionPhaseStageLayout
} from "../fraction-composition-stage-layout.ts";
import {
  defineKpCanonicalEquationLessonDescriptor
} from "../equation-lesson-descriptor.ts";

export const fractionCompositionDescriptor =
  defineKpCanonicalEquationLessonDescriptor({
    id: "fraction-composition",
    createAnimation: () =>
      createKpFractionCompositionEquationAnimationAsset(),
    bindStructuralAnchors: bindKpFractionCompositionStructuralAnchors,
    stageLayoutCompiler: Object.freeze({
      apply: applyKpFractionCompositionPhaseStageLayout
    }),
    readerControls: "fraction-composition-v1" as const,
    compactTranscriptAvailable: false
  });
