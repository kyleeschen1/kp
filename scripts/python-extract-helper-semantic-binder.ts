import {
  createKpCodeRefactorGenerationDiagnostic,
  repairKpCodeRefactorGeneration,
  type KpCodeRefactorGenerationRepairResult
} from "../src/domain-ir/code-refactor-generation-diagnostic.ts";
import type {
  KpPythonRefactorEntityContract
} from "../src/semantic/python-free-shipping-refactor-contract.ts";
import type {
  KpPythonExtractHelperLegalityProof
} from "./python-extract-helper-legality.ts";
import type {
  KpPythonExtractHelperRoleCandidates
} from "./python-extract-helper-role-recognizer.ts";
import type {
  KpPythonFrontendResult,
  KpPythonSyntaxRecord
} from "./python-refactor-frontend.ts";

export const KP_PYTHON_EXTRACT_HELPER_BINDING_SCHEMA =
  "kp.python-extract-helper-binding.v1" as const;

export interface KpPythonSemanticSyntaxBinding {
  readonly semanticEntityId: string;
  readonly revision: "before" | "after";
  readonly syntaxRecordId: string;
  readonly scopeOwnerEntityId?: string | undefined;
  readonly declarationEntityId?: string | undefined;
}

export interface KpPythonExtractHelperSemanticBinding {
  readonly schemaVersion: typeof KP_PYTHON_EXTRACT_HELPER_BINDING_SCHEMA;
  readonly status: "accepted";
  readonly language: "python";
  readonly bindings: readonly KpPythonSemanticSyntaxBinding[];
}

export type KpPythonExtractHelperBindingResult =
  | KpPythonExtractHelperSemanticBinding
  | KpCodeRefactorGenerationRepairResult;

/**
 * Authored relations own durable semantic identity. Python AST roles only
 * prove which concrete syntax range realizes each declared relationship.
 */
export function bindKpPythonExtractHelperSemantics(input: Readonly<{
  entities: readonly KpPythonRefactorEntityContract[];
  source: KpPythonFrontendResult;
  target: KpPythonFrontendResult;
  roles: KpPythonExtractHelperRoleCandidates;
  legality: KpPythonExtractHelperLegalityProof;
}>): KpPythonExtractHelperBindingResult {
  const byEntityId = new Map(input.entities.map((entity) => [entity.id, entity]));
  const bindings: KpPythonSemanticSyntaxBinding[] = [];
  for (const entity of input.entities) {
    const syntaxRecord = resolveSyntaxRecord(entity, input, byEntityId);
    if (syntaxRecord === undefined) {
      return repairKpCodeRefactorGeneration({
        language: "python",
        diagnostics: [createKpCodeRefactorGenerationDiagnostic({
          diagnosticId: `diagnostic.python.extract-helper.binding.${safeId(entity.id)}`,
          code: "code-refactor.ambiguous-ownership",
          language: "python",
          message: `Semantic entity ${entity.id} does not resolve to exactly one recognized Python role.`,
          revisionIds: [input.source.revisionId, input.target.revisionId],
          roleIds: [entity.id],
          repairSummary: "Declare one lexical owner and, for calls, one target declaration."
        })]
      });
    }
    bindings.push({
      semanticEntityId: entity.id,
      revision: entity.revision,
      syntaxRecordId: syntaxRecord.id,
      ...(entity.ownerEntityId === undefined
        ? {}
        : { scopeOwnerEntityId: entity.ownerEntityId }),
      ...(entity.declarationEntityId === undefined
        ? {}
        : { declarationEntityId: entity.declarationEntityId })
    });
  }
  return deepFreeze({
    schemaVersion: KP_PYTHON_EXTRACT_HELPER_BINDING_SCHEMA,
    status: "accepted" as const,
    language: "python" as const,
    bindings
  });
}

function resolveSyntaxRecord(
  entity: KpPythonRefactorEntityContract,
  input: Parameters<typeof bindKpPythonExtractHelperSemantics>[0],
  byEntityId: ReadonlyMap<string, KpPythonRefactorEntityContract>
): KpPythonSyntaxRecord | undefined {
  const frontend = entity.revision === "before" ? input.source : input.target;
  if (entity.kind === "source-file") {
    return one(frontend.syntax.filter(({ kindName }) => kindName === "Module"));
  }
  if (entity.kind === "function") {
    return one(frontend.syntax.filter(({ kindName, facts }) =>
      kindName === "FunctionDef" && facts?.declaredName === entity.label
    ));
  }
  const ownerName = relationLabel(entity.ownerEntityId, byEntityId);
  if (entity.kind === "expression") {
    if (entity.revision === "before") {
      const role = one(input.roles.sourceContributors.filter((candidate) =>
        candidate.ownerFunctionName === ownerName &&
        candidate.expressionText === entity.label
      ));
      return role === undefined
        ? undefined
        : bySyntaxId(frontend, role.syntaxRecordId);
    }
    const helper = one(input.roles.introducedHelpers.filter((candidate) =>
      candidate.functionName === ownerName &&
      candidate.bodyExpressionText === entity.label
    ));
    return helper === undefined
      ? undefined
      : bySyntaxId(frontend, helper.bodyExpressionSyntaxRecordId);
  }
  const calleeName = relationLabel(entity.declarationEntityId, byEntityId);
  const call = one(input.roles.targetCalls.filter((candidate) =>
    candidate.ownerFunctionName === ownerName &&
    candidate.calleeName === calleeName
  ));
  return call === undefined
    ? undefined
    : bySyntaxId(frontend, call.callSyntaxRecordId);
}

function relationLabel(
  entityId: string | undefined,
  entities: ReadonlyMap<string, KpPythonRefactorEntityContract>
): string | undefined {
  return entityId === undefined ? undefined : entities.get(entityId)?.label;
}

function bySyntaxId(
  frontend: KpPythonFrontendResult,
  syntaxRecordId: string
): KpPythonSyntaxRecord | undefined {
  return frontend.syntax.find(({ id }) => id === syntaxRecordId);
}

function one<T>(values: readonly T[]): T | undefined {
  return values.length === 1 ? values[0] : undefined;
}

function safeId(value: string): string {
  return value.replace(/[^a-z0-9._:-]+/giu, "-").toLowerCase();
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
