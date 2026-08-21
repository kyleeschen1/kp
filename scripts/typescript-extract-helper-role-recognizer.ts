import type {
  KpTypeScriptFrontendResult,
  KpTypeScriptSyntaxRecord
} from "./typescript-refactor-frontend.ts";

export const KP_TYPESCRIPT_EXTRACT_HELPER_ROLES_SCHEMA =
  "kp.typescript-extract-helper-roles.v1" as const;

export interface KpTypeScriptOwnedExpressionRole {
  readonly syntaxRecordId: string;
  readonly ownerFunctionSyntaxRecordId: string;
  readonly ownerFunctionName: string;
  readonly expressionText: string;
}

export interface KpTypeScriptHelperRoleCandidate {
  readonly declarationSyntaxRecordId: string;
  readonly functionName: string;
  readonly bodyExpressionSyntaxRecordId: string;
  readonly bodyExpressionText: string;
}

export interface KpTypeScriptCallRoleCandidate {
  readonly callSyntaxRecordId: string;
  readonly ownerFunctionSyntaxRecordId: string;
  readonly ownerFunctionName: string;
  readonly calleeName: string;
  readonly argumentText: string;
}

export interface KpTypeScriptExtractHelperRoleCandidates {
  readonly schemaVersion: typeof KP_TYPESCRIPT_EXTRACT_HELPER_ROLES_SCHEMA;
  readonly language: "typescript";
  readonly sourceRevisionId: string;
  readonly targetRevisionId: string;
  readonly sourceProgramSyntaxRecordId: string;
  readonly targetProgramSyntaxRecordId: string;
  readonly duplicateGroupCount: number;
  readonly duplicateExpressionText: string | undefined;
  readonly sourceContributors: readonly KpTypeScriptOwnedExpressionRole[];
  readonly introducedHelpers: readonly KpTypeScriptHelperRoleCandidate[];
  readonly targetCalls: readonly KpTypeScriptCallRoleCandidate[];
}

/**
 * Recognition reports syntax-backed candidates only. Semantic binding and
 * legality remain separate so a plausible syntax shape cannot authorize an
 * animation or mint durable KP identity by itself.
 */
export function recognizeKpTypeScriptExtractHelperRoles(
  source: KpTypeScriptFrontendResult,
  target: KpTypeScriptFrontendResult
): KpTypeScriptExtractHelperRoleCandidates {
  assertAccepted(source, "source");
  assertAccepted(target, "target");

  const duplicateGroups = groupOwnedExpressions(source)
    .filter((group) => new Set(group.map(({ ownerFunctionName }) =>
      ownerFunctionName
    )).size >= 2)
    .sort(compareExpressionGroups);
  const selectedGroup = duplicateGroups[0] ?? [];
  const duplicateExpressionText = selectedGroup[0]?.expressionText;
  const introducedHelpers = duplicateExpressionText === undefined
    ? []
    : findHelperCandidates(target, duplicateExpressionText);
  const helperNames = new Set(introducedHelpers.map(({ functionName }) =>
    functionName
  ));

  return deepFreeze({
    schemaVersion: KP_TYPESCRIPT_EXTRACT_HELPER_ROLES_SCHEMA,
    language: "typescript" as const,
    sourceRevisionId: source.revisionId,
    targetRevisionId: target.revisionId,
    sourceProgramSyntaxRecordId: sourceRecord(source).id,
    targetProgramSyntaxRecordId: sourceRecord(target).id,
    duplicateGroupCount: duplicateGroups.length,
    duplicateExpressionText,
    sourceContributors: selectedGroup,
    introducedHelpers,
    targetCalls: findCallCandidates(target).filter(({ calleeName }) =>
      helperNames.has(calleeName)
    )
  });
}

function groupOwnedExpressions(
  frontend: KpTypeScriptFrontendResult
): readonly KpTypeScriptOwnedExpressionRole[][] {
  const groups = new Map<string, KpTypeScriptOwnedExpressionRole[]>();
  frontend.syntax
    .filter(({ kindName }) => kindName === "BinaryExpression")
    .forEach((record) => {
      const owner = ancestor(frontend, record, "FunctionDeclaration");
      if (owner === undefined) return;
      const expressionText = normalizeSource(record.text);
      const candidate = {
        syntaxRecordId: record.id,
        ownerFunctionSyntaxRecordId: owner.id,
        ownerFunctionName: declaredFunctionName(owner),
        expressionText
      };
      const existing = groups.get(expressionText) ?? [];
      groups.set(expressionText, [...existing, candidate]);
    });
  return [...groups.values()];
}

