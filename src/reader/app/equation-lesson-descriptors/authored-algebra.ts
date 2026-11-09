import { compile } from "../../../authoring/algebra/compile.ts";
import { composedAlgebraEndpointsV2 } from "../algebra-presentation-endpoints.ts";
import { algebraNativeDescriptor } from "../algebra-native-descriptor.ts";
import type { KpReaderEquationLessonDescriptor } from "../equation-lesson-descriptor.ts";

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
      canonicalSession: { evaluationCertificates: draft.steps.flatMap(step => step.evaluationCertificates), endpointHandoffs: draft.handoffs, prewarmAdjacentTransitions: false },
      // Serialized integer checkpoints map exactly to semantic phase boundaries;
      // linear interpolation preserves every interior position without an epsilon.
      projectAnimationProgress(progress) {
        const p = progress * 1000;
        for (let i = 1; i <= count; i++) {
          const start = Math.round((i - 1) * 1000 / count), end = Math.round(i * 1000 / count);
          if (p <= end) return ((i - 1) + (p - start) / (end - start)) / count;
        }
        return 1;
      }
    };
  }
};
