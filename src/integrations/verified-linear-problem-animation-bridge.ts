import type {
  KpLinearEquationOperation,
  KpLinearEquationTrace,
  KpLinearTraceProvenance
} from "../../domains/public-api.ts";

export const kpVerifiedLinearProblemAnimationOperations = [
  "subtract-both-sides",
  "divide-both-sides"
] as const;

export type KpVerifiedLinearProblemAnimationOperation =
  typeof kpVerifiedLinearProblemAnimationOperations[number];

export interface KpVerifiedLinearProblemAnimationIdentity {
  readonly instanceId: string;
  readonly semanticNamespace: string;
  readonly animationId: string;
  readonly sourceTraceId: string;
  readonly sourceProblemId: string;
}

export interface KpVerifiedLinearProblemAnimationOperationBinding {
  readonly sourceOperationId: string;
  readonly sourceSemanticId: string;
  readonly kind: KpVerifiedLinearProblemAnimationOperation;
  readonly fromFrameId: string;
  readonly toFrameId: string;
  readonly fromEquationSemanticId: string;
  readonly toEquationSemanticId: string;
}

export interface KpVerifiedLinearProblemAnimationBridgeContract {
  readonly schemaVersion: "kp.verified-linear-problem-animation-bridge.v1";
  readonly identity: KpVerifiedLinearProblemAnimationIdentity;
  readonly provenance: KpLinearTraceProvenance;
  readonly supportedOperationKinds:
    readonly KpVerifiedLinearProblemAnimationOperation[];
  readonly operationBindings:
    readonly KpVerifiedLinearProblemAnimationOperationBinding[];
  readonly trace: KpLinearEquationTrace;
}

export type KpVerifiedLinearProblemAnimationDiagnosticCode =
  | "trace-not-strict"
  | "solution-unverified"
  | "trace-diagnostics-present"
  | "unsupported-provider"
  | "unsupported-provider-version"
  | "invalid-problem-identity"
  | "missing-operation"
  | "operation-count-mismatch"
  | "trace-discontinuity"
  | "semantic-identity-conflict"
  | "unsupported-operation"
  | "provider-operation-mismatch"
  | "operation-classification-mismatch";

export interface KpVerifiedLinearProblemAnimationDiagnostic {
  readonly severity: "error";
  readonly code: KpVerifiedLinearProblemAnimationDiagnosticCode;
  readonly path: string;
  readonly message: string;
}

export type KpVerifiedLinearProblemAnimationBridgeResult =
  | {
      readonly status: "accepted";
      readonly contract: KpVerifiedLinearProblemAnimationBridgeContract;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "rejected";
      readonly diagnostics:
        readonly KpVerifiedLinearProblemAnimationDiagnostic[];
    };

/**
 * This is the trust boundary between verified algebra and animation authoring.
 * It preserves mathematical identity but deliberately exports no presentation
 * fields: trusted KP compilers remain the sole owners of prose, timing,
 * geometry, and renderer state.
 */
export function inspectVerifiedLinearProblemAnimationTrace(
  trace: KpLinearEquationTrace
): KpVerifiedLinearProblemAnimationBridgeResult {
  const diagnostics: KpVerifiedLinearProblemAnimationDiagnostic[] = [];
  requireTraceAuthority(trace, diagnostics);
  requireInstanceIdentity(trace, diagnostics);
  requireOrderedOperations(trace, diagnostics);

  if (diagnostics.length > 0) {
    return Object.freeze({
      status: "rejected" as const,
      diagnostics: Object.freeze(diagnostics)
    });
  }

  const problemId = trace.provenance.problemId;
  const semanticNamespace = `generated.linear-solve.${problemId}`;
  const frozenTrace = cloneAndFreezeTrace(trace);
  const frameById = new Map(
    frozenTrace.frames.map((frame) => [frame.id, frame])
  );
  const operationBindings = frozenTrace.operations.map((operation) =>
    Object.freeze({
      sourceOperationId: operation.id,
      sourceSemanticId: operation.semanticId,
      kind: operation.kind as KpVerifiedLinearProblemAnimationOperation,
      fromFrameId: operation.fromFrameId,
      toFrameId: operation.toFrameId,
      fromEquationSemanticId:
        frameById.get(operation.fromFrameId)!.semanticIds.equation,
      toEquationSemanticId:
        frameById.get(operation.toFrameId)!.semanticIds.equation
    })
  );
  const contract: KpVerifiedLinearProblemAnimationBridgeContract =
    Object.freeze({
      schemaVersion: "kp.verified-linear-problem-animation-bridge.v1" as const,
      identity: Object.freeze({
        instanceId: `instance.${semanticNamespace}`,
        semanticNamespace,
        animationId: `animation.${semanticNamespace}`,
        sourceTraceId: frozenTrace.id,
        sourceProblemId: problemId
      }),
      provenance: frozenTrace.provenance,
      supportedOperationKinds:
        kpVerifiedLinearProblemAnimationOperations,
      operationBindings: Object.freeze(operationBindings),
      trace: frozenTrace
    });
  return Object.freeze({
    status: "accepted" as const,
    contract,
    diagnostics: [] as const
  });
}

