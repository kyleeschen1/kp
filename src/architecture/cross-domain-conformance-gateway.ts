import type {
  KpAnimationConformanceRegistrationDeclaration
} from "../animation/animation-conformance-registration.ts";
import type {
  KpAnimationConformanceManifest,
  KpAnimationConformanceManifestSet
} from "./animation-conformance-manifest.ts";
import type { KpAnimationGovernanceDomain } from
  "./animation-governance-inventory.ts";
import type {
  KpAnimationGovernanceDependencyKind,
  KpAnimationGovernanceReverseDependencyGraph
} from "./animation-governance-reverse-dependencies.ts";
import type { KpAnimationReviewFreshnessState } from
  "./animation-review-freshness.ts";

export type KpCrossDomainConformanceDomain = Exclude<
  KpAnimationGovernanceDomain,
  "equation"
>;

export interface KpCrossDomainConformanceEntry {
  readonly assetId: string;
  readonly domains: readonly KpCrossDomainConformanceDomain[];
  readonly equationGovernance: "absent" | "mixed-equation-segment";
  readonly rendererAdapterIds: readonly string[];
  readonly reviewFreshness: KpAnimationReviewFreshnessState;
  readonly threeDimensional: boolean;
}

export interface KpCrossDomainConformanceGateway {
  readonly schemaVersion: "kp.cross-domain-conformance-gateway.v1";
  readonly kind: "cross-domain-conformance-gateway";
  readonly entries: readonly KpCrossDomainConformanceEntry[];
  readonly summary: {
    readonly assetCount: number;
    readonly domainCounts: Readonly<
      Record<KpCrossDomainConformanceDomain, number>
    >;
    readonly threeDimensionalAssetCount: number;
  };
}

export class KpCrossDomainConformanceGatewayError extends Error {
  override readonly name = "KpCrossDomainConformanceGatewayError";
  readonly diagnostics: readonly string[];

  constructor(diagnostics: readonly string[]) {
    super(diagnostics.join("\n"));
    this.diagnostics = diagnostics;
  }
}

/**
 * Cross-domain assets share governance evidence, not an equation-shaped
 * presenter. This compiler proves the common registration/review/dependency
 * seam while leaving graph, programming, and diagram rendering domain-owned.
 */
export function compileKpCrossDomainConformanceGateway(input: {
  readonly manifests: KpAnimationConformanceManifestSet;
  readonly registrations:
    readonly KpAnimationConformanceRegistrationDeclaration[];
  readonly reverseDependencies:
    KpAnimationGovernanceReverseDependencyGraph;
  readonly equationGrammarAssetIds: readonly string[];
}): KpCrossDomainConformanceGateway {
  const diagnostics: string[] = [];
  const registrations = uniqueMap(
    input.registrations,
    ({ assetId }) => assetId,
    "conformance registration",
    diagnostics
  );
  const equationGrammarAssetIds = new Set(input.equationGrammarAssetIds);
  const dependencyCallers = compileDependencyCallers(
    input.reverseDependencies,
    diagnostics
  );
  const entries = input.manifests.manifests.flatMap((manifest) => {
    const domains = crossDomains(manifest);
    if (domains.length === 0) return [];
    validateRegistration(manifest, registrations.get(manifest.assetId),
      diagnostics);
    validateProfiles(manifest, domains, diagnostics);
    validateDependencies(manifest, dependencyCallers, diagnostics);
    const mixedEquation = manifest.domains.includes("equation");
    const usesEquationGrammar = equationGrammarAssetIds.has(manifest.assetId);
    if (mixedEquation !== usesEquationGrammar) {
      diagnostics.push(mixedEquation
        ? `${manifest.assetId} has an equation segment without equation grammar v2.`
        : `${manifest.assetId} is pure ${domains.join("+")} but entered equation grammar v2.`);
    }
    const threeDimensional = manifest.projection.adapterIds.includes(
      "editor-animation-surface.graph.webgl-3d"
    );
    if (threeDimensional && !domains.includes("graph")) {
      diagnostics.push(
        `${manifest.assetId} declares the 3D graph adapter without graph authority.`
      );
    }
    if (manifest.projection.adapterIds.length === 0) {
      diagnostics.push(`${manifest.assetId} has no domain renderer adapter.`);
    }
    return [Object.freeze({
      assetId: manifest.assetId,
      domains: Object.freeze(domains),
      equationGovernance: mixedEquation
        ? "mixed-equation-segment" as const
        : "absent" as const,
      rendererAdapterIds: Object.freeze([
        ...manifest.projection.adapterIds
      ]),
      reviewFreshness: manifest.reviewFreshness.state,
      threeDimensional
    })];
  });
  if (diagnostics.length > 0) {
    throw new KpCrossDomainConformanceGatewayError(
      Object.freeze(diagnostics)
    );
  }
  const ordered = Object.freeze(entries.sort((left, right) =>
    left.assetId.localeCompare(right.assetId)
  ));
  return Object.freeze({
    schemaVersion: "kp.cross-domain-conformance-gateway.v1" as const,
    kind: "cross-domain-conformance-gateway" as const,
    entries: ordered,
    summary: Object.freeze({
      assetCount: ordered.length,
      domainCounts: Object.freeze({
        graph: ordered.filter(({ domains }) => domains.includes("graph"))
          .length,
        programming: ordered.filter(({ domains }) =>
          domains.includes("programming")
        ).length,
        diagram: ordered.filter(({ domains }) => domains.includes("diagram"))
          .length
      }),
      threeDimensionalAssetCount: ordered.filter(
        ({ threeDimensional }) => threeDimensional
      ).length
    })
  });
}

