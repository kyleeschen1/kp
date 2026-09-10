import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { isSupportedAuthorTask, supportedAuthorTasks } from "../src/authoring/supported-author-tasks.ts";

test("inventory names the approved tasks and existing owners without importing renderers", () => {
  assert.deepEqual(Object.keys(supportedAuthorTasks), ["equation.composed-algebra", "equation.common-factor", "bayes.binary", "equation.logarithm-base", "reasoning.equation", "reasoning.code", "graph3d.saddle", "graph2d.supply-tax"]);
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  for (const task of Object.values(supportedAuthorTasks)) {
    assert.ok(existsSync(task.owner), task.owner);
    if (task.extraction.kind === "domain-owned") assert.ok(existsSync(task.extraction.owner));
    if (task.publication.kind !== "unsupported") assert.equal(typeof pkg.scripts[task.publication.command], "string");
  }
  const source = readFileSync("src/authoring/supported-author-tasks.ts", "utf8");
  assert.doesNotMatch(source, /^import /m);
});

test("discovery cannot imply applied revisions or cross-domain publication parity", () => {
  assert.match(supportedAuthorTasks["equation.common-factor"].input, /single-digit/);
  assert.match(supportedAuthorTasks["equation.common-factor"].input, /unsupported-presentation/);
  assert.equal(supportedAuthorTasks["graph2d.supply-tax"].preview.kind, "local-source-build");
  assert.equal(supportedAuthorTasks["reasoning.code"].preview.kind, "reference-only");
  assert.equal(supportedAuthorTasks["equation.logarithm-base"].publication.kind, "enclosing-source-edition");
  for (const task of ["reasoning.code", "graph3d.saddle"] as const)
    assert.equal(supportedAuthorTasks[task].publication.kind, "unsupported");
  for (const value of [null, {}, "", "constructor", "__proto__", "equation", "bayes.arbitrary-tree"])
    assert.equal(isSupportedAuthorTask(value), false);
  for (const value of Object.keys(supportedAuthorTasks)) assert.equal(isSupportedAuthorTask(value), true);
});
