import assert from "node:assert/strict";
import test from "node:test";

import {
  kpOperationEvaluationExecutableProgramCompiler
} from "../src/animation/operation-evaluation-presentation-registry.ts";
import {
  validateAndMintKpExecutableSuccessorMotifProgram
} from "../src/animation/motifs/executable-successor-motif-program-validator.ts";
import {
  certifyKpExecutableMotifPromotionEvidence,
  checkKpExecutableMotifPromotionEvidence,
  isKpVerifiedExecutableMotifPromotionCertificate,
  type KpExecutableMotifPromotionEvidenceDraft
} from "../src/architecture/executable-motif-promotion-evidence.ts";
import {
  deriveKpCanonicalFormatStatus,
  type KpCanonicalFormatPromotionEvidence
} from "../src/editor/animation-library-display-catalog-builder.ts";
import {
  resolveKpExecutableSuccessorMotifProgramRoute
} from "../src/reader/renderers/executable-successor-motif-program-adapter.ts";

const animationId = "animation.test.executable-motif";

function validDraft(): KpExecutableMotifPromotionEvidenceDraft {
  const program = kpOperationEvaluationExecutableProgramCompiler.program;
  return {
    schemaVersion: "kp.executable-motif-promotion-evidence.v1",
    animationId,
    program,
    route: resolveKpExecutableSuccessorMotifProgramRoute(program),
    exhaustiveAdapterEvidenceSourceIds: ["test.adapter"],
    phaseRoleConformanceEvidenceSourceIds: ["test.phase-role"],
    perceptualContinuityEvidenceSourceIds: ["test.continuity"],
    endpointEquivalenceEvidenceSourceIds: ["test.endpoint"],
    browserEvidenceSourceIds: ["test.browser"],
    humanApprovalEvidenceSourceId: "test.human-approval"
  };
}

function completeDisplayEvidence(
  certificate:
    ReturnType<typeof certifyKpExecutableMotifPromotionEvidence>
): KpCanonicalFormatPromotionEvidence {
  return {
    animationId,
    executionAuthority: {
      kind: "executable-motif",
      certificate
    },
    exclusiveCanonicalPaint: true,
    requiredMotifParity: true,
    responsiveRuntimeGates: true,
    humanReviewApproved: true,
    compatibilityPaintRetired: true,
    releaseGatePassed: true,
    presentationCoverage: "verified-animated",
    evidenceSourceIds: ["test.release"]
  };
}

const representations = [{
  id: "reader.test",
  label: "Reader",
  kind: "reader" as const,
  href: "/reader/test/",
  role: "canonical-host" as const
}];

test("ported evidence binds the exact minted program and exhaustive route", () => {
  const certificate = certifyKpExecutableMotifPromotionEvidence(validDraft());

  assert.equal(
    isKpVerifiedExecutableMotifPromotionCertificate(certificate),
    true
  );
  assert.equal(
    certificate.programId,
    kpOperationEvaluationExecutableProgramCompiler.program.id
  );
  assert.equal(
    certificate.programVersion,
    kpOperationEvaluationExecutableProgramCompiler.program.programVersion
  );
  assert.equal(
    certificate.primitiveRoute,
    "native-katex-successor-synthesis"
  );
  assert.equal(
    deriveKpCanonicalFormatStatus({
      evidence: completeDisplayEvidence(certificate),
      representations
    }),
    "ported"
  );
});

test("labels, generic routes, unsafe casts, and copied certificates fail closed", () => {
  const draft = validDraft();
  const issues = checkKpExecutableMotifPromotionEvidence({
    ...draft,
    program: {
      id: draft.program.id,
      programVersion: draft.program.programVersion,
      kind: "operation-evaluation"
    },
    route: {
      kind: "generic-motion",
      visualMotif: "successor-synthesis"
    },
    visualMotif: "successor-synthesis"
  });

  assert.deepEqual(
    issues.map(({ code }) => code),
    [
      "promotion.input.unsupported-field",
      "promotion.program.unverified",
      "promotion.route.unverified"
    ]
  );

  const certificate = certifyKpExecutableMotifPromotionEvidence(draft);
  const copied = JSON.parse(JSON.stringify(certificate));
  assert.equal(
    isKpVerifiedExecutableMotifPromotionCertificate(copied),
    false
  );
  assert.equal(
    deriveKpCanonicalFormatStatus({
      evidence: {
        ...completeDisplayEvidence(certificate),
        executionAuthority: {
          kind: "executable-motif",
          certificate: copied
        }
      },
      representations
    }),
    "partial"
  );
});

test("program and adapter catalog drift cannot share promotion evidence", () => {
  const draft = validDraft();
  const result = validateAndMintKpExecutableSuccessorMotifProgram({
    draft: JSON.parse(JSON.stringify(draft.program))
  });
  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;
  const issues = checkKpExecutableMotifPromotionEvidence({
    ...draft,
    program: result.program
  });

  assert.deepEqual(
    issues.map(({ code }) => code),
    ["promotion.route.mismatch"]
  );
});

test("the historical exemption is closed to new animation ids", () => {
  const certificate = certifyKpExecutableMotifPromotionEvidence(validDraft());
  const executable = completeDisplayEvidence(certificate);
  const forgedLegacy: KpCanonicalFormatPromotionEvidence = {
    ...executable,
    executionAuthority: {
      kind: "legacy-reviewed",
      reviewId: "test.release"
    }
  };

  assert.equal(
    deriveKpCanonicalFormatStatus({
      evidence: forgedLegacy,
      representations
    }),
    "partial"
  );
});
