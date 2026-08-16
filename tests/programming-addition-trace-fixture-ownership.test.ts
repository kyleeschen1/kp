import { strict as assert } from "node:assert";
import test from "node:test";

import * as neutralFixture from
  "../src/domain-ir/programming-addition-trace-fixture.ts";
import * as tutorialFixture from
  "../src/tutorial/programming-execution-trace-fixture.ts";

test("tutorial trace fixture path delegates to neutral domain IR", () => {
  assert.equal(
    tutorialFixture.createAdditionProgrammingExecutionTraceFixture,
    neutralFixture.createAdditionProgrammingExecutionTraceFixture
  );
  assert.equal(
    tutorialFixture.createAdditionProgrammingCallstackLossyTraceFixture,
    neutralFixture.createAdditionProgrammingCallstackLossyTraceFixture
  );
});
