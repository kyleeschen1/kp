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
