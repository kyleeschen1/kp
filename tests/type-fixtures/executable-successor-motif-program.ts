import type {
  KpExecutableSuccessorMotifProgramDraft,
  KpIdentityFissionMotifProgramDraft,
  KpIdentityFusionMotifProgramDraft,
  KpOperationEvaluationMotifProgramDraft,
  KpVerifiedExecutableSuccessorMotifProgram
} from "../../src/animation/motifs/executable-successor-motif-program.ts";

const shared = {
  schemaVersion: "kp.executable-successor-motif-program.v1",
  programVersion: "1.0.0",
  context: {
    policy: "preserve-unclaimed-context",
    role: "continuant-context"
  },
  accessibility: {
    narration: "semantic-phase-and-role-summary",
    reducedMotion: "native-checkpoints-with-phase-summary"
  },
  rewind: {
    policy: "exact-phase-reversal",
    restores: "source-roles-lineage-and-context"
  },
  continuity: {
    minimumVisibleInk: "motif-specific",
    intentionalVanish: "forbidden",
    endpointSettlement: "exact-native-source-and-target"
  }
} as const;

const evaluation = {
  ...shared,
  id: "kp.motif-program.operation-evaluation.v1",
  kind: "operation-evaluation",
  phases: [
    {
      id: "orient-contributors",
      effect: "orient",
      requiredRoles: [
        "material-input",
        "causal-catalyst",
        "continuant-context"
      ]
    },
    {
      id: "gather-contributors",
      effect: "converge",
      requiredRoles: ["material-input", "causal-catalyst"]
    },
    {
      id: "recognize-result",
      effect: "recognize-result",
      requiredRoles: [
        "material-input",
        "causal-catalyst",
        "result-material"
      ]
    },
    {
      id: "settle-result",
      effect: "settle",
      requiredRoles: ["result-material", "continuant-context"]
    }
  ],
  allowedRoles: [
    "material-input",
    "causal-catalyst",
    "result-material",
    "continuant-context"
  ],
  lineage: {
    material: "many-inputs-to-one-result",
    catalyst: "participates-without-result-lineage",
    context: "identity-preserving"
  }
} as const satisfies KpOperationEvaluationMotifProgramDraft;

const fission = {
  ...shared,
  id: "kp.motif-program.identity-fission.v1",
  kind: "identity-fission",
  phases: [
    {
      id: "orient-source-identity",
      effect: "orient",
      requiredRoles: ["source-identity", "continuant-context"]
    },
    {
      id: "branch-identity",
      effect: "branch-identity",
      requiredRoles: ["source-identity", "descendant-identity"]
    },
    {
      id: "establish-descendants",
      effect: "establish-descendants",
      requiredRoles: ["descendant-identity"]
    },
    {
      id: "settle-descendants",
      effect: "settle",
      requiredRoles: ["descendant-identity", "continuant-context"]
    }
  ],
  allowedRoles: [
    "source-identity",
    "descendant-identity",
    "continuant-context"
  ],
  lineage: {
    identity: "one-source-to-many-exact-descendants",
    descendantCardinality: "two-or-more",
    context: "identity-preserving"
  }
} as const satisfies KpIdentityFissionMotifProgramDraft;

const fusion = {
  ...shared,
  id: "kp.motif-program.identity-fusion.v1",
  kind: "identity-fusion",
  phases: [
    {
      id: "orient-contributor-identities",
      effect: "orient",
      requiredRoles: ["contributor-identity", "continuant-context"]
    },
    {
      id: "gather-identities",
      effect: "gather-identities",
      requiredRoles: ["contributor-identity", "result-identity"]
    },
    {
      id: "establish-ancestor",
      effect: "establish-ancestor",
      requiredRoles: ["contributor-identity", "result-identity"]
    },
    {
      id: "settle-ancestor",
      effect: "settle",
      requiredRoles: ["result-identity", "continuant-context"]
    }
  ],
  allowedRoles: [
    "contributor-identity",
    "result-identity",
    "continuant-context"
  ],
  lineage: {
    identity: "many-contributors-to-one-exact-ancestor",
    contributorCardinality: "two-or-more",
    context: "identity-preserving"
  }
} as const satisfies KpIdentityFusionMotifProgramDraft;

const programs: readonly KpExecutableSuccessorMotifProgramDraft[] = [
  evaluation,
  fission,
  fusion
];

const callerAuthoredTiming: KpOperationEvaluationMotifProgramDraft = {
  ...evaluation,
  // @ts-expect-error Motif programs cannot own caller-authored timing.
  durationMs: 800
};

const callerAuthoredPath: KpIdentityFissionMotifProgramDraft = {
  ...fission,
  // @ts-expect-error Motif programs cannot own compositor paths.
  path: "arc-below"
};

const callerAuthoredNotation: KpIdentityFusionMotifProgramDraft = {
  ...fusion,
  // @ts-expect-error Motif programs cannot own notation text or DOM.
  latex: "\\frac{1}{2}"
};

const reorderedEvaluation: KpOperationEvaluationMotifProgramDraft = {
  ...evaluation,
  phases: [
    // @ts-expect-error Phase order is part of the sealed program variant.
    evaluation.phases[1],
    // @ts-expect-error Phase order is part of the sealed program variant.
    evaluation.phases[0],
    evaluation.phases[2],
    evaluation.phases[3]
  ]
};

// @ts-expect-error Only the trusted validator may mint executable authority.
const fabricated: KpVerifiedExecutableSuccessorMotifProgram = evaluation;

declare const verified: KpVerifiedExecutableSuccessorMotifProgram;

if (verified.kind === "operation-evaluation") {
  verified.lineage.catalyst;
  // @ts-expect-error Evaluation has no descendant cardinality.
  verified.lineage.descendantCardinality;
}

if (verified.kind === "identity-fission") {
  verified.lineage.descendantCardinality;
  // @ts-expect-error Fission has no causal catalyst lineage.
  verified.lineage.catalyst;
}

if (verified.kind === "identity-fusion") {
  verified.lineage.contributorCardinality;
  // @ts-expect-error Fusion has no descendant cardinality.
  verified.lineage.descendantCardinality;
}

void [
  programs,
  callerAuthoredTiming,
  callerAuthoredPath,
  callerAuthoredNotation,
  reorderedEvaluation,
  fabricated,
  verified
];
