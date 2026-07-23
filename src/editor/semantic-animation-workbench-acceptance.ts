import type {
  KpAnimationAssetCheckRef
} from "../animation/asset.ts";
import type {
  KpSemanticAnimationWorkbenchIndexEntry
} from "./semantic-animation-workbench-index.ts";

export type KpAnimationAcceptanceEvidenceState =
  | "loading"
  | "available"
  | "unavailable";

export interface KpAnimationAcceptanceCriterion {
  readonly kind: "semantic-law" | "lifecycle" | "review";
  readonly label: string;
  readonly detail: string;
  readonly sourceIds: readonly string[];
}

export interface KpAnimationAcceptanceBrief {
  readonly schemaVersion: "kp.animation-acceptance-brief.v1";
  readonly animationId: string;
  readonly criteria: readonly KpAnimationAcceptanceCriterion[];
  readonly missingEvidence: readonly string[];
}

export function deriveKpAnimationAcceptanceBrief(input: {
  readonly entry: KpSemanticAnimationWorkbenchIndexEntry;
  readonly lawChecks?: readonly KpAnimationAssetCheckRef[];
  readonly lawEvidence: KpAnimationAcceptanceEvidenceState;
}): KpAnimationAcceptanceBrief {
  const criteria: KpAnimationAcceptanceCriterion[] = [];
  const missingEvidence: string[] = [];

  for (const check of input.lawChecks ?? []) {
    criteria.push({
      kind: "semantic-law",
      label: check.summary ?? humanizeLawId(check.lawId),
      detail: [
        check.level,
        check.targetId === undefined ? undefined : `target ${check.targetId}`
      ]
        .filter((value): value is string => value !== undefined)
        .join(" · "),
      sourceIds: [check.id, check.lawId]
    });
  }
  if (input.lawEvidence === "loading") {
    missingEvidence.push("Loading semantic law checks from the animation asset.");
  } else if (
    input.lawEvidence === "unavailable" ||
    (input.lawChecks?.length ?? 0) === 0
  ) {
    missingEvidence.push(
      input.entry.lifecycle.playability === "planned-only"
        ? "Semantic law checks will appear when a concrete animation asset is published."
        : "No semantic law checks are available from the animation asset."
    );
  }

  criteria.push({
    kind: "lifecycle",
    label: "Review at the recorded maturity",
    detail:
      `Maturity ${input.entry.lifecycle.maturity} · approval ${input.entry.lifecycle.approval}.`,
    sourceIds: ["lifecycle.maturity", "lifecycle.approval"]
  });
  criteria.push({
    kind: "lifecycle",
    label: "Confirm current verification evidence",
    detail: `Verification ${input.entry.lifecycle.verification}.`,
    sourceIds: ["lifecycle.verification"]
  });

  const currentFeedback = input.entry.review?.current ?? [];
  for (const evidence of currentFeedback) {
    criteria.push({
      kind: "review",
      label: `Current feedback · ${evidence.status}`,
      detail: evidence.comment,
      sourceIds: [evidence.noteId, evidence.captureIdentity]
    });
  }
  if (currentFeedback.length === 0) {
    missingEvidence.push("No current item-scoped feedback is attached.");
  }

  return {
    schemaVersion: "kp.animation-acceptance-brief.v1",
    animationId: input.entry.identity.animationId,
    criteria,
    missingEvidence
  };
}

export function renderKpAnimationAcceptanceBrief(
  brief: KpAnimationAcceptanceBrief
): string {
  return `<section class="kp-animation-workbench__acceptance" data-kp-animation-workbench-acceptance="${escapeHtml(brief.animationId)}" aria-labelledby="kp-animation-workbench-acceptance-title">
    <div class="kp-animation-workbench__section-heading">
      <p class="eyebrow">Acceptance brief</p>
      <h3 id="kp-animation-workbench-acceptance-title">What to check</h3>
      <p>Derived from the selected animation’s existing evidence.</p>
    </div>
    <ol class="kp-animation-workbench__acceptance-list">
      ${brief.criteria
        .map(
          (criterion) => `<li data-kp-animation-workbench-acceptance-kind="${criterion.kind}">
            <strong>${escapeHtml(criterion.label)}</strong>
            <span>${escapeHtml(criterion.detail)}</span>
            <small>Source: ${criterion.sourceIds.map(escapeHtml).join(" · ")}</small>
          </li>`
        )
        .join("")}
    </ol>
    ${
      brief.missingEvidence.length === 0
        ? ""
        : `<div class="kp-animation-workbench__missing-evidence" data-kp-animation-workbench-missing-evidence>
            <strong>Evidence gaps</strong>
            <ul>${brief.missingEvidence.map((message) => `<li>${escapeHtml(message)}</li>`).join("")}</ul>
          </div>`
    }
  </section>`;
}

function humanizeLawId(lawId: string): string {
  return lawId
    .split(".")
    .filter(Boolean)
    .map((part) => part.replaceAll("-", " "))
    .join(" · ");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
