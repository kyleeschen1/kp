import { compile } from "../../../authoring/algebra/compile.ts";
import { composedAlgebraEndpointsV2 } from "../algebra-presentation-endpoints.ts";
import { algebraNativeDescriptor } from "../algebra-native-descriptor.ts";
import type { KpReaderEquationLessonDescriptor } from "../equation-lesson-descriptor.ts";
import { projectEquationCheckpointProgress } from '../equation-checkpoint-progress.ts';

export const authoredAlgebraDescriptor: KpReaderEquationLessonDescriptor = {
  id: "authored-algebra", compactTranscriptAvailable: true,
  createAnimation() { throw new Error("Authored algebra requires its checked serialized source."); },
  bindSource(source) {
    const draft = compile(source), count = draft.animation.transformations.length;
    const descriptor = algebraNativeDescriptor(draft.animation, composedAlgebraEndpointsV2(draft));
    return { ...descriptor, id: "authored-algebra",
      // Reader focus changes native ink color, never geometry. Reuse captured
      // paint through focus release instead of rebuilding during a scroll.
      focusPaint: 'native-color',
      canonicalSession: { evaluationCertificates: draft.steps.flatMap(step => step.evaluationCertificates), endpointHandoffs: draft.handoffs },
      // Serialized integer checkpoints map exactly to semantic phase boundaries;
      // linear interpolation preserves every interior position without an epsilon.
      projectAnimationProgress(progress) {
        return projectEquationCheckpointProgress(progress, count);
      }
    };
  }
};
