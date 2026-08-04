import assert from "node:assert/strict";
import test from "node:test";

import {
  projectKpLispExpressionBeads,
  resolveKpLispExpressionBead
} from "../src/animation/lisp-s-expression-beads.ts";
import { renderKpLispExpressionBeadHtml } from
  "../src/rendering/lisp-s-expression-bead-html.ts";
import { createKpLispLambdaApplicationFixture } from
  "../src/semantic/lisp-lambda-application-fixture.ts";

const fixture = createKpLispLambdaApplicationFixture();
const beads = projectKpLispExpressionBeads(fixture.semantic);

test("retains literal executable heads as the bead face", () => {
  const lambda = resolveKpLispExpressionBead(beads, "expr.lambda");
  const body = resolveKpLispExpressionBead(beads, "expr.body");

  assert.deepEqual(lambda.face, {
    kind: "literal-head",
    materialId: "occurrence.lambda",
    nativeCode: "lambda"
  });
  assert.deepEqual(body.face, {
    kind: "literal-head",
    materialId: "occurrence.plus",
    nativeCode: "+"
  });
});

test("keeps anonymous operator and argument material instead of a label", () => {
  const application = resolveKpLispExpressionBead(beads, "expr.application");

  assert.deepEqual(application.face, {
    kind: "anonymous-application-miniature",
    parts: [
      { expressionId: "expr.lambda", nativeCode: "(lambda (x) (+ x 1))" },
      { expressionId: "occurrence.argument.four", nativeCode: "4" }
    ]
  });
  assert.equal("label" in application.face, false);
});

test("derives each interior particle from one immediate semantic child", () => {
  for (const bead of beads) {
    const expression = findList(fixture.semantic.root, bead.expressionId)!;
    assert.deepEqual(
      bead.particles.map(({ childExpressionId }) => childExpressionId),
      expression.children.map(({ id }) => id)
    );
    for (const particle of bead.particles) {
      assert.equal(particle.originExpressionIds[0], particle.childExpressionId);
      assert.equal(
        particle.aggregatesSubtree,
        findExpression(fixture.semantic.root, particle.childExpressionId)?.kind === "list"
      );
      assert.ok(bead.originExpressionIds.includes(particle.childExpressionId));
    }
  }
});

test("renders only source-derived code and exposes detail on demand", () => {
  const application = resolveKpLispExpressionBead(beads, "expr.application");
  const detailed = renderKpLispExpressionBeadHtml({
    bead: application,
    detailed: true
  });
  const quiet = renderKpLispExpressionBeadHtml({
    bead: application,
    detailed: false
  });

  assert.match(detailed, /data-kp-lisp-bead-miniature-part="expr\.lambda"/);
  assert.match(detailed, /\(lambda \(x\) \(\+ x 1\)\)/);
  assert.match(detailed, /data-kp-lisp-bead-particle="expr\.lambda"/);
  assert.match(detailed, /data-kp-lisp-bead-aggregates-subtree="true"/);
  assert.doesNotMatch(quiet, /data-kp-lisp-bead-particles/);
  assert.doesNotMatch(detailed.replaceAll(/<[^>]+>/g, " "),
    /function|operator|argument/i);
});

test("deep-freezes bead identity, aggregation, and provenance", () => {
  const application = resolveKpLispExpressionBead(beads, "expr.application");
  assert.equal(Object.isFrozen(beads), true);
  assert.equal(Object.isFrozen(application), true);
  assert.equal(Object.isFrozen(application.particles), true);
  assert.equal(Object.isFrozen(application.particles[0]?.originExpressionIds), true);
});

function findList(
  expression: ReturnType<typeof createKpLispLambdaApplicationFixture>["semantic"]["root"],
  id: string
) {
  const found = findExpression(expression, id);
  return found?.kind === "list" ? found : undefined;
}

function findExpression(
  expression: ReturnType<typeof createKpLispLambdaApplicationFixture>["semantic"]["root"],
  id: string
): ReturnType<typeof createKpLispLambdaApplicationFixture>["semantic"]["root"] | undefined {
  if (expression.id === id) return expression;
  if (expression.kind === "atom") return undefined;
  for (const child of expression.children) {
    const found = findExpression(child as typeof expression, id);
    if (found !== undefined) return found;
  }
  return undefined;
}
