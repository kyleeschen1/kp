import { LatexParseError, parseLatexScalarExpression, type ParsedLatexExpression } from "../math/latex-parser.ts";
import { KpCommonFactorRepair, type KpCommonFactorSource } from "./common-factor-source.ts";
import { createKpStructuredExpression, type KpStructuredExpressionNode } from "../semantic/structured-expression.ts";

export function normalizeKpCommonFactorEndpoints(source: KpCommonFactorSource) {
  const normalize = (index: 0 | 1) => {
    const state = source.states[index], path = `$.states[${index}].latex`;
    let expression: ParsedLatexExpression;
    try { expression = parseLatexScalarExpression(state.latex, source.symbols); }
    catch (error) { throw new KpCommonFactorRepair(error instanceof LatexParseError && error.expected === "declared scalar"
      ? "undeclared-symbol" : error instanceof LatexParseError && error.expected === "unambiguous scalar notation"
        ? "ambiguous-notation" : "unsupported-syntax", path,
      error instanceof Error ? error.message : "Unsupported expression notation."); }
    inspect(expression, source.symbols, path);
    const structured = createKpStructuredExpression({ root: lower(expression, state.id) });
    return Object.freeze({ stateId: state.id, authoredLatex: state.latex, expression, structured });
  };
  return Object.freeze([normalize(0), normalize(1)] as const);
}

function lower(expression: ParsedLatexExpression, id: string): KpStructuredExpressionNode {
  switch (expression.kind) {
    case "identifier": return { id, kind: "symbol", name: expression.name };
    case "number": return { id, kind: "number", value: expression.value };
    case "binary": {
      const children = [lower(expression.left, `${id}.left`), lower(expression.right, `${id}.right`)];
      if (expression.operator === "+") return { id, kind: "sum", terms: children };
      if (expression.operator === "*") return { id, kind: "product", factors: children };
      break;
    }
    case "unary": case "call": break;
  }
  throw new KpCommonFactorRepair("unsupported-syntax", "$.states", "Only inspected scalar sums and products can lower to structured endpoints.");
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
