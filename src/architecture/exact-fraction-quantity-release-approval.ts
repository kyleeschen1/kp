import {
  kpIdentityFissionExecutableProgram
} from "../animation/motifs/identity-fission-executable-program.ts";
import {
  kpIdentityFusionExecutableProgram
} from "../animation/motifs/identity-fusion-executable-program.ts";
import {
  kpOperationEvaluationExecutableProgramCompiler
} from "../animation/operation-evaluation-presentation-registry.ts";
import {
  certifyKpExecutableMotifPromotionEvidence,
  type KpVerifiedExecutableMotifPromotionCertificate
} from "./executable-motif-promotion-evidence.ts";
import {
  resolveKpExecutableSuccessorMotifProgramRoute
} from "../reader/renderers/executable-successor-motif-program-adapter.ts";
import type {
  KpVerifiedExecutableSuccessorMotifProgram
} from "../animation/motifs/executable-successor-motif-program.ts";

const animationId =
  "animation.exact-fraction-quantity.third-plus-sixth";
const humanApprovalEvidenceSourceId =
  "review.kp.exact-fraction-quantity-persistent-stage-human-checkpoint";

export interface KpVerifiedExactFractionQuantityReleaseApproval {
  readonly schemaVersion:
    "kp.verified-exact-fraction-quantity-release-approval.v1";
  readonly animationId: typeof animationId;
  readonly reviewDecision: "approved-persistent-stage";
  readonly releaseDecision: "passed";
  readonly executableMotifCertificates: readonly [
    KpVerifiedExecutableMotifPromotionCertificate,
    KpVerifiedExecutableMotifPromotionCertificate,
    KpVerifiedExecutableMotifPromotionCertificate
  ];
  readonly evidenceSourceIds: readonly [
    typeof humanApprovalEvidenceSourceId,
    "run-contract.kp.executable-motif-perceptual-continuity-repair-v0"
  ];
}

/**
 * Exact quantity is a composition of three executable motifs, so promotion
 * must bind the whole cohort. Certifying only its most visible evaluation
 * would let fission or fusion silently fall back while the catalog said
 * "ported."
 */
export const kpVerifiedExactFractionQuantityReleaseApproval:
KpVerifiedExactFractionQuantityReleaseApproval = Object.freeze({
  schemaVersion:
    "kp.verified-exact-fraction-quantity-release-approval.v1",
  animationId,
  reviewDecision: "approved-persistent-stage",
  releaseDecision: "passed",
  executableMotifCertificates: Object.freeze([
    certifyProgram(kpIdentityFissionExecutableProgram),
    certifyProgram(kpIdentityFusionExecutableProgram),
    certifyProgram(
      kpOperationEvaluationExecutableProgramCompiler.program
    )
  ] as const),
  evidenceSourceIds: Object.freeze([
    humanApprovalEvidenceSourceId,
    "run-contract.kp.executable-motif-perceptual-continuity-repair-v0"
  ] as const)
});

export function isKpVerifiedExactFractionQuantityReleaseApproval(
  value: unknown
): value is KpVerifiedExactFractionQuantityReleaseApproval {
  return value === kpVerifiedExactFractionQuantityReleaseApproval;
}

function certifyProgram(
  program: KpVerifiedExecutableSuccessorMotifProgram
): KpVerifiedExecutableMotifPromotionCertificate {
  return certifyKpExecutableMotifPromotionEvidence({
    schemaVersion: "kp.executable-motif-promotion-evidence.v1",
    animationId,
    program,
    route: resolveKpExecutableSuccessorMotifProgramRoute(program),
    exhaustiveAdapterEvidenceSourceIds: [
      "src/reader/renderers/executable-successor-motif-program-adapter.ts"
    ],
    phaseRoleConformanceEvidenceSourceIds: [
      `program.${program.id}@${program.programVersion}`
    ],
    perceptualContinuityEvidenceSourceIds: [
      "src/animation/motifs/executable-motif-continuity-compiler.ts"
    ],
    endpointEquivalenceEvidenceSourceIds: [
      "src/rendering/native-katex-successor-endpoint-microscope.ts"
    ],
    browserEvidenceSourceIds: [
      "tests/exact-fraction-quantity-determinism.browser.spec.ts"
    ],
    humanApprovalEvidenceSourceId
  });
}
