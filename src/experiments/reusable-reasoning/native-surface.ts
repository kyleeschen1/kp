import { restoreKpReaderAuthoringDistributionPreview } from "../../reader/app/authoring-distribution-preview.ts";
import { mountKpCanonicalEquationStageShell } from "../../reader/app/canonical-equation-stage-shell.ts";
import { createKpChromeFreeCanonicalEquationSession } from "../../reader/app/chrome-free-canonical-equation-session.ts";
import { bindKpReaderEquationLessonStructuralAnchors } from "../../reader/app/equation-lesson-descriptor.ts";
import { fractionCompositionDescriptor } from "../../reader/app/equation-lesson-descriptors/fraction-composition.ts";
import { resolveKpReaderEquationPresentationProfile } from "../../reader/document/equation-presentation.ts";
import { planKpFractionCompositionLayout } from "../../reader/runtime/fraction-composition-layout.ts";
import { createKpFractionCompositionSalienceReaderCapability } from "../../reader/app/fraction-composition-salience-adapter.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { compileKpAnimationTransformationPhaseCohorts } from "../../animation/transformation-phase-cohorts.ts";
import type { KpReasoningEvidence } from "./evidence.ts";
import { bindKpReasoningSupport } from "./support.ts";
import { KpReasoningRepairGap } from "./source.ts";

export async function mountReasoningNativeSurface(card: HTMLElement, evidence: KpReasoningEvidence) {
  bindKpReasoningSupport(evidence);
  const response = await fetch("/api/dev/authoring-structural/distribution-focus-card", { cache: "no-store" });
  if (!response.ok) throw new KpReasoningRepairGap("kp.reasoning.native-source", "$.native", "Restore the existing authored structural preview.");
  const data: unknown = await response.json();
  const { animation } = restoreKpReaderAuthoringDistributionPreview(data);
  const cohorts = compileKpAnimationTransformationPhaseCohorts(animation);
  if (cohorts.length !== evidence.states.length - 1) throw new KpReasoningRepairGap(
    "kp.reasoning.native-clock", "$.native", "The native cohort sequence must match the canonical semantic trace.");
  for (const state of evidence.states) {
    const object = animation.bundle.objects.find(item => item.id === state.stateId);
    const value = object?.value;
    if (typeof value !== "object" || value === null || !("latex" in value)
      || value.latex !== state.segments.map(segment => segment.latex).join("")) {
      throw new KpReasoningRepairGap("kp.reasoning.native-endpoint", "$.native",
        "Actual native endpoint source must match verified reasoning states, not just the asset ID.");
    }
  }
  const html = (data as { stageTemplate?: unknown }).stageTemplate;
  if (typeof html !== "string") throw new Error("kp.reasoning.native-template");
  const container = document.createElement("div");
  container.innerHTML = html;
  const template = container.querySelector<HTMLTemplateElement>("template[data-kp-reader-exemplar-template]");
  if (!template) throw new Error("kp.reasoning.native-template");
  const shell = mountKpCanonicalEquationStageShell({
    target: card.querySelector<HTMLElement>("[data-distribution-stage]")!, template,
    bindStructuralAnchors: root => bindKpReaderEquationLessonStructuralAnchors({ root, animation, descriptor: fractionCompositionDescriptor })
  });
  const salience = createKpFractionCompositionSalienceReaderCapability({ root: card, href: location.href, theme: "light" });
  shell.transitions.forEach(transition => {
    transition.querySelector<HTMLElement>("[data-kp-reader-fit-surface]")!.dataset["kpEquationMaterialVisualCache"] = "dual-revision";
  });
  // Same accepted fractional source and native transport treatment as the reference host.
  shell.transitions[0]!.querySelector<HTMLElement>("[data-kp-reader-fit-surface]")!.dataset["kpFractionCoherentTransportReview"] = "true";
  const session = await createKpChromeFreeCanonicalEquationSession({
    shell, animation, descriptor: fractionCompositionDescriptor, prewarmAdjacentTransitions: false,
    equationPresentationProfile: resolveKpReaderEquationPresentationProfile("standard"), linkRoot: card,
    createStageLayoutIntent: planKpFractionCompositionLayout, renderSalience: frame => salience.render(frame)
  });
  const durationMs = animation.timeline?.durationMs;
  if (durationMs === undefined || durationMs <= 0) { session.dispose(); throw new Error("kp.reasoning.native-duration"); }
  const clock = createKpReaderTimelinePlaybackClock({
    id: "reader.reasoning.fraction", durationMs, ownerWindow: window
  });
  const prepare = () => {
    const saved = clock.getSnapshot().progress;
    for (let index = 0; index <= 8; index++) session.seek(index / (2 * cohorts.length));
    session.seek(saved);
  };
  await document.fonts.ready;
  prepare();
  return {
    clock, prepare,
    render(reduced: boolean) {
      const sample = session.sample({ clock: clock.getSnapshot(), motionMode: reduced ? "essential" : "continuous" });
      card.dataset["kpReasoningState"] = sample.accessibleEquationState;
      card.dataset["kpReasoningProgress"] = String(clock.getSnapshot().progress);
    },
    resize() { session.invalidate(); prepare(); },
    dispose() { clock.dispose(); session.dispose(); }
  };
}
