import type { KpEquationLatexEndpointDiagnostic } from
  "./equation-latex-endpoint-normalizer.ts";
import type { KpEquationSeriesSegmentationRepair } from
  "./equation-series-adjacency-segmentation.ts";
import type { KpEquationSeriesRuntimeIssue } from
  "./equation-series-runtime.ts";
import type {
  KpEquationTransformSeriesRequest,
  KpEquationTransformSeriesRequestDiagnostic
} from "./equation-transform-series-request.ts";

interface KpEquationSeriesRepairBase {
  readonly id: string;
  readonly phase: "request" | "syntax" | "resolution" | "runtime" | "frontend";
  readonly path: string;
  readonly message: string;
  readonly sourceCode: string;
}

export type KpEquationSeriesRepair =
  | (KpEquationSeriesRepairBase & Readonly<{
      kind: "invalid-request";
      code: "equation-series.repair.invalid-request";
      action: Readonly<{ kind: "edit-request"; instruction: string }>;
    }>)
  | (KpEquationSeriesRepairBase & Readonly<{
      kind: "unsupported-syntax";
      code: "equation-series.repair.unsupported-syntax";
      stateId: string;
      stateIndex: number;
      action: Readonly<{ kind: "use-supported-syntax"; latex: string }>;
    }>)
  | (KpEquationSeriesRepairBase & Readonly<{
      kind: "unknown-operation";
      code: "equation-series.repair.unknown-operation";
      adjacencyId: string;
      operationId: string;
      action: Readonly<{ kind: "select-registered-operation" }>;
    }>)
  | (KpEquationSeriesRepairBase & Readonly<{
      kind: "operation-conflict";
      code: "equation-series.repair.operation-conflict";
      adjacencyId: string;
      explicitOperationId: string;
      analyzedOperationId: string;
      action: Readonly<{ kind: "reconcile-operation-authority" }>;
    }>)
  | (KpEquationSeriesRepairBase & Readonly<{
      kind: "invalid-role";
      code: "equation-series.repair.invalid-role";
      roleId?: string | undefined;
      action: Readonly<{ kind: "repair-role-binding" }>;
    }>)
  | (KpEquationSeriesRepairBase & Readonly<{
      kind: "unresolved-entity";
      code: "equation-series.repair.unresolved-entity";
      entityId?: string | undefined;
      roleId?: string | undefined;
      action: Readonly<{ kind: "bind-existing-entity" }>;
    }>)
  | (KpEquationSeriesRepairBase & Readonly<{
      kind: "ambiguous-jump";
      code: "equation-series.repair.ambiguous-jump";
      adjacencyId: string;
      candidateOperationIds: readonly [string, string, ...string[]];
      action: Readonly<{ kind: "choose-one-operation" }>;
    }>)
  | (KpEquationSeriesRepairBase & Readonly<{
      kind: "compound-jump";
      code: "equation-series.repair.compound-jump";
      adjacencyId: string;
      operationIds: readonly [string, string, ...string[]];
      minimumIntermediateStateCount: number;
      action: Readonly<{ kind: "insert-intermediate-states" }>;
    }>)
  | (KpEquationSeriesRepairBase & Readonly<{
      kind: "frontend-unavailable";
      code: "equation-series.repair.frontend-unavailable";
      domain: string;
      frontendId: string;
      action: Readonly<{ kind: "provide-domain-frontend" }>;
    }>)
  | (KpEquationSeriesRepairBase & Readonly<{
      kind: "unsupported-motif";
      code: "equation-series.repair.unsupported-motif";
      operationId: string;
      motifId?: string | undefined;
      action: Readonly<{ kind: "provide-registered-motif" }>;
    }>)
  | (KpEquationSeriesRepairBase & Readonly<{
      kind: "runtime-invariant";
      code: "equation-series.repair.runtime-invariant";
      action: Readonly<{ kind: "repair-runtime-contract" }>;
    }>);

export interface KpEquationSeriesExternalDiagnostic {
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly repair?: string | undefined;
  readonly entityId?: string | undefined;
  readonly roleId?: string | undefined;
  readonly operationId?: string | undefined;
  readonly motifId?: string | undefined;
}

