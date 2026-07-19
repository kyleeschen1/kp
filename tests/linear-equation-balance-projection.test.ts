import assert from "node:assert/strict";
import test from "node:test";

import {
  projectLinearEquationBalanceExemplar,
  projectLinearEquationTrace
} from "../src/projections/public-api.ts";
import { createCanonicalConceptRoomTrace } from "./fixtures/canonical-concept-room-trace.ts";

test("symbolic and balance projections share one semantic clock", () => {
  const trace = createCanonicalConceptRoomTrace();
  for (const progress of [0, 400, 500, 750, 1000]) {
    const symbolic = projectLinearEquationTrace(trace, progress);
    const balance = projectLinearEquationBalanceExemplar(trace, progress, {
      diagramSemanticId: "diagram.balance"
    });
    assert.equal(balance.frameId, symbolic.frameId);
    assert.equal(balance.equationSemanticId, symbolic.equationSemanticId);
    assert.equal(balance.progressPermille, symbolic.progressPermille);
  }
});

test("balance terms preserve symbolic semantic identity and exact fractions", () => {
  const trace = createCanonicalConceptRoomTrace();
  const symbolic = projectLinearEquationTrace(trace, 1000);
  const balance = projectLinearEquationBalanceExemplar(trace, 1000, {
    diagramSemanticId: "diagram.balance"
  });
  const symbolicTerms = symbolic.tokens
    .filter((token) => token.kind === "term")
    .map((token) => token.semanticId)
    .sort();
  const balanceTerms = balance.sides.flatMap((side) => side.terms)
    .map((term) => term.semanticId)
    .sort();
  assert.deepEqual(balanceTerms, symbolicTerms);
  assert.equal(balance.sides[1].terms[0]?.latex, "\\frac{5}{2}");
  assert.match(balance.accessibleText, /x equals 5 over 2/);
  assert.equal(Object.isFrozen(balance.sides), true);
});

test("each entering operation is represented on both sides", () => {
  const trace = createCanonicalConceptRoomTrace();
  const subtract = projectLinearEquationBalanceExemplar(trace, 500, {
    diagramSemanticId: "diagram.balance"
  });
  assert.deepEqual(subtract.operationApplications.map((application) => application.side), [
    "left", "right"
  ]);
  assert.deepEqual(new Set(subtract.operationApplications.map((application) =>
    application.operationSemanticId
  )), new Set(["operation.subtract-three"]));
  assert.deepEqual(new Set(subtract.operationApplications.map((application) => application.kind)),
    new Set(["subtract-both-sides"]));
  assert.match(subtract.accessibleText, /subtraction on both sides/);
  const start = projectLinearEquationBalanceExemplar(trace, 0, {
    diagramSemanticId: "diagram.balance"
  });
  assert.deepEqual(start.operationApplications, []);
});
