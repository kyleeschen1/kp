import "katex/dist/katex.min.css";

import {
  createKpQuadraticBranchChoreography,
  sampleKpQuadraticBranchChoreography
} from "../../animation/quadratic-branch-choreography.ts";
import { sampleKpFissionFusion } from "../../animation/fission-fusion.ts";
import type {
  KpReaderDevReviewFrame
} from "../../dev-review/reader-capture-provider.ts";
import {
  createKpEquationFontReadiness
} from "../../rendering/equation-font-readiness.ts";
import {
  createKpReaderClockSample,
  createKpReaderContinuousScrollClock,
  parseKpReaderMotionPreference,
  projectKpReaderMotion,
  resolveKpReaderMotionPolicy,
  resolveKpReaderResponsiveProjection,
  type KpReaderClockSample
} from "../runtime/public-api.ts";
import {
  kpQuadraticReaderCheckpoints,
  kpQuadraticReaderMethodQueryValue,
  parseKpQuadraticReaderMethod,
  projectKpQuadraticReaderSurface,
  type KpQuadraticReaderSurfaceFrame
} from "./quadratic-branching-surface.ts";
import type { KpQuadraticMethodId } from "../../semantic/quadratic-solution-method-graph.ts";
import {
  sampleKpQuadraticEquationGraphFrame
} from "../../projections/quadratic-equation-graph-sync.ts";
import { mountKpReaderDevelopmentReview } from "./development-review-loader.ts";
import { createKpReaderFontReviewLifecycle } from "./reader-font-review-lifecycle.ts";
import {
  createKpQuadraticCausalDrillDownBundle
} from "../../animation/quadratic-causal-drilldown.ts";

const documentId = "lesson.algebra.quadratic-branching";
const documentVersion = "1";
const assetId = "animation.algebra.quadratic.solution-branching";
const presentationCertificateIds = [
  "certificate.reader.quadratic.completing-square",
  "certificate.reader.quadratic.formula"
] as const;
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
const motionSelect = requireElement<HTMLSelectElement>("[data-kp-quadratic-motion]");
const narration = requireElement<HTMLElement>("[data-kp-quadratic-narration]");
const showSteps = requireElement<HTMLButtonElement>("[data-kp-quadratic-show-steps]");
const drillDown = requireElement<HTMLElement>("[data-kp-quadratic-drilldown]");
const closeSteps = requireElement<HTMLButtonElement>("[data-kp-quadratic-close-steps]");
const drillProgress = requireElement<HTMLInputElement>(
  "[data-kp-quadratic-drilldown-progress]"
);
const drillStatus = requireElement<HTMLOutputElement>(
  "[data-kp-quadratic-drilldown-status]"
);
const methodButtons = [
  ...stage.querySelectorAll<HTMLButtonElement>("[data-kp-quadratic-method]")
];
const beatElements = [
  ...story.querySelectorAll<HTMLElement>("[data-kp-beat]")
];
let methodId: KpQuadraticMethodId = parseKpQuadraticReaderMethod(
  new URL(window.location.href).searchParams.get("kpMethod")
);
let motionPreference = motionPreferenceFromUrl();
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let current = createKpReaderClockSample({
  source: "initial",
  progress: progressFromUrl(),
  sequence: 0
});
let sequence = 0;
let scrollEngaged = false;
let preserveExplicitProgress = new URL(window.location.href).searchParams.has("kpProgress");
let layoutRevision = 0;
let layoutReadCount = 0;
let captureRevision = 0;
let previousReviewFrameAtMs: number | undefined;
let previousReviewScrollY = window.scrollY;
let pausedParent: KpReaderClockSample | undefined;
let activeDrillDown:
  | ReturnType<typeof createKpQuadraticCausalDrillDownBundle>
  | undefined;
const fontReadiness = createKpEquationFontReadiness(document);

