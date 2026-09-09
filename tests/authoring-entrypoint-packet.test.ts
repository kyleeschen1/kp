import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runAuthoringTaskPacket } from "../scripts/run-authoring-task-packet.ts";
import { supportedAuthorTasks } from "../src/authoring/supported-author-tasks.ts";

test("published local packet executes exact successes and useful rejection cases without claiming model results", async () => {
  const report = await runAuthoringTaskPacket();
  assert.equal(report.status, "passed");
  assert.equal(report.externalModelCalls, 0);
  assert.equal(report.authorTime, "not-measured");
  assert.equal(report.comprehension, "not-measured");
  assert.deepEqual(report.results.map(task => task.bytes), [460, 946]);
  for (const task of report.results) {
    assert.equal(task.sourceFiles, 1);
    assert.equal(task.assessment.editorialQuality, "not-assessed");
    assert.ok(Object.values(task.checks).every(Boolean));
  }
});

test("generation guide routes through the executable packet without replacing domain ownership", () => {
  const guide = readFileSync("docs/project/authoring/llm-generation-entrypoint.md", "utf8");
  const packet = readFileSync("docs/project/authoring/supported-authoring-entrypoint-packet.md", "utf8");
  assert.ok(guide.includes("supported-authoring-entrypoint-packet.md"));
  for (const task of Object.keys(supportedAuthorTasks)) assert.ok(packet.includes(task), task);
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  for (const command of ["author:check", "author:assess", "check:authoring-task-packet"])
    assert.equal(typeof pkg.scripts[command], "string");
  assert.match(packet, /not a live-model/);
  assert.match(packet, /not-performed/);
});
