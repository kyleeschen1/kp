import type {
  LinearSolveTutorialCardSample,
  LinearSolveTutorialCardSampleFrame
} from "./linear-solve-card-sample.ts";
import type { KpTutorialSourceFileFrame } from "./source-file-frame-adapter.ts";
import {
  escapeKpTutorialHtmlAttribute as escapeAttr,
  escapeKpTutorialHtmlText as escapeHtml
} from "./generated-html-escaping.ts";

export function renderKpTutorialCardHtmlShell(
  sample: LinearSolveTutorialCardSample,
  frame: LinearSolveTutorialCardSampleFrame
): string {
  const equationPanelId = frame.equationFrame.panelId;
  const graphPanelId = frame.graphFrame.panelId;
  const fixtureAttr =
    sample.fixtureId === undefined
      ? ""
      : ` data-kp-tutorial-fixture="${escapeAttr(sample.fixtureId)}"`;

  return [
    `<section class="kp-tutorial-card" data-kp-tutorial-card="${escapeAttr(sample.id)}" data-kp-tutorial-manifest="${escapeAttr(sample.manifestId)}" data-kp-tutorial-progress="${escapeAttr(String(frame.progress))}" data-kp-tutorial-clock="${escapeAttr(frame.cardFrame.parentTimelineFrame.timelineId)}" data-kp-tutorial-diagnostics="${frame.diagnostics.length}"${fixtureAttr}>`,
    `  <header class="kp-tutorial-card__header">`,
    `    <h2>${escapeHtml(sample.title)}</h2>`,
    `  </header>`,
    `  <div class="kp-tutorial-card__layout" data-kp-tutorial-layout="${escapeAttr(frame.cardFrame.layoutFrame.sampleId)}">`,
    `    <section class="kp-tutorial-card__panel" data-kp-tutorial-panel="equation" data-kp-tutorial-panel-id="${escapeAttr(equationPanelId)}" data-kp-tutorial-equation-animation="${escapeAttr(frame.equationFrame.animationId)}" data-kp-tutorial-equation-transition-index="${frame.equationFrame.transitionIndex}" data-kp-tutorial-equation-progress="${escapeAttr(String(frame.equationFrame.transitionProgress))}" data-kp-tutorial-equation-token-count="${frame.equationFrame.equationFrame.tokens.length}">`,
    `      <div class="kp-tutorial-card__slot" data-kp-tutorial-equation-slot data-kp-tutorial-equation-frame>${renderEquationFrameSummary(frame)}</div>`,
    `    </section>`,
    `    <section class="kp-tutorial-card__panel" data-kp-tutorial-panel="graph" data-kp-tutorial-panel-id="${escapeAttr(graphPanelId)}" data-kp-tutorial-graph-id="${escapeAttr(frame.graphFrame.graphId)}" data-kp-tutorial-graph-surface-mode="${escapeAttr(frame.graphFrame.surfaceMode)}" data-kp-tutorial-graph-progress="${escapeAttr(String(frame.graphFrame.graphProgress))}" data-kp-tutorial-graph-channel-count="${frame.graphFrame.graphFrame.channels.length}" data-kp-tutorial-graph-vertex-count="${graphVertexCount(frame)}">`,
    `      <div class="kp-tutorial-card__slot" data-kp-tutorial-graph-slot data-kp-tutorial-graph-frame>${renderGraphFrameSummary(frame)}</div>`,
    `    </section>`,
    `  </div>`,
    `  <div class="kp-tutorial-card__controls" data-kp-tutorial-controls data-kp-tutorial-control-count="${frame.cardFrame.layoutFrame.controls.length}">${renderControls(frame)}</div>`,
    `</section>`
  ].join("\n");
}

