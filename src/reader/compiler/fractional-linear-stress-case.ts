import type { LinearProblemDto } from "../../../protocols/public-api.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";

export interface KpFractionalLinearStressState {
  readonly id:
    | "initial"
    | "after-subtract"
    | "additive-cancelled"
    | "right-simplified"
    | "multiplied"
    | "denominator-cancelled"
    | "solved";
  readonly latex: string;
  readonly html: string;
}

export interface KpCompiledFractionalLinearStressCase {
  readonly kind: "compiled-fractional-linear-stress-case";
  readonly problemId: string;
  readonly states: readonly KpFractionalLinearStressState[];
}

/**
 * This hidden compiler exercises the same seven-state presentation grammar
 * without promoting generated values into the human-reviewed exemplar family.
 */
export function compileKpFractionalLinearStressCase(
  problem: LinearProblemDto
): KpCompiledFractionalLinearStressCase {
  const coefficient = problem.equation.left.coefficient;
  const leftConstant = integer(problem.equation.left.constant, "left constant");
  const rightConstant = integer(problem.equation.right.constant, "right constant");
  const solution = integer(problem.solution, "solution");
  if (coefficient.numerator !== "1") {
    throw new Error("Fractional stress compilation requires a unit-fraction coefficient.");
  }
  const denominator = positiveInteger(coefficient.denominator, "coefficient denominator");
  if (problem.equation.right.coefficient.numerator !== "0") {
    throw new Error("Fractional stress compilation requires zero right-side coefficient.");
  }
  const quotient = rightConstant - leftConstant;
  if (solution !== denominator * quotient) {
    throw new Error("Fractional stress problem has an inconsistent exact solution.");
  }

  const fraction = `\\frac{x}{${denominator}}`;
  const definitions = [
    ["initial", `${fraction} + ${leftConstant} = ${rightConstant}`],
    ["after-subtract", `${fraction} + ${leftConstant} - ${leftConstant} = ${rightConstant} - ${leftConstant}`],
    ["additive-cancelled", `${fraction} = ${rightConstant} - ${leftConstant}`],
    ["right-simplified", `${fraction} = ${quotient}`],
    ["multiplied", `${denominator}\\left(${fraction}\\right) = ${denominator} \\cdot ${quotient}`],
    ["denominator-cancelled", `x = ${denominator} \\cdot ${quotient}`],
    ["solved", `x = ${solution}`]
  ] as const;
  return {
    kind: "compiled-fractional-linear-stress-case",
    problemId: problem.problemId,
    states: definitions.map(([id, latex]) => ({
      id,
      latex,
      html: renderLatexToHtml(latex, { displayMode: true })
    }))
  };
}

function integer(
  value: { readonly numerator: string; readonly denominator: string },
  label: string
): number {
  if (value.denominator !== "1") throw new Error(`${label} must be an integer.`);
  return signedSafeInteger(value.numerator, label);
}

function positiveInteger(value: string, label: string): number {
  const parsed = signedSafeInteger(value, label);
  if (parsed < 1) throw new Error(`${label} must be positive.`);
  return parsed;
}

function signedSafeInteger(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || String(parsed) !== value) {
    throw new Error(`${label} must be a canonical safe integer.`);
  }
  return parsed;
}
