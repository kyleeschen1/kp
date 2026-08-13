import assert from "node:assert/strict";
import test from "node:test";

import { compileKpPythonRefactorSemantics } from
  "../scripts/python-refactor-semantic-compiler.ts";
import { createKpPythonRefactorSourceProjections } from
  "../src/semantic/python-refactor-source-projections.ts";

test("Python stdlib lexical evidence becomes deterministic paint roles", () => {
  const semantics = compileKpPythonRefactorSemantics();
  const after = semantics.revisions.find(({ revision }) => revision === "after")!;
  const roles = new Map<string, string[]>();
  for (const token of after.tokens) {
    roles.set(token.text, [...(roles.get(token.text) ?? []), token.kind]);
    assert.equal(
      after.sourceText.slice(token.startOffset, token.endOffset),
      token.text,
      token.id
    );
  }

  assert.ok(roles.get("def")?.every((kind) => kind === "keyword"));
  assert.ok(roles.get("return")?.every((kind) => kind === "keyword"));
  assert.ok(roles.get("if")?.every((kind) => kind === "keyword"));
  assert.ok(roles.get("else")?.every((kind) => kind === "keyword"));
  assert.deepEqual(roles.get("int"), ["type", "type", "type", "type"]);
  assert.deepEqual(roles.get("bool"), ["type"]);
  assert.deepEqual(roles.get("str"), ["type"]);
  assert.deepEqual(roles.get("qualifies_for_free_shipping"), [
    "function", "function", "function"
  ]);
  assert.ok(roles.get("total")?.every((kind) => kind === "identifier"));
  assert.deepEqual(roles.get("50"), ["number"]);
  assert.ok(roles.get('"Free shipping"')?.every((kind) => kind === "string"));
  assert.ok(roles.get(">=")?.every((kind) => kind === "operator"));
  assert.ok(Object.isFrozen(after.tokens));
  assert.ok(after.tokens.every(Object.isFrozen));
});

test("Python projections preserve one syntax stream with unique occurrence ids", () => {
  const projections = createKpPythonRefactorSourceProjections(
    compileKpPythonRefactorSemantics()
  );

  for (const projection of projections) {
    assert.equal(
      new Set(projection.tokens.map(({ id }) => id)).size,
      projection.tokens.length,
      projection.id
    );
    for (const token of projection.tokens) {
      assert.equal(
        projection.sourceText.slice(token.startOffset, token.endOffset),
        token.text,
        `${projection.id}: ${token.id}`
      );
    }
  }
});
