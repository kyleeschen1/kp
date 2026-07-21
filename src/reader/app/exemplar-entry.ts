import { createLinearSolveAnimationAsset } from "../../animation/linear-solve-adapter.ts";
import {
  createKpEquationLinearRearrangementBindings
} from "../../rendering/equation-linear-rearrangement-bindings.ts";
import {
  createKpWitnessedAnnihilationBinding
} from "../../animation/witnessed-annihilation.ts";
import { createKpEquationFontReadiness } from "../../rendering/equation-font-readiness.ts";
import { kpEquationPresentationProfile } from "../../rendering/equation-presentation-policy.ts";
import {
  applyKpReaderEquationResponsiveFit,
  compileKpReaderEquationMaterialPlan,
  createKpReaderEquationFrameScheduler,
  createKpReaderEquationMaterialLayer,
  measureKpReaderEquationLayoutSnapshot,
  planKpReaderEquationPerceptualAlignment,
  planKpReaderEquationResponsiveFit,
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
  createKpReaderContinuousScrollClock,
  createKpReaderSemanticFocusService,
  createKpReaderSessionSnapshot,
  decodeKpReaderSessionUrl,
  encodeKpReaderSessionUrl,
  projectKpReaderMotion,
  parseKpReaderMotionPreference,
  resolveKpReaderMotionPolicy,
  sampleKpReaderAnimationFrame,
  type KpReaderClockSample,
  type KpReaderContinuousScrollClock,
  type KpReaderFocusSnapshot,
  type KpReaderMotionPreference
} from "../runtime/public-api.ts";

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

const documentId = "lesson.solve-x.x-plus-3";
const documentVersion = "1";
// The semantic URL is the scroll authority. Browser history restoration can
// otherwise race a requested frame when moving between two lesson URLs.
window.history.scrollRestoration = "manual";
const animation = createLinearSolveAnimationAsset();
const presentationProfile = kpEquationPresentationProfile(animation);
const linearRearrangementBindings = createKpEquationLinearRearrangementBindings(
  animation
);
const story = requireElement<HTMLElement>("[data-kp-asset]");
const staticSurface = requireElement<HTMLElement>("[data-kp-animation-static]");
const template = requireElement<HTMLTemplateElement>("template[data-kp-reader-exemplar-template]");
const templateContent = template.content.cloneNode(true);
staticSurface.append(templateContent);
document.body.dataset["kpReaderHydrated"] = "true";

