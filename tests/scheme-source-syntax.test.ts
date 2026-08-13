import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSchemeSourceSyntaxTokens,
  resolveKpSchemeMaterialSyntaxRole
} from "../src/semantic/scheme-source-syntax.ts";
import { parseKpSchemeFactorialSource } from
  "../src/semantic/scheme-factorial-parser.ts";

const document = parseKpSchemeFactorialSource();

test("Scheme syntax adapter preserves exact atom and delimiter identity", () => {
  const tokens = createKpSchemeSourceSyntaxTokens(document);
  assert.equal(tokens.length, 32);
  assert.equal(new Set(tokens.map(({ id }) => id)).size, tokens.length);
  tokens.forEach((token) => {
    assert.equal(document.sourceText.slice(token.startOffset, token.endOffset), token.text);
    assert.match(token.id, token.syntaxIdentityKind === "delimiter"
      ? /\.delimiter\.(?:open|close)$/u
      : /\.occurrence\./u);
  });
  assert.deepEqual(tokens.filter(({ text }) => text === "n").map(({ kind }) => kind),
    ["identifier", "identifier", "identifier", "identifier"]);
});

test("Scheme paint roles cover atoms, delimiters, and generated activation syntax", () => {
  const byText = new Map(createKpSchemeSourceSyntaxTokens(document)
    .map((token) => [token.text, token.kind] as const));
  assert.equal(byText.get("define"), "keyword");
  assert.equal(byText.get("factorial"), "function");
  assert.equal(byText.get("*"), "operator");
  assert.equal(byText.get("3"), "number");
  assert.equal(byText.get("("), "punctuation");
  assert.equal(resolveKpSchemeMaterialSyntaxRole({
    lexeme: "lambda",
    provenance: {
      kind: "activation",
      sourceOccurrenceId: document.forms[0]!.id,
      activationId: "activation.test",
      introducedByActionId: "action.expand"
    }
  }), "keyword");
});

test("paint classification cannot invent missing source provenance", () => {
  assert.throws(() => resolveKpSchemeMaterialSyntaxRole({
    lexeme: "n",
    provenance: { kind: "source", sourceOccurrenceId: "" }
  }), /source-owned provenance/u);
});
