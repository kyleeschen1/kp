import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createAdditionProgrammingExecutionTraceFixture
} from "../src/tutorial/programming-execution-trace-fixture.ts";

test("addition programming execution trace fixture samples deterministic steps", () => {
  const fixture = createAdditionProgrammingExecutionTraceFixture();

  assert.equal(fixture.id, "fixture.programming.add.execution-trace");
  assert.equal(fixture.trace.traceId, "trace.programming.add");
  assert.deepEqual(
    fixture.trace.steps.map((step) => step.stepId),
    [
      "step.programming.add.call",
      "step.programming.add.evaluate-return",
      "step.programming.add.return",
      "step.programming.add.output"
    ]
  );

  const start = fixture.sample(0);
  const middle = fixture.sample(0.5);
  const end = fixture.sample(1);

  assert.equal(start.stepId, "step.programming.add.call");
  assert.equal(start.stack[0]?.functionName, "add");
  assert.deepEqual(start.locals.map((local) => local.name), ["a", "b"]);

  assert.equal(middle.stepId, "step.programming.add.evaluate-return");
  assert.deepEqual(middle.activeSelectorIds, [
    "selector.programming.add.return"
  ]);
  assert.deepEqual(fixture.sample(0.5), middle);

  assert.equal(end.stepId, "step.programming.add.output");
  assert.deepEqual(end.stack, []);
  assert.deepEqual(end.output, ["4"]);
});

test("addition programming execution trace fixture clamps progress", () => {
  const fixture = createAdditionProgrammingExecutionTraceFixture();

  assert.equal(fixture.sample(Number.NaN).progress, 0);
  assert.equal(fixture.sample(2).progress, 1);
});
