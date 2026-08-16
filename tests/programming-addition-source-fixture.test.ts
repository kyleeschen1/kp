import { strict as assert } from "node:assert";
import test from "node:test";

import { createAdditionProgrammingSourceFixture } from
  "../src/domain-ir/programming-addition-source-fixture.ts";
import { createAdditionProgrammingTutorialCardSample } from
  "../src/tutorial/programming-card-sample.ts";
import { createAdditionProgrammingExecutionTraceFixture } from
  "../src/domain-ir/programming-addition-trace-fixture.ts";

test("addition source identity is shared by trace and tutorial projections", () => {
  const source = createAdditionProgrammingSourceFixture();
  const trace = createAdditionProgrammingExecutionTraceFixture();
  const tutorial = createAdditionProgrammingTutorialCardSample();

  assert.equal(source.id, "fixture.programming.add.source");
  assert.equal(source.sharedClockId, "clock.programming.add-demo");
  assert.deepEqual(trace.sourceFile, source.sourceFile);
  assert.deepEqual(trace.selectors, source.selectors);
  assert.deepEqual(tutorial.sourceFile, source.sourceFile);
  assert.deepEqual(tutorial.selectors, source.selectors);
  assert.equal(tutorial.panel.sharedClockId, source.sharedClockId);
});
