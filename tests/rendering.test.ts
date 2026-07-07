import { strict as assert } from "node:assert";
import test from "node:test";

import { createDefaultLatexRenderer } from "../src/rendering/default-latex.ts";
import {
  defaultLatexRenderer,
  matrixToLatex
} from "../src/rendering/matrix-latex.ts";
import type { KpSemanticObject } from "../src/semantic/document.ts";
import { createMatrixObject, identityMatrix } from "../src/semantic/matrix.ts";

test("default LaTeX renderer dispatches by semantic object type", () => {
  const renderer = createDefaultLatexRenderer([
    {
      type: "matrix",
      render: (object) => object.label
    }
  ]);
  const matrix = createMatrixObject({
    id: "A",
    label: "A",
    rows: [[1]]
  });

  assert.equal(renderer.render(matrix), "A");
});

test("default LaTeX renderer rejects unsupported semantic object types", () => {
  const renderer = createDefaultLatexRenderer([]);

  assert.throws(
    () =>
      renderer.render({
        id: "x",
        type: "unknown"
      } as unknown as KpSemanticObject),
    /No default LaTeX renderer registered for unknown/
  );
});

test("matrixToLatex renders a matrix with a default bmatrix representation", () => {
  const matrix = identityMatrix({
    id: "identity-3x3",
    label: "I_3",
    size: 3
  });

  assert.equal(
    matrixToLatex(matrix),
    String.raw`I_3 = \begin{bmatrix}1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1\end{bmatrix}`
  );
  assert.equal(defaultLatexRenderer.render(matrix), matrixToLatex(matrix));
});