function findHelperCandidates(
  frontend: KpTypeScriptFrontendResult,
  duplicateExpressionText: string
): readonly KpTypeScriptHelperRoleCandidate[] {
  return frontend.syntax
    .filter(({ kindName }) => kindName === "FunctionDeclaration")
    .flatMap((declaration) => descendants(frontend, declaration)
      .filter(({ kindName, text }) =>
        kindName === "BinaryExpression" &&
        normalizeSource(text) === duplicateExpressionText
      )
      .map((bodyExpression) => ({
        declarationSyntaxRecordId: declaration.id,
        functionName: declaredFunctionName(declaration),
        bodyExpressionSyntaxRecordId: bodyExpression.id,
        bodyExpressionText: normalizeSource(bodyExpression.text)
      })));
}

function findCallCandidates(
  frontend: KpTypeScriptFrontendResult
): readonly KpTypeScriptCallRoleCandidate[] {
  return frontend.syntax
    .filter(({ kindName }) => kindName === "CallExpression")
    .flatMap((call) => {
      const owner = ancestor(frontend, call, "FunctionDeclaration");
      const parsed = parseCall(call.text);
      if (owner === undefined || parsed === undefined) return [];
      return [{
        callSyntaxRecordId: call.id,
        ownerFunctionSyntaxRecordId: owner.id,
        ownerFunctionName: declaredFunctionName(owner),
        calleeName: parsed.calleeName,
        argumentText: normalizeSource(parsed.argumentText)
      }];
    });
}

function sourceRecord(
  frontend: KpTypeScriptFrontendResult
): KpTypeScriptSyntaxRecord {
  return exactlyOne(frontend.syntax.filter(({ kindName }) =>
    kindName === "SourceFile"
  ), `${frontend.revisionId} source file`);
}

function ancestor(
  frontend: KpTypeScriptFrontendResult,
  record: KpTypeScriptSyntaxRecord,
  kindName: string
): KpTypeScriptSyntaxRecord | undefined {
  const byId = new Map(frontend.syntax.map((candidate) => [candidate.id, candidate]));
  let current = record.parentId === undefined
    ? undefined
    : byId.get(record.parentId);
  while (current !== undefined) {
    if (current.kindName === kindName) return current;
    current = current.parentId === undefined
      ? undefined
      : byId.get(current.parentId);
  }
  return undefined;
}

function descendants(
  frontend: KpTypeScriptFrontendResult,
  root: KpTypeScriptSyntaxRecord
): readonly KpTypeScriptSyntaxRecord[] {
  return frontend.syntax.filter((candidate) => {
    let current = candidate.parentId === undefined
      ? undefined
      : frontend.syntax.find(({ id }) => id === candidate.parentId);
    while (current !== undefined) {
      if (current.id === root.id) return true;
      current = current.parentId === undefined
        ? undefined
        : frontend.syntax.find(({ id }) => id === current?.parentId);
    }
    return false;
  });
}

function declaredFunctionName(record: KpTypeScriptSyntaxRecord): string {
  const name = /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/u
    .exec(record.text)?.[1];
  if (name === undefined) {
    throw new Error(`Function syntax ${record.id} has no named declaration.`);
  }
  return name;
}

function parseCall(
  text: string
): { readonly calleeName: string; readonly argumentText: string } | undefined {
  const match = /^([A-Za-z_$][\w$]*)\s*\((.*)\)$/su.exec(text.trim());
  return match === null || match[1] === undefined || match[2] === undefined
    ? undefined
    : { calleeName: match[1], argumentText: match[2] };
}

function normalizeSource(source: string): string {
  return source.replace(/\s+/gu, " ").trim();
}

function compareExpressionGroups(
  left: readonly KpTypeScriptOwnedExpressionRole[],
  right: readonly KpTypeScriptOwnedExpressionRole[]
): number {
  return right.length - left.length ||
    (left[0]?.expressionText ?? "").localeCompare(
      right[0]?.expressionText ?? ""
    );
}

function exactlyOne<T>(values: readonly T[], label: string): T {
  if (values.length !== 1) {
    throw new Error(`${label} requires exactly one syntax record.`);
  }
  return values[0]!;
}

function assertAccepted(
  frontend: KpTypeScriptFrontendResult,
  role: "source" | "target"
): void {
  if (frontend.status !== "accepted") {
    throw new Error(
      `Cannot recognize ${role} roles from rejected TypeScript syntax.`
    );
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
