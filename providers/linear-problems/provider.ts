import {
  generateLinearProblemRequestSchema,
  generateLinearProblemResponseSchema,
  linearProblemErrorSchema,
  linearProblemProviderDescriptorSchema,
  verifyLinearSolutionRequestSchema,
  verifyLinearSolutionResponseSchema,
  verifyLinearStepRequestSchema,
  verifyLinearStepResponseSchema,
  type LinearProblemErrorDto,
  type LinearProblemProviderV1
} from "../../protocols/public-api.ts";

import { generateLinearProblem } from "./generator.ts";
import { verifyLinearSolution } from "./solution-verifier.ts";
import { verifyLinearStep } from "./step-verifier.ts";

const descriptor = linearProblemProviderDescriptorSchema.parse({
  providerId: "linear-problems.exact-rational",
  providerVersion: "1.0.0",
  protocolVersion: "linear-problem.v1",
  capabilities: ["generate", "verify-step", "verify-solution"],
  deterministic: true
});

export function createExactRationalLinearProblemProvider(): LinearProblemProviderV1 {
  return Object.freeze({
    descriptor,
    generate(input: unknown) {
      const parsed = generateLinearProblemRequestSchema.safeParse(input);
      if (!parsed.success) return invalidRequest(parsed.issues.map((issue) => issue.path));
      try {
        return generateLinearProblemResponseSchema.parse({
          schemaVersion: "linear-problem.generate.response.v1",
          problem: generateLinearProblem(parsed.value)
        });
      } catch (error) {
        return providerError("generation-failed", error);
      }
    },
    verifyStep(input: unknown) {
      const parsed = verifyLinearStepRequestSchema.safeParse(input);
      if (!parsed.success) return invalidRequest(parsed.issues.map((issue) => issue.path));
      try {
        return verifyLinearStepResponseSchema.parse(verifyLinearStep(parsed.value));
      } catch (error) {
        return providerError("verification-failed", error);
      }
    },
    verifySolution(input: unknown) {
      const parsed = verifyLinearSolutionRequestSchema.safeParse(input);
      if (!parsed.success) return invalidRequest(parsed.issues.map((issue) => issue.path));
      try {
        return verifyLinearSolutionResponseSchema.parse(verifyLinearSolution(parsed.value));
      } catch (error) {
        return providerError("verification-failed", error);
      }
    }
  });
}

function invalidRequest(path: readonly string[]): LinearProblemErrorDto {
  return linearProblemErrorSchema.parse({
    schemaVersion: "linear-problem.error.v1",
    code: "invalid-request",
    message: "Request does not match the linear-problem v1 protocol.",
    path,
    retryable: false
  });
}

function providerError(
  code: "generation-failed" | "verification-failed",
  error: unknown
): LinearProblemErrorDto {
  return linearProblemErrorSchema.parse({
    schemaVersion: "linear-problem.error.v1",
    code,
    message: error instanceof Error ? error.message : "Unknown provider failure.",
    path: ["$"],
    retryable: false
  });
}

