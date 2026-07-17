export interface KpCancellationOperationAuthority {
  readonly operationId: string;
  readonly sourceTransformType: string;
  readonly witnessId:
    | "witness.additive-identity.zero"
    | "witness.multiplicative-identity.one";
  readonly authority: {
    readonly kind: "transformation-definition";
    readonly refId: string;
  };
}

const kpCancellationOperationAuthorities:
  readonly KpCancellationOperationAuthority[] = [
    {
      operationId: "kp.algebra.cancel-additive-inverses",
      sourceTransformType: "cancelAdditiveInverses",
      witnessId: "witness.additive-identity.zero",
      authority: {
        kind: "transformation-definition",
        refId: "definition.generated.linear-solve.cancel-additive-inverses"
      }
    },
    {
      operationId: "kp.algebra.cancel-multiplicative-inverses",
      sourceTransformType: "cancelMultiplicativeInverses",
      witnessId: "witness.multiplicative-identity.one",
      authority: {
        kind: "transformation-definition",
        refId: "definition.generated.linear-solve.cancel-multiplicative-inverses"
      }
    },
    {
      operationId: "kp.algebra.simplify-unit-fraction-factor",
      sourceTransformType: "simplifyUnitFractionFactor",
      witnessId: "witness.multiplicative-identity.one",
      authority: {
        kind: "transformation-definition",
        refId: "definition.generated.fraction-expression.simplify-unit-factor"
      }
    }
  ];

export function cancellationOperationAuthority(
  operationId: string
): KpCancellationOperationAuthority | undefined {
  return kpCancellationOperationAuthorities.find((candidate) =>
    candidate.operationId === operationId
  );
}

export function cancellationWitnessIdsForOperation(
  operationId: string
): readonly string[] {
  const explicit = cancellationOperationAuthority(operationId);
  if (explicit !== undefined) return [explicit.witnessId];
  if (operationId.includes("additive") || operationId.includes("cancel-additive")) {
    return ["witness.additive-identity.zero"];
  }
  if (
    operationId.includes("multiplicative") ||
    operationId.includes("cancel-multiplicative")
  ) return ["witness.multiplicative-identity.one"];
  return [];
}
