export interface KpExactRational {
  readonly numerator: string;
  readonly denominator: string;
}

export interface KpLinearExpression {
  readonly variable: string;
  readonly coefficient: KpExactRational;
  readonly constant: KpExactRational;
}

export interface KpLinearEquation {
  readonly left: KpLinearExpression;
  readonly right: KpLinearExpression;
}

export interface KpLinearEquationFrame {
  readonly id: string;
  readonly equation: KpLinearEquation;
  readonly semanticIds: {
    readonly equation: string;
    readonly leftVariable: string;
    readonly leftConstant: string;
    readonly rightVariable: string;
    readonly rightConstant: string;
  };
}

export interface KpLinearEquationOperation {
  readonly id: string;
  readonly semanticId: string;
  readonly kind:
    | "add-both-sides"
    | "subtract-both-sides"
    | "multiply-both-sides"
    | "divide-both-sides"
    | "simplify"
    | "equivalent-rewrite"
    | "external";
  readonly sourceOperation: string;
  readonly classification:
    | "canonical-operation"
    | "compressed-equivalent"
    | "valid-simplification";
  readonly fromFrameId: string;
  readonly toFrameId: string;
}

export interface KpLinearTraceProvenance {
  readonly problemId: string;
  readonly providerId: string;
  readonly providerVersion: string;
  readonly protocolVersion: "linear-problem.v1";
  readonly seed: string;
}

export interface KpLinearTraceDiagnostic {
  readonly severity: "warning" | "error";
  readonly code:
    | "provider-provenance-mismatch"
    | "trace-previous-mismatch"
    | "provider-step-rejected"
    | "operation-unmapped"
    | "solution-verification-mismatch"
    | "trace-invariant";
  readonly path: string;
  readonly message: string;
}

export interface KpLinearEquationTrace {
  readonly schemaVersion: "kp.linear-equation-trace.v1";
  readonly id: string;
  readonly variable: string;
  readonly solution: KpExactRational;
  readonly frames: readonly KpLinearEquationFrame[];
  readonly operations: readonly KpLinearEquationOperation[];
  readonly assumptions: readonly [
    "exact-rational-arithmetic",
    "unique-linear-solution",
    "equivalence-preserving-steps"
  ];
  readonly provenance: KpLinearTraceProvenance;
  readonly solutionVerified: boolean;
  readonly preservation: "strict" | "lossy";
  readonly diagnostics: readonly KpLinearTraceDiagnostic[];
}

export function validateKpLinearEquationTrace(
  trace: KpLinearEquationTrace
): readonly KpLinearTraceDiagnostic[] {
  const diagnostics: KpLinearTraceDiagnostic[] = [];
  const frameIds = new Set(trace.frames.map((frame) => frame.id));
  const equationSemanticIds = trace.frames.map((frame) => frame.semanticIds.equation);
  if (trace.frames.length === 0) invariant("frames", "Trace requires at least one equation frame.", diagnostics);
  if (frameIds.size !== trace.frames.length) invariant("frames", "Equation frame IDs must be unique.", diagnostics);
  if (new Set(equationSemanticIds).size !== equationSemanticIds.length) {
    invariant("frames[].semanticIds.equation", "Equation semantic IDs must be unique across the trace.", diagnostics);
  }
  trace.frames.forEach((frame, index) => {
    const frameSemanticIds = Object.values(frame.semanticIds);
    if (new Set(frameSemanticIds).size !== frameSemanticIds.length) {
      invariant(`frames[${index}].semanticIds`, "Semantic IDs must be unique within each frame.", diagnostics);
    }
    if (frame.equation.left.variable !== trace.variable || frame.equation.right.variable !== trace.variable) {
      invariant(`frames[${index}].equation`, "Every expression must use the trace variable.", diagnostics);
    }
  });
  trace.operations.forEach((operation, index) => {
    if (!frameIds.has(operation.fromFrameId) || !frameIds.has(operation.toFrameId)) {
      invariant(`operations[${index}]`, "Operation endpoints must reference trace frames.", diagnostics);
    }
  });
  if (trace.preservation === "strict" && trace.diagnostics.length > 0) {
    invariant("preservation", "Strict traces cannot carry loss diagnostics.", diagnostics);
  }
  return diagnostics;
}

function invariant(
  path: string,
  message: string,
  diagnostics: KpLinearTraceDiagnostic[]
): void {
  diagnostics.push({ severity: "error", code: "trace-invariant", path, message });
}
