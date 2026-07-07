import { strict as assert } from "node:assert";
import test from "node:test";

import { createDefaultLatexRenderer } from "../src/rendering/default-latex.ts";
import type { KpSemanticObject } from "../src/semantic/document.ts";
import { createMatrixObject } from "../src/semantic/matrix.ts";

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