const scrollClock = createKpReaderContinuousScrollClock({
  id: "clock.reader.quadratic-branching.shared",
  geometry: scrollGeometry(),
  initialPositionPx: readerPosition(),
  checkpoints: kpQuadraticReaderCheckpoints
});

function render(sample: KpReaderClockSample): void {
  const motionPolicy = resolveKpReaderMotionPolicy({
    preference: motionPreference,
    systemReducedMotion: reducedMotion.matches
  });
  const motion = projectKpReaderMotion({
    clock: sample,
    checkpoints: kpQuadraticReaderCheckpoints,
    policy: motionPolicy
  });
  current = {
    ...sample,
    progress: motion.progress,
    progressPermille: motion.progressPermille,
    checkpointId: motion.checkpointId
  };
  const synchronized = sampleKpQuadraticEquationGraphFrame({
    progress: current.progress,
    methodId,
    direction: current.direction
  });
  const frame = synchronized.equation;
  body.dataset["kpReaderProgress"] = String(frame.progressPermille);
  body.dataset["kpReaderMotionMode"] = motionPolicy.resolvedMode;
  body.dataset["kpReaderResponsiveProjection"] = resolveKpReaderResponsiveProjection({
    viewportWidth: window.innerWidth,
    attentionAvailable: true
  });
  stage.dataset["kpMethod"] = kpQuadraticReaderMethodQueryValue(methodId);
  stage.dataset["kpPhase"] = frame.phase;
  stage.dataset["kpCheckpoint"] = frame.checkpointId;
  stage.dataset["kpClockId"] = scrollClock.id;
  stage.dataset["kpClockSource"] = current.source;
  stage.dataset["kpDirection"] = current.direction;
  stage.dataset["kpMotionSampling"] = motionPolicy.sampling;
  stage.dataset["kpGraphProgress"] = String(synchronized.graphLocalProgress);
  stage.dataset["kpPresentationCertification"] =
    "certification.reader.quadratic-native-katex.v1";
  stage.dataset["kpPresentationCertificateIds"] =
    presentationCertificateIds.join(" ");
  stage.dataset["kpGenericFallback"] = "forbidden";
  if (pausedParent === undefined) {
    stage.dataset["kpCausalPresentation"] = "compressed-context";
    delete stage.dataset["kpNestedClockId"];
  }
  graph.dataset["kpSharedClockId"] = synchronized.sharedClockId;
  reflectPresentationGate(frame, synchronized.graphLocalProgress);
  progress.value = String(frame.progressPermille);
  progress.setAttribute("aria-valuetext", `${frame.checkpointLabel}, ${Math.round(frame.progress * 100)} percent`);
  status.value = frame.checkpointLabel;
  count.value = `${frame.checkpointLabel}, ${Math.round(frame.progress * 100)} percent`;
  narration.textContent = narrationFor(frame);
  motionSelect.value = motionPreference;
  motionSelect.disabled = pausedParent !== undefined;

  renderEquations(frame, motionPolicy.resolvedMode);
  if (activeDrillDown !== undefined) {
    renderDrillDown(Number(drillProgress.value) / 1_000);
  }
  const showBranches = branchesVisible(frame.progress) ||
    (frame.phase === "graph" &&
      synchronized.graph.roots.some(({ opacity }) => opacity < 0.5));
  branches.hidden = !showBranches;
  // Semantic solution-set authority remains in the compiled transcript and
  // frame model; presentation now moves branches straight into graph roots.
  solution.hidden = true;
  renderGraph(synchronized);
  if (showBranches) renderBranches(frame.branchProgress, synchronized);

  methodButtons.forEach((button) => {
    button.disabled = pausedParent !== undefined;
    button.setAttribute(
      "aria-pressed",
      String(button.dataset["kpQuadraticMethod"] === kpQuadraticReaderMethodQueryValue(methodId))
    );
  });
  const checkpointIndex = kpQuadraticReaderCheckpoints.findIndex(
    ({ id }) => id === frame.checkpointId
  );
  previous.disabled = pausedParent !== undefined || checkpointIndex <= 0;
  next.disabled = pausedParent !== undefined ||
    checkpointIndex >= kpQuadraticReaderCheckpoints.length - 1;
  showSteps.disabled = pausedParent !== undefined || frame.phase !== "method";
  activateBeat(frame.beatId);
  updateUrl();
  dispatchDevReviewFrame({
    frame,
    synchronized,
    motionMode: motionPolicy.resolvedMode,
    motionSampling: motionPolicy.sampling
  });
}

