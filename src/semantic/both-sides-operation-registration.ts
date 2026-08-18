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
import {
  kpLogarithmicBothSidesOperationRegistrationPack
} from "./both-sides-operation-registrations/logarithmic.ts";

export type KpBothSidesApplicationSelection =
  | {
      readonly kind: "introduced-targets";
    }
  | {
      readonly kind: "correspondence-records";
      readonly recordIds: readonly [string, ...string[]];
      readonly endpoints: "source-and-target";
    };

interface KpAddBothSidesOperationRegistration {
  readonly id: "addBothSides";
  readonly operationKind: "add";
  readonly semanticAuthorityId: string;
  readonly lawId: "law.equation.add-both-sides";
  readonly relationDomainEvidenceIds: readonly [string, ...string[]];
  readonly authoringAssumptionEvidenceIds: readonly [string, ...string[]];
  readonly applicationSelection: KpBothSidesApplicationSelection;
}

interface KpSubtractBothSidesOperationRegistration {
  readonly id: "subtractBothSides";
  readonly operationKind: "subtract";
  readonly semanticAuthorityId: string;
  readonly lawId: "law.equation.subtract-both-sides";
  readonly relationDomainEvidenceIds: readonly [string, ...string[]];
  readonly authoringAssumptionEvidenceIds: readonly [string, ...string[]];
  readonly applicationSelection: KpBothSidesApplicationSelection;
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
  readonly authoringAssumptionEvidenceIds: readonly [string, ...string[]];
  readonly applicationSelection: KpBothSidesApplicationSelection;
}

interface KpDivideBothSidesOperationRegistration {
  readonly id: "divideBothSides";
  readonly operationKind: "divide";
  readonly semanticAuthorityId: string;
  readonly lawId: "law.equation.divide-both-sides";
  readonly nonzeroEvidenceId: string;
  readonly authoringAssumptionEvidenceIds: readonly [string, ...string[]];
  readonly applicationSelection: KpBothSidesApplicationSelection;
}

export type KpMultiplicativeBothSidesOperationRegistration =
  | KpMultiplyBothSidesOperationRegistration
  | KpDivideBothSidesOperationRegistration;

interface KpApplyNaturalLogBothSidesOperationRegistration {
  readonly id: "applyNaturalLogBothSides";
  readonly operationKind: "apply-injective-function";
  readonly semanticAuthorityId: string;
  readonly lawId: "law.equation.apply-injective-function";
  readonly functionSemanticId: "semantic.function.natural-log";
  readonly lhsArgumentSemanticId: "semantic.power.two-to-x";
  readonly rhsArgumentSemanticId: "semantic.value.seven";
  readonly lhsDomainEvidenceId: string;
  readonly rhsDomainEvidenceId: string;
  readonly injectivityEvidenceId: string;
  readonly authoringAssumptionEvidenceIds: readonly [string, ...string[]];
  readonly applicationSelection: KpBothSidesApplicationSelection;
}

interface KpDivideBothSidesByLogBaseOperationRegistration {
  readonly id: "divideBothSidesByLogBase";
  readonly operationKind: "divide";
  readonly semanticAuthorityId: string;
  readonly lawId: "law.equation.divide-both-sides";
  readonly nonzeroEvidenceId: string;
  readonly authoringAssumptionEvidenceIds: readonly [string, ...string[]];
  readonly applicationSelection: KpBothSidesApplicationSelection;
}

export type KpLogarithmicBothSidesOperationRegistration =
  | KpApplyNaturalLogBothSidesOperationRegistration
  | KpDivideBothSidesByLogBaseOperationRegistration;

export type KpBothSidesOperationRegistration =
  | KpAdditiveBothSidesOperationRegistration
  | KpMultiplicativeBothSidesOperationRegistration
  | KpLogarithmicBothSidesOperationRegistration;

export interface KpBothSidesOperationRegistrationPack {
  readonly id: string;
  readonly registrations: readonly KpBothSidesOperationRegistration[];
}

export const kpBothSidesOperationRegistrationPacks = Object.freeze([
  kpAdditiveBothSidesOperationRegistrationPack,
  kpMultiplicativeBothSidesOperationRegistrationPack,
  kpLogarithmicBothSidesOperationRegistrationPack
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
