import assert from "node:assert/strict";
import test from "node:test";

import {
  composeKpCompleteCodeSourceProjection,
  type KpCodeSourceFragment
} from "../src/semantic/code-source-projection.ts";
import type { KpPythonSourceToken } from
  "../src/semantic/python-source-tokens.ts";

interface TestEntity {
  readonly id: string;
  readonly kind: "function" | "expression";
  readonly label: string;
  readonly sourceRange: { readonly startOffset: number; readonly endOffset: number };
  readonly languageEvidence: string;
}

test("complete source projection preserves caller whitespace and rebases exact ranges", () => {
  const first = fragment("def price():\n    return 5", "function.price", "python.ast.price", [
    token("token.def", "def", "keyword", 0, 3),
    token("token.price", "price", "function", 4, 9),
    token("token.open", "(", "punctuation", 9, 10),
    token("token.close", ")", "punctuation", 10, 11),
    token("token.colon", ":", "punctuation", 11, 12),
    token("token.return", "return", "keyword", 17, 23),
    token("token.five", "5", "number", 24, 25)
  ]);
  const second = fragment("def message():\n    return \"Paid\"", "function.message", "python.ast.message", [
    token("token.def.message", "def", "keyword", 0, 3),
    token("token.message", "message", "function", 4, 11),
    token("token.open.message", "(", "punctuation", 11, 12),
    token("token.close.message", ")", "punctuation", 12, 13),
    token("token.colon.message", ":", "punctuation", 13, 14),
    token("token.return.message", "return", "keyword", 19, 25),
    token("token.paid", "\"Paid\"", "string", 26, 32)
  ]);

  const projection = composeKpCompleteCodeSourceProjection({
    id: "projection.python.test",
    fragments: [first, second],
    separator: "\n\n\n",
    rootEntityId: "program.after",
    tokenId: ({ id }) => id
  });

  assert.equal(projection.sourceText, `${first.sourceText}\n\n\n${second.sourceText}`);
  assert.equal(projection.rootEntityId, "program.after");
  assert.equal(projection.entities[1]?.sourceRange.startOffset, first.sourceText.length + 3);
  for (const token of projection.tokens) {
    assert.equal(
      projection.sourceText.slice(token.startOffset, token.endOffset),
      token.text
    );
  }
  assert.equal(projection.entities[0]?.languageEvidence, "python.ast.price");
  assert.ok(Object.isFrozen(projection));
  assert.ok(Object.isFrozen(projection.entities));
  assert.ok(Object.isFrozen(projection.tokens));
});

test("projection seam rejects incomplete ranges and duplicate caller identity", () => {
  const valid = fragment("const x = 1;", "function.one", "typescript.compiler.one", []);
  const duplicate = fragment("const y = 2;", "function.one", "typescript.compiler.two", []);

  assert.throws(
    () => composeKpCompleteCodeSourceProjection({
      id: "projection.duplicate",
      fragments: [valid, duplicate],
      separator: "\n"
    }),
    /entity ids must be unique/
  );
  assert.throws(
    () => composeKpCompleteCodeSourceProjection({
      id: "projection.invalid",
      fragments: [{
        sourceText: "x",
        entities: [{
          id: "entity.outside",
          kind: "expression" as const,
          label: "outside",
          sourceRange: { startOffset: 0, endOffset: 2 },
          languageEvidence: "compiler.outside"
        }],
        tokens: []
      }],
      separator: ""
    }),
    /invalid fragment range/
  );
});

function fragment(
  sourceText: string,
  id: string,
  languageEvidence: string,
  tokens: readonly KpPythonSourceToken[]
): KpCodeSourceFragment<TestEntity, KpPythonSourceToken> {
  return {
    sourceText,
    entities: [{
      id,
      kind: "function",
      label: id,
      sourceRange: { startOffset: 0, endOffset: sourceText.length },
      languageEvidence
    }],
    tokens
  };
}

function token(
  id: string,
  text: string,
  kind: KpPythonSourceToken["kind"],
  startOffset: number,
  endOffset: number
): KpPythonSourceToken {
  return { id, text, kind, startOffset, endOffset };
}
