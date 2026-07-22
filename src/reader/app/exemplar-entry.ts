import {
  createLinearSolveAnimationAsset,
  createLinearSolveTeacherZeroAnimationAsset
} from "../../animation/linear-solve-adapter.ts";
import {
  createFractionalLinearEquationAnimationAsset
} from "../../animation/fractional-linear-equation-adapter.ts";
import {
  createDivideBothSidesEquationAnimationAsset
} from "../../animation/divide-both-sides-equation-adapter.ts";
import {
  createNumeratorSplitMergeEquationAnimationAsset
} from "../../animation/numerator-split-merge-equation-adapter.ts";
import {
  createFractionalLinearTransferBalancedAnimationAsset,
  createFractionalLinearTransferFluentAnimationAsset
} from "../../animation/fractional-linear-transfer-comparison-adapter.ts";
import {
  bindKpFractionalLinearStructuralAnchors
} from "../../rendering/fractional-linear-selector-annotated-latex.ts";
import {
  bindKpDivideBothSidesStructuralAnchors
} from "../../rendering/divide-both-sides-selector-annotated-latex.ts";
import {
  bindKpNumeratorSplitMergeStructuralAnchors
} from "../../rendering/numerator-split-merge-selector-annotated-latex.ts";
import {
  createKpEquationLinearRearrangementBindings
} from "../../rendering/equation-linear-rearrangement-bindings.ts";
import {
  createKpWitnessedAnnihilationBinding
} from "../../animation/witnessed-annihilation.ts";
import { createKpEquationFontReadiness } from "../../rendering/equation-font-readiness.ts";
import { kpEquationPresentationProfile } from "../../rendering/equation-presentation-policy.ts";
import { checkKpEquationNativeEndpointLaw } from "../../rendering/equation-native-endpoint-law.ts";
import {
  applyKpReaderEquationResponsiveFit,
  compileKpReaderEquationMaterialPlan,
  createKpReaderEquationFrameScheduler,
  createKpReaderEquationMaterialLayer,
  measureKpReaderEquationLayoutSnapshot,
  planKpReaderEquationPerceptualAlignment,
  planKpReaderEquationSequenceResponsiveFit,
  projectKpCertifiedTransferMaterialPlan,
  projectKpReaderEquationIdentityWitness,
  projectKpReaderEquationRenderPlan,
  sampleKpReaderEquationSymbolMotion,
  type KpReaderEquationLayoutSnapshot,
  type KpReaderEquationMaterialOwnerFrame,
  type KpReaderEquationMaterialPlan,
  type KpReaderEquationPerceptualAlignmentPlan,
  type KpReaderEquationResponsiveFitPlan,
  type KpReaderEquationSymbolMotionFrame
} from "../renderers/public-api.ts";
import {
  createKpReaderClockSample,
  createKpReaderActiveLocationService,
  createKpReaderContinuousScrollClock,
  createKpReaderSemanticFocusService,
  createKpReaderSessionSnapshot,
  decodeKpReaderSessionUrl,
  defineKpReaderEquationPresentationCapability,
  encodeKpReaderSessionUrl,
  projectKpReaderMotion,
  parseKpReaderMotionPreference,
  projectKpReaderAttention,
  resolveKpReaderResponsiveProjection,
  resolveKpReaderEquationPresentationProfile,
  resolveKpReaderMotionPolicy,
  selectKpReaderEquationPresentation,
  sampleKpReaderAnimationFrame,
  type KpReaderClockSample,
  type KpReaderContinuousScrollClock,
  type KpReaderFocusSnapshot,
  type KpReaderMotionPreference,
  type KpReaderAttentionProjection
} from "../runtime/public-api.ts";
import type {
  KpLessonAttentionPhaseKind,
  KpLessonAttentionPlan
} from "../document/public-api.ts";

interface TransitionContext {
  readonly id: string;
  readonly element: HTMLElement;
  readonly fitSurface: HTMLElement;
  readonly measurementRoot: HTMLElement;
  readonly materialPlan: KpReaderEquationMaterialPlan;
  readonly anchorElements: ReadonlyMap<string, HTMLElement>;
  readonly layout: KpReaderEquationLayoutSnapshot;
  readonly alignment: KpReaderEquationPerceptualAlignmentPlan;
  readonly fit: KpReaderEquationResponsiveFitPlan;
}

interface LayoutState {
  readonly contexts: ReadonlyMap<string, TransitionContext>;
}

const documentId = requiredData(document.body, "kpReaderDocumentId");
const documentVersion = requiredData(document.body, "kpReaderDocumentVersion");
const lessonVariant = requiredData(document.body, "kpReaderLessonVariant");
const compiledEquationPresentation = defineKpReaderEquationPresentationCapability({
  defaultProfileId: resolveKpReaderEquationPresentationProfile(
    requiredData(document.body, "kpReaderEquationProfileDefault")
  ).id,
  profileIds: requiredData(document.body, "kpReaderEquationProfiles")
    .split(",")
    .map((id) => resolveKpReaderEquationPresentationProfile(id).id)
});
const requestedEquationProfileId = new URL(window.location.href).searchParams.get(
  "kpProfile"
);
const equationPresentationSelection = selectKpReaderEquationPresentation({
  capability: compiledEquationPresentation,
  requestedProfileId: requestedEquationProfileId,
  source: "url"
});
const equationPresentationProfile = equationPresentationSelection.profile;
document.body.dataset["kpReaderEquationProfile"] = equationPresentationProfile.id;
document.body.dataset["kpReaderEquationProfileSource"] =
  equationPresentationSelection.source;
// The semantic URL is the scroll authority. Browser history restoration can
// otherwise race a requested frame when moving between two lesson URLs.
window.history.scrollRestoration = "manual";
const animation = lessonVariant === "teacher-zero"
  ? createLinearSolveTeacherZeroAnimationAsset()
  : lessonVariant === "fractional-linear"
    ? createFractionalLinearEquationAnimationAsset()
    : lessonVariant === "fractional-transfer"
      ? equationPresentationProfile.derivation === "certified-transfer-v1"
        ? createFractionalLinearTransferFluentAnimationAsset()
        : createFractionalLinearTransferBalancedAnimationAsset()
    : lessonVariant === "divide-both-sides"
      ? createDivideBothSidesEquationAnimationAsset()
    : lessonVariant === "numerator-split-merge"
      ? createNumeratorSplitMergeEquationAnimationAsset()
    : createLinearSolveAnimationAsset();
