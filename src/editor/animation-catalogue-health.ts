import type {
  KpAnimationCatalogueSurfaceHostability
} from "./animation-catalogue-surface-hostability.ts";

export type KpAnimationCatalogueHealthStatus =
  | "ready"
  | "review"
  | "broken";

export type KpAnimationCatalogueHealthDiagnosticSeverity =
  | "info"
  | "warning"
  | "error";

export interface KpAnimationCatalogueHealthDiagnostic {
  readonly severity: KpAnimationCatalogueHealthDiagnosticSeverity;
  readonly code: string;
  readonly message: string;
}

export type KpAnimationCatalogueHostObservation =
  | Readonly<{ readonly status: "not-observed" }>
  | Readonly<{ readonly status: "painted" }>
  | Readonly<{
      readonly status: "failed";
      readonly message: string;
    }>;

export type KpAnimationCatalogueHealthReasonCode =
  | "unsupported-surface"
  | "missing-adapter"
  | "host-failed"
  | "diagnostic-error"
  | "host-not-observed"
  | "diagnostic-warning"
  | "review-requested";

export interface KpAnimationCatalogueHealthReason {
  readonly code: KpAnimationCatalogueHealthReasonCode;
  readonly message: string;
  readonly diagnosticCode?: string | undefined;
}

export interface KpAnimationCatalogueHealth {
  readonly schemaVersion: "kp.animation-catalogue-health.v1";
  readonly kind: "animation-catalogue-health";
  readonly animationId: string;
  readonly status: KpAnimationCatalogueHealthStatus;
  readonly reasons: readonly KpAnimationCatalogueHealthReason[];
}

export function deriveKpAnimationCatalogueHealth(input: {
  readonly hostability: KpAnimationCatalogueSurfaceHostability;
  readonly hostObservation: KpAnimationCatalogueHostObservation;
  readonly diagnostics?: readonly KpAnimationCatalogueHealthDiagnostic[] | undefined;
  readonly reviewRequested?: boolean | undefined;
}): KpAnimationCatalogueHealth {
  const diagnostics = input.diagnostics ?? [];
  const brokenReasons: KpAnimationCatalogueHealthReason[] = [];

  if (input.hostability.status === "unsupported-surface") {
    const targetKinds = input.hostability.unsupportedTargetKinds.join(", ");
    brokenReasons.push({
      code: "unsupported-surface",
      message: targetKinds.length === 0
        ? "The asset does not resolve to a supported catalogue surface."
        : `Unsupported catalogue render targets: ${targetKinds}.`
    });
  }

  if (input.hostability.status === "missing-adapter") {
    const slotKinds = input.hostability.slots
      .filter(({ status }) => status === "missing-adapter")
      .map(({ slotKind }) => slotKind)
      .join(", ");
    brokenReasons.push({
      code: "missing-adapter",
      message: slotKinds.length === 0
        ? "The catalogue host is missing a required surface adapter."
        : `Missing catalogue surface adapters: ${slotKinds}.`
    });
  }

  if (input.hostObservation.status === "failed") {
    brokenReasons.push({
      code: "host-failed",
      message: input.hostObservation.message
    });
  }

  for (const diagnostic of diagnostics) {
    if (diagnostic.severity === "error") {
      brokenReasons.push({
        code: "diagnostic-error",
        diagnosticCode: diagnostic.code,
        message: diagnostic.message
      });
    }
  }

  if (brokenReasons.length > 0) {
    return createHealth(input.hostability.animationId, "broken", brokenReasons);
  }

  const reviewReasons: KpAnimationCatalogueHealthReason[] = [];
  if (input.hostObservation.status === "not-observed") {
    reviewReasons.push({
      code: "host-not-observed",
      message: "The asset has not yet painted in the catalogue host."
    });
  }

  for (const diagnostic of diagnostics) {
    if (diagnostic.severity === "warning") {
      reviewReasons.push({
        code: "diagnostic-warning",
        diagnosticCode: diagnostic.code,
        message: diagnostic.message
      });
    }
  }

  if (input.reviewRequested === true) {
    reviewReasons.push({
      code: "review-requested",
      message: "The asset has an explicit catalogue review request."
    });
  }

  // Health reports observable catalogue behavior. Promotion maturity and a
  // reviewer's eventual disposition remain independent decisions.
  return createHealth(
    input.hostability.animationId,
    reviewReasons.length > 0 ? "review" : "ready",
    reviewReasons
  );
}

function createHealth(
  animationId: string,
  status: KpAnimationCatalogueHealthStatus,
  reasons: readonly KpAnimationCatalogueHealthReason[]
): KpAnimationCatalogueHealth {
  return Object.freeze({
    schemaVersion: "kp.animation-catalogue-health.v1" as const,
    kind: "animation-catalogue-health" as const,
    animationId,
    status,
    reasons: Object.freeze(reasons.map((reason) => Object.freeze({ ...reason })))
  });
}
