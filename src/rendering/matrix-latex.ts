import {
  createDefaultLatexRenderer,
  type DefaultLatexObjectRenderer
} from "./default-latex.ts";
import {
  expressionObjectToLatex,
  type ExpressionObject
} from "../semantic/expression-object.ts";
import {
  latexFormObjectToLatex,
  type LatexFormObject
} from "../semantic/latex-form.ts";
import {
  matrixObjectToLatex,
  type MatrixObject
} from "../semantic/matrix.ts";

export const expressionLatexRenderer:
  DefaultLatexObjectRenderer<ExpressionObject> = {
    type: "expression",
    render: expressionObjectToLatex
  };

export const matrixLatexRenderer: DefaultLatexObjectRenderer<MatrixObject> = {
  type: "matrix",
  render: matrixToLatex
};

export const latexFormRenderer: DefaultLatexObjectRenderer<LatexFormObject> = {
  type: "latex-form",
  render: latexFormToLatex
};

export const defaultLatexRenderer = createDefaultLatexRenderer([
  expressionLatexRenderer,
  latexFormRenderer,
  matrixLatexRenderer
]);

export function latexFormToLatex(formula: LatexFormObject): string {
  return latexFormObjectToLatex(formula);
}

export function matrixToLatex(matrix: MatrixObject): string {
  return matrixObjectToLatex(matrix);
}
