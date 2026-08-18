import {
  createKpClosedDispatchRegistry,
  type KpClosedDispatchRegistry
} from "../domain-ir/equation-extension-registry.ts";
import {
  kpAdditiveBothSidesOperationRegistrationPack
} from "./both-sides-operation-registrations/additive.ts";
import {
  kpMultiplicativeBothSidesOperationRegistrationPack
} from "./both-sides-operation-registrations/multiplicative.ts";

interface KpAddBothSidesOperationRegistration {
  readonly id: "addBothSides";
  readonly operationKind: "add";
  readonly semanticAuthorityId: string;
  readonly lawId: "law.equation.add-both-sides";
  readonly relationDomainEvidenceIds: readonly [string, ...string[]];
}

interface KpSubtractBothSidesOperationRegistration {
  readonly id: "subtractBothSides";
  readonly operationKind: "subtract";
  readonly semanticAuthorityId: string;
  readonly lawId: "law.equation.subtract-both-sides";
  readonly relationDomainEvidenceIds: readonly [string, ...string[]];
}

export type KpAdditiveBothSidesOperationRegistration =
  | KpAddBothSidesOperationRegistration
  | KpSubtractBothSidesOperationRegistration;

interface KpMultiplyBothSidesOperationRegistration {
  readonly id: "multiplyBothSides";
  readonly operationKind: "multiply";
  readonly semanticAuthorityId: string;
  readonly lawId: "law.equation.multiply-both-sides";
  readonly nonzeroEvidenceId: string;
}

interface KpDivideBothSidesOperationRegistration {
  readonly id: "divideBothSides";
  readonly operationKind: "divide";
  readonly semanticAuthorityId: string;
  readonly lawId: "law.equation.divide-both-sides";
  readonly nonzeroEvidenceId: string;
}

export type KpMultiplicativeBothSidesOperationRegistration =
  | KpMultiplyBothSidesOperationRegistration
  | KpDivideBothSidesOperationRegistration;

export type KpBothSidesOperationRegistration =
  | KpAdditiveBothSidesOperationRegistration
  | KpMultiplicativeBothSidesOperationRegistration;

export interface KpBothSidesOperationRegistrationPack {
  readonly id: string;
  readonly registrations: readonly KpBothSidesOperationRegistration[];
}

export const kpBothSidesOperationRegistrationPacks = Object.freeze([
  kpAdditiveBothSidesOperationRegistrationPack,
  kpMultiplicativeBothSidesOperationRegistrationPack
] satisfies readonly KpBothSidesOperationRegistrationPack[]);

export const kpBothSidesOperationRegistrationRegistry:
KpClosedDispatchRegistry<string, KpBothSidesOperationRegistration> =
  createKpClosedDispatchRegistry(
    "both-sides operation",
    kpBothSidesOperationRegistrationPacks.flatMap(
      ({ registrations }): readonly KpBothSidesOperationRegistration[] =>
        registrations
    )
  );

export function findKpBothSidesOperationRegistration(
  transformType: string
): KpBothSidesOperationRegistration | undefined {
  return kpBothSidesOperationRegistrationRegistry.byId[transformType];
}