const presentationProfile = kpEquationPresentationProfile(animation);
const linearRearrangementBindings = createKpEquationLinearRearrangementBindings(
  animation
);
const story = requireElement<HTMLElement>("[data-kp-asset]");
const staticSurface = requireElement<HTMLElement>("[data-kp-animation-static]");
const template = requireElement<HTMLTemplateElement>("template[data-kp-reader-exemplar-template]");
const templateContent = template.content.cloneNode(true);
staticSurface.append(templateContent);
if (lessonVariant === "fractional-linear" || lessonVariant === "fractional-transfer") {
  bindFractionalStructuralAnchors();
}
if (lessonVariant === "divide-both-sides") bindDivideBothSidesStructuralAnchors();
if (lessonVariant === "numerator-split-merge") bindNumeratorSplitMergeStructuralAnchors();
document.body.dataset["kpReaderHydrated"] = "true";

const stage = requireElement<HTMLElement>("[data-kp-reader-equation-stage]");
const stageKicker = requireElement<HTMLElement>("[data-kp-reader-stage-kicker]");
if (
  lessonVariant === "fractional-transfer" &&
  equationPresentationProfile.derivation === "certified-transfer-v1"
) {
  stageKicker.textContent = "Follow the certified shortcut";
}
stage.dataset["kpReaderEquationPresentationRecipe"] = presentationProfile.recipe;
stage.dataset["kpReaderAnimationId"] = animation.id;
stage.dataset["kpReaderEquationHandoffRecipe"] = presentationProfile.handoff;
stage.dataset["kpReaderEquationCancellationRecipe"] = presentationProfile.cancellation;
stage.dataset["kpReaderEquationZeroWitnessRecipe"] = presentationProfile.zeroWitness;
stage.dataset["kpReaderEquationSuccessorRecipe"] = presentationProfile.successor;
stage.dataset["kpReaderEquationDepthRecipe"] = presentationProfile.depth;
stage.dataset["kpReaderEquationContinuantRecipe"] = presentationProfile.continuants;
stage.dataset["kpReaderEquationProfile"] = equationPresentationProfile.id;
stage.dataset["kpReaderEquationDerivationMode"] = equationPresentationProfile.derivation;
stage.dataset["kpReaderEquationIdentityMode"] = equationPresentationProfile.identity;
const viewport = requireElement<HTMLElement>("[data-kp-reader-equation-viewport]");
const materialFitSurface = requireElement<HTMLElement>(
  "[data-kp-reader-material-fit-surface]"
);
const annihilationWitness = requireElement<HTMLElement>(
  "[data-kp-reader-annihilation-witness]"
);
const identityWitnessValues = new Map(
  [...annihilationWitness.querySelectorAll<HTMLElement>("[data-kp-reader-identity-value]")]
    .map((element) => [requiredData(element, "kpReaderIdentityValue"), element] as const)
);
const independentZeroWitness = requireElement<HTMLElement>(
  "[data-kp-reader-independent-zero-witness]"
);
const status = requireElement<HTMLOutputElement>("[data-kp-reader-stage-status]");
const focusStepper = requireElement<HTMLElement>("[data-kp-reader-focus-stepper]");
const attentionPrevious = requireElement<HTMLButtonElement>(
  "[data-kp-reader-attention-previous]"
);
const attentionNext = requireElement<HTMLButtonElement>("[data-kp-reader-attention-next]");
const attentionStatus = requireElement<HTMLOutputElement>(
  "[data-kp-reader-attention-status]"
);
const attentionScrubber = requireElement<HTMLInputElement>(
  "[data-kp-reader-attention-scrubber]"
);
const attentionCount = requireElement<HTMLElement>("[data-kp-reader-attention-count]");
const progressBar = requireElement<HTMLElement>("[data-kp-reader-progress-bar]");
const motionSelect = requireElement<HTMLSelectElement>(
  "[data-kp-reader-motion-preference]"
);
const equationProfileSelect = document.querySelector<HTMLSelectElement>(
  "[data-kp-reader-equation-profile-control]"
);
if (equationProfileSelect !== null) {
  equationProfileSelect.value = equationPresentationProfile.id;
}
const shareLink = requireElement<HTMLAnchorElement>("[data-kp-reader-share]");
const beats = [...story.querySelectorAll<HTMLElement>("[data-kp-beat]")];
const attentionElements = [
  ...story.querySelectorAll<HTMLElement>("[data-kp-attention-phase]")
];
const attention = readAttentionPlan();
focusStepper.hidden = attention === undefined;
applyResponsiveProjection();
const toc = requireElement<HTMLElement>(".kp-lesson-toc");
const activeLocation = createKpReaderActiveLocationService({ toc, beats });
const accessibleCheckpoints = beats.map((beat) => ({
  id: requiredData(beat, "kpBeat"),
  label: beat.querySelector("h2")?.textContent?.trim() ?? requiredData(beat, "kpBeat"),
  progressPermille: Number(requiredData(beat, "kpCheckpoint"))
}));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const motionPreferenceStorageKey = "kp.reader.motion-preference.v1";
let motionPreference = initialMotionPreference();
motionSelect.value = motionPreference;
const fontReadiness = createKpEquationFontReadiness(document);
const transitionElements = [
  ...stage.querySelectorAll<HTMLElement>("[data-kp-reader-transition]")
].filter((element) => animation.transformations.some((transformation) =>
  transformation.id === requiredData(element, "kpReaderTransition")
));
const witnessedBindings = new Map(animation.transformations.flatMap((transformation) => {
  if (equationPresentationProfile.identity !== "hold-until-settled-v1") return [];
  if (
    presentationProfile.cancellation !== "witnessed-annihilation-v1" &&
    presentationProfile.zeroWitness !== "embedded-v1"
  ) return [];
  const operationId = cancellationOperationId(transformation.transformType);
  if (operationId === undefined) return [];
  const cancellation = transformation.correspondenceMap?.records.find(
    (record) => record.relation === "cancelation"
  );
  if (cancellation === undefined) return [];
  return [[transformation.id, createKpWitnessedAnnihilationBinding({
    operationId,
    transformation,
    bundle: animation.bundle,
    cancellationRecordId: cancellation.id
  })] as const];
}));
const allowedFocusRefs = animation.bundle.objects.flatMap((object) => [
  object.id,
  ...object.selectors.map((selector) => selector.id)
]);
const equationObjectRefs = new Set(animation.bundle.objects.map((object) => object.id));
const focus = createKpReaderSemanticFocusService(allowedFocusRefs);
let activeBeat = beats[0];
let scrollClock = createScrollClock();
let settleTimer: number | undefined;
let scrollFrame: number | undefined;
let previousReviewFrameAtMs: number | undefined;
let previousReviewScrollY = window.scrollY;
let urlAuthorityReady = false;
let controlSample: KpReaderClockSample | undefined;