function crossDomains(
  manifest: KpAnimationConformanceManifest
): KpCrossDomainConformanceDomain[] {
  return manifest.domains.filter(
    (domain): domain is KpCrossDomainConformanceDomain =>
      domain !== "equation"
  );
}

function validateRegistration(
  manifest: KpAnimationConformanceManifest,
  registration: KpAnimationConformanceRegistrationDeclaration | undefined,
  diagnostics: string[]
): void {
  if (registration === undefined) {
    diagnostics.push(`${manifest.assetId} has no conformance registration.`);
    return;
  }
  if (registration.kind !== "manifest-ref") {
    diagnostics.push(`${manifest.assetId} entered through a typed gap.`);
    return;
  }
  if (
    registration.manifestId !== `manifest.${manifest.assetId}` ||
    registration.policyEpochId !== manifest.policy.epochId ||
    registration.disposition !== manifest.disposition.status
  ) {
    diagnostics.push(
      `${manifest.assetId} registration disagrees with its manifest.`
    );
  }
}

function validateProfiles(
  manifest: KpAnimationConformanceManifest,
  domains: readonly KpCrossDomainConformanceDomain[],
  diagnostics: string[]
): void {
  for (const domain of domains) {
    const profiles = manifest.resolvedProfiles.filter((profile) =>
      profile.domain === domain
    );
    if (profiles.length !== 1 || profiles[0]?.source !== "not-applicable") {
      diagnostics.push(
        `${manifest.assetId} requires one renderer-domain ${domain} profile.`
      );
    }
  }
}

function validateDependencies(
  manifest: KpAnimationConformanceManifest,
  dependencyCallers: ReadonlyMap<string, ReadonlySet<string>>,
  diagnostics: string[]
): void {
  for (const dependency of manifestDependencies(manifest)) {
    const callers = dependencyCallers.get(dependencyKey(dependency));
    if (!callers?.has(manifest.assetId)) {
      diagnostics.push(
        `${manifest.assetId} lacks reverse dependency ${dependency.kind}:` +
        dependency.id
      );
    }
  }
}

function manifestDependencies(manifest: KpAnimationConformanceManifest) {
  return [
    ...manifest.dependencies.principleIds.map((id) => ({
      id,
      kind: "principle" as const
    })),
    ...manifest.dependencies.motifIds.map((id) => ({
      id,
      kind: "motif" as const
    })),
    ...manifest.dependencies.rendererIds.map((id) => ({
      id,
      kind: "renderer" as const
    })),
    ...manifest.dependencies.typographyPolicyIds.map((id) => ({
      id,
      kind: "typography-policy" as const
    }))
  ];
}

function compileDependencyCallers(
  graph: KpAnimationGovernanceReverseDependencyGraph,
  diagnostics: string[]
): ReadonlyMap<string, ReadonlySet<string>> {
  const callers = new Map<string, ReadonlySet<string>>();
  for (const dependency of graph.dependencies) {
    const key = dependencyKey({
      id: dependency.dependencyId,
      kind: dependency.kind
    });
    if (callers.has(key)) diagnostics.push(`Duplicate dependency ${key}.`);
    callers.set(key, new Set(dependency.callerAssetIds));
  }
  return callers;
}

function dependencyKey(dependency: {
  readonly id: string;
  readonly kind: KpAnimationGovernanceDependencyKind;
}): string {
  return `${dependency.kind}:${dependency.id}`;
}

function uniqueMap<T>(
  values: readonly T[],
  keyFor: (value: T) => string,
  label: string,
  diagnostics: string[]
): ReadonlyMap<string, T> {
  const result = new Map<string, T>();
  for (const value of values) {
    const key = keyFor(value);
    if (result.has(key)) diagnostics.push(`Duplicate ${label} ${key}.`);
    result.set(key, value);
  }
  return result;
}