const stage = requireElement<HTMLElement>("[data-kp-reader-equation-stage]");
stage.dataset["kpReaderEquationPresentationRecipe"] = presentationProfile.recipe;
stage.dataset["kpReaderEquationCancellationRecipe"] = presentationProfile.cancellation;
stage.dataset["kpReaderEquationZeroWitnessRecipe"] = presentationProfile.zeroWitness;
stage.dataset["kpReaderEquationSuccessorRecipe"] = presentationProfile.successor;
stage.dataset["kpReaderEquationDepthRecipe"] = presentationProfile.depth;
const viewport = requireElement<HTMLElement>("[data-kp-reader-equation-viewport]");
const materialFitSurface = requireElement<HTMLElement>(
  "[data-kp-reader-material-fit-surface]"
);
const annihilationWitness = requireElement<HTMLElement>(
  "[data-kp-reader-annihilation-witness]"
);
const status = requireElement<HTMLOutputElement>("[data-kp-reader-stage-status]");
const progressBar = requireElement<HTMLElement>("[data-kp-reader-progress-bar]");
const motionSelect = requireElement<HTMLSelectElement>(
  "[data-kp-reader-motion-preference]"
);
const shareLink = requireElement<HTMLAnchorElement>("[data-kp-reader-share]");
const beats = [...story.querySelectorAll<HTMLElement>("[data-kp-beat]")];
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
];
const witnessedBindings = new Map(animation.transformations.flatMap((transformation) => {
  if (
    presentationProfile.cancellation !== "witnessed-annihilation-v1" &&
    presentationProfile.zeroWitness !== "embedded-v1"
  ) return [];
  const cancellation = transformation.correspondenceMap?.records.find(
    (record) => record.relation === "cancelation"
  );
  if (cancellation === undefined) return [];
  return [[transformation.id, createKpWitnessedAnnihilationBinding({
    operationId: "kp.algebra.cancel-additive-inverses",
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

const staticPlans = new Map(animation.transformations.map((transformation, index) => {
  const progress = (index + 0.5) / animation.transformations.length;
  const clock = createKpReaderClockSample({ source: "scroll", progress });
  const runtimeFrame = sampleKpReaderAnimationFrame({ animation, clock });
  const renderPlan = projectKpReaderEquationRenderPlan({ animation, runtimeFrame });
  return [transformation.id, compileKpReaderEquationMaterialPlan(renderPlan)] as const;
}));
const materialLayer = createKpReaderEquationMaterialLayer(
  requireDescendant<HTMLElement>(viewport, "[data-kp-reader-equation-material-layer]")
);

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
window.addEventListener("resize", updateScrollGeometry, { passive: true });
window.addEventListener("scrollend", settleLocation, { passive: true });
document.addEventListener("pointerover", onSemanticEnter);
document.addEventListener("pointerout", onSemanticLeave);
document.addEventListener("focusin", onSemanticEnter);
document.addEventListener("focusout", onSemanticLeave);
window.addEventListener("pagehide", dispose, { once: true });
reducedMotion.addEventListener("change", renderCurrentSample);
motionSelect.addEventListener("change", onMotionPreferenceChange);
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
  if (scrollClock === undefined) return;
  scrollClock.updateGeometry(geometry);
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
  return window.scrollY + window.innerHeight * 0.48;
}

function onScroll(): void {
  scheduleScrollSample();
  if (settleTimer !== undefined) window.clearTimeout(settleTimer);
  settleTimer = window.setTimeout(settleLocation, 180);
}

function scheduleScrollSample(): void {
  if (scrollFrame !== undefined) return;
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = undefined;
    scheduler.render(scrollClock.samplePosition(readerPosition()));
  });
}

function measureLayout(revision: number): LayoutState {
  const contexts = new Map<string, TransitionContext>();
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
    const fit = planKpReaderEquationResponsiveFit({
      alignment,
      viewportWidth: viewport.clientWidth,
      horizontalPadding: 18,
      minScale: 0.68
    });
    applyKpReaderEquationResponsiveFit(fitSurface, fit);
    contexts.set(id, {
      id,
      element,
      fitSurface,
      measurementRoot,
      materialPlan,
      anchorElements: anchorElementIndex(measurementRoot),
      layout,
      alignment,
      fit
    });
  }
  stage.dataset["kpReaderLayoutReads"] = String(scheduler.inspect().readCount + 1);
  return { contexts };
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
  const visualSample = {
    ...sample,
    progress: projection.progress,
    progressPermille: projection.progressPermille,
    checkpointId: projection.checkpointId
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
    witnessedAnnihilationBinding: witnessedBindings.get(transitionId),
    successorSynthesisBinding:
      presentationProfile.successor === "successor-synthesis-v1"
        ? choreographyStep?.successorSynthesisBinding
        : undefined,
    progress: phaseProgress
  });
  const focusSnapshot = focus.getSnapshot();
  const focusedRefs = visualFocusRefs(focusSnapshot);

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
              opacity: pose.opacity
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
  applyFocus(focusSnapshot);
  progressBar.style.transform = `scaleX(${visualSample.progress})`;
  document.body.dataset["kpReaderProgress"] = String(visualSample.progressPermille);
  document.body.dataset["kpReaderMotionMode"] = projection.mode;
  document.body.dataset["kpReaderMotionPreference"] = motionPreference;
  stage.dataset["kpReaderMotionAuthority"] = motion.samplingAuthority;
  document.body.dataset["kpReaderTransition"] = transitionId;
  document.body.dataset["kpReaderFramePlans"] = String(scheduler.inspect().framePlanCount + 1);
  updateActiveBeat(visualSample.progressPermille);
  if (import.meta.env.DEV) {
    const atMs = performance.now();
    const schedulerState = scheduler.inspect();
    window.dispatchEvent(new CustomEvent("kp:reader-dev-review-frame", { detail: {
      atMs,
      documentId,
      documentVersion,
      assetId: animation.id,
      checkpointId: visualSample.checkpointId,
      progressPermille: visualSample.progressPermille,
      projectionId: "equation.symbolic",
      activeTransformationIds: [...runtimeFrame.activeTransformationIds],
      activePhase: runtimeFrame.phase.phaseId,
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

function syncAnnihilationWitness(
  witnessed: KpReaderEquationSymbolMotionFrame["witnessedAnnihilation"],
  decorativeMotion: boolean
): void {
  if (witnessed === undefined) {
    annihilationWitness.style.opacity = "0";
    delete stage.dataset["kpReaderAnnihilationPhase"];
    delete stage.dataset["kpReaderAnnihilationWitnessReadable"];
    return;
  }
  const pose = witnessed.frame.witness.pose;
  annihilationWitness.style.left = `${witnessed.contactPoint.x}px`;
  annihilationWitness.style.top = `${witnessed.contactPoint.y}px`;
  annihilationWitness.style.opacity = String(pose.opacity);
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
    String(witnessed.frame.witnessReadable);
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

function updateActiveBeat(progressPermille: number): void {
  activeBeat = [...beats].sort((left, right) =>
    Math.abs(Number(requiredData(left, "kpCheckpoint")) - progressPermille) -
    Math.abs(Number(requiredData(right, "kpCheckpoint")) - progressPermille)
  )[0];
  if (activeBeat === undefined) return;
  for (const beat of beats) {
    const active = beat === activeBeat;
    beat.dataset["kpBeatActive"] = String(active);
    if (active) beat.setAttribute("aria-current", "step");
    else beat.removeAttribute("aria-current");
  }
  status.value = activeBeat.querySelector("h2")?.textContent?.trim() ?? "Follow the symbols";
  focus.set("story", dataRefs(activeBeat));
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
    motionPreference
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
  const geometry = scrollGeometry();
  const scrollPosition = geometry.startPx + (geometry.endPx - geometry.startPx) * progress / 1_000;
  window.scrollTo({ top: scrollPosition - window.innerHeight * 0.48 });
}

function lastSample(): KpReaderClockSample {
  return scrollClock.getSnapshot();
}

function anchorElementIndex(root: HTMLElement): ReadonlyMap<string, HTMLElement> {
  return new Map([...root.querySelectorAll<HTMLElement>(
    "[data-kp-reader-equation-anchor-id]"
  )].map((element) => [requiredData(element, "kpReaderEquationAnchorId"), element]));
}

function dataRefs(element: HTMLElement): readonly string[] {
  return (element.dataset["kpFocus"] ?? "").split(/\s+/).filter(Boolean);
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
