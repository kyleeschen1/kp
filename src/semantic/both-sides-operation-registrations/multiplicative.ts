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
      semanticAuthorityId:
        "definition.symbolic.algebra.multiply-both-sides",
      lawId: "law.equation.multiply-both-sides" as const,
      nonzeroEvidenceId:
        "assumption.equality.multiply-operand-nonzero",
      applicationSelection: Object.freeze({
        kind: "introduced-targets" as const
      })
    }),
    Object.freeze({
      id: "divideBothSides" as const,
      operationKind: "divide" as const,
      semanticAuthorityId:
        "definition.generated.linear-solve.divide-both-sides",
      lawId: "law.equation.divide-both-sides" as const,
      nonzeroEvidenceId:
        "assumption.equality.divide-operand-nonzero",
      applicationSelection: Object.freeze({
        kind: "introduced-targets" as const
      })
    })
  ])
} satisfies KpBothSidesOperationRegistrationPack);
