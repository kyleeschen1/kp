import {
  bindKpGeneratedLinearSolveReaderStructuralAnchors
} from "../../../rendering/generated-linear-solve-selector-annotated-latex.ts";
import {
  createKpVerifiedGeneratedLinearSolveRuntimeAsset
} from "../../../animation/verified-generated-linear-solve-runtime-asset.ts";
import {
  defineKpCanonicalEquationLessonDescriptor
} from "../equation-lesson-descriptor.ts";

export const generatedLinearSolveDescriptor =
  defineKpCanonicalEquationLessonDescriptor({
    id: "generated-linear-solve",
    createAnimation: () =>
      createKpVerifiedGeneratedLinearSolveRuntimeAsset(),
    bindStructuralAnchors: ({ root, state }) => {
      bindKpGeneratedLinearSolveReaderStructuralAnchors({
        root,
        state: {
          objectId: state.id,
          selectors: state.selectors
        }
      });
    },
    stageKicker: () => "Provider-verified · exact rational",
    compactTranscriptAvailable: true
  });
