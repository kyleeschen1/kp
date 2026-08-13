import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpPythonRefactorTokenProgram,
  sampleKpPythonRefactorTokenTheater
} from "../src/animation/python-refactor-token-theater.ts";
import { createKpPythonRefactorMotionPlan } from
  "../src/animation/python-refactor-motion-plan.ts";
import { readKpPythonRefactorSemanticArtifact } from
  "../src/semantic/python-refactor-semantic-artifact.ts";
import { createKpPythonRefactorOperationSet } from
  "../src/semantic/python-refactor-operations.ts";
import { createKpPythonRefactorScore } from
  "../src/semantic/python-refactor-score.ts";

const semantics = readKpPythonRefactorSemanticArtifact();
const operations = createKpPythonRefactorOperationSet(semantics);
const score = createKpPythonRefactorScore();
const plan = createKpPythonRefactorMotionPlan({ semantics, operations, score });
const program = createKpPythonRefactorTokenProgram(semantics);

test("duplicate Python rules visibly converge on their shared helper", () => {
  const early = sample(0.37);
  const late = sample(0.47);
  const earlyTransit = early.tokens.filter(({ role }) => role === "transit");
  const lateById = new Map(late.tokens.map((token) => [token.id, token]));

  assert.equal(early.activeTrackId, "motion.python.merge-threshold-rules");
  assert.equal(earlyTransit.length, 6);
  assert.equal(earlyTransit.filter(({ text }) => text === ">=").length, 2);
  assert.ok(earlyTransit.some((token) => {
    const later = lateById.get(token.id);
    return later !== undefined &&
      (Math.abs(later.xCh - token.xCh) > 0.5 || Math.abs(later.yLine - token.yLine) > 0.5);
  }));
});

test("Python threshold bundles arrive before settled source takes ownership", () => {
  const arrived = sample(0.45);
  const transit = arrived.tokens.filter(({ role }) => role === "transit");
  const targetByText = new Map(arrived.tokens
    .filter(({ entityId, role }) =>
      entityId === "rule.qualifies.after" && role === "focus"
    )
    .map((token) => [token.text, token] as const));

  assert.equal(arrived.activeTrackId, "motion.python.merge-threshold-rules");
  assert.equal(transit.length, 6);
  transit.forEach((token) => {
    const target = targetByText.get(token.text);
    assert.ok(target, `missing settled destination for ${token.text}`);
    assert.equal(token.xCh, target.xCh);
    assert.equal(token.yLine, target.yLine);
    assert.equal(token.opacity, 1);
    assert.equal(token.scale, 1);
    assert.equal(target.opacity, 0);
  });
});

test("Python helper binding propagates while the caller argument keeps identity", () => {
  const frame = sample(0.59);
  const transit = frame.tokens.filter(({ role, entityId }) =>
    role === "transit" && entityId === "call.shipping-cost.after"
  );

  assert.equal(frame.activeTrackId, "motion.python.propagate-helper-to-cost");
  assert.deepEqual(transit.map(({ text }) => text), [
    "qualifies_for_free_shipping",
    "total"
  ]);
  assert.ok(frame.tokens.some(({ text, role }) => text === "(" && role === "focus"));
  assert.ok(frame.tokens.some(({ text, role }) => text === ")" && role === "focus"));
});

test("moving Python tokens preserve build-derived syntax and semantic ownership", () => {
  const frame = sample(0.59);
  const movingFunction = frame.tokens.find(({ text, role }) =>
    text === "qualifies_for_free_shipping" && role === "transit"
  );
  const movingArgument = frame.tokens.find(({ text, role }) =>
    text === "total" && role === "transit"
  );

  assert.equal(movingFunction?.kind, "function");
  assert.equal(movingArgument?.kind, "identifier");
  assert.ok(frame.tokens.every(({ entityId }) => entityId.length > 0));
  assert.ok(frame.tokens.some(({ text, kind }) => text === "50" && kind === "number"));
  assert.ok(frame.tokens.some(({ text, kind }) =>
    text === '"Free shipping"' && kind === "string"
  ));
});

test("Python direct seek, rewind, reduced motion, and endpoints are deterministic", () => {
  const points = [0, 0.2, 0.3, 0.37, 0.47, 0.59, 0.76, 0.84, 1];
  const forward = points.map((progress) => sample(progress));
  const rewind = [...points].reverse().map((progress) => sample(progress)).reverse();

  assert.deepEqual(rewind, forward);
  assert.equal(forward[0]?.active, false);
  assert.equal(forward.at(-1)?.active, false);
  assert.deepEqual(sample(0.59, true), {
    active: false,
    localProgress: 0,
    tokens: [],
    maxLineCount: program.maxLineCount
  });
});

function sample(progress: number, reducedMotion = false) {
  return sampleKpPythonRefactorTokenTheater({
    program,
    plan,
    score,
    progress,
    reducedMotion
  });
}
