import { strict as assert } from "node:assert";
import test from "node:test";

import { tokenizeLatex } from "../src/math/latex-tokenizer.ts";

test("tokenizeLatex reads identifiers, numbers, operators, and equals", () => {
  assert.deepEqual(tokenizeLatex("y = x^2 - 3.5"), [
    { kind: "identifier", value: "y", offset: 0 },
    { kind: "equals", value: "=", offset: 2 },
    { kind: "identifier", value: "x", offset: 4 },
    { kind: "operator", value: "^", offset: 5 },
    { kind: "number", value: "2", offset: 6 },
    { kind: "operator", value: "-", offset: 8 },
    { kind: "number", value: "3.5", offset: 10 },
    { kind: "end", value: "", offset: 13 }
  ]);
});

test("tokenizeLatex reads LaTeX commands and groups", () => {
  assert.deepEqual(tokenizeLatex("z=\\frac{x^2-y^2}{4}+\\sin(t)"), [
    { kind: "identifier", value: "z", offset: 0 },
    { kind: "equals", value: "=", offset: 1 },
    { kind: "command", value: "frac", offset: 2 },
    { kind: "leftBrace", value: "{", offset: 7 },
    { kind: "identifier", value: "x", offset: 8 },
    { kind: "operator", value: "^", offset: 9 },
    { kind: "number", value: "2", offset: 10 },
    { kind: "operator", value: "-", offset: 11 },
    { kind: "identifier", value: "y", offset: 12 },
    { kind: "operator", value: "^", offset: 13 },
    { kind: "number", value: "2", offset: 14 },
    { kind: "rightBrace", value: "}", offset: 15 },
    { kind: "leftBrace", value: "{", offset: 16 },
    { kind: "number", value: "4", offset: 17 },
    { kind: "rightBrace", value: "}", offset: 18 },
    { kind: "operator", value: "+", offset: 19 },
    { kind: "command", value: "sin", offset: 20 },
    { kind: "leftParen", value: "(", offset: 24 },
    { kind: "identifier", value: "t", offset: 25 },
    { kind: "rightParen", value: ")", offset: 26 },
    { kind: "end", value: "", offset: 27 }
  ]);
});

test("tokenizeLatex rejects unknown characters", () => {
  assert.throws(
    () => tokenizeLatex("y = x @ 2"),
    /Unexpected character "@" at offset 6/
  );
});
