import assert from "node:assert/strict";
import test from "node:test";

import { projectKpLispLambdaSourceMaterial } from
  "../src/animation/lisp-s-expression-material-projection.ts";
import { projectKpLispResponsiveGeometry } from
  "../src/animation/lisp-s-expression-responsive-geometry.ts";
import { createKpLispLambdaApplicationFixture } from
  "../src/semantic/lisp-lambda-application-fixture.ts";

const fixture = createKpLispLambdaApplicationFixture();
const application = projectKpLispLambdaSourceMaterial(fixture).canonicalStates[0]!;

test("keeps the wide expression on one centered readable row", () => {
  const geometry = projectKpLispResponsiveGeometry(
    fixture.semantic,
    application,
    720,
    "expr.body"
  );

  assert.equal(geometry.mode, "wide");
  assert.equal(geometry.fontSizePx, 20);
  assert.equal(geometry.stage.widthEm, 36);
  assert.equal(geometry.stage.heightEm, 12);
  assert.equal(geometry.stage.reserved, true);
  assert.deepEqual(geometry.rows.map(({ text }) => text), [
    "((lambda (x) (+ x 1)) 4)"
  ]);
  assert.equal(new Set(geometry.tokens.map(({ rowId }) => rowId)).size, 1);
});

test("wraps phone code only at certified expression boundaries", () => {
  const geometry = projectKpLispResponsiveGeometry(
    fixture.semantic,
    application,
    320,
    "expr.body"
  );

  assert.equal(geometry.mode, "phone");
  assert.equal(geometry.fontSizePx, 20);
  assert.deepEqual(geometry.rows.map(({ sourceStart, text, indentColumns }) => ({
    sourceStart,
    text,
    indentColumns
  })), [
    { sourceStart: 0, text: "((lambda (x)", indentColumns: 0 },
    { sourceStart: 13, text: "(+ x 1))", indentColumns: 2 },
    { sourceStart: 22, text: "4)", indentColumns: 1 }
  ]);
  assert.deepEqual(
    geometry.tokens.filter(({ materialId }) =>
      materialId === "delimiter.expr.body.open" ||
      materialId === "occurrence.argument.four").map(({ rowId }) => rowId),
    ["row.1", "row.2"]
  );
});

test("reserves one stable stage while active expressions breathe by depth", () => {
  const applicationActive = projectKpLispResponsiveGeometry(
    fixture.semantic,
    application,
    720,
    "expr.application"
  );
  const bodyActive = projectKpLispResponsiveGeometry(
    fixture.semantic,
    application,
    720,
    "expr.body"
  );
  const applicationEnvelope = applicationActive.expressions.find(
    ({ expressionId }) => expressionId === "expr.application"
  )!;
  const bodyEnvelope = bodyActive.expressions.find(
    ({ expressionId }) => expressionId === "expr.body"
  )!;

  assert.deepEqual(bodyActive.stage, applicationActive.stage);
  assert.deepEqual(bodyActive.tokens, applicationActive.tokens);
  assert.ok(bodyEnvelope.paddingInlineEm > applicationEnvelope.paddingInlineEm);
  assert.ok(bodyEnvelope.paddingBlockEm > applicationEnvelope.paddingBlockEm);
});

test("contains all wide and phone material envelopes without overlap", () => {
  for (const width of [320, 720]) {
    const geometry = projectKpLispResponsiveGeometry(
      fixture.semantic,
      application,
      width,
      "expr.body"
    );
    for (const { rect } of [...geometry.tokens, ...geometry.expressions]) {
      assert.ok(rect.xEm >= 0);
      assert.ok(rect.yEm >= 0);
      assert.ok(rect.xEm + rect.widthEm <= geometry.stage.widthEm);
      assert.ok(rect.yEm + rect.heightEm <= geometry.stage.heightEm);
    }
    const rows = new Map<string, typeof geometry.tokens>();
    for (const token of geometry.tokens) {
      rows.set(token.rowId, [...(rows.get(token.rowId) ?? []), token]);
    }
    for (const tokens of rows.values()) {
      const ordered = [...tokens].sort((left, right) =>
        left.rect.xEm - right.rect.xEm);
      for (let index = 1; index < ordered.length; index += 1) {
        assert.ok(
          ordered[index - 1]!.rect.xEm + ordered[index - 1]!.rect.widthEm <=
          ordered[index]!.rect.xEm + 1e-9
        );
      }
    }
  }
});

test("rejects geometry that would require tiny type or non-source text", () => {
  assert.throws(
    () => projectKpLispResponsiveGeometry(
      fixture.semantic,
      application,
      100,
      "expr.body"
    ),
    /cannot fit.*without shrinking/
  );
  assert.throws(
    () => projectKpLispResponsiveGeometry(
      fixture.semantic,
      { ...application, nativeCode: "invented" },
      720,
      "expr.body"
    ),
    /certified application state/
  );
});
