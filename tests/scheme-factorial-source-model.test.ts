import assert from "node:assert/strict";
import test from "node:test";

import {
  collectKpSchemeSourceExpressions,
  defineKpSchemeSourceDocument,
  kpSchemeSourceDelimiterId,
  kpSchemeSourceOccurrenceId,
  KP_SCHEME_FACTORIAL_SOURCE,
  validateKpSchemeSourceDocument,
  type KpSchemeSourceDocument,
  type KpSchemeSourceList
} from "../src/semantic/scheme-factorial-source-model.ts";

const documentId = "scheme-source.factorial-3";

function callDocument(): KpSchemeSourceDocument {
  const listId = kpSchemeSourceOccurrenceId(documentId, [0]);
  return {
    schemaVersion: "kp.scheme-source-document.v1",
    id: documentId,
    sourceText: "(factorial 3)",
    forms: [{
      kind: "list",
      id: listId,
      address: [0],
      role: "application",
      source: { start: 0, end: 13 },
      delimiters: {
        open: {
          id: kpSchemeSourceDelimiterId(listId, "open"),
          kind: "open-paren",
          source: { start: 0, end: 1 }
        },
        close: {
          id: kpSchemeSourceDelimiterId(listId, "close"),
          kind: "close-paren",
          source: { start: 12, end: 13 }
        }
      },
      children: [
        {
          kind: "atom",
          id: kpSchemeSourceOccurrenceId(documentId, [0, 0]),
          address: [0, 0],
          atomKind: "symbol",
          role: "identifier",
          lexeme: "factorial",
          source: { start: 1, end: 10 }
        },
        {
          kind: "atom",
          id: kpSchemeSourceOccurrenceId(documentId, [0, 1]),
          address: [0, 1],
          atomKind: "integer",
          role: "integer",
          lexeme: "3",
          source: { start: 11, end: 12 }
        }
      ]
    }]
  };
}

test("factorial source text fixes the bounded two-form program", () => {
  assert.equal(KP_SCHEME_FACTORIAL_SOURCE, `(define (factorial n)
  (if (= n 0)
      1
      (* n (factorial (- n 1)))))
(factorial 3)`);
});

test("source identities derive from syntax addresses rather than glyphs", () => {
  const document = defineKpSchemeSourceDocument(callDocument());
  assert.deepEqual(
    collectKpSchemeSourceExpressions(document).map(({ id }) => id),
    [
      `${documentId}.occurrence.0`,
      `${documentId}.occurrence.0.0`,
      `${documentId}.occurrence.0.1`
    ]
  );
  assert.equal(
    (document.forms[0] as KpSchemeSourceList).delimiters.open.id,
    `${documentId}.occurrence.0.delimiter.open`
  );
});

test("deep-freezes source structure, addresses, spans, and delimiters", () => {
  const document = defineKpSchemeSourceDocument(callDocument());
  const root = document.forms[0] as KpSchemeSourceList;
  assert.equal(Object.isFrozen(document), true);
  assert.equal(Object.isFrozen(document.forms), true);
  assert.equal(Object.isFrozen(root), true);
  assert.equal(Object.isFrozen(root.address), true);
  assert.equal(Object.isFrozen(root.source), true);
  assert.equal(Object.isFrozen(root.delimiters.open), true);
  assert.equal(Object.isFrozen(root.children), true);
});

test("rejects identity derived from a repeated glyph or geometry-like offset", () => {
  const input = callDocument();
  const root = input.forms[0] as KpSchemeSourceList;
  const invalid: KpSchemeSourceDocument = {
    ...input,
    forms: [{
      ...root,
      children: [root.children[0]!, {
        ...root.children[1]!,
        id: root.children[0]!.id
      }]
    }]
  };
  const issues = validateKpSchemeSourceDocument(invalid);
  assert.ok(issues.some(({ message }) => message.includes("duplicate ID")));
  assert.ok(issues.some(({ message }) => message.includes("address-derived ID")));
});

test("rejects delimiter and atom spans that do not select exact source", () => {
  const input = callDocument();
  const root = input.forms[0] as KpSchemeSourceList;
  const invalid: KpSchemeSourceDocument = {
    ...input,
    forms: [{
      ...root,
      delimiters: {
        ...root.delimiters,
        close: { ...root.delimiters.close, source: { start: 11, end: 12 } }
      },
      children: [{
        ...root.children[0]!,
        source: { start: 2, end: 10 }
      }, root.children[1]!]
    }]
  };
  const messages = validateKpSchemeSourceDocument(invalid).map(
    ({ message }) => message
  );
  assert.ok(messages.includes("atom span must select its lexeme"));
  assert.ok(messages.some((message) => message.includes("delimiter span")));
});

test("keeps syntactic role separate from future binding and value identity", () => {
  const roles = collectKpSchemeSourceExpressions(
    defineKpSchemeSourceDocument(callDocument())
  ).map((expression) => expression.role);
  assert.deepEqual(roles, ["application", "identifier", "integer"]);
  assert.ok(!roles.includes("binder" as never));
  assert.ok(!roles.includes("value" as never));
});