function openStepDrillDown(): void {
  if (pausedParent !== undefined || current.progress < 0.1 || current.progress >= 0.58) {
    return;
  }
  const parentProgress = Math.min(
    1,
    Math.max(0, (current.progress - 0.1) / 0.48)
  );
  pausedParent = current;
  activeDrillDown = createKpQuadraticCausalDrillDownBundle({
    methodId,
    parentProgress
  });
  drillDown.hidden = false;
  showSteps.setAttribute("aria-expanded", "true");
  showSteps.disabled = true;
  stage.dataset["kpCausalPresentation"] = "full-detail";
  stage.dataset["kpNestedClockId"] = activeDrillDown.drillDown.childPlanId;
  stage.dataset["kpPausedParentProgress"] = String(current.progressPermille);
  progress.disabled = true;
  previous.disabled = true;
  next.disabled = true;
  motionSelect.disabled = true;
  methodButtons.forEach((button) => {
    button.disabled = true;
  });
  drillProgress.value = String(Math.round(parentProgress * 1_000));
  renderDrillDown(parentProgress);
  closeSteps.focus();
}

function renderDrillDown(childProgress: number): void {
  if (activeDrillDown === undefined) return;
  const normalized = Math.min(1, Math.max(0, childProgress));
  const frame = projectKpQuadraticReaderSurface({
    progress: Math.min(0.579999, 0.1 + 0.48 * normalized),
    methodId
  });
  reflectPresentationGate(frame, 0);
  renderEquations(frame, "full");
  const index = Math.min(
    activeDrillDown.full.segments.length - 1,
    Math.floor(normalized * activeDrillDown.full.segments.length)
  );
  const segment = activeDrillDown.full.segments[index]!;
  drillStatus.value =
    `Step ${index + 1} of ${activeDrillDown.full.segments.length}: ${segment.canonicalOperationId}`;
  drillProgress.setAttribute(
    "aria-valuetext",
    `Step ${index + 1} of ${activeDrillDown.full.segments.length}`
  );
  stage.dataset["kpDrilldownActionId"] = segment.actionId;
  stage.dataset["kpDrilldownProgress"] = String(Math.round(normalized * 1_000));
}

function closeStepDrillDown(): void {
  if (pausedParent === undefined) return;
  const restore = pausedParent;
  pausedParent = undefined;
  activeDrillDown = undefined;
  drillDown.hidden = true;
  showSteps.setAttribute("aria-expanded", "false");
  progress.disabled = false;
  motionSelect.disabled = false;
  methodButtons.forEach((button) => {
    button.disabled = false;
  });
  delete stage.dataset["kpPausedParentProgress"];
  delete stage.dataset["kpDrilldownActionId"];
  delete stage.dataset["kpDrilldownProgress"];
  render(restore);
  showSteps.focus();
}

