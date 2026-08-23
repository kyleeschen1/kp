import {
  resolveKpOperationEvaluationFamilyApplicability,
  resolveKpOperationEvaluationFamilyReleaseRegistration,
  type KpOperationEvaluationFamilyProfile,
  type KpOperationEvaluationReleaseMaturity
} from "../animation/operation-evaluation-family-profile.ts";
import type { KpAssetBundle } from "../semantic/asset.ts";
import type { KpSemanticTransformation } from
  "../semantic/asset-transformation.ts";
import {
  compileKpContributorEvaluationTopologyCertificate,
  type KpContributorEvaluationTopologyDiagnosticCode,
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
  const { authority, transformation } = input;
  if (authority.presentationAuthority.kind !==
      "registered-operation-evaluation") {
    return repair({
      code: "evaluation-family-certificate.unsupported-authority",
      path: "authority.presentationAuthority.kind",
      message:
        `Evaluation authority ${authority.authorityId} does not declare an operation-evaluation family.`
    });
  }
  if (authority.transformationId !== transformation.id) {
    return repair({
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
    return repair({
      code: "evaluation-family-certificate.missing-release",
      path: "transformation.transformType",
      message:
        `Transformation ${transformation.transformType} has no evaluation-family release registration.`
    });
  }
  if (release.familyProfileId !==
      authority.presentationAuthority.familyProfileId) {
    return repair({
      code: "evaluation-family-certificate.profile-mismatch",
      path: "authority.presentationAuthority.familyProfileId",
      message:
        `Authority claims ${authority.presentationAuthority.familyProfileId}, but ${transformation.transformType} is registered to ${release.familyProfileId}.`
    });
  }

  const topology = compileKpContributorEvaluationTopologyCertificate({
    bundle: input.bundle,
    transformation,
    operationId: authority.operationId
  });
  if (topology.status !== "verified") {
    return Object.freeze({
      status: "repair-required" as const,
      diagnostics: Object.freeze(topology.diagnostics.map((diagnostic) =>
        Object.freeze({ ...diagnostic })))
    });
  }

  const applicability = resolveKpOperationEvaluationFamilyApplicability({
    familyProfileId: release.familyProfileId,
    topologyCertificate: topology.certificate
  });
  if (applicability.status !== "applicable") {
    return repair({
      code: `evaluation-family-certificate.${applicability.status}`,
      path: "topologyCertificate.topology",
      message: applicability.message
    });
  }

  const certificate = Object.freeze({
    schemaVersion: kpEquationEvaluationFamilyCertificateV2SchemaVersion,
    authorityId: authority.authorityId,
    transformationId: transformation.id,
    operationId: authority.operationId,
    familyProfile: applicability.profile,
    releaseMaturity: release.maturity,
    topologyCertificate: topology.certificate,
    resolutionSource: "compiler-validated-evaluation-authority" as const
  }) as unknown as KpVerifiedEquationEvaluationFamilyCertificateV2;
  verifiedCertificates.add(certificate);
  return Object.freeze({
    status: "certified" as const,
    certificate,
    diagnostics: Object.freeze([]) as readonly []
  });
}

function repair(
  diagnostic: KpEquationEvaluationFamilyCertificateDiagnosticV2
): KpEquationEvaluationFamilyCertificateCompilationV2 {
  return Object.freeze({
    status: "repair-required" as const,
    diagnostics: Object.freeze([Object.freeze(diagnostic)])
  });
}
