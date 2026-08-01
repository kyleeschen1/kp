import type {
  KpExecutableSuccessorMotifPhaseEffect,
  KpExecutableSuccessorMotifProgramKind,
  KpExecutableSuccessorMotifSemanticRole,
  KpVerifiedExecutableSuccessorMotifProgram
} from "./executable-successor-motif-program.ts";
import type {
  KpPerceptualContinuityEndpointMetric,
  KpPerceptualContinuityVisibilityPolicy,
  KpVerifiedPerceptualContinuityContract
} from "../perceptual-continuity-contract-authority.ts";

const verifiedContinuityPrograms = new WeakSet<object>();

export type KpExecutableMotifContinuityTopology =
  | "bounded-semantic-contact-co-presence"
  | "identity-preserving-branch-co-presence"
  | "identity-preserving-gather-co-presence"
  | "shared-zero-area-junction";

export type KpExecutableMotifContinuousTopology =
  Exclude<KpExecutableMotifContinuityTopology, "shared-zero-area-junction">;

export type KpExecutableMotifContinuityObligation =
  | "preserve-native-source-and-context"
  | "maintain-required-role-ink"
  | "co-present-contributors-at-certified-contact"
  | "co-present-source-and-descendants"
  | "co-present-contributors-and-ancestor"
  | "settle-exact-native-target-and-context";

export interface KpExecutableMotifContinuityPhaseBinding {
  readonly phaseId: string;
  readonly phaseEffect: KpExecutableSuccessorMotifPhaseEffect;
  readonly requiredRoles:
    readonly KpExecutableSuccessorMotifSemanticRole[];
  readonly continuityObligation:
    KpExecutableMotifContinuityObligation;
  readonly executionOrdinal: number;
}

export interface KpExecutableMotifContinuityAuthority {
  readonly schemaVersion: "kp.executable-motif-continuity-program.v1";
  readonly kind: "executable-motif-continuity-program";
  readonly program: KpVerifiedExecutableSuccessorMotifProgram;
  readonly programId: string;
  readonly programVersion: string;
  readonly programKind: KpExecutableSuccessorMotifProgramKind;
  readonly topology: KpExecutableMotifContinuousTopology;
  readonly visibility: KpPerceptualContinuityVisibilityPolicy & {
    readonly kind: "continuous-visible-ink";
  };
  readonly endpointMetrics:
    readonly KpPerceptualContinuityEndpointMetric[];
  readonly forwardPhases:
    readonly KpExecutableMotifContinuityPhaseBinding[];
  readonly rewindPhases:
    readonly KpExecutableMotifContinuityPhaseBinding[];
  readonly phaseAuthority: "executable-program-only";
  readonly presentationAuthority: "canonical-compositor-only";
}

/**
 * Authoring retains the complete measurable contract. Reader descriptors use
 * the authority above because playback needs the selected topology and phase
 * obligations, not the evidence matrix that certified them.
 */
export interface KpExecutableMotifContinuityProgram extends
  KpExecutableMotifContinuityAuthority {
  readonly contract: KpVerifiedPerceptualContinuityContract;
}

/**
 * Registers a fully frozen program after validated compilation or closed
 * canonical construction. Architecture checks keep this nominal mint out of
 * ordinary authoring and reader code.
 */
export function registerKpExecutableMotifContinuityProgramAuthority<
  Program extends KpExecutableMotifContinuityAuthority
>(program: Program): Program {
  verifiedContinuityPrograms.add(program);
  return program;
}

export function isKpExecutableMotifContinuityProgram(
  value: unknown
): value is KpExecutableMotifContinuityAuthority {
  return (
    typeof value === "object" &&
    value !== null &&
    verifiedContinuityPrograms.has(value)
  );
}