const staticPlans = new Map(animation.transformations.map((transformation, index) => {
  const progress = (index + 0.5) / animation.transformations.length;
  const clock = createKpReaderClockSample({ source: "scroll", progress });
  const runtimeFrame = sampleKpReaderAnimationFrame({ animation, clock });
  const renderPlan = projectKpReaderEquationRenderPlan({ animation, runtimeFrame });
  return [
    transformation.id,
    projectKpCertifiedTransferMaterialPlan(
      compileKpReaderEquationMaterialPlan(renderPlan)
    )
  ] as const;
}));
const materialLayer = createKpReaderEquationMaterialLayer(
  requireDescendant<HTMLElement>(viewport, "[data-kp-reader-equation-material-layer]")
);
let lastMeasuredLayout: LayoutState | undefined;

const scheduler = createKpReaderEquationFrameScheduler<
  KpReaderClockSample,
  LayoutState,
  LayoutState,
  { readonly sample: KpReaderClockSample; readonly layout: LayoutState }
>({
  readLayout: ({ revision }) => measureLayout(revision),
  planLayout: (layout) => layout,
  planFrame: ({ input, layout }) => ({ sample: input, layout }),
  writeFrame: ({ sample, layout }) => renderSample(sample, layout)
});

const unsubscribeFocus = focus.subscribe((snapshot) => {
  applyFocus(snapshot);
  updateShareLink(lastSample());
});
const resizeObserver = new ResizeObserver(() => {
  updateScrollGeometry();
  scheduler.invalidate("resize");
  scheduleScrollSample();
});
resizeObserver.observe(viewport);

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onResize, { passive: true });
window.addEventListener("scrollend", settleLocation, { passive: true });
window.addEventListener("wheel", releaseControlAuthority, { passive: true });
window.addEventListener("touchstart", releaseControlAuthority, { passive: true });
window.addEventListener("pointerdown", releaseControlAuthority, { passive: true });
window.addEventListener("keydown", onReaderKeyDown);
document.addEventListener("pointerover", onSemanticEnter);
document.addEventListener("pointerout", onSemanticLeave);
document.addEventListener("focusin", onSemanticEnter);
document.addEventListener("focusout", onSemanticLeave);
window.addEventListener("pagehide", dispose, { once: true });
reducedMotion.addEventListener("change", renderCurrentSample);
motionSelect.addEventListener("change", onMotionPreferenceChange);
equationProfileSelect?.addEventListener("change", onEquationProfileChange);
attentionPrevious.addEventListener("click", onAttentionPrevious);
attentionNext.addEventListener("click", onAttentionNext);
attentionScrubber.addEventListener("input", onAttentionScrub);
if (import.meta.env.DEV) {
  window.addEventListener("kp:reader-dev-review-request-frame", renderCurrentSample);
}

const unsubscribeFontReadiness = fontReadiness.subscribe(() => {
  scheduler.invalidate("fonts");
  scheduleScrollSample();
});
updateScrollGeometry();
// Initial geometry must be measured from final KaTeX fonts. Rendering before
// this gate creates a visible first-frame font and width swap on slow loads.
void fontReadiness.whenReady().then(() => {
  restoreUrlLocation();
  updateScrollGeometry();
  scheduler.invalidate("fonts");
  scheduleScrollSample();
  // History writes must wait until the URL-selected scroll position has
  // produced its first frame; otherwise an early scrollend can persist zero.
  window.requestAnimationFrame(() => {
    urlAuthorityReady = true;
  });
});
if (import.meta.env.DEV) {
  void import("../../dev-review/reader-review-bootstrap.ts").then(({ mountKpReaderDevReview }) => {
    mountKpReaderDevReview(window);
  });
}

function createScrollClock(): KpReaderContinuousScrollClock {
  const geometry = scrollGeometry();
  return createKpReaderContinuousScrollClock({
    id: "clock.reader.solve-x.scroll",
    geometry,
    initialPositionPx: readerPosition(),
    checkpoints: beats.map((beat) => ({
      id: requiredData(beat, "kpBeat"),
      progressPermille: Number(requiredData(beat, "kpCheckpoint"))
    }))
  });
}

function updateScrollGeometry(): void {
  const geometry = scrollGeometry();
  document.body.dataset["kpReaderViewportAnchor"] = String(
    readerViewportAnchorFraction()
  );
  if (scrollClock === undefined) return;
  scrollClock.updateGeometry(geometry);
}

function onResize(): void {
  const progressPermille = lastSample().progressPermille;
  applyResponsiveProjection();
  updateScrollGeometry();
  // A breakpoint changes the document's geometry. Re-anchor the semantic
  // moment so responsive projection cannot silently behave like navigation.
  if (isFocusStepperProjection()) {
    setExplicitProgress(progressPermille, "controls", false);
    scrollFocusWorkspaceIntoView();
  } else {
    scrollToProgress(progressPermille);
  }
}

function applyResponsiveProjection(): void {
  document.body.dataset["kpReaderResponsiveProjection"] =
    resolveKpReaderResponsiveProjection({
      viewportWidth: window.innerWidth,
      attentionAvailable: attention !== undefined,
      // The compact transcript is an explicit lesson capability. Treating a
      // missing attention plan as sufficient changed legacy reader geometry.
      compactTranscriptAvailable: lessonVariant === "fractional-linear"
    });
}

function scrollGeometry(): { readonly startPx: number; readonly endPx: number } {
  const first = beats[0];
  const last = beats.at(-1);
  if (first === undefined || last === undefined) {
    throw new Error("The semantic reader exemplar requires explanation beats.");
  }
  const firstRect = first.getBoundingClientRect();
  const lastRect = last.getBoundingClientRect();
  const startPx = window.scrollY + firstRect.top + firstRect.height * 0.36;
  const endPx = window.scrollY + lastRect.top + lastRect.height * 0.64;
  return endPx > startPx ? { startPx, endPx } : { startPx, endPx: startPx + 1 };
}

function readerPosition(): number {
  return window.scrollY + window.innerHeight * readerViewportAnchorFraction();
}

function readerViewportAnchorFraction(): number {
  // In the stacked layout, the reading focus sits below the sticky visual;
  // desktop keeps the text and diagram centered side by side.
  return window.matchMedia("(max-width: 880px)").matches ? 0.66 : 0.48;
}