export function repairsForKpEquationSeriesRequest(
  diagnostics: readonly KpEquationTransformSeriesRequestDiagnostic[]
): readonly KpEquationSeriesRepair[] {
  return freezeRepairs(diagnostics.map((diagnostic, index) => ({
    id: `repair.equation-series.request.${index}`,
    kind: "invalid-request" as const,
    code: "equation-series.repair.invalid-request" as const,
    phase: "request" as const,
    path: diagnostic.path,
    message: diagnostic.message,
    sourceCode: diagnostic.code,
    action: {
      kind: "edit-request" as const,
      instruction: diagnostic.repair
    }
  })));
}

export function repairsForKpEquationSeriesSyntax(
  diagnostics: readonly KpEquationLatexEndpointDiagnostic[]
): readonly KpEquationSeriesRepair[] {
  return freezeRepairs(diagnostics.map((diagnostic, index) => ({
    id: `repair.equation-series.syntax.${diagnostic.stateId}.${index}`,
    kind: "unsupported-syntax" as const,
    code: "equation-series.repair.unsupported-syntax" as const,
    phase: "syntax" as const,
    path: `$.states[${diagnostic.stateIndex}].latex`,
    message: diagnostic.message,
    sourceCode: diagnostic.code,
    stateId: diagnostic.stateId,
    stateIndex: diagnostic.stateIndex,
    action: {
      kind: "use-supported-syntax" as const,
      latex: diagnostic.latex
    }
  })));
}

export function repairsForKpEquationSeriesSegmentation(input: {
  readonly request: KpEquationTransformSeriesRequest;
  readonly repairs: readonly KpEquationSeriesSegmentationRepair[];
}): readonly KpEquationSeriesRepair[] {
  return freezeRepairs(input.repairs.map((repair, index) => {
    const base = {
      id: `repair.equation-series.resolution.${repair.adjacencyId}.${index}`,
      phase: "resolution" as const,
      path: adjacencyPath(input.request, repair.adjacencyId),
      sourceCode: `equation-series.segmentation.${repair.kind}`
    };
    switch (repair.kind) {
      case "insert-intermediate-states": return {
        ...base,
        kind: "compound-jump" as const,
        code: "equation-series.repair.compound-jump" as const,
        message:
          `${repair.adjacencyId} contains ${repair.operationIds.length} operations ` +
          "inside one displayed jump.",
        adjacencyId: repair.adjacencyId,
        operationIds: repair.operationIds,
        minimumIntermediateStateCount: repair.minimumIntermediateStateCount,
        action: { kind: "insert-intermediate-states" as const }
      };
      case "choose-single-operation": return {
        ...base,
        kind: "ambiguous-jump" as const,
        code: "equation-series.repair.ambiguous-jump" as const,
        message: `${repair.adjacencyId} matches more than one operation.`,
        adjacencyId: repair.adjacencyId,
        candidateOperationIds: repair.candidateOperationIds,
        action: { kind: "choose-one-operation" as const }
      };
      case "correct-explicit-operation": return {
        ...base,
        kind: "operation-conflict" as const,
        code: "equation-series.repair.operation-conflict" as const,
        message: `${repair.adjacencyId}'s analysis conflicts with explicit author authority.`,
        adjacencyId: repair.adjacencyId,
        explicitOperationId: repair.explicitOperationId,
        analyzedOperationId: repair.analyzedOperationId,
        action: { kind: "reconcile-operation-authority" as const }
      };
      case "resolve-operation": {
        const adjacency = input.request.adjacencies.find(
          ({ id }) => id === repair.adjacencyId
        );
        const operationId = adjacency?.intent.mode === "explicit"
          ? adjacency.intent.operationId
          : "operation.unresolved";
        return {
          ...base,
          kind: "unknown-operation" as const,
          code: "equation-series.repair.unknown-operation" as const,
          message: repair.reason,
          adjacencyId: repair.adjacencyId,
          operationId,
          action: { kind: "select-registered-operation" as const }
        };
      }
      default: return {
        ...base,
        kind: "invalid-request" as const,
        code: "equation-series.repair.invalid-request" as const,
        message: `Invalid adjacency analysis for ${repair.adjacencyId}.`,
        action: {
          kind: "edit-request" as const,
          instruction: "Provide exactly one ordered analysis for each adjacency."
        }
      };
    }
  }));
}