function renderEquations(
  frame: KpQuadraticReaderSurfaceFrame,
  motionMode: "full" | "essential" | "static"
): void {
  const equations = [
    ...stage.querySelectorAll<HTMLElement>("[data-kp-equation-state]")
  ];
  resetEquationPresentation(equations);
  if (branchesVisible(frame.progress) ||
      frame.solutionSetSemanticallyComplete) {
    if (branchOriginOwnsMaterial(frame)) {
      showNativeEquation(equations, frame.equationState.id);
    }
    stage.dataset["kpSymbolicTransition"] = "none";
    stage.dataset["kpSymbolicMotionOwners"] = "0";
    return;
  }
  const sampled = frame.equationTransition;
  if (sampled === undefined || motionMode !== "full") {
    showNativeEquation(equations, frame.equationState.id);
    stage.dataset["kpSymbolicTransition"] =
      sampled?.transition.id ?? "native";
    stage.dataset["kpSymbolicTransitionProgress"] =
      sampled === undefined ? "0" : String(sampled.progress);
    stage.dataset["kpSymbolicMotionOwners"] = "0";
    return;
  }

  const source = equationElement(sampled.sourceState.id);
  const target = equationElement(sampled.targetState.id);
  const progress = smoothstep(sampled.progress);
  if (progress <= 0.001) {
    showNativeEquation(equations, sampled.sourceState.id);
  } else if (progress >= 0.999) {
    showNativeEquation(equations, sampled.targetState.id);
  } else {
    source.hidden = false;
    target.hidden = false;
    source.dataset["kpTransitionLayer"] = "source";
    target.dataset["kpTransitionLayer"] = "target";
    // Differently shaped equations become illegible when both complete KaTeX
    // trees ghost through each other. The measured tokens meet at one shared
    // position, then ownership switches while their geometry keeps moving.
    source.style.opacity = progress <= 0.5 ? "1" : "0";
    target.style.opacity = progress <= 0.5 ? "0" : "1";
    renderCorrespondenceMotion({
      source,
      target,
      progress,
      correspondence: sampled.transition.correspondence
    });
  }
  stage.dataset["kpSymbolicTransition"] = sampled.transition.id;
  stage.dataset["kpSymbolicTransitionProgress"] = String(sampled.progress);
  stage.dataset["kpSymbolicMotionOwners"] = String(
    sampled.transition.correspondence.length
  );
  stage.dataset["kpSymbolicFocalOwners"] = String(
    sampled.transition.correspondence.filter(
      ({ presentationRole }) =>
        (presentationRole ?? "focal-operand") === "focal-operand"
    ).length
  );
}

function reflectPresentationGate(
  frame: KpQuadraticReaderSurfaceFrame,
  graphLocalProgress: number
): void {
  const transition = frame.equationTransition;
  if (transition !== undefined) {
    const presentation = transition.transition.presentation;
    if (presentation === undefined) {
      throw new Error(
        `Playable quadratic transition ${transition.transition.id} cannot use generic fallback.`
      );
    }
    stage.dataset["kpOperationRef"] = presentation.operationRef;
    stage.dataset["kpPresentationPhaseGate"] =
      transition.progress < presentation.actStart
        ? "reflow"
        : transition.progress < 0.999
          ? "act"
          : "native-settlement";
    return;
  }
  if (frame.phase === "branch") {
    stage.dataset["kpOperationRef"] = "operation.quadratic.split-plus-minus";
    stage.dataset["kpPresentationPhaseGate"] = "branch-split";
    return;
  }
  if (frame.phase === "graph" && graphLocalProgress < 1) {
    stage.dataset["kpOperationRef"] = "operation.quadratic.branch-to-graph";
    stage.dataset["kpPresentationPhaseGate"] = "branch-to-graph";
    return;
  }
  stage.dataset["kpOperationRef"] = "none";
  stage.dataset["kpPresentationPhaseGate"] = "native-settlement";
}

function branchOriginOwnsMaterial(
  frame: KpQuadraticReaderSurfaceFrame
): boolean {
  if (frame.phase !== "branch") return false;
  const sampled = sampleKpQuadraticBranchChoreography({
    choreography: createKpQuadraticBranchChoreography(methodId),
    progress: frame.branchProgress,
    direction: "forward"
  });
  return sampled.stage === "fission" &&
    sampled.motion.ownership.ownerSide === "sources";
}

