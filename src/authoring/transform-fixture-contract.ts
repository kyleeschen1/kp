import type {
  KatexTransformFixture,
  KatexTransformFixtureFamily,
  KatexTransformFixtureIntent,
  KatexTransformFixtureLayoutRole,
  KatexTransformFixtureTokenRole
} from "../rendering/katex-transform-fixtures.ts";

export const TRANSFORM_FIXTURE_CONTRACT_VERSION = 1;

export interface TransformFixtureDocument {
  readonly schemaVersion: typeof TRANSFORM_FIXTURE_CONTRACT_VERSION;
  readonly kind: "katex-transform-fixture";
  readonly fixture: KatexTransformFixture;
}

export interface TransformFixtureValidationIssue {
  readonly path: string;
  readonly message: string;
}

export type TransformFixtureImportResult =
  | {
      readonly ok: true;
      readonly fixture: KatexTransformFixture;
      readonly document: TransformFixtureDocument;
    }
  | {
      readonly ok: false;
      readonly issues: readonly TransformFixtureValidationIssue[];
    };

const KATEX_TRANSFORM_FIXTURE_FAMILIES = new Set<string>([
  "fraction",
  "large-operator",
  "matrix",
  "radical",
  "script",
  "wrapper"
]);

const KATEX_TRANSFORM_FIXTURE_INTENTS = new Set<string>([
  "addIntegralBounds",
  "addSummationBounds",
  "changeIndex",
  "changeLimitApproach",
  "changeMatrixDelimiter",
  "changeProductBounds",
  "combineFractions",
  "combineRepeatedFactorAsPower",
  "expandPower",
  "makeFraction",
  "rewritePowerAsRoot",
  "rewriteRootAsPower",
  "splitFraction",
  "swapMatrixRows",
  "transposeVector",
  "unwrapDelimiter",
  "unwrapIndexedRoot",
  "updateMatrixEntry",
  "wrapWithDelimiter",
  "wrapWithFunction"
]);

const KATEX_TRANSFORM_TOKEN_ROLES = new Set<string>([
  "artifact",
  "base",
  "body",
  "differential",
  "factor",
  "integrand",
  "large-operator",
  "limit-approach",
  "lower-limit",
  "matrix-column",
  "matrix-entry",
  "matrix-row",
  "operator",
  "radicand",
  "root-index",
  "semantic",
  "subscript",
  "superscript",
  "upper-limit",
  "vector-entry"
]);

const KATEX_TRANSFORM_LAYOUT_ROLES = new Set<string>([
  "baseline",
  "lower-limit",
  "matrix-column",
  "matrix-entry",
  "matrix-left-bracket",
  "matrix-right-bracket",
  "matrix-row",
  "upper-limit"
]);

export function exportKatexTransformFixture(
  fixture: KatexTransformFixture
): TransformFixtureDocument {
  return {
    schemaVersion: TRANSFORM_FIXTURE_CONTRACT_VERSION,
    kind: "katex-transform-fixture",
    fixture: cloneJson(fixture)
  };
}

export function importKatexTransformFixtureDocument(
  value: unknown
): TransformFixtureImportResult {
  const issues = validateTransformFixtureDocument(value);

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const document = cloneJson(value as TransformFixtureDocument);

  return {
    ok: true,
    document,
    fixture: document.fixture
  };
}

export function validateTransformFixtureDocument(
  value: unknown
): readonly TransformFixtureValidationIssue[] {
  const issues: TransformFixtureValidationIssue[] = [];

  if (!isRecord(value)) {
    issues.push({
      path: "$",
      message: "Expected a transform fixture document object."
    });
    return issues;
  }

  if (value["schemaVersion"] !== TRANSFORM_FIXTURE_CONTRACT_VERSION) {
    issues.push({
      path: "schemaVersion",
      message: `Expected schema version ${TRANSFORM_FIXTURE_CONTRACT_VERSION}.`
    });
  }

  if (value["kind"] !== "katex-transform-fixture") {
    issues.push({
      path: "kind",
      message: "Expected kind katex-transform-fixture."
    });
  }

  validateFixture(value["fixture"], "fixture", issues);

  return issues;
}

function validateFixture(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected a fixture object."
    });
    return;
  }

  validateNonEmptyString(value["id"], `${path}.id`, issues);
  validateKnownString<KatexTransformFixtureFamily>(
    value["family"],
    `${path}.family`,
    KATEX_TRANSFORM_FIXTURE_FAMILIES,
    issues
  );
  validateKnownString<KatexTransformFixtureIntent>(
    value["intent"],
    `${path}.intent`,
    KATEX_TRANSFORM_FIXTURE_INTENTS,
    issues
  );
  validateFixtureSide(value["source"], `${path}.source`, issues);
  validateFixtureSide(value["target"], `${path}.target`, issues);
  validateExpectedStructuralTokens(
    value["expectedStructuralTokens"],
    `${path}.expectedStructuralTokens`,
    issues
  );
  validateRoleChanges(value["expectedRoleChanges"], `${path}.expectedRoleChanges`, issues);
  validateNonEmptyString(value["summary"], `${path}.summary`, issues);
}