function onScroll(): void {
  scheduleScrollSample();
  if (settleTimer !== undefined) window.clearTimeout(settleTimer);
  settleTimer = window.setTimeout(settleLocation, 180);
}

function onReaderKeyDown(event: KeyboardEvent): void {
  if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "]
    .includes(event.key)) {
    releaseControlAuthority();
  }
}

function releaseControlAuthority(): void {
  controlSample = undefined;
}

function scheduleScrollSample(): void {
  if (scrollFrame !== undefined) return;
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = undefined;
    scheduler.render(controlSample ?? scrollClock.samplePosition(readerPosition()));
  });
}

function measureLayout(revision: number): LayoutState {
  if (stage.getClientRects().length === 0 && lastMeasuredLayout !== undefined) {
    return lastMeasuredLayout;
  }
  const measured: Omit<TransitionContext, "fit">[] = [];
  for (const element of transitionElements) {
    const id = requiredData(element, "kpReaderTransition");
    const materialPlan = staticPlans.get(id);
    if (materialPlan === undefined) {
      throw new Error(`Equation transition ${id} is missing its reader plan.`);
    }
    const measurementRoot = requireDescendant<HTMLElement>(
      element,
      "[data-kp-reader-equation-measurement]"
    );
    const fitSurface = requireDescendant<HTMLElement>(
      element,
      "[data-kp-reader-fit-surface]"
    );
    fitSurface.style.transform = "none";
    const layout = measureKpReaderEquationLayoutSnapshot({
      materialPlan,
      transitionId: id,
      measurementRoot,
      revision
    });
    const alignment = planKpReaderEquationPerceptualAlignment({
      materialPlan,
      layout
    });
    measured.push({
      id,
      element,
      fitSurface,
      measurementRoot,
      materialPlan,
      anchorElements: anchorElementIndex(measurementRoot),
      layout,
      alignment
    });
  }
  const fit = planKpReaderEquationSequenceResponsiveFit({
    id: `${animation.id}.r${revision}`,
    alignments: measured.map((context) => context.alignment),
    viewportWidth: viewport.clientWidth,
    horizontalPadding: 18,
    minScale: 0.68
  });
  const contexts = new Map(measured.map((context) => {
    applyKpReaderEquationResponsiveFit(context.fitSurface, fit);
    return [context.id, { ...context, fit }] as const;
  }));
  stage.dataset["kpReaderLayoutReads"] = String(scheduler.inspect().readCount + 1);
  lastMeasuredLayout = { contexts };
  return lastMeasuredLayout;
}

