export interface KpTutorialProgressRailModel {
  readonly blockId: string;
  readonly label: string;
  readonly initialLabel: string;
  readonly progress?: number | undefined;
}

/** Publishes final progress geometry without implying transport or seeking. */
export function renderKpTutorialProgressRail(
  model: KpTutorialProgressRailModel
): string {
  const progress = normalizeProgress(model.progress ?? 0);
  const percent = Math.round(progress * 100);
  return `<kp-tutorial-progress-rail
    data-kp-tutorial-progress-rail="${escapeHtml(model.blockId)}"
    data-kp-tutorial-progress-enhancement="pending"
    progress="${progress}"
    progress-label="${escapeHtml(model.initialLabel)}"
    role="progressbar"
    aria-label="${escapeHtml(model.label)}"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow="${percent}"
    aria-valuetext="${escapeHtml(model.initialLabel)}"
  >
    <span class="kp-tutorial-progress-rail__track" data-kp-tutorial-progress-track aria-hidden="true">
      <span class="kp-tutorial-progress-rail__fill" data-kp-tutorial-progress-fill></span>
    </span>
    <span class="kp-tutorial-progress-rail__status" data-kp-tutorial-progress-status>${percent}% — ${escapeHtml(model.initialLabel)}</span>
  </kp-tutorial-progress-rail>`;
}

function normalizeProgress(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
