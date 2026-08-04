import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveKpLispMaterialRoot,
  resolveKpLispMaterialRoots
} from "../src/animation/lisp-s-expression-material-roots.ts";
import { createKpLispLambdaApplicationFixture } from
  "../src/semantic/lisp-lambda-application-fixture.ts";

test("resolves roots from semantic roles rather than first-glyph position", () => {
  const semantic = createKpLispLambdaApplicationFixture().semantic;
  const roots = resolveKpLispMaterialRoots(semantic);

  assert.deepEqual(roots.filter(({ role }) => role !== "atom"), [
    {
      expressionId: "expr.application",
      role: "anonymous-application",
      anchorKind: "expression",
      anchorIds: ["expr.lambda"]
    },
    {
      expressionId: "expr.lambda",
      role: "executable-form",
      anchorKind: "token",
      anchorIds: ["occurrence.lambda"]
    },
    {
      expressionId: "expr.parameters",
      role: "parameter-list",
      anchorKind: "centroid",
      anchorIds: ["occurrence.x.binder"]
    },
    {
      expressionId: "expr.body",
      role: "executable-form",
      anchorKind: "token",
      anchorIds: ["occurrence.plus"]
    }
  ]);
});

test("anchors atoms to themselves and rejects unknown expressions", () => {
  const semantic = createKpLispLambdaApplicationFixture().semantic;

  assert.deepEqual(resolveKpLispMaterialRoot(
    semantic,
    "occurrence.argument.four"
  ), {
    expressionId: "occurrence.argument.four",
    role: "atom",
    anchorKind: "token",
    anchorIds: ["occurrence.argument.four"]
  });
  assert.throws(() => resolveKpLispMaterialRoot(
    semantic,
    "expr.unknown"
  ), /Unknown certified Lisp expression/);
});

test("deep-freezes root projections and anchor identities", () => {
  const roots = resolveKpLispMaterialRoots(
    createKpLispLambdaApplicationFixture().semantic
  );

  assert.equal(Object.isFrozen(roots), true);
  assert.equal(Object.isFrozen(roots[0]), true);
  assert.equal(Object.isFrozen(roots[0]?.anchorIds), true);
});