function renderSample(sample: KpReaderClockSample, layout: LayoutState): void {
  const projection = projectKpReaderMotion({
    clock: sample,
    checkpoints: accessibleCheckpoints,
    policy: resolveKpReaderMotionPolicy({
      preference: motionPreference,
      systemReducedMotion: reducedMotion.matches
    })
  });
  const attentionProjection = projectKpReaderAttention({
    attention,
    progressPermille: projection.progressPermille
  });
  const visualProgressPermille = attentionProjection?.visualProgressPermille
    ?? projection.progressPermille;
  const visualSample = {
    ...sample,
    // URL restoration can land within a sub-permille physical-scroll residual.
    // Semantic endpoints remain exact geometry and ownership authorities.
    progress: visualProgressPermille === 0
      ? 0
      : visualProgressPermille === 1_000
        ? 1
        : visualProgressPermille / 1_000,
    progressPermille: visualProgressPermille,
    checkpointId: attentionProjection?.checkpointId ?? projection.checkpointId
  };
  const forwardClock = { ...visualSample, direction: "forward" as const };
  const runtimeFrame = sampleKpReaderAnimationFrame({ animation, clock: forwardClock });
  const transitionId = runtimeFrame.activeTransformationIds[0];
  if (transitionId === undefined) return;
  const context = layout.contexts.get(transitionId);
  if (context === undefined) throw new Error(`No measured transition ${transitionId}.`);
  const phaseProgress = localPhaseProgress(
    visualSample.progress,
    runtimeFrame.phase.phaseIndex,
    animation.transformations.length
  );
  const choreographyStep = linearRearrangementBindings.find(
    (step) => step.transformationId === transitionId
  );
  const motion = sampleKpReaderEquationSymbolMotion({
    materialPlan: context.materialPlan,
    alignment: context.alignment,
    layout: context.layout,
    linearRearrangementKind: choreographyStep?.kind,
    cancellationPresentationRecipe: equationPresentationProfile.identity ===
        "hold-until-settled-v1"
      ? "witnessed-annihilation-v1"
      : presentationProfile.cancellation,
    zeroWitnessPresentationRecipe: "none",
    successorPresentationRecipe: presentationProfile.successor,
    continuantPresentationRecipe: presentationProfile.continuants,
    nativeHandoffMode: presentationProfile.handoff,
    depthPresentationRecipe:
      projection.mode === "continuous" ? presentationProfile.depth : "flat-v1",
    witnessedAnnihilationBinding: witnessedBindings.get(transitionId),
    successorSynthesisBinding:
      presentationProfile.successor === "successor-synthesis-v1" ||
      presentationProfile.successor === "convergence-v1" ||
      presentationProfile.successor === "counter-convergence-v1"
        ? choreographyStep?.successorSynthesisBinding
        : undefined,
    progress: phaseProgress
  });
  const focusSnapshot = focus.getSnapshot();
  if (motion.linearRearrangement === undefined) {
    delete stage.dataset["kpReaderEquationPersistentReflowProgress"];
    delete stage.dataset["kpReaderEquationFocalTransitProgress"];
  } else {
    stage.dataset["kpReaderEquationPersistentReflowProgress"] =
      String(motion.linearRearrangement.persistentReflowProgress);
    stage.dataset["kpReaderEquationFocalTransitProgress"] =
      String(motion.linearRearrangement.focalTransitProgress);
  }
  const focusedRefs = visualFocusRefs(focusSnapshot);
  syncNativeEndpointEvidence(motion, context, phaseProgress);

  for (const candidate of layout.contexts.values()) {
    const active = candidate.id === transitionId;
    candidate.element.hidden = !active;
    candidate.element.dataset["kpReaderTransitionActive"] = String(active);
  }
  applyKpReaderEquationResponsiveFit(materialFitSurface, context.fit);
  for (const element of context.anchorElements.values()) element.style.opacity = "0";
  const frames = motion.owners.map((owner): KpReaderEquationMaterialOwnerFrame => {
    setAnchorOpacity(context, owner.sourceAnchorIds, owner.sourceNativeOpacity);
    setAnchorOpacity(context, owner.targetAnchorIds, owner.targetNativeOpacity);
    const visualIds = owner.visualAnchorIds;
    const rawBounds = unionAnchorRects(context.layout, visualIds);
    const fragments = visualIds.map((anchorId) => {
      const element = context.anchorElements.get(anchorId);
      const anchor = context.layout.anchors.find((candidate) => candidate.id === anchorId);
      if (element === undefined || anchor === undefined) {
        throw new Error(`Equation visual anchor ${anchorId} is not measurable.`);
      }
      const pose = owner.fragmentPoses.find(
        (candidate) => candidate.anchorId === anchorId
      )?.pose;
      return {
        id: anchorId,
        visualRevision: `${transitionId}.${anchorId}`,
        sourceElement: element,
        rect: anchor.rect,
        ...(pose === undefined
          ? {}
          : {
              translateX: pose.x,
              translateY: pose.y,
              scale: pose.scale,
              opacity: pose.opacity,
              depth: pose.depth
            })
      };
    });
    const fragmentDriven = owner.fragmentPoses.length > 0;
    return {
      ownerId: owner.ownerId,
      rect: rawBounds,
      translateX: fragmentDriven ? 0 : owner.currentBounds.left - rawBounds.left,
      translateY: fragmentDriven ? 0 : owner.currentBounds.top - rawBounds.top,
      scaleX: fragmentDriven ? 1 : owner.currentBounds.width / rawBounds.width,
      scaleY: fragmentDriven ? 1 : owner.currentBounds.height / rawBounds.height,
      opacity: owner.materialOpacity,
      focused: owner.focusStrength > 0 || ownerMatchesFocus(owner, focusedRefs),
      fragments
    };
  });
  materialLayer.sync(frames);
  syncAnnihilationWitness(
    motion.witnessedAnnihilation,
    projection.mode !== "essential"
  );
  syncIndependentZeroWitness(motion.independentZeroWitness);
  applyFocus(focusSnapshot);
  progressBar.style.transform = `scaleX(${projection.progressPermille / 1_000})`;
  document.body.dataset["kpReaderProgress"] = String(projection.progressPermille);
  document.body.dataset["kpReaderVisualProgress"] = String(visualProgressPermille);
  document.body.dataset["kpReaderMotionMode"] = projection.mode;
  stage.dataset["kpReaderEquationEffectiveDepthRecipe"] =
    projection.mode === "continuous" ? presentationProfile.depth : "flat-v1";
  document.body.dataset["kpReaderMotionPreference"] = motionPreference;
  document.body.dataset["kpReaderPlaybackDirection"] = sample.direction;
  stage.dataset["kpReaderMotionAuthority"] = motion.samplingAuthority;
  document.body.dataset["kpReaderTransition"] = transitionId;
  document.body.dataset["kpReaderFramePlans"] = String(scheduler.inspect().framePlanCount + 1);
  updateActiveBeat(projection.progressPermille, attentionProjection);
  if (import.meta.env.DEV) {
    const atMs = performance.now();
    const schedulerState = scheduler.inspect();
    window.dispatchEvent(new CustomEvent("kp:reader-dev-review-frame", { detail: {
      atMs,
      documentId,
      documentVersion,
      assetId: animation.id,
      checkpointId: projection.checkpointId,
      progressPermille: projection.progressPermille,
      projectionId: "equation.symbolic",
      activeTransformationIds: [...runtimeFrame.activeTransformationIds],
      activePhase: runtimeFrame.phase.phaseId,
      attentionPhase: attentionProjection?.phaseId,
      attentionKind: attentionProjection?.phaseKind,
      attentionMotionGate: attentionProjection?.motionGate,
      visualProgressPermille,
      focusSource: focusSnapshot.activeSource,
      focusRefs: [...focusSnapshot.objectRefs],
      motionPreference,
      motionMode: projection.mode,
      playbackDirection: sample.direction,
      rendererId: "reader.equation.material-layer",
      motionAuthority: motion.samplingAuthority,
      fitStatus: context.fit.status,
      fitScale: context.fit.scale,
      layoutRevision: schedulerState.layoutRevision,
      layoutReadCount: schedulerState.readCount,
      fontRevision: fontReadiness.revision,
      fontReady: fontReadiness.status === "ready",
      ownerIds: frames.map((frame) => frame.ownerId),
      ...(previousReviewFrameAtMs === undefined
        ? {}
        : { frameIntervalMs: atMs - previousReviewFrameAtMs }),
      scrollDeltaY: window.scrollY - previousReviewScrollY
    } }));
    previousReviewFrameAtMs = atMs;
    previousReviewScrollY = window.scrollY;
  }
}

function syncNativeEndpointEvidence(
  motion: KpReaderEquationSymbolMotionFrame,
  context: TransitionContext,
  phaseProgress: number
): void {
  const endpoint = phaseProgress === 0
    ? "source" as const
    : phaseProgress === 1
      ? "target" as const
      : undefined;
  if (endpoint === undefined) {
    delete stage.dataset["kpReaderNativeEndpoint"];
    delete stage.dataset["kpReaderNativeEndpointPassed"];
    delete stage.dataset["kpReaderNativeEndpointMaxResidual"];
    delete stage.dataset["kpReaderNativeEndpointFailures"];
    return;
  }
  const aligned = new Map(context.alignment.owners.map((owner) => [owner.ownerId, owner]));
  const results = motion.owners.map((owner) => {
    const endpoints = aligned.get(owner.ownerId);
    const nativeBounds = endpoint === "source"
      ? endpoints?.sourceBounds
      : endpoints?.targetBounds;
    return checkKpEquationNativeEndpointLaw({
      endpoint,
      nativePresent: nativeBounds !== undefined,
      handoff: {
        ownerId: owner.ownerId,
        progress: phaseProgress,
        materialOpacity: owner.materialOpacity,
        sourceNativeOpacity: owner.sourceNativeOpacity,
        targetNativeOpacity: owner.targetNativeOpacity,
        nativeHandoff: owner.sourceNativeOpacity > 0
          ? "source"
          : owner.targetNativeOpacity > 0
            ? "target"
            : "material"
      },
      ...(nativeBounds === undefined
        ? {}
        : { nativeBounds, materialBounds: owner.currentBounds })
    });
  });
  const residuals = results.flatMap((result) =>
    result.maximumGeometryResidualPx === undefined
      ? []
      : [result.maximumGeometryResidualPx]
  );
  const failureCodes = results.flatMap((result) =>
    result.failures.map((failure) => `${result.ownerId}:${failure.code}`)
  );
  stage.dataset["kpReaderNativeEndpoint"] = endpoint;
  stage.dataset["kpReaderNativeEndpointPassed"] = String(failureCodes.length === 0);
  stage.dataset["kpReaderNativeEndpointMaxResidual"] =
    String(residuals.length === 0 ? 0 : Math.max(...residuals));
  stage.dataset["kpReaderNativeEndpointFailures"] = failureCodes.join(" ");
}

