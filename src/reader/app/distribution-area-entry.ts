import "../../animation/fission-fusion-register.ts";
import {
  attentionPhaseAt,
  createKpDistributionAreaAttentionPlan
} from "../../animation/distribution-area-exemplar-attention.ts";
import { createKpEquationFontReadiness } from "../../rendering/equation-font-readiness.ts";
import { createKpReaderActiveLocationService } from "../runtime/public-api.ts";
import {
  createKpDistributionAreaMotionPlan,
  createKpDistributionAreaTermSchedule,
  createKpDistributionAreaWidthMotionPlan,
  measureKpDistributionAreaLayout,
  measureKpDistributionAreaWidthLayout,
  type KpDistributionAreaLayoutSnapshot,
  type KpDistributionAreaMaterialTokenId,
  type KpDistributionAreaMotionPlan,
  type KpDistributionAreaTimelineFrame,
  type KpDistributionAreaTokenPose,
  type KpDistributionAreaWidthMotionPlan,
  type KpDistributionAreaWidthTokenId,
  type KpDistributionAreaWidthTokenPose
} from "../renderers/public-api.ts";

type Direction = "forward" | "inverse";

const stage = required<HTMLElement>("[data-kp-distribution-stage]");
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
let layout: KpDistributionAreaLayoutSnapshot | undefined;
let motionPlan: KpDistributionAreaMotionPlan | undefined;
let widthMotionPlan: KpDistributionAreaWidthMotionPlan | undefined;
let previousReviewFrameAtMs: number | undefined;
let previousReviewScrollY = window.scrollY;

document.body.dataset["kpReaderFontReady"] = String(fontReadiness.status !== "waiting");
document.body.dataset["kpReaderHydrated"] = "true";
directionButtons.forEach((button) => button.addEventListener("click", () => {
  const next = button.dataset["kpDirectionButton"];
  if (next !== "forward" && next !== "inverse" || next === direction) return;
  // Complementing progress preserves the visible frame when operation direction changes.
  progress = 1 - progress;
  direction = next;
  pointerOwnsProgress = true;
  render();
  replaceSemanticUrl();
}));
scrubber.addEventListener("input", () => {
  pointerOwnsProgress = true;
  progress = Number(scrubber.value) / 1000;
  render();
});
scrubber.addEventListener("change", () => {
  replaceSemanticUrl();
});
window.addEventListener("scroll", () => {
  if (semanticUrlOwnsProgress && !scrollInteractionArmed) return;
  semanticUrlOwnsProgress = false;
  pointerOwnsProgress = false;
  scheduleScroll();
}, { passive: true });
window.addEventListener("resize", refreshLayoutAndRender, { passive: true });
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
if (import.meta.env.DEV) {
  window.addEventListener("kp:reader-dev-review-request-frame", render);
}
share.addEventListener("click", () => replaceSemanticUrl());
for (const element of document.querySelectorAll<HTMLElement>("[data-kp-focus]")) {
  const concepts = element.dataset["kpFocus"]?.split(" ") ?? [];
  element.addEventListener("pointerenter", () => setExternalFocus(concepts));
  element.addEventListener("pointerleave", () => setExternalFocus([]));
  element.addEventListener("focus", () => setExternalFocus(concepts));
  element.addEventListener("blur", () => setExternalFocus([]));
}

const unsubscribeFontReadiness = fontReadiness.subscribe(() => {
  document.body.dataset["kpReaderFontReady"] = "true";
  refreshLayoutAndRender();
});
void fontReadiness.whenReady().then(() => {
  document.body.dataset["kpReaderFontReady"] = "true";
  refreshLayoutAndRender();
  if (!hasSemanticProgress()) scheduleScroll();
  if (import.meta.env.DEV) {
    void import("../../dev-review/reader-review-bootstrap.ts").then(({ mountKpReaderDevReview }) => {
      mountKpReaderDevReview(window);
    });
  }
});
window.addEventListener("pagehide", () => {
  unsubscribeFontReadiness();
  fontReadiness.dispose();
}, { once: true });

function render(): void {
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
  share.href = semanticUrl().toString();
  dispatchDevReviewFrame(phase.id, phase.conceptIds, owner, permille);
}

