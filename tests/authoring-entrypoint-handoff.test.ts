import assert from "node:assert/strict";
import test from "node:test";
import { authorTaskExample, checkAuthorTask } from "../scripts/author-check-owner-dispatch.ts";
import { supportedAuthorTasks, isSupportedAuthorTask } from "../src/authoring/supported-author-tasks.ts";

test("all task reports carry instructions, never an applied or published revision", async () => {
  for (const task of Object.keys(supportedAuthorTasks)) {
    assert.ok(isSupportedAuthorTask(task));
    for (const json of [JSON.stringify(await authorTaskExample(task)), "{}"]) {
      const report = await checkAuthorTask(task, json);
      assert.equal(report.handoff.execution, "not-performed");
      assert.equal(report.handoff.capabilities, supportedAuthorTasks[task]);
      assert.equal("appliedRevision" in report.handoff, false);
      assert.equal("publishedRevision" in report.handoff, false);
    }
  }
});

test("capability variants keep reference, build, explicit Apply and owner-routed hosts distinct", () => {
  const tasks = supportedAuthorTasks;
  assert.equal(tasks["bayes.binary"].preview.kind, "explicit-apply");
  assert.equal(tasks["reasoning.equation"].preview.kind, "explicit-apply");
  assert.equal(tasks["equation.logarithm-base"].preview.kind, "explicit-apply");
  assert.equal(tasks["graph2d.supply-tax"].preview.kind, "local-source-build");
  assert.equal(tasks["reasoning.code"].preview.kind, "reference-only");
  assert.equal(tasks["graph3d.saddle"].preview.kind, "owner-routed");
  assert.equal(tasks["reasoning.code"].publication.kind, "unsupported");
  assert.equal(tasks["graph3d.saddle"].publication.kind, "unsupported");
  assert.equal(tasks["equation.logarithm-base"].publication.kind, "enclosing-source-edition");
});
