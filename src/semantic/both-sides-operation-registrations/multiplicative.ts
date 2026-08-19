import type {
  KpBothSidesOperationRegistrationPack
} from "../both-sides-operation-registration.ts";

export const kpMultiplicativeBothSidesOperationRegistrationPack =
Object.freeze({
  id: "kp.both-sides.multiplicative.v1",
  registrations: Object.freeze([
    Object.freeze({
      id: "multiplyBothSides" as const,
      operationKind: "multiply" as const,
      authoringSummary:
        "Multiply both sides of an equation by the same nonzero quantity.",
      semanticAuthorityId:
        "definition.symbolic.algebra.multiply-both-sides",
      lawId: "law.equation.multiply-both-sides" as const,
      nonzeroEvidenceId:
        "assumption.equality.multiply-operand-nonzero",
      authoringAssumptionEvidenceIds: Object.freeze([
        "assumption.equality.multiply-operand-nonzero"
      ] as const),
      applicationSelection: Object.freeze({
        kind: "introduced-targets" as const
      })
    }),
    Object.freeze({
      id: "divideBothSides" as const,
      operationKind: "divide" as const,
      authoringSummary:
        "Divide both sides of an equation by the same nonzero quantity.",
      semanticAuthorityId:
        "definition.generated.linear-solve.divide-both-sides",
      lawId: "law.equation.divide-both-sides" as const,
      nonzeroEvidenceId:
        "assumption.equality.divide-operand-nonzero",
      authoringAssumptionEvidenceIds: Object.freeze([
        "assumption.equality.divide-operand-nonzero"
      ] as const),
      applicationSelection: Object.freeze({
        kind: "introduced-targets" as const
      })
    })
  ])
} satisfies KpBothSidesOperationRegistrationPack);
