import {
  DEFAULT_EQUATION_ANIMATION_ID,
  findEquationAnimationCatalogEntry
} from "./equation-animation-catalog.ts";
import { measureAnnotatedEquationMotionTokens } from "../rendering/equation-motion-dom.ts";
import {
  applyMeasuredMotionDeltas,
  createEquationMotionPlan,
  type EasingName,
  type EquationMotionMeasuredDelta,
  type EquationMotionPlan,
  type MotionPose
} from "../rendering/equation-motion-plan.ts";
import { createEquationMotionPlayer } from "../rendering/equation-motion-player.ts";
import {
  createEquationCancelParticleRenderer,
  type EquationCancelParticleRenderer
} from "../rendering/equation-cancel-particles-webgl.ts";
import {
  createKatexArtifactSeedRevealRenderer,
  type KatexArtifactSeedRevealPlan,
  type KatexArtifactSeedRevealRenderer
} from "../rendering/katex-artifact-seed-reveal.ts";
import {
  createKatexTextureAtlas,
  measureKatexTextureCaptureRect
} from "../rendering/katex-texture-atlas.ts";
import type {
  KatexMotionToken,
  KatexTokenRect
} from "../rendering/katex-transition-types.ts";
import type {
  EquationMotionFrame,
  EquationMotionFrameToken
} from "../rendering/equation-motion-sampler.ts";
import {
  easedProgressBetweenSemanticBeat,
  findSemanticBeat,
  linearEquationDemoBeatTimeline,
  progressBetweenSemanticBeat,
  type SemanticBeatId
} from "../rendering/semantic-beat-compiler.ts";

const EQUATION_MOTION_ANIMATION_DURATION_MS = 1200;
const EQUATION_MOTION_MIN_DURATION_MS = 200;
const EQUATION_MOTION_MAX_DURATION_MS = 3000;
const EQUATION_MOTION_COLLAPSE_SCALE_PERCENT = 0;
const EQUATION_MOTION_MIN_COLLAPSE_SCALE_PERCENT = 0;
const EQUATION_MOTION_MAX_COLLAPSE_SCALE_PERCENT = 50;
const EQUATION_MOTION_BEAT_TIMELINE = linearEquationDemoBeatTimeline;
const EQUATION_MOTION_ENTER_INITIAL_SCALE = 0.82;
const EQUATION_MOTION_DEMO_BEAT_LABEL_COUNT = 50;
const EQUATION_MOTION_ARTIFACT_DOM_ENDPOINT_WINDOW = 0.04;
const activeAnimations = new WeakMap<HTMLElement, ActiveEquationMotionAnimation>();
const pausedAnimations = new WeakMap<HTMLElement, PausedEquationMotionAnimation>();
const activeRenderContexts = new WeakMap<HTMLElement, EquationMotionRenderContext>();
const artifactSeedRevealContexts = new WeakMap<
  HTMLElement,
  EquationArtifactSeedRevealContext
>();
const cancellationParticleRenderers = new WeakMap<
  HTMLCanvasElement,
  EquationCancelParticleRenderer
>();

interface EquationMotionRenderContext {
  readonly key: string;
  readonly planSourceStep: number;
  readonly planTargetStep: number;
  readonly planSourceState: HTMLElement;
  readonly planTargetState: HTMLElement;
  readonly planSourceTokens: ReadonlyMap<string, StableMotionToken>;
  readonly planTargetTokens: ReadonlyMap<string, StableMotionToken>;
}

interface StableMotionToken {
  readonly motionId: string;
  readonly text: string;
  readonly element: HTMLElement;
  readonly localRect: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
}

interface MotionPoint {
  readonly x: number;
  readonly y: number;
}

interface CollapseMotionGeometry {
  readonly midpoint: MotionPoint;
  readonly maxDistance: number;
}

interface CancellationMotionGroup {
  readonly tokenIds: ReadonlySet<string>;
  readonly midpoint: MotionPoint;
  readonly maxDistance: number;
  readonly particleCount: number;
}

interface FinalSimplifyMotionGroup {
  readonly sourceTokenIds: ReadonlySet<string>;
  readonly targetTokenId: string;
  readonly midpoint: MotionPoint;
  readonly maxDistance: number;
}

interface EquationArtifactSeedRevealContext {
  readonly key: string;
  readonly sourceMotionId: string;
  readonly targetMotionId: string;
  readonly canvas: HTMLCanvasElement;
  rendererPromise: Promise<KatexArtifactSeedRevealRenderer | undefined>;
  renderer: KatexArtifactSeedRevealRenderer | undefined;
  disposed: boolean;
  lastProgress: number;
}

interface ActiveEquationMotionAnimation {
  animationFrameId: number;
  readonly sourceStep: number;
  readonly targetStep: number;
  readonly targetProgress: number;
  readonly durationMs: number;
  currentProgress: number;
}

interface PausedEquationMotionAnimation {
  readonly sourceStep: number;
  readonly targetStep: number;
  readonly currentProgress: number;
  readonly targetProgress: number;
  readonly durationMs: number;
}

export function hydrateEquationMotionDemos(root: ParentNode): void {
  root
    .querySelectorAll<HTMLElement>("[data-kp-equation-motion-demo]")
    .forEach((demo) => {
      syncEquationMotionActiveState(demo, readEquationMotionStep(demo));
      syncEquationMotionDurationControl(
        demo,
        readEquationMotionDurationMs(demo)
      );
      syncEquationMotionCollapseScaleControl(
        demo,
        readEquationMotionCollapseScalePercent(demo)
      );
    });
}

export function stepEquationMotionDemo(
  control: HTMLButtonElement,
  direction: -1 | 1
): void {
  const demo = control.closest<HTMLElement>("[data-kp-equation-motion-demo]");

  if (demo === null) {
    return;
  }

  stepEquationMotionDemoCard(demo, direction);
}

export function stepEquationMotionDemoCard(
  demo: HTMLElement,
  direction: -1 | 1
): void {
  const sourceStep = readEquationMotionStep(demo);
  const targetStep = clampNumber(
    sourceStep + direction,
    0,
    readEquationMotionMaxStep(demo)
  );

  if (targetStep === sourceStep) {
    return;
  }

  playEquationMotionDemoTransition(demo, sourceStep, targetStep);
}

export function handleEquationMotionDemoKeydown(event: KeyboardEvent): boolean {
  if (!(event.target instanceof Element)) {
    return false;
  }

  const demo = event.target.closest<HTMLElement>(
    "[data-kp-equation-motion-demo]"
  );

  if (demo === null) {
    return false;
  }

  const pickerOpen = isEquationAnimationPickerOpen(demo);

  if (!pickerOpen && isEquationMotionEditableTarget(event.target)) {
    return false;
  }

  switch (event.key) {
    case " ":
      event.preventDefault();
      toggleEquationMotionPlayback(demo);
      return true;
    case "j":
      event.preventDefault();
      closeEquationAnimationPicker(demo);
      stepEquationMotionDemoCard(demo, 1);
      return true;
    case "k":
      event.preventDefault();
      closeEquationAnimationPicker(demo);
      stepEquationMotionDemoCard(demo, -1);
      return true;
    case "J":
      event.preventDefault();
      moveEquationAnimationPicker(demo, 1);
      return true;
    case "K":
      event.preventDefault();
      moveEquationAnimationPicker(demo, -1);
      return true;
    case "Enter":
      if (pickerOpen) {
        event.preventDefault();
        commitEquationAnimationPicker(demo);
        return true;
      }
      return false;
    case "Escape":
      if (pickerOpen) {
        event.preventDefault();
        closeEquationAnimationPicker(demo);
        return true;
      }
      return false;
    default:
      return false;
  }
}

