import { assertKpPreparedCommonFactorDraft, type KpPreparedCommonFactorDraft } from "../../authoring/common-factor-draft.ts";
import { commonFactorPresentationEndpoints, composedAlgebraOperationEndpoints } from "./endpoints.ts";
import { assertKpComposedAlgebraPresentation, type KpComposedAlgebraPresentation } from "../../authoring/composed-algebra-presentation.ts";
import type { KpAnimationAsset } from "../../animation/asset.ts";
import type { KpStructuredEquationAnnotatedEndpoint } from "../../rendering/structured-equation-selector-annotated-latex.ts";
import type { KpVerifiedEquationEvaluationFamilyCertificateV2 } from "../../domain-ir/equation-evaluation-family-certificate-v2.ts";
import { assertKpCommonFactorPresentation, type KpCommonFactorPresentation } from "../../authoring/common-factor-presentation.ts";
import { findKpRegisteredOperationPresentationPlan } from "../../animation/operation-presentation-plan-types.ts";
import { compileKpEquationExemplarTemplate } from "../../reader/compiler/equation-exemplar-page.ts";
import { mountKpCanonicalEquationStageShell } from "../../reader/app/canonical-equation-stage-shell.ts";
import { createKpChromeFreeCanonicalEquationSession } from "../../reader/app/chrome-free-canonical-equation-session.ts";
import { defineKpCanonicalEquationLessonDescriptor, bindKpReaderEquationLessonStructuralAnchors } from "../../reader/app/equation-lesson-descriptor.ts";
import { bindKpStructuredEquationSemanticEnvelopes } from "../../rendering/structured-equation-semantic-envelopes.ts";
import { applyKpSemanticEnvelopeEquationStageLayout } from "../../reader/app/semantic-envelope-stage-layout.ts";
import { resolveKpReaderEquationPresentationProfile } from "../../reader/document/equation-presentation.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import type { KpReaderEquationLessonDescriptor } from "../../reader/app/equation-lesson-descriptor.ts";
import { createKpFocusDeckCheckpointMap } from "../../tutorial/focus-deck-beat-navigation.ts";

export async function mountCommonFactorNativeSurface(card: HTMLElement, draft: KpPreparedCommonFactorDraft) {
  assertKpPreparedCommonFactorDraft(draft);
  return mountCanonicalFactoringPresentation(card, draft.presentation);
}

/** This owner accepts no asset, descriptor, layout or choreography override.
 * Future hosts reuse this mount with a resolved binding, not copied setup. */
export async function mountCanonicalFactoringPresentation(card: HTMLElement, presentation: KpCommonFactorPresentation) {
  assertKpCommonFactorPresentation(presentation);
  const animation = presentation.animation, endpoints = commonFactorPresentationEndpoints(presentation);
  if (findKpRegisteredOperationPresentationPlan(animation.transformations[0]!) !== presentation.plan)
    throw new TypeError("Factoring presentation is detached from its registered operation owner.");
  return mountResolvedCanonicalOperation(card, presentation, animation, endpoints);
}

export async function mountCanonicalComposedAlgebraOperation(card: HTMLElement, presentation: KpComposedAlgebraPresentation, step: 0 | 1) {
  assertKpComposedAlgebraPresentation(presentation);
  return mountResolvedCanonicalOperation(card, { ...presentation, canonicalReference: presentation.steps[step].canonicalReference },
    presentation.steps[step].animation, composedAlgebraOperationEndpoints(presentation, step), presentation.steps[step].evaluationCertificates);
}

export async function mountCanonicalComposedAlgebraPresentation(card: HTMLElement, presentation: KpComposedAlgebraPresentation) {
  assertKpComposedAlgebraPresentation(presentation);
  const endpoints = [...composedAlgebraOperationEndpoints(presentation, 0), ...composedAlgebraOperationEndpoints(presentation, 1).slice(1)];
  return mountResolvedCanonicalOperation(card, { ...presentation, canonicalReference: presentation.steps.map(step => step.canonicalReference).join(" ") },
    presentation.animation, endpoints, presentation.steps.flatMap(step => step.evaluationCertificates), presentation.checkpointProgress);
}

