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
  createKpReaderAdapterRegistry,
  createKpReaderEquationMaterialLayer,
  defineKpReaderScheduledRendererAdapter,
  loadKpReaderEquationSceneCompositorAdapter,
  measureKpReaderAppliedEquationStageLayoutSnapshot,
  measureKpReaderEquationLayoutSnapshot,
  planKpReaderEquationPerceptualAlignment,
  planKpReaderCertifiedEquationStageResponsiveFit,
  planKpReaderEquationSequenceResponsiveFit,
  projectKpCertifiedTransferMaterialPlan,
  projectKpReaderEquationIdentityWitness,
  projectKpReaderEquationRenderPlan,
  sampleKpReaderEquationSymbolMotion,
  type KpReaderEquationLayoutSnapshot,
  type KpReaderEquationMaterialOwnerFrame,
  type KpReaderEquationMaterialPlan,
  type KpReaderEquationPerceptualAlignmentPlan,
  type KpReaderEquationRenderPlan,
  type KpReaderEquationResponsiveFitPlan,
  type KpReaderEquationSymbolMotionFrame
} from "../renderers/public-api.ts";
import type {
  KpReaderCanonicalEquationSession
} from "./reader-canonical-equation-session.ts";
import {
  createKpReaderClockSample,
  createKpReaderActiveLocationService,
  createKpReaderContinuousScrollClock,
  bindKpReaderSemanticLinks,
  createKpReaderLocationSettlement,
  createKpReaderSemanticFocusService,
  createKpReaderSessionSnapshot,
  createKpReaderRuntimeRouteDescriptor,
  createKpEquationStageMeasurementIdentity,
  decodeKpReaderSessionUrl,
  defineKpReaderEquationPresentationCapability,
  encodeKpReaderSessionUrl,
  projectKpReaderMotion,
  parseKpReaderMotionPreference,
  projectKpReaderAttention,
  resolveKpReaderViewportAnchorFraction,
  resolveKpReaderResponsiveProjection,
  resolveKpReaderEquationPresentationProfile,
  resolveKpReaderMotionPolicy,
  selectKpReaderEquationPresentation,
  sampleKpReaderScrollPosition,
  sampleKpReaderAnimationFrame,
  resetKpAppliedEquationStageLayout,
  type KpAppliedEquationStageLayout,
  type KpCorridorCertifiedEquationStageLayout,
  type KpReaderClockSample,
  type KpReaderContinuousScrollClock,
  type KpReaderPiecewiseScrollGeometry,
  type KpReaderFocusSnapshot,
  type KpReaderMotionPreference,
  type KpReaderAttentionProjection
} from "../runtime/public-api.ts";
import type {
  KpLessonAttentionPhaseKind,
  KpLessonAttentionPlan
} from "../document/public-api.ts";
import { createKpReaderArtifactRef } from "../document/public-api.ts";
import { createKpReaderFontReviewLifecycle } from "./reader-font-review-lifecycle.ts";
import { mountKpReaderDevelopmentReview } from "./development-review-loader.ts";
import {
  bindKpReaderEquationLessonStructuralAnchors,
  compileKpReaderCanonicalTransitionPolicy,
  resolveKpReaderEquationLessonDescriptor
} from "./equation-lesson-descriptor.ts";
import {
  compileKpAnimationTransformationPhaseCohorts,
  findKpAnimationTransformationPhaseCohort
} from "../../animation/transformation-phase-cohorts.ts";

interface TransitionContext {
  readonly id: string;
  readonly element: HTMLElement;
  readonly fitSurface: HTMLElement;
  readonly measurementRoot: HTMLElement;
  readonly renderPlan: KpReaderEquationRenderPlan;
  readonly materialPlan: KpReaderEquationMaterialPlan;
  readonly anchorElements: ReadonlyMap<string, HTMLElement>;
  readonly layout: KpReaderEquationLayoutSnapshot;
  readonly alignment: KpReaderEquationPerceptualAlignmentPlan;
  readonly fit: KpReaderEquationResponsiveFitPlan;
  readonly appliedStageLayout?:
    KpAppliedEquationStageLayout<
      KpCorridorCertifiedEquationStageLayout
    > | undefined;
}

