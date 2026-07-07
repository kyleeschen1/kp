import { strict as assert } from "node:assert";
import test from "node:test";

import { createKpDocument } from "../src/semantic/document.ts";
import type { KpDocument } from "../src/semantic/document.ts";
import { createMatrixObject, identityMatrix } from "../src/semantic/matrix.ts";
import { validateKpDocument } from "../src/semantic/validation.ts";

test("createKpDocument creates a JSON-compatible semantic document", () => {
  const document = createKpDocument({
    id: "lesson-identity",
    title: "Identity matrix"
  });

  assert.deepEqual(document, {
    id: "lesson-identity",
    title: "Identity matrix",
    version: 1,
    objects: []
  });
  assert.equal(JSON.parse(JSON.stringify(document)).id, "lesson-identity");
});

test("createMatrixObject creates a semantic matrix object", () => {
  const matrix = createMatrixObject({
    id: "A",
    label: "A",
    rows: [
      [1, 2],
      [3, 4]
    ]
  });

  assert.deepEqual(matrix, {
    id: "A",
    type: "matrix",
    label: "A",
    rows: [
      [1, 2],
      [3, 4]
    ]
  });
});

test("identityMatrix creates a square identity matrix object", () => {
  const matrix = identityMatrix({
    id: "identity-3x3",
    label: "I_3",
    size: 3
  });

  assert.deepEqual(matrix, {
    id: "identity-3x3",
    type: "matrix",
    label: "I_3",
    rows: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ]
  });
});

test("createMatrixObject rejects ragged matrices", () => {
  assert.throws(
    () =>
      createMatrixObject({
        id: "bad",
        label: "B",
        rows: [[1], [2, 3]]
      }),
    /Matrix bad must be rectangular/
  );
});

test("identityMatrix rejects non-positive sizes", () => {
  assert.throws(
    () =>
      identityMatrix({
        id: "bad-identity",
        label: "I_0",
        size: 0
      }),
    /Identity matrix bad-identity size must be a positive integer/
  );
});

test("validateKpDocument reports matrix shape issues", () => {
  const document = {
    id: "bad-document",
    title: "Bad document",
    version: 1,
    objects: [
      {
        id: "bad",
        type: "matrix",
        label: "B",
        rows: [[1], [2, 3]]
      }
    ]
  } as unknown as KpDocument;

  assert.deepEqual(validateKpDocument(document), [
    {
      path: "objects[0].rows",
      message: "Matrix bad must be rectangular."
    }
  ]);
});
