import {
  createKpCodeRefactorGenerationDiagnostic,
  repairKpCodeRefactorGeneration,
  type KpCodeRefactorGenerationRepairResult
} from "../src/domain-ir/code-refactor-generation-diagnostic.ts";
import type {
  KpTypeScriptRefactorEntityContract
} from "../src/semantic/typescript-free-shipping-refactor-contract.ts";
import type {
  KpTypeScriptExtractHelperLegalityProof
} from "./typescript-extract-helper-legality.ts";
import type {
  KpTypeScriptExtractHelperRoleCandidates
} from "./typescript-extract-helper-role-recognizer.ts";
import type {
  KpTypeScriptFrontendResult,
  KpTypeScriptSyntaxRecord
} from "./typescript-refactor-frontend.ts";

export const KP_TYPESCRIPT_EXTRACT_HELPER_BINDING_SCHEMA =
  "kp.typescript-extract-helper-binding.v1" as const;

export interface KpTypeScriptSemanticSyntaxBinding {
  readonly semanticEntityId: string;
  readonly revision: "before" | "after";
  readonly syntaxRecordId: string;
  readonly scopeOwnerEntityId?: string | undefined;
  readonly declarationEntityId?: string | undefined;
}

export interface KpTypeScriptExtractHelperSemanticBinding {
  readonly schemaVersion: typeof KP_TYPESCRIPT_EXTRACT_HELPER_BINDING_SCHEMA;
  readonly status: "accepted";
  readonly language: "typescript";
  readonly bindings: readonly KpTypeScriptSemanticSyntaxBinding[];
}

export type KpTypeScriptExtractHelperBindingResult =
  | KpTypeScriptExtractHelperSemanticBinding
  | KpCodeRefactorGenerationRepairResult;

/**
 * Authored entity relationships own durable IDs; recognized syntax only
 * supplies evidence. Keeping that direction explicit prevents parser order or
 * naming heuristics from silently becoming semantic authority.
 */
export function bindKpTypeScriptExtractHelperSemantics(input: Readonly<{
  entities: readonly KpTypeScriptRefactorEntityContract[];
  source: KpTypeScriptFrontendResult;
  target: KpTypeScriptFrontendResult;
  roles: KpTypeScriptExtractHelperRoleCandidates;
  legality: KpTypeScriptExtractHelperLegalityProof;
}>): KpTypeScriptExtractHelperBindingResult {
  const byEntityId = new Map(input.entities.map((entity) => [entity.id, entity]));
  const bindings: KpTypeScriptSemanticSyntaxBinding[] = [];
  for (const entity of input.entities) {
    const syntaxRecord = resolveSyntaxRecord(entity, input, byEntityId);
    if (syntaxRecord === undefined) {
      return repairKpCodeRefactorGeneration({
        language: "typescript",
        diagnostics: [createKpCodeRefactorGenerationDiagnostic({
          diagnosticId: `diagnostic.typescript.extract-helper.binding.${safeId(entity.id)}`,
          code: "code-refactor.ambiguous-ownership",
          language: "typescript",
          message: `Semantic entity ${entity.id} does not resolve to exactly one recognized TypeScript role.`,
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
    schemaVersion: KP_TYPESCRIPT_EXTRACT_HELPER_BINDING_SCHEMA,
    status: "accepted" as const,
    language: "typescript" as const,
    bindings
  });
}

function resolveSyntaxRecord(
  entity: KpTypeScriptRefactorEntityContract,
  input: Parameters<typeof bindKpTypeScriptExtractHelperSemantics>[0],
  byEntityId: ReadonlyMap<string, KpTypeScriptRefactorEntityContract>
): KpTypeScriptSyntaxRecord | undefined {
  const frontend = entity.revision === "before" ? input.source : input.target;
  if (entity.kind === "source-file") {
    return one(frontend.syntax.filter(({ kindName }) => kindName === "SourceFile"));
  }
  if (entity.kind === "function") {
    return one(frontend.syntax.filter(({ kindName, text }) =>
      kindName === "FunctionDeclaration" &&
      declaredFunctionName(text) === entity.label
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
  entities: ReadonlyMap<string, KpTypeScriptRefactorEntityContract>
): string | undefined {
  return entityId === undefined ? undefined : entities.get(entityId)?.label;
}

function bySyntaxId(
  frontend: KpTypeScriptFrontendResult,
  syntaxRecordId: string
): KpTypeScriptSyntaxRecord | undefined {
  return frontend.syntax.find(({ id }) => id === syntaxRecordId);
}

function declaredFunctionName(text: string): string | undefined {
  return /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/u
    .exec(text)?.[1];
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
