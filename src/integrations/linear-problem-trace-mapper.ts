import {
  generateLinearProblemResponseSchema,
  verifyLinearSolutionRequestSchema,
  verifyLinearSolutionResponseSchema,
  verifyLinearStepRequestSchema,
  verifyLinearStepResponseSchema,
  type LinearEquationDto,
  type LinearProblemProvenanceDto
} from "../../protocols/public-api.ts";
import {
  validateKpLinearEquationTrace,
  type KpExactRational,
  type KpLinearEquation,
  type KpLinearEquationFrame,
  type KpLinearEquationOperation,
  type KpLinearEquationTrace,
  type KpLinearExpression,
  type KpLinearTraceDiagnostic
} from "../../domains/public-api.ts";

export interface KpLinearTraceStepImport {
  readonly request: unknown;
  readonly response: unknown;
  readonly semanticIds: {
    readonly operation: string;
    readonly equation: string;
  };
}

export interface KpLinearTraceSolutionImport {
  readonly request: unknown;
  readonly response: unknown;
}

export function mapLinearProblemToKpTrace(input: {
  readonly generation: unknown;
  readonly steps: readonly KpLinearTraceStepImport[];
  readonly solutionVerification: KpLinearTraceSolutionImport;
  readonly initialSemanticIds: {
    readonly equation: string;
    readonly leftVariable: string;
    readonly leftConstant: string;
    readonly rightVariable: string;
    readonly rightConstant: string;
  };
}): KpLinearEquationTrace {
  const generation = generateLinearProblemResponseSchema.parse(input.generation);
  const problem = generation.problem;
  const provenance = problem.provenance;
  const diagnostics: KpLinearTraceDiagnostic[] = [];
  const frames: KpLinearEquationFrame[] = [frame(
    "frame.initial",
    input.initialSemanticIds,
    problem.equation
  )];
  const operations: KpLinearEquationOperation[] = [];
  let previous = problem.equation;

  input.steps.forEach((step, index) => {
    const request = verifyLinearStepRequestSchema.parse(step.request);
    const response = verifyLinearStepResponseSchema.parse(step.response);
    const path = `steps[${index}]`;
    if (!sameProblem(request.problem, problem) || !sameProvenance(response.provenance, provenance)) {
      diagnostic("provider-provenance-mismatch", path, "Step does not belong to the generated problem provenance.", diagnostics);
      return;
    }
    if (!sameEquation(request.previous, previous)) {
      diagnostic("trace-previous-mismatch", `${path}.request.previous`, "Step does not continue the accepted trace frame.", diagnostics);
      return;
    }
    if (!response.valid || !isAcceptedClassification(response.classification)) {
      diagnostic(
        "provider-step-rejected",
        `${path}.response`,
        `Provider rejected the step as ${response.classification}: ${response.diagnostics.join(", ") || "no diagnostic"}.`,
        diagnostics
      );
      return;
    }
    const fromFrame = frames.at(-1)!;
    const toFrame = frame(
      `frame.step.${index + 1}`,
      equationSemanticIds(step.semanticIds.equation, index + 1),
      request.candidate
    );
    const operationKind = mapOperationKind(response.operation);
    if (operationKind === "external") {
      diagnostic("operation-unmapped", `${path}.response.operation`, `KP does not recognize provider operation ${response.operation}.`, diagnostics);
    }
    frames.push(toFrame);
    operations.push({
      id: `operation.step.${index + 1}`,
      semanticId: step.semanticIds.operation,
      kind: operationKind,
      sourceOperation: response.operation,
      classification: response.classification,
      fromFrameId: fromFrame.id,
      toFrameId: toFrame.id
    });
    previous = request.candidate;
  });

  const solutionRequest = verifyLinearSolutionRequestSchema.parse(input.solutionVerification.request);
  const solutionResponse = verifyLinearSolutionResponseSchema.parse(input.solutionVerification.response);
  const solutionVerified = sameProblem(solutionRequest.problem, problem) &&
    sameProvenance(solutionResponse.provenance, provenance) &&
    sameRational(solutionRequest.candidate, problem.solution) && solutionResponse.valid;
  if (!solutionVerified) {
    diagnostic(
      "solution-verification-mismatch",
      "solutionVerification",
      "Solution verification does not confirm this problem's exact published solution.",
      diagnostics
    );
  }

  const trace: KpLinearEquationTrace = {
    schemaVersion: "kp.linear-equation-trace.v1",
    id: `trace.${problem.problemId}`,
    variable: problem.equation.left.variable,
    solution: rational(problem.solution),
    frames,
    operations,
    assumptions: [
      "exact-rational-arithmetic",
      "unique-linear-solution",
      "equivalence-preserving-steps"
    ],
    provenance: {
      problemId: problem.problemId,
      providerId: provenance.providerId,
      providerVersion: provenance.providerVersion,
      protocolVersion: provenance.protocolVersion,
      seed: provenance.seed
    },
    solutionVerified,
    preservation: diagnostics.length === 0 ? "strict" : "lossy",
    diagnostics
  };
  const invariantDiagnostics = validateKpLinearEquationTrace(trace);
  if (invariantDiagnostics.length > 0) {
    const lossy: KpLinearEquationTrace = {
      ...trace,
      preservation: "lossy",
      diagnostics: [...trace.diagnostics, ...invariantDiagnostics]
    };
    deepFreeze(lossy);
    return lossy;
  }
  deepFreeze(trace);
  return trace;
}

