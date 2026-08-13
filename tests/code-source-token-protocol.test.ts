import assert from "node:assert/strict";
import test from "node:test";

import {
  assertKpCodeSourceTokenStream,
  kpCodeSyntaxRoles,
  type KpCodeSourceToken
} from "../src/semantic/code-source-token-protocol.ts";
import { tokenizeKpTypeScriptSource } from
  "../src/semantic/typescript-source-tokens.ts";
import { compileKpPythonRefactorSemantics } from
  "../scripts/python-refactor-semantic-compiler.ts";

test("shared code syntax roles cover both approved callers without owning tokenization", () => {
  assert.deepEqual(kpCodeSyntaxRoles, [
    "keyword", "identifier", "function", "property", "type", "boolean",
    "number", "string", "comment", "operator", "punctuation"
  ]);

  const typescriptSource = "const value = order.total >= 50;";
  assert.doesNotThrow(() => assertKpCodeSourceTokenStream(
    typescriptSource,
    tokenizeKpTypeScriptSource(typescriptSource)
  ));

  const python = compileKpPythonRefactorSemantics().revisions[0]!;
  assert.doesNotThrow(() => assertKpCodeSourceTokenStream(
    python.sourceText,
    python.tokens
  ));
});

test("shared token validation enforces exact ordered half-open source ranges", () => {
  const source = "let x = 50;";
  const valid: readonly KpCodeSourceToken[] = [
    { text: "let", kind: "keyword", startOffset: 0, endOffset: 3 },
    { text: "x", kind: "identifier", startOffset: 4, endOffset: 5 },
    { text: "=", kind: "operator", startOffset: 6, endOffset: 7 },
    { text: "50", kind: "number", startOffset: 8, endOffset: 10 },
    { text: ";", kind: "punctuation", startOffset: 10, endOffset: 11 }
  ];
  assert.doesNotThrow(() => assertKpCodeSourceTokenStream(source, valid));

  assert.throws(
    () => assertKpCodeSourceTokenStream(source, [
      valid[0]!,
      { text: "et", kind: "identifier", startOffset: 1, endOffset: 3 }
    ]),
    /overlaps/
  );
  assert.throws(
    () => assertKpCodeSourceTokenStream(source, [
      { text: "wrong", kind: "keyword", startOffset: 0, endOffset: 3 }
    ]),
    /does not match/
  );
  assert.throws(
    () => assertKpCodeSourceTokenStream(source, [
      { text: "let", kind: "rainbow" as KpCodeSourceToken["kind"], startOffset: 0, endOffset: 3 }
    ]),
    /unknown syntax role/
  );
});
