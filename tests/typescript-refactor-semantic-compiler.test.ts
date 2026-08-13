import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpTypeScriptRefactorSemantics
} from "../scripts/typescript-refactor-semantic-compiler.ts";
import {
  kpTypeScriptFreeShippingRefactorContract
} from "../src/semantic/typescript-free-shipping-refactor-contract.ts";

test("semantic compilation closes over the frozen entity inventory", () => {
  const artifact = compileKpTypeScriptRefactorSemantics();
  const entities = artifact.revisions.flatMap(({ entities }) => entities);

  assert.deepEqual(
    entities.map(({ id }) => id),
    kpTypeScriptFreeShippingRefactorContract.entities.map(({ id }) => id)
  );
  assert.equal(new Set(entities.map(({ revision, syntaxRecordId }) =>
    `${revision}:${syntaxRecordId}`)).size, entities.length);
  assert.deepEqual(JSON.parse(JSON.stringify(artifact)), artifact);
});

test("duplicates are distinct identities in distinct declared scopes", () => {
  const entities = compileKpTypeScriptRefactorSemantics().revisions[0]!.entities;
  const rules = entities.filter(({ kind }) => kind === "expression");

  assert.deepEqual(rules.map(({ id, scopeId, declarationId }) => ({
    id,
    scopeId,
    declarationId
  })), [
    {
      id: "rule.shipping-cost.before",
      scopeId: "scope.before.shippingCost",
      declarationId: "function.shipping-cost.before"
    },
    {
      id: "rule.shipping-message.before",
      scopeId: "scope.before.shippingMessage",
      declarationId: "function.shipping-message.before"
    }
  ]);
  assert.notEqual(rules[0]?.syntaxRecordId, rules[1]?.syntaxRecordId);
});

test("helper and call sites bind through declared semantic ids", () => {
  const entities = compileKpTypeScriptRefactorSemantics().revisions[1]!.entities;
  const helper = entities.find(({ id }) => id === "function.qualifies.after");
  const calls = entities.filter(({ kind }) => kind === "call-site");

  assert.deepEqual(helper?.sourceRange.start, { line: 1, column: 1 });
  assert.deepEqual(calls.map(({ id, declarationId }) => ({ id, declarationId })), [
    {
      id: "call.shipping-cost.after",
      declarationId: "function.qualifies.after"
    },
    {
      id: "call.shipping-message.after",
      declarationId: "function.qualifies.after"
    }
  ]);
});

test("semantic identities contain source evidence but no presentation geometry", () => {
  const serialized = JSON.stringify(compileKpTypeScriptRefactorSemantics());
  assert.doesNotMatch(serialized, /\b(?:x|y|width|height|rect|bbox|glyph)\b/i);
  assert.match(serialized, /startOffset/);
  assert.match(serialized, /revisionId/);
});
