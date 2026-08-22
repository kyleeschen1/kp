import {
  kpHomomorphicCausalPhaseIds,
  type KpHomomorphicCausalPhaseId
} from "../domain-ir/homomorphic-causal-phases.ts";
import type {
  KpHomomorphicCrossoverPhaseBinding
} from "./homomorphic-crossover-caller-registration.ts";

function binding(
  phaseId: KpHomomorphicCausalPhaseId,
  eventIds: readonly [string, ...string[]],
  realization: "dedicated" | "coalesced" = "dedicated"
): KpHomomorphicCrossoverPhaseBinding {
  return Object.freeze({
    phaseId,
    eventIds: Object.freeze([...eventIds]) as readonly [string, ...string[]],
    realization
  });
}

// Product phase realization is shared data so local presentation follows the
// validated semantic schedule instead of copying event names into a renderer.
export const kpLogProductHomomorphicCausalPhaseBindings = Object.freeze([
  binding(kpHomomorphicCausalPhaseIds.orient,
    ["event.log-product.orient"]),
  binding(kpHomomorphicCausalPhaseIds.releaseSourceSyntax,
    ["event.log-product.release-shells", "event.log-product.depart"]),
  binding(kpHomomorphicCausalPhaseIds.transferPayload,
    ["event.log-product.arrive"]),
  binding(kpHomomorphicCausalPhaseIds.receiveTargetApplications,
    ["event.log-product.attach-target"], "coalesced"),
  binding(kpHomomorphicCausalPhaseIds.resolveTargetConnector,
    ["event.log-product.attach-target"], "coalesced"),
  binding(kpHomomorphicCausalPhaseIds.settleTarget,
    ["event.log-product.settle"]),
  binding(kpHomomorphicCausalPhaseIds.yieldNativeTarget,
    ["event.log-product.native-target-ready"])
]);

