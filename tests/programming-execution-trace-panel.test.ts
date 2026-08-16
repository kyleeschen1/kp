import { strict as assert } from "node:assert";
import test from "node:test";

import { createAdditionProgrammingExecutionTraceFixture } from
  "../src/domain-ir/programming-addition-trace-fixture.ts";
import {
  renderKpProgrammingExecutionTracePanelHtml
} from "../src/tutorial/programming-execution-trace-panel.ts";

test("execution trace panel renders current step metadata and state", () => {
  const fixture = createAdditionProgrammingExecutionTraceFixture();
  const html = renderKpProgrammingExecutionTracePanelHtml(
    fixture.sample(0.5)
  );

  assert.match(html, /data-kp-tutorial-panel="execution-trace"/);
  assert.match(
    html,
    /data-kp-tutorial-execution-trace="trace\.programming\.add"/
  );
  assert.match(
    html,
    /data-kp-tutorial-execution-step="step\.programming\.add\.evaluate-return"/
  );
  assert.match(html, /data-kp-tutorial-execution-kind="evaluate"/);
  assert.match(
    html,
    /data-kp-tutorial-execution-active-selector="selector\.programming\.add\.return"/
  );
  assert.match(html, /data-kp-tutorial-execution-stack-frame="frame\.programming\.add"/);
  assert.match(html, /data-kp-tutorial-execution-local-name="a"/);
  assert.match(html, />2</);
});

test("execution trace panel renders output frames", () => {
  const fixture = createAdditionProgrammingExecutionTraceFixture();
  const html = renderKpProgrammingExecutionTracePanelHtml(fixture.sample(1));

  assert.match(html, /data-kp-tutorial-execution-output-count="1"/);
  assert.match(html, /data-kp-tutorial-execution-output/);
  assert.match(html, />4</);
});
