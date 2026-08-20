import {
  parseLatexExpression,
  type ParsedLatexBinaryExpression,
  type ParsedLatexExpression
} from "../math/latex-parser.ts";
import { tokenizeLatex } from "../math/latex-tokenizer.ts";

export const KP_POWER_APPLICATION_ENDPOINT_NORMALIZER =
  "normalizer.equation.power-application.v1" as const;

export type KpPowerExponentCombinationKind = "sum" | "difference";

export interface KpNormalizedPowerApplicationEndpoint {
  readonly schemaVersion: "kp.normalized-power-application-endpoint.v1";
  readonly kind: "normalized-power-application-endpoint";
  readonly authority: typeof KP_POWER_APPLICATION_ENDPOINT_NORMALIZER;
  readonly rawLatex: string;
  readonly base: Readonly<{
    role: "shared-base";
    rawLatex: string;
    expression: ParsedLatexExpression;
  }>;
  readonly superscriptRegion: Readonly<{
    role: "superscript-region";
    grouping: "braces" | "parentheses";
    rawLatex: string;
    contentLatex: string;
    expression: ParsedLatexBinaryExpression;
    combination: Readonly<{
      kind: KpPowerExponentCombinationKind;
      operands: readonly [ParsedLatexExpression, ...ParsedLatexExpression[]];
      connectors: readonly Readonly<{
        index: number;
        operator: "+" | "-";
        role: "source-additive-connector" | "source-subtractive-connector";
      }>[];
    }>;
  }>;
}

export type KpPowerApplicationNormalizationResult =
  | Readonly<{
      status: "normalized";
      endpoint: KpNormalizedPowerApplicationEndpoint;
    }>
  | Readonly<{
      status: "unsupported-shape";
      diagnostic: Readonly<{
        code: "power-application.unsupported-shape";
        latex: string;
        message: string;
        repair: string;
      }>;
    }>;

/**
 * This bounded normalizer preserves authored spelling while assigning only
 * the roles needed by exponential homomorphism. It does not interpret an
 * arbitrary superscript or infer an algebraic law from a visible caret.
 */
export function normalizeKpPowerApplicationEndpoint(
  latex: string
): KpPowerApplicationNormalizationResult {
  try {
    const expression = parseLatexExpression(latex);
    if (expression.kind !== "binary" || expression.operator !== "^") {
      return unsupported(latex,
        "Expected one power application at the expression root.");
    }
    const source = splitRootPowerSpelling(latex);
    if (source === undefined) {
      return unsupported(latex,
        "Could not locate one top-level authored superscript region.");
    }
    const grouping = groupedRegion(source.exponentLatex);
    if (grouping === undefined) {
      return unsupported(latex,
        "A combined exponent must be explicitly grouped by braces or parentheses.");
    }
    const exponentExpression = expression.right;
    if (exponentExpression.kind !== "binary") {
      return unsupported(latex,
        "The grouped exponent must be an additive or subtractive combination.");
    }
    const combination = exponentCombination(exponentExpression);
    if (combination === undefined) {
      return unsupported(latex,
        "The grouped exponent must be an additive or subtractive combination.");
    }
    return deepFreeze({
      status: "normalized" as const,
      endpoint: {
        schemaVersion: "kp.normalized-power-application-endpoint.v1" as const,
        kind: "normalized-power-application-endpoint" as const,
        authority: KP_POWER_APPLICATION_ENDPOINT_NORMALIZER,
        rawLatex: latex,
        base: {
          role: "shared-base" as const,
          rawLatex: source.baseLatex,
          expression: expression.left
        },
        superscriptRegion: {
          role: "superscript-region" as const,
          grouping: grouping.kind,
          rawLatex: source.exponentLatex,
          contentLatex: grouping.content,
          expression: exponentExpression,
          combination
        }
      }
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return unsupported(latex, detail);
  }
}

function exponentCombination(
  expression: ParsedLatexExpression
): KpNormalizedPowerApplicationEndpoint["superscriptRegion"]["combination"] |
undefined {
  if (expression.kind !== "binary") return undefined;
  if (expression.operator === "+") {
    const operands = flattenSum(expression);
    return Object.freeze({
      kind: "sum" as const,
      operands: Object.freeze(operands) as
        readonly [ParsedLatexExpression, ...ParsedLatexExpression[]],
      connectors: Object.freeze(operands.slice(1).map((_operand, index) =>
        Object.freeze({
          index,
          operator: "+" as const,
          role: "source-additive-connector" as const
        })
      ))
    });
  }
  if (expression.operator === "-") {
    return Object.freeze({
      kind: "difference" as const,
      operands: Object.freeze([expression.left, expression.right]) as
        readonly [ParsedLatexExpression, ParsedLatexExpression],
      connectors: Object.freeze([Object.freeze({
        index: 0,
        operator: "-" as const,
        role: "source-subtractive-connector" as const
      })])
    });
  }
  return undefined;
}

function flattenSum(
  expression: ParsedLatexExpression
): [ParsedLatexExpression, ParsedLatexExpression, ...ParsedLatexExpression[]] {
  const operands: ParsedLatexExpression[] = [];
  const visit = (value: ParsedLatexExpression): void => {
    if (value.kind === "binary" && value.operator === "+") {
      visit(value.left);
      visit(value.right);
      return;
    }
    operands.push(value);
  };
  visit(expression);
  const first = operands[0];
  const second = operands[1];
  if (first === undefined || second === undefined) {
    throw new Error("Expected an additive exponent combination.");
  }
  return [first, second, ...operands.slice(2)];
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

function groupedRegion(
  value: string
): Readonly<{ kind: "braces" | "parentheses"; content: string }> | undefined {
  if (value.startsWith("{") && value.endsWith("}")) {
    return Object.freeze({ kind: "braces" as const, content: value.slice(1, -1) });
  }
  if (value.startsWith("(") && value.endsWith(")")) {
    return Object.freeze({
      kind: "parentheses" as const,
      content: value.slice(1, -1)
    });
  }
  return undefined;
}

function unsupported(
  latex: string,
  message: string
): Extract<KpPowerApplicationNormalizationResult, {
  status: "unsupported-shape";
}> {
  return deepFreeze({
    status: "unsupported-shape" as const,
    diagnostic: {
      code: "power-application.unsupported-shape" as const,
      latex,
      message,
      repair:
        "Provide one explicitly grouped additive or subtractive exponent before selecting an exponential homomorphism law."
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
