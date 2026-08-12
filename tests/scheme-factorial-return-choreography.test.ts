import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpSchemeFactorialReturnChoreography,
  sampleKpSchemeFactorialReturn
} from "../src/animation/scheme-factorial-return-choreography.ts";
import { kpSchemeFactorialCheckpoints } from
  "../src/semantic/scheme-factorial-checkpoints.ts";
import { readKpSchemeFactorialTraceArtifact } from
  "../src/semantic/scheme-factorial-trace-artifact.ts";

const trace = readKpSchemeFactorialTraceArtifact().trace;
const choreography = compileKpSchemeFactorialReturnChoreography({
  trace,
  checkpoints: kpSchemeFactorialCheckpoints
});

test("starts from the exact base value and ends at exact six", () => {
  assert.equal(choreography.baseExactInteger, 1);
  assert.equal(choreography.finalExactInteger, 6);
  assert.equal(choreography.steps.length, 3);
  assert.deepEqual(choreography.steps.map(({ exactResult }) => exactResult),
    [1, 2, 6]);
  assert.equal(Object.isFrozen(choreography), true);
});

test("return steps reopen deepest waiting work first", () => {
  const eventIndices = new Map(trace.events.map(({ id, index }) => [id, index]));
  assert.deepEqual(choreography.steps.map(({ returnEventId }) =>
    eventIndices.get(returnEventId)), [94, 96, 98]);
  assert.ok(choreography.steps.every(({ multiplicationEventId,
    returnEventId }) => eventIndices.get(multiplicationEventId!)! <
    eventIndices.get(returnEventId)!));
  assert.deepEqual(choreography.steps.map(({ shellContinuationId }) =>
    trace.snapshots.find(({ state }) =>
      state.activeContinuationId === shellContinuationId)?.state.continuations
      .find(({ id }) => id === shellContinuationId)?.kind),
  ["application-arguments", "application-arguments", "application-arguments"]);
});

test("one carrier persists while value identity changes only at multiplication", () => {
  assert.equal(choreography.carrierId, "scheme-factorial.return-carrier");
  for (let index = 0; index < choreography.steps.length; index += 1) {
    const step = choreography.steps[index]!;
    const expectedIncoming = index === 0
      ? choreography.baseValueId
      : choreography.steps[index - 1]!.outgoingValueId;
    assert.equal(step.incomingValueId, expectedIncoming);
    assert.notEqual(step.incomingValueId, step.outgoingValueId);
  }
});

test("base hold precedes travel reopen and readable product reveal", () => {
  const frames = Array.from({ length: 501 }, (_, index) =>
    sampleKpSchemeFactorialReturn(choreography, index / 500));
  assert.ok(frames.filter(({ progress }) => progress <= 0.18)
    .every(({ phase, carrierExactInteger }) =>
      phase === "base-hold" && carrierExactInteger === 1));
  for (const phase of ["travel", "reopen", "multiply", "settled"] as const) {
    assert.ok(frames.some((frame) => frame.phase === phase), `contains ${phase}`);
  }
  assert.deepEqual([...new Set(frames.filter(({ productRevealProgress }) =>
    productRevealProgress === 1).map(({ carrierExactInteger }) =>
    carrierExactInteger))], [1, 2, 6]);
});

test("return sampling is direct-seek and exactly reversible", () => {
  const ascending = Array.from({ length: 301 }, (_, index) =>
    sampleKpSchemeFactorialReturn(choreography, index / 300));
  const descending = Array.from({ length: 301 }, (_, index) =>
    sampleKpSchemeFactorialReturn(choreography, (300 - index) / 300)).reverse();
  assert.deepEqual(descending, ascending);
  assert.deepEqual(sampleKpSchemeFactorialReturn(choreography, 1), {
    progress: 1,
    phase: "settled",
    activeStepIndex: 2,
    carrierValueId: choreography.finalValueId,
    carrierExactInteger: 6,
    travelProgress: 1,
    shellReopenProgress: 1,
    productRevealProgress: 1,
    resolvedStepCount: 3
  });
  assert.throws(() => sampleKpSchemeFactorialReturn(choreography, Number.NaN),
    /finite/);
});
