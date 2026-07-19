import {
  protocolArray,
  protocolBoolean,
  protocolEnum,
  protocolInteger,
  protocolLiteral,
  protocolObject,
  protocolRefine,
  protocolString,
  type InferProtocolSchema
} from "./runtime-schema.ts";

const integerTextSchema = protocolString({ pattern: /^-?(?:0|[1-9][0-9]*)$/ });
const positiveIntegerTextSchema = protocolString({ pattern: /^(?:[1-9][0-9]*)$/ });

export const exactRationalSchema = protocolRefine(protocolObject({
  numerator: integerTextSchema,
  denominator: positiveIntegerTextSchema
}), (value) => gcd(absBigInt(value.numerator), BigInt(value.denominator)) === 1n,
"expected a reduced rational");

export const linearExpressionSchema = protocolObject({
  variable: protocolString({ pattern: /^[A-Za-z][A-Za-z0-9_]*$/ }),
  coefficient: exactRationalSchema,
  constant: exactRationalSchema
});

export const linearEquationSchema = protocolObject({
  left: linearExpressionSchema,
  right: linearExpressionSchema
});

export const linearProblemProvenanceSchema = protocolObject({
  providerId: protocolString({ minLength: 1 }),
  providerVersion: protocolString({ pattern: /^\d+\.\d+\.\d+$/ }),
  protocolVersion: protocolLiteral("linear-problem.v1"),
  seed: protocolString({ minLength: 1 })
});

export const linearProblemSchema = protocolObject({
  problemId: protocolString({ minLength: 1 }),
  equation: linearEquationSchema,
  solution: exactRationalSchema,
  provenance: linearProblemProvenanceSchema
});

export const generateLinearProblemRequestSchema = protocolObject({
  schemaVersion: protocolLiteral("linear-problem.generate.request.v1"),
  seed: protocolString({ minLength: 1 }),
  constraints: protocolObject({
    minimumCoefficient: protocolInteger({ min: -100, max: 100 }),
    maximumCoefficient: protocolInteger({ min: -100, max: 100 }),
    allowFractionalSolution: protocolBoolean()
  })
});

export const generateLinearProblemResponseSchema = protocolObject({
  schemaVersion: protocolLiteral("linear-problem.generate.response.v1"),
  problem: linearProblemSchema
});

export const linearStepClassificationSchema = protocolEnum([
  "canonical-operation",
  "compressed-equivalent",
  "valid-simplification",
  "one-sided-mutation",
  "arithmetic-failure",
  "unsupported-form",
  "ambiguous"
] as const);

export const verifyLinearStepRequestSchema = protocolObject({
  schemaVersion: protocolLiteral("linear-problem.verify-step.request.v1"),
  problem: linearProblemSchema,
  previous: linearEquationSchema,
  candidate: linearEquationSchema
});

export const verifyLinearStepResponseSchema = protocolObject({
  schemaVersion: protocolLiteral("linear-problem.verify-step.response.v1"),
  valid: protocolBoolean(),
  classification: linearStepClassificationSchema,
  operation: protocolString({ minLength: 1 }),
  diagnostics: protocolArray(protocolString({ minLength: 1 })),
  provenance: linearProblemProvenanceSchema
});

export const verifyLinearSolutionRequestSchema = protocolObject({
  schemaVersion: protocolLiteral("linear-problem.verify-solution.request.v1"),
  problem: linearProblemSchema,
  candidate: exactRationalSchema
});

export const verifyLinearSolutionResponseSchema = protocolObject({
  schemaVersion: protocolLiteral("linear-problem.verify-solution.response.v1"),
  valid: protocolBoolean(),
  substitutedLeft: exactRationalSchema,
  substitutedRight: exactRationalSchema,
  provenance: linearProblemProvenanceSchema
});

export const linearProblemErrorSchema = protocolObject({
  schemaVersion: protocolLiteral("linear-problem.error.v1"),
  code: protocolEnum([
    "invalid-request",
    "unsupported-protocol",
    "generation-failed",
    "verification-failed",
    "payload-too-large",
    "provider-unavailable"
  ] as const),
  message: protocolString({ minLength: 1 }),
  path: protocolArray(protocolString({ minLength: 1 })),
  retryable: protocolBoolean()
});

export const linearProblemProviderDescriptorSchema = protocolObject({
  providerId: protocolString({ minLength: 1 }),
  providerVersion: protocolString({ pattern: /^\d+\.\d+\.\d+$/ }),
  protocolVersion: protocolLiteral("linear-problem.v1"),
  capabilities: protocolArray(protocolEnum([
    "generate",
    "verify-step",
    "verify-solution"
  ] as const)),
  deterministic: protocolBoolean()
});

export type ExactRationalDto = InferProtocolSchema<typeof exactRationalSchema>;
export type LinearExpressionDto = InferProtocolSchema<typeof linearExpressionSchema>;
export type LinearEquationDto = InferProtocolSchema<typeof linearEquationSchema>;
export type LinearProblemProvenanceDto = InferProtocolSchema<typeof linearProblemProvenanceSchema>;
export type LinearProblemDto = InferProtocolSchema<typeof linearProblemSchema>;
export type GenerateLinearProblemRequestDto = InferProtocolSchema<typeof generateLinearProblemRequestSchema>;
export type GenerateLinearProblemResponseDto = InferProtocolSchema<typeof generateLinearProblemResponseSchema>;
export type LinearStepClassificationDto = InferProtocolSchema<typeof linearStepClassificationSchema>;
export type VerifyLinearStepRequestDto = InferProtocolSchema<typeof verifyLinearStepRequestSchema>;
export type VerifyLinearStepResponseDto = InferProtocolSchema<typeof verifyLinearStepResponseSchema>;
export type VerifyLinearSolutionRequestDto = InferProtocolSchema<typeof verifyLinearSolutionRequestSchema>;
export type VerifyLinearSolutionResponseDto = InferProtocolSchema<typeof verifyLinearSolutionResponseSchema>;
export type LinearProblemErrorDto = InferProtocolSchema<typeof linearProblemErrorSchema>;
export type LinearProblemProviderDescriptorDto = InferProtocolSchema<
  typeof linearProblemProviderDescriptorSchema
>;

function absBigInt(value: string): bigint {
  const parsed = BigInt(value);
  return parsed < 0n ? -parsed : parsed;
}

function gcd(left: bigint, right: bigint): bigint {
  let a = left;
  let b = right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}
