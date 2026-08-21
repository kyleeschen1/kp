import { kpExponentialHomomorphismCallerDeclarations } from
  "../animation/exponential-homomorphism-caller-declarations.ts";
import { createKpExponentialHomomorphismRoleBindings } from
  "./exponential-homomorphism-authoring.ts";
import type { KpEquationLlmAuthoringRequest } from
  "./equation-llm-authoring-catalogue.ts";

export const KP_EXPONENTIAL_HOMOMORPHISM_AUTHORING_CORPUS =
  "corpus.equation.exponential-homomorphism.v1" as const;

export type KpExponentialHomomorphismAuthoringCorpusCase =
  | Readonly<{
      id: string;
      expectedStatus: "accepted";
      naturalLanguage: string;
      sourceLatex: string;
      targetLatex: string;
      request: KpEquationLlmAuthoringRequest;
    }>
  | Readonly<{
      id: string;
      expectedStatus: "repair-required";
      naturalLanguage: string;
      sourceLatex: string;
      targetLatex: string;
      request: KpEquationLlmAuthoringRequest;
      expectedRepairCode:
        | "equation-llm.surface.unknown"
        | "equation-llm.surface-operation.mismatch";
      boundary:
        | "scalar-power-transport-unproved"
        | "inverse-cancellation-unproved";
    }>;

const [product, quotient] = kpExponentialHomomorphismCallerDeclarations;

/**
 * Positive fixtures prove the two reviewed laws; adjacent attractive ideas
 * remain typed repair gaps so discovery cannot market a larger power family.
 */
export const kpExponentialHomomorphismAuthoringCorpus = Object.freeze({
  schemaVersion: "kp.exponential-homomorphism-authoring-corpus.v1" as const,
  id: KP_EXPONENTIAL_HOMOMORPHISM_AUTHORING_CORPUS,
  cases: Object.freeze([
    accepted({
      id: "exponential-corpus.sum-to-product",
      naturalLanguage:
        "Distribute the exponential over the sum in the exponent.",
      sourceLatex: "e^{a+b}",
      targetLatex: "e^{a}e^{b}",
      declaration: product
    }),
    accepted({
      id: "exponential-corpus.difference-to-quotient",
      naturalLanguage:
        "Turn the difference in the exponent into a quotient of powers.",
      sourceLatex: "e^{a-b}",
      targetLatex: "\\frac{e^{a}}{e^{b}}",
      declaration: quotient
    }),
    repair({
      id: "exponential-corpus.scalar-transport-gap",
      naturalLanguage: "Move a scalar multiplier out of the exponent.",
      sourceLatex: "e^{ka}",
      targetLatex: "(e^a)^k",
      animationId: "animation.generated.exponential.scalar-transport",
      operationId: "operation.equation.exponential-scalar-transport.v1",
      boundary: "scalar-power-transport-unproved"
    }),
    repair({
      id: "exponential-corpus.inverse-cancellation-gap",
      naturalLanguage: "Cancel the logarithm and exponential.",
      sourceLatex: "\\ln(e^x)",
      targetLatex: "x",
      animationId: "animation.generated.exponential.inverse-cancellation",
      operationId: "operation.equation.exponential-inverse-cancellation.v1",
      boundary: "inverse-cancellation-unproved"
    })
  ] satisfies readonly KpExponentialHomomorphismAuthoringCorpusCase[])
});

function accepted(input: {
  readonly id: string;
  readonly naturalLanguage: string;
  readonly sourceLatex: string;
  readonly targetLatex: string;
  readonly declaration:
    (typeof kpExponentialHomomorphismCallerDeclarations)[number];
}): KpExponentialHomomorphismAuthoringCorpusCase {
  return Object.freeze({
    id: input.id,
    expectedStatus: "accepted" as const,
    naturalLanguage: input.naturalLanguage,
    sourceLatex: input.sourceLatex,
    targetLatex: input.targetLatex,
    request: Object.freeze({
      animationId: input.declaration.callerId,
      operation: Object.freeze({
        operationId: input.declaration.operationKind,
        roleBindings: createKpExponentialHomomorphismRoleBindings(
          input.declaration.correspondenceAuthority
        )
      }),
      explanationDepth: "standard" as const,
      teachingIntent: input.naturalLanguage
    })
  });
}

function repair(input: {
  readonly id: string;
  readonly naturalLanguage: string;
  readonly sourceLatex: string;
  readonly targetLatex: string;
  readonly animationId: string;
  readonly operationId: string;
  readonly boundary:
    | "scalar-power-transport-unproved"
    | "inverse-cancellation-unproved";
}): KpExponentialHomomorphismAuthoringCorpusCase {
  return Object.freeze({
    id: input.id,
    expectedStatus: "repair-required" as const,
    naturalLanguage: input.naturalLanguage,
    sourceLatex: input.sourceLatex,
    targetLatex: input.targetLatex,
    request: Object.freeze({
      animationId: input.animationId,
      operation: Object.freeze({
        operationId: input.operationId,
        roleBindings: Object.freeze({})
      }),
      explanationDepth: "standard" as const,
      teachingIntent: input.naturalLanguage
    }),
    expectedRepairCode: "equation-llm.surface.unknown" as const,
    boundary: input.boundary
  });
}
