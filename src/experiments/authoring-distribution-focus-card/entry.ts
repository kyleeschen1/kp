import "./style.css";
import type { KpInspectionSelection } from "./inspection-selection.ts";
import { bindKpFocusDeckRangeController } from "../focus-deck-range-controller.ts";
import { renderKpAuthoredFocusCard, kpAuthoredDistributionBeats as beats } from "../authored-focus-card-content.ts";
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

const root = document.querySelector<HTMLElement>("#authored-focus-card")!;
const reportGap = (error: unknown) => {
  root.dataset["kpDistributionRepairGap"] = "true";
  const message = root.querySelector('[role="alert"]') ?? document.createElement("p");
  message.setAttribute("role", "alert");
  message.textContent = `Unable to render the authored distribution: ${error instanceof Error ? error.message : String(error)}`;
  root.append(message);
};


async function mount() {
  const response = await fetch("/api/dev/authoring-structural/distribution-focus-card", { cache: "no-store" });
  if (!response.ok) throw new Error("kp.authoring.distribution-card.preparation-gap");
  const data: unknown = await response.json();
  const preview = restoreKpReaderAuthoringDistributionPreview(data);
  const { animation, beforeVersionId, afterVersionId } = preview;
  if (typeof (data as { stageTemplate?: unknown }).stageTemplate !== "string") throw new Error("kp.authoring.distribution-card.template-gap");
  const templateContainer = document.createElement("div");
  templateContainer.innerHTML = (data as { stageTemplate: string }).stageTemplate;
  const template = templateContainer.querySelector<HTMLTemplateElement>("template[data-kp-reader-exemplar-template]");
  if (!template) throw new Error("kp.authoring.distribution-card.template-gap");
  const cohorts = compileKpAnimationTransformationPhaseCohorts(animation);
  const durationMs = animation.timeline?.durationMs;
  if (cohorts[0]?.id !== "fraction-solve.step.distribute" || durationMs === undefined) throw new Error("kp.authoring.distribution-card.range-gap");
  // The card selects the first canonical operation window; it does not retime
  // the animation or reconstruct a replacement distribution asset.
  const end = 1 / cohorts.length;
  root.innerHTML = `<h1>Fraction distribution</h1><p class="source-label">Authoring-backed Focus Card · verified distribution</p>` +
    renderKpAuthoredFocusCard("distribution", '<div class="kp-focus-deck__stage" data-distribution-stage></div>') +
    '<p class="review-help">Next plays distribution. Previous rewinds. Drag the slider to inspect the motion.</p><details><summary>Authoring source and proof</summary><p>This card consumes the prepared structural authoring result through the canonical native renderer. It is not the logarithm example.</p><dl><dt>Before version</dt><dd data-before></dd><dt>After version</dt><dd data-after></dd></dl></details>';
  root.querySelector("[data-before]")!.textContent = beforeVersionId;
  root.querySelector("[data-after]")!.textContent = afterVersionId;
  const card = root.querySelector<HTMLElement>("[data-kp-focus-deck]")!;
  card.dataset["kpAuthoringStructuralBefore"] = beforeVersionId;
  card.dataset["kpAuthoringStructuralAfter"] = afterVersionId;
  const shell = mountKpCanonicalEquationStageShell({ target: card.querySelector<HTMLElement>("[data-distribution-stage]")!, template,
    bindStructuralAnchors: root => bindKpReaderEquationLessonStructuralAnchors({ root, animation, descriptor: fractionCompositionDescriptor }) });
  const salience = createKpFractionCompositionSalienceReaderCapability({ root: card, href: location.href, theme: "light" });
  // Reuse the renderer's existing source/target typography cache rather than
  // replacing computed-style clones on every late-transit sample.
  shell.transitions.forEach(transition => {
    transition.querySelector<HTMLElement>("[data-kp-reader-fit-surface]")!.dataset["kpEquationMaterialVisualCache"] = "dual-revision";
  });
  // Human-review opt-in: never change another distribution caller by asset ID.
  shell.transitions[0]!.querySelector<HTMLElement>("[data-kp-reader-fit-surface]")!.dataset["kpFractionCoherentTransportReview"] = "true";
  const session = await createKpChromeFreeCanonicalEquationSession({ shell, animation, descriptor: fractionCompositionDescriptor,
    prewarmAdjacentTransitions: false,
    equationPresentationProfile: resolveKpReaderEquationPresentationProfile("standard"), linkRoot: card,
    createStageLayoutIntent: planKpFractionCompositionLayout, renderSalience: frame => salience.render(frame) });
  const clock = createKpReaderTimelinePlaybackClock({ id: "reader.focus-card.authored-distribution", durationMs, ownerWindow: window });
  const inspection = new URL(location.href).searchParams.get("inspection") === "true"
    ? (await import("./inspection-bridge.ts")).createKpDistributionInspection(preview)
    : undefined;
  if (inspection) root.dataset["kpSymbolicInspection"] = "ready";
  // Compile the bounded card's native endpoint and attention revisions before
  // opening interaction. Compilation must not consume the playback clock.
  let preparedRevision = "";
  let sampledRevision = "";
  const prepare = () => {
    for (const progress of [0, end / 2, end, 0]) {
      const sample = session.seek(progress);
      preparedRevision = `${sample.layoutRevision}:${sample.fontRevision}`;
    }
  };
  await document.fonts.ready;
  prepare();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let inspectionSelection: KpInspectionSelection | undefined;
  const render = () => {
    try {
      const sample = clock.getSnapshot();
      const result = session.sample({ clock: sample, motionMode: reduced.matches ? "essential" : "continuous",
        ...(inspectionSelection ? { focus: inspectionSelection.paintFocus() } : {}) });
      sampledRevision = `${result.layoutRevision}:${result.fontRevision}`;
      card.dataset["kpDistributionProgress"] = String(sample.progress / end);
      card.dataset["kpDistributionState"] = result.accessibleEquationState;
      if (inspectionSelection) for (const transition of shell.transitions) {
        for (const native of transition.querySelectorAll<HTMLElement>("[data-kp-reader-native]")) {
          native.toggleAttribute("data-kp-inspection-hit-endpoint",
            transition.dataset["kpReaderTransition"] === result.transitionId &&
            native.dataset["kpReaderNative"] === result.nativeEndpoint);
        }
      }
      card.dataset["kpDistributionTransition"] = clock.getStatus() === "playing" ? "active" : "settled";
    } catch (error) {
      clock.pause();
      card.dataset["kpAuthoringDistributionCard"] = "repair-gap";
      reportGap(error);
    }
  };
  let disposeSelection = () => {};
  if (inspection) {
    const module = await import("./inspection-selection.ts");
    const selection = inspectionSelection = module.createKpInspectionSelection(inspection);
    const unsubscribe = selection.subscribe(() => {
      const selected = selection.read();
      if (selected) root.dataset["kpInspectionSelector"] = selected.occurrence.selectorId;
      else delete root.dataset["kpInspectionSelector"];
      render();
    });
    const unbind = module.bindKpInspectionStageSelection({ stage: shell.stage, selection, pause: () => clock.pause() });
    disposeSelection = () => { unbind(); unsubscribe(); selection.dispose(); };
  }
  const controller = bindKpFocusDeckRangeController({
    card, beats, hashPrefix: "beat.authoring-distribution", end, clock, reduced, render,
    prepareNavigation: () => {
      // Late font/layout revisions must be prepared before playback starts.
      render();
      if (sampledRevision !== preparedRevision) { prepare(); render(); }
    },
    prepareResize: () => { session.invalidate(); prepare(); },
    disposeSurface: () => { disposeSelection(); inspection?.dispose(); session.dispose(); }
  });
  import.meta.hot?.dispose(controller.dispose);
  if (!root.dataset["kpDistributionRepairGap"]) {
    card.dataset["kpAuthoringDistributionCard"] = "ready";
    card.dataset["kpFocusCardEnhancement"] = "ready";
  }
}

void mount().catch(reportGap);
