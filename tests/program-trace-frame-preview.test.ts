import assert from "node:assert/strict";
import test from "node:test";

import {
  createProgramTraceFramePreviewSample
} from "../src/animation/program-trace-frame-preview.ts";

test("createProgramTraceFramePreviewSample projects runtime and execution trace state", () => {
  const sample = createProgramTraceFramePreviewSample({
    progress: 1 / 3
  });
  const preview = sample.preview;

  assert.equal(sample.runtimeFrame.phase.phaseId, "animation.programming.add.execution-trace.forward.1");
  assert.equal(sample.traceFrame.stepId, "step.programming.add.evaluate-return");
  assert.equal(preview.id, "program-trace-preview.runtime.programming.add.preview");
  assert.equal(preview.kind, "program-trace-frame-preview");
  assert.equal(preview.animationId, "animation.programming.add.execution-trace");
  assert.equal(preview.runtimeFrameId, "runtime.programming.add.preview");
  assert.equal(preview.traceId, "trace.programming.add");
  assert.equal(preview.sourceFileId, "source-file.programming.add");
  assert.deepEqual(preview.activeTransformationIds, [
    "transform.programming.add.evaluate-return"
  ]);
  assert.deepEqual(preview.step, {
    stepIndex: 1,
    stepId: "step.programming.add.evaluate-return",
    kind: "evaluate",
    summary: "Evaluate the return expression."
  });
  assert.deepEqual(preview.activeSelectorIds, [
    "selector.programming.add.return"
  ]);
  assert.deepEqual(preview.stackFrames, [
    {
      frameId: "frame.programming.add",
      functionName: "add",
      sourceFileId: "source-file.programming.add",
      selectorId: "selector.programming.add.signature"
    }
  ]);
  assert.deepEqual(preview.locals, [
    { name: "a", value: "2", type: "number" },
    { name: "b", value: "2", type: "number" }
  ]);
  assert.deepEqual(preview.output, []);
  assert.ok(
    preview.searchFields.includes(
      "program-trace-step:step.programming.add.evaluate-return"
    )
  );
  assert.ok(preview.searchFields.includes("program-local:a=2"));
});
