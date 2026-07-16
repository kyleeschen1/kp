import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const path =
  "docs/project/reviews/2026-07-16-phase-ordered-choreography-gestalt-style-loop-closeout.md";

test("choreography and gestalt closeout records outcomes and exact pins", async () => {
  const report = await readFile(path, "utf8");
  for (const section of [
    "## Outcome",
    "## Gestalt Styles",
    "## Focus Experiment",
    "## Generated Authoring And Promotion",
    "## Verification",
    "## Migration Guidance",
    "## Residual Risks And Deferred Work"
  ]) {
    assert.match(report, new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(report, /kp\.organic-subtle@1\.0\.0/);
  assert.match(report, /kp\.restrained-editorial@1\.0\.0/);
  assert.match(report, /1,170 tests passed/);
  assert.match(report, /30\s+editor browser tests passed/);
});

test("closeout keeps remaining limitations explicit", async () => {
  const report = await readFile(path, "utf8");
  assert.match(report, /Only the four equation proof families/);
  assert.match(report, /not yet plumbed through every\s+renderer/);
  assert.match(report, /Legacy LLM examples are audited but not retroactively promoted/);
  assert.match(report, /live model providers/i);
  assert.match(report, /not hidden completion claims/);
});
