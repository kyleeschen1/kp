import assert from "node:assert/strict";
import test from "node:test";

import {
  createLinearSolveExternalAnimationPort
} from "../src/animation/external-algebra-port.ts";
import {
  checkKpExternalAnimationPortLossDiagnostics,
  runKpExternalAnimationPort
} from "../src/animation/external-port.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  linearSolveLossyAlgebraTraceFixture,
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
    equationMotionPresentationRecipe: "continuity-v1",
    equationNativeHandoffRecipe: "atomic-v1",
    equationCancellationPresentationRecipe: "counter-orbit-v1",
    equationZeroWitnessPresentationRecipe: "none",
    equationSuccessorPresentationRecipe: "counter-convergence-v1",
    equationDepthPresentationRecipe: "semantic-depth-v1",
    equationContinuantPresentationRecipe: "transit-then-reflow-v1",
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

test("linear solve animation port surfaces algebra trace mismatch diagnostics", () => {
  const port = createLinearSolveExternalAnimationPort();
  const mismatchedTrace = {
    ...linearSolveAlgebraTraceFixture,
    steps: linearSolveAlgebraTraceFixture.steps.map((step) =>
      step.id === "trace.linear-solve.step.left-simplified"
        ? { ...step, latex: "x = 0" }
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
      partial: 1
    },
    codes: ["trace-latex-mismatch"],
    hasErrors: false,
    hasLoss: true,
    preservation: "lax"
  });
  assert.deepEqual(result.diagnostics, [
    {
      severity: "warning",
      code: "trace-latex-mismatch",
      lossKind: "partial",
      message:
        "Trace step trace.linear-solve.step.left-simplified latex does not match canonical object equation.linear-solve.left-simplified.",
      path: "steps[2].latex"
    }
  ]);
  assert.deepEqual(checkKpExternalAnimationPortLossDiagnostics(result), {
    lawId: "animation-port.loss-reporting",
    passed: true,
    failures: []
  });
});

test("linear solve animation port preserves reusable lossy fixture diagnostics", () => {
  const port = createLinearSolveExternalAnimationPort();
  const result = runKpExternalAnimationPort(
    port,
    linearSolveLossyAlgebraTraceFixture
  );

  assert.equal(result.preservation, "lax");
  assert.equal(
    result.animation.metadata?.["sourceTraceId"],
    "trace.linear-solve.lossy"
  );
  assert.deepEqual(result.diagnosticSummary, {
    total: 4,
    bySeverity: {
      info: 0,
      warning: 4,
      error: 0
    },
    byLossKind: {
      partial: 2,
      lossy: 2
    },
    codes: [
      "trace-latex-mismatch",
      "trace-transformation-mismatch",
      "trace-rule-mismatch",
      "trace-transformation-unknown"
    ],
    hasErrors: false,
    hasLoss: true,
    preservation: "lax"
  });
  assert.deepEqual(checkKpExternalAnimationPortLossDiagnostics(result), {
    lawId: "animation-port.loss-reporting",
    passed: true,
    failures: []
  });
});
