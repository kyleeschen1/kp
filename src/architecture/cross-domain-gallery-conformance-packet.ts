import {
  validateKpAnimationGenerationRequest,
  type KpAnimationGenerationDomain,
  type KpAnimationGenerationRequest
} from "../domain-ir/animation-generation-request.ts";
import type {
  KpGalleryGenerationResult
} from "../domain-ir/gallery-generation-result.ts";

export const KP_CROSS_DOMAIN_GALLERY_CONFORMANCE_SCHEMA =
  "kp.cross-domain-gallery-conformance-packet.v1" as const;

export interface KpCrossDomainGalleryConformanceCase {
  readonly id: string;
  readonly request: KpAnimationGenerationRequest;
  readonly expectedResult: KpGalleryGenerationResult;
}

export interface KpCrossDomainGalleryConformancePacket {
  readonly schemaVersion:
    typeof KP_CROSS_DOMAIN_GALLERY_CONFORMANCE_SCHEMA;
  readonly kind: "cross-domain-gallery-conformance-packet";
  readonly cases: readonly KpCrossDomainGalleryConformanceCase[];
  readonly domains: readonly KpAnimationGenerationDomain[];
  readonly frontendIds: readonly string[];
  readonly dispositionCounts: Readonly<Record<
    KpGalleryGenerationResult["status"],
    number
  >>;
}

/**
 * This packet freezes requests and their projected outcomes. It does not copy
 * the domain plans referenced by those outcomes into a shared semantic model.
 */
export function compileKpCrossDomainGalleryConformancePacket(
  cases: readonly KpCrossDomainGalleryConformanceCase[]
): KpCrossDomainGalleryConformancePacket {
  if (cases.length === 0) {
    throw new Error("The cross-domain gallery packet needs at least one case.");
  }
  const ids = cases.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Cross-domain gallery conformance case IDs must be unique.");
  }

  for (const entry of cases) {
    const envelope = validateKpAnimationGenerationRequest(entry.request);
    if (envelope.status !== "accepted") {
      throw new Error(`Conformance case ${entry.id} has an invalid request.`);
    }
    const request = envelope.request;
    const result = entry.expectedResult;
    if (
      result.requestId !== request.requestId ||
      result.domain !== request.domain ||
      !sameValues(result.capabilityPins ?? [], request.capabilityPins)
    ) throw new Error(
      `Conformance case ${entry.id} does not preserve request authority.`
    );
    if (result.frontendAuthority !== undefined &&
        result.frontendAuthority.frontendId !== request.source.frontendId) {
      throw new Error(
        `Conformance case ${entry.id} does not preserve frontend authority.`
      );
    }
  }

  const statuses: readonly KpGalleryGenerationResult["status"][] = [
    "compiled-artifact",
    "existing-artifact",
    "semantic-plan-only",
    "repair-required"
  ];
  return deepFreeze({
    schemaVersion: KP_CROSS_DOMAIN_GALLERY_CONFORMANCE_SCHEMA,
    kind: "cross-domain-gallery-conformance-packet" as const,
    cases: cases.map((entry) => ({ ...entry })),
    domains: unique(cases.map(({ request }) => request.domain)),
    frontendIds: unique(cases.map(
      ({ request }) => request.source.frontendId
    )),
    dispositionCounts: Object.fromEntries(statuses.map((status) => [
      status,
      cases.filter(({ expectedResult }) =>
        expectedResult.status === status
      ).length
    ])) as Record<KpGalleryGenerationResult["status"], number>
  });
}

function unique<T>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}

function sameValues(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value) => right.includes(value));
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
