import {
  createKpCodeRefactorGenerationDiagnostic,
  repairKpCodeRefactorGeneration,
  type KpCodeRefactorGenerationRepairResult
} from "../src/domain-ir/code-refactor-generation-diagnostic.ts";
import type {
  KpPythonExtractHelperRoleCandidates
} from "./python-extract-helper-role-recognizer.ts";
import type {
  KpPythonFrontendResult,
  KpPythonSyntaxRecord
} from "./python-refactor-frontend.ts";

export const KP_PYTHON_EXTRACT_HELPER_LEGALITY_SCHEMA =
  "kp.python-extract-helper-legality.v1" as const;

export type KpPythonExtractHelperLegalityObligation =
  | "contributors-are-distinct-owners"
  | "helper-body-is-equivalent"
  | "required-bindings-are-preserved"
  | "annotations-are-preserved"
  | "replacement-calls-cover-contributors";

export interface KpPythonExtractHelperLegalityProof {
  readonly schemaVersion: typeof KP_PYTHON_EXTRACT_HELPER_LEGALITY_SCHEMA;
  readonly status: "accepted";
  readonly language: "python";
  readonly sourceRevisionId: string;
  readonly targetRevisionId: string;
  readonly helperName: string;
  readonly requiredBindings: readonly string[];
  readonly requiredAnnotations: readonly Readonly<{
    name: string;
    annotation: string | undefined;
  }>[];
  readonly obligations: readonly KpPythonExtractHelperLegalityObligation[];
  readonly syntaxEvidenceIds: readonly string[];
}

export type KpPythonExtractHelperLegalityResult =
  | KpPythonExtractHelperLegalityProof
  | KpCodeRefactorGenerationRepairResult;

/**
 * The proof authorizes one Python extract-helper shape without executing code.
 * Dynamic semantics outside explicit AST bindings and annotations fail closed.
 */
export function proveKpPythonExtractHelperLegality(
  source: KpPythonFrontendResult,
  target: KpPythonFrontendResult,
  roles: KpPythonExtractHelperRoleCandidates
): KpPythonExtractHelperLegalityResult {
  const revisionIds = [roles.sourceRevisionId, roles.targetRevisionId];
  if (
    roles.duplicateGroupCount === 0 ||
    roles.sourceContributors.length < 2 ||
    roles.duplicateExpressionText === undefined ||
    roles.introducedHelpers.length === 0
  ) {
    if (
      roles.duplicateGroupCount === 0 &&
      roles.sourceExpressionOwnerCount >= 2
    ) return repair("non-equivalent-duplicates", revisionIds, [],
      "The candidate Python functions do not contain one equivalent repeated decision.",
      "Make the intended contributor expressions structurally equivalent before extraction."
    );
    return repair("unsupported-source-shape", revisionIds, [],
      "The revisions must contain one repeated decision and an extracted helper.",
      "Use two equivalent expressions in distinct functions and extract one named helper."
    );
  }
  if (roles.duplicateGroupCount !== 1 || roles.introducedHelpers.length !== 1) {
    return repair("ambiguous-ownership", revisionIds, syntaxEvidence(roles),
      "Python recognition found more than one possible duplicate group or helper owner.",
      "Make one repeated decision and one extracted helper unambiguous."
    );
  }

  const helper = roles.introducedHelpers[0]!;
  const involvedFunctions = [
    ...roles.sourceContributors.map(({ ownerFunctionSyntaxRecordId }) =>
      byId(source, ownerFunctionSyntaxRecordId)
    ),
    byId(target, helper.declarationSyntaxRecordId),
    ...roles.targetCalls.map(({ ownerFunctionSyntaxRecordId }) =>
      byId(target, ownerFunctionSyntaxRecordId)
    )
  ];
  const involvedCalls = roles.targetCalls.map(({ callSyntaxRecordId }) =>
    byId(target, callSyntaxRecordId)
  );
  if (
    involvedFunctions.some(({ facts }) => facts?.hasVariadicParameters) ||
    involvedCalls.some(({ facts }) => facts?.hasKeywordArguments)
  ) {
    return repair("unsupported-source-shape", revisionIds, syntaxEvidence(roles),
      "Variadic parameters and keyword-call rewrites are outside the bounded Python extraction shape.",
      "Use explicit positional parameters and positional helper arguments."
    );
  }

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
      "Every contributing Python function must have exactly one replacement call to the helper.",
      "Replace the repeated decision once in each contributing function."
    );
  }

  const requiredBindings = referencedIdentifiers(
    source,
    roles.sourceContributors[0]!.syntaxRecordId
  );
  const contributorDeclarations = roles.sourceContributors.map(
    ({ ownerFunctionSyntaxRecordId }) => byId(source, ownerFunctionSyntaxRecordId)
  );
  const helperDeclaration = byId(target, helper.declarationSyntaxRecordId);
  const contributorsPreserveBindings = contributorDeclarations.every(
    (declaration) => includesAll(functionParameterNames(declaration), requiredBindings)
  );
  const helperPreservesBindings = includesAll(
    functionParameterNames(helperDeclaration),
    requiredBindings
  );
  const callsPreserveBindings = roles.targetCalls.every(({ argumentTexts }) =>
    sameSequence(argumentTexts, requiredBindings)
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

  const requiredAnnotations = requiredBindings.map((name) => ({
    name,
    annotation: parameterAnnotation(contributorDeclarations[0]!, name)
  }));
  const annotationsPreserved = contributorDeclarations.every((declaration) =>
    requiredAnnotations.every(({ name, annotation }) =>
      parameterAnnotation(declaration, name) === annotation
    )
  ) && requiredAnnotations.every(({ name, annotation }) =>
    parameterAnnotation(helperDeclaration, name) === annotation
  );
  if (!annotationsPreserved) {
    return repair("unsafe-capture", revisionIds, syntaxEvidence(roles),
      "The extracted helper changes or loses a required Python parameter annotation.",
      "Preserve each contributing binding annotation on the extracted helper."
    );
  }

  return deepFreeze({
    schemaVersion: KP_PYTHON_EXTRACT_HELPER_LEGALITY_SCHEMA,
    status: "accepted" as const,
    language: "python" as const,
    sourceRevisionId: roles.sourceRevisionId,
    targetRevisionId: roles.targetRevisionId,
    helperName: helper.functionName,
    requiredBindings,
    requiredAnnotations,
    obligations: [
      "contributors-are-distinct-owners",
      "helper-body-is-equivalent",
      "required-bindings-are-preserved",
      "annotations-are-preserved",
      "replacement-calls-cover-contributors"
    ] as const,
    syntaxEvidenceIds: syntaxEvidence(roles)
  });
}

