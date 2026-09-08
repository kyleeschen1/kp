import {
  resolveKpOperationEvaluationFamilyApplicability,
  resolveKpOperationEvaluationFamilyReleaseRegistration,
  type KpOperationEvaluationFamilyProfile,
  type KpOperationEvaluationFamilyProfileId,
  type KpOperationEvaluationReleaseMaturity
} from "../animation/operation-evaluation-family-profile.ts";
import type { KpAssetBundle } from "../semantic/asset.ts";
import type { KpSemanticTransformation } from
  "../semantic/asset-transformation.ts";
import {
  compileKpContributorEvaluationTopologyCertificate,
  compileKpContributorEvaluationTopologyCohortCertificates,
  type KpContributorEvaluationTopologyDiagnosticCode,
  type KpVerifiedContributorEvaluationTopologyCohortCertificate,
  type KpVerifiedEvaluationTopologyCertificate
} from "../semantic/evaluation-topology-certificate.ts";
import type {
  KpResolvedEquationEvaluationAuthorityV2
} from "./equation-evaluation-authority-registry-v2.ts";

export const kpEquationEvaluationFamilyCertificateV2SchemaVersion =
  "kp.equation-evaluation-family-certificate.v2" as const;

declare const kpVerifiedEquationEvaluationFamilyCertificateV2Brand:
  unique symbol;

export type KpVerifiedEquationEvaluationFamilyCertificateV2 = Readonly<{
  readonly schemaVersion:
    typeof kpEquationEvaluationFamilyCertificateV2SchemaVersion;
  readonly authorityId: string;
  readonly transformationId: string;
  readonly operationId: string;
  readonly familyProfile: KpOperationEvaluationFamilyProfile;
  readonly releaseMaturity: KpOperationEvaluationReleaseMaturity;
  readonly topologyCertificate: KpVerifiedEvaluationTopologyCertificate;
  readonly resolutionSource: "compiler-validated-evaluation-authority";
  readonly [kpVerifiedEquationEvaluationFamilyCertificateV2Brand]: true;
}>;

export type KpEquationEvaluationFamilyCertificateDiagnosticCodeV2 =
  | "evaluation-family-certificate.unsupported-authority"
  | "evaluation-family-certificate.transformation-mismatch"
  | "evaluation-family-certificate.missing-release"
  | "evaluation-family-certificate.profile-mismatch"
  | "evaluation-family-certificate.unsupported-family-profile"
  | "evaluation-family-certificate.unverified-topology"
  | "evaluation-family-certificate.incompatible-topology"
  | KpContributorEvaluationTopologyDiagnosticCode;

export interface KpEquationEvaluationFamilyCertificateDiagnosticV2 {
  readonly code: KpEquationEvaluationFamilyCertificateDiagnosticCodeV2;
  readonly path: string;
  readonly message: string;
}

export type KpEquationEvaluationFamilyCertificateCompilationV2 =
  | {
      readonly status: "certified";
      readonly certificate: KpVerifiedEquationEvaluationFamilyCertificateV2;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "repair-required";
      readonly diagnostics:
        readonly KpEquationEvaluationFamilyCertificateDiagnosticV2[];
    };

export type KpEquationEvaluationFamilyCohortCertificateCompilationV2 =
  | {
      readonly status: "certified";
      readonly certificates: readonly [
        KpVerifiedEquationEvaluationFamilyCertificateV2,
        KpVerifiedEquationEvaluationFamilyCertificateV2,
        ...KpVerifiedEquationEvaluationFamilyCertificateV2[]
      ];
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "repair-required";
      readonly diagnostics:
        readonly KpEquationEvaluationFamilyCertificateDiagnosticV2[];
    };

const verifiedCertificates = new WeakSet<object>();

export function isKpVerifiedEquationEvaluationFamilyCertificateV2(
  value: unknown
): value is KpVerifiedEquationEvaluationFamilyCertificateV2 {
  return typeof value === "object" && value !== null &&
    verifiedCertificates.has(value);
}

/**
 * This is the sole family-certificate mint. It joins governance authority,
 * release maturity, and verified semantic topology without renderer fallback.
 */