function frame(
  id: string,
  semanticIds: KpLinearEquationFrame["semanticIds"],
  equation: LinearEquationDto
): KpLinearEquationFrame {
  return { id, semanticIds, equation: mapEquation(equation) };
}

function equationSemanticIds(equation: string, index: number): KpLinearEquationFrame["semanticIds"] {
  return {
    equation,
    leftVariable: `${equation}.left-variable.${index}`,
    leftConstant: `${equation}.left-constant.${index}`,
    rightVariable: `${equation}.right-variable.${index}`,
    rightConstant: `${equation}.right-constant.${index}`
  };
}

function mapEquation(equation: LinearEquationDto): KpLinearEquation {
  return { left: expression(equation.left), right: expression(equation.right) };
}

function expression(value: LinearEquationDto["left"]): KpLinearExpression {
  return {
    variable: value.variable,
    coefficient: rational(value.coefficient),
    constant: rational(value.constant)
  };
}

function rational(value: KpExactRational): KpExactRational {
  return { numerator: value.numerator, denominator: value.denominator };
}

function mapOperationKind(operation: string): KpLinearEquationOperation["kind"] {
  switch (operation) {
    case "add-both-sides":
    case "subtract-both-sides":
    case "multiply-both-sides":
    case "divide-both-sides":
    case "simplify":
    case "equivalent-rewrite":
      return operation;
    default:
      return "external";
  }
}

function isAcceptedClassification(
  value: string
): value is KpLinearEquationOperation["classification"] {
  return value === "canonical-operation" || value === "compressed-equivalent" || value === "valid-simplification";
}

function sameProblem(left: unknown, right: unknown): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

function sameEquation(left: LinearEquationDto, right: LinearEquationDto): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

function sameProvenance(
  left: LinearProblemProvenanceDto,
  right: LinearProblemProvenanceDto
): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

function sameRational(left: KpExactRational, right: KpExactRational): boolean {
  return left.numerator === right.numerator && left.denominator === right.denominator;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function diagnostic(
  code: KpLinearTraceDiagnostic["code"],
  path: string,
  message: string,
  diagnostics: KpLinearTraceDiagnostic[]
): void {
  diagnostics.push({ severity: "warning", code, path, message });
}

type DeepReadonly<Value> = Value extends readonly (infer Item)[]
  ? readonly DeepReadonly<Item>[]
  : Value extends object
    ? { readonly [Key in keyof Value]: DeepReadonly<Value[Key]> }
    : Value;

function deepFreeze<Value>(value: Value): DeepReadonly<Value> {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value as DeepReadonly<Value>;
  }
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value) as DeepReadonly<Value>;
}
