export const kpEvaluationTopologyCertificateSchemaVersion =
  "kp.evaluation-topology-certificate.v1" as const;

export const kpEvaluationTopologyKinds = [
  "contributors-create-result",
  "carrier-survives",
  "annihilation-leaves-survivor"
] as const;

export type KpEvaluationTopologyKind =
  (typeof kpEvaluationTopologyKinds)[number];

interface KpEvaluationTopologyCertificateBase {
  readonly schemaVersion:
    typeof kpEvaluationTopologyCertificateSchemaVersion;
  readonly transformationId: string;
  readonly operationId: string;
  readonly correspondenceRecordId: string;
  readonly evidenceSource: "verified-selector-correspondence";
}

export type KpEvaluationTopologyCertificate =
  | (KpEvaluationTopologyCertificateBase & {
      readonly topology: "contributors-create-result";
      readonly materialInputSelectorIds: readonly string[];
      readonly catalystSelectorIds: readonly string[];
      readonly resultSelectorIds: readonly string[];
    })
  | (KpEvaluationTopologyCertificateBase & {
      readonly topology: "carrier-survives";
      readonly carrierSourceSelectorId: string;
      readonly carrierTargetSelectorId: string;
      readonly retiringArtifactSelectorIds: readonly string[];
    })
  | (KpEvaluationTopologyCertificateBase & {
      readonly topology: "annihilation-leaves-survivor";
      readonly annihilatedSelectorIds: readonly string[];
      readonly survivorSourceSelectorIds: readonly string[];
      readonly survivorTargetSelectorIds: readonly string[];
    });

declare const kpVerifiedEvaluationTopologyCertificateBrand: unique symbol;

export type KpVerifiedEvaluationTopologyCertificate = Readonly<
  KpEvaluationTopologyCertificate & {
    readonly [kpVerifiedEvaluationTopologyCertificateBrand]: true;
  }
>;

const verifiedCertificates = new WeakSet<object>();

export function isKpVerifiedEvaluationTopologyCertificate(
  value: unknown
): value is KpVerifiedEvaluationTopologyCertificate {
  return typeof value === "object" && value !== null &&
    verifiedCertificates.has(value);
}

/** Compiler implementations in this module are the only certificate minters. */
function rememberVerifiedEvaluationTopologyCertificate(
  certificate: KpEvaluationTopologyCertificate
): KpVerifiedEvaluationTopologyCertificate {
  const verified = Object.freeze(certificate) as unknown as
    KpVerifiedEvaluationTopologyCertificate;
  verifiedCertificates.add(verified);
  return verified;
}

// The derivation slice will call the module-private minter after checking the
// semantic asset, correspondence record, and selector metadata together.
void rememberVerifiedEvaluationTopologyCertificate;
