import { kpExponentialHomomorphismCallerDeclarations } from
  "../animation/exponential-homomorphism-caller-declarations.ts";
import { kpExponentialHomomorphismTopologyPhasePolicies } from
  "../rendering/exponential-homomorphism-topology-phase-policy.ts";
import { createKpAnimationTransformationCoverage } from
  "./animation-transformation-coverage.ts";

export type KpExponentialHomomorphismCertifiedBrowser =
  | "chromium"
  | "firefox";

export interface KpExponentialHomomorphismBrowserCertification<
  Engine extends KpExponentialHomomorphismCertifiedBrowser
> {
  readonly engine: Engine;
  readonly geometryAuthority: "measured-visible-paint";
  readonly verifies: readonly [
    "continuous-playback",
    "intermediate-paint",
    "native-terminal-endpoint"
  ];
  readonly command: Engine extends "chromium"
    ? "npm run test:browser:exponential-homomorphism"
    : "npm run check:live-exponential-quotient-playback:firefox";
}

export type KpExponentialHomomorphismBrowserCertificationTuple = readonly [
  KpExponentialHomomorphismBrowserCertification<"chromium">,
  KpExponentialHomomorphismBrowserCertification<"firefox">
];

export const kpExponentialHomomorphismBrowserCertification = Object.freeze([
  browserCertification({
    engine: "chromium",
    geometryAuthority: "measured-visible-paint",
    verifies: [
      "continuous-playback",
      "intermediate-paint",
      "native-terminal-endpoint"
    ],
    command: "npm run test:browser:exponential-homomorphism"
  }),
  browserCertification({
    engine: "firefox",
    geometryAuthority: "measured-visible-paint",
    verifies: [
      "continuous-playback",
      "intermediate-paint",
      "native-terminal-endpoint"
    ],
    command: "npm run check:live-exponential-quotient-playback:firefox"
  })
] as const satisfies KpExponentialHomomorphismBrowserCertificationTuple);

/**
 * Promotion is derived from exact compiler/asset evidence and a typed browser
 * tuple. TypeScript closes the topology vocabulary; browser checks certify the
 * real KaTeX ink and paint ordering that static types cannot observe.
 */
export function certifyKpExponentialHomomorphismNarrowPromotion() {
  const coverage = createKpAnimationTransformationCoverage().entries.find(
    ({ capabilityId }) => capabilityId ===
      "capability.equation.exponential-homomorphism"
  );
  const topologyIds = Object.keys(
    kpExponentialHomomorphismTopologyPhasePolicies
  ).sort();
  const callerTopologies = [...new Set(
    kpExponentialHomomorphismCallerDeclarations.map(({ targetTopology }) =>
      targetTopology
    )
  )].sort();
  if (
    coverage?.status !== "Direct" ||
    coverage.remainingRequirementIds.length !== 0 ||
    JSON.stringify(topologyIds) !== JSON.stringify(callerTopologies)
  ) {
    throw new Error(
      "Exponential narrow promotion requires exact direct evidence and one causal policy per reviewed caller topology."
    );
  }
  return Object.freeze({
    schemaVersion:
      "kp.exponential-homomorphism-narrow-promotion.v1" as const,
    kind: "exponential-homomorphism-narrow-promotion-certificate" as const,
    status: "promoted" as const,
    capabilityId: coverage.capabilityId,
    operationIds: Object.freeze(
      kpExponentialHomomorphismCallerDeclarations.map(({ operationKind }) =>
        operationKind
      )
    ),
    topologyIds: Object.freeze(topologyIds),
    browserCertification: kpExponentialHomomorphismBrowserCertification,
    excludedOperationFamilies: Object.freeze([
      "scalar-power-transport",
      "inverse-cancellation"
    ] as const)
  });
}

function browserCertification<
  Engine extends KpExponentialHomomorphismCertifiedBrowser
>(value: KpExponentialHomomorphismBrowserCertification<Engine>):
KpExponentialHomomorphismBrowserCertification<Engine> {
  return Object.freeze({
    ...value,
    verifies: Object.freeze([...value.verifies]) as typeof value.verifies
  });
}
