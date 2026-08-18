import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpEquationSeriesRuntime,
  sampleKpEquationSeriesRuntime,
  seekKpEquationSeriesCheckpoint
} from "../src/authoring/equation-series-runtime.ts";
import { resolveKpEquationSeriesIntents } from
  "../src/authoring/equation-series-intent-resolver.ts";
import { validateKpEquationTransformSeriesRequest } from
  "../src/authoring/equation-transform-series-request.ts";

test("arbitrary chain lengths compile one ordered clock with stable checkpoints", () => {
  for (const transitionCount of [1, 2, 3, 5, 8]) {
    const fixture = seriesFixture(transitionCount);
    const result = compileKpEquationSeriesRuntime({
      id: `runtime.equation.sequence-${transitionCount}.v1`,
      request: fixture.request,
      resolution: fixture.resolution
    });
    assert.equal(result.status, "compiled");
    if (result.status !== "compiled") continue;
    assert.equal(result.runtime.plans.length, transitionCount);
    assert.equal(result.runtime.checkpoints.length, transitionCount + 1);
    assert.deepEqual(
      result.runtime.checkpoints.map(({ position }) => position),
      Array.from({ length: transitionCount + 1 }, (_, index) => ({
        numerator: index,
        denominator: transitionCount
      }))
    );
    assert.equal(Object.isFrozen(result.runtime), true);
    assert.equal(Object.isFrozen(result.runtime.plans[0]?.declaration), true);
  }
});

test("forward rewind and direct seek are history independent", () => {
  const runtime = compiledRuntime(4);
  for (const presentationProgress of [0, 0.1, 0.25, 0.37, 0.5, 0.9, 1]) {
    const forward = sampleKpEquationSeriesRuntime(runtime, {
      direction: "forward",
      progress: presentationProgress
    });
    const rewind = sampleKpEquationSeriesRuntime(runtime, {
      direction: "rewind",
      progress: 1 - presentationProgress
    });
    assert.deepEqual(presentationProjection(forward), presentationProjection(rewind));
  }
  const first = sampleKpEquationSeriesRuntime(runtime, {
    direction: "forward",
    progress: 0.73
  });
  sampleKpEquationSeriesRuntime(runtime, { direction: "forward", progress: 0.12 });
  const repeat = sampleKpEquationSeriesRuntime(runtime, {
    direction: "forward",
    progress: 0.73
  });
  assert.deepEqual(first, repeat);
});

test("exact seams settle one checkpoint and belong to the incoming adjacency", () => {
  const runtime = compiledRuntime(4);
  const seam = sampleKpEquationSeriesRuntime(runtime, {
    direction: "forward",
    progress: 0.5
  });
  assert.equal(seam.activePlanIndex, 2);
  assert.equal(seam.activePlanProgress, 0);
  assert.equal(seam.settledCheckpointId, runtime.checkpoints[2]?.id);
  const before = sampleKpEquationSeriesRuntime(runtime, {
    direction: "forward",
    progress: 0.5 - 1e-5
  });
  assert.equal(before.activePlanIndex, 1);
  assert.ok(before.activePlanProgress > 0.99);
});

test("checkpoint seek is exact in both directions and requires no replay", () => {
  const runtime = compiledRuntime(3);
  runtime.checkpoints.forEach((checkpoint) => {
    const forward = seekKpEquationSeriesCheckpoint({
      runtime,
      checkpointId: checkpoint.id,
      direction: "forward"
    });
    const rewind = seekKpEquationSeriesCheckpoint({
      runtime,
      checkpointId: checkpoint.id,
      direction: "rewind"
    });
    assert.equal(forward?.settledCheckpointId, checkpoint.id);
    assert.equal(rewind?.settledCheckpointId, checkpoint.id);
    assert.deepEqual(
      forward === undefined ? undefined : presentationProjection(forward),
      rewind === undefined ? undefined : presentationProjection(rewind)
    );
  });
  assert.equal(seekKpEquationSeriesCheckpoint({
    runtime,
    checkpointId: "checkpoint.unknown"
  }), undefined);
});

test("unresolved or out-of-order plans produce no partial runtime", () => {
  const fixture = seriesFixture(2);
  const unresolved = compileKpEquationSeriesRuntime({
    id: "runtime.equation.unresolved.v1",
    request: fixture.request,
    resolution: {
      status: "repair-required",
      analyses: [],
      repairs: []
    }
  });
  assert.equal(unresolved.status, "repair-required");
  assert.equal("runtime" in unresolved, false);
  const resolved = fixture.resolution;
  if (resolved.status !== "resolved") throw new Error("fixture must resolve");
  const forged = {
    ...resolved,
    plans: [...resolved.plans].reverse()
  } as typeof resolved;
  const result = compileKpEquationSeriesRuntime({
    id: "runtime.equation.forged.v1",
    request: fixture.request,
    resolution: forged
  });
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.ok(result.issues.some(({ code }) =>
    code === "equation-series.runtime.plan-order"
  ));
});

test("series runtime projects the shared clock without timers renderers or schedulers", () => {
  const source = readFileSync(new URL(
    "../src/authoring/equation-series-runtime.ts",
    import.meta.url
  ), "utf8");
  assert.match(source, /sampleKpSynchronizedModelProjectionProgress/u);
  assert.doesNotMatch(
    source,
    /(?:requestAnimationFrame|setTimeout|setInterval|Date\.now|performance\.now|HTMLElement|SVGElement|WebGL|renderer)/u
  );
});

function compiledRuntime(transitionCount: number) {
  const fixture = seriesFixture(transitionCount);
  const result = compileKpEquationSeriesRuntime({
    id: `runtime.equation.test-${transitionCount}.v1`,
    request: fixture.request,
    resolution: fixture.resolution
  });
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") throw new Error("fixture must compile");
  return result.runtime;
}

function seriesFixture(transitionCount: number) {
  const states = Array.from({ length: transitionCount + 1 }, (_, index) => ({
    id: `state.sequence.${index}`,
    latex: `x_${index}`
  }));
  const adjacencies = Array.from({ length: transitionCount }, (_, index) => ({
    id: `adjacency.sequence.${index}`,
    fromStateId: states[index]!.id,
    toStateId: states[index + 1]!.id,
    intent: {
      mode: "explicit" as const,
      operationId: "kp.algebra.wrap-function",
      semanticArguments: { index }
    }
  }));
  const validated = validateKpEquationTransformSeriesRequest({
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: `series.sequence.${transitionCount}`,
    states,
    adjacencies
  });
  assert.equal(validated.status, "accepted");
  if (validated.status !== "accepted") throw new Error("fixture must validate");
  const resolution = resolveKpEquationSeriesIntents({
    request: validated.request
  });
  assert.equal(resolution.status, "resolved");
  return { request: validated.request, resolution };
}

function presentationProjection(frame: {
  readonly presentationProgress: number;
  readonly activePlanIndex: number;
  readonly activePlanProgress: number;
  readonly sourceCheckpointId: string;
  readonly targetCheckpointId: string;
  readonly settledCheckpointId?: string | undefined;
}) {
  return {
    presentationProgress: frame.presentationProgress,
    activePlanIndex: frame.activePlanIndex,
    activePlanProgress: frame.activePlanProgress,
    sourceCheckpointId: frame.sourceCheckpointId,
    targetCheckpointId: frame.targetCheckpointId,
    settledCheckpointId: frame.settledCheckpointId
  };
}
