import {
  createDefaultLatexRenderer,
  type DefaultLatexObjectRenderer
} from "./default-latex.ts";
import type { MatrixObject } from "../semantic/matrix.ts";

export const matrixLatexRenderer: DefaultLatexObjectRenderer<MatrixObject> = {
  type: "matrix",
  render: matrixToLatex
};

export const defaultLatexRenderer = createDefaultLatexRenderer([
  matrixLatexRenderer
]);

export function matrixToLatex(matrix: MatrixObject): string {
  const body = matrix.rows.map((row) => row.join(" & ")).join(String.raw` \\ `);

  return String.raw`${matrix.label} = \begin{bmatrix}${body}\end{bmatrix}`;
}
