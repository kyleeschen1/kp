import { mountKpCanonicalEquationStageShell } from "../../reader/app/canonical-equation-stage-shell.ts";
import { createKpChromeFreeCanonicalEquationSession } from "../../reader/app/chrome-free-canonical-equation-session.ts";
import { applyKpSemanticEnvelopeEquationStageLayout } from "../../reader/app/semantic-envelope-stage-layout.ts";
import { resolveKpReaderEquationPresentationProfile } from "../../reader/document/equation-presentation.ts";
import type { KpReaderEquationLessonDescriptor } from "../../reader/app/equation-lesson-descriptor.ts";
import type { KpEquationStageLayoutIntent } from "../../reader/runtime/equation-stage-layout.ts";
import type { compileBayesNotation } from "./notation.ts";

export async function mountBayesNativeSurface(target: HTMLElement, template: HTMLTemplateElement, notation: ReturnType<typeof compileBayesNotation>) {
  const animation = notation.animation, operation = animation.transformations[0]!;
  const endpoints = animation.bundle.objects.map(object => ({ objectId: object.id,
    groupEnvelopes: [{ id: `${object.id}.equation`, memberSelectorIds: [`${object.id}.whole`] }] }));
  const layout: KpEquationStageLayoutIntent = { executionState: "intent", geometryAuthority: "native-measurement", operationSpecificCoordinates: false,
    phases: [{ nodeId: operation.id, policy: "single-row", rows: [{ id: `${operation.id}.row`, role: "equation",
      envelopeIds: endpoints.map(endpoint => endpoint.groupEnvelopes[0]!.id) }] }] };
  const descriptor: KpReaderEquationLessonDescriptor = { id: "bayesian-conditional-quotient", createAnimation: () => animation,
    canonicalTransitionSelection: "all", compactTranscriptAvailable: false,
    stageLayoutCompiler: { apply: input => applyKpSemanticEnvelopeEquationStageLayout({ ...input, endpoints,
      envelopeDataKey: "kpEquationStageEnvelopeId", memberDataKey: "kpEquationStageMemberId",
      envelopeObservation: "member-paint-union", diagnosticLabel: "Bayesian conditional quotient" }) } };
  const shell = mountKpCanonicalEquationStageShell({ target, template, bindStructuralAnchors: root => {
    for (const object of animation.bundle.objects) {
      const state = root.querySelector<HTMLElement>(`[data-kp-reader-equation-state="${CSS.escape(object.id)}"]`)!;
      const math = state.querySelector<HTMLElement>(".katex")!;
      math.dataset["kpEquationStageMemberId"] = `${object.id}.whole`;
      const structural = object.selectors.filter(selector => selector.kind === "artifact");
      if (structural.length) {
        const rules = state.querySelectorAll<HTMLElement>(".frac-line");
        if (rules.length !== 1 || structural.length !== 1) throw new Error("Bayes quotient requires one source fraction rule.");
        rules[0]!.dataset["kpReaderEquationAnchorId"] = `anchor.${structural[0]!.id}`;
        rules[0]!.dataset["kpReaderSelectorId"] = structural[0]!.id;
      }
    }
  } });
  const session = await createKpChromeFreeCanonicalEquationSession({ shell, animation, descriptor,
    equationPresentationProfile: resolveKpReaderEquationPresentationProfile("standard"), linkRoot: target,
    createStageLayoutIntent: () => layout, evaluationCertificates: [notation.certificate], prewarmAdjacentTransitions: false });
  await document.fonts.ready;
  session.seek(0);
  return session;
}
