import type {
  KpBothSidesOperationRegistrationPack
} from "../both-sides-operation-registration.ts";

export const kpAdditiveBothSidesOperationRegistrationPack = Object.freeze({
  id: "kp.both-sides.additive.v1",
  registrations: Object.freeze([
    Object.freeze({
      id: "addBothSides" as const,
      operationKind: "add" as const,
      semanticAuthorityId:
        "definition.generated.linear-solve.add-both-sides",
      lawId: "law.equation.add-both-sides" as const,
      relationDomainEvidenceIds: Object.freeze([
        "assumption.equality.addition-closed"
      ] as const),
      authoringAssumptionEvidenceIds: Object.freeze([
        "assumption.equality.addition-closed"
      ] as const),
      applicationSelection: Object.freeze({
        kind: "introduced-targets" as const
      })
    }),
    Object.freeze({
      id: "subtractBothSides" as const,
      operationKind: "subtract" as const,
      semanticAuthorityId:
        "definition.generated.linear-solve.subtract-both-sides",
      lawId: "law.equation.subtract-both-sides" as const,
      relationDomainEvidenceIds: Object.freeze([
        "assumption.equality.subtraction-closed"
      ] as const),
      authoringAssumptionEvidenceIds: Object.freeze([
        "assumption.equality.subtraction-closed"
      ] as const),
      applicationSelection: Object.freeze({
        kind: "introduced-targets" as const
      })
    })
  ])
} satisfies KpBothSidesOperationRegistrationPack);