export function compileKpEquationEvaluationFamilyCertificateV2(input: {
  readonly bundle: KpAssetBundle;
  readonly transformation: KpSemanticTransformation;
  readonly authority: KpResolvedEquationEvaluationAuthorityV2;
}): KpEquationEvaluationFamilyCertificateCompilationV2 {
  const governance = resolveFamilyGovernance(input);
  if (governance.status === "repair-required") return governance;

  const topology = compileKpContributorEvaluationTopologyCertificate({
    bundle: input.bundle,
    transformation: input.transformation,
    operationId: input.authority.operationId
  });
  if (topology.status !== "verified") {
    return Object.freeze<KpEquationEvaluationFamilyCertificateCompilationV2>({
      status: "repair-required" as const,
      diagnostics: Object.freeze(topology.diagnostics.map((diagnostic) =>
        Object.freeze({ ...diagnostic })))
    });
  }

  const applicability = resolveKpOperationEvaluationFamilyApplicability({
    familyProfileId: governance.familyProfileId,
    topologyCertificate: topology.certificate
  });
  if (applicability.status !== "applicable") {
    return repair({
      code: `evaluation-family-certificate.${applicability.status}`,
      path: "topologyCertificate.topology",
      message: applicability.message
    });
  }

  const certificate = mintFamilyCertificate({
    authority: input.authority,
    transformation: input.transformation,
    topologyCertificate: topology.certificate,
    familyProfile: applicability.profile,
    releaseMaturity: governance.releaseMaturity
  });
  return Object.freeze<KpEquationEvaluationFamilyCertificateCompilationV2>({
    status: "certified" as const,
    certificate,
    diagnostics: Object.freeze([]) as readonly []
  });
}

/**
 * Certifies each disjoint cohort independently under one registry authority.
 * The tuple is carried by a specialized payload; singular transitions keep
 * their existing one-certificate contract.
 */
export function compileKpEquationEvaluationFamilyCohortCertificatesV2(input: {
  readonly bundle: KpAssetBundle;
  readonly transformation: KpSemanticTransformation;
  readonly authority: KpResolvedEquationEvaluationAuthorityV2;
}): KpEquationEvaluationFamilyCohortCertificateCompilationV2 {
  const governance = resolveFamilyGovernance(input);
  if (governance.status === "repair-required") {
    return Object.freeze<KpEquationEvaluationFamilyCohortCertificateCompilationV2>({
      status: "repair-required" as const,
      diagnostics: governance.diagnostics
    });
  }
  const topology = compileKpContributorEvaluationTopologyCohortCertificates({
    bundle: input.bundle,
    transformation: input.transformation,
    operationId: input.authority.operationId
  });
  if (topology.status !== "verified") {
    return Object.freeze<KpEquationEvaluationFamilyCohortCertificateCompilationV2>({
      status: "repair-required" as const,
      diagnostics: Object.freeze(topology.diagnostics.map((diagnostic) =>
        Object.freeze({ ...diagnostic })))
    });
  }
  const diagnostics: KpEquationEvaluationFamilyCertificateDiagnosticV2[] = [];
  const certificates: KpVerifiedEquationEvaluationFamilyCertificateV2[] = [];
  topology.certificates.forEach((topologyCertificate) => {
    const applicability = resolveKpOperationEvaluationFamilyApplicability({
      familyProfileId: governance.familyProfileId,
      topologyCertificate
    });
    if (applicability.status !== "applicable") {
      diagnostics.push({
        code: `evaluation-family-certificate.${applicability.status}`,
        path: `topologyCertificates.${topologyCertificate.cohortId}.topology`,
        message: applicability.message
      });
      return;
    }
    certificates.push(mintFamilyCertificate({
      authority: input.authority,
      transformation: input.transformation,
      topologyCertificate,
      familyProfile: applicability.profile,
      releaseMaturity: governance.releaseMaturity
    }));
  });
  if (diagnostics.length > 0 || certificates.length < 2) {
    return Object.freeze<KpEquationEvaluationFamilyCohortCertificateCompilationV2>({
      status: "repair-required" as const,
      diagnostics: Object.freeze(diagnostics.map((diagnostic) =>
        Object.freeze(diagnostic)))
    });
  }
  return Object.freeze<KpEquationEvaluationFamilyCohortCertificateCompilationV2>({
    status: "certified" as const,
    certificates: Object.freeze(certificates) as readonly [
      KpVerifiedEquationEvaluationFamilyCertificateV2,
      KpVerifiedEquationEvaluationFamilyCertificateV2,
      ...KpVerifiedEquationEvaluationFamilyCertificateV2[]
    ],
    diagnostics: Object.freeze([]) as readonly []
  });
}

