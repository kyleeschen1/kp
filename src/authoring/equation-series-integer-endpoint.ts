import type { ParsedLatexExpression } from "../math/latex-parser.ts";

export function matchesInteger(
  expression: ParsedLatexExpression,
  expected: bigint
): boolean {
  // The parser keeps a written minus as unary syntax, not part of the number.
  // Match that literal form without evaluating arbitrary endpoint expressions.
  const value = expression.kind === "unary" ? expression.value : expression;
  const sign = expression.kind === "unary" ? -1n : 1n;
  return value.kind === "number" && Number.isSafeInteger(value.value) &&
    sign * BigInt(value.value) === expected;
}
