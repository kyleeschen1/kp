import {
  attentionPhaseAt,
  createKpDistributionAreaAttentionPlan
} from "../../animation/distribution-area-exemplar-attention.ts";
import { createKpEquationFontReadiness } from "../../rendering/equation-font-readiness.ts";
import {
  bindKpReaderSemanticLinks,
  createKpReaderActiveLocationService,
  createKpReaderContinuousScrollClock,
  createKpReaderSessionSnapshot,
  createKpReaderLocationSettlement,
  createKpReaderRuntimeRouteDescriptor,
  decodeKpDistributionAreaUrl,
  encodeKpDistributionAreaUrl,
  type KpDistributionAreaDirection,
  type KpReaderContinuousScrollClock,
  type KpReaderPiecewiseScrollGeometry
} from "../runtime/public-api.ts";
import {
  type KpDistributionAreaMaterialTokenId,
  type KpDistributionAreaMotionPlan,
  type KpDistributionAreaTimelineFrame,
  type KpDistributionAreaTokenPose,
  type KpDistributionAreaWidthMotionPlan,
  type KpDistributionAreaWidthTokenId,
  type KpDistributionAreaWidthTokenPose
} from "../renderers/public-api.ts";
import { createKpReaderArtifactRef } from "../document/public-api.ts";
import { createKpReaderFontReviewLifecycle } from "./reader-font-review-lifecycle.ts";
import { mountKpReaderDevelopmentReview } from "./development-review-loader.ts";
import {
  installKpAnimationHostStatus,
  markKpAnimationHostReady
} from "../../rendering/animation-host-status.ts";

installKpAnimationHostStatus(window, "reader.distribution-area");

const {
  createKpReaderAdapterRegistry,
  createKpDistributionAreaMotionPlan,
  createKpDistributionAreaTermSchedule,
  createKpDistributionAreaWidthMotionPlan,
  defineKpReaderScheduledRendererAdapter,
  measureKpDistributionAreaLayout,
  measureKpDistributionAreaWidthLayout
} = await import("./distribution-area-renderer-runtime.ts");

type Direction = KpDistributionAreaDirection;

interface DistributionFrameInput {
  readonly progress: number;
  readonly direction: Direction;
  readonly settleLocation: boolean;
}

interface DistributionLayoutPlan {
  readonly motionPlan: KpDistributionAreaMotionPlan;
  readonly widthMotionPlan: KpDistributionAreaWidthMotionPlan;
}

const stage = required<HTMLElement>("[data-kp-distribution-stage]");
const story = required<HTMLElement>("[data-kp-asset]");
const readerRoute = createKpReaderRuntimeRouteDescriptor({
  href: window.location.href,
  documentId: requiredData(document.body, "kpReaderDocumentId"),
  documentVersion: requiredData(document.body, "kpReaderDocumentVersion")
});
const scrubber = required<HTMLInputElement>("[data-kp-distribution-scrubber]");
const progressOutput = required<HTMLOutputElement>("[data-kp-distribution-progress]");
const statusOutput = required<HTMLOutputElement>("[data-kp-distribution-status]");
const share = required<HTMLAnchorElement>("[data-kp-distribution-share]");
const material = required<HTMLElement>("[data-kp-algebra-material]");
const algebraRoot = required<HTMLElement>(".kp-distribution-algebra");
const measurementRoot = required<HTMLElement>("[data-kp-distribution-measurement]");
const areaRoot = required<HTMLElement>(".kp-distribution-area");
const widthMaterial = required<HTMLElement>("[data-kp-area-width-material]");
const factoredNative = required<HTMLElement>('[data-kp-native="factored"]');
const expandedNative = required<HTMLElement>('[data-kp-native="expanded"]');
const beats = [...document.querySelectorAll<HTMLElement>("[data-kp-beat]")];
const activeLocation = createKpReaderActiveLocationService({
  toc: required<HTMLElement>(".kp-lesson-toc"),
  beats
});
const directionButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-kp-direction-button]")];
const attention = createKpDistributionAreaAttentionPlan();
const termSchedule = createKpDistributionAreaTermSchedule();
const fontReadiness = createKpEquationFontReadiness(document);
let direction: Direction = readDirection();
let progress = readProgress();
let pointerOwnsProgress = false;
let semanticUrlOwnsProgress = hasSemanticProgress();
let scrollInteractionArmed = !semanticUrlOwnsProgress;
let scrollFrame = 0;
let layoutRevision = 0;
let layoutReadCount = 0;
let motionPlan: KpDistributionAreaMotionPlan | undefined;
let widthMotionPlan: KpDistributionAreaWidthMotionPlan | undefined;
let previousReviewFrameAtMs: number | undefined;
let previousReviewScrollY = window.scrollY;
let scrollClock: KpReaderContinuousScrollClock | undefined;
const locationSettlement = createKpReaderLocationSettlement({
  ownerWindow: window,
  shareLink: share,
  href: semanticUrl
});
const distributionRendererHost = {
  readLayout(revision: number) {
    // Distribution exposed one-based revisions before adopting the generic
    // scheduler; retain that diagnostic contract at the adapter boundary.
    layoutRevision = revision + 1;
    layoutReadCount += 1;
    return {
      layout: measureKpDistributionAreaLayout({
        algebraRoot,
        measurementRoot,
        revision: layoutRevision
      }),
      widthLayout: measureKpDistributionAreaWidthLayout({
        areaRoot,
        revision: layoutRevision
      })
    };
  },
  writeFrame(frame: {
    readonly input: DistributionFrameInput;
    readonly layoutPlan: DistributionLayoutPlan;
  }) {
    const { input, layoutPlan } = frame;
    progress = input.progress;
    direction = input.direction;
    motionPlan = layoutPlan.motionPlan;
    widthMotionPlan = layoutPlan.widthMotionPlan;
    stage.dataset["kpDistributionLayoutRevision"] = String(layoutRevision);
    stage.dataset["kpDistributionLayoutReadCount"] = String(layoutReadCount);
    stage.dataset["kpDistributionSchedule"] = termSchedule.id;
    renderFrame();
    if (input.settleLocation) locationSettlement.settle();
  }
};
const rendererRegistry = createKpReaderAdapterRegistry<
  typeof distributionRendererHost,
  DistributionFrameInput