interface LayoutState {
  readonly contexts: ReadonlyMap<string, TransitionContext>;
}

interface EquationRendererHost {
  readonly readLayout: (revision: number) => LayoutState;
  readonly writeFrame: (sample: KpReaderClockSample, layout: LayoutState) => void;
}

const readerRoute = createKpReaderRuntimeRouteDescriptor({
  href: window.location.href,
  documentId: requiredData(document.body, "kpReaderDocumentId"),
  documentVersion: requiredData(document.body, "kpReaderDocumentVersion")
});
const { documentId, documentVersion } = readerRoute;
const lessonVariant = requiredData(document.body, "kpReaderLessonVariant");
const lessonDescriptor = await resolveKpReaderEquationLessonDescriptor(lessonVariant);
const usesCanonicalEquationRenderer =
  lessonDescriptor.canonicalTransitionSelection !== undefined;
const readerCanonicalEquationSessionModule = usesCanonicalEquationRenderer
  ? await import("./reader-canonical-equation-session.ts")
  : undefined;
const readerCanonicalEquationSessionAdapter = usesCanonicalEquationRenderer
  ? await loadKpReaderEquationSceneCompositorAdapter()
  : undefined;
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
const animation = lessonDescriptor.createAnimation(equationPresentationProfile);
const phaseCohorts = compileKpAnimationTransformationPhaseCohorts(animation);
const presentationProfile = kpEquationPresentationProfile(animation);
const linearRearrangementBindings = createKpEquationLinearRearrangementBindings(
  animation
);
const story = requireElement<HTMLElement>("[data-kp-asset]");
const staticSurface = requireElement<HTMLElement>("[data-kp-animation-static]");
const template = requireElement<HTMLTemplateElement>("template[data-kp-reader-exemplar-template]");
const templateContent = template.content.cloneNode(true);
staticSurface.append(templateContent);
bindKpReaderEquationLessonStructuralAnchors({
  root: staticSurface,
  animation,
  descriptor: lessonDescriptor
});
document.body.dataset["kpReaderHydrated"] = "true";

