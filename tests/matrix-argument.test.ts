import assert from "node:assert/strict";
import test from "node:test";
import * as M from "../src/math/authoring/matrices.ts";
import { recoveringInput } from "../content/authoring/linear-algebra/recovering-input.ts";
import { comparison as lost } from "../content/authoring/linear-algebra/dependent-columns-comparison.ts";
import { comparison as distinguished } from "../content/authoring/linear-algebra/distinguished-inputs-comparison.ts";
import { ArgumentGap, defineArgument, inspections, math, text } from "../src/experiments/matrix-column-combinations/argument.ts";
import { renderLatexToHtml } from "../src/rendering/katex-adapter.ts";

test("the connected argument refers to the accepted semantic sources, without copied animation plans", () => {
  const [columns, cancellation, contrast] = inspections(recoveringInput);
  assert.equal(columns?.kind, "columns"); assert.equal(cancellation?.kind, "comparison"); assert.equal(contrast?.kind, "comparison");
  if (columns?.kind !== "columns" || cancellation?.kind !== "comparison" || contrast?.kind !== "comparison") throw new Error("Missing inspection sources");
  assert.equal(columns.scene.env.product, lost.relation.product);
  assert.equal(columns.scene.env.A, lost.relation.image.left);
  assert.equal(cancellation.source, lost); assert.equal(contrast.source, distinguished);
  assert.ok(Object.isFrozen(recoveringInput));
  for (const section of recoveringInput.sections) {
    assert.ok(Object.isFrozen(section.blocks));
    for (const block of section.blocks) {
      assert.ok(Object.isFrozen(block));
      if (block.kind === "math") assert.match(renderLatexToHtml(block.latex, { output: "htmlAndMathml" }), /<math/);
    }
  }
});

test("the retained-weight claim and complete solution family agree with the matrix authority", () => {
  const apply = (x: number, y: number) => M.evaluate(M.product({ id: "argument.check",
    left: lost.relation.product.left, right: M.matrix("argument.input", [[x], [y]]) }).result, {});
  // These cases pressure the authored algebra; sampling is not a proof for all
  // real inputs. The main reading supplies the distributive argument itself.
  for (let x = -4; x <= 4; x += .5) for (let y = -4; y <= 4; y += .5) {
    assert.deepEqual(apply(x, y), [[x + 2 * y], [2 * (x + 2 * y)]]);
    assert.deepEqual(apply(x + 2, y - 1), apply(x, y));
  }
  for (let t = -10; t <= 10; t += .25) assert.deepEqual(apply(1 - 2 * t, t), [[1], [2]]);
  assert.deepEqual(apply(7, -3), [[1], [2]]); assert.deepEqual(apply(7, -2), [[3], [6]]);
  assert.deepEqual(M.evaluate(distinguished.relation.image.result, {}), [[0], [-1]]);
});

test("composition permits different prose lengths and positions without inventing new motion", () => {
  const source = defineArgument({ ...recoveringInput, sections: [{ id: "short-reading", title: "A question",
    blocks: [text("An explanation before an equation."), math("x+2y=1"), text("A connecting reason after it.")] }] });
  assert.equal(inspections(source).length, 0);
  assert.equal(source.sections[0]!.blocks.length, 3);
  assert.throws(() => defineArgument({ ...source, sections: [...source.sections, ...source.sections] }), ArgumentGap);
  assert.throws(() => defineArgument({ ...source, title: " " }), ArgumentGap);
  assert.throws(() => defineArgument({ ...source, sections: [] }), ArgumentGap);
  assert.throws(() => defineArgument({ ...source, sections: [{ id: "invalid", title: "Broken", blocks: [
    // @ts-expect-error An unsupported medium cannot silently fall back to a fade.
    { kind: "arbitrary-animation", latex: "x=1" }
  ] }] }), ArgumentGap);
  const block = recoveringInput.sections[0]!.blocks.find(block => block.kind === "inspect")!;
  assert.throws(() => defineArgument({ ...source, sections: [{ id: "duplicate", title: "Duplicate", blocks: [block, block] }] }), ArgumentGap);
});
