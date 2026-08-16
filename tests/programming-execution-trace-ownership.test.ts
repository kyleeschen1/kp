import { strict as assert } from "node:assert";
import test from "node:test";

import * as neutralTrace from "../src/domain-ir/programming-execution-trace.ts";
import * as tutorialTrace from "../src/tutorial/programming-execution-trace.ts";

test("tutorial programming trace compatibility path delegates to neutral domain IR", () => {
  assert.equal(
    tutorialTrace.createKpProgrammingExecutionTrace,
    neutralTrace.createKpProgrammingExecutionTrace
  );
  assert.equal(
    tutorialTrace.createKpProgrammingExecutionTraceFrame,
    neutralTrace.createKpProgrammingExecutionTraceFrame
  );
});
