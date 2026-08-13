import assert from "node:assert/strict";
import test from "node:test";

import {
  tokenizeKpTypeScriptSource,
  type KpTypeScriptTokenKind
} from "../src/semantic/typescript-source-tokens.ts";

test("TypeScript syntax tokens preserve every source byte through stable offsets", () => {
  const source = [
    "// shipping threshold",
    "export function qualifies(total: number): boolean {",
    "  return total >= 50;",
    "}",
    "const message = qualifies(order.total) ? \"Free \\\"shipping\\\"\" : 'Paid';",
    ""
  ].join("\n");
  const tokens = tokenizeKpTypeScriptSource(source);

  let reconstructed = "";
  let cursor = 0;
  for (const token of tokens) {
    reconstructed += source.slice(cursor, token.startOffset);
    reconstructed += token.text;
    cursor = token.endOffset;
  }
  reconstructed += source.slice(cursor);

  assert.equal(reconstructed, source);
  assert.ok(tokens.every((token) =>
    source.slice(token.startOffset, token.endOffset) === token.text
  ));
  assert.ok(Object.isFrozen(tokens));
  assert.ok(tokens.every(Object.isFrozen));
});

test("TypeScript syntax roles cover static source and animated token paint", () => {
  const source = [
    "/* one source of truth */",
    "export function qualifies(total: number): boolean {",
    "  const result = total >= 50 && true;",
    "  return result;",
    "}",
    "qualifies(order.total);"
  ].join("\n");
  const tokens = tokenizeKpTypeScriptSource(source);
  const roles = new Map<string, KpTypeScriptTokenKind[]>();
  for (const token of tokens) {
    roles.set(token.text, [...(roles.get(token.text) ?? []), token.kind]);
  }

  assert.deepEqual(roles.get("/* one source of truth */"), ["comment"]);
  assert.deepEqual(roles.get("export"), ["keyword"]);
  assert.deepEqual(roles.get("qualifies"), ["function", "function"]);
  assert.deepEqual(roles.get("number"), ["type"]);
  assert.deepEqual(roles.get("boolean"), ["type"]);
  assert.deepEqual(roles.get("50"), ["number"]);
  assert.deepEqual(roles.get("true"), ["boolean"]);
  assert.deepEqual(roles.get("total"), ["identifier", "identifier", "property"]);
  assert.deepEqual(roles.get(">="), ["operator"]);
  assert.deepEqual(roles.get("&&"), ["operator"]);
});

test("TypeScript tokenization is deterministic and does not mutate prior output", () => {
  const source = "const amount = calculate(order.total ?? 0);";
  const first = tokenizeKpTypeScriptSource(source);
  const second = tokenizeKpTypeScriptSource(source);

  assert.deepEqual(second, first);
  assert.notEqual(second, first);
  assert.deepEqual(first.map(({ text, kind }) => [text, kind]), [
    ["const", "keyword"],
    ["amount", "identifier"],
    ["=", "operator"],
    ["calculate", "function"],
    ["(", "punctuation"],
    ["order", "identifier"],
    [".", "punctuation"],
    ["total", "property"],
    ["??", "operator"],
    ["0", "number"],
    [")", "punctuation"],
    [";", "punctuation"]
  ]);
});
