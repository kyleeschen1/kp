import {
  repairKpCodeRefactorGeneration,
  createKpCodeRefactorGenerationDiagnostic,
  type KpCodeRefactorGenerationDiagnostic
} from "../src/domain-ir/code-refactor-generation-diagnostic.ts";
import type {
  KpCodeRefactorGenerationRequest,
  KpCodeRefactorGenerationResult
} from "../src/domain-ir/code-refactor-generation-request.ts";
import {
  compileKpExtractHelperCausalContract,
  type KpExtractHelperCausalContract
} from "../src/domain-ir/extract-helper-causal-contract.ts";
import { KP_PYTHON_EXTRACT_HELPER_OPERATION_AUTHORITY } from
  "../src/domain-ir/code-extract-helper-authorities.ts";
import {
  proveKpPythonExtractHelperLegality,
  type KpPythonExtractHelperLegalityProof
} from "./python-extract-helper-legality.ts";
import {
  recognizeKpPythonExtractHelperRoles
} from "./python-extract-helper-role-recognizer.ts";
import { compileKpPythonFrontend } from "./python-refactor-frontend.ts";

export const KP_PYTHON_CODE_GENERATION_PLAN_SCHEMA =
  "kp.python-code-generation-plan.v1" as const;

export interface KpPythonCodeGenerationRoleEvidence {
  readonly roleId: string;
  readonly revisionId: string;
  readonly syntaxRecordId: string;
}

export interface KpPythonCodeGenerationSemanticPlan {
  readonly schemaVersion: typeof KP_PYTHON_CODE_GENERATION_PLAN_SCHEMA;
  readonly operation: "extract-helper";
  readonly operationAuthorityId:
    typeof KP_PYTHON_EXTRACT_HELPER_OPERATION_AUTHORITY;
  readonly language: "python";
  readonly legality: KpPythonExtractHelperLegalityProof;
  readonly causalContract: KpExtractHelperCausalContract;
  readonly roleEvidence: readonly KpPythonCodeGenerationRoleEvidence[];
}

export type KpPythonCodeGenerationResult =
  KpCodeRefactorGenerationResult<
    KpPythonCodeGenerationSemanticPlan,
    KpCodeRefactorGenerationDiagnostic
  >;

/**
 * This build-time adapter emits verified semantic operations only. Python AST
 * objects, interpreter behavior, and presentation policy stop at this seam.
 */
export function compileKpPythonCodeGeneration(
  request: KpCodeRefactorGenerationRequest
): KpPythonCodeGenerationResult {
  if (request.language !== "python") {
    return repair(request, createKpCodeRefactorGenerationDiagnostic({
      diagnosticId: "diagnostic.python.extract-helper.wrong-language",
      code: "code-refactor.unsupported-operation",
      language: request.language,
      message: "The Python generation frontend accepts only Python requests.",
      revisionIds: request.revisions.map(({ revisionId }) => revisionId),
      repairSummary: "Route the request to its language-owned frontend."
    }));
  }
  const [beforeRevision, afterRevision] = request.revisions;
  const source = compileKpPythonFrontend({
    path: beforeRevision.path,
    revisionId: beforeRevision.revisionId,
    sourceText: beforeRevision.sourceText
  });
  const target = compileKpPythonFrontend({
    path: afterRevision.path,
    revisionId: afterRevision.revisionId,
    sourceText: afterRevision.sourceText
  });
  if (source.status !== "accepted" || target.status !== "accepted") {
    const rejected = source.status !== "accepted" ? source : target;
    return repair(request, createKpCodeRefactorGenerationDiagnostic({
      diagnosticId: "diagnostic.python.extract-helper.parse-rejected",
      code: "code-refactor.parse-rejected",
      language: "python",
      message: rejected.diagnostics.map(({ message }) => message).join("; "),
      revisionIds: [rejected.revisionId],
      repairSummary: "Repair the rejected Python revision before generating semantics."
    }));
  }

  const roles = recognizeKpPythonExtractHelperRoles(source, target);
  const legality = proveKpPythonExtractHelperLegality(source, target, roles);
  if (legality.status !== "accepted") {
    return repairKpCodeRefactorGeneration({
      requestId: request.requestId,
      language: "python",
      diagnostics: legality.diagnostics
    });
  }

  const roleEvidence = createRoleEvidence(roles);
  const role = (suffix: string) => `role.python.extract-helper.${suffix}`;
  const causalContract = compileKpExtractHelperCausalContract({
    contractId: `contract.python.${request.requestId}.extract-helper`,
    sourceProgramRoleId: role("program.before"),
    targetProgramRoleId: role("program.after"),
    introducedHelper: {
      declarationRoleId: role("helper.declaration"),
      bodyRoleId: role("helper.body")
    },
    contributors: roles.sourceContributors.map((_, index) => ({
      sourceContributorRoleId: role(`contributor.${index + 1}.before`),
      targetCallRoleId: role(`contributor.${index + 1}.call.after`)
    }))
  });

  return deepFreeze({
    status: "accepted" as const,
    requestId: request.requestId,
    language: "python" as const,
    semanticPlan: {
      schemaVersion: KP_PYTHON_CODE_GENERATION_PLAN_SCHEMA,
      operation: "extract-helper" as const,
      operationAuthorityId: KP_PYTHON_EXTRACT_HELPER_OPERATION_AUTHORITY,
      language: "python" as const,
      legality,
      causalContract,
      roleEvidence
    },
    diagnostics: [] as const
  });
}

function createRoleEvidence(
  roles: ReturnType<typeof recognizeKpPythonExtractHelperRoles>
): readonly KpPythonCodeGenerationRoleEvidence[] {
  const role = (suffix: string) => `role.python.extract-helper.${suffix}`;
  const helper = roles.introducedHelpers[0]!;
  return [
    evidence(role("program.before"), roles.sourceRevisionId,
      roles.sourceProgramSyntaxRecordId),
    evidence(role("program.after"), roles.targetRevisionId,
      roles.targetProgramSyntaxRecordId),
    evidence(role("helper.declaration"), roles.targetRevisionId,
      helper.declarationSyntaxRecordId),
    evidence(role("helper.body"), roles.targetRevisionId,
      helper.bodyExpressionSyntaxRecordId),
    ...roles.sourceContributors.map((contributor, index) => evidence(
      role(`contributor.${index + 1}.before`),
      roles.sourceRevisionId,
      contributor.syntaxRecordId
    )),
    ...roles.targetCalls.map((call, index) => evidence(
      role(`contributor.${index + 1}.call.after`),
      roles.targetRevisionId,
      call.callSyntaxRecordId
    ))
  ];
}

function evidence(
  roleId: string,
  revisionId: string,
  syntaxRecordId: string
): KpPythonCodeGenerationRoleEvidence {
  return Object.freeze({ roleId, revisionId, syntaxRecordId });
}

function repair(
  request: KpCodeRefactorGenerationRequest,
  diagnostic: KpCodeRefactorGenerationDiagnostic
): KpPythonCodeGenerationResult {
  return repairKpCodeRefactorGeneration({
    requestId: request.requestId,
    language: request.language,
    diagnostics: [diagnostic]
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
