export interface KpTutorialScrubBarCheckpoint {
  readonly id: string;
  readonly label: string;
  readonly progress: number;
  readonly href: string;
}

export interface KpTutorialScrubBarModel {
  readonly blockId: string;
  readonly checkpoints: readonly KpTutorialScrubBarCheckpoint[];
  readonly label?: string;
}

/**
 * Produces the complete control geometry before the custom element is
 * registered. Links remain useful without JavaScript; playback and range
 * seeking stay disabled until the element can provide their behavior.
 */
export function renderKpTutorialScrubBar(
  model: KpTutorialScrubBarModel
): string {
  if (model.checkpoints.length === 0) {
    throw new Error("Tutorial scrub bars require at least one checkpoint.");
  }
  const label = model.label ?? "Animation timeline";
  const first = model.checkpoints[0]!;
  const next = model.checkpoints[1] ?? first;
  const marksId = `kp-tutorial-scrub-marks-${safeId(model.blockId)}`;
  return `<kp-tutorial-scrub-bar
    data-kp-tutorial-motion-controls="${escapeHtml(model.blockId)}"
    data-kp-tutorial-scrub-enhancement="pending"
    progress="0"
    playback-status="paused"
    direction="forward"
    controls-disabled="true"
    previous-disabled="true"
    next-disabled="false"
    manual-claimed="false"
    aria-label="${escapeHtml(label)}"
  >
    <div class="kp-tutorial-scrub__boundary" data-kp-tutorial-scrub-static-boundary>
      <div class="kp-tutorial-scrub__controls" role="group" aria-label="${escapeHtml(label)}">
        <a class="kp-tutorial-scrub__action" href="${escapeHtml(first.href)}" data-action="rewind" aria-label="Rewind animation">Rewind</a>
        <a class="kp-tutorial-scrub__action" href="${escapeHtml(first.href)}" data-action="previous" aria-label="Previous semantic checkpoint" aria-keyshortcuts="Alt+ArrowLeft">Previous</a>
        <button class="kp-tutorial-scrub__action" type="button" data-action="toggle" disabled>Play</button>
        <a class="kp-tutorial-scrub__action" href="${escapeHtml(next.href)}" data-action="next" aria-label="Next semantic checkpoint" aria-keyshortcuts="Alt+ArrowRight">Next</a>
        <input data-action="seek" type="range" min="0" max="1" step="0.001" value="0" aria-label="Scrub animation progress" list="${marksId}" disabled />
        <output class="kp-tutorial-scrub__progress" data-progress>0%</output>
        <datalist id="${marksId}">
          ${model.checkpoints.map((checkpoint) => `<option value="${normalizeProgress(checkpoint.progress)}" label="${escapeHtml(checkpoint.label)}"></option>`).join("")}
        </datalist>
      </div>
    </div>
  </kp-tutorial-scrub-bar>`;
}

function safeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
}

function normalizeProgress(value: number): string {
  const finite = Number.isFinite(value) ? value : 0;
  return String(Math.max(0, Math.min(1, finite)));
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
