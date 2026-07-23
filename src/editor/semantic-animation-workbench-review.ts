import type {
  KpAnimationReviewEvidence,
  KpAnimationReviewProjection
} from "./semantic-animation-workbench-review-adapter.ts";

export type KpAnimationWorkbenchReviewPanelState =
  | "loading"
  | "available"
  | "unavailable"
  | "error";

export function renderKpAnimationWorkbenchReviewPanel(input: {
  readonly animationId: string;
  readonly state: KpAnimationWorkbenchReviewPanelState;
  readonly projection?: KpAnimationReviewProjection;
}): string {
  const projection = input.projection;
  return `<section class="kp-animation-workbench__review" data-kp-animation-workbench-review="${escapeHtml(input.animationId)}" data-review-state="${input.state}" aria-labelledby="kp-animation-workbench-review-title">
    <div class="kp-animation-workbench__section-heading">
      <p class="eyebrow">Item-scoped review evidence</p>
      <h3 id="kp-animation-workbench-review-title">Review history</h3>
      <p>${stateMessage(input.state)}</p>
    </div>
    ${
      input.state !== "available"
        ? ""
        : `<div class="kp-animation-workbench__review-columns">
            ${renderEvidenceGroup("Current round", "current", projection?.current ?? [])}
            ${renderEvidenceGroup("Resolved history", "historical", projection?.historical ?? [])}
          </div>`
    }
  </section>`;
}

function renderEvidenceGroup(
  label: string,
  group: "current" | "historical",
  evidence: readonly KpAnimationReviewEvidence[]
): string {
  return `<section data-kp-animation-workbench-review-group="${group}">
    <h4>${label} <span>${evidence.length}</span></h4>
    ${
      evidence.length === 0
        ? `<p class="kp-animation-workbench__review-empty">No ${group === "current" ? "current" : "historical"} notes for this animation.</p>`
        : `<ol>${evidence.map(renderEvidence).join("")}</ol>`
    }
  </section>`;
}

function renderEvidence(evidence: KpAnimationReviewEvidence): string {
  const progress =
    evidence.progressPermille === undefined
      ? ""
      : ` · ${(evidence.progressPermille / 10).toFixed(1)}%`;
  const checkpoint =
    evidence.checkpointId === undefined
      ? ""
      : `<span>Checkpoint <code>${escapeHtml(evidence.checkpointId)}</code></span>`;
  const phase =
    evidence.activePhase === undefined
      ? ""
      : `<span>Phase <code>${escapeHtml(evidence.activePhase)}</code></span>`;
  return `<li data-kp-animation-workbench-review-note="${escapeHtml(evidence.noteId)}" data-review-status="${escapeHtml(evidence.status)}">
    <div class="kp-animation-workbench__review-note-heading">
      <strong>${escapeHtml(evidence.status)}</strong>
      <time datetime="${escapeHtml(evidence.capturedAt)}">${escapeHtml(evidence.capturedAt)}</time>
    </div>
    <p>${escapeHtml(evidence.comment)}</p>
    <div class="kp-animation-workbench__review-provenance">
      ${checkpoint}${phase}
      <span>Build <code>${escapeHtml(evidence.buildFingerprint)}</code>${progress}</span>
      <a href="${safeHref(evidence.route)}">Open captured route</a>
    </div>
  </li>`;
}

function stateMessage(state: KpAnimationWorkbenchReviewPanelState): string {
  switch (state) {
    case "loading":
      return "Loading the existing development review inbox…";
    case "available":
      return "Current and historical notes are isolated by canonical animation identity.";
    case "unavailable":
      return "Review evidence is available only from the local development inbox.";
    case "error":
      return "The development review inbox could not be read.";
  }
}

function safeHref(value: string): string {
  try {
    const url = new URL(value, "http://kp.local");
    return url.protocol === "http:" || url.protocol === "https:"
      ? escapeHtml(value)
      : "#";
  } catch {
    return "#";
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