const stage = requireElement<HTMLElement>("[data-kp-reader-equation-stage]");
const stageKicker = requireElement<HTMLElement>("[data-kp-reader-stage-kicker]");
const lessonStageKicker = lessonDescriptor.stageKicker?.(equationPresentationProfile);
if (lessonStageKicker !== undefined) stageKicker.textContent = lessonStageKicker;
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
const accessibleEquationStates = new Map(
  [...stage.querySelectorAll<HTMLElement>(
    "[data-kp-reader-accessible-equation-state]"
  )].map((element) => [
    requiredData(element, "kpReaderAccessibleEquationState"),
    element
  ])
);
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
].filter((element) => phaseCohorts.some((cohort) =>
  cohort.id === requiredData(element, "kpReaderTransition")
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
let scrollFrame: number | undefined;
let previousReviewFrameAtMs: number | undefined;
let previousReviewScrollY = window.scrollY;
let urlAuthorityReady = false;
let controlSample: KpReaderClockSample | undefined;
// The semantic URL is the scroll authority. Browser history restoration can
// otherwise race a requested frame when moving between two lesson URLs.
const locationSettlement = createKpReaderLocationSettlement({
  ownerWindow: window,
  shareLink,
  href: () => readerHref(lastSample()),
  canSettle: () => urlAuthorityReady,
  scrollRestoration: "manual"
});
const foldableDistributionControls =
  lessonDescriptor.readerControls === "foldable-distribution-v1"
    ? (await import("./foldable-distribution-reader-controls.ts"))
      .mountKpFoldableDistributionReaderControls({
        root: staticSurface,
        stage,
        route: readerRoute,
        initialUrl: window.location.href,
        onChange: () => {
          renderer.refresh("content");
          renderCurrentSample();
          locationSettlement.settle();
        }
      })
    : undefined;

const staticPlans = new Map(phaseCohorts.map((cohort, index) => {
  const progress = (index + 0.5) / phaseCohorts.length;
  const clock = createKpReaderClockSample({ source: "scroll", progress });
  const runtimeFrame = sampleKpReaderAnimationFrame({ animation, clock });
  const renderPlan = projectKpReaderEquationRenderPlan({ animation, runtimeFrame });
  if (renderPlan.transitions[0]?.id !== cohort.id) {
    throw new Error(
      `Equation phase cohort ${cohort.id} did not compile its shared reader transition.`
    );
  }
  return [
    cohort.id,
    {
      renderPlan,
      materialPlan: projectKpCertifiedTransferMaterialPlan(
        compileKpReaderEquationMaterialPlan(renderPlan)
      )
    }
  ] as const;
}));
const canonicalTransitionPolicy =
  compileKpReaderCanonicalTransitionPolicy({
    descriptor: lessonDescriptor,
    animation
  });
const canonicalTransitionIds =
  canonicalTransitionPolicy?.transitionIds ?? [];
for (const transitionId of canonicalTransitionIds) {
  const transition = transitionElements.find((candidate) =>
    requiredData(candidate, "kpReaderTransition") === transitionId
  );
  if (transition === undefined) continue;
  requireDescendant<HTMLElement>(
    transition,
    "[data-kp-reader-fit-surface]"
  ).classList.add("kp-canonical-equation-stage");
  requireDescendant<HTMLElement>(
    transition,
    "[data-kp-reader-equation-measurement]"
  ).classList.add("kp-canonical-equation-content");
}
const readerCanonicalEquationSession: KpReaderCanonicalEquationSession | undefined =
  readerCanonicalEquationSessionModule === undefined ||
    readerCanonicalEquationSessionAdapter === undefined ||
    canonicalTransitionIds.length === 0
    ? undefined
    : readerCanonicalEquationSessionModule.createKpReaderCanonicalEquationSession({
        transitionIds: canonicalTransitionIds,
        createSession:
          readerCanonicalEquationSessionAdapter
            .createKpReaderEquationSceneCompositorSession,
        requireAppliedStageLayout:
          lessonDescriptor.stageLayoutCompiler !== undefined
      });
if (readerCanonicalEquationSession !== undefined) {
  stage.dataset["kpReaderCanonicalEquationSession"] =
    readerCanonicalEquationSession.transitionIds.join(",");
}
const materialLayer = createKpReaderEquationMaterialLayer(
  requireDescendant<HTMLElement>(viewport, "[data-kp-reader-equation-material-layer]")
);
let lastMeasuredLayout: LayoutState | undefined;

const rendererRegistry = createKpReaderAdapterRegistry<
  EquationRendererHost,
  KpReaderClockSample
>();
rendererRegistry.register(defineKpReaderScheduledRendererAdapter<KpReaderClockSample>()({
  id: "renderer.equation-dom",
  readLayout: (host, _mount, { revision }) => host.readLayout(revision),
  planLayout: (_host, _mount, layout) => layout,
  planFrame: (_host, { input, layout }) => ({ sample: input, layout }),
  writeFrame: (host, { sample, layout }) => host.writeFrame(sample, layout)
}));
const renderer = rendererRegistry.mount({
  adapterId: "renderer.equation-dom",
  host: { readLayout: measureLayout, writeFrame: renderSample },
  blockId: requiredData(story, "kpBlock"),
  asset: createKpReaderArtifactRef({
    kind: "animation-asset",
    id: requiredData(story, "kpAsset"),
    version: requiredData(story, "kpAssetVersion")
  }),
  session: createKpReaderSessionSnapshot({ documentId, documentVersion })
});
stage.dataset["kpReaderRendererAdapter"] = renderer.adapterId;

const unsubscribeFocus = focus.subscribe((snapshot) => {
  applyFocus(snapshot);
  locationSettlement.updateShare();
});
const resizeObserver = new ResizeObserver(() => {
  updateScrollGeometry();
  renderer.refresh("resize");
  scheduleScrollSample();
});
resizeObserver.observe(viewport);

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onResize, { passive: true });
window.addEventListener("scrollend", locationSettlement.settle, { passive: true });
window.addEventListener("wheel", releaseControlAuthority, { passive: true });
window.addEventListener("touchstart", releaseControlAuthority, { passive: true });
window.addEventListener("pointerdown", releaseControlAuthority, { passive: true });
window.addEventListener("keydown", onReaderKeyDown);
const semanticLinkBindings = bindKpReaderSemanticLinks({
  root: document,
  selector: ".kp-semantic-link",
  setFocus: (source, refs) => {
    focus.set(source, refs);
    renderCurrentSample();
  },
  clearFocus: (source) => {
    focus.clear(source);
    renderCurrentSample();
  }
});
window.addEventListener("pagehide", dispose, { once: true });
reducedMotion.addEventListener("change", renderCurrentSample);
motionSelect.addEventListener("change", onMotionPreferenceChange);
equationProfileSelect?.addEventListener("change", onEquationProfileChange);
attentionPrevious.addEventListener("click", onAttentionPrevious);
attentionNext.addEventListener("click", onAttentionNext);
attentionScrubber.addEventListener("input", onAttentionScrub);
toc.addEventListener("click", onTocNavigation);
updateScrollGeometry();
// Initial geometry must be measured from final KaTeX fonts. Rendering before
// this gate creates a visible first-frame font and width swap on slow loads.
const fontReviewLifecycle = createKpReaderFontReviewLifecycle({
  readiness: fontReadiness,
  ownerDocument: document,
  ownerWindow: window,
  developmentReviewMount: mountKpReaderDevelopmentReview,
  reviewMount: "immediate",
  renderReviewFrame: renderCurrentSample,
  onFontInvalidated: () => {
    renderer.refresh("fonts");
    scheduleScrollSample();
  },
  onReady: () => {
    restoreUrlLocation();
    updateScrollGeometry();
    renderer.refresh("fonts");
    scheduleScrollSample();
    // History writes must wait until the URL-selected scroll position has
    // produced its first frame; otherwise an early scrollend can persist zero.
    window.requestAnimationFrame(() => {
      urlAuthorityReady = true;
    });
  }
});
void fontReviewLifecycle.ready;

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
  foldableDistributionControls?.refreshViewport();
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
      compactTranscriptAvailable: lessonDescriptor.compactTranscriptAvailable
    });
}

