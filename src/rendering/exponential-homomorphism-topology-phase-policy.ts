import type { KpHomomorphicTargetTopology } from
  "../animation/homomorphic-application-handoff-taxonomy.ts";

export interface KpExponentialHomomorphismProgressWindow {
  readonly start: number;
  readonly end: number;
}

interface KpExponentialHomomorphismSharedTopologyPhases {
  readonly anchorSettlement: KpExponentialHomomorphismProgressWindow;
  readonly outwardTransit: KpExponentialHomomorphismProgressWindow;
  readonly carrierFission: KpExponentialHomomorphismProgressWindow;
  readonly carrierFollowerReveal: KpExponentialHomomorphismProgressWindow;
}

export type KpExponentialHomomorphismTopologyPhasePolicy =
  | Readonly<KpExponentialHomomorphismSharedTopologyPhases & {
      topology: "lateral-product";
      causalOrder: "connector-retires-with-branch-transit";
      motionAxisConstraint: "horizontal";
      sourceConnectorContraction:
        KpExponentialHomomorphismProgressWindow;
      sourceConnectorRelease: KpExponentialHomomorphismProgressWindow;
      targetConnectorEntry: "native-juxtaposition";
    }>
  | Readonly<KpExponentialHomomorphismSharedTopologyPhases & {
      topology: "vertical-quotient";
      causalOrder: "source-clear-then-transit-then-target-entry";
      motionAxisConstraint: "measured-direct";
      sourceConnectorContraction:
        KpExponentialHomomorphismProgressWindow;
      sourceConnectorRelease: KpExponentialHomomorphismProgressWindow;
      targetConnectorEntry: KpExponentialHomomorphismProgressWindow;
    }>;

type KpExponentialHomomorphismTopologyPhasePolicyMap = Readonly<{
  [Topology in KpHomomorphicTargetTopology]: Extract<
    KpExponentialHomomorphismTopologyPhasePolicy,
    { readonly topology: Topology }
  >;
}>;

const sharedPhases = Object.freeze({
  anchorSettlement: window(0.16, 0.22),
  outwardTransit: window(0.16, 0.3),
  carrierFission: window(0.16, 0.3),
  carrierFollowerReveal: window(0.16, 0.22)
});

/**
 * Adding a target topology makes this record fail typechecking until its
 * causal paint order is explicit. Geometry still needs browser measurement;
 * this policy prevents structurally unsafe phase overlap before that audit.
 */
export const kpExponentialHomomorphismTopologyPhasePolicies = Object.freeze({
  "lateral-product": defineKpExponentialHomomorphismTopologyPhasePolicy({
    ...sharedPhases,
    topology: "lateral-product",
    causalOrder: "connector-retires-with-branch-transit",
    motionAxisConstraint: "horizontal",
    sourceConnectorContraction: window(0.16, 0.24),
    sourceConnectorRelease: window(0.16, 0.3),
    targetConnectorEntry: "native-juxtaposition"
  }),
  "vertical-quotient": defineKpExponentialHomomorphismTopologyPhasePolicy({
    ...sharedPhases,
    topology: "vertical-quotient",
    causalOrder: "source-clear-then-transit-then-target-entry",
    motionAxisConstraint: "measured-direct",
    sourceConnectorContraction: window(0.08, 0.14),
    sourceConnectorRelease: window(0.1, 0.16),
    targetConnectorEntry: window(0.3, 0.36)
  })
} satisfies KpExponentialHomomorphismTopologyPhasePolicyMap);

export function requireKpExponentialHomomorphismTopologyPhasePolicy(
  topology: "lateral-product"
): Extract<
  KpExponentialHomomorphismTopologyPhasePolicy,
  { readonly topology: "lateral-product" }
>;
export function requireKpExponentialHomomorphismTopologyPhasePolicy(
  topology: "vertical-quotient"
): Extract<
  KpExponentialHomomorphismTopologyPhasePolicy,
  { readonly topology: "vertical-quotient" }
>;
export function requireKpExponentialHomomorphismTopologyPhasePolicy(
  topology: KpHomomorphicTargetTopology
): KpExponentialHomomorphismTopologyPhasePolicy;
export function requireKpExponentialHomomorphismTopologyPhasePolicy(
  topology: KpHomomorphicTargetTopology
): KpExponentialHomomorphismTopologyPhasePolicy {
  return kpExponentialHomomorphismTopologyPhasePolicies[topology];
}

export function defineKpExponentialHomomorphismTopologyPhasePolicy<
  Policy extends KpExponentialHomomorphismTopologyPhasePolicy
>(policy: Policy): Policy {
  for (const [name, value] of Object.entries(policy)) {
    if (isProgressWindow(value)) assertWindow(name, value);
  }
  if (policy.topology === "lateral-product") {
    if (
      policy.sourceConnectorRelease.start !== policy.outwardTransit.start ||
      policy.sourceConnectorRelease.end !== policy.outwardTransit.end
    ) {
      throw new Error(
        "Lateral-product connector release must coincide with branch transit."
      );
    }
  } else if (
    policy.sourceConnectorRelease.end > policy.outwardTransit.start ||
    policy.outwardTransit.end > policy.targetConnectorEntry.start
  ) {
    throw new Error(
      "Vertical-quotient phases must clear source paint before transit and transit before target structural entry."
    );
  }
  return Object.freeze(policy);
}

function window(
  start: number,
  end: number
): KpExponentialHomomorphismProgressWindow {
  return Object.freeze({ start, end });
}

function isProgressWindow(
  value: unknown
): value is KpExponentialHomomorphismProgressWindow {
  return typeof value === "object" && value !== null &&
    "start" in value && "end" in value;
}

function assertWindow(
  name: string,
  value: KpExponentialHomomorphismProgressWindow
): void {
  if (
    !Number.isFinite(value.start) || !Number.isFinite(value.end) ||
    value.start < 0 || value.end > 1 || value.start >= value.end
  ) {
    throw new Error(`${name} must be an increasing unit-progress window.`);
  }
}
