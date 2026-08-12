import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpSchemeFactorialBindingChoreography,
  pointOnKpSchemeBindingArc,
  sampleKpSchemeBindingMotion
} from "../src/animation/scheme-factorial-binding-choreography.ts";
import { readKpSchemeFactorialTraceArtifact } from
  "../src/semantic/scheme-factorial-trace-artifact.ts";

const trace = readKpSchemeFactorialTraceArtifact().trace;
const choreography = compileKpSchemeFactorialBindingChoreography(trace);

test("compiles one arched binding path for each recursive call", () => {
  assert.equal(choreography.arcs.length, 4);
  assert.deepEqual(choreography.arcs.map(({ callIndex }) => callIndex),
    [0, 1, 2, 3]);
  assert.ok(choreography.arcs.every(({ route, controlPoints }) =>
    route === "arch" && controlPoints.length === 4));
  assert.equal(Object.isFrozen(choreography), true);
});

test("arches rise above the baseline and arrive at the parameter cell", () => {
  for (const arc of choreography.arcs) {
    assert.deepEqual(pointOnKpSchemeBindingArc(arc, 0),
      { inline: 0, block: 0 });
    assert.deepEqual(pointOnKpSchemeBindingArc(arc, 1),
      { inline: 1, block: 0 });
    assert.ok(pointOnKpSchemeBindingArc(arc, 0.5).block < -0.4);
  }
});

test("source is absorbed before a demand-driven echo appears", () => {
  const before = sampleKpSchemeBindingMotion(0.3);
  const absorbed = sampleKpSchemeBindingMotion(0.62);
  const echo = sampleKpSchemeBindingMotion(0.85);
  assert.ok(before.arcProgress > 0 && before.sourceOpacity === 1);
  assert.equal(absorbed.sourceOpacity, 0);
  assert.equal(absorbed.echoOpacity, 0);
  assert.ok(echo.parameterCellOpacity === 1 && echo.echoOpacity > 0);
});

test("each echo reuses one bound value identity at an exact occurrence", () => {
  assert.ok(choreography.echoes.length > choreography.arcs.length);
  for (const echo of choreography.echoes) {
    const arc = choreography.arcs[echo.callIndex]!;
    assert.equal(echo.bindingId, arc.bindingId);
    assert.equal(echo.valueId, arc.argumentValueId);
    assert.equal(echo.sourceOccurrenceId, arc.parameterOccurrenceId);
    assert.notEqual(echo.destinationOccurrenceId, echo.sourceOccurrenceId);
  }
  assert.ok(choreography.echoes.every(({ destinationOccurrenceId }) =>
    destinationOccurrenceId.includes(".occurrence.")));
});

test("binding motion is direct-seek and reverse stable", () => {
  const ascending = Array.from({ length: 201 }, (_, index) =>
    sampleKpSchemeBindingMotion(index / 200));
  const descending = Array.from({ length: 201 }, (_, index) =>
    sampleKpSchemeBindingMotion((200 - index) / 200)).reverse();
  assert.deepEqual(descending, ascending);
  assert.throws(() => sampleKpSchemeBindingMotion(Number.NaN), /finite/);
});
