import {
  createKpCodeRefactorGenerationDiagnostic,
  repairKpCodeRefactorGeneration,
  type KpCodeRefactorGenerationRepairResult
} from "../src/domain-ir/code-refactor-generation-diagnostic.ts";
import type {
  KpTypeScriptExtractHelperRoleCandidates
} from "./typescript-extract-helper-role-recognizer.ts";
import type {
  KpTypeScriptFrontendResult,
  KpTypeScriptSyntaxRecord
} from "./typescript-refactor-frontend.ts";

export const KP_TYPESCRIPT_EXTRACT_HELPER_LEGALITY_SCHEMA =
  "kp.typescript-extract-helper-legality.v1" as const;

export type KpTypeScriptExtractHelperLegalityObligation =
  | "contributors-are-distinct-owners"
  | "helper-body-is-equivalent"
  | "required-bindings-are-preserved"
  | "replacement-calls-cover-contributors";

export interface KpTypeScriptExtractHelperLegalityProof {
  readonly schemaVersion: typeof KP_TYPESCRIPT_EXTRACT_HELPER_LEGALITY_SCHEMA;
  readonly status: "accepted";
  readonly language: "typescript";
  readonly sourceRevisionId: string;
  readonly targetRevisionId: string;
  readonly helperName: string;
  readonly requiredBindings: readonly string[];
  readonly obligations: readonly KpTypeScriptExtractHelperLegalityObligation[];
  readonly syntaxEvidenceIds: readonly string[];
}

export type KpTypeScriptExtractHelperLegalityResult =
  | KpTypeScriptExtractHelperLegalityProof
  | KpCodeRefactorGenerationRepairResult;

/**
 * This proof is intentionally narrower than TypeScript refactor correctness.
 * It authorizes only the recognized extract-helper causal shape and leaves
 * semantic identity, animation sequencing, and rendering to later layers.
 */
export function proveKpTypeScriptExtractHelperLegality(
  source: KpTypeScriptFrontendResult,
  target: KpTypeScriptFrontendResult,
  roles: KpTypeScriptExtractHelperRoleCandidates
): KpTypeScriptExtractHelperLegalityResult {
  const revisionIds = [roles.sourceRevisionId, roles.targetRevisionId];
  if (
    roles.duplicateGroupCount === 0 ||
    roles.sourceContributors.length < 2 ||
    roles.duplicateExpressionText === undefined ||
    roles.introducedHelpers.length === 0
  ) {
    return repair("unsupported-source-shape", revisionIds, [],
      "The revisions must contain one repeated decision and an extracted helper.",
      "Use two equivalent expressions in distinct functions and extract one named helper."
    );
  }
  if (roles.duplicateGroupCount !== 1 || roles.introducedHelpers.length !== 1) {
    return repair("ambiguous-ownership", revisionIds, syntaxEvidence(roles),
      "TypeScript recognition found more than one possible duplicate group or helper owner.",
      "Make one repeated decision and one extracted helper unambiguous."
    );
  }

  const helper = roles.introducedHelpers[0]!;
  const sourceOwners = roles.sourceContributors.map(({ ownerFunctionName }) =>
    ownerFunctionName
  );
  const targetCallOwners = roles.targetCalls.map(({ ownerFunctionName }) =>
    ownerFunctionName
  );
  if (
    roles.targetCalls.length !== roles.sourceContributors.length ||
    !sameSet(sourceOwners, targetCallOwners)
  ) {
    return repair("ambiguous-ownership", revisionIds, syntaxEvidence(roles),
      "Every contributing function must have exactly one replacement call to the helper.",
      "Replace the repeated decision once in each contributing function."
    );
  }

  const requiredBindings = referencedIdentifiers(
    source,
    roles.sourceContributors[0]!.syntaxRecordId
  );
  const contributorsPreserveBindings = roles.sourceContributors.every(
    ({ ownerFunctionSyntaxRecordId }) => includesAll(
      functionParameterNames(source, ownerFunctionSyntaxRecordId),
      requiredBindings
    )
  );
  const helperPreservesBindings = includesAll(
    functionParameterNames(target, helper.declarationSyntaxRecordId),
    requiredBindings
  );
  const callsPreserveBindings = roles.targetCalls.every(({ argumentText }) =>
    sameSequence(argumentNames(argumentText), requiredBindings)
  );
  if (
    !contributorsPreserveBindings ||
    !helperPreservesBindings ||
    !callsPreserveBindings
  ) {
    return repair("unsafe-capture", revisionIds, syntaxEvidence(roles),
      "The helper parameters or replacement arguments do not preserve the decision's required bindings.",
      "Pass each referenced binding to the helper in the same semantic order."
    );
  }

  return deepFreeze({
    schemaVersion: KP_TYPESCRIPT_EXTRACT_HELPER_LEGALITY_SCHEMA,
    status: "accepted" as const,
    language: "typescript" as const,
    sourceRevisionId: roles.sourceRevisionId,
    targetRevisionId: roles.targetRevisionId,
    helperName: helper.functionName,
    requiredBindings,
    obligations: [
      "contributors-are-distinct-owners",
      "helper-body-is-equivalent",
      "required-bindings-are-preserved",
      "replacement-calls-cover-contributors"
    ] as const,
    syntaxEvidenceIds: syntaxEvidence(roles)
  });
}