function renderCorrespondenceMotion(input: {
  readonly source: HTMLElement;
  readonly target: HTMLElement;
  readonly progress: number;
  readonly correspondence: NonNullable<
    KpQuadraticReaderSurfaceFrame["equationTransition"]
  >["transition"]["correspondence"];
}): void {
  const matchedSource = new Set<string>();
  const matchedTarget = new Set<string>();
  input.correspondence.forEach((binding, index) => {
    const sourceToken = motionToken(input.source, binding.sourceSelectorId);
    const targetToken = motionToken(input.target, binding.targetSelectorId);
    const sourceRect = sourceToken.getBoundingClientRect();
    const targetRect = targetToken.getBoundingClientRect();
    layoutReadCount += 2;
    const deltaX =
      targetRect.left + targetRect.width / 2 -
      (sourceRect.left + sourceRect.width / 2);
    const deltaY =
      targetRect.top + targetRect.height / 2 -
      (sourceRect.top + sourceRect.height / 2);
    const presentationRole = binding.presentationRole ?? "focal-operand";
    const localProgress = presentationRole === "continuant"
      ? smoothstep(Math.min(1, input.progress / 0.36))
      : smoothstep(Math.max(0, (input.progress - 0.3) / 0.7));
    const laneDirection = index % 2 === 0 ? -1 : 1;
    const lane = presentationRole === "merged"
      ? laneDirection * (18 + index % 3 * 3)
      : presentationRole !== "continuant" &&
          presentationRole !== "structural"
        ? laneDirection * (4 + index % 3 * 2)
        : 0;
    const arc = Math.sin(Math.PI * localProgress) * lane;
    sourceToken.style.transform =
      `translate3d(${deltaX * localProgress}px, ${deltaY * localProgress + arc}px, 0)`;
    targetToken.style.transform =
      `translate3d(${-deltaX * (1 - localProgress)}px, ${-deltaY * (1 - localProgress) + arc}px, 0)`;
    sourceToken.dataset["kpSymbolicMotionRole"] = presentationRole;
    targetToken.dataset["kpSymbolicMotionRole"] = presentationRole;
    matchedSource.add(binding.sourceSelectorId);
    matchedTarget.add(binding.targetSelectorId);
  });
  for (const token of motionTokens(input.source)) {
    const id = token.dataset["kpMotionId"];
    if (id !== undefined && matchedSource.has(id)) continue;
    token.style.transform =
      `translate3d(0, ${-8 * input.progress}px, 0) scale(${1 - 0.06 * input.progress})`;
  }
  for (const token of motionTokens(input.target)) {
    const id = token.dataset["kpMotionId"];
    if (id !== undefined && matchedTarget.has(id)) continue;
    token.style.transform =
      `translate3d(0, ${8 * (1 - input.progress)}px, 0) scale(${0.94 + 0.06 * input.progress})`;
  }
}

function resetEquationPresentation(equations: readonly HTMLElement[]): void {
  for (const equation of equations) {
    equation.hidden = true;
    equation.style.removeProperty("opacity");
    delete equation.dataset["kpTransitionLayer"];
    for (const token of motionTokens(equation)) {
      token.style.removeProperty("transform");
      delete token.dataset["kpSymbolicMotionRole"];
    }
  }
}

function showNativeEquation(
  equations: readonly HTMLElement[],
  stateId: string
): void {
  const equation = equations.find(
    (candidate) => candidate.dataset["kpEquationState"] === stateId
  );
  if (equation === undefined) {
    throw new Error(`Missing native quadratic equation state ${stateId}.`);
  }
  equation.hidden = false;
}

function equationElement(stateId: string): HTMLElement {
  return requireElement<HTMLElement>(
    `[data-kp-equation-state="${CSS.escape(stateId)}"]`
  );
}

function motionToken(root: HTMLElement, motionId: string): HTMLElement {
  const token = root.querySelector<HTMLElement>(
    `[data-kp-motion-id="${CSS.escape(motionId)}"]`
  );
  if (token === null) {
    throw new Error(`Missing quadratic motion token ${motionId}.`);
  }
  return token;
}

