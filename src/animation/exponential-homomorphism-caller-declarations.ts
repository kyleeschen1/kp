import {
  kpExponentialDifferenceToQuotientOperationRegistration,
  kpExponentialHomomorphismRecipeRegistration,
  kpExponentialSumToProductOperationRegistration
} from "./equation-extension-packs/exponential-homomorphism.ts";
import { kpExponentialHomomorphismAnimationId } from
  "./exponential-homomorphism-adapter.ts";
import { kpExponentialQuotientPressureAnimationId } from
  "./exponential-quotient-pressure-adapter.ts";
import { kpCanonicalExponentialHomomorphismAuthority } from
  "../semantic/exponential-homomorphism-exemplar.ts";
import {
  type KpExponentialHomomorphismCorrespondenceAuthority
} from "../semantic/exponential-homomorphism-correspondence.ts";
import { kpExponentialQuotientPressureAuthority } from
  "../semantic/exponential-quotient-pressure.ts";
import type { KpHomomorphicTargetTopology } from
  "./homomorphic-application-handoff-taxonomy.ts";

export interface KpExponentialHomomorphismCallerDeclaration {
  readonly callerId:
    | typeof kpExponentialHomomorphismAnimationId
    | typeof kpExponentialQuotientPressureAnimationId;
  readonly callerRegistrationId: string;
  readonly operationKind:
    | typeof kpExponentialSumToProductOperationRegistration.id
    | typeof kpExponentialDifferenceToQuotientOperationRegistration.id;
  readonly recipeId: typeof kpExponentialHomomorphismRecipeRegistration.id;
  readonly semanticAuthorityId:
    KpExponentialHomomorphismCorrespondenceAuthority["lawId"];
  readonly targetTopology: KpHomomorphicTargetTopology;
  readonly correspondenceAuthority:
    KpExponentialHomomorphismCorrespondenceAuthority;
}

/** Lightweight declarations let discovery load exact semantics, not renderers. */
export const kpExponentialHomomorphismCallerDeclarations = Object.freeze([
  declaration({
    callerId: kpExponentialHomomorphismAnimationId,
    callerRegistrationId:
      "caller-registration.exponential.sum-to-product.v1",
    operationKind: kpExponentialSumToProductOperationRegistration.id,
    recipeId: kpExponentialHomomorphismRecipeRegistration.id,
    semanticAuthorityId:
      kpCanonicalExponentialHomomorphismAuthority.lawId,
    targetTopology: "lateral-product",
    correspondenceAuthority: kpCanonicalExponentialHomomorphismAuthority
  }),
  declaration({
    callerId: kpExponentialQuotientPressureAnimationId,
    callerRegistrationId:
      "caller-registration.exponential.difference-to-quotient.v1",
    operationKind: kpExponentialDifferenceToQuotientOperationRegistration.id,
    recipeId: kpExponentialHomomorphismRecipeRegistration.id,
    semanticAuthorityId: kpExponentialQuotientPressureAuthority.lawId,
    targetTopology: "vertical-quotient",
    correspondenceAuthority: kpExponentialQuotientPressureAuthority
  })
] as const satisfies readonly KpExponentialHomomorphismCallerDeclaration[]);

function declaration(
  input: KpExponentialHomomorphismCallerDeclaration
): KpExponentialHomomorphismCallerDeclaration {
  return Object.freeze({ ...input });
}
