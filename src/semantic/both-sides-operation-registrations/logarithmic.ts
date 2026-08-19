import type {
  KpBothSidesOperationRegistrationPack
} from "../both-sides-operation-registration.ts";

export const kpLogarithmicBothSidesOperationRegistrationPack = Object.freeze({
  id: "kp.both-sides.logarithmic.v1",
  registrations: Object.freeze([
    Object.freeze({
      id: "applyNaturalLogBothSides" as const,
      operationKind: "apply-injective-function" as const,
      authoringSummary:
        "Apply the natural logarithm to both positive sides of an equation.",
      semanticAuthorityId:
        "transformation.log-exponent.apply-log-both-sides",
      lawId: "law.equation.apply-injective-function" as const,
      functionSemanticId: "semantic.function.natural-log" as const,
      lhsArgumentSemanticId: "semantic.power.two-to-x" as const,
      rhsArgumentSemanticId: "semantic.value.seven" as const,
      lhsDomainEvidenceId:
        "assumption.log-exponent.power-positive",
      rhsDomainEvidenceId:
        "assumption.log-exponent.right-positive",
      injectivityEvidenceId:
        "assumption.log-exponent.log-injective",
      authoringAssumptionEvidenceIds: Object.freeze([
        "assumption.log-exponent.power-positive",
        "assumption.log-exponent.right-positive",
        "assumption.log-exponent.log-injective"
      ] as const),
      applicationSelection: Object.freeze({
        kind: "introduced-targets" as const
      })
    }),
    Object.freeze({
      id: "divideBothSidesByLogBase" as const,
      operationKind: "divide" as const,
      authoringSummary:
        "Divide both sides by the same verified nonzero logarithm of the base.",
      semanticAuthorityId:
        "transformation.log-exponent.divide-by-log-base",
      lawId: "law.equation.divide-both-sides" as const,
      nonzeroEvidenceId:
        "assumption.log-exponent.log-base-nonzero",
      authoringAssumptionEvidenceIds: Object.freeze([
        "assumption.log-exponent.log-base-nonzero"
      ] as const),
      applicationSelection: Object.freeze({
        kind: "correspondence-records" as const,
        recordIds: Object.freeze([
          "correspondence.divide-log-base.log-base-value"
        ] as const),
        endpoints: "source-and-target" as const
      })
    })
  ])
} satisfies KpBothSidesOperationRegistrationPack);