>();
rendererRegistry.register(defineKpReaderScheduledRendererAdapter<DistributionFrameInput>()({
  id: "renderer.distribution-composite",
  readLayout: (host, _mount, { revision }) => host.readLayout(revision),
  planLayout: (
    _host,
    _mount,
    { layout: nextLayout, widthLayout }
  ): DistributionLayoutPlan => ({
    motionPlan: createKpDistributionAreaMotionPlan(nextLayout, termSchedule),
    widthMotionPlan: createKpDistributionAreaWidthMotionPlan(widthLayout, termSchedule)
  }),
  planFrame: (_host, { input, layoutPlan }) => ({ input, layoutPlan }),
  writeFrame: (host, frame) => host.writeFrame(frame)
}));
const renderer = rendererRegistry.mount({
  adapterId: "renderer.distribution-composite",
  host: distributionRendererHost,
  blockId: requiredData(story, "kpBlock"),
  asset: createKpReaderArtifactRef({
    kind: "animation-asset",
    id: requiredData(story, "kpAsset"),
    version: requiredData(story, "kpAssetVersion")
  }),
  session: createKpReaderSessionSnapshot({
    documentId: readerRoute.documentId,
    documentVersion: readerRoute.documentVersion
  })
});
stage.dataset["kpReaderRendererAdapter"] = renderer.adapterId;

document.body.dataset["kpReaderHydrated"] = "true";
directionButtons.forEach((button) => button.addEventListener("click", () => {
  const next = button.dataset["kpDirectionButton"];
  if (next !== "forward" && next !== "inverse" || next === direction) return;
  // Complementing progress preserves the visible frame when operation direction changes.
  progress = 1 - progress;
  direction = next;
  pointerOwnsProgress = true;
  renderImmediately();
  locationSettlement.settle();
}));
scrubber.addEventListener("input", () => {
  pointerOwnsProgress = true;
  progress = Number(scrubber.value) / 1000;
  renderImmediately();
});
scrubber.addEventListener("change", () => {
  locationSettlement.settle();
});
window.addEventListener("scroll", () => {
  if (semanticUrlOwnsProgress && !scrollInteractionArmed) return;
  semanticUrlOwnsProgress = false;
  pointerOwnsProgress = false;
  scheduleScroll();
}, { passive: true });
window.addEventListener("resize", () => refreshLayoutAndRender("resize"), { passive: true });
window.addEventListener("wheel", armScrollInteraction, { passive: true });
window.addEventListener("touchstart", armScrollInteraction, { passive: true });
window.addEventListener("keydown", (event) => {
  if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
    armScrollInteraction();
  }
});
document.addEventListener("pointerdown", (event) => {
  if (event.target instanceof Element && event.target.closest('a[href^="#"]') !== null) {
    armScrollInteraction();
  }
});
share.addEventListener("click", locationSettlement.settle);
const semanticLinkBindings = bindKpReaderSemanticLinks({
  root: document,
  selector: "[data-kp-focus]",
  setFocus: (_source, concepts) => setExternalFocus(concepts),
  clearFocus: () => setExternalFocus([])
});

