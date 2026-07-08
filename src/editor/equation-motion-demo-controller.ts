import {
  createEquationOperationTransition,
  type EquationOperation
} from "../math/equation-transform.ts";
import { measureAnnotatedEquationMotionTokens } from "../rendering/equation-motion-dom.ts";
import { createEquationMotionPlan } from "../rendering/equation-motion-plan.ts";
import { createEquationMotionPlayer } from "../rendering/equation-motion-player.ts";

// Semantic operations are the playback contract; DOM LaTeX is validated against them.
const EQUATION_MOTION_DEMO_OPERATIONS: readonly EquationOperation[] = [
  {
    kind: "subtractBothSides",
    valueLatex: "3"
  },
  {
    kind: "simplifySide",
    side: "left",
    rule: "cancel-additive-inverse"
  },
  {
    kind: "simplifySide",
    side: "right",
    rule: "evaluate-constant-difference"
  }
];

export function hydrateEquationMotionDemos(root: ParentNode): void {
  root
    .querySelectorAll<HTMLElement>("[data-kp-equation-motion-demo]")
    .forEach((demo) => {
      syncEquationMotionActiveState(demo, readEquationMotionStep(demo));
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

export function setEquationMotionProgress(
  demo: HTMLElement,
  progress: number
): void {
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
        transition.sourceStep,
        transition.targetStep,
        frame.progress,
        frame.tokens.length
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

function playEquationMotionDemoTransition(
  demo: HTMLElement,
  sourceStep: number,
  targetStep: number
): void {
  const plan = createDemoEquationMotionTransition(demo, sourceStep, targetStep);
  const player = createEquationMotionPlayer(plan, {
    render: (frame) => {
      renderEquationMotionFrame(
        demo,
        sourceStep,
        targetStep,
        frame.progress,
        frame.tokens.length
      );
    }
  });

  demo.dataset["kpEquationMotionLatestSource"] = String(sourceStep);
  demo.dataset["kpEquationMotionLatestTarget"] = String(targetStep);

  if (sourceStep < targetStep) {
    player.setProgress(0);
    player.playTo(1, { steps: 4 });
  } else {
    player.setProgress(1);
    player.rewindTo(0, { steps: 4 });
  }

  demo.dataset["kpEquationMotionStep"] = String(targetStep);
  syncEquationMotionActiveState(demo, targetStep);
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
  const operation = EQUATION_MOTION_DEMO_OPERATIONS[lowerStep];
  const sourceState = findEquationMotionState(demo, lowerStep);
  const targetState = findEquationMotionState(demo, lowerStep + 1);

  if (
    operation === undefined ||
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

  const semanticTransition = createEquationOperationTransition({
    sourceLatex,
    operation
  });

  if (semanticTransition.targetLatex !== expectedTargetLatex) {
    throw new Error("Equation motion state does not match semantic operation.");
  }

  return createEquationMotionPlan(semanticTransition);
}

function renderEquationMotionFrame(
  demo: HTMLElement,
  sourceStep: number,
  targetStep: number,
  progress: number,
  sampledTokenCount: number
): void {
  const sourceState = findEquationMotionState(demo, sourceStep);
  const targetState = findEquationMotionState(demo, targetStep);

  if (sourceState === undefined || targetState === undefined) {
    return;
  }

  const sourceTokens = measureAnnotatedEquationMotionTokens(sourceState);
  const targetTokens = measureAnnotatedEquationMotionTokens(targetState);
  const directionalProgress =
    sourceStep < targetStep ? progress : 1 - progress;

  demo.dataset["kpEquationMotionLastRenderer"] = "operation-plan";
  demo.dataset["kpEquationMotionPlanProgress"] =
    formatEquationMotionProgress(progress);
  demo.dataset["kpEquationMotionProgress"] =
    formatEquationMotionProgress(directionalProgress);
  demo.dataset["kpEquationMotionSampledTokenCount"] =
    String(sampledTokenCount);
  demo.dataset["kpEquationMotionSourceAnchorCount"] =
    String(sourceTokens.length);
  demo.dataset["kpEquationMotionTargetAnchorCount"] =
    String(targetTokens.length);
}

function syncEquationMotionActiveState(
  demo: HTMLElement,
  activeStep: number
): void {
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

function formatEquationMotionProgress(progress: number): string {
  if (Number.isInteger(progress)) {
    return String(progress);
  }

  return String(Number(progress.toFixed(6)));
}
