import {
  validateKpAnimationGenerationRequest,
  type KpAnimationGenerationDomain,
  type KpAnimationGenerationRequest
} from "../src/domain-ir/animation-generation-request.ts";
import {
  projectKpGalleryGenerationRepair,
  type KpGalleryGenerationDiagnostic,
  type KpGalleryGenerationResult
} from "../src/domain-ir/gallery-generation-result.ts";

export interface KpCrossDomainGalleryFrontend {
  readonly domain: KpAnimationGenerationDomain;
  readonly sourceKind: string;
  readonly frontendId: string;
  readonly capabilityPins: readonly string[];
  readonly authoritySourcePath: string;
  readonly project: (
    request: KpAnimationGenerationRequest
  ) => KpGalleryGenerationResult;
}

/**
 * The router owns exact frontend selection only. Injected frontends retain all
 * equation, graph, scene, and program semantics and return the shared view.
 */
export function routeKpCrossDomainGalleryGeneration(
  value: unknown,
  frontends: readonly KpCrossDomainGalleryFrontend[]
): KpGalleryGenerationResult {
  const envelope = validateKpAnimationGenerationRequest(value);
  if (envelope.status !== "accepted") return projectKpGalleryGenerationRepair({
    diagnostics: nonEmpty(envelope.diagnostics.map((diagnostic) => ({
      authority: "request-envelope" as const,
      ...diagnostic
    })))
  });

  const request = envelope.request;
  const authorityMatches = frontends.filter((frontend) =>
    frontend.domain === request.domain &&
    frontend.sourceKind === request.source.kind &&
    frontend.frontendId === request.source.frontendId
  );
  if (authorityMatches.length === 0) return routerRepair(
    request,
    undefined,
    "gallery-generation.frontend-unavailable",
    "$.source.frontendId",
    `No registered gallery frontend owns ${request.source.frontendId}.`,
    "Register the exact domain frontend or retain this request as a typed gap."
  );
  if (authorityMatches.length > 1) return routerRepair(
    request,
    undefined,
    "gallery-generation.frontend-ambiguous",
    "$.source.frontendId",
    `${request.source.frontendId} has multiple gallery frontend owners.`,
    "Remove duplicate registrations before routing this request."
  );

  const frontend = authorityMatches[0]!;
  if (!sameValues(request.capabilityPins, frontend.capabilityPins)) {
    return routerRepair(
      request,
      frontend,
      "gallery-generation.capability-mismatch",
      "$.capabilityPins",
      "The request capability pins do not exactly match the frontend registration.",
      "Use the registered capability set for this exact frontend."
    );
  }

  const result = frontend.project(request);
  const mismatch = resultAuthorityMismatch(request, frontend, result);
  if (mismatch !== undefined) return routerRepair(
    request,
    frontend,
    "gallery-generation.result-authority-mismatch",
    "$",
    mismatch,
    "Repair the domain projection so it preserves request and frontend authority."
  );
  return result;
}

function resultAuthorityMismatch(
  request: KpAnimationGenerationRequest,
  frontend: KpCrossDomainGalleryFrontend,
  result: KpGalleryGenerationResult
): string | undefined {
  if (result.requestId !== undefined && result.requestId !== request.requestId) {
    return "The projected request ID differs from the routed request.";
  }
  if (result.domain !== undefined && result.domain !== request.domain) {
    return "The projected domain differs from the routed request.";
  }
  if (result.capabilityPins !== undefined &&
      !sameValues(result.capabilityPins, request.capabilityPins)) {
    return "The projected capabilities differ from the routed request.";
  }
  if (result.frontendAuthority !== undefined && (
    result.frontendAuthority.frontendId !== frontend.frontendId ||
    result.frontendAuthority.sourcePath !== frontend.authoritySourcePath
  )) return "The projected frontend authority differs from its registration.";
  if (result.status !== "repair-required" && (
    result.requestId !== request.requestId ||
    result.domain !== request.domain ||
    result.frontendAuthority.frontendId !== frontend.frontendId
  )) return "An accepted projection omitted routed request authority.";
  if (result.status !== "repair-required" && (
    result.explanationClaimRefs.length === 0 ||
    result.evidenceRefs.length === 0
  )) return "An accepted projection omitted explanation or conformance evidence.";
  return undefined;
}

function routerRepair(
  request: KpAnimationGenerationRequest,
  frontend: KpCrossDomainGalleryFrontend | undefined,
  code: string,
  path: string,
  message: string,
  repair: string
): KpGalleryGenerationResult {
  return projectKpGalleryGenerationRepair({
    request,
    ...(frontend === undefined
      ? {}
      : { frontendAuthoritySourcePath: frontend.authoritySourcePath }),
    diagnostics: [{
      authority: "cross-domain-router",
      code,
      path,
      message,
      repair
    }]
  });
}

function sameValues(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value) => right.includes(value));
}

function nonEmpty(
  diagnostics: readonly KpGalleryGenerationDiagnostic[]
): readonly [KpGalleryGenerationDiagnostic, ...KpGalleryGenerationDiagnostic[]] {
  if (diagnostics.length === 0) throw new Error(
    "A rejected animation request must include at least one diagnostic."
  );
  return diagnostics as readonly [
    KpGalleryGenerationDiagnostic,
    ...KpGalleryGenerationDiagnostic[]
  ];
}
