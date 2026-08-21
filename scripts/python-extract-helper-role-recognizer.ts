import type {
  KpPythonFrontendResult,
  KpPythonSyntaxRecord
} from "./python-refactor-frontend.ts";

export const KP_PYTHON_EXTRACT_HELPER_ROLES_SCHEMA =
  "kp.python-extract-helper-roles.v1" as const;

export interface KpPythonOwnedExpressionRole {
  readonly syntaxRecordId: string;
  readonly ownerFunctionSyntaxRecordId: string;
  readonly ownerFunctionName: string;
  readonly expressionText: string;
}

export interface KpPythonHelperRoleCandidate {
  readonly declarationSyntaxRecordId: string;
  readonly functionName: string;
  readonly bodyExpressionSyntaxRecordId: string;
  readonly bodyExpressionText: string;
}

export interface KpPythonCallRoleCandidate {
  readonly callSyntaxRecordId: string;
  readonly ownerFunctionSyntaxRecordId: string;
  readonly ownerFunctionName: string;
  readonly calleeName: string;
  readonly argumentTexts: readonly string[];
}

export interface KpPythonExtractHelperRoleCandidates {
  readonly schemaVersion: typeof KP_PYTHON_EXTRACT_HELPER_ROLES_SCHEMA;
  readonly language: "python";
  readonly sourceRevisionId: string;
  readonly targetRevisionId: string;
  readonly sourceProgramSyntaxRecordId: string;
  readonly targetProgramSyntaxRecordId: string;
  readonly sourceExpressionOwnerCount: number;
  readonly duplicateGroupCount: number;
  readonly duplicateExpressionText: string | undefined;
  readonly sourceContributors: readonly KpPythonOwnedExpressionRole[];
  readonly introducedHelpers: readonly KpPythonHelperRoleCandidate[];
  readonly targetCalls: readonly KpPythonCallRoleCandidate[];
}

/**
 * Python owns recognition because its AST and binding surface differ from
 * TypeScript. Only resulting causal roles may cross the language boundary.
 */
export function recognizeKpPythonExtractHelperRoles(
  source: KpPythonFrontendResult,
  target: KpPythonFrontendResult
): KpPythonExtractHelperRoleCandidates {
  assertAccepted(source, "source");
  assertAccepted(target, "target");

  const expressionGroups = groupOwnedExpressions(source);
  const duplicateGroups = expressionGroups
    .filter((group) => new Set(group.map(({ ownerFunctionName }) =>
      ownerFunctionName
    )).size >= 2)
    .filter((group, _, groups) => !groups.some((outer) =>
      outer !== group && group.every((candidate) => {
        const outerCandidate = outer.find(({ ownerFunctionName }) =>
          ownerFunctionName === candidate.ownerFunctionName
        );
        return outerCandidate !== undefined && hasAncestorSyntaxRecord(
          source,
          candidate.syntaxRecordId,
          outerCandidate.syntaxRecordId
        );
      })
    ))
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
    schemaVersion: KP_PYTHON_EXTRACT_HELPER_ROLES_SCHEMA,
    language: "python" as const,
    sourceRevisionId: source.revisionId,
    targetRevisionId: target.revisionId,
    sourceProgramSyntaxRecordId: sourceRecord(source).id,
    targetProgramSyntaxRecordId: sourceRecord(target).id,
    sourceExpressionOwnerCount: new Set(expressionGroups.flatMap((group) =>
      group.map(({ ownerFunctionName }) => ownerFunctionName)
    )).size,
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
  frontend: KpPythonFrontendResult
): readonly KpPythonOwnedExpressionRole[][] {
  const groups = new Map<string, KpPythonOwnedExpressionRole[]>();
  frontend.syntax
    .filter(({ kindName }) => expressionKinds.has(kindName))
    .forEach((record) => {
      const owner = ancestor(frontend, record, functionKinds);
      if (owner === undefined) return;
      const expressionText = normalizeSource(record.text);
      const candidate = {
        syntaxRecordId: record.id,
        ownerFunctionSyntaxRecordId: owner.id,
        ownerFunctionName: declaredFunctionName(owner),
        expressionText
      };
      groups.set(expressionText, [...(groups.get(expressionText) ?? []), candidate]);
    });
  return [...groups.values()];
}

