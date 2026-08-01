import type {
  KpVerifiedExecutableSuccessorMotifProgram
} from "./motifs/executable-successor-motif-program.ts";
import {
  isKpVerifiedExecutableSuccessorMotifProgram
} from "./motifs/executable-successor-motif-program-authority.ts";
import {
  kpOperationEvaluationContinuitySelectedTopology
} from "./operation-evaluation-continuity-topology-id.ts";
import {
  kpPerceptualContinuityEndpointMetrics
} from "./perceptual-continuity-metrics.ts";
import {
  registerKpExecutableMotifContinuityProgramAuthority,
  type KpExecutableMotifContinuityAuthority
} from "./motifs/executable-motif-continuity-program.ts";

export type KpOperationEvaluationContinuityProgram =
  KpExecutableMotifContinuityAuthority & {
    readonly programKind: "operation-evaluation";
    readonly topology: "bounded-semantic-contact-co-presence";
  };

/**
 * Produces the already-approved operation-evaluation runtime artifact. The
 * generic validator and topology comparison remain authoring-only; this seam
 * can mint only their one closed, source-controlled result.
 */
export function createKpCanonicalOperationEvaluationContinuityProgram(
  program: KpVerifiedExecutableSuccessorMotifProgram
): KpOperationEvaluationContinuityProgram {
  if (
    !isKpVerifiedExecutableSuccessorMotifProgram(program) ||
    program.kind !== "operation-evaluation"
  ) {
    throw new Error(
      "Canonical operation-evaluation continuity requires its exact " +
      "verified executable program."
    );
  }
  const obligations = [
    "preserve-native-source-and-context",
    "maintain-required-role-ink",
    "co-present-contributors-at-certified-contact",
    "settle-exact-native-target-and-context"
  ] as const;
  const forwardPhases = program.phases.map(
    (phase, executionOrdinal) => Object.freeze({
      phaseId: phase.id,
      phaseEffect: phase.effect,
      requiredRoles: phase.requiredRoles,
      continuityObligation: obligations[executionOrdinal]!,
      executionOrdinal
    })
  );
  const rewindPhases = [...forwardPhases].reverse().map(
    (phase, executionOrdinal) => Object.freeze({
      ...phase,
      executionOrdinal
    })
  );
  const continuityProgram =
    registerKpExecutableMotifContinuityProgramAuthority(Object.freeze({
      schemaVersion: "kp.executable-motif-continuity-program.v1",
      kind: "executable-motif-continuity-program",
      program,
      programId: program.id,
      programVersion: program.programVersion,
      programKind: "operation-evaluation",
      topology: kpOperationEvaluationContinuitySelectedTopology,
      visibility: Object.freeze({
        kind: "continuous-visible-ink",
        minimumVisibleInkRatio: 0.18
      }),
      endpointMetrics: kpPerceptualContinuityEndpointMetrics,
      forwardPhases: Object.freeze(forwardPhases),
      rewindPhases: Object.freeze(rewindPhases),
      phaseAuthority: "executable-program-only",
      presentationAuthority: "canonical-compositor-only"
    }) as KpOperationEvaluationContinuityProgram);
  return continuityProgram as KpOperationEvaluationContinuityProgram;
}
