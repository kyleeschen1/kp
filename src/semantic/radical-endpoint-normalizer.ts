import {
  parseLatexExpression,
  type ParsedLatexExpression
} from "../math/latex-parser.ts";
import { tokenizeLatex } from "../math/latex-tokenizer.ts";

export const KP_RADICAL_ENDPOINT_NORMALIZER =
  "normalizer.equation.radical.v1" as const;

export type KpRadicalIndexClassification =
  | "even-integer"
  | "odd-integer"
  | "symbolic"
  | "compound";

interface KpRadicalInversionNormalizationBoundary {
  readonly equationRelationRequired: true;
  readonly solutionBranches: "not-inferred";
  readonly domainConditions: "not-inferred";
}

export interface KpNormalizedPowerRootEndpoint {
  readonly schemaVersion: "kp.normalized-radical-endpoint.v1";
  readonly kind: "normalized-radical-endpoint";
  readonly authority: typeof KP_RADICAL_ENDPOINT_NORMALIZER;
  readonly notation: "power";
  readonly rawLatex: string;
  readonly base: Readonly<{
    role: "power-base";
    rawLatex: string;
    grouping: "braces" | "parentheses" | "none";
    expression: ParsedLatexExpression;
  }>;
  readonly exponent: Readonly<{
    role: "power-exponent";
    rawLatex: string;
    contentLatex: string;
    grouping: "braces" | "parentheses" | "none";
    expression: ParsedLatexExpression;
    classification: KpRadicalIndexClassification;
  }>;
  readonly inversionBoundary: KpRadicalInversionNormalizationBoundary;
}

export interface KpNormalizedRadicalRootEndpoint {
  readonly schemaVersion: "kp.normalized-radical-endpoint.v1";
  readonly kind: "normalized-radical-endpoint";
  readonly authority: typeof KP_RADICAL_ENDPOINT_NORMALIZER;
  readonly notation: "radical";
  readonly rawLatex: string;
  readonly radicalOperator: Readonly<{
    role: "radical-operator";
    rawLatex: "\\sqrt";
  }>;
  readonly index: Readonly<{
    role: "root-index";
    provenance: "implicit-square" | "explicit";
    rawLatex: string;
    contentLatex: string;
    expression: ParsedLatexExpression;
    classification: KpRadicalIndexClassification;
  }>;
  readonly radicand: Readonly<{
    role: "radicand";
    rawLatex: string;
    contentLatex: string;
    grouping: "braces";
    expression: ParsedLatexExpression;
    nestedRadical: boolean;
  }>;
  readonly inversionBoundary: KpRadicalInversionNormalizationBoundary;
}

export type KpNormalizedRadicalEndpoint =
  | KpNormalizedPowerRootEndpoint
  | KpNormalizedRadicalRootEndpoint;

export type KpRadicalEndpointNormalizationResult =
  | Readonly<{
      status: "normalized";
      endpoint: KpNormalizedRadicalEndpoint;
    }>
  | Readonly<{
      status: "unsupported-shape";
      diagnostic: Readonly<{
        code:
          | "radical-endpoint.unsupported-shape"
          | "radical-endpoint.malformed-grouping";
        latex: string;
        message: string;
        repair: string;
      }>;
    }>;

const inversionBoundary = Object.freeze({
  equationRelationRequired: true as const,
  solutionBranches: "not-inferred" as const,
  domainConditions: "not-inferred" as const
});

/**
 * This normalizer exposes notation roles and authored spelling only. It cannot
 * turn an expression into an equation solution or infer ±, principal-value,
 * or domain policy; those require the semantic operation in the next layer.
 */
export function normalizeKpRadicalEndpoint(
  latex: string
): KpRadicalEndpointNormalizationResult {
  const source = latex.trim();
  if (source.length === 0) return unsupported(latex, "Expected an expression.");
  try {
    return source.startsWith("\\sqrt")
      ? normalizeRadical(source)
      : normalizePower(source);
  } catch (error) {
    return unsupported(
      latex,
      error instanceof Error ? error.message : String(error),
      "radical-endpoint.malformed-grouping"
    );
  }
}

function normalizePower(latex: string): KpRadicalEndpointNormalizationResult {
  const expression = parseLatexExpression(latex);
  if (expression.kind !== "binary" || expression.operator !== "^") {
    return unsupported(latex, "Expected a power or radical application.");
  }
  const spelling = splitRootPowerSpelling(latex);
  if (spelling === undefined) {
    return unsupported(latex, "Expected exactly one top-level power operator.");
  }
  const baseRegion = unwrapGroup(spelling.baseLatex);
  const exponentRegion = unwrapGroup(spelling.exponentLatex);
  return normalized({
    schemaVersion: "kp.normalized-radical-endpoint.v1",
    kind: "normalized-radical-endpoint",
    authority: KP_RADICAL_ENDPOINT_NORMALIZER,
    notation: "power",
    rawLatex: latex,
    base: {
      role: "power-base",
      rawLatex: spelling.baseLatex,
      grouping: baseRegion.grouping,
      expression: expression.left
    },
    exponent: {
      role: "power-exponent",
      rawLatex: spelling.exponentLatex,
      contentLatex: exponentRegion.content,
      grouping: exponentRegion.grouping,
      expression: expression.right,
      classification: classifyIndex(expression.right)
    },
    inversionBoundary
  });
}

