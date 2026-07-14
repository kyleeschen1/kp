import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpExternalAnimationPortLossDiagnostics,
  runKpExternalAnimationPort
} from "../src/animation/external-port.ts";
import {
  createAdditionProgramTraceExternalAnimationPort
} from "../src/animation/external-programming-port.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  createAdditionProgrammingCallstackLossyTraceFixture,
  createAdditionProgrammingExecutionTraceFixture
} from "../src/tutorial/programming-execution-trace-fixture.ts";

test("addition program trace imports as a sampleable AnimationAsset", () => {
  const fixture = createAdditionProgrammingExecutionTraceFixture();
  const port = createAdditionProgramTraceExternalAnimationPort();
  const result = runKpExternalAnimationPort(port, fixture.trace);

  assert.equal(
    result.portId,
    "port.animation.fixture.programming-trace.add"
  );
  assert.equal(result.sourceSystem, "fixture.programming.execution-trace");
  assert.equal(result.preservation, "strict");
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.animation.id, "animation.programming.add.execution-trace");
  assert.deepEqual(result.animation.metadata, {
    domain: "programming",
    placeholderContract: true,
    sourceFixtureId: "fixture.programming.add.execution-trace",
    behaviorId: "behavior.programming.add.execution-trace",
    sourcePortId: "port.animation.fixture.programming-trace.add",
    sourceSystem: "fixture.programming.execution-trace",
    sourceTraceId: "trace.programming.add"
  });

  const frame = sampleKpAnimationRuntimeFrame({
    animation: result.animation,
    progress: 0.4
  });

  assert.equal(frame.animationId, "animation.programming.add.execution-trace");
  assert.deepEqual(frame.activeTransformationIds, [
    "transform.programming.add.evaluate-return"
  ]);
  assert.deepEqual(frame.activeRenderTargets.map((target) => target.kind), [
    "programming"
  ]);
});

test("addition program trace port reports mismatched execution steps", () => {
  const fixture = createAdditionProgrammingExecutionTraceFixture();
  const port = createAdditionProgramTraceExternalAnimationPort();
  const mismatchedTrace = {
    ...fixture.trace,
    steps: fixture.trace.steps.map((step) =>
      step.stepId === "step.programming.add.output"
        ? { ...step, kind: "return" as const }
        : step
    )
  };
  const result = runKpExternalAnimationPort(port, mismatchedTrace);

  assert.equal(result.preservation, "lax");
  assert.deepEqual(result.diagnosticSummary, {
    total: 1,
    bySeverity: {
      info: 0,
      warning: 1,
      error: 0
    },
    byLossKind: {
      lossy: 1
    },
    codes: ["programming-trace-step-kind-mismatch"],
    hasErrors: false,
    hasLoss: true,
    preservation: "lax"
  });
  assert.deepEqual(result.diagnostics, [
    {
      severity: "warning",
      code: "programming-trace-step-kind-mismatch",
      lossKind: "lossy",
      message:
        "Programming trace step step.programming.add.output kind return does not match expected output.",
      path: "steps[3].kind"
    }
  ]);
  assert.deepEqual(checkKpExternalAnimationPortLossDiagnostics(result), {
    lawId: "animation-port.loss-reporting",
    passed: true,
    failures: []
  });
});

test("addition program trace port reports callstack source-range mismatches", () => {
  const fixture = createAdditionProgrammingCallstackLossyTraceFixture();
  const port = createAdditionProgramTraceExternalAnimationPort();
  const result = runKpExternalAnimationPort(port, fixture.trace);

  assert.equal(result.preservation, "lax");
  assert.equal(
    result.animation.metadata?.["sourceTraceId"],
    "trace.programming.add.callstack-lossy"
  );
  assert.deepEqual(result.diagnosticSummary, {
    total: 1,
    bySeverity: {
      info: 0,
      warning: 1,
      error: 0
    },
    byLossKind: {
      lossy: 1
    },
    codes: ["programming-trace-stack-selector-mismatch"],
    hasErrors: false,
    hasLoss: true,
    preservation: "lax"
  });
  assert.deepEqual(result.diagnostics, [
    {
      severity: "warning",
      code: "programming-trace-stack-selector-mismatch",
      lossKind: "lossy",
      message:
        "Programming trace step step.programming.add.call stack frame frame.programming.add selector selector.programming.add.missing does not match expected selector.programming.add.signature.",
      path: "steps[0].stack[0].selectorId"
    }
  ]);
  assert.deepEqual(checkKpExternalAnimationPortLossDiagnostics(result), {
    lawId: "animation-port.loss-reporting",
    passed: true,
    failures: []
  });
});
