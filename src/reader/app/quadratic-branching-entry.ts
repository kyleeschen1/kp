import "katex/dist/katex.min.css";

import {
  createKpQuadraticBranchChoreography,
  sampleKpQuadraticBranchChoreography
} from "../../animation/quadratic-branch-choreography.ts";
import {
  createKpReaderClockSample,
  createKpReaderContinuousScrollClock,
  resolveKpReaderResponsiveProjection,
  type KpReaderClockSample
} from "../runtime/public-api.ts";
import {
  kpQuadraticReaderCheckpoints,
  kpQuadraticReaderMethodQueryValue,
  parseKpQuadraticReaderMethod
} from "./quadratic-branching-surface.ts";
import type { KpQuadraticMethodId } from "../../semantic/quadratic-solution-method-graph.ts";
import {
  sampleKpQuadraticEquationGraphFrame
} from "../../projections/quadratic-equation-graph-sync.ts";

const body = document.body;
const stage = requireElement<HTMLElement>("[data-kp-quadratic-stage]");
const story = requireElement<HTMLElement>('[data-kp-block="story.quadratic-branching"]');
const progress = requireElement<HTMLInputElement>("[data-kp-quadratic-progress]");
const previous = requireElement<HTMLButtonElement>("[data-kp-quadratic-previous]");
const next = requireElement<HTMLButtonElement>("[data-kp-quadratic-next]");
const count = requireElement<HTMLOutputElement>("[data-kp-quadratic-count]");
const status = requireElement<HTMLOutputElement>("[data-kp-quadratic-status]");
const share = requireElement<HTMLAnchorElement>("[data-kp-quadratic-share]");
const branches = requireElement<HTMLElement>("[data-kp-quadratic-branches]");
const solution = requireElement<HTMLElement>("[data-kp-quadratic-solution]");
const graph = requireElement<SVGElement>("[data-kp-quadratic-graph]");
const methodButtons = [
  ...stage.querySelectorAll<HTMLButtonElement>("[data-kp-quadratic-method]")
];
const beatElements = [
  ...story.querySelectorAll<HTMLElement>("[data-kp-beat]")
];
let methodId: KpQuadraticMethodId = parseKpQuadraticReaderMethod(
  new URL(window.location.href).searchParams.get("kpMethod")
);
let current = createKpReaderClockSample({
  source: "initial",
  progress: progressFromUrl(),
  sequence: 0
});
let sequence = 0;
let scrollEngaged = false;
let preserveExplicitProgress = new URL(window.location.href).searchParams.has("kpProgress");

const scrollClock = createKpReaderContinuousScrollClock({
  id: "clock.reader.quadratic-branching.shared",
  geometry: scrollGeometry(),
  initialPositionPx: readerPosition(),
  checkpoints: kpQuadraticReaderCheckpoints
});

function render(sample: KpReaderClockSample): void {
  current = sample;
  const synchronized = sampleKpQuadraticEquationGraphFrame({
    progress: sample.progress,
    methodId,
    direction: sample.direction
  });
  const frame = synchronized.equation;
  body.dataset["kpReaderProgress"] = String(frame.progressPermille);
  body.dataset["kpReaderResponsiveProjection"] = resolveKpReaderResponsiveProjection({
    viewportWidth: window.innerWidth,
    attentionAvailable: true
  });
  stage.dataset["kpMethod"] = kpQuadraticReaderMethodQueryValue(methodId);
  stage.dataset["kpPhase"] = frame.phase;
  stage.dataset["kpCheckpoint"] = frame.checkpointId;
  stage.dataset["kpClockId"] = scrollClock.id;
  stage.dataset["kpClockSource"] = sample.source;
  stage.dataset["kpDirection"] = sample.direction;
  stage.dataset["kpGraphProgress"] = String(synchronized.graphLocalProgress);
  graph.dataset["kpSharedClockId"] = synchronized.sharedClockId;
  progress.value = String(frame.progressPermille);
  progress.setAttribute("aria-valuetext", `${frame.checkpointLabel}, ${Math.round(frame.progress * 100)} percent`);
  status.value = frame.checkpointLabel;
  count.value = `${frame.checkpointLabel}, ${Math.round(frame.progress * 100)} percent`;

  for (const equation of stage.querySelectorAll<HTMLElement>("[data-kp-equation-state]")) {
    equation.hidden = equation.dataset["kpEquationState"] !== frame.equationState.id ||
      branchesVisible(frame.progress) ||
      frame.solutionSetNative;
  }
  const showBranches = branchesVisible(frame.progress) && !frame.solutionSetNative;
  branches.hidden = !showBranches;
  solution.hidden = !frame.solutionSetNative;
  if (showBranches) renderBranches(frame.branchProgress);
  renderGraph(synchronized);

  methodButtons.forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset["kpQuadraticMethod"] === kpQuadraticReaderMethodQueryValue(methodId))
    );
  });
  const checkpointIndex = kpQuadraticReaderCheckpoints.findIndex(
    ({ id }) => id === frame.checkpointId
  );
  previous.disabled = checkpointIndex <= 0;
  next.disabled = checkpointIndex >= kpQuadraticReaderCheckpoints.length - 1;
  activateBeat(frame.beatId);
  updateUrl();
}