// Only the authenticated public mounts select these arguments; hosts cannot
// pair an unrelated animation, annotation or plan with a checked source.
async function mountResolvedCanonicalOperation(card: HTMLElement, presentation: { owner: string; canonicalReference: string; revisionId: string },
  animation: KpAnimationAsset, endpoints: readonly KpStructuredEquationAnnotatedEndpoint[],
  evaluationCertificates: readonly KpVerifiedEquationEvaluationFamilyCertificateV2[] = [], checkpointProgress: readonly number[] = [0, 1]) {
  const checkpoints = createKpFocusDeckCheckpointMap(checkpointProgress);
  const semanticProgressAt = (elapsedProgress: number) => checkpoints.positionAt(elapsedProgress) / checkpoints.last;
  card.dataset["canonicalPresentationOwner"] = presentation.owner;
  card.dataset["canonicalPresentationReference"] = presentation.canonicalReference;
  card.dataset["canonicalPresentationRevision"] = presentation.revisionId;
  const descriptor = defineKpCanonicalEquationLessonDescriptor({ id: "authored-common-factor", createAnimation: () => animation,
    compactTranscriptAvailable: true,
    bindStructuralAnchors: ({ root, state }) => {
      const endpoint = endpoints.find(e => e.stateId === state.id);
      if (!endpoint) throw new Error("Unknown common-factor native endpoint.");
      bindKpStructuredEquationSemanticEnvelopes({ root, endpoint, envelopeIds: endpoint.groupEnvelopes.map(e => e.id), realization: "virtual" });
    },
    stageLayoutCompiler: { apply: input => applyKpSemanticEnvelopeEquationStageLayout({ ...input,
      endpoints: endpoints.map(e => ({ objectId: e.stateId, groupEnvelopes: e.groupEnvelopes })),
      envelopeDataKey: "kpEquationStageEnvelopeId", memberDataKey: "kpEquationStageMemberId", envelopeObservation: "member-paint-union", diagnosticLabel: "Common factoring" }) }
  } satisfies Omit<KpReaderEquationLessonDescriptor, "canonicalTransitionSelection">);
  const container = document.createElement("div");
  container.innerHTML = compileKpEquationExemplarTemplate(animation, state => endpoints.find(e => e.stateId === state.id)?.annotated);
  const template = container.querySelector<HTMLTemplateElement>("template")!;
  const shell = mountKpCanonicalEquationStageShell({ target: card.querySelector<HTMLElement>("[data-distribution-stage]")!, template,
    bindStructuralAnchors: root => bindKpReaderEquationLessonStructuralAnchors({ root, animation, descriptor }) });
  shell.transitions.forEach(t => { t.querySelector<HTMLElement>("[data-kp-reader-fit-surface]")!.dataset["kpEquationMaterialVisualCache"] = "dual-revision"; });
  const session = await createKpChromeFreeCanonicalEquationSession({ shell, animation, descriptor, prewarmAdjacentTransitions: false,
    evaluationCertificates,
    equationPresentationProfile: resolveKpReaderEquationPresentationProfile("standard"), linkRoot: card,
    createStageLayoutIntent: () => ({ executionState: "intent", geometryAuthority: "native-measurement", operationSpecificCoordinates: false,
      phases: animation.transformations.map(operation => ({ nodeId: operation.id, policy: "single-row", rows: [{ id: "row.common-factor.expression", role: "expression",
        envelopeIds: endpoints.filter(e => [...operation.sourceObjectIds, ...operation.targetObjectIds].includes(e.stateId)).flatMap(e => e.groupEnvelopes.map(g => g.id)) }] })) }) });
  const durationMs = animation.timeline?.durationMs;
  if (durationMs === undefined) { session.dispose(); throw new Error("Missing factoring timeline."); }
  const clock = createKpReaderTimelinePlaybackClock({ id: `reader.${animation.id}`, durationMs, ownerWindow: window });
  const prepare = () => {
    const saved = semanticProgressAt(clock.getSnapshot().progress);
    for (let i = 0; i <= checkpoints.last * 2; i++) session.seek(i / (checkpoints.last * 2));
    session.seek(saved);
  };
  try { await document.fonts.ready; prepare(); }
  catch (error) { clock.dispose(); session.dispose(); throw error; }
  return { clock, session, prepare, checkpoints,
    render(reduced: boolean) {
      // The sole scheduler advances elapsed time. The existing checkpoint map
      // projects it into semantic phase space without changing either motif's duration.
      const raw = clock.getSnapshot(), progress = semanticProgressAt(raw.progress);
      const sample = session.sample({ clock: { ...raw, progress, progressPermille: Math.round(progress * 1000) }, motionMode: reduced ? "essential" : "continuous" });
      card.dataset["commonFactorProgress"] = String(clock.getSnapshot().progress);
      card.dataset["commonFactorState"] = sample.accessibleEquationState; },
    resize() { session.invalidate(); prepare(); }, dispose() { clock.dispose(); session.dispose(); } };
}