function motionTokens(root: HTMLElement): readonly HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>("[data-kp-motion-id]")];
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
    const graphOwnsRoot = synchronized.equation.phase === "graph" &&
      rootFrame.opacity >= 0.5;
    root.style.opacity = String(graphOwnsRoot ? 1 : 0);
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

function renderBranches(
  branchProgress: number,
  synchronized: ReturnType<typeof sampleKpQuadraticEquationGraphFrame>
): void {
  const choreography = createKpQuadraticBranchChoreography(methodId);
  const motion = sampleKpFissionFusion({
    plan: choreography.fission,
    // The presentation holds the exact signed branches after fission. The
    // semantic native reunion remains available but is not visibly staged.
    progress: Math.min(1, branchProgress / 0.55)
  });
  const separation = window.innerWidth >= 881
    ? choreography.responsiveSeparation.wide
    : choreography.responsiveSeparation.narrow;
  const minus = requireElement<HTMLElement>('[data-kp-branch="minus"]');
  const plus = requireElement<HTMLElement>('[data-kp-branch="plus"]');
  const showCandidates =
    methodId === "method.quadratic.completing-square" &&
    branchProgress < 0.42;
  for (const candidate of branches.querySelectorAll<HTMLElement>(
    "[data-kp-branch-candidate]"
  )) {
    candidate.hidden = !showCandidates;
  }
  for (const result of branches.querySelectorAll<HTMLElement>(
    "[data-kp-branch-result]"
  )) {
    result.hidden = showCandidates;
  }
  const targets = motion.targets;
  applyBranch(minus, targets[0]?.opacity ?? 0, targets[0]?.scale ?? 1, separation * (1 - (targets[0]?.pathProgress ?? 0)));
  applyBranch(plus, targets[1]?.opacity ?? 0, targets[1]?.scale ?? 1, -separation * (1 - (targets[1]?.pathProgress ?? 0)));
  if (synchronized.equation.phase === "graph") {
    renderBranchGraphHandoff(synchronized);
  }
  stage.dataset["kpBranchOwnerSide"] = motion.ownership.ownerSide;
  stage.dataset["kpBranchPlan"] = motion.planId;
}

function renderBranchGraphHandoff(
  synchronized: ReturnType<typeof sampleKpQuadraticEquationGraphFrame>
): void {
  synchronized.correspondences.forEach((binding, index) => {
    const branch = requireElement<HTMLElement>(
      `[data-kp-branch="${binding.branchSign}"]`
    );
    const root = requireElement<SVGGElement>(
      `[data-kp-selector-id="${binding.graphSelectorId}"]`
    );
    const rootFrame = synchronized.graph.roots[index]!;
    const transferProgress = Math.min(1, rootFrame.opacity / 0.5);
    const branchRect = branch.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    layoutReadCount += 2;
    const deltaX =
      rootRect.left + rootRect.width / 2 -
      (branchRect.left + branchRect.width / 2);
    const deltaY =
      rootRect.top + rootRect.height / 2 -
      (branchRect.top + branchRect.height / 2);
    branch.style.opacity = rootFrame.opacity < 0.5 ? "1" : "0";
    branch.style.transform =
      `translate3d(${deltaX * transferProgress}px, ${deltaY * transferProgress}px, 0)`;
    branch.dataset["kpGraphHandoff"] = rootFrame.opacity < 0.5
      ? "branch-owner"
      : "graph-owner";
  });
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

function smoothstep(progress: number): number {
  return progress * progress * (3 - 2 * progress);
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

progress.addEventListener("input", () => {
  if (pausedParent === undefined) setControlProgress(Number(progress.value));
});
previous.addEventListener("click", () => adjacentCheckpoint(-1));
next.addEventListener("click", () => adjacentCheckpoint(1));
showSteps.addEventListener("click", openStepDrillDown);
closeSteps.addEventListener("click", closeStepDrillDown);
drillProgress.addEventListener("input", () => {
  renderDrillDown(Number(drillProgress.value) / 1_000);
});
stage.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && pausedParent !== undefined) {
    event.preventDefault();
    closeStepDrillDown();
    return;
  }
  if (pausedParent !== undefined) return;
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  if (event.key === "Home") setControlProgress(0);
  else if (event.key === "End") setControlProgress(1_000);
  else adjacentCheckpoint(event.key === "ArrowLeft" ? -1 : 1);
});
methodButtons.forEach((button) => button.addEventListener("click", () => {
  if (pausedParent !== undefined) return;
  methodId = parseKpQuadraticReaderMethod(button.dataset["kpQuadraticMethod"]);
  render(current);
}));
motionSelect.addEventListener("change", () => {
  if (pausedParent !== undefined) return;
  motionPreference = parseKpReaderMotionPreference(motionSelect.value) ?? "system";
  render(current);
});