const fontReviewLifecycle = createKpReaderFontReviewLifecycle({
  readiness: fontReadiness,
  ownerDocument: document,
  ownerWindow: window,
  developmentReviewMount: mountKpReaderDevelopmentReview,
  reviewMount: "font-ready",
  reflectFontReadyOnBody: true,
  renderReviewFrame: requestRender,
  onFontInvalidated: () => refreshLayoutAndRender("fonts"),
  onReady: () => {
    refreshLayoutAndRender("fonts");
    if (!hasSemanticProgress()) scheduleScroll();
    // The outer library may declare this host live only after the
    // font-stable renderer has produced its first frame.
    window.requestAnimationFrame(() => {
      markKpAnimationHostReady(window);
    });
  }
});
void fontReviewLifecycle.ready;
window.addEventListener("pagehide", () => {
  share.removeEventListener("click", locationSettlement.settle);
  fontReviewLifecycle.dispose();
  semanticLinkBindings.dispose();
  locationSettlement.dispose();
  scrollClock?.dispose();
  rendererRegistry.disposeAll();
}, { once: true });

function renderFrame(): void {
  if (fontReadiness.status === "waiting" || motionPlan === undefined || widthMotionPlan === undefined) return;
  progress = clamp01(progress);
  const visualProgress = direction === "forward" ? progress : 1 - progress;
  const timeline = motionPlan.sample(visualProgress);
  const correspondenceProgress = timeline.phase === "distribution" ? timeline.phaseProgress : 1;
  const evaluationProgress = timeline.phase === "evaluation" ? timeline.phaseProgress : 0;
  const owner = visualProgress === 0
    ? "factored-native"
    : visualProgress === 1 ? "expanded-native" : "material";
  const widthOwner = visualProgress === 0
    ? "combined-native"
    : visualProgress === 1 ? "components-native" : "material";

  stage.dataset["kpDirection"] = direction;
  stage.dataset["kpOwner"] = owner;
  stage.dataset["kpAlgebraOwner"] = owner;
  stage.dataset["kpWidthOwner"] = widthOwner;
  stage.dataset["kpCheckpoint"] = checkpointFor(visualProgress);
  stage.style.setProperty("--kp-partition-progress", String(correspondenceProgress));
  factoredNative.hidden = visualProgress !== 0;
  expandedNative.hidden = visualProgress !== 1;
  material.hidden = visualProgress === 0 || visualProgress === 1;
  if (!material.hidden) renderMaterial(timeline);
  widthMaterial.hidden = visualProgress === 0 || visualProgress === 1;
  if (!widthMaterial.hidden) renderWidthMaterial(correspondenceProgress);
  setOpacity("combined-width", visualProgress === 0 ? 1 : 0);
  setOpacity("x-width", visualProgress === 1 ? 1 : 0);
  setOpacity("two-width", visualProgress === 1 ? 1 : 0);
  setOpacity("left-area", correspondenceProgress);
  setOpacity("right-pair", correspondenceProgress * (1 - interval(evaluationProgress, 0.52, 0.65)));
  setOpacity("right-area", interval(evaluationProgress, 0.65, 0.82));
  required<SVGLineElement>("[data-kp-area-divider]").style.opacity = String(correspondenceProgress);

  const permille = Math.round(visualProgress * 1000);
  const phase = attentionPhaseAt(attention, permille);
  stage.dataset["kpAttentionPhase"] = phase.id;
  stage.dataset["kpAttentionKind"] = phase.kind;
  statusOutput.textContent = direction === "forward" ? phase.cue : phase.inverseCue;
  setAttentionFocus(phase.conceptIds);
  setActiveBeat(visualProgress);
  scrubber.value = String(Math.round(progress * 1000));
  progressOutput.textContent = `${Math.round(progress * 100)}%`;
  for (const button of directionButtons) {
    button.setAttribute("aria-pressed", String(button.dataset["kpDirectionButton"] === direction));
  }
  locationSettlement.updateShare();
  const fitStatus = distributionFitStatus();
  stage.dataset["kpFitStatus"] = fitStatus;
  dispatchDevReviewFrame(phase.id, phase.conceptIds, owner, permille, fitStatus);
}

