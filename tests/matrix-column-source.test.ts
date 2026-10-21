import assert from "node:assert/strict";
import test from "node:test";
import { compile, check } from "../src/authoring/matrix-columns/compile.ts";
import { read, Repair } from "../src/authoring/matrix-columns/source.ts";
import { example } from "../src/authoring/matrix-columns/example.ts";
import { dependentColumns } from "../content/authoring/linear-algebra/dependent-columns.ts";
import { columnCombinations } from "../src/math/matrix-interpretations.ts";
import { checkAuthorTask } from "../scripts/author-check-owner-dispatch.ts";

test("file source retains accepted semantics, identities and editorial bytes", async () => {
  const source = example(), draft = compile(source);
  for (const key of ["id", "left", "right", "result", "cells"] as const)
    assert.deepEqual(draft.product[key], dependentColumns.product[key]);
  assert.deepEqual(draft.source.reading, dependentColumns.reading);
  assert.deepEqual(draft.result, [[1, 1], [2, 2]]);
  for (const c of [0, 1]) {
    const view = columnCombinations(draft.product).column(c);
    assert.ok(view.cells[0] === draft.product.cell(0, c));
    assert.ok(view.terms[0]!.pairs[0] === draft.product.cell(0, c).dot.pairs[0]);
    assert.ok(draft.product.cell(0, c).dot.pairs[0]!.left === draft.product.left.rows[0]![0]);
  }
  assert.equal(check(JSON.stringify(source)).status, "compiled");
  const report = await checkAuthorTask("matrix.column-combinations", JSON.stringify(source));
  assert.equal(report.status, "checked");
  assert.equal(report.handoff.execution, "not-performed");
});

test("source revisions bind math and prose without retaining mutable caller data", () => {
  const source = example(), draft = compile(source), revision = draft.revision;
  source.left[0]![0] = 9; source.reading.title = "Changed";
  assert.equal(draft.source.left[0][0], 1);
  assert.notEqual(compile(source).revision, revision);
  assert.equal(compile(JSON.parse(JSON.stringify(draft.source))).revision, revision);
  for (const value of [draft.source, draft.source.left, draft.source.left[0], draft.source.reading,
    draft.source.reading.cues, draft.source.reading.cues[0], draft.source.reading.conclusion, draft.source.reading.question, draft.result])
    assert.ok(Object.isFrozen(value));
  const proseOnly = example(); proseOnly.reading.title += " revised";
  assert.notEqual(compile(proseOnly).revision, revision);
  assert.deepEqual(compile(proseOnly).result, draft.result);
});

test("signed, zero and decimal inputs derive both columns through the existing product", () => {
  const source = example(); source.left = [[-2, 3], [4, -1]]; source.right = [[-1, 2], [2, -3]];
  assert.deepEqual(compile(source).result, [[8, -13], [-6, 11]]);
  source.left = [[0, 0], [0, 0]];
  assert.deepEqual(compile(source).result, [[0, 0], [0, 0]]);
  source.left = [[0.5, 0], [0, 0.5]];
  assert.deepEqual(compile(source).result, [[-0.5, 1], [1, -1.5]]);
});

test("unsupported shapes, motion, claimed results and missing cues return located repairs", () => {
  const source = example();
  const cases: readonly [unknown, string][] = [
    [{ ...source, left: [[1, 2, 3], [4, 5, 6]] }, "$.left[0]"],
    [{ ...source, right: [[1, 2]] }, "$.right"],
    [{ ...source, left: [["x", 2], [3, 4]] }, "$.left[0][0]"],
    [{ ...source, right: [[Infinity, 2], [3, 4]] }, "$.right[0][0]"],
    [{ ...source, id: "../outside" }, "$.id"],
    [{ ...source, motion: {} }, "$.motion"],
    [{ ...source, result: [[1, 2], [3, 4]] }, "$.result"],
    [{ ...source, reading: { ...source.reading, cues: [{ initial: "Only one" }, source.reading.cues[1]] } }, "$.reading.cues[0].columns"],
    [{ ...source, reading: { ...source.reading, question: { prompt: " " , answer: "answer" } } }, "$.reading.question.prompt"]
  ];
  for (const [value, path] of cases) assert.throws(() => compile(value), (e: unknown) => e instanceof Repair && e.path === path);
  for (const json of ["{", "[".repeat(65), " ".repeat(100001)]) assert.equal(check(json).status, "repair-gap");
});

test("finite factors cannot create infinite intermediate or result paint", () => {
  const source = example(); source.left = [[1e308, 1e308], [0, 1]];
  source.right = [[2, 0], [0, 1]];
  assert.throws(() => compile(source), (e: unknown) => e instanceof Repair && e.code === "matrix.numeric-range" && e.path === "$.right[0][0]");
  source.right = [[1, 0], [1, 1]];
  assert.throws(() => compile(source), (e: unknown) => e instanceof Repair && e.code === "matrix.numeric-range" && e.path === "$.left[0]");
});

test("scientific notation cannot silently paint an algebraic e in source or derived entries", () => {
  for (const left of [[[1e-7, 0], [0, 1]], [[1e21, 0], [0, 1]], [[1e20, 0], [0, 1]]]) {
    const source = example(); source.left = left; source.right = [[10, 0], [0, 1]];
    assert.throws(() => compile(source), (e: unknown) => e instanceof Repair && e.code === "matrix.numeric-notation");
  }
});

test("direct source calls reject accessors, sparse arrays and hidden fields without invoking them", () => {
  const source = example(); let invoked = false;
  const accessor = { ...source }; Object.defineProperty(accessor, "left", { get() { invoked = true; return source.left; } });
  assert.throws(() => read(accessor), Repair); assert.equal(invoked, false);
  const sparse = example(); delete sparse.left[0]![0];
  assert.throws(() => read(sparse), Repair);
  const hidden = example(); Object.defineProperty(hidden.left[0], "0", { value: 1, enumerable: false });
  assert.throws(() => read(hidden), Repair);
  assert.throws(() => read({ ...source, [Symbol("extra")]: true }), Repair);
});
