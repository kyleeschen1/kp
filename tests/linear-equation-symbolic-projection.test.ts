import assert from "node:assert/strict";
import test from "node:test";

import {
  projectLinearEquationFrame,
  projectLinearEquationTrace
} from "../src/projections/public-api.ts";
import { createCanonicalConceptRoomTrace } from "./fixtures/canonical-concept-room-trace.ts";

test("symbolic projection samples stable start, checkpoint, and end frames", () => {
  const trace = createCanonicalConceptRoomTrace();
  const start = projectLinearEquationTrace(trace, 0);
  const middle = projectLinearEquationTrace(trace, 500);
  const end = projectLinearEquationTrace(trace, 1000);
  assert.deepEqual([start.frameId, middle.frameId, end.frameId], [
    "frame.initial", "frame.step.1", "frame.step.2"
  ]);
  assert.match(start.accessibleText, /2 times x plus 3 equals 8/);
  assert.match(end.accessibleText, /x equals 5 over 2/);
  assert.deepEqual(start.tokens.filter((token) => token.kind === "relation").map((token) => token.latex), ["="]);
  assert.equal(Object.isFrozen(end.tokens), true);
});

test("variable material identity persists across seek and rewind", () => {
  const trace = createCanonicalConceptRoomTrace();
  const projections = [0, 500, 1000, 500, 0].map((progress) =>
    projectLinearEquationTrace(trace, progress)
  );
  assert.deepEqual(projections.map((projection) =>
    projection.tokens.find((token) => token.side === "left" && token.kind === "term")?.semanticId
  ), ["term.two-x", "term.two-x", "term.two-x", "term.two-x", "term.two-x"]);
  assert.deepEqual(projections.map((projection) => projection.frameId), [
    "frame.initial", "frame.step.1", "frame.step.2", "frame.step.1", "frame.initial"
  ]);
});

test("projection reads trace frames without inventing or mutating mathematics", () => {
  const trace = createCanonicalConceptRoomTrace();
  const frame = trace.frames[1]!;
  const projection = projectLinearEquationFrame(trace, frame, 500);
  assert.equal(projection.equationSemanticId, frame.semanticIds.equation);
  assert.deepEqual(trace.frames[1], frame);
  assert.throws(() => projectLinearEquationTrace(trace, -1), /progress/);
});
