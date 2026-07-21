export interface KpDevReviewAcceptanceContract {
  readonly id: "kp.dev-review.acceptance.v1";
  readonly canonicalReference: "semantic-reader-restrained-visual-language";
  readonly developmentDefault: true;
  readonly productionExcluded: true;
  readonly acceptanceCriteria: readonly string[];
  readonly privacyExclusions: readonly string[];
  readonly preservationBoundary: readonly string[];
  readonly humanCheckpoint: {
    readonly sliceId: "s20-human-exemplar-checkpoint";
    readonly requiredBefore: readonly string[];
  };
  readonly rollbackUnits: readonly string[];
}

export interface KpDevReviewRoundAcceptanceContract {
  readonly id: "kp.dev-review.round-acceptance.v1";
  readonly sourceAuthority: "append-only-event-history";
  readonly currentStateAuthority: readonly [
    "explicit-round-lifecycle",
    "note-lifecycle-status",
    "per-consumer-cursor"
  ];
  readonly queryCriteria: readonly string[];
  readonly migrationCriteria: readonly string[];
  readonly forbiddenInferences: readonly string[];
  readonly counterSemantics: {
    readonly primary: "new-notes-in-current-round";
    readonly historical: "all-preserved-notes";
  };
  readonly humanCheckpoint: "s27-release-gate-handoff";
}

// This contract keeps review instrumentation subordinate to the learner
// experience: it may observe the runtime, but it cannot become motion authority.
export const kpDevReviewAcceptanceContract: KpDevReviewAcceptanceContract =
  Object.freeze({
    id: "kp.dev-review.acceptance.v1",
    canonicalReference: "semantic-reader-restrained-visual-language",
    developmentDefault: true,
    productionExcluded: true,
    acceptanceCriteria: Object.freeze([
      "one-action-comment-capture",
      "snapshot-locked-at-panel-open",
      "append-only-restart-safe-persistence",
      "stable-review-id",
      "unread-review-log-resumption",
      "zero-learner-layout-shift",
      "zero-production-route-closure"
    ]),
    privacyExclusions: Object.freeze([
      "cookies",
      "browser-history",
      "keystrokes-outside-review-field",
      "arbitrary-dom-dumps",
      "machine-secrets",
      "client-selected-filesystem-paths"
    ]),
    preservationBoundary: Object.freeze([
      "semantic-mathematics",
      "animation-choreography",
      "reader-routing",
      "continuous-scroll-authority",
      "exact-seek-and-rewind",
      "static-and-no-javascript-output",
      "production-reader-budget"
    ]),
    humanCheckpoint: Object.freeze({
      sliceId: "s20-human-exemplar-checkpoint",
      requiredBefore: Object.freeze([
        "generic-development-surface-mount",
        "semantic-editor-integration"
      ])
    }),
    rollbackUnits: Object.freeze([
      "dev-review-client-module",
      "dev-review-server-adapter-and-store",
      "review-log-cli",
      "personal-kp-review-logs-skill"
    ])
  });

// Current state is a projection over durable history. Keeping that distinction
// explicit prevents a convenience query from becoming authority to erase notes.
export const kpDevReviewRoundAcceptanceContract: KpDevReviewRoundAcceptanceContract =
  Object.freeze({
    id: "kp.dev-review.round-acceptance.v1",
    sourceAuthority: "append-only-event-history",
    currentStateAuthority: Object.freeze([
      "explicit-round-lifecycle",
      "note-lifecycle-status",
      "per-consumer-cursor"
    ] as const),
    queryCriteria: Object.freeze([
      "bounded-current-round-default",
      "explicit-historical-query",
      "status-round-route-and-sequence-filters",
      "stable-order-and-next-cursor",
      "no-full-comment-history-required-for-counts"
    ]),
    migrationCriteria: Object.freeze([
      "legacy-sessions-project-to-synthetic-rounds",
      "migration-is-deterministic-and-idempotent",
      "source-event-bytes-remain-unchanged",
      "legacy-note-identities-and-sequences-remain-unchanged"
    ]),
    forbiddenInferences: Object.freeze([
      "age-implies-obsolete",
      "build-mismatch-implies-dismissed",
      "cursor-advance-implies-status-change",
      "round-close-implies-note-deletion",
      "query-omission-implies-history-removal"
    ]),
    counterSemantics: Object.freeze({
      primary: "new-notes-in-current-round",
      historical: "all-preserved-notes"
    }),
    humanCheckpoint: "s27-release-gate-handoff"
  });
