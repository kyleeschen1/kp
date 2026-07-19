import {
  generateLinearProblemResponseSchema,
  linearProblemErrorSchema,
  verifyLinearSolutionResponseSchema,
  verifyLinearStepResponseSchema,
  type GenerateLinearProblemResponseDto,
  type LinearProblemErrorDto,
  type LinearProblemProviderDescriptorDto,
  type VerifyLinearSolutionResponseDto,
  type VerifyLinearStepResponseDto
} from "./linear-problem-v1.ts";

export interface LinearProblemProviderV1 {
  readonly descriptor: LinearProblemProviderDescriptorDto;
  generate(input: unknown): GenerateLinearProblemResponseDto | LinearProblemErrorDto;
  verifyStep(input: unknown): VerifyLinearStepResponseDto | LinearProblemErrorDto;
  verifySolution(input: unknown): VerifyLinearSolutionResponseDto | LinearProblemErrorDto;
}

export interface LinearProblemProviderConformanceResult {
  readonly passed: boolean;
  readonly diagnostics: readonly string[];
}

export function checkLinearProblemProviderConformance(
  provider: LinearProblemProviderV1
): LinearProblemProviderConformanceResult {
  const diagnostics: string[] = [];
  const request = {
    schemaVersion: "linear-problem.generate.request.v1",
    seed: "protocol-conformance",
    constraints: {
      minimumCoefficient: -9,
      maximumCoefficient: 9,
      allowFractionalSolution: true
    }
  } as const;
  const generated = provider.generate(request);
  const repeated = provider.generate(request);
  const generatedParse = generateLinearProblemResponseSchema.safeParse(generated);
  if (!generatedParse.success) diagnostics.push("generate-response-invalid");
  if (JSON.stringify(generated) !== JSON.stringify(repeated)) diagnostics.push("generate-not-deterministic");

  if (generatedParse.success) {
    const step = provider.verifyStep({
      schemaVersion: "linear-problem.verify-step.request.v1",
      problem: generatedParse.value.problem,
      previous: generatedParse.value.problem.equation,
      candidate: generatedParse.value.problem.equation
    });
    const stepParse = verifyLinearStepResponseSchema.safeParse(step);
    if (!stepParse.success || !stepParse.value.valid) diagnostics.push("verify-step-invalid");

    const solution = provider.verifySolution({
      schemaVersion: "linear-problem.verify-solution.request.v1",
      problem: generatedParse.value.problem,
      candidate: generatedParse.value.problem.solution
    });
    const solutionParse = verifyLinearSolutionResponseSchema.safeParse(solution);
    if (!solutionParse.success || !solutionParse.value.valid) diagnostics.push("verify-solution-invalid");
  }

  if (!linearProblemErrorSchema.safeParse(provider.generate({})).success) {
    diagnostics.push("invalid-input-not-structured-error");
  }
  return { passed: diagnostics.length === 0, diagnostics };
}

