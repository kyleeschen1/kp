import { test } from "node:test";
import assert from "node:assert/strict";
import { documentReadingAttention } from "../src/reader/app/document-theater-attention.ts";

test("annotation has a single reading owner through arrival, departure and reversal", () => {
  const states = [undefined, 'state.example', undefined];
  const frames = [new Map([[0, 1], [1, .5]]), new Map([[0, 1], [1, 1]]), new Map([[1, 1]]), new Map([[1, 1], [2, .01]])];
  for (const index of [0, 1, 2, 3, 2, 1, 0]) {
    const result = documentReadingAttention({ states, opacity: frames[index]!, readingDocument: false, hasSelection: false });
    assert.equal(result.kind, index === 1 || index === 2 ? 'annotation' : 'prose');
  }
  for (const flags of [{ readingDocument: true, hasSelection: false }, { readingDocument: false, hasSelection: true }])
    assert.equal(documentReadingAttention({ states, opacity: frames[2]!, ...flags }).kind, 'prose');
});
