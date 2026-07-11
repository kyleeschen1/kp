import {
  normalizeAnimationProgress,
  type KpAnimationSampler
} from "../animation/kernel.ts";
import {
  createLinearSolveTutorialCardSample,
  type LinearSolveTutorialCardSample,
  type LinearSolveTutorialCardSampleFrame
} from "./linear-solve-card-sample.ts";
import {
  renderKpTutorialCardHtmlShell
} from "./card-html-shell.ts";
import {
  createAdditionProgrammingExecutionTraceTutorialCardSample,
  renderKpProgrammingExecutionTraceTutorialCardHtmlShell,
  type ProgrammingExecutionTraceTutorialCardSample,
  type ProgrammingExecutionTraceTutorialCardSampleFrame
} from "./programming-execution-trace-card-sample.ts";

export interface LinearSolveProgrammingComparisonSample
  extends KpAnimationSampler<LinearSolveProgrammingComparisonFrame> {
  readonly id: "comparison.linear-solve.programming-trace";
  readonly title: string;
  readonly leftSample: LinearSolveTutorialCardSample;
  readonly rightSample: ProgrammingExecutionTraceTutorialCardSample;
}

export interface LinearSolveProgrammingComparisonFrame {
  readonly progress: number;
  readonly leftFrame: LinearSolveTutorialCardSampleFrame;
  readonly rightFrame: ProgrammingExecutionTraceTutorialCardSampleFrame;
}

export function createLinearSolveProgrammingComparisonSample(): LinearSolveProgrammingComparisonSample {
  const leftSample = createLinearSolveTutorialCardSample();
  const rightSample = createAdditionProgrammingExecutionTraceTutorialCardSample();

  return {
    id: "comparison.linear-solve.programming-trace",
    title: "Linear solve and execution trace",
    leftSample,
    rightSample,
    sample(progress) {
      const normalizedProgress = normalizeAnimationProgress(progress);

      return {
        progress: normalizedProgress,
        leftFrame: leftSample.sample(normalizedProgress),
        rightFrame: rightSample.sample(normalizedProgress)
      };
    }
  };
}

export function renderKpSynchronizedComparisonHtmlShell(
  sample: LinearSolveProgrammingComparisonSample,
  frame: LinearSolveProgrammingComparisonFrame
): string {
  return [
    `<section class="kp-synchronized-comparison" data-kp-synchronized-comparison="${escapeAttr(sample.id)}" data-kp-synchronized-comparison-progress="${escapeAttr(String(frame.progress))}" data-kp-comparison-left-card="${escapeAttr(sample.leftSample.id)}" data-kp-comparison-right-card="${escapeAttr(sample.rightSample.id)}">`,
    `  <header class="kp-synchronized-comparison__header">`,
    `    <h2>${escapeHtml(sample.title)}</h2>`,
    `  </header>`,
    `  <div class="kp-synchronized-comparison__layout">`,
    `    <div class="kp-synchronized-comparison__pane" data-kp-comparison-pane="left">${renderKpTutorialCardHtmlShell(sample.leftSample, frame.leftFrame)}</div>`,
    `    <div class="kp-synchronized-comparison__pane" data-kp-comparison-pane="right">${renderKpProgrammingExecutionTraceTutorialCardHtmlShell(sample.rightSample, frame.rightFrame)}</div>`,
    `  </div>`,
    `</section>`
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("\"", "&quot;");
}