export function repairsForKpEquationSeriesRuntime(
  issues: readonly KpEquationSeriesRuntimeIssue[]
): readonly KpEquationSeriesRepair[] {
  return freezeRepairs(issues.map((issue, index) => ({
    id: `repair.equation-series.runtime.${index}`,
    kind: "runtime-invariant" as const,
    code: "equation-series.repair.runtime-invariant" as const,
    phase: "runtime" as const,
    path: issue.path,
    message: issue.message,
    sourceCode: issue.code,
    action: { kind: "repair-runtime-contract" as const }
  })));
}

export function repairsForKpEquationSeriesExternalDiagnostics(
  diagnostics: readonly KpEquationSeriesExternalDiagnostic[]
): readonly KpEquationSeriesRepair[] {
  return freezeRepairs(diagnostics.map((diagnostic, index) => {
    const base = {
      id: `repair.equation-series.external.${index}`,
      phase: "resolution" as const,
      path: diagnostic.path,
      message: diagnostic.message,
      sourceCode: diagnostic.code
    };
    if (diagnostic.code === "equation-llm.entity.unresolved") return {
      ...base,
      kind: "unresolved-entity" as const,
      code: "equation-series.repair.unresolved-entity" as const,
      ...(diagnostic.entityId === undefined ? {} : { entityId: diagnostic.entityId }),
      ...(diagnostic.roleId === undefined ? {} : { roleId: diagnostic.roleId }),
      action: { kind: "bind-existing-entity" as const }
    };
    if (
      diagnostic.code.startsWith("equation-llm.role.") ||
      diagnostic.code === "equation-intent.role-binding.mismatch"
    ) return {
      ...base,
      kind: "invalid-role" as const,
      code: "equation-series.repair.invalid-role" as const,
      ...(diagnostic.roleId === undefined ? {} : { roleId: diagnostic.roleId }),
      action: { kind: "repair-role-binding" as const }
    };
    if (diagnostic.code === "equation-series.motif.unavailable") return {
      ...base,
      kind: "unsupported-motif" as const,
      code: "equation-series.repair.unsupported-motif" as const,
      operationId: diagnostic.operationId ?? "operation.unresolved",
      ...(diagnostic.motifId === undefined
        ? {}
        : { motifId: diagnostic.motifId }),
      action: { kind: "provide-registered-motif" as const }
    };
    if (diagnostic.code === "equation-llm.operation.unknown") return {
      ...base,
      kind: "unknown-operation" as const,
      code: "equation-series.repair.unknown-operation" as const,
      adjacencyId: "adjacency.external",
      operationId: "operation.unresolved",
      action: { kind: "select-registered-operation" as const }
    };
    return {
      ...base,
      kind: "invalid-request" as const,
      code: "equation-series.repair.invalid-request" as const,
      action: {
        kind: "edit-request" as const,
        instruction: diagnostic.repair ?? "Repair the upstream authoring diagnostic."
      }
    };
  }));
}

export function createKpEquationSeriesFrontendUnavailableRepair(input: {
  readonly domain: string;
  readonly frontendId: string;
  readonly message: string;
}): KpEquationSeriesRepair {
  return deepFreeze({
    id: `repair.equation-series.frontend.${input.domain}.${input.frontendId}`,
    kind: "frontend-unavailable" as const,
    code: "equation-series.repair.frontend-unavailable" as const,
    phase: "frontend" as const,
    path: "$.source.frontendId",
    message: input.message,
    sourceCode: "animation-generation.frontend.unavailable",
    domain: input.domain,
    frontendId: input.frontendId,
    action: { kind: "provide-domain-frontend" as const }
  });
}

function adjacencyPath(
  request: KpEquationTransformSeriesRequest,
  adjacencyId: string
): string {
  const index = request.adjacencies.findIndex(({ id }) => id === adjacencyId);
  return index < 0 ? "$.adjacencies" : `$.adjacencies[${index}]`;
}

function freezeRepairs(
  repairs: readonly KpEquationSeriesRepair[]
): readonly KpEquationSeriesRepair[] {
  return deepFreeze([...repairs]);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