function validateFixtureSide(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected a fixture side object."
    });
    return;
  }

  validateNonEmptyString(value["latex"], `${path}.latex`, issues);
  validateTokenArray(value["tokens"], `${path}.tokens`, issues);
}

function validateTokenArray(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!Array.isArray(value)) {
    issues.push({
      path,
      message: "Expected a token array."
    });
    return;
  }

  if (value.length === 0) {
    issues.push({
      path,
      message: "Expected at least one token."
    });
    return;
  }

  value.forEach((token, index) =>
    validateToken(token, `${path}[${index}]`, issues)
  );
}

function validateToken(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected a token object."
    });
    return;
  }

  validateNonEmptyString(value["text"], `${path}.text`, issues);
  validateNonEmptyString(value["signature"], `${path}.signature`, issues);
  validateKnownString<KatexTransformFixtureTokenRole>(
    value["role"],
    `${path}.role`,
    KATEX_TRANSFORM_TOKEN_ROLES,
    issues
  );
  validateOptionalKnownString<KatexTransformFixtureLayoutRole>(
    value["layoutRole"],
    `${path}.layoutRole`,
    KATEX_TRANSFORM_LAYOUT_ROLES,
    issues
  );
  validateOptionalString(value["selectorId"], `${path}.selectorId`, issues);
  validateOptionalMatrixPosition(
    value["matrixPosition"],
    `${path}.matrixPosition`,
    issues
  );
  validateInteger(value["row"], `${path}.row`, issues);
  validateInteger(value["column"], `${path}.column`, issues);
}

function validateExpectedStructuralTokens(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected structural token expectations."
    });
    return;
  }

  validateStringArray(value["source"], `${path}.source`, issues);
  validateStringArray(value["target"], `${path}.target`, issues);
}

function validateRoleChanges(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!Array.isArray(value)) {
    issues.push({
      path,
      message: "Expected a role-change array."
    });
    return;
  }

  value.forEach((change, index) => {
    const changePath = `${path}[${index}]`;

    if (!isRecord(change)) {
      issues.push({
        path: changePath,
        message: "Expected a role-change object."
      });
      return;
    }

    validateKnownString<KatexTransformFixtureTokenRole>(
      change["sourceRole"],
      `${changePath}.sourceRole`,
      KATEX_TRANSFORM_TOKEN_ROLES,
      issues
    );
    validateKnownString<KatexTransformFixtureTokenRole>(
      change["targetRole"],
      `${changePath}.targetRole`,
      KATEX_TRANSFORM_TOKEN_ROLES,
      issues
    );
    validateNonEmptyString(change["sourceText"], `${changePath}.sourceText`, issues);
    validateNonEmptyString(change["targetText"], `${changePath}.targetText`, issues);
  });
}

function validateOptionalMatrixPosition(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    issues.push({
      path,
      message: "Expected a matrix position object."
    });
    return;
  }

  validateNonNegativeInteger(value["row"], `${path}.row`, issues);
  validateNonNegativeInteger(value["column"], `${path}.column`, issues);
}

function validateStringArray(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (!Array.isArray(value)) {
    issues.push({
      path,
      message: "Expected a string array."
    });
    return;
  }

  value.forEach((entry, index) =>
    validateNonEmptyString(entry, `${path}[${index}]`, issues)
  );
}

function validateKnownString<T extends string>(
  value: unknown,
  path: string,
  validValues: ReadonlySet<string>,
  issues: TransformFixtureValidationIssue[]
): value is T {
  if (typeof value !== "string" || !validValues.has(value)) {
    issues.push({
      path,
      message: "Expected a known contract value."
    });
    return false;
  }

  return true;
}

function validateOptionalKnownString<T extends string>(
  value: unknown,
  path: string,
  validValues: ReadonlySet<string>,
  issues: TransformFixtureValidationIssue[]
): value is T | undefined {
  if (value === undefined) {
    return true;
  }

  return validateKnownString<T>(value, path, validValues, issues);
}

function validateOptionalString(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): void {
  if (value === undefined) {
    return;
  }

  validateNonEmptyString(value, path, issues);
}

function validateNonEmptyString(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): value is string {
  if (typeof value !== "string" || value.length === 0) {
    issues.push({
      path,
      message: "Expected a non-empty string."
    });
    return false;
  }

  return true;
}

function validateInteger(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): value is number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    issues.push({
      path,
      message: "Expected an integer."
    });
    return false;
  }

  return true;
}

function validateNonNegativeInteger(
  value: unknown,
  path: string,
  issues: TransformFixtureValidationIssue[]
): value is number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    issues.push({
      path,
      message: "Expected a non-negative integer."
    });
    return false;
  }

  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
