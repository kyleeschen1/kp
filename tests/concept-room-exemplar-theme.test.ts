import assert from "node:assert/strict";
import test from "node:test";

import {
  linearEquationExemplarTheme,
  structuralConceptRoomTheme
} from "../src/app-adapters/public-api.ts";

test("linear equation exemplar theme locks one complete typed value set", () => {
  assert.equal(linearEquationExemplarTheme.id, "kp.concept-room.linear-equation-exemplar.v1");
  assert.equal(linearEquationExemplarTheme.tokens.typography.mathFamily, "KaTeX_Main");
  assert.equal(linearEquationExemplarTheme.tokens.color.paper, "#f7f3e8");
  assert.equal(linearEquationExemplarTheme.tokens.motion.actMs, 520);
  assert.deepEqual(linearEquationExemplarTheme.roles, structuralConceptRoomTheme.roles);
});

test("theme definitions are deeply immutable trusted presentation values", () => {
  assert.equal(Object.isFrozen(linearEquationExemplarTheme), true);
  assert.equal(Object.isFrozen(linearEquationExemplarTheme.roles), true);
  assert.equal(Object.isFrozen(linearEquationExemplarTheme.tokens), true);
  assert.equal(Object.isFrozen(linearEquationExemplarTheme.tokens.color), true);
  assert.equal(Object.isFrozen(linearEquationExemplarTheme.tokens.motion), true);
});
