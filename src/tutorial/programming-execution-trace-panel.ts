import type { KpProgrammingExecutionTraceFrame } from
  "../domain-ir/programming-execution-trace.ts";
import {
  escapeKpTutorialHtmlAttribute as escapeAttr,
  escapeKpTutorialHtmlText as escapeHtml
} from "./generated-html-escaping.ts";

export function renderKpProgrammingExecutionTracePanelHtml(
  frame: KpProgrammingExecutionTraceFrame
): string {
  return [
    `<section class="kp-tutorial-card__panel" data-kp-tutorial-panel="execution-trace" data-kp-tutorial-execution-trace="${escapeAttr(frame.traceId)}" data-kp-tutorial-execution-source-file="${escapeAttr(frame.sourceFileId)}" data-kp-tutorial-execution-clock="${escapeAttr(frame.sharedClockId)}" data-kp-tutorial-execution-progress="${escapeAttr(String(frame.progress))}" data-kp-tutorial-execution-step-index="${frame.stepIndex}" data-kp-tutorial-execution-step="${escapeAttr(frame.stepId)}" data-kp-tutorial-execution-kind="${escapeAttr(frame.kind)}" data-kp-tutorial-execution-selector-count="${frame.activeSelectorIds.length}" data-kp-tutorial-execution-stack-count="${frame.stack.length}" data-kp-tutorial-execution-local-count="${frame.locals.length}" data-kp-tutorial-execution-output-count="${frame.output.length}">`,
    `  <div class="kp-tutorial-card__trace-step" data-kp-tutorial-execution-step-summary>${escapeHtml(frame.summary ?? frame.stepId)}</div>`,
    renderActiveSelectors(frame),
    renderStack(frame),
    renderLocals(frame),
    renderOutput(frame),
    `</section>`
  ].join("\n");
}

function renderActiveSelectors(frame: KpProgrammingExecutionTraceFrame): string {
  return [
    `  <ol class="kp-tutorial-card__trace-selectors" data-kp-tutorial-execution-active-selectors>`,
    ...frame.activeSelectorIds.map(
      (selectorId) =>
        `    <li data-kp-tutorial-execution-active-selector="${escapeAttr(selectorId)}">${escapeHtml(selectorId)}</li>`
    ),
    `  </ol>`
  ].join("\n");
}

function renderStack(frame: KpProgrammingExecutionTraceFrame): string {
  return [
    `  <ol class="kp-tutorial-card__trace-stack" data-kp-tutorial-execution-stack>`,
    ...frame.stack.map(
      (stackFrame) =>
        `    <li data-kp-tutorial-execution-stack-frame="${escapeAttr(stackFrame.frameId)}" data-kp-tutorial-execution-stack-function="${escapeAttr(stackFrame.functionName)}" data-kp-tutorial-execution-stack-source-file="${escapeAttr(stackFrame.sourceFileId)}"${stackFrame.selectorId === undefined ? "" : ` data-kp-tutorial-execution-stack-selector="${escapeAttr(stackFrame.selectorId)}"`}>${escapeHtml(stackFrame.functionName)}</li>`
    ),
    `  </ol>`
  ].join("\n");
}

function renderLocals(frame: KpProgrammingExecutionTraceFrame): string {
  return [
    `  <dl class="kp-tutorial-card__trace-locals" data-kp-tutorial-execution-locals>`,
    ...frame.locals.map(
      (local) =>
        `    <div data-kp-tutorial-execution-local="${escapeAttr(local.name)}" data-kp-tutorial-execution-local-name="${escapeAttr(local.name)}"${local.type === undefined ? "" : ` data-kp-tutorial-execution-local-type="${escapeAttr(local.type)}"`}><dt>${escapeHtml(local.name)}</dt><dd>${escapeHtml(local.value)}</dd></div>`
    ),
    `  </dl>`
  ].join("\n");
}

function renderOutput(frame: KpProgrammingExecutionTraceFrame): string {
  return `<pre class="kp-tutorial-card__trace-output" data-kp-tutorial-execution-output>${escapeHtml(frame.output.join("\n"))}</pre>`;
}
