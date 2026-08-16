import type { KpAnimationSampler } from "../animation/kernel.ts";
import {
  renderKpTutorialSourceFilePanelHtml
} from "./card-html-shell.ts";
import {
  escapeKpTutorialHtmlAttribute as escapeAttr,
  escapeKpTutorialHtmlText as escapeHtml
} from "./generated-html-escaping.ts";
import {
  createAdditionProgrammingExecutionTraceFixture,
  type AdditionProgrammingExecutionTraceFixture
} from "../domain-ir/programming-addition-trace-fixture.ts";
import {
  renderKpProgrammingExecutionTracePanelHtml
} from "./programming-execution-trace-panel.ts";
import {
  createAdditionProgrammingTutorialCardSample,
  type ProgrammingTutorialCardSample
} from "./programming-card-sample.ts";
import type { KpProgrammingExecutionTraceFrame } from
  "../domain-ir/programming-execution-trace.ts";
import type { KpTutorialSourceFileFrame } from "./source-file-frame-adapter.ts";

export interface ProgrammingExecutionTraceTutorialCardSample
  extends KpAnimationSampler<ProgrammingExecutionTraceTutorialCardSampleFrame> {
  readonly id: "tutorial.programming.add.execution-trace.card.live-sample";
  readonly manifestId: "tutorial.programming.add.execution-trace.card";
  readonly title: string;
  readonly sourceSample: ProgrammingTutorialCardSample;
  readonly traceFixture: AdditionProgrammingExecutionTraceFixture;
  readonly diagnostics: readonly string[];
}

export interface ProgrammingExecutionTraceTutorialCardSampleFrame {
  readonly progress: number;
  readonly sourceFrame: KpTutorialSourceFileFrame;
  readonly traceFrame: KpProgrammingExecutionTraceFrame;
  readonly diagnostics: readonly string[];
}

export function createAdditionProgrammingExecutionTraceTutorialCardSample(): ProgrammingExecutionTraceTutorialCardSample {
  const sourceSample = createAdditionProgrammingTutorialCardSample();
  const traceFixture = createAdditionProgrammingExecutionTraceFixture();
  const diagnostics =
    sourceSample.panel.sharedClockId === traceFixture.trace.sharedClockId
      ? []
      : [
          `Programming execution trace ${traceFixture.trace.traceId} uses ${traceFixture.trace.sharedClockId} but source panel uses ${sourceSample.panel.sharedClockId}.`
        ];

  return {
    id: "tutorial.programming.add.execution-trace.card.live-sample",
    manifestId: "tutorial.programming.add.execution-trace.card",
    title: "Trace add(a, b)",
    sourceSample,
    traceFixture,
    diagnostics,
    sample(progress) {
      const sourceFrame = sourceSample.sourceAdapter.sample(progress);
      const traceFrame = traceFixture.sample(sourceFrame.progress);

      return {
        progress: sourceFrame.progress,
        sourceFrame,
        traceFrame,
        diagnostics
      };
    }
  };
}

export function renderKpProgrammingExecutionTraceTutorialCardHtmlShell(
  sample: ProgrammingExecutionTraceTutorialCardSample,
  frame: ProgrammingExecutionTraceTutorialCardSampleFrame
): string {
  return [
    `<section class="kp-tutorial-card" data-kp-tutorial-card="${escapeAttr(sample.id)}" data-kp-tutorial-manifest="${escapeAttr(sample.manifestId)}" data-kp-tutorial-progress="${escapeAttr(String(frame.progress))}" data-kp-tutorial-clock="${escapeAttr(frame.sourceFrame.sharedClockId)}" data-kp-tutorial-diagnostics="${frame.diagnostics.length}">`,
    `  <header class="kp-tutorial-card__header">`,
    `    <h2>${escapeHtml(sample.title)}</h2>`,
    `  </header>`,
    `  <div class="kp-tutorial-card__layout" data-kp-tutorial-layout="layout.programming.add.execution-trace">`,
    `    ${renderKpTutorialSourceFilePanelHtml(frame.sourceFrame)}`,
    `    ${renderKpProgrammingExecutionTracePanelHtml(frame.traceFrame)}`,
    `  </div>`,
    `</section>`
  ].join("\n");
}
