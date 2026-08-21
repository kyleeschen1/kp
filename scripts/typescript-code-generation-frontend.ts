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
import { KP_TYPESCRIPT_EXTRACT_HELPER_OPERATION_AUTHORITY } from
  "../src/domain-ir/code-extract-helper-authorities.ts";
import {
  proveKpTypeScriptExtractHelperLegality,
  type KpTypeScriptExtractHelperLegalityProof
} from "./typescript-extract-helper-legality.ts";
import {
  recognizeKpTypeScriptExtractHelperRoles
} from "./typescript-extract-helper-role-recognizer.ts";
import {
  compileKpTypeScriptFrontend
} from "./typescript-refactor-frontend.ts";

export const KP_TYPESCRIPT_CODE_GENERATION_PLAN_SCHEMA =
  "kp.typescript-code-generation-plan.v1" as const;

export interface KpTypeScriptCodeGenerationRoleEvidence {
  readonly roleId: string;
  readonly revisionId: string;
  readonly syntaxRecordId: string;
}

export interface KpTypeScriptCodeGenerationSemanticPlan {
  readonly schemaVersion: typeof KP_TYPESCRIPT_CODE_GENERATION_PLAN_SCHEMA;
  readonly operation: "extract-helper";
  readonly operationAuthorityId:
    typeof KP_TYPESCRIPT_EXTRACT_HELPER_OPERATION_AUTHORITY;
  readonly language: "typescript";
  readonly legality: KpTypeScriptExtractHelperLegalityProof;
  readonly causalContract: KpExtractHelperCausalContract;
  readonly roleEvidence: readonly KpTypeScriptCodeGenerationRoleEvidence[];
}

export type KpTypeScriptCodeGenerationResult =
  KpCodeRefactorGenerationResult<
    KpTypeScriptCodeGenerationSemanticPlan,
    KpCodeRefactorGenerationDiagnostic
  >;

/**
 * This build-time adapter ends at verified semantic operations. It deliberately
 * exposes neither compiler objects nor animation policy to the runtime.
 */
export function compileKpTypeScriptCodeGeneration(
  request: KpCodeRefactorGenerationRequest
): KpTypeScriptCodeGenerationResult {
  if (request.language !== "typescript") {
    return repair(request, createKpCodeRefactorGenerationDiagnostic({
      diagnosticId: "diagnostic.typescript.extract-helper.wrong-language",
      code: "code-refactor.unsupported-operation",
      language: request.language,
      message: "The TypeScript generation frontend accepts only TypeScript requests.",
      revisionIds: request.revisions.map(({ revisionId }) => revisionId),
      repairSummary: "Route the request to its language-owned frontend."
    }));
  }
  const [beforeRevision, afterRevision] = request.revisions;
  const source = compileKpTypeScriptFrontend({
    path: beforeRevision.path,
    revisionId: beforeRevision.revisionId,
    sourceText: beforeRevision.sourceText
  });
  const target = compileKpTypeScriptFrontend({
    path: afterRevision.path,
    revisionId: afterRevision.revisionId,
    sourceText: afterRevision.sourceText
  });
  if (source.status !== "accepted" || target.status !== "accepted") {
    const rejected = source.status !== "accepted" ? source : target;
    return repair(request, createKpCodeRefactorGenerationDiagnostic({
      diagnosticId: "diagnostic.typescript.extract-helper.parse-rejected",
      code: "code-refactor.parse-rejected",
      language: "typescript",
      message: rejected.diagnostics.map(({ message }) => message).join("; "),
      revisionIds: [rejected.revisionId],
      repairSummary: "Repair the rejected TypeScript revision before generating semantics."
    }));
  }

  const roles = recognizeKpTypeScriptExtractHelperRoles(source, target);
  const legality = proveKpTypeScriptExtractHelperLegality(source, target, roles);
  if (legality.status !== "accepted") {
    return repairKpCodeRefactorGeneration({
      requestId: request.requestId,
      language: "typescript",
      diagnostics: legality.diagnostics
    });
  }

  const roleEvidence = createRoleEvidence(roles);
  const role = (suffix: string) => `role.typescript.extract-helper.${suffix}`;
  const causalContract = compileKpExtractHelperCausalContract({
    contractId: `contract.typescript.${request.requestId}.extract-helper`,
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
    language: "typescript" as const,
    semanticPlan: {
      schemaVersion: KP_TYPESCRIPT_CODE_GENERATION_PLAN_SCHEMA,
      operation: "extract-helper" as const,
      operationAuthorityId: KP_TYPESCRIPT_EXTRACT_HELPER_OPERATION_AUTHORITY,
      language: "typescript" as const,
      legality,
      causalContract,
      roleEvidence
    },
    diagnostics: [] as const
  });
}

function createRoleEvidence(
  roles: ReturnType<typeof recognizeKpTypeScriptExtractHelperRoles>
): readonly KpTypeScriptCodeGenerationRoleEvidence[] {
  const role = (suffix: string) => `role.typescript.extract-helper.${suffix}`;
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
): KpTypeScriptCodeGenerationRoleEvidence {
  return Object.freeze({ roleId, revisionId, syntaxRecordId });
}

function repair(
  request: KpCodeRefactorGenerationRequest,
  diagnostic: KpCodeRefactorGenerationDiagnostic
): KpTypeScriptCodeGenerationResult {
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
