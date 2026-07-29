export const kpExecutableSuccessorMotifProgramSchemaVersion =
  "kp.executable-successor-motif-program.v1" as const;

export const kpExecutableSuccessorMotifProgramVersion = "1.0.0" as const;

declare const kpVerifiedExecutableSuccessorMotifProgramAuthority:
unique symbol;

export type KpExecutableSuccessorMotifProgramKind =
  | "operation-evaluation"
  | "identity-fission"
  | "identity-fusion";

export type KpExecutableSuccessorMotifSemanticRole =
  | "material-input"
  | "causal-catalyst"
  | "result-material"
  | "source-identity"
  | "descendant-identity"
  | "contributor-identity"
  | "result-identity"
  | "continuant-context";

export type KpExecutableSuccessorMotifPhaseEffect =
  | "orient"
  | "converge"
  | "recognize-result"
  | "branch-identity"
  | "establish-descendants"
  | "gather-identities"
  | "establish-ancestor"
  | "settle";

export interface KpExecutableSuccessorMotifPhase<
  Id extends string,
  Effect extends KpExecutableSuccessorMotifPhaseEffect,
  Role extends KpExecutableSuccessorMotifSemanticRole
> {
  readonly id: Id;
  readonly effect: Effect;
  readonly requiredRoles: readonly Role[];
}

export interface KpExecutableSuccessorMotifProgramDraftBase {
  readonly schemaVersion:
    typeof kpExecutableSuccessorMotifProgramSchemaVersion;
  readonly programVersion: typeof kpExecutableSuccessorMotifProgramVersion;
  readonly id: string;
  readonly context: {
    readonly policy: "preserve-unclaimed-context";
    readonly role: "continuant-context";
  };
  readonly accessibility: {
    readonly narration: "semantic-phase-and-role-summary";
    readonly reducedMotion: "native-checkpoints-with-phase-summary";
  };
  readonly rewind: {
    readonly policy: "exact-phase-reversal";
    readonly restores: "source-roles-lineage-and-context";
  };
  readonly continuity: {
    readonly minimumVisibleInk: "motif-specific";
    readonly intentionalVanish: "forbidden";
    readonly endpointSettlement: "exact-native-source-and-target";
  };
}

export type KpOperationEvaluationMotifPhases = readonly [
  KpExecutableSuccessorMotifPhase<
      "orient-contributors",
      "orient",
      "material-input" | "causal-catalyst" | "continuant-context"
    >,
  KpExecutableSuccessorMotifPhase<
      "gather-contributors",
      "converge",
      "material-input" | "causal-catalyst"
    >,
  KpExecutableSuccessorMotifPhase<
      "recognize-result",
      "recognize-result",
      "material-input" | "causal-catalyst" | "result-material"
    >,
  KpExecutableSuccessorMotifPhase<
      "settle-result",
      "settle",
      "result-material" | "continuant-context"
    >
];

export type KpOperationEvaluationMotifPhase =
  KpOperationEvaluationMotifPhases[number];

export interface KpOperationEvaluationMotifProgramDraft extends
KpExecutableSuccessorMotifProgramDraftBase {
  readonly kind: "operation-evaluation";
  readonly phases: KpOperationEvaluationMotifPhases;
  readonly allowedRoles: readonly [
    "material-input",
    "causal-catalyst",
    "result-material",
    "continuant-context"
  ];
  readonly lineage: {
    readonly material: "many-inputs-to-one-result";
    readonly catalyst: "participates-without-result-lineage";
    readonly context: "identity-preserving";
  };
}

export type KpIdentityFissionMotifPhases = readonly [
  KpExecutableSuccessorMotifPhase<
      "orient-source-identity",
      "orient",
      "source-identity" | "continuant-context"
    >,
  KpExecutableSuccessorMotifPhase<
      "branch-identity",
      "branch-identity",
      "source-identity" | "descendant-identity"
    >,
  KpExecutableSuccessorMotifPhase<
      "establish-descendants",
      "establish-descendants",
      "descendant-identity"
    >,
  KpExecutableSuccessorMotifPhase<
      "settle-descendants",
      "settle",
      "descendant-identity" | "continuant-context"
    >
];

export type KpIdentityFissionMotifPhase =
  KpIdentityFissionMotifPhases[number];

export interface KpIdentityFissionMotifProgramDraft extends
KpExecutableSuccessorMotifProgramDraftBase {
  readonly kind: "identity-fission";
  readonly phases: KpIdentityFissionMotifPhases;
  readonly allowedRoles: readonly [
    "source-identity",
    "descendant-identity",
    "continuant-context"
  ];
  readonly lineage: {
    readonly identity: "one-source-to-many-exact-descendants";
    readonly descendantCardinality: "two-or-more";
    readonly context: "identity-preserving";
  };
}

export type KpIdentityFusionMotifPhases = readonly [
  KpExecutableSuccessorMotifPhase<
      "orient-contributor-identities",
      "orient",
      "contributor-identity" | "continuant-context"
    >,
  KpExecutableSuccessorMotifPhase<
      "gather-identities",
      "gather-identities",
      "contributor-identity" | "result-identity"
    >,
  KpExecutableSuccessorMotifPhase<
      "establish-ancestor",
      "establish-ancestor",
      "contributor-identity" | "result-identity"
    >,
  KpExecutableSuccessorMotifPhase<
      "settle-ancestor",
      "settle",
      "result-identity" | "continuant-context"
    >
];

export type KpIdentityFusionMotifPhase =
  KpIdentityFusionMotifPhases[number];

export interface KpIdentityFusionMotifProgramDraft extends
KpExecutableSuccessorMotifProgramDraftBase {
  readonly kind: "identity-fusion";
  readonly phases: KpIdentityFusionMotifPhases;
  readonly allowedRoles: readonly [
    "contributor-identity",
    "result-identity",
    "continuant-context"
  ];
  readonly lineage: {
    readonly identity: "many-contributors-to-one-exact-ancestor";
    readonly contributorCardinality: "two-or-more";
    readonly context: "identity-preserving";
  };
}

/**
 * The closed union is intentionally renderer-neutral. It owns semantic phase
 * order and obligations, while the compositor remains the sole authority for
 * DOM, measured geometry, paths, pixels, timing, and endpoint handoff.
 */
export type KpExecutableSuccessorMotifProgramDraft =
  | KpOperationEvaluationMotifProgramDraft
  | KpIdentityFissionMotifProgramDraft
  | KpIdentityFusionMotifProgramDraft;

/**
 * Only the trusted validator introduced in the next slice may add this private
 * authority. Labels and structurally plausible object literals cannot become
 * executable merely through a cast-free assignment.
 */
export type KpVerifiedExecutableSuccessorMotifProgram =
  KpExecutableSuccessorMotifProgramDraft & {
    readonly [kpVerifiedExecutableSuccessorMotifProgramAuthority]: true;
  };
