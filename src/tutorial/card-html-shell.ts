import type {
  LinearSolveTutorialCardSample,
  LinearSolveTutorialCardSampleFrame
} from "./linear-solve-card-sample.ts";

export function renderKpTutorialCardHtmlShell(
  sample: LinearSolveTutorialCardSample,
  frame: LinearSolveTutorialCardSampleFrame
): string {
  const equationPanelId = frame.equationFrame.panelId;
  const graphPanelId = frame.graphFrame.panelId;

  return [
    `<section class="kp-tutorial-card" data-kp-tutorial-card="${escapeAttr(sample.id)}" data-kp-tutorial-manifest="${escapeAttr(sample.manifestId)}" data-kp-tutorial-progress="${escapeAttr(String(frame.progress))}" data-kp-tutorial-clock="${escapeAttr(frame.cardFrame.parentTimelineFrame.timelineId)}" data-kp-tutorial-diagnostics="${frame.diagnostics.length}">`,
    `  <header class="kp-tutorial-card__header">`,
    `    <h2>${escapeHtml("Solve x + 3 = 7")}</h2>`,
    `  </header>`,
    `  <div class="kp-tutorial-card__layout" data-kp-tutorial-layout="${escapeAttr(frame.cardFrame.layoutFrame.sampleId)}">`,
    `    <section class="kp-tutorial-card__panel" data-kp-tutorial-panel="equation" data-kp-tutorial-panel-id="${escapeAttr(equationPanelId)}" data-kp-tutorial-equation-animation="${escapeAttr(frame.equationFrame.animationId)}" data-kp-tutorial-equation-transition-index="${frame.equationFrame.transitionIndex}" data-kp-tutorial-equation-progress="${escapeAttr(String(frame.equationFrame.transitionProgress))}" data-kp-tutorial-equation-token-count="${frame.equationFrame.equationFrame.tokens.length}">`,
    `      <div class="kp-tutorial-card__slot" data-kp-tutorial-equation-slot data-kp-tutorial-equation-frame>${renderEquationFrameSummary(frame)}</div>`,
    `    </section>`,
    `    <section class="kp-tutorial-card__panel" data-kp-tutorial-panel="graph" data-kp-tutorial-panel-id="${escapeAttr(graphPanelId)}" data-kp-tutorial-graph-id="${escapeAttr(frame.graphFrame.graphId)}" data-kp-tutorial-graph-surface-mode="${escapeAttr(frame.graphFrame.surfaceMode)}" data-kp-tutorial-graph-progress="${escapeAttr(String(frame.graphFrame.graphProgress))}" data-kp-tutorial-graph-channel-count="${frame.graphFrame.graphFrame.channels.length}" data-kp-tutorial-graph-vertex-count="${graphVertexCount(frame)}">`,
    `      <div class="kp-tutorial-card__slot" data-kp-tutorial-graph-slot data-kp-tutorial-graph-frame>${renderGraphFrameSummary(frame)}</div>`,
    `    </section>`,
    `  </div>`,
    `  <div class="kp-tutorial-card__controls" data-kp-tutorial-controls data-kp-tutorial-control-count="${frame.cardFrame.layoutFrame.controls.length}"></div>`,
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("\"", "&quot;");
}
