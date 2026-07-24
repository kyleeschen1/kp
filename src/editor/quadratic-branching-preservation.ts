export const KP_QUADRATIC_BRANCHING_ANIMATION_ID =
  "animation.algebra.quadratic.solution-branching";

export interface KpQuadraticBranchingPreservationEntry {
  readonly id: "solve-x" | "derivative" | "radical" | "quadratic";
  readonly animationId: string;
  readonly query: string;
  readonly expectedPlayability: "playable" | "planned-only";
  readonly role:
    | "measured-equation-reference"
    | "equation-graph-reference"
    | "known-residual-boundary"
    | "planned-exemplar";
}

export const KP_QUADRATIC_REJECTED_REVIEW_NOTE_IDS = [
  "review-note.13.mrzhovqp",
  "review-note.14.mrzhpyfl",
  "review-note.15.mrzhrkn1",
  "review-note.16.mrzhso4i",
  "review-note.17.mrzhtbuc",
  "review-note.18.mrzhv5t8",
  "review-note.19.mrzhx526",
  "review-note.20.mrzhxsef"
] as const;

export interface KpQuadraticExemplarReviewLedger {
  readonly schemaVersion: "kp.quadratic-exemplar-review-ledger.v1";
  readonly checkpointStatus: "rejected";
  readonly reviewNoteIds: typeof KP_QUADRATIC_REJECTED_REVIEW_NOTE_IDS;
  readonly acceptedBoundaries: readonly [
    "exact-semantic-authority",
    "plus-minus-branch-identity",
    "branch-graph-correspondence",
    "shared-runtime-and-review-lifecycle"
  ];
  readonly rejectedBoundaries: readonly [
    "generic-checkpoint-symbol-motion",
    "compound-operation-omission",
    "standalone-visible-solution-set-reunion"
  ];
  readonly publicationGate: {
    readonly status: "blocked";
    readonly requires: "renewed-human-exemplar-approval";
    readonly successorContract:
      "run-contract.kp.quadratic-operation-presentation-governance-v0";
  };
}

const entries = [
  {
    id: "solve-x",
    animationId: "animation.linear-solve.solve-x",
    query: "solve",
    expectedPlayability: "playable",
    role: "measured-equation-reference"
  },
  {
    id: "derivative",
    animationId: "animation.derivative-rules.tangent-graph",
    query: "tangent",
    expectedPlayability: "playable",
    role: "equation-graph-reference"
  },
  {
    id: "radical",
    animationId: "animation.generated.radical.square-root-as-power",
    query: "radical",
    expectedPlayability: "playable",
    role: "known-residual-boundary"
  },
  {
    id: "quadratic",
    animationId: KP_QUADRATIC_BRANCHING_ANIMATION_ID,
    query: "quadratic",
    expectedPlayability: "planned-only",
    role: "planned-exemplar"
  }
] as const satisfies readonly KpQuadraticBranchingPreservationEntry[];

export function createKpQuadraticBranchingPreservationManifest(): {
  readonly schemaVersion: "kp.quadratic-branching-preservation.v1";
  readonly entries: readonly KpQuadraticBranchingPreservationEntry[];
  readonly radicalResidualSource: string;
} {
  return {
    schemaVersion: "kp.quadratic-branching-preservation.v1",
    entries,
    radicalResidualSource:
      "docs/project/decisions/2026-07-24-kp-radical-cross-renderer-handoff-residual.md"
  };
}

export function createKpQuadraticExemplarReviewLedger(): KpQuadraticExemplarReviewLedger {
  return {
    schemaVersion: "kp.quadratic-exemplar-review-ledger.v1",
    checkpointStatus: "rejected",
    reviewNoteIds: KP_QUADRATIC_REJECTED_REVIEW_NOTE_IDS,
    acceptedBoundaries: [
      "exact-semantic-authority",
      "plus-minus-branch-identity",
      "branch-graph-correspondence",
      "shared-runtime-and-review-lifecycle"
    ],
    rejectedBoundaries: [
      "generic-checkpoint-symbol-motion",
      "compound-operation-omission",
      "standalone-visible-solution-set-reunion"
    ],
    publicationGate: {
      status: "blocked",
      requires: "renewed-human-exemplar-approval",
      successorContract:
        "run-contract.kp.quadratic-operation-presentation-governance-v0"
    }
  };
}