function renderGraph(
  synchronized: ReturnType<typeof sampleKpQuadraticEquationGraphFrame>
): void {
  const axes = requireElement<SVGGElement>(".kp-quadratic-graph__axes");
  const grid = requireElement<SVGGElement>(".kp-quadratic-graph__grid");
  const curve = requireElement<SVGPolylineElement>(".kp-quadratic-graph__curve");
  axes.style.opacity = String(synchronized.graph.axesOpacity);
  grid.style.opacity = String(synchronized.graph.axesOpacity);
  curve.style.strokeDasharray = "1";
  curve.style.strokeDashoffset = String(1 - synchronized.graph.curveReveal);
  synchronized.correspondences.forEach((binding, index) => {
    const root = requireElement<SVGGElement>(
      `[data-kp-selector-id="${binding.graphSelectorId}"]`
    );
    const rootFrame = synchronized.graph.roots[index]!;
    root.style.opacity = String(rootFrame.opacity);
    root.dataset["kpSourceBranch"] = binding.branchId;
    root.dataset["kpCorrespondenceId"] = binding.id;
    const label = root.querySelector<SVGTextElement>("text");
    if (label !== null) label.style.opacity = String(rootFrame.labelOpacity);
    const branch = requireElement<HTMLElement>(
      `[data-kp-branch="${binding.branchSign}"]`
    );
    branch.dataset["kpSemanticId"] = binding.branchId;
    branch.dataset["kpGraphSelector"] = binding.graphSelectorId;
  });
  solution.dataset["kpGraphCorrespondenceStatus"] =
    synchronized.graphLocalProgress === 1 ? "settled" : "pending";
}

function renderBranches(branchProgress: number): void {
  const choreography = createKpQuadraticBranchChoreography(methodId);
  const frame = sampleKpQuadraticBranchChoreography({
    choreography,
    progress: branchProgress,
    direction: "forward"
  });
  const separation = window.innerWidth >= 881
    ? choreography.responsiveSeparation.wide
    : choreography.responsiveSeparation.narrow;
  const minus = requireElement<HTMLElement>('[data-kp-branch="minus"]');
  const plus = requireElement<HTMLElement>('[data-kp-branch="plus"]');
  if (frame.stage === "fission") {
    const targets = frame.motion.targets;
    applyBranch(minus, targets[0]?.opacity ?? 0, targets[0]?.scale ?? 1, separation * (1 - (targets[0]?.pathProgress ?? 0)));
    applyBranch(plus, targets[1]?.opacity ?? 0, targets[1]?.scale ?? 1, -separation * (1 - (targets[1]?.pathProgress ?? 0)));
  } else {
    const sources = frame.motion.sources;
    applyBranch(minus, sources[0]?.opacity ?? 0, sources[0]?.scale ?? 1, separation * (sources[0]?.pathProgress ?? 0));
    applyBranch(plus, sources[1]?.opacity ?? 0, sources[1]?.scale ?? 1, -separation * (sources[1]?.pathProgress ?? 0));
  }
  stage.dataset["kpBranchOwnerSide"] = frame.motion.ownership.ownerSide;
  stage.dataset["kpBranchPlan"] = frame.motion.planId;
}

function applyBranch(
  element: HTMLElement,
  opacity: number,
  scale: number,
  translateX: number
): void {
  element.style.opacity = String(opacity);
  element.style.transform = `translateX(${translateX}px) scale(${scale})`;
}