function repair(
  code: "unsupported-source-shape" | "ambiguous-ownership" | "unsafe-capture",
  revisionIds: readonly string[],
  roleIds: readonly string[],
  message: string,
  repairSummary: string
): KpCodeRefactorGenerationRepairResult {
  return repairKpCodeRefactorGeneration({
    language: "typescript",
    diagnostics: [createKpCodeRefactorGenerationDiagnostic({
      diagnosticId: `diagnostic.typescript.extract-helper.${code}`,
      code: `code-refactor.${code}`,
      language: "typescript",
      message,
      revisionIds,
      roleIds,
      repairSummary
    })]
  });
}

function syntaxEvidence(
  roles: KpTypeScriptExtractHelperRoleCandidates
): readonly string[] {
  return [...new Set([
    roles.sourceProgramSyntaxRecordId,
    roles.targetProgramSyntaxRecordId,
    ...roles.sourceContributors.map(({ syntaxRecordId }) => syntaxRecordId),
    ...roles.introducedHelpers.flatMap((helper) => [
      helper.declarationSyntaxRecordId,
      helper.bodyExpressionSyntaxRecordId
    ]),
    ...roles.targetCalls.map(({ callSyntaxRecordId }) => callSyntaxRecordId)
  ])];
}

function referencedIdentifiers(
  frontend: KpTypeScriptFrontendResult,
  expressionSyntaxRecordId: string
): readonly string[] {
  const expression = byId(frontend, expressionSyntaxRecordId);
  return [...new Set(descendants(frontend, expression)
    .filter(({ kindName }) => kindName === "Identifier")
    .map(({ text }) => text.trim()))];
}

function functionParameterNames(
  frontend: KpTypeScriptFrontendResult,
  functionSyntaxRecordId: string
): readonly string[] {
  const declaration = byId(frontend, functionSyntaxRecordId);
  return descendants(frontend, declaration)
    .filter(({ kindName }) => kindName === "Parameter")
    .map(({ text }) => /^([A-Za-z_$][\w$]*)/u.exec(text.trim())?.[1])
    .filter((name): name is string => name !== undefined);
}

function argumentNames(text: string): readonly string[] {
  return text.split(",").map((part) => part.trim()).filter(Boolean);
}

function descendants(
  frontend: KpTypeScriptFrontendResult,
  root: KpTypeScriptSyntaxRecord
): readonly KpTypeScriptSyntaxRecord[] {
  const recordsById = new Map(frontend.syntax.map((record) => [record.id, record]));
  return frontend.syntax.filter((candidate) => {
    let current = candidate.parentId === undefined
      ? undefined
      : recordsById.get(candidate.parentId);
    while (current !== undefined) {
      if (current.id === root.id) return true;
      current = current.parentId === undefined
        ? undefined
        : recordsById.get(current.parentId);
    }
    return false;
  });
}

function byId(
  frontend: KpTypeScriptFrontendResult,
  syntaxRecordId: string
): KpTypeScriptSyntaxRecord {
  const record = frontend.syntax.find(({ id }) => id === syntaxRecordId);
  if (record === undefined) {
    throw new Error(`Missing TypeScript syntax evidence ${syntaxRecordId}.`);
  }
  return record;
}

function includesAll(values: readonly string[], required: readonly string[]): boolean {
  const available = new Set(values);
  return required.every((value) => available.has(value));
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value) => right.includes(value));
}

function sameSequence(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
