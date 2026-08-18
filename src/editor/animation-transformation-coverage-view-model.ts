import generatedCoverage from
  "../architecture/animation-transformation-coverage.generated.json" with {
    type: "json"
  };
import type {
  KpAnimationTransformationCoverage,
  KpAnimationTransformationCoverageRequirement
} from "../architecture/animation-transformation-coverage.ts";
import type {
  KpAnimationCapabilityReadinessStatus
} from "../architecture/animation-capability-readiness.ts";

const statusOrder = [
  "Direct",
  "Registered",
  "Exemplar",
  "Missing"
] as const satisfies readonly KpAnimationCapabilityReadinessStatus[];

export interface KpAnimationTransformationCoverageViewModel {
  readonly total: number;
  readonly statusCounts: readonly Readonly<{
    status: KpAnimationCapabilityReadinessStatus;
    count: number;
  }>[];
  readonly rows: readonly KpAnimationTransformationCoverageViewRow[];
}

export interface KpAnimationTransformationCoverageViewRow {
  readonly capabilityId: string;
  readonly order: number;
  readonly domain: string;
  readonly title: string;
  readonly status: KpAnimationCapabilityReadinessStatus;
  readonly remaining: readonly KpAnimationTransformationCoverageRequirement[];
  readonly exemplarLinks: readonly Readonly<{
    assetId: string;
    title: string;
    href?: string | undefined;
  }>[];
  readonly frontendAuthorities: readonly string[];
}

export function createKpAnimationTransformationCoverageViewModel():
KpAnimationTransformationCoverageViewModel {
  // Freshness tests bind this static product projection to the typed plan;
  // the view must not import compiler or asset registries into its route.
  const coverage = generatedCoverage as KpAnimationTransformationCoverage;
  return Object.freeze({
    total: coverage.summary.total,
    statusCounts: Object.freeze(statusOrder.map((status) => Object.freeze({
      status,
      count: coverage.summary.byStatus[status]
    }))),
    rows: Object.freeze(coverage.entries.map((entry) => Object.freeze({
      capabilityId: entry.capabilityId,
      order: entry.order,
      domain: entry.domain,
      title: entry.title,
      status: entry.status,
      remaining: Object.freeze(entry.requirements.filter(
        ({ status }) => status === "missing"
      )),
      exemplarLinks: Object.freeze([...entry.exemplarLinks]),
      frontendAuthorities: Object.freeze(entry.gaps.map(
        ({ authorityId }) => authorityId
      ))
    })))
  });
}
