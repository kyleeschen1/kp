import assert from "node:assert/strict";
import test from "node:test";

import {
  createLinearSolveExternalAnimationPort
} from "../src/animation/external-algebra-port.ts";
import {
  runKpExternalAnimationPort
} from "../src/animation/external-port.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  linearSolveAlgebraTraceFixture
} from "../src/semantic/algebra-trace-port-fixture.ts";

test("linear solve algebra trace imports as a sampleable AnimationAsset", () => {
  const port = createLinearSolveExternalAnimationPort();
  const result = runKpExternalAnimationPort(
    port,
    linearSolveAlgebraTraceFixture
  );

  assert.equal(
    result.portId,
    "port.animation.fixture.algebra-trace.linear-solve"
  );
  assert.equal(result.sourceSystem, "fixture.algebra-trace");
  assert.equal(result.preservation, "strict");
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.animation.id, "animation.linear-solve.solve-x");
  assert.deepEqual(result.animation.metadata, {
    sourceAnimationId: "linear-equation-solve-x",
    sourcePortId: "port.fixture.algebra-trace.linear-solve",
    sourceSystem: "fixture.algebra-trace",
    sourceTraceId: "trace.linear-solve"
  });
  assert.equal(
    result.animation.bundle.objects[2]?.provenance?.sourceIds[0],
    "trace.linear-solve.step.left-simplified"
  );

  const frame = sampleKpAnimationRuntimeFrame({
    animation: result.animation,
    progress: 0.5
  });

  assert.equal(frame.animationId, "animation.linear-solve.solve-x");
  assert.deepEqual(frame.activeTransformationIds, [
    "transform.linear-solve.cancel-left-additive-inverse"
  ]);
});
