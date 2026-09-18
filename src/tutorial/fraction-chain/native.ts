import { assertFractionAdditionPresentation, type FractionAdditionPresentation } from "../../authoring/fraction-addition-presentation.ts";
import { compileKpEquationExemplarTemplate } from "../../reader/compiler/equation-exemplar-page.ts";
import { mountKpCanonicalEquationStageShell } from "../../reader/app/canonical-equation-stage-shell.ts";
import { createKpChromeFreeCanonicalEquationSession } from "../../reader/app/chrome-free-canonical-equation-session.ts";
import { applyKpSemanticEnvelopeEquationStageLayout } from "../../reader/app/semantic-envelope-stage-layout.ts";
import { resolveKpReaderEquationPresentationProfile } from "../../reader/document/equation-presentation.ts";
import { createKpNumeratorSplitMergeSelectorAnnotatedLatex } from "../../rendering/numerator-split-merge-selector-annotated-latex.ts";
import { createKpSelectorAnnotatedLatex, type KpSelectorAnnotatedLatexSegment } from "../../rendering/selector-annotated-latex.ts";
import type { KpSemanticAssetObject } from "../../semantic/asset.ts";
import { assertCompiledFractionChain, type CompiledFractionChain } from "../../authoring/fraction-chain-compilation.ts";
import { createKpFractionSelectorAnnotatedLatex } from "../../rendering/generated-fraction-selector-annotated-latex.ts";
import type { KpAnimationAsset } from "../../animation/asset.ts";
import type { KpVerifiedEquationEvaluationFamilyCertificateV2 } from "../../domain-ir/equation-evaluation-family-certificate-v2.ts";
import type { KpSelectorAnnotatedLatex } from "../../rendering/selector-annotated-latex.ts";

export async function mountFractionAdditionSurface(target: HTMLElement, presentation: FractionAdditionPresentation, kind: "merge" | "evaluation") {
  assertFractionAdditionPresentation(presentation);
  return mountCheckedFractionSurface(target, presentation[kind], state => kind === "merge"
    ? createKpNumeratorSplitMergeSelectorAnnotatedLatex(state, "native")?.annotated : annotateNumeratorEvaluation(state),
    kind === "evaluation" ? [presentation.evaluationCertificate] : []);
}

export async function mountFractionReductionSurface(target: HTMLElement, compilation: CompiledFractionChain, index: number) {
  assertCompiledFractionChain(compilation);
  const step = compilation.steps[index];
  if (step?.kind !== "reduce") throw new TypeError("Select the checked reduction step.");
  return mountCheckedFractionSurface(target, step.animation, state => createKpFractionSelectorAnnotatedLatex({ objectId: state.id, selectors: state.selectors }));
}

async function mountCheckedFractionSurface(target: HTMLElement, animation: KpAnimationAsset,
  annotate: (state: KpSemanticAssetObject) => KpSelectorAnnotatedLatex | undefined,
  evaluationCertificates: readonly KpVerifiedEquationEvaluationFamilyCertificateV2[] = []) {
  const endpoints = animation.bundle.objects.map(object => ({ objectId: object.id,
    groupEnvelopes: [{ id: `${object.id}.equation`, memberSelectorIds: [`${object.id}.whole`] }] }));
  const holder = document.createElement("div");
  holder.innerHTML = compileKpEquationExemplarTemplate(animation, annotate);
  const template = holder.querySelector<HTMLTemplateElement>("template")!;
  const shell = mountKpCanonicalEquationStageShell({ target, template, bindStructuralAnchors: root => {
    for (const object of animation.bundle.objects) {
      const states = root.querySelectorAll<HTMLElement>(`[data-kp-reader-equation-state="${CSS.escape(object.id)}"]`);
      for (const state of states) {
        state.querySelector<HTMLElement>(".katex")!.dataset["kpEquationStageMemberId"] = `${object.id}.whole`;
        const structural = object.selectors.filter(selector => selector.kind === "artifact");
        const rules = state.querySelectorAll<HTMLElement>(".frac-line");
        if (rules.length !== structural.length) throw new Error("Fraction native rule ownership differs from the checked structure.");
        structural.forEach((selector, index) => {
          rules[index]!.dataset["kpReaderEquationAnchorId"] = `anchor.${selector.id}`;
          rules[index]!.dataset["kpReaderSelectorId"] = selector.id;
        });
      }
    }
  } });
  const session = await createKpChromeFreeCanonicalEquationSession({ shell, animation,
    descriptor: { id: "fraction-addition-exemplar", createAnimation: () => animation, canonicalTransitionSelection: "all", compactTranscriptAvailable: true,
      stageLayoutCompiler: { apply: input => applyKpSemanticEnvelopeEquationStageLayout({ ...input, endpoints,
        envelopeDataKey: "kpEquationStageEnvelopeId", memberDataKey: "kpEquationStageMemberId", envelopeObservation: "member-paint-union", diagnosticLabel: "Fraction addition" }) } },
    equationPresentationProfile: resolveKpReaderEquationPresentationProfile("standard"), linkRoot: target,
    evaluationCertificates, prewarmAdjacentTransitions: false,
    createStageLayoutIntent: () => ({ executionState: "intent", geometryAuthority: "native-measurement", operationSpecificCoordinates: false,
      phases: animation.transformations.map(operation => ({ nodeId: operation.id, policy: "single-row", rows: [{ id: `${operation.id}.row`, role: "equation",
        envelopeIds: endpoints.filter(e => [...operation.sourceObjectIds, ...operation.targetObjectIds].includes(e.objectId)).map(e => e.groupEnvelopes[0]!.id) }] })) }) });
  await document.fonts.ready;
  session.seek(0);
  return session;
}

function annotateNumeratorEvaluation(state: KpSemanticAssetObject) {
  const semantic = state.selectors.filter(selector => selector.kind !== "artifact");
  const denominator = semantic.find(selector => selector.metadata?.["equationStructureRole"] === "denominator")!;
  const token = (selector: typeof denominator): KpSelectorAnnotatedLatexSegment => ({ kind: "selector", selectorId: selector.id, latex: selector.label! });
  return createKpSelectorAnnotatedLatex({ id: `fraction-evaluation.${state.id}`, expectedSelectorIds: semantic.map(selector => selector.id),
    segments: [{ kind: "latex", latex: "\\frac{" }, ...semantic.filter(selector => selector !== denominator).map(token),
      { kind: "latex", latex: "}{" }, token(denominator), { kind: "latex", latex: "}" }] });
}
