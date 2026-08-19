export type KpOperationEvaluationAuthorityKind =
  | "simplifyConstantProduct"
  | "simplifyConstantQuotient"
  | "simplifyConstantDifference"
  | "simplifyConstantSum";

export interface KpOperationEvaluationAuthorityDescriptor {
  readonly presentationId: string;
  readonly transformationKind: KpOperationEvaluationAuthorityKind;
  readonly semanticOperationIds: readonly [string, ...string[]];
  readonly definitionId?: string | undefined;
}

/**
 * Operation identity is semantic authority shared by authoring and
 * presentation. Keeping it here prevents authoring registries from importing
 * executable motif compilers merely to discover an operation ID.
 */
export const kpOperationEvaluationAuthorityDescriptors:
readonly KpOperationEvaluationAuthorityDescriptor[] = Object.freeze([
  descriptor({
    presentationId: "kp.presentation.operation-evaluation.product",
    transformationKind: "simplifyConstantProduct",
    semanticOperationIds: [
      "kp.algebra.simplify-constant-product",
      "kp.arithmetic.multiply"
    ]
  }),
  descriptor({
    presentationId: "kp.presentation.operation-evaluation.quotient",
    transformationKind: "simplifyConstantQuotient",
    semanticOperationIds: [
      "kp.algebra.simplify-constant-quotient",
      "kp.arithmetic.divide"
    ],
    definitionId: "definition.generated.linear-solve.simplify-constant-quotient"
  }),
  descriptor({
    presentationId: "kp.presentation.operation-evaluation.difference",
    transformationKind: "simplifyConstantDifference",
    semanticOperationIds: [
      "kp.algebra.simplify-constant-difference",
      "kp.arithmetic.subtract"
    ],
    definitionId:
      "definition.generated.linear-solve.simplify-constant-difference"
  }),
  descriptor({
    presentationId: "kp.presentation.operation-evaluation.sum",
    transformationKind: "simplifyConstantSum",
    semanticOperationIds: [
      "kp.algebra.simplify-constant-sum",
      "kp.arithmetic.add"
    ],
    definitionId: "definition.generated.linear-solve.simplify-constant-sum"
  })
] as const);

export function resolveKpOperationEvaluationAuthority(
  transformationKind: KpOperationEvaluationAuthorityKind
): KpOperationEvaluationAuthorityDescriptor {
  const descriptorValue = kpOperationEvaluationAuthorityDescriptors.find(
    (candidate) => candidate.transformationKind === transformationKind
  );
  if (descriptorValue === undefined) {
    throw new Error(
      `Missing operation-evaluation authority ${transformationKind}.`
    );
  }
  return descriptorValue;
}

function descriptor<const T extends KpOperationEvaluationAuthorityDescriptor>(
  input: T
): T {
  return Object.freeze({
    ...input,
    semanticOperationIds: Object.freeze([...input.semanticOperationIds])
  }) as T;
}