function scrollGeometry(): KpReaderPiecewiseScrollGeometry {
  if (beats.length < 2) {
    throw new Error("The semantic reader exemplar requires explanation beats.");
  }
  return {
    // Semantic checkpoints belong at their authored narrative beats. A linear
    // first/last interpolation drifted unequal timelines away from their copy.
    stops: beats.map((beat) => ({
      positionPx: window.scrollY + beatNarrativeCenter(beat),
      progressPermille: Number(requiredData(beat, "kpCheckpoint"))
    }))
  };
}

function readerPosition(): number {
  return window.scrollY + window.innerHeight * readerViewportAnchorFraction();
}

function readerViewportAnchorFraction(): number {
  const stickyVisualBottomPx = stickyVisualBottom();
  return resolveKpReaderViewportAnchorFraction({
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    stickyVisualBottomPx,
    maximumNarrativeHeightPx: stickyVisualBottomPx === undefined
      ? undefined
      : maximumBeatNarrativeHeight(),
    clearancePx: 12
  });
}

function stickyVisualBottom(): number | undefined {
  const style = getComputedStyle(staticSurface);
  if (style.position !== "sticky") return undefined;
  const top = Number.parseFloat(style.top);
  if (!Number.isFinite(top)) return undefined;
  // Use the declared sticky position rather than the current rect: before the
  // story reaches the viewport, the rect still reflects document flow.
  return top + staticSurface.getBoundingClientRect().height;
}

function maximumBeatNarrativeHeight(): number {
  return Math.max(0, ...beats.map((beat) => beatNarrativeBounds(beat).height));
}

function beatNarrativeCenter(beat: HTMLElement): number {
  const bounds = beatNarrativeBounds(beat);
  return bounds.top + bounds.height / 2;
}