function activateBeat(beatId: string): void {
  beatElements.forEach((beat) => {
    const active = beat.dataset["kpBeat"] === beatId;
    if (active) beat.setAttribute("aria-current", "step");
    else beat.removeAttribute("aria-current");
  });
  const toc = document.querySelector<HTMLElement>(".kp-lesson-toc");
  if (toc === null) return;
  toc.dataset["kpTocActiveId"] = beatId;
  toc.querySelectorAll<HTMLAnchorElement>("a[href^='#']").forEach((link) => {
    const active = link.getAttribute("href") === `#${beatId}`;
    link.dataset["kpTocActive"] = String(active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

function setControlProgress(progressPermille: number): void {
  preserveExplicitProgress = true;
  sequence += 1;
  render(createKpReaderClockSample({
    source: "controls",
    progress: progressPermille / 1_000,
    previousProgress: current.progress,
    sequence
  }));
}

function adjacentCheckpoint(direction: -1 | 1): void {
  const active = [...kpQuadraticReaderCheckpoints]
    .reverse()
    .findIndex(({ progressPermille }) => progressPermille <= current.progressPermille);
  const currentIndex = kpQuadraticReaderCheckpoints.length - 1 - active;
  const target = kpQuadraticReaderCheckpoints[
    Math.min(kpQuadraticReaderCheckpoints.length - 1, Math.max(0, currentIndex + direction))
  ];
  if (target !== undefined) setControlProgress(target.progressPermille);
}

progress.addEventListener("input", () => setControlProgress(Number(progress.value)));
previous.addEventListener("click", () => adjacentCheckpoint(-1));
next.addEventListener("click", () => adjacentCheckpoint(1));
stage.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  adjacentCheckpoint(event.key === "ArrowLeft" ? -1 : 1);
});
methodButtons.forEach((button) => button.addEventListener("click", () => {
  methodId = parseKpQuadraticReaderMethod(button.dataset["kpQuadraticMethod"]);
  render(current);
}));

window.addEventListener("wheel", () => {
  preserveExplicitProgress = false;
}, { passive: true });
window.addEventListener("touchstart", () => {
  preserveExplicitProgress = false;
}, { passive: true });
window.addEventListener("scroll", () => {
  if (preserveExplicitProgress) return;
  scrollEngaged = true;
  render(scrollClock.samplePosition(readerPosition()));
}, { passive: true });
window.addEventListener("resize", () => {
  scrollClock.updateGeometry(scrollGeometry());
  render(scrollEngaged
    ? scrollClock.samplePosition(readerPosition())
    : current);
});
window.addEventListener("pagehide", () => scrollClock.dispose(), { once: true });

function updateUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.set("kpLesson", "lesson.algebra.quadratic-branching");
  url.searchParams.set("kpVersion", "1");
  url.searchParams.set("kpProgress", String(current.progressPermille));
  url.searchParams.set("kpMethod", kpQuadraticReaderMethodQueryValue(methodId));
  history.replaceState(null, "", url);
  share.href = url.toString();
}

function progressFromUrl(): number {
  const value = Number(new URL(window.location.href).searchParams.get("kpProgress") ?? "0");
  return Number.isInteger(value) && value >= 0 && value <= 1_000 ? value / 1_000 : 0;
}

function scrollGeometry(): { readonly startPx: number; readonly endPx: number } {
  const first = beatElements[0];
  const last = beatElements.at(-1);
  if (first === undefined || last === undefined) {
    return { startPx: 0, endPx: 1 };
  }
  const startPx = first.offsetTop;
  return { startPx, endPx: Math.max(startPx + 1, last.offsetTop + last.offsetHeight) };
}

function readerPosition(): number {
  return window.scrollY + window.innerHeight * 0.52;
}

function branchesVisible(value: number): boolean {
  return value >= 0.58 && value < 0.8;
}

function requireElement<TElement extends Element>(selector: string): TElement {
  const element = document.querySelector<TElement>(selector);
  if (element === null) throw new Error(`Missing quadratic reader element ${selector}.`);
  return element;
}

void document.fonts.ready.then(() => {
  body.dataset["kpReaderFontReady"] = "true";
});
body.dataset["kpReaderHydrated"] = "true";
body.dataset["kpDevReviewReady"] = "true";
render(current);