export function toggleEquationMotionPlayback(demo: HTMLElement): void {
  const activeAnimation = activeAnimations.get(demo);

  if (activeAnimation !== undefined) {
    pauseEquationMotionAnimation(demo, activeAnimation);
    return;
  }

  const pausedAnimation = pausedAnimations.get(demo);

  if (pausedAnimation !== undefined) {
    pausedAnimations.delete(demo);
    resumeEquationMotionAnimation(demo, pausedAnimation);
    return;
  }

  const transition = readKeyboardPlaybackTransition(demo);

  if (transition === undefined) {
    return;
  }

  playEquationMotionDemoTransition(
    demo,
    transition.sourceStep,
    transition.targetStep
  );
}

export function setEquationMotionProgress(
  demo: HTMLElement,
  progress: number
): void {
  cancelEquationMotionAnimation(demo);
  const transition = readLatestEquationMotionTransition(demo);

  if (transition === undefined) {
    return;
  }

  const plan = createDemoEquationMotionTransition(
    demo,
    transition.sourceStep,
    transition.targetStep
  );
  const player = createEquationMotionPlayer(plan, {
    render: (frame) => {
      renderEquationMotionFrame(
        demo,
        plan,
        transition.sourceStep,
        transition.targetStep,
        frame
      );
    }
  });
  const directionalProgress = normalizeProgress(progress);
  const canonicalProgress =
    transition.sourceStep < transition.targetStep
      ? directionalProgress
      : 1 - directionalProgress;

  player.setProgress(canonicalProgress);
}

export function setEquationMotionBeat(input: HTMLInputElement): void {
  const demo = input.closest<HTMLElement>("[data-kp-equation-motion-demo]");

  if (demo === null) {
    return;
  }

  const beatCount = readEquationMotionBeatCount(demo);
  const beat = clampNumber(Number(input.value), 0, beatCount);

  setEquationMotionProgress(demo, beat / beatCount);
  syncEquationMotionScrubber(demo, beat, beatCount);
}

export function setEquationMotionDuration(input: HTMLInputElement): void {
  const demo = input.closest<HTMLElement>("[data-kp-equation-motion-demo]");

  if (demo === null) {
    return;
  }

  syncEquationMotionDurationControl(
    demo,
    clampEquationMotionDuration(Number(input.value))
  );
}

export function setEquationMotionCollapseScale(input: HTMLInputElement): void {
  const demo = input.closest<HTMLElement>("[data-kp-equation-motion-demo]");

  if (demo === null) {
    return;
  }

  syncEquationMotionCollapseScaleControl(
    demo,
    clampEquationMotionCollapseScalePercent(Number(input.value))
  );
}

function playEquationMotionDemoTransition(
  demo: HTMLElement,
  sourceStep: number,
  targetStep: number
): void {
  cancelEquationMotionAnimation(demo);
  const startProgress = sourceStep < targetStep ? 0 : 1;
  const targetProgress = sourceStep < targetStep ? 1 : 0;
  const durationMs = readEquationMotionDurationMs(demo);

  startEquationMotionAnimation(
    demo,
    sourceStep,
    targetStep,
    startProgress,
    targetProgress,
    durationMs
  );
}

function resumeEquationMotionAnimation(
  demo: HTMLElement,
  pausedAnimation: PausedEquationMotionAnimation
): void {
  startEquationMotionAnimation(
    demo,
    pausedAnimation.sourceStep,
    pausedAnimation.targetStep,
    pausedAnimation.currentProgress,
    pausedAnimation.targetProgress,
    pausedAnimation.durationMs * Math.abs(
      pausedAnimation.targetProgress - pausedAnimation.currentProgress
    )
  );
}

function startEquationMotionAnimation(
  demo: HTMLElement,
  sourceStep: number,
  targetStep: number,
  startProgress: number,
  targetProgress: number,
  durationMs: number
): void {
  cancelEquationMotionAnimation(demo);
  const plan = createDemoEquationMotionTransition(demo, sourceStep, targetStep);
  const player = createEquationMotionPlayer(plan, {
    render: (frame) => {
      renderEquationMotionFrame(
        demo,
        plan,
        sourceStep,
        targetStep,
        frame
      );
    }
  });

  demo.dataset["kpEquationMotionLatestSource"] = String(sourceStep);
  demo.dataset["kpEquationMotionLatestTarget"] = String(targetStep);
  demo.dataset["kpEquationMotionAnimating"] = "true";
  delete demo.dataset["kpEquationMotionPaused"];

  const delta = targetProgress - startProgress;
  const startTime = window.performance.now();
  const clampedDurationMs = Math.max(1, durationMs);
  const activeAnimation: ActiveEquationMotionAnimation = {
    animationFrameId: 0,
    sourceStep,
    targetStep,
    targetProgress,
    durationMs: clampedDurationMs,
    currentProgress: startProgress
  };

  syncEquationMotionDurationControl(demo, readEquationMotionDurationMs(demo));
  player.setProgress(startProgress);

  const tick = (now: number): void => {
    const elapsed = now - startTime;
    const timeProgress = clampNumber(
      elapsed / clampedDurationMs,
      0,
      1
    );
    const nextProgress = startProgress + delta * timeProgress;

    activeAnimation.currentProgress = nextProgress;
    player.setProgress(nextProgress);

    if (timeProgress < 1) {
      activeAnimation.animationFrameId = window.requestAnimationFrame(tick);
      return;
    }

    activeAnimations.delete(demo);
    delete demo.dataset["kpEquationMotionAnimating"];
    syncEquationMotionActiveState(demo, targetStep);
  };

  activeAnimation.animationFrameId = window.requestAnimationFrame(tick);
  activeAnimations.set(demo, activeAnimation);
}

function createDemoEquationMotionTransition(
  demo: HTMLElement,
  sourceStep: number,
  targetStep: number
): ReturnType<typeof createEquationMotionPlan> {
  if (Math.abs(sourceStep - targetStep) !== 1) {
    throw new Error("Equation motion demo transitions must be adjacent steps.");
  }

  const lowerStep = Math.min(sourceStep, targetStep);
  const animation = findEquationAnimationCatalogEntry(
    readEquationAnimationId(demo)
  );
  const transition = animation.transitions[lowerStep];
  const sourceState = findEquationMotionState(demo, lowerStep);
  const targetState = findEquationMotionState(demo, lowerStep + 1);

  if (
    transition === undefined ||
    sourceState === undefined ||
    targetState === undefined
  ) {
    throw new Error("Unsupported equation motion demo transition.");
  }

  const sourceLatex = sourceState.dataset["kpEquationMotionLatex"];
  const expectedTargetLatex = targetState.dataset["kpEquationMotionLatex"];

  if (sourceLatex === undefined || expectedTargetLatex === undefined) {
    throw new Error("Equation motion states must include LaTeX metadata.");
  }

  if (
    transition.sourceLatex !== sourceLatex ||
    transition.targetLatex !== expectedTargetLatex
  ) {
    throw new Error("Equation motion state does not match semantic operation.");
  }

  const plan = createEquationMotionPlan(transition);
  const context = getEquationMotionRenderContext(demo, sourceStep, targetStep);

  if (context === undefined) {
    return plan;
  }

  return applyMeasuredMotionDeltas(
    plan,
    createMeasuredLayoutDeltas(plan, context)
  );
}

function readEquationAnimationId(demo: HTMLElement): string {
  return (
    demo.dataset["kpEquationAnimationId"] ?? DEFAULT_EQUATION_ANIMATION_ID
  );
}

function isEquationMotionEditableTarget(target: Element): boolean {
  return target.closest("input, select, textarea, button, summary") !== null;
}

function isEquationAnimationPickerOpen(demo: HTMLElement): boolean {
  const picker = findEquationAnimationPicker(demo);

  return picker !== undefined && !picker.hidden;
}

function moveEquationAnimationPicker(
  demo: HTMLElement,
  direction: -1 | 1
): void {
  const picker = findEquationAnimationPicker(demo);
  const options = findEquationAnimationPickerOptions(demo);

  if (picker === undefined || options.length === 0) {
    return;
  }

  const currentIndex = isEquationAnimationPickerOpen(demo)
    ? readIntegerDataset(picker.dataset["kpEquationAnimationPickerIndex"]) ??
      selectedEquationAnimationPickerIndex(demo, options)
    : selectedEquationAnimationPickerIndex(demo, options);
  const nextIndex = wrapIndex(currentIndex + direction, options.length);

  picker.hidden = false;
  demo.dataset["kpEquationAnimationPickerOpen"] = "true";
  picker.dataset["kpEquationAnimationPickerIndex"] = String(nextIndex);
  syncEquationAnimationPickerHighlight(picker, options, nextIndex);
}