function beatNarrativeBounds(beat: HTMLElement): {
  readonly top: number;
  readonly height: number;
} {
  const rects = [...beat.children]
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);
  if (rects.length === 0) {
    const rect = beat.getBoundingClientRect();
    return { top: rect.top, height: rect.height };
  }
  const top = Math.min(...rects.map((rect) => rect.top));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  return { top, height: bottom - top };
}

function onScroll(): void {
  scheduleScrollSample();
  locationSettlement.schedule(180);
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
    renderWithAdapter(controlSample ?? scrollClock.samplePosition(readerPosition()));
  });
}

function measureLayout(revision: number): LayoutState {
  if (stage.getClientRects().length === 0 && lastMeasuredLayout !== undefined) {
    return lastMeasuredLayout;
  }
  const measured: Omit<TransitionContext, "fit">[] = [];
  const stageLayoutIntent =
    foldableDistributionControls?.readStageLayoutIntent();
  const stageLayoutCompiler = lessonDescriptor.stageLayoutCompiler;
  if ((stageLayoutIntent === undefined) !== (stageLayoutCompiler === undefined)) {
    throw new Error(
      "Reader stage layout requires both semantic intent and a descriptor compiler."
    );
  }
  if (
    stageLayoutIntent !== undefined &&
    stageLayoutIntent.phases.length !== transitionElements.length
  ) {
    throw new Error(
      "Reader stage layout must cover every equation transition exactly once."
    );
  }
  for (const [index, element] of transitionElements.entries()) {
    const id = requiredData(element, "kpReaderTransition");
    const plans = staticPlans.get(id);
    if (plans === undefined) {
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
    const coordinateSpaceId = `${animation.id}.equation-stage`;
    const measurementIdentity = createKpEquationStageMeasurementIdentity({
      revision,
      coordinateSpaceId
    });
    const phaseIntent = stageLayoutIntent?.phases[index];
    const cohort = phaseCohorts[index];
    let appliedStageLayout:
      KpAppliedEquationStageLayout<
        KpCorridorCertifiedEquationStageLayout
      > | undefined;
    if (
      stageLayoutCompiler !== undefined &&
      phaseIntent !== undefined &&
      cohort !== undefined
    ) {
      resetKpAppliedEquationStageLayout(measurementRoot);
      appliedStageLayout = stageLayoutCompiler.apply({
        phaseIntent,
        sourceObjectIds: cohort.sourceObjectIds,
        targetObjectIds: cohort.targetObjectIds,
        measurementRoot,
        measurementIdentity
      });
      element.dataset["kpReaderStageLayoutApplied"] =
        appliedStageLayout.applicationId;
      element.dataset["kpReaderStageLayoutPhase"] = phaseIntent.nodeId;
    }
    const layout = appliedStageLayout === undefined
      ? measureKpReaderEquationLayoutSnapshot({
          materialPlan: plans.materialPlan,
          transitionId: id,
          measurementRoot,
          revision,
          coordinateSpaceId
        })
      : measureKpReaderAppliedEquationStageLayoutSnapshot({
          materialPlan: plans.materialPlan,
          transitionId: id,
          measurementRoot,
          revision,
          coordinateSpaceId,
          appliedStageLayout
        });
    const alignment = planKpReaderEquationPerceptualAlignment({
      materialPlan: plans.materialPlan,
      layout
    });
    measured.push({
      id,
      element,
      fitSurface,
      measurementRoot,
      renderPlan: plans.renderPlan,
      materialPlan: plans.materialPlan,
      anchorElements: anchorElementIndex(measurementRoot),
      layout,
      alignment,
      ...(appliedStageLayout === undefined ? {} : { appliedStageLayout })
    });
  }
  const fit = planKpReaderEquationSequenceResponsiveFit({
    id: `${animation.id}.r${revision}`,
    alignments: measured.map((context) => context.alignment),
    viewportWidth: viewport.clientWidth,
    viewportHeight: viewport.clientHeight,
    horizontalPadding: 18,
    verticalPadding: 18,
    minScale: 0.68,
    // Reader cards must contain every supported equation. The minimum scale is
    // still diagnostic, while semantic staging/folding protects readability.
    overflowStrategy: "contain"
  });
  const contexts = new Map(measured.map((context) => {
    const certifiedFit = context.appliedStageLayout === undefined
      ? undefined
      : planKpReaderCertifiedEquationStageResponsiveFit({
          layout: context.appliedStageLayout.certificate,
          viewportWidth: viewport.clientWidth,
          viewportHeight: viewport.clientHeight,
          horizontalPadding: 18,
          verticalPadding: 18,
          minScale: 0.68
        });
    if (certifiedFit?.kind === "unsatisfied") {
      throw new Error(
        `Certified equation stage ${context.id} requires scale ` +
        `${certifiedFit.requiredScale.toFixed(3)}, below its readable ` +
        `${certifiedFit.minimumReadableScale.toFixed(3)} floor.`
      );
    }
    const contextFit = certifiedFit?.fit ?? fit;
    applyKpReaderEquationResponsiveFit(context.fitSurface, contextFit);
    return [context.id, { ...context, fit: contextFit }] as const;
  }));
  stage.dataset["kpReaderLayoutReads"] = String(rendererInspection().readCount + 1);
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
  const visualProgress = attentionProjection === undefined
    ? sample.source === "controls"
      ? projection.progress
      : projection.progressPermille / 1_000
    : attentionProjection.visualProgressPermille / 1_000;
  const visualProgressPermille = Math.round(visualProgress * 1_000);
  const visualSample = {
    ...sample,
    // Keep exact control-selected boundaries for renderer ownership. Permilles
    // remain URL/UI serialization and must not move a fold boundary inward.
    progress: visualProgress === 0
      ? 0
      : visualProgress === 1
        ? 1
        : visualProgress,
    progressPermille: visualProgressPermille,
    checkpointId: attentionProjection?.checkpointId ?? projection.checkpointId
  };
  const animationProgress =
    foldableDistributionControls?.projectAnimationProgress(
      visualSample.progress
    ) ?? visualSample.progress;
  const forwardClock = {
    ...visualSample,
    progress: animationProgress,
    progressPermille: Math.round(animationProgress * 1_000),
    direction: "forward" as const
  };
  const runtimeFrame = sampleKpReaderAnimationFrame({ animation, clock: forwardClock });
  const cohort = findKpAnimationTransformationPhaseCohort({
    cohorts: phaseCohorts,
    transformationIds: runtimeFrame.activeTransformationIds
  });
  if (cohort === undefined) return;
  const transitionId = cohort.id;
  const context = layout.contexts.get(transitionId);
  if (context === undefined) throw new Error(`No measured transition ${transitionId}.`);
  const phaseProgress = localPhaseProgress(
    animationProgress,
    runtimeFrame.phase.phaseIndex,
    phaseCohorts.length
  );
  syncAccessibleEquation(
    phaseProgress < 1
      ? context.renderPlan.transitions[0]?.source[0]?.objectId
      : context.renderPlan.transitions[0]?.target[0]?.objectId
  );
  const choreographyStep = linearRearrangementBindings.find(
    (step) => step.transformationId === transitionId
  );
  const motion = sampleKpReaderEquationSymbolMotion({
    materialPlan: context.materialPlan,
    alignment: context.alignment,
    layout: context.layout,
    linearRearrangementKind: choreographyStep?.kind,
    branchSchedule: choreographyStep?.branchSchedule,
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
  // Attention selects semantic presentation for this exact sample before the
  // renderer observes native styles, avoiding a one-frame endpoint color lag.
  updateActiveBeat(projection.progressPermille, attentionProjection);
  const focusSnapshot = focus.getSnapshot();
  if (motion.linearRearrangement === undefined) {
    delete stage.dataset["kpReaderEquationPersistentReflowProgress"];
    delete stage.dataset["kpReaderEquationFocalTransitProgress"];
    delete stage.dataset["kpReaderEquationBranchSchedule"];
    delete stage.dataset["kpReaderEquationBranchProgress"];
  } else {
    stage.dataset["kpReaderEquationPersistentReflowProgress"] =
      String(motion.linearRearrangement.persistentReflowProgress);
    stage.dataset["kpReaderEquationFocalTransitProgress"] =
      String(motion.linearRearrangement.focalTransitProgress);
    if (motion.linearRearrangement.branchScheduleId === undefined) {
      delete stage.dataset["kpReaderEquationBranchSchedule"];
      delete stage.dataset["kpReaderEquationBranchProgress"];
    } else {
      stage.dataset["kpReaderEquationBranchSchedule"] =
        motion.linearRearrangement.branchScheduleId;
      stage.dataset["kpReaderEquationBranchProgress"] = JSON.stringify(
        motion.linearRearrangement.scheduledBranchProgress
      );
    }
  }
  const focusedRefs = visualFocusRefs(focusSnapshot);
  syncNativeEndpointEvidence(motion, context, phaseProgress);
  // Native semantic state is established before the canonical session samples
  // paint; the session alone then carries that presentation through transit.
  applyFocus(focusSnapshot);

  for (const candidate of layout.contexts.values()) {
    const active = candidate.id === transitionId;
    candidate.element.hidden = !active;
    candidate.element.dataset["kpReaderTransitionActive"] = String(active);
  }
  applyKpReaderEquationResponsiveFit(materialFitSurface, context.fit);
  const canonicalEquationSessionApplied = readerCanonicalEquationSession?.apply({
    renderPlan: context.renderPlan,
    materialPlan: context.materialPlan,
    fitSurface: context.fitSurface,
    progress: phaseProgress,
    motionMode: projection.mode,
    fontReadiness,
    presentationRevision: [
      focusSnapshot.activeSource ?? "none",
      ...focusedRefs
    ].join(":"),
    measurementIdentity: context.fit.measurementIdentity,
    appliedStageLayout: context.appliedStageLayout
  }) ?? false;
  if (canonicalEquationSessionApplied) {
    materialLayer.sync([]);
  } else {
    for (const element of context.anchorElements.values()) {
      element.style.opacity = "0";
    }
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
  }
  syncAnnihilationWitness(
    motion.witnessedAnnihilation,
    projection.mode !== "essential"
  );
  syncIndependentZeroWitness(motion.independentZeroWitness);
  progressBar.style.transform = `scaleX(${projection.progressPermille / 1_000})`;
  document.body.dataset["kpReaderProgress"] = String(projection.progressPermille);
  document.body.dataset["kpReaderVisualProgress"] = String(visualProgressPermille);
  document.body.dataset["kpReaderMotionMode"] = projection.mode;
  stage.dataset["kpReaderEquationEffectiveDepthRecipe"] =
    projection.mode === "continuous" ? presentationProfile.depth : "flat-v1";
  document.body.dataset["kpReaderMotionPreference"] = motionPreference;
  document.body.dataset["kpReaderPlaybackDirection"] = sample.direction;
  stage.dataset["kpReaderMotionAuthority"] = motion.samplingAuthority;
  stage.dataset["kpReaderCanonicalEquationSessionActive"] = String(
    canonicalEquationSessionApplied
  );
  document.body.dataset["kpReaderTransition"] = transitionId;
  document.body.dataset["kpReaderFramePlans"] = String(
    rendererInspection().framePlanCount + 1
  );
  if (import.meta.env.DEV) {
    const atMs = performance.now();
    const schedulerState = rendererInspection();
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
      ownerIds: motion.owners.map((owner) => owner.ownerId),
      ...(previousReviewFrameAtMs === undefined
        ? {}
        : { frameIntervalMs: atMs - previousReviewFrameAtMs }),
      scrollDeltaY: window.scrollY - previousReviewScrollY
    } }));
    previousReviewFrameAtMs = atMs;
    previousReviewScrollY = window.scrollY;
  }
}

