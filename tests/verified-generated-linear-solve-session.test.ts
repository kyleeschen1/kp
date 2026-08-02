import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalLinearProblem,
  verifyLinearSolution,
  verifyLinearStep
} from "../providers/linear-problems/public-api.ts";
import {
  createKpVerifiedGeneratedLinearSolveSession,
  kpVerifiedGeneratedLinearSolveAnimationId
} from "../src/tutorial/verified-generated-linear-solve-session.ts";
import {
  createKpVerifiedGeneratedLinearSolveRuntimeAsset
} from "../src/animation/verified-generated-linear-solve-runtime-asset.ts";

test("committed generated solve snapshot remains exact-provider verified", () => {
  const session = createKpVerifiedGeneratedLinearSolveSession();
  const problem = canonicalLinearProblem();
  const trace = session.bridge.trace;

  assert.equal(session.animation.animation.id,
    kpVerifiedGeneratedLinearSolveAnimationId);
  assert.equal(trace.provenance.problemId, problem.problemId);
  assert.deepEqual(trace.frames[0]?.equation, problem.equation);
  assert.deepEqual(trace.solution, problem.solution);
  assert.deepEqual(trace.provenance, {
    problemId: problem.problemId,
    ...problem.provenance
  });

  trace.operations.forEach((operation, index) => {
    const previous = trace.frames[index]?.equation;
    const candidate = trace.frames[index + 1]?.equation;
    assert.ok(previous);
    assert.ok(candidate);
    const result = verifyLinearStep({
      schemaVersion: "linear-problem.verify-step.request.v1",
      problem,
      previous,
      candidate
    });
    assert.equal(result.valid, true);
    assert.equal(result.operation, operation.kind);
    assert.deepEqual(result.diagnostics, []);
  });
  assert.equal(verifyLinearSolution({
    schemaVersion: "linear-problem.verify-solution.request.v1",
    problem,
    candidate: trace.solution
  }).valid, true);
});

test("generated session exposes deterministic animation, explanation, and static truth", () => {
  const first = createKpVerifiedGeneratedLinearSolveSession();
  const second = createKpVerifiedGeneratedLinearSolveSession();

  assert.equal(first, second);
  assert.equal(first.staticOutput.animationId,
    kpVerifiedGeneratedLinearSolveAnimationId);
  assert.equal(first.staticOutput.states.length, 6);
  assert.deepEqual(
    first.staticOutput.states.map(({ latex }) => latex),
    [
      "2x+3=8",
      "2x+3-3=8-3",
      "2x=8-3",
      "2x=5",
      "\\frac{2x}{2}=\\frac{5}{2}",
      "x=\\frac{5}{2}"
    ]
  );
  assert.deepEqual(
    first.explanation.projection.sections.flatMap(({ cues }) =>
      cues.map(({ wordCount }) => wordCount)
    ).every((wordCount) => wordCount <= 12),
    true
  );
  assert.equal(first.animation.animation.exportTargets.some(
    ({ kind }) => kind === "static-step"
  ), true);
});

test("production asset stays byte-equivalent to the trusted compiler output", () => {
  assert.equal(
    JSON.stringify(createKpVerifiedGeneratedLinearSolveRuntimeAsset()),
    JSON.stringify(
      createKpVerifiedGeneratedLinearSolveSession().animation.animation
    )
  );
});
