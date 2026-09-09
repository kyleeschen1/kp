import { parseLatexExpression, type ParsedLatexExpression } from "../math/latex-parser.ts";
import { KpCommonFactorRepair, type KpCommonFactorSource } from "./common-factor-source.ts";

export function normalizeKpCommonFactorEndpoints(source: KpCommonFactorSource) {
  const normalize = (index: 0 | 1) => {
    const state = source.states[index], path = `$.states[${index}].latex`;
    let expression: ParsedLatexExpression;
    try { expression = parseLatexExpression(state.latex); }
    catch (error) { throw new KpCommonFactorRepair("unsupported-syntax", path,
      error instanceof Error ? error.message : "Unsupported expression notation."); }
    inspect(expression, source.symbols, path);
    return Object.freeze({ stateId: state.id, authoredLatex: state.latex, expression });
  };
  return Object.freeze([normalize(0), normalize(1)] as const);
}

function inspect(expression: ParsedLatexExpression, symbols: readonly string[], path: string): void {
  switch (expression.kind) {
    case "identifier":
      if (!symbols.includes(expression.name)) throw new KpCommonFactorRepair("undeclared-symbol", path, `Declare scalar ${expression.name} explicitly.`);
      return;
    case "number":
      if (!Number.isSafeInteger(expression.value) || expression.value < 0)
        throw new KpCommonFactorRepair("unsupported-syntax", path, "Use nonnegative safe integer coefficients in this bounded task.");
      return;
    case "binary":
      if (expression.operator !== "+" && expression.operator !== "*") break;
      inspect(expression.left, symbols, path); inspect(expression.right, symbols, path); return;
    case "unary": case "call": break;
  }
  throw new KpCommonFactorRepair("unsupported-syntax", path, "This task supports scalar products and sums, not functions or other operations.");
}