function requireTraceAuthority(
  trace: KpLinearEquationTrace,
  diagnostics: KpVerifiedLinearProblemAnimationDiagnostic[]
): void {
  if (trace.preservation !== "strict") {
    diagnostic(
      "trace-not-strict",
      "$.preservation",
      "Generated animation requires a strict verified trace.",
      diagnostics
    );
  }
  if (!trace.solutionVerified) {
    diagnostic(
      "solution-unverified",
      "$.solutionVerified",
      "Generated animation requires exact solution verification.",
      diagnostics
    );
  }
  if (trace.diagnostics.length > 0) {
    diagnostic(
      "trace-diagnostics-present",
      "$.diagnostics",
      "Generated animation rejects traces carrying import or invariant diagnostics.",
      diagnostics
    );
  }
  if (trace.provenance.providerId !== "linear-problems.exact-rational") {
    diagnostic(
      "unsupported-provider",
      "$.provenance.providerId",
      `Generated animation does not trust provider ${trace.provenance.providerId}.`,
      diagnostics
    );
  }
  if (trace.provenance.providerVersion !== "1.0.0") {
    diagnostic(
      "unsupported-provider-version",
      "$.provenance.providerVersion",
      `Generated animation does not trust provider version ${trace.provenance.providerVersion}.`,
      diagnostics
    );
  }
}

function requireInstanceIdentity(
  trace: KpLinearEquationTrace,
  diagnostics: KpVerifiedLinearProblemAnimationDiagnostic[]
): void {
  if (!/^linear-[a-f0-9]{8}$/.test(trace.provenance.problemId)) {
    diagnostic(
      "invalid-problem-identity",
      "$.provenance.problemId",
      "Generated animation requires the exact provider's stable linear problem identity.",
      diagnostics
    );
  }
  if (trace.id !== `trace.${trace.provenance.problemId}`) {
    diagnostic(
      "invalid-problem-identity",
      "$.id",
      "Trace identity must be derived from its verified problem identity.",
      diagnostics
    );
  }
  const semanticIds = [
    ...trace.frames.map((frame) => frame.semanticIds.equation),
    ...trace.operations.map((operation) => operation.semanticId)
  ];
  if (
    semanticIds.some((id) => id.trim().length === 0) ||
    new Set(semanticIds).size !== semanticIds.length
  ) {
    diagnostic(
      "semantic-identity-conflict",
      "$.frames|operations",
      "Trace equation and operation semantic identities must be non-empty and unique.",
      diagnostics
    );
  }
}

function requireOrderedOperations(
  trace: KpLinearEquationTrace,
  diagnostics: KpVerifiedLinearProblemAnimationDiagnostic[]
): void {
  if (trace.operations.length === 0) {
    diagnostic(
      "missing-operation",
      "$.operations",
      "Generated solve animation requires at least one verified operation.",
      diagnostics
    );
  }
  if (trace.frames.length !== trace.operations.length + 1) {
    diagnostic(
      "operation-count-mismatch",
      "$.operations",
      "Generated solve animation requires exactly one adjacent operation between frames.",
      diagnostics
    );
  }
  trace.operations.forEach((operation, index) => {
    const expectedFrom = trace.frames[index]?.id;
    const expectedTo = trace.frames[index + 1]?.id;
    if (
      operation.fromFrameId !== expectedFrom ||
      operation.toFrameId !== expectedTo
    ) {
      diagnostic(
        "trace-discontinuity",
        `$.operations[${index}]`,
        "Generated solve operations must connect adjacent trace frames in order.",
        diagnostics
      );
    }
    if (!isSupportedOperation(operation.kind)) {
      diagnostic(
        "unsupported-operation",
        `$.operations[${index}].kind`,
        `Generated solve presentation does not support ${operation.kind}.`,
        diagnostics
      );
    }
    if (operation.sourceOperation !== operation.kind) {
      diagnostic(
        "provider-operation-mismatch",
        `$.operations[${index}].sourceOperation`,
        "Normalized operation kind must exactly match the verified provider operation.",
        diagnostics
      );
    }
    if (operation.classification !== "canonical-operation") {
      diagnostic(
        "operation-classification-mismatch",
        `$.operations[${index}].classification`,
        "Generated solve presentation accepts only canonical provider operations.",
        diagnostics
      );
    }
  });
}

function isSupportedOperation(
  value: KpLinearEquationOperation["kind"]
): value is KpVerifiedLinearProblemAnimationOperation {
  return (kpVerifiedLinearProblemAnimationOperations as readonly string[])
    .includes(value);
}

function diagnostic(
  code: KpVerifiedLinearProblemAnimationDiagnosticCode,
  path: string,
  message: string,
  diagnostics: KpVerifiedLinearProblemAnimationDiagnostic[]
): void {
  diagnostics.push(Object.freeze({ severity: "error", code, path, message }));
}

function cloneAndFreezeTrace(
  trace: KpLinearEquationTrace
): KpLinearEquationTrace {
  const clone: KpLinearEquationTrace = {
    ...trace,
    solution: { ...trace.solution },
    frames: trace.frames.map((frame) => ({
      ...frame,
      semanticIds: { ...frame.semanticIds },
      equation: {
        left: {
          ...frame.equation.left,
          coefficient: { ...frame.equation.left.coefficient },
          constant: { ...frame.equation.left.constant }
        },
        right: {
          ...frame.equation.right,
          coefficient: { ...frame.equation.right.coefficient },
          constant: { ...frame.equation.right.constant }
        }
      }
    })),
    operations: trace.operations.map((operation) => ({ ...operation })),
    assumptions: [...trace.assumptions],
    provenance: { ...trace.provenance },
    diagnostics: trace.diagnostics.map((item) => ({ ...item }))
  };
  return deepFreeze(clone);
}

function deepFreeze<Value>(value: Value): Value {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