function closeEquationAnimationPicker(demo: HTMLElement): void {
  const picker = findEquationAnimationPicker(demo);

  if (picker === undefined) {
    return;
  }

  picker.hidden = true;
  delete demo.dataset["kpEquationAnimationPickerOpen"];
  delete picker.dataset["kpEquationAnimationPickerIndex"];
}

function commitEquationAnimationPicker(demo: HTMLElement): void {
  const picker = findEquationAnimationPicker(demo);
  const options = findEquationAnimationPickerOptions(demo);
  const select = findEquationAnimationSelect(demo);

  if (picker === undefined || options.length === 0 || select === undefined) {
    return;
  }

  const index =
    readIntegerDataset(picker.dataset["kpEquationAnimationPickerIndex"]) ??
    selectedEquationAnimationPickerIndex(demo, options);
  const option = options[wrapIndex(index, options.length)];
  const animationId = option?.dataset["kpEquationAnimationId"];

  if (animationId === undefined) {
    return;
  }

  select.value = animationId;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function findEquationAnimationPicker(
  demo: HTMLElement
): HTMLElement | undefined {
  return (
    demo.querySelector<HTMLElement>("[data-kp-equation-animation-picker]") ??
    undefined
  );
}

function findEquationAnimationSelect(
  demo: HTMLElement
): HTMLSelectElement | undefined {
  return (
    demo.querySelector<HTMLSelectElement>(
      '[data-action="set-equation-motion-animation"]'
    ) ?? undefined
  );
}

function findEquationAnimationPickerOptions(
  demo: HTMLElement
): readonly HTMLElement[] {
  return Array.from(
    demo.querySelectorAll<HTMLElement>(
      "[data-kp-equation-animation-picker-option]"
    )
  );
}

function selectedEquationAnimationPickerIndex(
  demo: HTMLElement,
  options: readonly HTMLElement[]
): number {
  const select = findEquationAnimationSelect(demo);
  const selectedId = select?.value ?? readEquationAnimationId(demo);
  const index = options.findIndex(
    (option) => option.dataset["kpEquationAnimationId"] === selectedId
  );

  return index < 0 ? 0 : index;
}

function syncEquationAnimationPickerHighlight(
  picker: HTMLElement,
  options: readonly HTMLElement[],
  selectedIndex: number
): void {
  options.forEach((option, index) => {
    option.setAttribute("aria-selected", index === selectedIndex ? "true" : "false");
  });

  const selectedOption = options[selectedIndex];

  if (selectedOption?.id !== undefined && selectedOption.id !== "") {
    picker.setAttribute("aria-activedescendant", selectedOption.id);
  } else {
    picker.removeAttribute("aria-activedescendant");
  }
}

function wrapIndex(index: number, length: number): number {
  return ((index % length) + length) % length;
}

function renderEquationMotionFrame(
  demo: HTMLElement,
  plan: EquationMotionPlan,
  sourceStep: number,
  targetStep: number,
  frame: EquationMotionFrame
): void {
  const context = getEquationMotionRenderContext(demo, sourceStep, targetStep);

  if (context === undefined) {
    return;
  }

  const frameTokens = indexFrameTokens(frame.tokens);
  const directionalProgress =
    sourceStep < targetStep ? frame.progress : 1 - frame.progress;
  const cancellationGroup = createCancellationMotionGroup(plan, context);
  const finalSimplifyGroup = createFinalSimplifyMotionGroup(plan, context);
  const artifactMotionIds = renderArtifactSeedReveal(
    demo,
    plan,
    context,
    frame.progress
  );
  const collapseScale = readEquationMotionCollapseScale(demo);

  demo.dataset["kpEquationMotionLastRenderer"] = "operation-plan";
  demo.dataset["kpEquationMotionPlanProgress"] =
    formatEquationMotionProgress(frame.progress);
  demo.dataset["kpEquationMotionProgress"] =
    formatEquationMotionProgress(directionalProgress);
  demo.dataset["kpEquationMotionSampledTokenCount"] =
    String(frame.tokens.length);
  demo.dataset["kpEquationMotionSourceAnchorCount"] =
    String(countContextTokensForStep(context, sourceStep));
  demo.dataset["kpEquationMotionTargetAnchorCount"] =
    String(countContextTokensForStep(context, targetStep));
  syncEquationMotionScrubber(
    demo,
    directionalProgress * readEquationMotionBeatCount(demo)
  );

  if (cancellationGroup === undefined) {
    delete demo.dataset["kpEquationMotionCancelMode"];
    clearCancellationParticles(demo);
  } else {
    demo.dataset["kpEquationMotionCancelMode"] = "particle-dissolve";
    renderCancellationParticles(
      context.planSourceState,
      cancellationGroup,
      frame.progress
    );
  }

  delete demo.dataset["kpEquationMotionLiquidMode"];
  clearLiquidMerge(demo);

  for (const token of plan.tokens) {
    const frameToken = frameTokens.get(token.id);

    if (frameToken === undefined) {
      continue;
    }

    const sourceToken =
      token.sourceMotionId === undefined
        ? undefined
        : context.planSourceTokens.get(token.sourceMotionId);
    const targetToken =
      token.targetMotionId === undefined
        ? undefined
        : context.planTargetTokens.get(token.targetMotionId);

    if (sourceToken !== undefined && targetToken !== undefined) {
      applyEquationMotionTokenStyle(
        sourceToken.element,
        token.sourceMotionId !== undefined &&
          artifactMotionIds.has(token.sourceMotionId)
          ? hiddenTokenPose()
          : frameToken.pose,
        token.sourceMotionId !== undefined &&
          artifactMotionIds.has(token.sourceMotionId)
          ? "hidden"
          : "visible"
      );
      applyEquationMotionTokenStyle(
        targetToken.element,
        hiddenTokenPose(),
        "hidden"
      );
      continue;
    }

    if (
      sourceToken !== undefined &&
      token.sourceMotionId !== undefined &&
      artifactMotionIds.has(token.sourceMotionId)
    ) {
      applyEquationMotionTokenStyle(
        sourceToken.element,
        hiddenTokenPose(),
        "hidden"
      );
      continue;
    }

    if (
      targetToken !== undefined &&
      token.targetMotionId !== undefined &&
      artifactMotionIds.has(token.targetMotionId)
    ) {
      applyEquationMotionTokenStyle(
        targetToken.element,
        hiddenTokenPose(),
        "hidden"
      );
      continue;
    }

    if (sourceToken !== undefined) {
      applyEquationMotionTokenStyle(
        sourceToken.element,
        token.lifecycle === "cancel" &&
          cancellationGroup?.tokenIds.has(token.id) === true
          ? cancellationTokenPose(
              sourceToken,
              cancellationGroup,
              frame.progress,
              collapseScale
            )
          : token.lifecycle === "simplify-into" &&
              finalSimplifyGroup?.sourceTokenIds.has(token.id) === true
            ? finalSimplifySourceTokenPose(
                sourceToken,
                finalSimplifyGroup,
                frame.progress,
                collapseScale
              )
          : frameToken.pose,
        "visible"
      );
    }

    if (targetToken !== undefined) {
      applyEquationMotionTokenStyle(
        targetToken.element,
        token.id === finalSimplifyGroup?.targetTokenId
          ? finalSimplifyTargetTokenPose(
              targetToken,
              finalSimplifyGroup,
              frameToken.pose,
              frame.progress,
              collapseScale
            )
          : token.entryEffect === "direct"
            ? frameToken.pose
            : addedObjectPose(frameToken.pose, frame.progress),
        "visible"
      );
    }
  }
}

function syncEquationMotionActiveState(
  demo: HTMLElement,
  activeStep: number
): void {
  activeRenderContexts.delete(demo);
  resetEquationMotionVisualState(demo);
  delete demo.dataset["kpEquationMotionCancelMode"];
  clearCancellationParticles(demo);
  delete demo.dataset["kpEquationMotionLiquidMode"];
  clearLiquidMerge(demo);
  const nextActiveStep = clampNumber(
    activeStep,
    0,
    readEquationMotionMaxStep(demo)
  );

  demo.dataset["kpEquationMotionStep"] = String(nextActiveStep);
  demo
    .querySelectorAll<HTMLElement>("[data-kp-equation-motion-state]")
    .forEach((state) => {
      const active =
        readIntegerDataset(state.dataset["kpEquationMotionState"]) ===
        nextActiveStep;

      state.classList.toggle("equation-motion__state--active", active);
      state.dataset["kpEquationMotionActive"] = active ? "true" : "false";
      state.setAttribute("aria-hidden", active ? "false" : "true");
    });
  syncEquationMotionControls(demo, nextActiveStep);
}

function getEquationMotionRenderContext(
  demo: HTMLElement,
  sourceStep: number,
  targetStep: number
): EquationMotionRenderContext | undefined {
  const planSourceStep = Math.min(sourceStep, targetStep);
  const planTargetStep = Math.max(sourceStep, targetStep);
  const key = `${planSourceStep}:${planTargetStep}`;
  const existingContext = activeRenderContexts.get(demo);

  if (existingContext?.key === key) {
    return existingContext;
  }

  resetEquationMotionVisualState(demo);

  const planSourceState = findEquationMotionState(demo, planSourceStep);
  const planTargetState = findEquationMotionState(demo, planTargetStep);

  if (planSourceState === undefined || planTargetState === undefined) {
    return undefined;
  }

  const context: EquationMotionRenderContext = {
    key,
    planSourceStep,
    planTargetStep,
    planSourceState,
    planTargetState,
    planSourceTokens: indexStableMotionTokens(
      measureAnnotatedEquationMotionTokens(planSourceState)
    ),
    planTargetTokens: indexStableMotionTokens(
      measureAnnotatedEquationMotionTokens(planTargetState)
    )
  };

  prepareEquationMotionTransitionLayers(demo, planSourceState, planTargetState);
  activeRenderContexts.set(demo, context);

  return context;
}

function cancelEquationMotionAnimation(demo: HTMLElement): void {
  const activeAnimation = activeAnimations.get(demo);

  if (activeAnimation !== undefined) {
    window.cancelAnimationFrame(activeAnimation.animationFrameId);
    activeAnimations.delete(demo);
  }

  pausedAnimations.delete(demo);
  delete demo.dataset["kpEquationMotionAnimating"];
  delete demo.dataset["kpEquationMotionPaused"];
}

function pauseEquationMotionAnimation(
  demo: HTMLElement,
  activeAnimation: ActiveEquationMotionAnimation
): void {
  window.cancelAnimationFrame(activeAnimation.animationFrameId);
  activeAnimations.delete(demo);
  pausedAnimations.set(demo, {
    sourceStep: activeAnimation.sourceStep,
    targetStep: activeAnimation.targetStep,
    currentProgress: activeAnimation.currentProgress,
    targetProgress: activeAnimation.targetProgress,
    durationMs: activeAnimation.durationMs
  });
  delete demo.dataset["kpEquationMotionAnimating"];
  demo.dataset["kpEquationMotionPaused"] = "true";
}

function prepareEquationMotionTransitionLayers(
  demo: HTMLElement,
  sourceState: HTMLElement,
  targetState: HTMLElement
): void {
  demo
    .querySelectorAll<HTMLElement>("[data-kp-equation-motion-state]")
    .forEach((state) => {
      const isTransitionLayer = state === sourceState || state === targetState;

      state.style.opacity = isTransitionLayer ? "1" : "";
      state.style.visibility = isTransitionLayer ? "visible" : "";
      state.setAttribute("aria-hidden", isTransitionLayer ? "false" : "true");
      state
        .querySelectorAll<HTMLElement>("[data-kp-motion-id]")
        .forEach((element) => {
          if (isTransitionLayer) {
            applyEquationMotionTokenStyle(element, hiddenTokenPose(), "hidden");
          } else {
            resetEquationMotionTokenStyle(element);
          }
        });
    });
}

function resetEquationMotionVisualState(demo: HTMLElement): void {
  clearArtifactSeedReveal(demo);

  demo
    .querySelectorAll<HTMLElement>("[data-kp-equation-motion-state]")
    .forEach((state) => {
      state.style.opacity = "";
      state.style.visibility = "";
      state
        .querySelectorAll<HTMLElement>("[data-kp-motion-id]")
        .forEach(resetEquationMotionTokenStyle);
    });
}

function applyEquationMotionTokenStyle(
  element: HTMLElement,
  pose: MotionPose,
  visibility: "hidden" | "visible"
): void {
  const visible = visibility === "visible" && pose.opacity > 0.001;

  element.style.opacity = formatEquationMotionProgress(pose.opacity);
  element.style.transform = `translate(${formatPixel(pose.x)}, ${formatPixel(
    pose.y
  )}) scale(${formatEquationMotionProgress(pose.scale)})`;
  element.style.transformOrigin = "center";
  element.style.visibility = visible ? "visible" : "hidden";
  element.style.willChange = "opacity, transform";
}

function resetEquationMotionTokenStyle(element: HTMLElement): void {
  element.style.opacity = "";
  element.style.transform = "";
  element.style.transformOrigin = "";
  element.style.visibility = "";
  element.style.willChange = "";
}

function renderArtifactSeedReveal(
  demo: HTMLElement,
  plan: EquationMotionPlan,
  context: EquationMotionRenderContext,
  progress: number
): ReadonlySet<string> {
  const seedRevealPlan = createRadicalArtifactSeedRevealPlan(plan, context);
  // The canvas owns the abstract middle of this artifact transform; readable
  // endpoint typography stays DOM-rendered to avoid canvas-vs-KaTeX seams.
  const useDomEndpointRenderer =
    progress <= EQUATION_MOTION_ARTIFACT_DOM_ENDPOINT_WINDOW ||
    progress >= 1 - EQUATION_MOTION_ARTIFACT_DOM_ENDPOINT_WINDOW;

  if (seedRevealPlan === undefined || useDomEndpointRenderer) {
    clearArtifactSeedReveal(demo);
    return new Set();
  }

  const renderContext = findOrCreateArtifactSeedRevealContext(
    demo,
    context,
    seedRevealPlan
  );

  renderContext.lastProgress = progress;
  demo.dataset["kpEquationMotionArtifactMode"] = "fold-bundle-swap";
  delete demo.dataset["kpEquationMotionArtifactFallbackReason"];

  if (renderContext.renderer !== undefined) {
    renderContext.renderer.render(progress);
    renderContext.canvas.dataset["kpEquationMotionArtifactReady"] = "true";
  }

  return new Set([seedRevealPlan.sourceMotionId, seedRevealPlan.targetMotionId]);
}

function createRadicalArtifactSeedRevealPlan(
  plan: EquationMotionPlan,
  context: EquationMotionRenderContext
):
  | {
      readonly key: string;
      readonly sourceMotionId: string;
      readonly targetMotionId: string;
      readonly seedRevealPlan: KatexArtifactSeedRevealPlan;
      readonly sourceAtlasToken: KatexMotionToken;
      readonly targetAtlasToken: KatexMotionToken;
    }
  | undefined {
  const sourceMotionId = "radical.rewrite-power-as-root.source.exponent";
  const targetMotionId = "radical.rewrite-power-as-root.target.radical";

  if (
    !plan.tokens.some((token) => token.sourceMotionId === sourceMotionId) ||
    !plan.tokens.some((token) => token.targetMotionId === targetMotionId)
  ) {
    return undefined;
  }

  const sourceToken = context.planSourceTokens.get(sourceMotionId);
  const targetToken = context.planTargetTokens.get(targetMotionId);
  const stage = findEquationMotionStage(context.planSourceState);

  if (sourceToken === undefined || targetToken === undefined || stage === undefined) {
    return undefined;
  }

  const stageRect = stage.getBoundingClientRect();
  const sourceCaptureRect = measureKatexTextureCaptureRect(sourceToken.element);
  const targetCaptureRect = measureKatexTextureCaptureRect(targetToken.element);
  const sourceLocalRect = viewportRectToLocalRect(sourceCaptureRect, stageRect);
  const targetLocalRect = viewportRectToLocalRect(targetCaptureRect, stageRect);
  const bundleRect = radicalBundleRect(targetLocalRect);

  return {
    key: `${context.key}:radical-artifact-seed-reveal`,
    sourceMotionId,
    targetMotionId,
    seedRevealPlan: {
      id: "radical.rewrite-power-as-root.artifact-seed-reveal",
      kind: "artifact-seed-reveal",
      source: {
        tokenId: sourceMotionId,
        rect: sourceLocalRect
      },
      target: {
        tokenId: targetMotionId,
        rect: targetLocalRect
      },
      bundleRect,
      sourceGrid: { columns: 6, rows: 2 },
      targetGrid: { columns: 10, rows: 2 },
      sourceMotion: {
        kind: "collapse-to-bundle",
        collapseEnd: 0.48,
        fadeStart: 0.34,
        fadeEnd: 0.56,
        stagger: 0.08,
        drift: 1.5
      },
      targetMotion: {
        kind: "unfold-from-bundle",
        revealStart: 0.42,
        revealEnd: 1,
        stagger: 0.18,
        drift: 1.25,
        dissolveFraction: 0
      },
      start: 0,
      end: 1,
      easing: "ease-in-out"
    },
    sourceAtlasToken: artifactAtlasToken(
      sourceMotionId,
      sourceCaptureRect,
      sourceToken.element
    ),
    targetAtlasToken: artifactAtlasToken(
      targetMotionId,
      targetCaptureRect,
      targetToken.element
    )
  };
}

function radicalBundleRect(targetRect: KatexTokenRect): KatexTokenRect {
  return {
    left: targetRect.left + targetRect.width * 0.14,
    top: targetRect.top + targetRect.height * 0.55,
    width: Math.max(8, targetRect.width * 0.2),
    height: Math.max(6, targetRect.height * 0.22)
  };
}

function findOrCreateArtifactSeedRevealContext(
  demo: HTMLElement,
  context: EquationMotionRenderContext,
  plan: NonNullable<ReturnType<typeof createRadicalArtifactSeedRevealPlan>>
): EquationArtifactSeedRevealContext {
  const existingContext = artifactSeedRevealContexts.get(demo);

  if (existingContext?.key === plan.key) {
    return existingContext;
  }

  clearArtifactSeedReveal(demo);
  const stage = findEquationMotionStage(context.planSourceState);

  if (stage === undefined) {
    throw new Error("Expected equation motion stage for artifact seed reveal.");
  }

  const canvas = document.createElement("canvas");
  const stageRect = stage.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const renderContext: EquationArtifactSeedRevealContext = {
    key: plan.key,
    sourceMotionId: plan.sourceMotionId,
    targetMotionId: plan.targetMotionId,
    canvas,
    renderer: undefined,
    rendererPromise: Promise.resolve(undefined),
    disposed: false,
    lastProgress: 0
  };

  canvas.className = "equation-motion__artifact-canvas";
  canvas.dataset["kpEquationMotionArtifactOverlay"] = "true";
  canvas.dataset["kpEquationMotionArtifactRenderer"] = "canvas-fold-bundle-swap";
  canvas.dataset["kpEquationMotionArtifactSource"] = plan.sourceMotionId;
  canvas.dataset["kpEquationMotionArtifactTarget"] = plan.targetMotionId;
  canvas.dataset["kpEquationMotionArtifactSourceMotion"] =
    plan.seedRevealPlan.sourceMotion.kind;
  canvas.dataset["kpEquationMotionArtifactPathMotion"] = "fold-bundle-swap";
  canvas.dataset["kpEquationMotionArtifactTargetMotion"] =
    plan.seedRevealPlan.targetMotion.kind;
  canvas.dataset["kpEquationMotionArtifactBundleRect"] =
    formatDatasetRect(plan.seedRevealPlan.bundleRect);
  canvas.dataset["kpEquationMotionArtifactCollapseEnd"] = String(
    plan.seedRevealPlan.sourceMotion.collapseEnd
  );
  canvas.dataset["kpEquationMotionArtifactRevealStart"] = String(
    plan.seedRevealPlan.targetMotion.revealStart
  );
  canvas.dataset["kpEquationMotionArtifactDissolveFraction"] = String(
    plan.seedRevealPlan.targetMotion.dissolveFraction
  );
  syncArtifactCanvas(canvas, stageRect, pixelRatio);
  stage.append(canvas);

  const rendererPromise = createKatexTextureAtlas(
    [plan.sourceAtlasToken, plan.targetAtlasToken],
    { pixelRatio }
  )
    .then((atlas) => {
      if (renderContext.disposed) {
        return undefined;
      }

      const renderer = createKatexArtifactSeedRevealRenderer(
        canvas,
        plan.seedRevealPlan,
        atlas
      );

      renderContext.renderer = renderer;
      renderer.render(renderContext.lastProgress);
      canvas.dataset["kpEquationMotionArtifactReady"] = "true";

      return renderer;
    })
    .catch((error: unknown) => {
      if (!renderContext.disposed) {
        demo.dataset["kpEquationMotionArtifactFallbackReason"] =
          error instanceof Error ? error.message : "Unknown artifact seed reveal error.";
        clearArtifactSeedReveal(demo);
      }

      return undefined;
    });

  renderContext.rendererPromise = rendererPromise;
  artifactSeedRevealContexts.set(demo, renderContext);

  return renderContext;
}

function clearArtifactSeedReveal(demo: HTMLElement): void {
  const context = artifactSeedRevealContexts.get(demo);

  if (context !== undefined) {
    context.disposed = true;
    context.renderer?.dispose();
    context.canvas.remove();
    artifactSeedRevealContexts.delete(demo);
  }

  delete demo.dataset["kpEquationMotionArtifactMode"];
  demo
    .querySelectorAll<HTMLCanvasElement>(
      "[data-kp-equation-motion-artifact-overlay]"
    )
    .forEach((canvas) => canvas.remove());
}

function syncArtifactCanvas(
  canvas: HTMLCanvasElement,
  bounds: DOMRect,
  pixelRatio: number
): void {
  const width = Math.max(1, Math.ceil(bounds.width * pixelRatio));
  const height = Math.max(1, Math.ceil(bounds.height * pixelRatio));

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${bounds.width}px`;
  canvas.style.height = `${bounds.height}px`;
}

function formatDatasetRect(rect: KatexTokenRect): string {
  return [
    rect.left,
    rect.top,
    rect.width,
    rect.height
  ]
    .map((value) => formatEquationMotionProgress(value))
    .join(",");
}

function artifactAtlasToken(
  id: string,
  rect: KatexTokenRect,
  element: HTMLElement
): KatexMotionToken {
  return {
    id,
    text: id,
    signature: "artifact-seed-reveal",
    rect,
    localRect: {
      left: 0,
      top: 0,
      width: rect.width,
      height: rect.height
    },
    row: 0,
    element
  };
}

function viewportRectToLocalRect(
  rect: KatexTokenRect,
  containerRect: DOMRect
): KatexTokenRect {
  return {
    left: rect.left - containerRect.left,
    top: rect.top - containerRect.top,
    width: rect.width,
    height: rect.height
  };
}

function findEquationMotionStage(state: HTMLElement): HTMLElement | undefined {
  return state.closest<HTMLElement>(".equation-motion__stage") ?? undefined;
}

function indexStableMotionTokens(
  tokens: ReturnType<typeof measureAnnotatedEquationMotionTokens>
): Map<string, StableMotionToken> {
  return new Map(
    tokens.map((token) => [
      token.motionId,
      {
        motionId: token.motionId,
        text: token.text,
        element: token.element,
        localRect: { ...token.localRect }
      }
    ])
  );
}

function indexFrameTokens(
  tokens: readonly EquationMotionFrameToken[]
): Map<string, EquationMotionFrameToken> {
  return new Map(tokens.map((token) => [token.tokenId, token]));
}

function countContextTokensForStep(
  context: EquationMotionRenderContext,
  step: number
): number {
  if (step === context.planSourceStep) {
    return context.planSourceTokens.size;
  }

  if (step === context.planTargetStep) {
    return context.planTargetTokens.size;
  }

  return 0;
}

function syncEquationMotionControls(
  demo: HTMLElement,
  activeStep: number
): void {
  const maxStep = readEquationMotionMaxStep(demo);
  const rewind = demo.querySelector<HTMLButtonElement>(
    '[data-action="equation-motion-rewind"]'
  );
  const next = demo.querySelector<HTMLButtonElement>(
    '[data-action="equation-motion-next"]'
  );

  if (rewind !== null) {
    rewind.disabled = activeStep <= 0;
  }

  if (next !== null) {
    next.disabled = activeStep >= maxStep;
  }

  const progress = normalizeProgress(
    readNumberDataset(demo.dataset["kpEquationMotionProgress"]) ?? 0
  );

  syncEquationMotionScrubber(demo, progress * readEquationMotionBeatCount(demo));
}

function syncEquationMotionScrubber(
  demo: HTMLElement,
  beatValue: number,
  beatCount = readEquationMotionBeatCount(demo)
): void {
  const beat = Math.round(clampNumber(beatValue, 0, beatCount));
  const scrubber = demo.querySelector<HTMLInputElement>(
    '[data-action="set-equation-motion-beat"]'
  );
  const output = demo.querySelector<HTMLOutputElement>(
    '[data-role="equation-motion-beat-output"]'
  );

  if (scrubber !== null) {
    scrubber.max = String(beatCount);
    scrubber.value = String(beat);
  }

  if (output !== null) {
    output.value = String(beat);
    output.textContent = `${beat}/${beatCount}`;
  }
}

function syncEquationMotionDurationControl(
  demo: HTMLElement,
  durationMs: number
): void {
  const duration = clampEquationMotionDuration(durationMs);
  const input = demo.querySelector<HTMLInputElement>(
    '[data-action="set-equation-motion-duration"]'
  );
  const output = demo.querySelector<HTMLOutputElement>(
    '[data-role="equation-motion-duration-output"]'
  );

  demo.dataset["kpEquationMotionDurationMs"] = String(duration);

  if (input !== null) {
    input.value = String(duration);
  }

  if (output !== null) {
    output.value = String(duration);
    output.textContent = `${duration} ms`;
  }
}

function syncEquationMotionCollapseScaleControl(
  demo: HTMLElement,
  scalePercent: number
): void {
  const percent = clampEquationMotionCollapseScalePercent(scalePercent);
  const input = demo.querySelector<HTMLInputElement>(
    '[data-action="set-equation-motion-collapse-scale"]'
  );
  const output = demo.querySelector<HTMLOutputElement>(
    '[data-role="equation-motion-collapse-scale-output"]'
  );

  demo.dataset["kpEquationMotionCollapseScalePercent"] = String(percent);

  if (input !== null) {
    input.value = String(percent);
  }

  if (output !== null) {
    output.value = String(percent);
    output.textContent = `${percent}%`;
  }
}

function readEquationMotionBeatCount(demo: HTMLElement): number {
  const scrubber = demo.querySelector<HTMLInputElement>(
    '[data-action="set-equation-motion-beat"]'
  );
  const configuredBeatCount =
    readIntegerDataset(scrubber?.dataset["kpEquationMotionBeats"]) ??
    readIntegerDataset(scrubber?.max);

  if (configuredBeatCount === undefined || configuredBeatCount <= 0) {
    return EQUATION_MOTION_DEMO_BEAT_LABEL_COUNT;
  }

  return configuredBeatCount;
}

function createMeasuredLayoutDeltas(
  plan: EquationMotionPlan,
  context: EquationMotionRenderContext
): readonly EquationMotionMeasuredDelta[] {
  const cancellationGroup = createCancellationMotionGroup(plan, context);

  return plan.tokens.flatMap((token) => {
    if (
      token.sourceMotionId === undefined ||
      token.targetMotionId === undefined
    ) {
      return [];
    }

    const sourceToken = context.planSourceTokens.get(token.sourceMotionId);
    const targetToken = context.planTargetTokens.get(token.targetMotionId);

    if (sourceToken === undefined || targetToken === undefined) {
      return [];
    }

    const track = findEquationMotionTrack(plan, token.id);
    const timing =
      token.motion === undefined
        ? measuredLayoutTiming(cancellationGroup !== undefined)
        : {
            start: track.start,
            end: track.end,
            easing: track.easing
          };

    return [
      {
        tokenId: token.id,
        x: rectCenterX(targetToken.localRect) - rectCenterX(sourceToken.localRect),
        y: rectCenterY(targetToken.localRect) - rectCenterY(sourceToken.localRect),
        scale: measuredUniformScale(sourceToken.localRect, targetToken.localRect),
        ...timing
      }
    ];
  });
}

function rectCenterX(rect: StableMotionToken["localRect"]): number {
  return rect.left + rect.width / 2;
}

function rectCenterY(rect: StableMotionToken["localRect"]): number {
  return rect.top + rect.height / 2;
}

function measuredUniformScale(
  source: StableMotionToken["localRect"],
  target: StableMotionToken["localRect"]
): number | undefined {
  if (source.width <= 0 || source.height <= 0) {
    return undefined;
  }

  const widthScale = target.width / source.width;
  const heightScale = target.height / source.height;

  if (!Number.isFinite(widthScale) || !Number.isFinite(heightScale)) {
    return undefined;
  }

  return Math.sqrt(widthScale * heightScale);
}

function findEquationMotionTrack(
  plan: EquationMotionPlan,
  tokenId: string
): EquationMotionPlan["tracks"][number] {
  const track = plan.tracks.find((candidate) => candidate.tokenId === tokenId);

  if (track === undefined) {
    throw new Error(`Missing equation motion track ${tokenId}.`);
  }

  return track;
}

function measuredLayoutTiming(
  afterCancellation: boolean
): { readonly start: number; readonly end: number; readonly easing: EasingName } {
  const beat = findSemanticBeat(
    EQUATION_MOTION_BEAT_TIMELINE,
    afterCancellation ? "post-cancel-layout-shift" : "layout-shift"
  );

  return {
    start: beat.startBeat / EQUATION_MOTION_BEAT_TIMELINE.beatCount,
    end: beat.endBeat / EQUATION_MOTION_BEAT_TIMELINE.beatCount,
    easing: beat.easing
  };
}

function readEquationMotionDurationMs(demo: HTMLElement): number {
  const input = demo.querySelector<HTMLInputElement>(
    '[data-action="set-equation-motion-duration"]'
  );
  const configuredDuration =
    readIntegerDataset(demo.dataset["kpEquationMotionDurationMs"]) ??
    readIntegerDataset(input?.value);

  if (configuredDuration === undefined) {
    return EQUATION_MOTION_ANIMATION_DURATION_MS;
  }

  return clampEquationMotionDuration(configuredDuration);
}

function clampEquationMotionDuration(durationMs: number): number {
  if (!Number.isFinite(durationMs)) {
    return EQUATION_MOTION_ANIMATION_DURATION_MS;
  }

  return Math.round(
    clampNumber(
      durationMs,
      EQUATION_MOTION_MIN_DURATION_MS,
      EQUATION_MOTION_MAX_DURATION_MS
    )
  );
}

function readEquationMotionCollapseScale(demo: HTMLElement): number {
  return readEquationMotionCollapseScalePercent(demo) / 100;
}

function readEquationMotionCollapseScalePercent(demo: HTMLElement): number {
  const input = demo.querySelector<HTMLInputElement>(
    '[data-action="set-equation-motion-collapse-scale"]'
  );
  const configuredScale =
    readIntegerDataset(demo.dataset["kpEquationMotionCollapseScalePercent"]) ??
    readIntegerDataset(input?.value);

  if (configuredScale === undefined) {
    return EQUATION_MOTION_COLLAPSE_SCALE_PERCENT;
  }

  return clampEquationMotionCollapseScalePercent(configuredScale);
}

function clampEquationMotionCollapseScalePercent(scalePercent: number): number {
  if (!Number.isFinite(scalePercent)) {
    return EQUATION_MOTION_COLLAPSE_SCALE_PERCENT;
  }

  return Math.round(
    clampNumber(
      scalePercent,
      EQUATION_MOTION_MIN_COLLAPSE_SCALE_PERCENT,
      EQUATION_MOTION_MAX_COLLAPSE_SCALE_PERCENT
    )
  );
}

function readLatestEquationMotionTransition(
  demo: HTMLElement
): { readonly sourceStep: number; readonly targetStep: number } | undefined {
  const maxStep = readEquationMotionMaxStep(demo);
  const currentStep = readEquationMotionStep(demo);
  const latestSource = readIntegerDataset(
    demo.dataset["kpEquationMotionLatestSource"]
  );
  const latestTarget = readIntegerDataset(
    demo.dataset["kpEquationMotionLatestTarget"]
  );

  if (
    latestSource !== undefined &&
    latestTarget !== undefined &&
    Math.abs(latestSource - latestTarget) === 1 &&
    latestSource >= 0 &&
    latestSource <= maxStep &&
    latestTarget >= 0 &&
    latestTarget <= maxStep &&
    currentStep === latestTarget
  ) {
    return { sourceStep: latestSource, targetStep: latestTarget };
  }

  const sourceStep = currentStep;
  const targetStep = currentStep < maxStep ? currentStep + 1 : currentStep - 1;

  if (targetStep < 0 || targetStep > maxStep || targetStep === sourceStep) {
    return undefined;
  }

  return { sourceStep, targetStep };
}

function readKeyboardPlaybackTransition(
  demo: HTMLElement
): { readonly sourceStep: number; readonly targetStep: number } | undefined {
  const maxStep = readEquationMotionMaxStep(demo);
  const sourceStep = readEquationMotionStep(demo);
  const targetStep = sourceStep < maxStep ? sourceStep + 1 : sourceStep - 1;

  if (targetStep < 0 || targetStep > maxStep || targetStep === sourceStep) {
    return undefined;
  }

  return { sourceStep, targetStep };
}

function findEquationMotionState(
  demo: HTMLElement,
  step: number
): HTMLElement | undefined {
  return (
    demo.querySelector<HTMLElement>(
      `[data-kp-equation-motion-state="${step}"]`
    ) ?? undefined
  );
}

function readEquationMotionStep(demo: HTMLElement): number {
  return readIntegerDataset(demo.dataset["kpEquationMotionStep"]) ?? 0;
}

function readEquationMotionMaxStep(demo: HTMLElement): number {
  return readIntegerDataset(demo.dataset["kpEquationMotionMaxStep"]) ?? 0;
}

function readIntegerDataset(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) ? parsed : undefined;
}

function readNumberDataset(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeProgress(progress: number): number {
  if (Number.isNaN(progress) || progress === Number.NEGATIVE_INFINITY) {
    return 0;
  }

  if (progress === Number.POSITIVE_INFINITY) {
    return 1;
  }

  return clampNumber(progress, 0, 1);
}

function hiddenTokenPose(): MotionPose {
  return { opacity: 0, x: 0, y: 0, scale: 1 };
}

function createCancellationMotionGroup(
  plan: EquationMotionPlan,
  context: EquationMotionRenderContext
): CancellationMotionGroup | undefined {
  const cancelEntries = plan.tokens.flatMap((token) => {
    if (token.lifecycle !== "cancel" || token.sourceMotionId === undefined) {
      return [];
    }

    const sourceToken = context.planSourceTokens.get(token.sourceMotionId);

    return sourceToken === undefined ? [] : [{ tokenId: token.id, sourceToken }];
  });

  if (cancelEntries.length === 0) {
    return undefined;
  }

  const geometry = collapseMotionGeometryForTokens(
    cancelEntries.map((entry) => entry.sourceToken)
  );

  return {
    tokenIds: new Set(cancelEntries.map((entry) => entry.tokenId)),
    midpoint: geometry.midpoint,
    maxDistance: geometry.maxDistance,
    particleCount: cancelEntries.length * 6
  };
}

function cancellationTokenPose(
  token: StableMotionToken,
  group: CancellationMotionGroup,
  progress: number,
  collapseScale: number
): MotionPose {
  return collapseTokenToMidpointPose(token, group, progress, {
    meetBeatId: "cancel-meet",
    collapseBeatId: "cancel-collapse",
    collapseScale
  });
}

function renderCancellationParticles(
  state: HTMLElement,
  group: CancellationMotionGroup,
  progress: number
): void {
  const rawParticleProgress = progressBetweenSemanticBeat(
    EQUATION_MOTION_BEAT_TIMELINE,
    progress,
    "cancel-collapse"
  );
  const particleProgress = easedProgressBetweenSemanticBeat(
    EQUATION_MOTION_BEAT_TIMELINE,
    progress,
    "cancel-collapse"
  );
  const particleOpacity =
    rawParticleProgress <= 0 || rawParticleProgress >= 1
      ? 0
      : 1 - rawParticleProgress;
  const canvas = findOrCreateCancellationParticleCanvas(state);
  const renderer = findOrCreateCancellationParticleRenderer(canvas);
  const pixelRatio = window.devicePixelRatio || 1;
  const bounds = state.getBoundingClientRect();

  syncCancellationParticleCanvas(canvas, bounds, pixelRatio);
  canvas.dataset["kpEquationMotionParticleRenderer"] = "webgl";
  canvas.dataset["kpEquationMotionParticleCount"] = String(group.particleCount);

  renderer.render({
    width: canvas.width,
    height: canvas.height,
    pixelRatio,
    origin: {
      x: group.midpoint.x * pixelRatio,
      y: group.midpoint.y * pixelRatio
    },
    progress: particleProgress,
    opacity: particleOpacity,
    particleCount: group.particleCount
  });
}

function findOrCreateCancellationParticleCanvas(
  state: HTMLElement
): HTMLCanvasElement {
  const existingCanvas = state.querySelector<HTMLCanvasElement>(
    "[data-kp-equation-motion-webgl-particles]"
  );

  if (existingCanvas !== null) {
    return existingCanvas;
  }

  const canvas = document.createElement("canvas");

  canvas.className = "equation-motion__particle-canvas";
  canvas.dataset["kpEquationMotionWebglParticles"] = "true";
  state.append(canvas);

  return canvas;
}

function findOrCreateCancellationParticleRenderer(
  canvas: HTMLCanvasElement
): EquationCancelParticleRenderer {
  const existingRenderer = cancellationParticleRenderers.get(canvas);

  if (existingRenderer !== undefined) {
    return existingRenderer;
  }

  const renderer = createEquationCancelParticleRenderer(canvas);

  cancellationParticleRenderers.set(canvas, renderer);

  return renderer;
}

function syncCancellationParticleCanvas(
  canvas: HTMLCanvasElement,
  bounds: DOMRect,
  pixelRatio: number
): void {
  const width = Math.max(1, Math.ceil(bounds.width * pixelRatio));
  const height = Math.max(1, Math.ceil(bounds.height * pixelRatio));

  if (canvas.width !== width) {
    canvas.width = width;
  }

  if (canvas.height !== height) {
    canvas.height = height;
  }

  canvas.style.width = `${bounds.width}px`;
  canvas.style.height = `${bounds.height}px`;
}

function disposeCancellationParticleCanvas(canvas: HTMLCanvasElement): void {
  const renderer = cancellationParticleRenderers.get(canvas);

  if (renderer !== undefined) {
    renderer.dispose();
    cancellationParticleRenderers.delete(canvas);
  }

  canvas.remove();
}

function clearCancellationParticles(demo: HTMLElement): void {
  demo
    .querySelectorAll<HTMLCanvasElement>(
      "[data-kp-equation-motion-webgl-particles]"
    )
    .forEach(disposeCancellationParticleCanvas);
  demo
    .querySelectorAll<HTMLElement>(
      "[data-kp-equation-motion-particles], [data-kp-equation-motion-particle]"
    )
    .forEach((element) => element.remove());
}

function createFinalSimplifyMotionGroup(
  plan: EquationMotionPlan,
  context: EquationMotionRenderContext
): FinalSimplifyMotionGroup | undefined {
  const sourceEntries = plan.tokens.flatMap((token) => {
    if (
      token.lifecycle !== "simplify-into" ||
      token.sourceMotionId === undefined
    ) {
      return [];
    }

    const sourceToken = context.planSourceTokens.get(token.sourceMotionId);

    return sourceToken === undefined
      ? []
      : [{ tokenId: token.id, sourceToken }];
  });
  const targetEntry = plan.tokens.find(
    (token) => token.lifecycle === "enter" && token.targetMotionId !== undefined
  );
  const targetToken =
    targetEntry?.targetMotionId === undefined
      ? undefined
      : context.planTargetTokens.get(targetEntry.targetMotionId);

  if (
    sourceEntries.length === 0 ||
    targetEntry === undefined ||
    targetToken === undefined
  ) {
    return undefined;
  }

  const geometry = collapseMotionGeometryForTokens(
    sourceEntries.map((entry) => entry.sourceToken)
  );

  return {
    sourceTokenIds: new Set(sourceEntries.map((entry) => entry.tokenId)),
    targetTokenId: targetEntry.id,
    midpoint: geometry.midpoint,
    maxDistance: geometry.maxDistance
  };
}

function finalSimplifySourceTokenPose(
  token: StableMotionToken,
  group: FinalSimplifyMotionGroup,
  progress: number,
  collapseScale: number
): MotionPose {
  return collapseTokenToMidpointPose(token, group, progress, {
    meetBeatId: "final-simplify-meet",
    collapseBeatId: "final-simplify-collapse",
    collapseScale
  });
}

function finalSimplifyTargetTokenPose(
  token: StableMotionToken,
  group: FinalSimplifyMotionGroup,
  pose: MotionPose,
  progress: number,
  collapseScale: number
): MotionPose {
  const revealProgress = easedProgressBetweenSemanticBeat(
    EQUATION_MOTION_BEAT_TIMELINE,
    progress,
    "final-simplify-reveal"
  );
  const center = stableTokenCenter(token);
  const midpointOffset = {
    x: group.midpoint.x - center.x,
    y: group.midpoint.y - center.y
  };

  return {
    ...pose,
    opacity: revealProgress,
    x: midpointOffset.x * (1 - revealProgress),
    y: midpointOffset.y * (1 - revealProgress),
    scale: interpolateNumber(collapseScale, pose.scale, revealProgress)
  };
}

function collapseMotionGeometryForTokens(
  tokens: readonly StableMotionToken[]
): CollapseMotionGeometry {
  const centers = tokens.map(stableTokenCenter);

  if (centers.length === 0) {
    return { midpoint: { x: 0, y: 0 }, maxDistance: 0 };
  }

  const bounds = centers.reduce(
    (nextBounds, center) => ({
      minX: Math.min(nextBounds.minX, center.x),
      maxX: Math.max(nextBounds.maxX, center.x),
      minY: Math.min(nextBounds.minY, center.y),
      maxY: Math.max(nextBounds.maxY, center.y)
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY
    }
  );
  const midpoint = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2
  };

  return {
    midpoint,
    maxDistance: centers.reduce(
      (maxDistance, center) =>
        Math.max(maxDistance, pointDistance(center, midpoint)),
      0
    )
  };
}

function collapseTokenToMidpointPose(
  token: StableMotionToken,
  geometry: CollapseMotionGeometry,
  progress: number,
  beats: {
    readonly meetBeatId: SemanticBeatId;
    readonly collapseBeatId: SemanticBeatId;
    readonly collapseScale: number;
  }
): MotionPose {
  const center = stableTokenCenter(token);
  const startDistance = pointDistance(center, geometry.midpoint);
  const baseMoveProgress = easedProgressBetweenSemanticBeat(
    EQUATION_MOTION_BEAT_TIMELINE,
    progress,
    beats.meetBeatId
  );
  const moveProgress = distanceAwareConvergenceProgress(
    baseMoveProgress,
    center,
    geometry.midpoint,
    startDistance,
    geometry.maxDistance
  );
  const shrinkProgress = easedProgressBetweenSemanticBeat(
    EQUATION_MOTION_BEAT_TIMELINE,
    progress,
    beats.meetBeatId
  );
  const fadeProgress = easedProgressBetweenSemanticBeat(
    EQUATION_MOTION_BEAT_TIMELINE,
    progress,
    beats.collapseBeatId
  );
  const scale = interpolateNumber(1, beats.collapseScale, shrinkProgress);

  return {
    opacity: 1 - fadeProgress,
    x: (geometry.midpoint.x - center.x) * moveProgress,
    y: (geometry.midpoint.y - center.y) * moveProgress,
    scale
  };
}

function distanceAwareConvergenceProgress(
  progress: number,
  center: MotionPoint,
  midpoint: MotionPoint,
  startDistance: number,
  maxDistance: number
): number {
  if (startDistance <= 0 || maxDistance <= 0) {
    return progress;
  }

  const distanceRatio = clampNumber(startDistance / maxDistance, 0, 1);
  // This breaks the visual "scaled box" read while keeping every token at the midpoint on the same beat.
  const sideBias = convergenceSideBias(center, midpoint);
  const exponent = clampNumber(
    interpolateNumber(1.35, 0.72, distanceRatio) + sideBias,
    0.54,
    1.5
  );

  return clampNumber(Math.pow(progress, exponent), 0, 1);
}

function convergenceSideBias(
  center: MotionPoint,
  midpoint: MotionPoint
): number {
  const horizontalDelta = center.x - midpoint.x;
  const verticalDelta = center.y - midpoint.y;
  const dominantDelta =
    Math.abs(horizontalDelta) >= Math.abs(verticalDelta)
      ? horizontalDelta
      : verticalDelta;

  if (Math.abs(dominantDelta) <= 0.001) {
    return 0;
  }

  return dominantDelta < 0 ? 0.18 : -0.18;
}

function clearLiquidMerge(demo: HTMLElement): void {
  demo
    .querySelectorAll<HTMLCanvasElement>(
      "[data-kp-equation-motion-liquid-merge]"
    )
    .forEach((canvas) => canvas.remove());
}

function stableTokenCenter(token: StableMotionToken): MotionPoint {
  return {
    x: token.localRect.left + token.localRect.width / 2,
    y: token.localRect.top + token.localRect.height / 2
  };
}

function pointDistance(from: MotionPoint, to: MotionPoint): number {
  return Math.hypot(from.x - to.x, from.y - to.y);
}

function addedObjectPose(pose: MotionPose, progress: number): MotionPose {
  const entryProgress = easedProgressBetweenSemanticBeat(
    EQUATION_MOTION_BEAT_TIMELINE,
    progress,
    "introduced-token-enter"
  );

  return {
    ...pose,
    opacity: pose.opacity * entryProgress,
    scale: interpolateNumber(
      EQUATION_MOTION_ENTER_INITIAL_SCALE,
      pose.scale,
      entryProgress
    )
  };
}

function interpolateNumber(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function formatEquationMotionProgress(progress: number): string {
  if (Number.isInteger(progress)) {
    return String(progress);
  }

  return String(Number(progress.toFixed(6)));
}

function formatPixel(value: number): string {
  return `${formatEquationMotionProgress(value)}px`;
}