function repair(
  code:
    | "unsupported-source-shape"
    | "non-equivalent-duplicates"
    | "ambiguous-ownership"
    | "unsafe-capture",
  revisionIds: readonly string[],
  roleIds: readonly string[],
  message: string,
  repairSummary: string
): KpCodeRefactorGenerationRepairResult {
  return repairKpCodeRefactorGeneration({
    language: "python",
    diagnostics: [createKpCodeRefactorGenerationDiagnostic({
      diagnosticId: `diagnostic.python.extract-helper.${code}`,
      code: `code-refactor.${code}`,
      language: "python",
      message,
      revisionIds,
      roleIds,
      repairSummary
    })]
  });
}

function syntaxEvidence(
  roles: KpPythonExtractHelperRoleCandidates
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
  ])].map(diagnosticEvidenceId);
}

// Python AST kind names are capitalized; repair diagnostics use the shared
// lowercase evidence namespace while accepted proofs retain exact AST IDs.
function diagnosticEvidenceId(syntaxRecordId: string): string {
  return `python.${syntaxRecordId.toLowerCase()}`;
}

function referencedIdentifiers(
  frontend: KpPythonFrontendResult,
  expressionSyntaxRecordId: string
): readonly string[] {
  return byId(frontend, expressionSyntaxRecordId).facts?.referencedNames ?? [];
}

function functionParameterNames(
  declaration: KpPythonSyntaxRecord
): readonly string[] {
  return declaration.facts?.parameterNames ?? [];
}

function parameterAnnotation(
  declaration: KpPythonSyntaxRecord,
  name: string
): string | undefined {
  return declaration.facts?.parameterAnnotations?.find((parameter) =>
    parameter.name === name
  )?.annotation;
}

function byId(
  frontend: KpPythonFrontendResult,
  syntaxRecordId: string
): KpPythonSyntaxRecord {
  const record = frontend.syntax.find(({ id }) => id === syntaxRecordId);
  if (record === undefined) {
    throw new Error(`Missing Python syntax evidence ${syntaxRecordId}.`);
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
