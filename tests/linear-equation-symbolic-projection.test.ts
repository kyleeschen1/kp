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

test("transition IR derives source, target, operation, and lineage only from the verified trace", () => {
  const trace = createCanonicalConceptRoomTrace();
  const start = projectLinearEquationTrace(trace, 0);
  const subtractMid = projectLinearEquationTrace(trace, 250);
  const divideStart = projectLinearEquationTrace(trace, 501);
  const end = projectLinearEquationTrace(trace, 1000);

  assert.equal(start.transition?.operationId, trace.operations[0]?.id);
  assert.equal(start.transition?.phase, "source");
  assert.equal(subtractMid.transition?.phase, "transform");
  assert.equal(subtractMid.transition?.sourceLayout.frameId, trace.frames[0]?.id);
  assert.equal(subtractMid.transition?.targetLayout.frameId, trace.frames[1]?.id);
  assert.deepEqual(subtractMid.transition?.operationApplications.map((item) => item.side), ["left", "right"]);
  assert.equal(divideStart.transition?.operationId, trace.operations[1]?.id);
  assert.equal(divideStart.transition?.phase, "introduce-operation");
  assert.equal(end.transition?.phase, "target");
  assert.equal(end.transition?.targetLayout.frameId, trace.frames[2]?.id);
  assert.equal(Object.isFrozen(subtractMid.transition?.lineage), true);
  assert.deepEqual(trace.frames.map((frame) => frame.id), ["frame.initial", "frame.step.1", "frame.step.2"]);
});

test("authored operation windows align verified transitions with concept checkpoints", () => {
  const trace = createCanonicalConceptRoomTrace();
  const options = {
    operationWindows: [
      { operationId: trace.operations[0]!.id, startPermille: 0, endPermille: 400 },
      { operationId: trace.operations[1]!.id, startPermille: 400, endPermille: 750 }
    ]
  } as const;
  assert.equal(projectLinearEquationTrace(trace, 400, options).transition?.phase, "target");
  assert.equal(projectLinearEquationTrace(trace, 401, options).transition?.operationId, trace.operations[1]!.id);
  assert.equal(projectLinearEquationTrace(trace, 750, options).transition?.phase, "target");
  assert.equal(projectLinearEquationTrace(trace, 1000, options).transition?.phase, "target");
  assert.equal(projectLinearEquationTrace(trace, 1000, options).transition?.operationId, trace.operations[1]!.id);
  assert.equal(projectLinearEquationTrace(trace, 1000, options).transition?.targetLayout.frameId, trace.frames[2]!.id);
  assert.throws(() => projectLinearEquationTrace(trace, 500, {
    operationWindows: [{ operationId: "wrong", startPermille: 0, endPermille: 1000 }]
  }), /operation windows/);
});

test("persistent continuants map source and target token IDs without glyph inference", () => {
  const transition = projectLinearEquationTrace(createCanonicalConceptRoomTrace(), 250).transition;
  const variable = transition?.lineage.find((item) => item.continuantId === "term.two-x");
  const equality = transition?.lineage.find((item) => item.continuantId === "relation.equals");
  assert.equal(variable?.continuity, "persistent");
  assert.match(variable?.sourceTokenId ?? "", /frame\.initial/);
  assert.match(variable?.targetTokenId ?? "", /frame\.step\.1/);
  assert.equal(equality?.continuity, "persistent");
  assert.equal(transition?.lineage.some((item) => item.continuantId.includes("latex")), false);
});

test("subtract-both-sides presentation derives paired exact operands and transformed material", () => {
  const transition = projectLinearEquationTrace(createCanonicalConceptRoomTrace(), 250).transition!;
  assert.equal(transition.operationApplications[0].kind, "subtract-both-sides");
  assert.deepEqual(transition.operationApplications.map((application) => application.operand), [
    { numerator: "3", denominator: "1" },
    { numerator: "3", denominator: "1" }
  ]);
  assert.deepEqual(transition.operationApplications.map((application) => application.operatorLatex), ["-", "-"]);
  assert.equal(transition.expandedLayout?.accessibleText, "2 times x plus 3 minus 3 equals 8 minus 3");
  assert.equal(transition.expandedLayout?.tokens.filter((token) =>
    token.semanticId === "operation.subtract-three"
  ).length, 4);
  assert.equal(transition.lineage.find((item) => item.continuantId === "term.two-x")?.continuity, "persistent");
  assert.equal(transition.lineage.find((item) => item.continuantId === "term.eight")?.continuity, "transformed");
});

test("divide-both-sides presentation derives matched exact fraction structures", () => {
  const transition = projectLinearEquationTrace(createCanonicalConceptRoomTrace(), 750).transition!;
  assert.equal(transition.operationApplications[0].kind, "divide-both-sides");
  assert.deepEqual(transition.operationApplications.map((application) => application.operand), [
    { numerator: "2", denominator: "1" },
    { numerator: "2", denominator: "1" }
  ]);
  assert.deepEqual(transition.expandedLayout?.tokens.map((token) => token.latex), [
    "\\frac{2x}{2}", "=", "\\frac{5}{2}"
  ]);
  assert.equal(transition.expandedLayout?.accessibleText, "2 times x divided by 2 equals 5 divided by 2");
  assert.equal(transition.expandedLayout?.tokens.filter((token) => token.id.endsWith(".fraction")).length, 2);
  assert.equal(transition.targetLayout.tokens.find((token) => token.side === "right")?.latex, "\\frac{5}{2}");
  assert.equal(transition.lineage.find((item) => item.continuantId === "term.two-x")?.continuity, "transformed");
});