function syncAnnihilationWitness(
  witnessed: KpReaderEquationSymbolMotionFrame["witnessedAnnihilation"],
  decorativeMotion: boolean
): void {
  const projection = projectKpReaderEquationIdentityWitness({
    mode: equationPresentationProfile.identity,
    witness: witnessed === undefined
      ? undefined
      : {
          latex: witnessed.frame.witness.latex,
          readable: witnessed.frame.witnessReadable,
          ready: witnessed.frame.sources.every((source) => source.pose.opacity === 0),
          progress: witnessed.frame.progress
        }
  });
  stage.dataset["kpReaderIdentityWitnessState"] = projection.state;
  annihilationWitness.style.opacity = String(projection.opacity);
  if (witnessed === undefined || projection.latex === undefined) {
    delete stage.dataset["kpReaderAnnihilationPhase"];
    delete stage.dataset["kpReaderAnnihilationWitnessReadable"];
    return;
  }
  for (const [latex, element] of identityWitnessValues) {
    element.hidden = latex !== projection.latex;
  }
  const pose = witnessed.frame.witness.pose;
  annihilationWitness.style.left = `${witnessed.contactPoint.x}px`;
  annihilationWitness.style.top = `${witnessed.contactPoint.y}px`;
  annihilationWitness.style.transform =
    `translate(calc(-50% + ${pose.x}px), calc(-50% + ${pose.y}px)) ` +
    `scale(${pose.scale})`;
  annihilationWitness.style.filter = !decorativeMotion || witnessed.frame.inwardPulse <= 0
    ? "none"
    : `drop-shadow(0 ${2 * witnessed.frame.inwardPulse}px ` +
      `${5 * witnessed.frame.inwardPulse}px rgb(223 112 71 / ` +
      `${0.32 * witnessed.frame.inwardPulse}))`;
  stage.dataset["kpReaderAnnihilationPhase"] = witnessed.frame.phase;
  stage.dataset["kpReaderAnnihilationWitnessReadable"] =
    String(projection.readable);
}

function cancellationOperationId(transformType: string): string | undefined {
  switch (transformType) {
    case "cancelAdditiveInverses":
      return "kp.algebra.cancel-additive-inverses";
    case "cancelMultiplicativeInverses":
      return "kp.algebra.cancel-multiplicative-inverses";
    default:
      return undefined;
  }
}

function syncIndependentZeroWitness(
  witnessed: KpReaderEquationSymbolMotionFrame["independentZeroWitness"]
): void {
  if (witnessed === undefined) {
    independentZeroWitness.style.opacity = "0";
    delete stage.dataset["kpReaderIndependentZeroPhase"];
    delete stage.dataset["kpReaderIndependentZeroReadable"];
    return;
  }
  const pose = witnessed.frame.pose;
  independentZeroWitness.style.left = `${witnessed.contactPoint.x}px`;
  independentZeroWitness.style.top = `${witnessed.contactPoint.y}px`;
  independentZeroWitness.style.opacity = String(pose.opacity);
  independentZeroWitness.style.transform =
    `translate(calc(-50% + ${pose.x}px), calc(-50% + ${pose.y}px)) ` +
    `scale(${pose.scale})`;
  stage.dataset["kpReaderIndependentZeroPhase"] = witnessed.frame.phase;
  stage.dataset["kpReaderIndependentZeroReadable"] =
    String(witnessed.frame.readable);
}

function renderCurrentSample(): void {
  scheduler.render(lastSample());
}

function localPhaseProgress(progress: number, phaseIndex: number, phaseCount: number): number {
  if (progress === 1) return 1;
  return Math.max(0, Math.min(1, progress * phaseCount - phaseIndex));
}

function setAnchorOpacity(
  context: TransitionContext,
  anchorIds: readonly string[],
  opacity: number
): void {
  for (const anchorId of anchorIds) {
    const element = context.anchorElements.get(anchorId);
    if (element !== undefined) element.style.opacity = String(opacity);
  }
}

