import {
  isKpValidatedEquationExtensionPack,
  validateKpEquationExtensionPack
} from "../domain-ir/equation-extension-pack-validator.ts";
import {
  kpCanonicalHomomorphicCausalPhaseGrammar,
  kpHomomorphicCausalPhaseIds,
  type KpHomomorphicCausalPhaseId
} from "../domain-ir/homomorphic-causal-phases.ts";
import {
  kpCanonicalLogProductSemanticMotionPrecedence,
  kpLogProductSemanticMotionBundles
} from "../semantic/log-product-semantic-motion.ts";
import {
  kpCanonicalLogQuotientSemanticMotionPrecedence
} from "../semantic/log-quotient-semantic-motion.ts";
import { kpLogQuotientAnimationId } from
  "../semantic/log-quotient-ids.ts";
import {
  createKpHomomorphicCrossoverEquationExtensionPack,
  kpHomomorphicCrossoverRecipeRegistration,
  kpLogProductHomomorphicOperationRegistration,
  kpLogQuotientHomomorphicOperationRegistration
} from "./equation-extension-packs/homomorphic-crossover.ts";
import {
  registerKpHomomorphicCrossoverCaller,
  type KpHomomorphicCrossoverPhaseBinding
} from "./homomorphic-crossover-caller-registration.ts";

const validation = validateKpEquationExtensionPack(
  createKpHomomorphicCrossoverEquationExtensionPack()
);
if (validation.status !== "valid") {
  throw new Error(validation.diagnostics.map(({ message }) => message).join("\n"));
}
const registryAuthority = validation.validatedPack;
if (!isKpValidatedEquationExtensionPack(registryAuthority)) {
  throw new Error("Homomorphic crossover requires validated registry authority.");
}

export const kpLogProductHomomorphicCrossoverCallerRegistration =
  registerKpHomomorphicCrossoverCaller({
    id: "caller-registration.log-product.homomorphic-crossover.v1",
    callerIds: kpLogProductSemanticMotionBundles.map(
      ({ operation }) => operation.contract.animationId
    ) as [string, ...string[]],
    semanticMotionOperationId: "kp.semantic-motion.log-product",
    semanticAuthorityId: "law.logarithm.product",
    operationRegistration: kpLogProductHomomorphicOperationRegistration,
    recipeId: kpHomomorphicCrossoverRecipeRegistration.id,
    grammar: kpCanonicalHomomorphicCausalPhaseGrammar,
    precedence: kpCanonicalLogProductSemanticMotionPrecedence,
    phaseBindings: [
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
    ],
    registryAuthority
  });

export const kpLogQuotientHomomorphicCrossoverCallerRegistration =
  registerKpHomomorphicCrossoverCaller({
    id: "caller-registration.log-quotient.homomorphic-crossover.v1",
    callerIds: [kpLogQuotientAnimationId],
    semanticMotionOperationId: "kp.semantic-motion.quotient",
    semanticAuthorityId: "law.logarithm.quotient",
    operationRegistration: kpLogQuotientHomomorphicOperationRegistration,
    recipeId: kpHomomorphicCrossoverRecipeRegistration.id,
    grammar: kpCanonicalHomomorphicCausalPhaseGrammar,
    precedence: kpCanonicalLogQuotientSemanticMotionPrecedence,
    phaseBindings: [
      binding(kpHomomorphicCausalPhaseIds.orient,
        ["event.log-quotient.orient"]),
      binding(kpHomomorphicCausalPhaseIds.releaseSourceSyntax,
        ["event.log-quotient.clear-enclosures"]),
      binding(kpHomomorphicCausalPhaseIds.transferPayload, [
        "event.log-quotient.arguments-depart",
        "event.log-quotient.arguments-arrive"
      ]),
      binding(kpHomomorphicCausalPhaseIds.receiveTargetApplications,
        ["event.log-quotient.target-attachment"], "coalesced"),
      binding(kpHomomorphicCausalPhaseIds.resolveTargetConnector,
        ["event.log-quotient.target-attachment"], "coalesced"),
      binding(kpHomomorphicCausalPhaseIds.settleTarget,
        ["event.log-quotient.target-attachment"], "coalesced"),
      binding(kpHomomorphicCausalPhaseIds.yieldNativeTarget,
        ["event.log-quotient.native-target-ready"])
    ],
    registryAuthority
  });

export const kpHomomorphicCrossoverCallerRegistrations = Object.freeze([
  kpLogProductHomomorphicCrossoverCallerRegistration,
  kpLogQuotientHomomorphicCrossoverCallerRegistration
]);

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
