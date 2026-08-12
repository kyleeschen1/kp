import assert from "node:assert/strict";
import test from "node:test";

import {
  collectKpSchemeSourceExpressions,
  KP_SCHEME_FACTORIAL_SOURCE
} from "../src/semantic/scheme-factorial-source-model.ts";
import {
  KP_SCHEME_FACTORIAL_DOCUMENT_ID,
  parseKpSchemeFactorialSource
} from "../src/semantic/scheme-factorial-parser.ts";

test("parses the canonical factorial program into exact source material", () => {
  const document = parseKpSchemeFactorialSource();
  const expressions = collectKpSchemeSourceExpressions(document);
  assert.equal(document.sourceText, KP_SCHEME_FACTORIAL_SOURCE);
  assert.equal(document.forms.length, 2);
  assert.equal(expressions.length, 24);
  assert.ok(expressions.every((expression) =>
    document.sourceText.slice(expression.source.start, expression.source.end)
      .trim().length > 0
  ));
});

test("classifies only syntax while retaining every distinct occurrence", () => {
  const document = parseKpSchemeFactorialSource();
  const expressions = collectKpSchemeSourceExpressions(document);
  const lists = expressions.filter((expression) => expression.kind === "list");
  const ns = expressions.filter((expression) =>
    expression.kind === "atom" && expression.lexeme === "n"
  );
  assert.deepEqual(lists.map(({ role }) => role), [
    "definition",
    "procedure-signature",
    "conditional",
    "application",
    "application",
    "application",
    "application",
    "application"
  ]);
  assert.equal(ns.length, 4);
  assert.equal(new Set(ns.map(({ id }) => id)).size, 4);
  assert.ok(ns.every(({ role }) => role === "identifier"));
});

test("keeps address identity stable when whitespace changes spans", () => {
  const compact = parseKpSchemeFactorialSource(
    "(define (factorial n) (if (= n 0) 1 (* n (factorial (- n 1))))) (factorial 3)"
  );
  const canonical = parseKpSchemeFactorialSource();
  const compactExpressions = collectKpSchemeSourceExpressions(compact);
  const canonicalExpressions = collectKpSchemeSourceExpressions(canonical);
  assert.deepEqual(
    compactExpressions.map(({ id }) => id),
    canonicalExpressions.map(({ id }) => id)
  );
  assert.notDeepEqual(
    compactExpressions.map(({ source }) => source),
    canonicalExpressions.map(({ source }) => source)
  );
  assert.ok(compactExpressions.every(({ id }) =>
    id.startsWith(`${KP_SCHEME_FACTORIAL_DOCUMENT_ID}.occurrence.`)
  ));
});

test("rejects malformed or expanded Scheme syntax with a source position", () => {
  for (const source of [
    "(define (factorial n) (if (= n 0) 1 (* n (factorial (- n 1)))))",
    "(define (factorial n) (if (= n 0) 1 (* n (factorial (- n 1))))) (factorial 3",
    "(define (factorial n) (if (= n 0) 1 (* n (factorial (+ n 1))))) (factorial 3)",
    "(define (factorial n) (if (= n 0) 1 (* n (factorial (- n 1))))) '(factorial 3)",
    "(define (factorial n) (if (= n 0) 1 (* n (factorial (- n 1))))) (factorial 3) ; comment"
  ]) {
    assert.throws(() => parseKpSchemeFactorialSource(source),
      /Scheme factorial/);
  }
});

test("rejects semantically different shapes even when tokens are supported", () => {
  assert.throws(() => parseKpSchemeFactorialSource(
    "(define (factorial n) (if (= n 0) 1 (* n (factorial (- n 1))))) (factorial 1)"
  ), /initial call has an unsupported shape/);
  assert.throws(() => parseKpSchemeFactorialSource(
    "(define (factorial n) (if (= n 0) 3 (* n (factorial (- n 1))))) (factorial 3)"
  ), /conditional has an unsupported shape/);
});
