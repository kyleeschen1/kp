import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createKpProgrammingExecutionTrace,
  createKpProgrammingExecutionTraceFrame
} from "../src/tutorial/programming-execution-trace.ts";

test("programming execution trace frame carries current step state", () => {
  const trace = createKpProgrammingExecutionTrace({
    traceId: "trace.programming.add",
    sourceFileId: "source-file.programming.add",
    sharedClockId: "clock.programming.add-demo",
    steps: [
      {
        stepId: "step.programming.add.return",
        kind: "evaluate",
        progress: 0.5,
        summary: "Evaluate the return expression.",
        selectorIds: ["selector.programming.add.return"],
        stack: [
          {
            frameId: "frame.programming.add",
            functionName: "add",
            sourceFileId: "source-file.programming.add",
            selectorId: "selector.programming.add.signature"
          }
        ],
        locals: [
          { name: "a", value: "2", type: "number" },
          { name: "b", value: "2", type: "number" }
        ],
        output: ["4"]
      }
    ]
  });

  assert.deepEqual(
    createKpProgrammingExecutionTraceFrame({
      trace,
      stepIndex: 0,
      progress: 0.5
    }),
    {
      traceId: "trace.programming.add",
      sourceFileId: "source-file.programming.add",
      sharedClockId: "clock.programming.add-demo",
      progress: 0.5,
      stepIndex: 0,
      stepId: "step.programming.add.return",
      kind: "evaluate",
      summary: "Evaluate the return expression.",
      activeSelectorIds: ["selector.programming.add.return"],
      stack: [
        {
          frameId: "frame.programming.add",
          functionName: "add",
          sourceFileId: "source-file.programming.add",
          selectorId: "selector.programming.add.signature"
        }
      ],
      locals: [
        { name: "a", value: "2", type: "number" },
        { name: "b", value: "2", type: "number" }
      ],
      output: ["4"]
    }
  );
});

test("programming execution trace frame normalizes progress and validates steps", () => {
  const trace = createKpProgrammingExecutionTrace({
    traceId: "trace.programming.empty-output",
    sourceFileId: "source-file.programming.add",
    sharedClockId: "clock.programming.add-demo",
    steps: [
      {
        stepId: "step.programming.add.call",
        kind: "call",
        progress: 0,
        selectorIds: ["selector.programming.add.signature"],
        stack: [],
        locals: []
      }
    ]
  });

  assert.equal(
    createKpProgrammingExecutionTraceFrame({
      trace,
      stepIndex: 0,
      progress: 2
    }).progress,
    1
  );

  assert.throws(
    () =>
      createKpProgrammingExecutionTrace({
        traceId: "trace.programming.invalid",
        sourceFileId: "source-file.programming.add",
        sharedClockId: "clock.programming.add-demo",
        steps: []
      }),
    /at least one step/
  );
  assert.throws(
    () =>
      createKpProgrammingExecutionTraceFrame({
        trace,
        stepIndex: 1,
        progress: 0
      }),
    /does not contain step index 1/
  );
});