function findHelperCandidates(
  frontend: KpPythonFrontendResult,
  duplicateExpressionText: string
): readonly KpPythonHelperRoleCandidate[] {
  return frontend.syntax
    .filter(({ kindName }) => functionKinds.has(kindName))
    .flatMap((declaration) => descendants(frontend, declaration)
      .filter(({ kindName, text }) =>
        expressionKinds.has(kindName) &&
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
  frontend: KpPythonFrontendResult
): readonly KpPythonCallRoleCandidate[] {
  return frontend.syntax
    .filter(({ kindName }) => kindName === "Call")
    .flatMap((call) => {
      const owner = ancestor(frontend, call, functionKinds);
      const calleeName = call.facts?.calledName;
      const argumentTexts = call.facts?.argumentTexts;
      if (
        owner === undefined ||
        calleeName === undefined ||
        argumentTexts === undefined
      ) return [];
      return [{
        callSyntaxRecordId: call.id,
        ownerFunctionSyntaxRecordId: owner.id,
        ownerFunctionName: declaredFunctionName(owner),
        calleeName,
        argumentTexts: argumentTexts.map(normalizeSource)
      }];
    });
}

function hasAncestorSyntaxRecord(
  frontend: KpPythonFrontendResult,
  descendantId: string,
  ancestorId: string
): boolean {
  const byRecordId = new Map(frontend.syntax.map((record) => [record.id, record]));
  let current = byRecordId.get(descendantId);
  while (current?.parentId !== undefined) {
    if (current.parentId === ancestorId) return true;
    current = byRecordId.get(current.parentId);
  }
  return false;
}

function sourceRecord(frontend: KpPythonFrontendResult): KpPythonSyntaxRecord {
  return exactlyOne(
    frontend.syntax.filter(({ kindName }) => kindName === "Module"),
    `${frontend.revisionId} module`
  );
}

function ancestor(
  frontend: KpPythonFrontendResult,
  record: KpPythonSyntaxRecord,
  kindNames: ReadonlySet<string>
): KpPythonSyntaxRecord | undefined {
  const byId = new Map(frontend.syntax.map((candidate) => [candidate.id, candidate]));
  let current = record.parentId === undefined
    ? undefined
    : byId.get(record.parentId);
  while (current !== undefined) {
    if (kindNames.has(current.kindName)) return current;
    current = current.parentId === undefined
      ? undefined
      : byId.get(current.parentId);
  }
  return undefined;
}

function descendants(
  frontend: KpPythonFrontendResult,
  root: KpPythonSyntaxRecord
): readonly KpPythonSyntaxRecord[] {
  const byId = new Map(frontend.syntax.map((record) => [record.id, record]));
  return frontend.syntax.filter((candidate) => {
    let current = candidate.parentId === undefined
      ? undefined
      : byId.get(candidate.parentId);
    while (current !== undefined) {
      if (current.id === root.id) return true;
      current = current.parentId === undefined
        ? undefined
        : byId.get(current.parentId);
    }
    return false;
  });
}

function declaredFunctionName(record: KpPythonSyntaxRecord): string {
  const name = record.facts?.declaredName;
  if (name === undefined) {
    throw new Error(`Function syntax ${record.id} has no named declaration.`);
  }
  return name;
}

function normalizeSource(source: string): string {
  return source.replace(/\s+/gu, " ").trim();
}

function compareExpressionGroups(
  left: readonly KpPythonOwnedExpressionRole[],
  right: readonly KpPythonOwnedExpressionRole[]
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
  frontend: KpPythonFrontendResult,
  role: "source" | "target"
): void {
  if (frontend.status !== "accepted") {
    throw new Error(`Cannot recognize ${role} roles from rejected Python syntax.`);
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

const expressionKinds = new Set(["Compare", "BoolOp"]);
const functionKinds = new Set(["FunctionDef", "AsyncFunctionDef"]);