window.addEventListener("wheel", () => {
  preserveExplicitProgress = false;
}, { passive: true });
window.addEventListener("touchstart", () => {
  preserveExplicitProgress = false;
}, { passive: true });
window.addEventListener("scroll", () => {
  if (preserveExplicitProgress || pausedParent !== undefined) return;
  scrollEngaged = true;
  render(scrollClock.samplePosition(readerPosition()));
}, { passive: true });
window.addEventListener("resize", () => {
  invalidateLayout("resize");
  scrollClock.updateGeometry(scrollGeometry());
  render(scrollEngaged
    ? scrollClock.samplePosition(readerPosition())
    : current);
});
reducedMotion.addEventListener("change", () => render(current));
const fontReviewLifecycle = createKpReaderFontReviewLifecycle({
  readiness: fontReadiness,
  ownerDocument: document,
  ownerWindow: window,
  developmentReviewMount: mountKpReaderDevelopmentReview,
  reviewMount: "immediate",
  reflectFontReadyOnBody: true,
  renderReviewFrame: () => {
    captureRevision += 1;
    stage.dataset["kpCaptureRevision"] = String(captureRevision);
    render(current);
  },
  onFontInvalidated: () => {
    invalidateLayout("font");
    render(current);
  },
  onReady: () => {
    invalidateLayout("font");
    render(current);
  }
});
window.addEventListener("pagehide", () => {
  scrollClock.dispose();
  fontReviewLifecycle.dispose();
}, { once: true });

function updateUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.set("kpLesson", "lesson.algebra.quadratic-branching");
  url.searchParams.set("kpVersion", "1");
  url.searchParams.set("kpProgress", String(current.progressPermille));
  url.searchParams.set("kpMethod", kpQuadraticReaderMethodQueryValue(methodId));
  url.searchParams.set("kpMotion", motionPreference);
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

function narrationFor(
  frame: ReturnType<typeof sampleKpQuadraticEquationGraphFrame>["equation"]
): string {
  if (frame.phase === "branch") {
    return `${frame.checkpointLabel}. The minus branch gives x equals two. The plus branch gives x equals three.`;
  }
  if (frame.phase === "graph") {
    return `${frame.checkpointLabel}. The complete solution set contains two and three, and the parabola crosses the x-axis at those roots.`;
  }
  return `${frame.checkpointLabel}. ${frame.equationState.spoken}.`;
}

function motionPreferenceFromUrl(): "system" | "reduced" | "full" | "static" {
  try {
    return parseKpReaderMotionPreference(
      new URL(window.location.href).searchParams.get("kpMotion")
    ) ?? "system";
  } catch {
    return "system";
  }
}

function invalidateLayout(reason: "resize" | "font"): void {
  layoutRevision += 1;
  stage.dataset["kpLayoutRevision"] = String(layoutRevision);
  stage.dataset["kpLayoutInvalidation"] = reason;
}

