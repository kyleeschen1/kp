import assert from "node:assert/strict";
import test from "node:test";

import {
  collectKpLispExpressions,
  defineKpLispSemanticModel,
  validateKpLispSemanticModel,
  type KpLispSemanticModel
} from "../src/semantic/lisp-semantic-model.ts";

function model(): KpLispSemanticModel {
  return {
    id: "lisp-model.lambda-application",
    sourceText: "(lambda (x) (+ x 1))",
    root: {
      kind: "list",
      id: "expr.lambda",
      role: "executable-form",
      delimiters: delimiters("expr.lambda", 0, 19),
      source: { start: 0, end: 20 },
      children: [
        { kind: "atom", id: "occurrence.lambda", atomKind: "symbol", lexeme: "lambda", source: { start: 1, end: 7 } },
        {
          kind: "list",
          id: "expr.parameters",
          role: "parameter-list",
          delimiters: delimiters("expr.parameters", 8, 10),
          source: { start: 8, end: 11 },
          children: [
            { kind: "atom", id: "occurrence.x.binder", atomKind: "symbol", lexeme: "x", source: { start: 9, end: 10 } }
          ]
        },
        {
          kind: "list",
          id: "expr.body",
          role: "executable-form",
          delimiters: delimiters("expr.body", 12, 18),
          source: { start: 12, end: 19 },
          children: [
            { kind: "atom", id: "occurrence.plus", atomKind: "symbol", lexeme: "+", source: { start: 13, end: 14 } },
            { kind: "atom", id: "occurrence.x.reference", atomKind: "symbol", lexeme: "x", source: { start: 15, end: 16 } },
            { kind: "atom", id: "occurrence.one", atomKind: "integer", lexeme: "1", source: { start: 17, end: 18 } }
          ]
        }
      ]
    },
    bindings: [{
      id: "binding.x",
      name: "x",
      binderOccurrenceId: "occurrence.x.binder",
      referenceOccurrenceIds: ["occurrence.x.reference"],
      scopeExpressionId: "expr.body"
    }],
    environments: [{
      id: "environment.application",
      entries: [{ bindingId: "binding.x", valueExpressionId: "occurrence.one" }]
    }],
    destinations: [{
      kind: "substitution",
      id: "destination.body.x",
      parentExpressionId: "expr.body",
      childIndex: 1,
      referenceOccurrenceId: "occurrence.x.reference",
      accepts: "s-expression"
    }],
    values: [{
      kind: "integer-value",
      id: "value.one",
      exactInteger: 1,
      sourceExpressionId: "occurrence.one"
    }]
  };
}

test("keeps equal x glyphs as distinct binder and reference occurrences", () => {
  const semantic = defineKpLispSemanticModel(model());
  const expressions = collectKpLispExpressions(semantic.root);
  const xs = expressions.filter((expression) => expression.kind === "atom" && expression.lexeme === "x");

  assert.deepEqual(xs.map(({ id }) => id), [
    "occurrence.x.binder",
    "occurrence.x.reference"
  ]);
  assert.equal(semantic.bindings[0]?.binderOccurrenceId, xs[0]?.id);
  assert.deepEqual(semantic.bindings[0]?.referenceOccurrenceIds, [xs[1]?.id]);
});

test("deep-freezes semantic collections and expression structure", () => {
  const semantic = defineKpLispSemanticModel(model());

  assert.equal(Object.isFrozen(semantic), true);
  assert.equal(Object.isFrozen(semantic.root), true);
  assert.equal(Object.isFrozen(semantic.root.kind === "list" ? semantic.root.children : []), true);
  assert.equal(Object.isFrozen(semantic.root.kind === "list" ? semantic.root.delimiters : {}), true);
  assert.equal(Object.isFrozen(semantic.bindings[0]?.referenceOccurrenceIds), true);
  assert.equal(Object.isFrozen(semantic.environments[0]?.entries), true);
});

test("certifies distinct parenthesis identities and semantic list roles", () => {
  const semantic = defineKpLispSemanticModel(model());
  const lists = collectKpLispExpressions(semantic.root).filter(
    (expression) => expression.kind === "list"
  );

  assert.deepEqual(lists.map(({ role }) => role), [
    "executable-form",
    "parameter-list",
    "executable-form"
  ]);
  assert.equal(new Set(lists.flatMap(({ delimiters }) => [
    delimiters.open.id,
    delimiters.close.id
  ])).size, 6);
});

test("rejects binding links outside their certified scope", () => {
  const base = model();
  assert.throws(() => defineKpLispSemanticModel({
    ...base,
    bindings: [{
      ...base.bindings[0]!,
      referenceOccurrenceIds: ["occurrence.one"]
    }]
  }), /binding reference lexeme must match|binding reference must be inside/);
});

test("rejects a substitution destination that does not name its exact child", () => {
  const base = model();
  const invalid: KpLispSemanticModel = {
    ...base,
    destinations: [{ ...base.destinations[0]!, childIndex: 2 }]
  };

  assert.throws(
    () => defineKpLispSemanticModel(invalid),
    /destination child does not match its reference occurrence/
  );
});

test("reports duplicate occurrence identity independently of source glyphs", () => {
  const base = model();
  if (base.root.kind !== "list") throw new Error("test fixture root is not a list");
  const root = base.root;
  const body = root.children[2];
  if (body?.kind !== "list") throw new Error("test fixture body is not a list");
  const invalid: KpLispSemanticModel = {
    ...base,
    root: {
      ...root,
      children: [root.children[0]!, root.children[1]!, {
        ...body,
        children: [body.children[0]!, {
          ...body.children[1]!,
          id: "occurrence.x.binder"
        }, body.children[2]!]
      }]
    }
  };

  const issues = validateKpLispSemanticModel(invalid);
  assert.ok(issues.some(({ message }) => message.includes("duplicate id occurrence.x.binder")));
});

function delimiters(id: string, openStart: number, closeStart: number) {
  return {
    open: {
      id: `delimiter.${id}.open`,
      kind: "open-paren" as const,
      source: { start: openStart, end: openStart + 1 }
    },
    close: {
      id: `delimiter.${id}.close`,
      kind: "close-paren" as const,
      source: { start: closeStart, end: closeStart + 1 }
    }
  };
}
