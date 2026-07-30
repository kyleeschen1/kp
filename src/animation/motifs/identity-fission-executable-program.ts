import type {
  KpVerifiedExecutableSuccessorMotifProgram
} from "./executable-successor-motif-program.ts";
import {
  validateAndMintKpExecutableSuccessorMotifProgram
} from "./executable-successor-motif-program-validator.ts";

export type KpVerifiedIdentityFissionExecutableProgram =
  KpVerifiedExecutableSuccessorMotifProgram & {
    readonly kind: "identity-fission";
  };

/**
 * Every symbolic or concrete one-to-many identity projection shares this
 * semantic program. The program owns roles and phase order only; renderers
 * retain measured geometry and the existing fission/fusion primitive.
 */
export const kpIdentityFissionExecutableProgram =
  mintIdentityFissionExecutableProgram();

function mintIdentityFissionExecutableProgram():
KpVerifiedIdentityFissionExecutableProgram {
  const result = validateAndMintKpExecutableSuccessorMotifProgram({
    draft: {
      schemaVersion: "kp.executable-successor-motif-program.v1",
      programVersion: "1.0.0",
      id: "kp.executable-program.identity-fission",
      kind: "identity-fission",
      allowedRoles: [
        "source-identity",
        "descendant-identity",
        "continuant-context"
      ],
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
      lineage: {
        identity: "one-source-to-many-exact-descendants",
        descendantCardinality: "two-or-more",
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
    result.program.kind !== "identity-fission"
  ) {
    const details = result.status === "invalid"
      ? result.issues.map(({ path, message }) =>
          `${path}: ${message}`
        ).join("; ")
      : "validator returned a different program kind";
    throw new Error(
      `Canonical identity-fission program failed validation: ${details}`
    );
  }
  return result.program;
}
