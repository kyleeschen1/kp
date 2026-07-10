import {
  createDefaultLatexRenderer,
  type DefaultLatexObjectRenderer
} from "./default-latex.ts";
import type { LatexFormObject } from "../semantic/latex-form.ts";
import type { MatrixObject } from "../semantic/matrix.ts";

export const matrixLatexRenderer: DefaultLatexObjectRenderer<MatrixObject> = {
  type: "matrix",
  render: matrixToLatex
};

export const latexFormRenderer: DefaultLatexObjectRenderer<LatexFormObject> = {
  type: "latex-form",
  render: latexFormToLatex
};

export const defaultLatexRenderer = createDefaultLatexRenderer([
  latexFormRenderer,
  matrixLatexRenderer
]);

export function latexFormToLatex(formula: LatexFormObject): string {
  return formula.latex;
}

export function matrixToLatex(matrix: MatrixObject): string {
  const body = matrix.rows.map((row) => row.join(" & ")).join(String.raw` \\ `);

  return String.raw`${matrix.label} = \begin{bmatrix}${body}\end{bmatrix}`;
}