function unionAnchorRects(
  layout: KpReaderEquationLayoutSnapshot,
  ids: readonly string[]
): { readonly left: number; readonly top: number; readonly width: number; readonly height: number } {
  const rects = ids.map((id) => {
    const anchor = layout.anchors.find((candidate) => candidate.id === id);
    if (anchor === undefined) throw new Error(`Missing measured anchor ${id}.`);
    return anchor.rect;
  });
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

function updateActiveBeat(
  progressPermille: number,
  attentionProjection: KpReaderAttentionProjection | undefined
): void {
  activeBeat = [...beats].sort((left, right) =>
    Math.abs(Number(requiredData(left, "kpCheckpoint")) - progressPermille) -
    Math.abs(Number(requiredData(right, "kpCheckpoint")) - progressPermille)
  )[0];
  if (activeBeat === undefined) return;
  activeLocation.sync(requiredData(activeBeat, "kpBeat"));
  status.value = attentionProjection?.cue
    ?? activeBeat.querySelector("h2")?.textContent?.trim()
    ?? "Follow the symbols";
  syncActiveAttention(attentionProjection);
  focus.set("story", attentionProjection?.focusRefs ?? dataRefs(activeBeat));
}

function syncActiveAttention(
  projection: KpReaderAttentionProjection | undefined
): void {
  if (projection === undefined) {
    delete document.body.dataset["kpReaderAttentionPhase"];
    delete document.body.dataset["kpReaderAttentionKind"];
    delete document.body.dataset["kpReaderAttentionTarget"];
    delete document.body.dataset["kpReaderAttentionMotionGate"];
  } else {
    document.body.dataset["kpReaderAttentionPhase"] = projection.phaseId;
    document.body.dataset["kpReaderAttentionKind"] = projection.phaseKind;
    document.body.dataset["kpReaderAttentionTarget"] = projection.primaryTarget;
    document.body.dataset["kpReaderAttentionMotionGate"] = projection.motionGate;
  }
  for (const element of attentionElements) {
    const active = requiredData(element, "kpAttentionPhase") === projection?.phaseId;
    element.dataset["kpAttentionPhaseActive"] = String(active);
  }
  syncFocusStepper(projection);
}

function syncFocusStepper(projection: KpReaderAttentionProjection | undefined): void {
  if (projection === undefined || attention === undefined) return;
  const index = attention.phases.findIndex((phase) => phase.id === projection.phaseId);
  if (index < 0) throw new Error(`Unknown active attention phase ${projection.phaseId}.`);
  attentionStatus.value = projection.cue;
  attentionCount.textContent = `Step ${index + 1} of ${attention.phases.length}`;
  attentionScrubber.value = String(projection.semanticProgressPermille);
  attentionScrubber.setAttribute(
    "aria-valuetext",
    `Step ${index + 1} of ${attention.phases.length}: ${projection.cue}`
  );
  attentionPrevious.disabled = index === 0;
  attentionNext.disabled = index === attention.phases.length - 1;
}

function onAttentionPrevious(): void {
  seekAttentionPhase(-1);
}

function onAttentionNext(): void {
  seekAttentionPhase(1);
}

function seekAttentionPhase(offset: -1 | 1): void {
  if (attention === undefined) return;
  const activeId = document.body.dataset["kpReaderAttentionPhase"];
  const index = attention.phases.findIndex((phase) => phase.id === activeId);
  const target = attention.phases[index + offset];
  if (target === undefined) return;
  // Land inside the requested phase rather than on a shared boundary, where
  // subpixel scroll rounding can alternate ownership between adjacent cues.
  setControlProgress(Math.round(
    (target.startProgressPermille + target.endProgressPermille) / 2
  ));
}

function onAttentionScrub(): void {
  setControlProgress(Number(attentionScrubber.value));
}

function setControlProgress(progressPermille: number): void {
  setExplicitProgress(progressPermille, "controls", true);
}

function setExplicitProgress(
  progressPermille: number,
  source: "controls" | "url",
  updateLocation: boolean
): void {
  const previous = lastSample();
  const phase = attention?.phases.find((candidate, index, phases) =>
    progressPermille >= candidate.startProgressPermille &&
    (progressPermille < candidate.endProgressPermille ||
      (index === phases.length - 1 && progressPermille === candidate.endProgressPermille))
  );
  controlSample = createKpReaderClockSample({
    source,
    progress: progressPermille / 1_000,
    previousProgress: previous.progress,
    sequence: previous.sequence + 1,
    checkpointId: phase?.checkpointId
  });
  if (!isFocusStepperProjection()) scrollToProgress(progressPermille);
  scheduler.render(controlSample);
  if (updateLocation) settleLocation();
}

function onSemanticEnter(event: Event): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const link = target.closest<HTMLElement>(".kp-semantic-link");
  if (link === null) return;
  focus.set(event.type === "focusin" ? "keyboard" : "pointer", dataRefs(link));
  renderCurrentSample();
}

function onSemanticLeave(event: Event): void {
  const target = event.target;
  if (!(target instanceof Element) || target.closest(".kp-semantic-link") === null) return;
  focus.clear(event.type === "focusout" ? "keyboard" : "pointer");
  renderCurrentSample();
}

function visualFocusRefs(snapshot: KpReaderFocusSnapshot): readonly string[] {
  // Story-level object refs describe narrative scope, not a request to color an
  // entire equation. Exact selector refs remain visibly salient.
  return snapshot.activeSource === "story"
    ? snapshot.objectRefs.filter((ref) => !equationObjectRefs.has(ref))
    : snapshot.objectRefs;
}

function applyFocus(snapshot: KpReaderFocusSnapshot): void {
  const refs = visualFocusRefs(snapshot);
  if (snapshot.activeSource === undefined) {
    delete stage.dataset["kpReaderFocusSource"];
  } else {
    stage.dataset["kpReaderFocusSource"] = snapshot.activeSource;
  }
  const matches = (selectorId: string): boolean => refs.some(
    (ref) => selectorId === ref || selectorId.startsWith(`${ref}.`)
  );
  for (const element of stage.querySelectorAll<HTMLElement>("[data-kp-reader-selector-id]")) {
    element.classList.toggle(
      "kp-reader-semantic-focus",
      matches(requiredData(element, "kpReaderSelectorId"))
    );
  }
  for (const link of document.querySelectorAll<HTMLElement>(".kp-semantic-link")) {
    link.classList.toggle(
      "kp-reader-semantic-focus",
      dataRefs(link).some((ref) => refs.includes(ref))
    );
  }
}

function ownerMatchesFocus(
  owner: { readonly sourceAnchorIds: readonly string[]; readonly targetAnchorIds: readonly string[] },
  refs: readonly string[]
): boolean {
  return [...owner.sourceAnchorIds, ...owner.targetAnchorIds].some((anchorId) => {
    const selectorId = anchorId.replace(/^anchor\./, "");
    return refs.some((ref) => selectorId === ref || selectorId.startsWith(`${ref}.`));
  });
}

function settleLocation(): void {
  if (!urlAuthorityReady) return;
  const sample = lastSample();
  const href = readerHref(sample);
  window.history.replaceState(null, "", href);
  shareLink.href = href;
}

function updateShareLink(sample: KpReaderClockSample): void {
  shareLink.href = readerHref(sample);
}

function readerHref(sample: KpReaderClockSample): string {
  const base = new URL(window.location.href);
  if (activeBeat !== undefined) base.hash = requiredData(activeBeat, "kpBeat");
  return encodeKpReaderSessionUrl(base, createKpReaderSessionSnapshot({
    documentId,
    documentVersion,
    checkpointId: sample.checkpointId,
    progressPermille: sample.progressPermille,
    projectionId: "equation.symbolic",
    focusRefs: focus.getSnapshot().objectRefs,
    motionPreference,
    equationPresentationProfileId: equationPresentationProfile.id
  }));
}

function initialMotionPreference(): KpReaderMotionPreference {
  const urlPreference = parseKpReaderMotionPreference(
    new URL(window.location.href).searchParams.get("kpMotion")
  );
  if (urlPreference !== undefined) return urlPreference;
  try {
    return parseKpReaderMotionPreference(
      window.localStorage.getItem(motionPreferenceStorageKey)
    ) ?? "system";
  } catch {
    return "system";
  }
}

function onMotionPreferenceChange(): void {
  const next = parseKpReaderMotionPreference(motionSelect.value);
  if (next === undefined) return;
  motionPreference = next;
  try {
    window.localStorage.setItem(motionPreferenceStorageKey, next);
  } catch {
    // Storage is an enhancement; the current session and URL remain valid.
  }
  renderCurrentSample();
  settleLocation();
}

