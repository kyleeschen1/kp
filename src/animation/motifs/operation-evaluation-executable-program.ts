import {
  registerKpVerifiedExecutableSuccessorMotifProgramAuthority
} from "./executable-successor-motif-program-authority.ts";
import type {
  KpOperationEvaluationMotifProgramDraft,
  KpVerifiedExecutableSuccessorMotifProgram
} from "./executable-successor-motif-program.ts";

/**
 * Constructs the one source-controlled operation-evaluation program without
 * loading the generic draft validator into every reader route.
 */
export function createKpCanonicalOperationEvaluationExecutableProgram():
KpVerifiedExecutableSuccessorMotifProgram {
  const program = Object.freeze({
    schemaVersion: "kp.executable-successor-motif-program.v1",
    programVersion: "1.0.0",
    id: "kp.executable-program.operation-evaluation",
    kind: "operation-evaluation",
    allowedRoles: Object.freeze([
      "material-input",
      "causal-catalyst",
      "result-material",
      "continuant-context"
    ]),
    phases: Object.freeze([
      Object.freeze({
        id: "orient-contributors",
        effect: "orient",
        requiredRoles: Object.freeze([
          "material-input",
          "causal-catalyst",
          "continuant-context"
        ] as const)
      }),
      Object.freeze({
        id: "gather-contributors",
        effect: "converge",
        requiredRoles: Object.freeze([
          "material-input",
          "causal-catalyst"
        ] as const)
      }),
      Object.freeze({
        id: "recognize-result",
        effect: "recognize-result",
        requiredRoles: Object.freeze([
          "material-input",
          "causal-catalyst",
          "result-material"
        ] as const)
      }),
      Object.freeze({
        id: "settle-result",
        effect: "settle",
        requiredRoles: Object.freeze([
          "result-material",
          "continuant-context"
        ] as const)
      })
    ]),
    lineage: Object.freeze({
      material: "many-inputs-to-one-result",
      catalyst: "participates-without-result-lineage",
      context: "identity-preserving"
    }),
    context: Object.freeze({
      policy: "preserve-unclaimed-context",
      role: "continuant-context"
    }),
    accessibility: Object.freeze({
      narration: "semantic-phase-and-role-summary",
      reducedMotion: "native-checkpoints-with-phase-summary"
    }),
    rewind: Object.freeze({
      policy: "exact-phase-reversal",
      restores: "source-roles-lineage-and-context"
    }),
    continuity: Object.freeze({
      minimumVisibleInk: "motif-specific",
      intentionalVanish: "forbidden",
      endpointSettlement: "exact-native-source-and-target"
    })
  } satisfies KpOperationEvaluationMotifProgramDraft);
  return registerKpVerifiedExecutableSuccessorMotifProgramAuthority(program);
}
