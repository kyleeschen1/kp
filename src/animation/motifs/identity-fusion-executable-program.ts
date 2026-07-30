import type {
  KpVerifiedExecutableSuccessorMotifProgram
} from "./executable-successor-motif-program.ts";
import {
  validateAndMintKpExecutableSuccessorMotifProgram
} from "./executable-successor-motif-program-validator.ts";

export type KpVerifiedIdentityFusionExecutableProgram =
  KpVerifiedExecutableSuccessorMotifProgram & {
    readonly kind: "identity-fusion";
  };

/**
 * Symbolic and concrete many-to-one identity projections share this semantic
 * program. It fixes contributor simultaneity and phase order while leaving
 * measured paths and endpoint geometry to the canonical compositor.
 */
export const kpIdentityFusionExecutableProgram =
  mintIdentityFusionExecutableProgram();

function mintIdentityFusionExecutableProgram():
KpVerifiedIdentityFusionExecutableProgram {
  const result = validateAndMintKpExecutableSuccessorMotifProgram({
    draft: {
      schemaVersion: "kp.executable-successor-motif-program.v1",
      programVersion: "1.0.0",
      id: "kp.executable-program.identity-fusion",
      kind: "identity-fusion",
      allowedRoles: [
        "contributor-identity",
        "result-identity",
        "continuant-context"
      ],
      phases: [
        {
          id: "orient-contributor-identities",
          effect: "orient",
          requiredRoles: [
            "contributor-identity",
            "continuant-context"
          ]
        },
        {
          id: "gather-identities",
          effect: "gather-identities",
          requiredRoles: [
            "contributor-identity",
            "result-identity"
          ]
        },
        {
          id: "establish-ancestor",
          effect: "establish-ancestor",
          requiredRoles: [
            "contributor-identity",
            "result-identity"
          ]
        },
        {
          id: "settle-ancestor",
          effect: "settle",
          requiredRoles: [
            "result-identity",
            "continuant-context"
          ]
        }
      ],
      lineage: {
        identity: "many-contributors-to-one-exact-ancestor",
        contributorCardinality: "two-or-more",
        context: "identity-preserving"
      },
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
    }
  });
  if (
    result.status !== "verified" ||
    result.program.kind !== "identity-fusion"
  ) {
    const details = result.status === "invalid"
      ? result.issues.map(({ path, message }) =>
          `${path}: ${message}`
        ).join("; ")
      : "validator returned a different program kind";
    throw new Error(
      `Canonical identity-fusion program failed validation: ${details}`
    );
  }
  return result.program;
}