export function renderKpTutorialSourceFilePanelHtml(
  frame: KpTutorialSourceFileFrame
): string {
  return [
    `<section class="kp-tutorial-card__panel" data-kp-tutorial-panel="code" data-kp-tutorial-panel-id="${escapeAttr(frame.panelId)}" data-kp-tutorial-source-file="${escapeAttr(frame.sourceFileId)}" data-kp-tutorial-source-language="${escapeAttr(frame.language)}" data-kp-tutorial-source-progress="${escapeAttr(String(frame.progress))}" data-kp-tutorial-source-line-count="${frame.lineCount}" data-kp-tutorial-source-selector-count="${frame.selectors.length}">`,
    `  <pre class="kp-tutorial-card__code" data-kp-tutorial-source-file-frame><code>${renderSourceLines(frame)}</code></pre>`,
    `  <div class="kp-tutorial-card__source-selectors" data-kp-tutorial-source-selectors>${renderSourceSelectors(frame)}</div>`,
    `</section>`
  ].join("\n");
}

function renderEquationFrameSummary(
  frame: LinearSolveTutorialCardSampleFrame
): string {
  return [
    `<span data-kp-tutorial-equation-transition>${frame.equationFrame.transitionIndex + 1}</span>`,
    `<span data-kp-tutorial-equation-local-progress>${escapeHtml(String(frame.equationFrame.transitionProgress))}</span>`
  ].join("");
}

function renderGraphFrameSummary(
  frame: LinearSolveTutorialCardSampleFrame
): string {
  return [
    `<span data-kp-tutorial-graph-mode>${escapeHtml(frame.graphFrame.surfaceMode)}</span>`,
    `<span data-kp-tutorial-graph-local-progress>${escapeHtml(String(frame.graphFrame.graphProgress))}</span>`
  ].join("");
}

function graphVertexCount(frame: LinearSolveTutorialCardSampleFrame): number {
  return frame.graphFrame.graphFrame.channels.reduce(
    (total, channel) => total + channel.vertices.length,
    0
  );
}

function renderControls(frame: LinearSolveTutorialCardSampleFrame): string {
  return frame.cardFrame.layoutFrame.controls
    .map((control) => renderControl(frame, control.controlId, control.kind))
    .join("");
}

function renderSourceLines(frame: KpTutorialSourceFileFrame): string {
  return frame.lines
    .map(
      (line, index) =>
        `<span data-kp-tutorial-source-line="${index + 1}">${escapeHtml(line)}</span>`
    )
    .join("\n");
}

function renderSourceSelectors(frame: KpTutorialSourceFileFrame): string {
  return frame.selectors
    .map(
      (selector) =>
        `<span data-kp-tutorial-source-selector="${escapeAttr(selector.selectorId)}" data-kp-tutorial-source-start-offset="${selector.startOffset}" data-kp-tutorial-source-end-offset="${selector.endOffset}" data-kp-tutorial-source-start-line="${selector.start.line}" data-kp-tutorial-source-start-column="${selector.start.column}" data-kp-tutorial-source-end-line="${selector.end.line}" data-kp-tutorial-source-end-column="${selector.end.column}">${escapeHtml(selector.summary ?? selector.text)}</span>`
    )
    .join("");
}

function renderControl(
  frame: LinearSolveTutorialCardSampleFrame,
  controlId: string,
  kind: string
): string {
  const attrs = [
    `data-kp-tutorial-control`,
    `data-kp-tutorial-control-id="${escapeAttr(controlId)}"`,
    `data-kp-tutorial-control-kind="${escapeAttr(kind)}"`,
    `data-kp-tutorial-control-progress="${escapeAttr(String(frame.progress))}"`,
    `data-kp-tutorial-control-beat="${escapeAttr(String(frame.cardFrame.parentTimelineFrame.beat))}"`
  ].join(" ");

  if (kind === "scrubber") {
    return `<input class="kp-tutorial-card__control" type="range" min="0" max="1" step="0.001" value="${escapeAttr(String(frame.progress))}" ${attrs} />`;
  }

  return `<button class="kp-tutorial-card__control" type="button" ${attrs}>${escapeHtml(kind)}</button>`;
}
