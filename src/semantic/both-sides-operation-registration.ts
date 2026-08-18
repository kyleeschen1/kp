import {
  createKpClosedDispatchRegistry,
  type KpClosedDispatchRegistry
} from "../domain-ir/equation-extension-registry.ts";
import {
  kpAdditiveBothSidesOperationRegistrationPack
} from "./both-sides-operation-registrations/additive.ts";

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

export type KpBothSidesOperationRegistration =
  KpAdditiveBothSidesOperationRegistration;

export interface KpBothSidesOperationRegistrationPack {
  readonly id: string;
  readonly registrations: readonly KpBothSidesOperationRegistration[];
}

export const kpBothSidesOperationRegistrationPacks = Object.freeze([
  kpAdditiveBothSidesOperationRegistrationPack
] satisfies readonly KpBothSidesOperationRegistrationPack[]);

export const kpBothSidesOperationRegistrationRegistry:
KpClosedDispatchRegistry<string, KpBothSidesOperationRegistration> =
  createKpClosedDispatchRegistry(
    "both-sides operation",
    kpBothSidesOperationRegistrationPacks.flatMap(
      ({ registrations }) => registrations
    )
  );

export function findKpBothSidesOperationRegistration(
  transformType: string
): KpBothSidesOperationRegistration | undefined {
  return kpBothSidesOperationRegistrationRegistry.byId[transformType];
}