type KpEquationEvaluationFamilyGovernanceResolutionV2 =
  | {
      readonly status: "resolved";
      readonly familyProfileId: KpOperationEvaluationFamilyProfileId;
      readonly releaseMaturity: KpOperationEvaluationReleaseMaturity;
    }
  | {
      readonly status: "repair-required";
      readonly diagnostics:
        readonly KpEquationEvaluationFamilyCertificateDiagnosticV2[];
    };

function resolveFamilyGovernance(input: {
  readonly transformation: KpSemanticTransformation;
  readonly authority: KpResolvedEquationEvaluationAuthorityV2;
}): KpEquationEvaluationFamilyGovernanceResolutionV2 {
  const { authority, transformation } = input;
  if (authority.presentationAuthority.kind !==
      "registered-operation-evaluation") {
    return governanceRepair({
      code: "evaluation-family-certificate.unsupported-authority",
      path: "authority.presentationAuthority.kind",
      message:
        `Evaluation authority ${authority.authorityId} does not declare an operation-evaluation family.`
    });
  }
  if (authority.transformationId !== transformation.id) {
    return governanceRepair({
      code: "evaluation-family-certificate.transformation-mismatch",
      path: "authority.transformationId",
      message:
        `Authority transformation ${authority.transformationId} does not match ${transformation.id}.`
    });
  }
  const release = resolveKpOperationEvaluationFamilyReleaseRegistration(
    transformation.transformType
  );
  if (release === undefined) {
    return governanceRepair({
      code: "evaluation-family-certificate.missing-release",
      path: "transformation.transformType",
      message:
        `Transformation ${transformation.transformType} has no evaluation-family release registration.`
    });
  }
  if (release.familyProfileId !==
      authority.presentationAuthority.familyProfileId) {
    return governanceRepair({
      code: "evaluation-family-certificate.profile-mismatch",
      path: "authority.presentationAuthority.familyProfileId",
      message:
        `Authority claims ${authority.presentationAuthority.familyProfileId}, but ${transformation.transformType} is registered to ${release.familyProfileId}.`
    });
  }
  return Object.freeze<KpEquationEvaluationFamilyGovernanceResolutionV2>({
    status: "resolved" as const,
    familyProfileId: release.familyProfileId,
    releaseMaturity: release.maturity
  });
}

function mintFamilyCertificate(input: {
  readonly authority: KpResolvedEquationEvaluationAuthorityV2;
  readonly transformation: KpSemanticTransformation;
  readonly topologyCertificate: KpVerifiedEvaluationTopologyCertificate |
    KpVerifiedContributorEvaluationTopologyCohortCertificate;
  readonly familyProfile: KpOperationEvaluationFamilyProfile;
  readonly releaseMaturity: KpOperationEvaluationReleaseMaturity;
}): KpVerifiedEquationEvaluationFamilyCertificateV2 {
  const certificate = Object.freeze({
    schemaVersion: kpEquationEvaluationFamilyCertificateV2SchemaVersion,
    authorityId: input.authority.authorityId,
    transformationId: input.transformation.id,
    operationId: input.authority.operationId,
    familyProfile: input.familyProfile,
    releaseMaturity: input.releaseMaturity,
    topologyCertificate: input.topologyCertificate,
    resolutionSource: "compiler-validated-evaluation-authority" as const
  }) as unknown as KpVerifiedEquationEvaluationFamilyCertificateV2;
  verifiedCertificates.add(certificate);
  return certificate;
}

function repair(
  diagnostic: KpEquationEvaluationFamilyCertificateDiagnosticV2
): KpEquationEvaluationFamilyCertificateCompilationV2 {
  return Object.freeze<KpEquationEvaluationFamilyCertificateCompilationV2>({
    status: "repair-required" as const,
    diagnostics: Object.freeze([Object.freeze(diagnostic)])
  });
}

function governanceRepair(
  diagnostic: KpEquationEvaluationFamilyCertificateDiagnosticV2
): KpEquationEvaluationFamilyGovernanceResolutionV2 {
  return Object.freeze<KpEquationEvaluationFamilyGovernanceResolutionV2>({
    status: "repair-required" as const,
    diagnostics: Object.freeze([Object.freeze(diagnostic)])
  });
}