function normalizeRadical(latex: string): KpRadicalEndpointNormalizationResult {
  const spelling = splitRadicalSpelling(latex);
  if (spelling === undefined) {
    return unsupported(
      latex,
      "Expected \\sqrt with an optional bracketed index and one braced radicand.",
      "radical-endpoint.malformed-grouping"
    );
  }
  const indexLatex = spelling.indexContent ?? "2";
  const indexExpression = parseLatexExpression(indexLatex);
  const radicandExpression = parseLatexExpression(spelling.radicandContent);
  return normalized({
    schemaVersion: "kp.normalized-radical-endpoint.v1",
    kind: "normalized-radical-endpoint",
    authority: KP_RADICAL_ENDPOINT_NORMALIZER,
    notation: "radical",
    rawLatex: latex,
    radicalOperator: {
      role: "radical-operator",
      rawLatex: "\\sqrt"
    },
    index: {
      role: "root-index",
      provenance: spelling.indexContent === undefined
        ? "implicit-square"
        : "explicit",
      rawLatex: spelling.indexRaw ?? "",
      contentLatex: indexLatex,
      expression: indexExpression,
      classification: classifyIndex(indexExpression)
    },
    radicand: {
      role: "radicand",
      rawLatex: spelling.radicandRaw,
      contentLatex: spelling.radicandContent,
      grouping: "braces",
      expression: radicandExpression,
      nestedRadical: containsRootCall(radicandExpression)
    },
    inversionBoundary
  });
}

function splitRadicalSpelling(latex: string): Readonly<{
  indexRaw?: string | undefined;
  indexContent?: string | undefined;
  radicandRaw: string;
  radicandContent: string;
}> | undefined {
  let offset = "\\sqrt".length;
  while (/\s/u.test(latex[offset] ?? "")) offset += 1;
  let indexRaw: string | undefined;
  let indexContent: string | undefined;
  if (latex[offset] === "[") {
    const close = findMatching(latex, offset, "[", "]");
    if (close === undefined) return undefined;
    indexRaw = latex.slice(offset, close + 1);
    indexContent = latex.slice(offset + 1, close).trim();
    if (indexContent.length === 0) return undefined;
    offset = close + 1;
    while (/\s/u.test(latex[offset] ?? "")) offset += 1;
  }
  if (latex[offset] !== "{") return undefined;
  const close = findMatching(latex, offset, "{", "}");
  if (close === undefined || latex.slice(close + 1).trim().length > 0) {
    return undefined;
  }
  const radicandContent = latex.slice(offset + 1, close).trim();
  if (radicandContent.length === 0) return undefined;
  return Object.freeze({
    ...(indexRaw === undefined ? {} : { indexRaw, indexContent }),
    radicandRaw: latex.slice(offset, close + 1),
    radicandContent
  });
}

function splitRootPowerSpelling(
  latex: string
): Readonly<{ baseLatex: string; exponentLatex: string }> | undefined {
  const tokens = tokenizeLatex(latex);
  let depth = 0;
  let caretOffset: number | undefined;
  for (const token of tokens) {
    if (token.kind === "leftBrace" || token.kind === "leftParen") depth += 1;
    if (token.kind === "rightBrace" || token.kind === "rightParen") depth -= 1;
    if (token.kind === "operator" && token.value === "^" && depth === 0) {
      if (caretOffset !== undefined) return undefined;
      caretOffset = token.offset;
    }
  }
  if (caretOffset === undefined) return undefined;
  const baseLatex = latex.slice(0, caretOffset).trim();
  const exponentLatex = latex.slice(caretOffset + 1).trim();
  return baseLatex.length > 0 && exponentLatex.length > 0
    ? Object.freeze({ baseLatex, exponentLatex })
    : undefined;
}

function unwrapGroup(value: string): Readonly<{
  grouping: "braces" | "parentheses" | "none";
  content: string;
}> {
  if (value.startsWith("{") && value.endsWith("}")) {
    return Object.freeze({
      grouping: "braces" as const,
      content: value.slice(1, -1)
    });
  }
  if (value.startsWith("(") && value.endsWith(")")) {
    return Object.freeze({
      grouping: "parentheses" as const,
      content: value.slice(1, -1)
    });
  }
  return Object.freeze({ grouping: "none" as const, content: value });
}

function classifyIndex(
  expression: ParsedLatexExpression
): KpRadicalIndexClassification {
  if (expression.kind === "number" && Number.isInteger(expression.value)) {
    return Math.abs(expression.value) % 2 === 0
      ? "even-integer"
      : "odd-integer";
  }
  if (expression.kind === "identifier") return "symbolic";
  return "compound";
}

function containsRootCall(expression: ParsedLatexExpression): boolean {
  if (expression.kind === "call") {
    return expression.name === "sqrt" || containsRootCall(expression.argument);
  }
  if (expression.kind === "binary") {
    return containsRootCall(expression.left) || containsRootCall(expression.right);
  }
  if (expression.kind === "unary") return containsRootCall(expression.value);
  return false;
}

function findMatching(
  source: string,
  offset: number,
  open: "[" | "{",
  close: "]" | "}"
): number | undefined {
  let depth = 0;
  for (let index = offset; index < source.length; index += 1) {
    if (source[index] === open) depth += 1;
    if (source[index] === close) depth -= 1;
    if (depth === 0) return index;
  }
  return undefined;
}

function normalized(
  endpoint: KpNormalizedRadicalEndpoint
): KpRadicalEndpointNormalizationResult {
  return deepFreeze({ status: "normalized" as const, endpoint });
}

function unsupported(
  latex: string,
  message: string,
  code: "radical-endpoint.unsupported-shape" |
    "radical-endpoint.malformed-grouping" =
      "radical-endpoint.unsupported-shape"
): KpRadicalEndpointNormalizationResult {
  return deepFreeze({
    status: "unsupported-shape" as const,
    diagnostic: {
      code,
      latex,
      message,
      repair:
        "Provide one explicit power or \\sqrt expression; branch and domain decisions belong to a later equation operation."
    }
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
