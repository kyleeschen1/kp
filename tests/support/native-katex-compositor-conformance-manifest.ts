import type {
  KpConformanceCoveragePlan,
  KpConformanceCoverageScenario
} from "./native-katex-compositor-pairwise-coverage.ts";

export const KP_NATIVE_KATEX_CONFORMANCE_MANIFEST_SCHEMA_VERSION = 1;

export interface KpNativeKatexConformanceManifestScenario {
  readonly id: string;
  readonly assignments: Readonly<Record<string, string>>;
  readonly inclusionKind: "pairwise" | "three-way-override";
  readonly newlyCoveredPairKeys: readonly string[];
  readonly overrideIds: readonly string[];
  readonly explanation: string;
}

export interface KpNativeKatexConformanceCoverageManifest {
  readonly kind: "native-katex-compositor-conformance-manifest";
  readonly schemaVersion: number;
  readonly coverageComplete: boolean;
  readonly counts: {
    readonly factors: number;
    readonly scenarios: number;
    readonly requiredPairs: number;
    readonly coveredPairs: number;
    readonly threeWayOverrides: number;
  };
  readonly factors: readonly {
    readonly id: string;
    readonly values: readonly string[];
  }[];
  readonly scenarios: readonly KpNativeKatexConformanceManifestScenario[];
}

export function createKpNativeKatexConformanceCoverageManifest(
  plan: KpConformanceCoveragePlan
): KpNativeKatexConformanceCoverageManifest {
  const covered = new Set(plan.coveredPairKeys);
  const coverageComplete = plan.requiredPairKeys.every((pairKey) =>
    covered.has(pairKey)
  );
  const scenarios = plan.scenarios.map(toManifestScenario);

  return Object.freeze({
    kind: "native-katex-compositor-conformance-manifest" as const,
    schemaVersion: KP_NATIVE_KATEX_CONFORMANCE_MANIFEST_SCHEMA_VERSION,
    coverageComplete,
    counts: Object.freeze({
      factors: plan.factors.length,
      scenarios: scenarios.length,
      requiredPairs: plan.requiredPairKeys.length,
      coveredPairs: plan.coveredPairKeys.length,
      threeWayOverrides: plan.overrideIds.length
    }),
    factors: Object.freeze(plan.factors.map((factor) => Object.freeze({
      id: factor.id,
      values: Object.freeze([...factor.values])
    }))),
    scenarios: Object.freeze(scenarios)
  });
}

export function serializeKpNativeKatexConformanceCoverageManifest(
  manifest: KpNativeKatexConformanceCoverageManifest
): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function toManifestScenario(
  scenario: KpConformanceCoverageScenario
): KpNativeKatexConformanceManifestScenario {
  const pairCount = scenario.inclusion.newlyCoveredPairKeys.length;
  const pairLabel = pairCount === 1 ? "pair requirement" : "pair requirements";
  const explanation = scenario.inclusion.kind === "three-way-override"
    ? `Required by three-way risk override(s): ${scenario.inclusion.overrideIds.join(", ")}; first covers ${pairCount} ${pairLabel}.`
    : `Selected to first cover ${pairCount} ${pairLabel}.`;

  return Object.freeze({
    id: scenario.id,
    assignments: Object.freeze({ ...scenario.assignments }),
    inclusionKind: scenario.inclusion.kind,
    newlyCoveredPairKeys: Object.freeze([
      ...scenario.inclusion.newlyCoveredPairKeys
    ]),
    overrideIds: Object.freeze([...scenario.inclusion.overrideIds]),
    explanation
  });
}