function dispatchDevReviewFrame(
  phaseId: string,
  conceptIds: readonly string[],
  owner: string,
  progressPermille: number
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
    fitStatus: "contained",
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

function refreshLayoutAndRender(): void {
  if (fontReadiness.status === "waiting") return;
  layoutRevision += 1;
  layoutReadCount += 1;
  layout = measureKpDistributionAreaLayout({ algebraRoot, measurementRoot, revision: layoutRevision });
  motionPlan = createKpDistributionAreaMotionPlan(layout, termSchedule);
  widthMotionPlan = createKpDistributionAreaWidthMotionPlan(measureKpDistributionAreaWidthLayout({
    areaRoot,
    revision: layoutRevision
  }), termSchedule);
  stage.dataset["kpDistributionLayoutRevision"] = String(layoutRevision);
  stage.dataset["kpDistributionLayoutReadCount"] = String(layoutReadCount);
  stage.dataset["kpDistributionSchedule"] = termSchedule.id;
  render();
}

function setOpacity(role: string, opacity: number): void {
  const value = opacity < 0.12 ? 0 : opacity > 0.88 ? 1 : opacity;
  required<HTMLElement>(`[data-kp-area-label="${role}"]`).style.opacity = String(clamp01(value));
}

function scheduleScroll(): void {
  if (pointerOwnsProgress) return;
  cancelAnimationFrame(scrollFrame);
  scrollFrame = requestAnimationFrame(() => {
    progress = progressFromScroll();
    render();
    replaceSemanticUrl();
  });
}

function armScrollInteraction(): void {
  scrollInteractionArmed = true;
}

function progressFromScroll(): number {
  if (beats.length === 0) return progress;
  const readerLine = window.innerHeight * 0.52;
  const points = beats.map((beat) => ({
    center: beat.getBoundingClientRect().top + beat.offsetHeight / 2,
    progress: Number(beat.dataset["kpCheckpoint"] ?? 0) / 1000
  }));
  if (readerLine <= points[0]!.center) return direction === "forward" ? points[0]!.progress : 1 - points[0]!.progress;
  for (let index = 1; index < points.length; index += 1) {
    const before = points[index - 1]!;
    const after = points[index]!;
    if (readerLine <= after.center) {
      const local = clamp01((readerLine - before.center) / (after.center - before.center));
      const visual = lerp(before.progress, after.progress, local);
      return direction === "forward" ? visual : 1 - visual;
    }
  }
  const visual = points.at(-1)!.progress;
  return direction === "forward" ? visual : 1 - visual;
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

function replaceSemanticUrl(): void {
  window.history.replaceState(null, "", semanticUrl());
}

function semanticUrl(): URL {
  const url = new URL(window.location.href);
  const visualProgress = direction === "forward" ? progress : 1 - progress;
  url.searchParams.set("kpLesson", "lesson.algebra.distribution-area");
  url.searchParams.set("kpVersion", "1");
  url.searchParams.set("kpCheckpoint", checkpointFor(visualProgress));
  url.searchParams.set("kpProgress", String(Math.round(progress * 1000)));
  url.searchParams.set("kpDirection", direction);
  return url;
}

function checkpointFor(visualProgress: number): "factored" | "distributed" | "expanded" {
  if (visualProgress === 0) return "factored";
  if (visualProgress === 1) return "expanded";
  return "distributed";
}

function readProgress(): number {
  const params = new URL(window.location.href).searchParams;
  const value = params.get("kpProgress");
  if (value !== null) return clamp01(Number(value) / 1000);
  const visualProgress = params.get("kpCheckpoint") === "expanded" ? 1
    : params.get("kpCheckpoint") === "distributed" ? 0.72
    : 0;
  return direction === "forward" ? visualProgress : 1 - visualProgress;
}

function readDirection(): Direction {
  return new URL(window.location.href).searchParams.get("kpDirection") === "inverse"
    ? "inverse"
    : "forward";
}

function hasSemanticProgress(): boolean {
  return new URL(window.location.href).searchParams.has("kpProgress");
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

function lerp(from: number, to: number, progressValue: number): number {
  return from + (to - from) * clamp01(progressValue);
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
