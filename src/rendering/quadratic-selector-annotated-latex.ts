import type { KpQuadraticKatexState } from "../projections/quadratic-completing-square-katex.ts";
import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "./selector-annotated-latex.ts";

export function createKpQuadraticSelectorAnnotatedLatex(
  state: KpQuadraticKatexState
): KpSelectorAnnotatedLatex {
  const segments = segmentsFor(state.id);
  const annotated = createKpSelectorAnnotatedLatex({
    id: state.id,
    expectedSelectorIds: state.selectors.map(({ role }) => role),
    segments
  });
  if (annotated.rawLatex !== state.latex) {
    throw new Error(
      `Quadratic KaTeX annotation ${state.id} changed its native equation.`
    );
  }
  return annotated;
}

function segmentsFor(
  stateId: string
): readonly KpSelectorAnnotatedLatexSegment[] {
  switch (stateId) {
    case "katex.quadratic.completing-square.standard":
      return [
        selector("quadratic", "x^2"),
        selector("linear", " - 5x"),
        selector("constant", " + 6"),
        selector("equals", " = "),
        selector("right", "0")
      ];
    case "katex.quadratic.completing-square.balanced":
      return [
        selector("quadratic", "x^2"),
        selector("linear", " - 5x"),
        selector("equals", " = "),
        selector("right", "-6")
      ];
    case "katex.quadratic.completing-square.completed":
      return [
        selector("quadratic", "x^2"),
        selector("linear", " - 5x"),
        selector("completion", " + \\frac{25}{4}"),
        selector("equals", " = "),
        selector("right", "\\frac{1}{4}")
      ];
    case "katex.quadratic.completing-square.added-both-sides":
      return [
        selector("quadratic", "x^2"),
        selector("linear", " - 5x"),
        selector("completion", " + \\frac{25}{4}"),
        selector("equals", " = "),
        selector("right-base", "-6"),
        selector("right-addend", " + \\frac{25}{4}")
      ];
    case "katex.quadratic.completing-square.common-denominator":
      return [
        selector("quadratic", "x^2"),
        selector("linear", " - 5x"),
        selector("completion", " + \\frac{25}{4}"),
        selector("equals", " = "),
        selector("right-base", "-\\frac{24}{4}"),
        selector("right-addend", " + \\frac{25}{4}")
      ];
    case "katex.quadratic.completing-square.perfect":
      return [
        latex("\\left("),
        selector("binomial-x", "x"),
        selector("binomial-offset", " - \\frac{5}{2}"),
        latex("\\right)"),
        selector("exponent", "^2"),
        selector("equals", " = "),
        selector("right", "\\frac{1}{4}")
      ];
    case "katex.quadratic.completing-square.factor-pattern":
      return [
        selector("quadratic", "x^2"),
        selector("product", " - 2(x)\\left(\\frac{5}{2}\\right)"),
        selector("square", " + \\left(\\frac{5}{2}\\right)^2"),
        selector("equals", " = "),
        selector("right", "\\frac{1}{4}")
      ];
    case "katex.quadratic.completing-square.square-root-applied":
      return [
        selector("left-x", "x"),
        selector("left-offset", " - \\frac{5}{2}"),
        selector("equals", " = "),
        selector("plus-minus", "\\pm"),
        selector("radical", "\\sqrt{\\frac{1}{4}}")
      ];
    case "katex.quadratic.completing-square.square-root-evaluated":
      return [
        selector("left-x", "x"),
        selector("left-offset", " - \\frac{5}{2}"),
        selector("equals", " = "),
        selector("plus-minus", "\\pm"),
        selector("right", "\\frac{1}{2}")
      ];
    case "katex.quadratic.completing-square.isolated":
      return [
        selector("variable", "x"),
        selector("equals", " = "),
        selector("center", "\\frac{5}{2}"),
        latex(" "),
        selector("plus-minus", "\\pm"),
        latex(" "),
        selector("offset", "\\frac{1}{2}")
      ];
    case "katex.quadratic.completing-square.candidates":
      return [
        selector("variable", "x"),
        selector("equals", " = "),
        latex("\\frac{"),
        selector("center", "5"),
        latex(" "),
        selector("plus-minus", "\\pm"),
        latex(" "),
        selector("offset", "1"),
        latex("}{"),
        selector("denominator", "2"),
        latex("}")
      ];
    case "katex.quadratic.formula.general":
      return fractionState({
        base: "-b",
        radicalRole: "radical",
        radical: "\\sqrt{b^2-4ac}",
        denominator: "2a"
      });
    case "katex.quadratic.formula.substituted":
      return fractionState({
        base: "5",
        radicalRole: "radical",
        radical: "\\sqrt{(-5)^2-4(1)(6)}",
        denominator: "2(1)"
      });
    case "katex.quadratic.formula.discriminant":
      return fractionState({
        base: "5",
        radicalRole: "radical",
        radical: "\\sqrt{1}",
        denominator: "2"
      });
    case "katex.quadratic.formula.simplified":
      return fractionState({
        base: "5",
        radicalRole: "offset",
        radical: "1",
        denominator: "2"
      });
    case "katex.quadratic.formula.roots":
      return [
        latex("\\displaystyle "),
        selector("variable", "x"),
        latex(" \\in \\{"),
        selector("root-two", "2"),
        latex(","),
        selector("root-three", "3"),
        latex("\\}")
      ];
    default:
      throw new Error(`Unknown quadratic KaTeX state ${stateId}.`);
  }
}

function fractionState(input: {
  readonly base: string;
  readonly radicalRole: "radical" | "offset";
  readonly radical: string;
  readonly denominator: string;
}): readonly KpSelectorAnnotatedLatexSegment[] {
  return [
    latex("\\displaystyle "),
    selector("variable", "x"),
    latex(" = \\frac{"),
    selector("base", input.base),
    latex(" "),
    selector("plus-minus", "\\pm"),
    latex(" "),
    selector(input.radicalRole, input.radical),
    latex("}{"),
    selector("denominator", input.denominator),
    latex("}")
  ];
}

function selector(
  selectorId: string,
  value: string
): KpSelectorAnnotatedLatexSegment {
  return { kind: "selector", selectorId, latex: value };
}

function latex(value: string): KpSelectorAnnotatedLatexSegment {
  return { kind: "latex", latex: value };
}
