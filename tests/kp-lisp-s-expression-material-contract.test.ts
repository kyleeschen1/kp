import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpLispMaterialProgram,
  KP_LISP_MATERIAL_FORM_ROLES,
  KP_LISP_MATERIAL_OPERATION_KINDS,
  type KpLispMaterialProgram
} from "../src/animation/lisp-s-expression-material-contract.ts";

function program(): KpLispMaterialProgram {
  return {
    id: "material-program.lisp.lambda-application",
    roles: [
      { expressionId: "expr.application", role: "anonymous-application" },
      { expressionId: "expr.lambda", role: "executable-form" },
      { expressionId: "expr.parameters", role: "parameter-list" },
      { expressionId: "expr.body", role: "executable-form" },
      { expressionId: "occurrence.argument.four", role: "atom" }
    ],
    operations: [
      operation("activate-root", "activate", "expr.application", [], []),
      operation("fold-body", "fold", "expr.body", [
        "occurrence.plus",
        "occurrence.x.reference",
        "occurrence.body.one"
      ], ["expr.body"]),
      operation("unfold-body", "unfold", "expr.body", ["expr.body"], [
        "occurrence.plus"
      ]),
      operation("bind-four", "bind", "expr.application", [
        "occurrence.argument.four"
      ], ["occurrence.x.binder"], "binding.x"),
      operation("propagate-four", "propagate", "expr.body", [
        "occurrence.argument.four"
      ], ["occurrence.x.reference"], "binding.x"),
      operation("reconstruct-body", "reconstruct", "expr.application", [
        "expr.body",
        "binding.x"
      ], ["expr.reconstructed-body"]),
      operation("reduce-addition", "reduce", "expr.reconstructed-body", [
        "derived.plus",
        "derived.argument.four",
        "derived.body.one"
      ], ["value.result.five"])
    ]
  };
}

test("limits the first material grammar to approved semantic roles and operations", () => {
  assert.deepEqual(KP_LISP_MATERIAL_FORM_ROLES, [
    "executable-form",
    "parameter-list",
    "anonymous-application",
    "quoted-data",
    "atom"
  ]);
  assert.deepEqual(KP_LISP_MATERIAL_OPERATION_KINDS, [
    "activate",
    "fold",
    "unfold",
    "bind",
    "propagate",
    "reconstruct",
    "reduce"
  ]);
  assert.equal(KP_LISP_MATERIAL_OPERATION_KINDS.includes(
    "factor" as typeof KP_LISP_MATERIAL_OPERATION_KINDS[number]
  ), false);
});

test("deep-freezes one valid canonical material program", () => {
  const defined = defineKpLispMaterialProgram(program());

  assert.equal(Object.isFrozen(defined), true);
  assert.equal(Object.isFrozen(defined.roles), true);
  assert.equal(Object.isFrozen(defined.operations), true);
  assert.equal(Object.isFrozen(defined.operations[1]?.sourceIds), true);
});

test("requires lexical authority only for binding operations", () => {
  const base = program();
  assert.throws(() => defineKpLispMaterialProgram({
    ...base,
    operations: [{
      ...base.operations[3]!,
      bindingId: undefined
    }]
  }), /bindingId: value must not be empty/);
  assert.throws(() => defineKpLispMaterialProgram({
    ...base,
    operations: [{
      ...base.operations[0]!,
      bindingId: "binding.x"
    }]
  }), /activate must not claim lexical binding authority/);
});

test("rejects operation shapes that hide material endpoints", () => {
  const base = program();
  assert.throws(() => defineKpLispMaterialProgram({
    ...base,
    operations: [{
      ...base.operations.at(-1)!,
      sourceIds: [],
      targetIds: []
    }]
  }), /operation requires material endpoints/);
});

function operation(
  id: string,
  kind: KpLispMaterialProgram["operations"][number]["kind"],
  subjectId: string,
  sourceIds: readonly string[],
  targetIds: readonly string[],
  bindingId?: string
): KpLispMaterialProgram["operations"][number] {
  return { id, kind, subjectId, sourceIds, targetIds, ...(
    bindingId === undefined ? {} : { bindingId }
  ) };
}