function dispatchDevReviewFrame(
  phaseId: string,
  conceptIds: readonly string[],
  owner: string,
  progressPermille: number,
  fitStatus: "contained" | "overflowing"
): void {
  if (!import.meta.env.DEV) return;
  const atMs = performance.now();
  window.dispatchEvent(new CustomEvent("kp:reader-dev-review-frame", { detail: {
    atMs,
    documentId: "lesson.algebra.distribution-area",
    documentVersion: "1",
    assetId: "exemplar.distribution-area.3-times-x-plus-2",
    checkpointId: checkpointFor(progressPermille / 1000),
    progressPermille,
    projectionId: "equation-area.distribution",
    activeTransformationIds: [`distribution.${direction}`],
    activePhase: phaseId,
    focusSource: "story",
    focusRefs: [...conceptIds],
    motionPreference: "full",
    motionMode: "continuous",
    playbackDirection: direction === "forward" ? "forward" : "rewind",
    rendererId: "reader.distribution.composite",
    motionAuthority: pointerOwnsProgress ? "controls" : "scroll",
    fitStatus,
    fitScale: 1,
    layoutRevision,
    layoutReadCount,
    fontRevision: fontReadiness.revision,
    fontReady: fontReadiness.status !== "waiting",
    ownerIds: [owner],
    ...(previousReviewFrameAtMs === undefined
      ? {}
      : { frameIntervalMs: atMs - previousReviewFrameAtMs }),
    scrollDeltaY: window.scrollY - previousReviewScrollY
  } }));
  previousReviewFrameAtMs = atMs;
  previousReviewScrollY = window.scrollY;
}

function distributionFitStatus(): "contained" | "overflowing" {
  const tolerance = 1;
  const contained = document.documentElement.scrollWidth <= window.innerWidth + tolerance &&
    [stage, algebraRoot, areaRoot].every((element) =>
      element.scrollWidth <= element.clientWidth + tolerance
    );
  return contained ? "contained" : "overflowing";
}

function renderMaterial(frame: KpDistributionAreaTimelineFrame): void {
  for (const [id, pose] of Object.entries(frame.tokens) as Array<
    [KpDistributionAreaMaterialTokenId, KpDistributionAreaTokenPose]
  >) token(id, pose);
  material.dataset["kpVisualProgress"] = String(frame.progress);
  material.dataset["kpTimelinePhase"] = frame.phase;
  material.dataset["kpTimelinePhaseProgress"] = String(frame.phaseProgress);
}

function token(
  id: KpDistributionAreaMaterialTokenId,
  pose: KpDistributionAreaTokenPose
): void {
  const element = required<HTMLElement>(`[data-kp-material-token="${id}"]`);
  element.style.transform = `translate(-50%, -50%) scale(${pose.scale})`;
  element.style.left = `${pose.x}px`;
  element.style.top = `${pose.y}px`;
  element.style.opacity = String(clamp01(pose.opacity));
}

function renderWidthMaterial(partitionProgress: number): void {
  const frame = widthMotionPlan!.sample(partitionProgress);
  for (const [id, pose] of Object.entries(frame) as Array<
    [KpDistributionAreaWidthTokenId, KpDistributionAreaWidthTokenPose]
  >) widthToken(id, pose);
}

function widthToken(id: KpDistributionAreaWidthTokenId, pose: KpDistributionAreaWidthTokenPose): void {
  const element = required<HTMLElement>(`[data-kp-area-width-token="${id}"]`);
  element.style.transform = `translate(-50%, -50%) scale(${pose.scale})`;
  element.style.left = `${pose.x}px`;
  element.style.top = `${pose.y}px`;
  element.style.opacity = String(clamp01(pose.opacity));
}

function refreshLayoutAndRender(reason: "resize" | "fonts" | "content" = "content"): void {
  if (fontReadiness.status === "waiting") return;
  renderer.refresh(reason);
  requestRender();
}

function requestRender(settleLocation = false): void {
  const frame = { progress, direction, settleLocation };
  renderer.render(frame, distributionSession(frame));
}

function renderImmediately(): void {
  const frame = { progress, direction, settleLocation: false };
  renderer.renderNow(frame, distributionSession(frame));
}

function distributionSession(frame: DistributionFrameInput) {
  return createKpReaderSessionSnapshot({
    documentId: readerRoute.documentId,
    documentVersion: readerRoute.documentVersion,
    checkpointId: checkpointFor(
      frame.direction === "forward" ? frame.progress : 1 - frame.progress
    ),
    progressPermille: Math.round(frame.progress * 1_000),
    projectionId: "equation-area.distribution",
    motionPreference: "full"
  });
}

