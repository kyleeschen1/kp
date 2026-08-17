import {
  kpHomomorphicCrossoverRecipeRegistration,
  kpLogProductHomomorphicOperationRegistration,
  kpLogQuotientHomomorphicOperationRegistration
} from "./equation-extension-packs/homomorphic-crossover.ts";
import {
  kpLogProductAnimationIds
} from "../semantic/log-product-ids.ts";
import { kpLogQuotientAnimationId } from
  "../semantic/log-quotient-ids.ts";

export interface KpHomomorphicCrossoverCallerDeclaration {
  readonly callerId: string;
  readonly callerRegistrationId: string;
  readonly semanticMotionOperationId:
    | "kp.semantic-motion.log-product"
    | "kp.semantic-motion.quotient";
  readonly semanticAuthorityId:
    | "law.logarithm.product"
    | "law.logarithm.quotient";
  readonly operationKind:
    | typeof kpLogProductHomomorphicOperationRegistration.id
    | typeof kpLogQuotientHomomorphicOperationRegistration.id;
  readonly recipeId: typeof kpHomomorphicCrossoverRecipeRegistration.id;
}

const productRegistrationId =
  "caller-registration.log-product.homomorphic-crossover.v1";
const quotientRegistrationId =
  "caller-registration.log-quotient.homomorphic-crossover.v1";

/** Lightweight exact caller declarations are safe for catalogues and tooling. */
export const kpHomomorphicCrossoverCallerDeclarations = Object.freeze([
  ...kpLogProductAnimationIds.map((callerId) => declaration({
    callerId,
    callerRegistrationId: productRegistrationId,
    semanticMotionOperationId: "kp.semantic-motion.log-product",
    semanticAuthorityId: "law.logarithm.product",
    operationKind: kpLogProductHomomorphicOperationRegistration.id,
    recipeId: kpHomomorphicCrossoverRecipeRegistration.id
  })),
  declaration({
    callerId: kpLogQuotientAnimationId,
    callerRegistrationId: quotientRegistrationId,
    semanticMotionOperationId: "kp.semantic-motion.quotient",
    semanticAuthorityId: "law.logarithm.quotient",
    operationKind: kpLogQuotientHomomorphicOperationRegistration.id,
    recipeId: kpHomomorphicCrossoverRecipeRegistration.id
  })
]);

function declaration(
  input: KpHomomorphicCrossoverCallerDeclaration
): KpHomomorphicCrossoverCallerDeclaration {
  return Object.freeze({ ...input });
}