function dispatchDevReviewFrame(input: {
  readonly frame: KpQuadraticReaderSurfaceFrame;
  readonly synchronized: ReturnType<typeof sampleKpQuadraticEquationGraphFrame>;
  readonly motionMode: "full" | "essential" | "static";
  readonly motionSampling: string;
}): void {
  if (!import.meta.env.DEV) return;
  const atMs = performance.now();
  const ownerIds = activeOwnerIds(input.frame, input.synchronized);
  const activeTransformationIds = input.frame.equationTransition === undefined
    ? []
    : [input.frame.equationTransition.transition.id];
  const detail = {
    atMs,
    documentId,
    documentVersion,
    assetId,
    checkpointId: input.frame.checkpointId,
    progressPermille: input.frame.progressPermille,
    projectionId: "equation-graph.quadratic-branching",
    activeTransformationIds,
    activePhase: input.frame.phase,
    focusSource: "story",
    focusRefs: ownerIds,
    motionPreference,
    motionMode: input.motionMode,
    playbackDirection: current.direction,
    rendererId: "reader.quadratic.native-katex-svg",
    motionAuthority: `${current.source}:${input.motionSampling}`,
    fitStatus: quadraticFitStatus(),
    fitScale: 1,
    layoutRevision,
    layoutReadCount,
    fontRevision: fontReadiness.revision,
    fontReady: fontReadiness.status !== "waiting",
    ownerIds,
    ...(previousReviewFrameAtMs === undefined
      ? {}
      : { frameIntervalMs: atMs - previousReviewFrameAtMs }),
    scrollDeltaY: window.scrollY - previousReviewScrollY
  } satisfies KpReaderDevReviewFrame;
  window.dispatchEvent(new CustomEvent<KpReaderDevReviewFrame>(
    "kp:reader-dev-review-frame",
    { detail }
  ));
  previousReviewFrameAtMs = atMs;
  previousReviewScrollY = window.scrollY;
}

function activeOwnerIds(
  frame: KpQuadraticReaderSurfaceFrame,
  synchronized: ReturnType<typeof sampleKpQuadraticEquationGraphFrame>
): readonly string[] {
  if (frame.phase === "branch") return ["branch.minus", "branch.plus"];
  if (frame.phase === "graph") {
    return synchronized.correspondences.map((binding, index) =>
      synchronized.graph.roots[index]!.opacity < 0.5
        ? binding.branchId
        : binding.graphSelectorId
    );
  }
  if (frame.equationTransition !== undefined) {
    return [...new Set(frame.equationTransition.transition.correspondence.flatMap(
      ({ sourceSelectorId, targetSelectorId }) => [sourceSelectorId, targetSelectorId]
    ))];
  }
  return [frame.equationState.semanticStateId];
}

function quadraticFitStatus(): "contained" | "overflowing" {
  const tolerance = 1;
  return document.documentElement.scrollWidth <= window.innerWidth + tolerance &&
    stage.scrollWidth <= stage.clientWidth + tolerance
    ? "contained"
    : "overflowing";
}

function requireElement<TElement extends Element>(selector: string): TElement {
  const element = document.querySelector<TElement>(selector);
  if (element === null) throw new Error(`Missing quadratic reader element ${selector}.`);
  return element;
}

body.dataset["kpReaderHydrated"] = "true";
body.dataset["kpReaderDepth"] = "none";
render(current);
const initialQuery = new URL(window.location.href).searchParams;
if (initialQuery.get("kpSteps") === "full") {
  openStepDrillDown();
  const requestedChildProgress = Number(
    initialQuery.get("kpStepProgress") ?? String(drillProgress.value)
  );
  if (Number.isInteger(requestedChildProgress) &&
      requestedChildProgress >= 0 &&
      requestedChildProgress <= 1_000) {
    drillProgress.value = String(requestedChildProgress);
    renderDrillDown(requestedChildProgress / 1_000);
  }
}
void fontReviewLifecycle.ready;