function setOpacity(role: string, opacity: number): void {
  const value = opacity < 0.12 ? 0 : opacity > 0.88 ? 1 : opacity;
  required<HTMLElement>(`[data-kp-area-label="${role}"]`).style.opacity = String(clamp01(value));
}

function scheduleScroll(): void {
  if (pointerOwnsProgress) return;
  cancelAnimationFrame(scrollFrame);
  scrollFrame = requestAnimationFrame(() => {
    const clock = distributionScrollClock();
    clock.updateGeometry(distributionScrollGeometry());
    const visualProgress = clock.samplePosition(distributionReaderLine()).progress;
    progress = direction === "forward" ? visualProgress : 1 - visualProgress;
    requestRender(true);
  });
}

function armScrollInteraction(): void {
  scrollInteractionArmed = true;
}

function distributionScrollClock(): KpReaderContinuousScrollClock {
  scrollClock ??= createKpReaderContinuousScrollClock({
    id: "clock.reader.distribution-area.scroll",
    geometry: distributionScrollGeometry(),
    initialPositionPx: distributionReaderLine(),
    checkpoints: beats.map((beat) => ({
      id: requiredData(beat, "kpBeat"),
      progressPermille: Number(requiredData(beat, "kpCheckpoint"))
    }))
  });
  return scrollClock;
}

function distributionScrollGeometry(): KpReaderPiecewiseScrollGeometry {
  return {
    stops: beats.map((beat) => ({
      positionPx: beat.getBoundingClientRect().top + beat.offsetHeight / 2,
      progressPermille: Number(requiredData(beat, "kpCheckpoint"))
    }))
  };
}

function distributionReaderLine(): number {
  return window.innerHeight * 0.52;
}

function setActiveBeat(visualProgress: number): void {
  let selected = beats[0];
  for (const beat of beats) {
    const checkpoint = Number(beat.dataset["kpCheckpoint"] ?? 0) / 1000;
    if (visualProgress >= checkpoint) selected = beat;
  }
  if (selected !== undefined) activeLocation.sync(requiredData(selected, "kpBeat"));
}

function setAttentionFocus(concepts: readonly string[]): void {
  for (const element of document.querySelectorAll<HTMLElement>("[data-kp-concept]")) {
    const own = element.dataset["kpConcept"]?.split(" ") ?? [];
    element.dataset["kpAttentionFocus"] = String(own.some((concept) => concepts.includes(concept)));
  }
}

function setExternalFocus(concepts: readonly string[]): void {
  for (const element of document.querySelectorAll<HTMLElement>("[data-kp-concept]")) {
    const own = element.dataset["kpConcept"]?.split(" ") ?? [];
    element.dataset["kpExternalFocus"] = String(own.some((concept) => concepts.includes(concept)));
  }
}

function semanticUrl(): URL {
  const visualProgress = direction === "forward" ? progress : 1 - progress;
  return new URL(encodeKpDistributionAreaUrl(window.location.href, readerRoute, {
    checkpoint: checkpointFor(visualProgress),
    progressPermille: Math.round(progress * 1000),
    direction
  }));
}

function checkpointFor(visualProgress: number): "factored" | "distributed" | "expanded" {
  if (visualProgress === 0) return "factored";
  if (visualProgress === 1) return "expanded";
  return "distributed";
}

function readProgress(): number {
  const state = decodeKpDistributionAreaUrl(window.location.href, readerRoute);
  if (state.progressPermille !== undefined) return state.progressPermille / 1000;
  const visualProgress = state.checkpoint === "expanded" ? 1
    : state.checkpoint === "distributed" ? 0.72
    : 0;
  return direction === "forward" ? visualProgress : 1 - visualProgress;
}

function readDirection(): Direction {
  return decodeKpDistributionAreaUrl(window.location.href, readerRoute).direction;
}

function hasSemanticProgress(): boolean {
  return decodeKpDistributionAreaUrl(window.location.href, readerRoute).progressPermille !== undefined;
}

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Missing distribution reader element ${selector}.`);
  return element;
}

function requiredData(element: HTMLElement, key: string): string {
  const value = element.dataset[key];
  if (value === undefined || value.length === 0) throw new Error(`Missing distribution reader data-${key}.`);
  return value;
}

function interval(value: number, start: number, end: number): number {
  if (value <= start) return 0;
  if (value >= end) return 1;
  const local = (value - start) / (end - start);
  return local * local * (3 - 2 * local);
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}
