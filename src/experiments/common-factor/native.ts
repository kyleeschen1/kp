import { assertKpPreparedCommonFactorDraft, type KpPreparedCommonFactorDraft } from "../../authoring/common-factor-draft.ts";
import { commonFactorPresentationEndpoints } from "./endpoints.ts";
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
    equationPresentationProfile: resolveKpReaderEquationPresentationProfile("standard"), linkRoot: card,
    createStageLayoutIntent: () => ({ executionState: "intent", geometryAuthority: "native-measurement", operationSpecificCoordinates: false,
      phases: [{ nodeId: animation.transformations[0]!.id, policy: "single-row", rows: [{ id: "row.common-factor.expression", role: "expression",
        envelopeIds: endpoints.flatMap(e => e.groupEnvelopes.map(g => g.id)) }] }] }) });
  const durationMs = animation.timeline?.durationMs;
  if (durationMs === undefined) { session.dispose(); throw new Error("Missing factoring timeline."); }
  const clock = createKpReaderTimelinePlaybackClock({ id: `reader.${animation.id}`, durationMs, ownerWindow: window });
  const prepare = () => { const saved = clock.getSnapshot().progress; for (const p of [0, .5, 1, saved]) session.seek(p); };
  try { await document.fonts.ready; prepare(); }
  catch (error) { clock.dispose(); session.dispose(); throw error; }
  return { clock, session, prepare,
    render(reduced: boolean) { const sample = session.sample({ clock: clock.getSnapshot(), motionMode: reduced ? "essential" : "continuous" });
      card.dataset["commonFactorProgress"] = String(clock.getSnapshot().progress);
      card.dataset["commonFactorState"] = sample.accessibleEquationState; },
    resize() { session.invalidate(); prepare(); }, dispose() { clock.dispose(); session.dispose(); } };
}