function syncAccessibleEquation(objectId: string | undefined): void {
  if (objectId === undefined) return;
  for (const [candidateId, element] of accessibleEquationStates) {
    const active = candidateId === objectId;
    element.hidden = !active;
    if (active) element.setAttribute("aria-current", "step");
    else element.removeAttribute("aria-current");
  }
  stage.dataset["kpReaderAccessibleEquationState"] = objectId;
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
  renderWithAdapter(lastSample());
}

function renderWithAdapter(sample: KpReaderClockSample): void {
  renderer.render(sample, createKpReaderSessionSnapshot({
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

function rendererInspection() {
  const inspection = renderer.inspect();
  if (inspection === undefined) {
    throw new Error(`Reader adapter ${renderer.adapterId} has no scheduler inspection.`);
  }
  return inspection;
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

function onTocNavigation(event: MouseEvent): void {
  const link = event.target instanceof Element
    ? event.target.closest<HTMLAnchorElement>('a[href^="#"]')
    : null;
  const href = link?.getAttribute("href");
  if (link === null || href === null || href === undefined || !toc.contains(link)) {
    return;
  }
  const beatId = decodeURIComponent(href.slice(1));
  const beat = beats.find((candidate) =>
    requiredData(candidate, "kpBeat") === beatId
  );
  if (beat === undefined) return;
  event.preventDefault();
  const authoredProgress = Number(requiredData(beat, "kpCheckpoint"));
  const exactProgress =
    foldableDistributionControls?.resolveCheckpointProgressPermille(
      beatId,
      authoredProgress
    ) ?? authoredProgress;
  // Outline navigation selects a semantic checkpoint. Only the scrubber and
  // scrolling controls are allowed to request intermediate material states.
  setControlProgress(exactProgress);
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
  renderWithAdapter(controlSample);
  if (updateLocation) locationSettlement.settle();
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

function readerHref(sample: KpReaderClockSample): string {
  const base = new URL(window.location.href);
  if (activeBeat !== undefined) base.hash = requiredData(activeBeat, "kpBeat");
  const sessionHref = encodeKpReaderSessionUrl(base, createKpReaderSessionSnapshot({
    documentId,
    documentVersion,
    checkpointId: sample.checkpointId,
    progressPermille: sample.progressPermille,
    projectionId: "equation.symbolic",
    focusRefs: focus.getSnapshot().objectRefs,
    motionPreference,
    equationPresentationProfileId: equationPresentationProfile.id
  }));
  return foldableDistributionControls?.encodeHref({
    baseUrl: sessionHref,
    checkpointId: activeBeat === undefined
      ? sample.checkpointId
      : requiredData(activeBeat, "kpBeat"),
    progressPermille: sample.progressPermille,
    direction: sample.direction
  }) ?? sessionHref;
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
  locationSettlement.settle();
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
    // URL state is exact semantic authority. Browser scroll positions can
    // quantize an inverse piecewise mapping by a fraction of a pixel.
    setExplicitProgress(progress, "url", false);
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
  const scrollPosition = sampleKpReaderScrollPosition(
    progressPermille / 1_000,
    geometry
  );
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
  resizeObserver.disconnect();
  reducedMotion.removeEventListener("change", renderCurrentSample);
  motionSelect.removeEventListener("change", onMotionPreferenceChange);
  equationProfileSelect?.removeEventListener("change", onEquationProfileChange);
  attentionPrevious.removeEventListener("click", onAttentionPrevious);
  attentionNext.removeEventListener("click", onAttentionNext);
  attentionScrubber.removeEventListener("input", onAttentionScrub);
  toc.removeEventListener("click", onTocNavigation);
  window.removeEventListener("wheel", releaseControlAuthority);
  window.removeEventListener("touchstart", releaseControlAuthority);
  window.removeEventListener("pointerdown", releaseControlAuthority);
  window.removeEventListener("keydown", onReaderKeyDown);
  window.removeEventListener("scrollend", locationSettlement.settle);
  fontReviewLifecycle.dispose();
  readerCanonicalEquationSession?.dispose();
  foldableDistributionControls?.dispose();
  semanticLinkBindings.dispose();
  locationSettlement.dispose();
  rendererRegistry.disposeAll();
  scrollClock.dispose();
  focus.dispose();
  unsubscribeFocus();
  materialLayer.dispose();
}
