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
    `    <section class="kp-tutorial-card__panel" data-kp-tutorial-panel="equation" data-kp-tutorial-panel-id="${escapeAttr(equationPanelId)}" data-kp-tutorial-equation-animation="${escapeAttr(frame.equationFrame.animationId)}">`,
    `      <div class="kp-tutorial-card__slot" data-kp-tutorial-equation-slot></div>`,
    `    </section>`,
    `    <section class="kp-tutorial-card__panel" data-kp-tutorial-panel="graph" data-kp-tutorial-panel-id="${escapeAttr(graphPanelId)}" data-kp-tutorial-graph-id="${escapeAttr(frame.graphFrame.graphId)}" data-kp-tutorial-graph-surface-mode="${escapeAttr(frame.graphFrame.surfaceMode)}">`,
    `      <div class="kp-tutorial-card__slot" data-kp-tutorial-graph-slot></div>`,
    `    </section>`,
    `  </div>`,
    `  <div class="kp-tutorial-card__controls" data-kp-tutorial-controls data-kp-tutorial-control-count="${frame.cardFrame.layoutFrame.controls.length}"></div>`,
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