function onEquationProfileChange(): void {
  if (equationProfileSelect === null) return;
  const selected = selectKpReaderEquationPresentation({
    capability: compiledEquationPresentation,
    requestedProfileId: equationProfileSelect.value,
    source: "url"
  });
  const next = new URL(readerHref(lastSample()));
  next.searchParams.set("kpProfile", selected.profile.id);
  window.location.assign(next);
}

function restoreUrlLocation(): void {
  const session = decodeKpReaderSessionUrl(window.location.href, {
    documentId,
    documentVersion
  });
  if (session === undefined) return;
  if (session.location.focusRefs.length > 0) {
    focus.set("url", session.location.focusRefs);
  }
  const progress = session.location.progressPermille;
  if (progress === undefined) return;
  if (isFocusStepperProjection() && attention !== undefined) {
    setExplicitProgress(progress, "url", false);
    scrollFocusWorkspaceIntoView();
  } else {
    scrollToProgress(progress);
  }
}

function isFocusStepperProjection(): boolean {
  return document.body.dataset["kpReaderResponsiveProjection"] === "focus-stepper";
}

function scrollFocusWorkspaceIntoView(): void {
  const masthead = requireElement<HTMLElement>(".kp-reader-masthead");
  const top = window.scrollY + staticSurface.getBoundingClientRect().top -
    masthead.getBoundingClientRect().height - 12;
  window.scrollTo({ top: Math.max(0, top) });
}

function scrollToProgress(progressPermille: number): void {
  const geometry = scrollGeometry();
  const scrollPosition = geometry.startPx +
    (geometry.endPx - geometry.startPx) * progressPermille / 1_000;
  window.scrollTo({
    top: scrollPosition - window.innerHeight * readerViewportAnchorFraction()
  });
}

function lastSample(): KpReaderClockSample {
  return controlSample ?? scrollClock.getSnapshot();
}

function anchorElementIndex(root: HTMLElement): ReadonlyMap<string, HTMLElement> {
  return new Map([...root.querySelectorAll<HTMLElement>(
    "[data-kp-reader-equation-anchor-id]"
  )].map((element) => [requiredData(element, "kpReaderEquationAnchorId"), element]));
}

function dataRefs(element: HTMLElement): readonly string[] {
  return (element.dataset["kpFocus"] ?? "").split(/\s+/).filter(Boolean);
}

function readAttentionPlan(): KpLessonAttentionPlan | undefined {
  if (story.dataset["kpAttention"] === undefined) return undefined;
  return {
    kind: "phased-attention-v1",
    phases: attentionElements.map((element) => ({
      id: requiredData(element, "kpAttentionPhase"),
      kind: attentionKind(requiredData(element, "kpAttentionKind")),
      beatId: requiredData(element.closest<HTMLElement>("[data-kp-beat]")!, "kpBeat"),
      checkpointId: requiredData(element, "kpCheckpointId"),
      startProgressPermille: Number(requiredData(element, "kpAttentionStart")),
      endProgressPermille: Number(requiredData(element, "kpAttentionEnd")),
      cue: requireDescendant<HTMLElement>(element, ".kp-attention-cue").textContent?.trim() ?? "",
      focusRefs: dataRefs(element)
    }))
  };
}

function attentionKind(value: string): KpLessonAttentionPhaseKind {
  if (value === "orient" || value === "act" || value === "settle" || value === "inspect") {
    return value;
  }
  throw new Error(`Unknown reader attention phase kind ${value}.`);
}

function bindFractionalStructuralAnchors(): void {
  const states = new Map(animation.bundle.objects.map((state) => [state.id, state]));
  for (const element of staticSurface.querySelectorAll<HTMLElement>(
    "[data-kp-reader-equation-state]"
  )) {
    const stateId = requiredData(element, "kpReaderEquationState");
    const state = states.get(stateId);
    if (state === undefined) throw new Error(`Missing fractional equation state ${stateId}.`);
    bindKpFractionalLinearStructuralAnchors({ root: element, state });
  }
}

function bindDivideBothSidesStructuralAnchors(): void {
  const states = new Map(animation.bundle.objects.map((state) => [state.id, state]));
  for (const element of staticSurface.querySelectorAll<HTMLElement>(
    "[data-kp-reader-equation-state]"
  )) {
    const stateId = requiredData(element, "kpReaderEquationState");
    const state = states.get(stateId);
    if (state === undefined) throw new Error(`Missing divide-both-sides equation state ${stateId}.`);
    bindKpDivideBothSidesStructuralAnchors({ root: element, state });
  }
}

function bindNumeratorSplitMergeStructuralAnchors(): void {
  const states = new Map(animation.bundle.objects.map((state) => [state.id, state]));
  for (const element of staticSurface.querySelectorAll<HTMLElement>(
    "[data-kp-reader-equation-state]"
  )) {
    const stateId = requiredData(element, "kpReaderEquationState");
    const state = states.get(stateId);
    if (state === undefined) {
      throw new Error(`Missing numerator-split-merge equation state ${stateId}.`);
    }
    bindKpNumeratorSplitMergeStructuralAnchors({ root: element, state });
  }
}

function requiredData(element: HTMLElement, key: string): string {
  const value = element.dataset[key];
  if (value === undefined || value === "") throw new Error(`Missing data-${key}.`);
  return value;
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Expected ${selector}.`);
  return element;
}

function requireDescendant<T extends Element>(root: Element, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Expected ${selector}.`);
  return element;
}

function dispose(): void {
  if (scrollFrame !== undefined) window.cancelAnimationFrame(scrollFrame);
  if (settleTimer !== undefined) window.clearTimeout(settleTimer);
  resizeObserver.disconnect();
  reducedMotion.removeEventListener("change", renderCurrentSample);
  motionSelect.removeEventListener("change", onMotionPreferenceChange);
  equationProfileSelect?.removeEventListener("change", onEquationProfileChange);
  attentionPrevious.removeEventListener("click", onAttentionPrevious);
  attentionNext.removeEventListener("click", onAttentionNext);
  attentionScrubber.removeEventListener("input", onAttentionScrub);
  window.removeEventListener("wheel", releaseControlAuthority);
  window.removeEventListener("touchstart", releaseControlAuthority);
  window.removeEventListener("pointerdown", releaseControlAuthority);
  window.removeEventListener("keydown", onReaderKeyDown);
  if (import.meta.env.DEV) {
    window.removeEventListener("kp:reader-dev-review-request-frame", renderCurrentSample);
  }
  unsubscribeFontReadiness();
  fontReadiness.dispose();
  scheduler.dispose();
  scrollClock.dispose();
  focus.dispose();
  unsubscribeFocus();
  materialLayer.dispose();
}
