import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { authorTaskExample, checkAuthorTask } from "../scripts/author-check-owner-dispatch.ts";
import { compileBayesPublication, verifyBayesPublication } from "../scripts/build-bayesian-edition.ts";
import { compileReasoningPublication, verifyReasoningPublication } from "../scripts/build-reasoning-edition.ts";
import { compileKpAuthoringMarketPublication, serializeKpAuthoringMarketPublication } from "../scripts/compile-authoring-market-publication.ts";
import { supportedAuthorTasks } from "../src/authoring/supported-author-tasks.ts";

test("Bayes and reasoning handoffs reproduce the checked revision from exact selected bytes", async () => {
  for (const [task, compile, verify] of [
    ["bayes.binary", compileBayesPublication, verifyBayesPublication],
    ["reasoning.equation", compileReasoningPublication, verifyReasoningPublication]
  ] as const) {
    const text = JSON.stringify(await authorTaskExample(task), null, 2) + "\n";
    const report = await checkAuthorTask(task, text);
    assert.equal(report.status, "checked");
    assert.ok("revisionId" in report.result);
    const artifact = compile(text, "selected.json");
    assert.equal(artifact.payload.revisionId, report.result.revisionId);
    verify(artifact, text, "selected.json");
    assert.throws(() => verify(artifact, text + "\n", "selected.json"), /reproduce/);
    assert.throws(() => compile(JSON.stringify(report), "report.json"));
    assert.doesNotMatch(artifact.payload.reading.html, /<script\b/);
    assert.equal(supportedAuthorTasks[task].publication.output, "immutable-content-addressed");
  }
});

test("numeric publication needs a selected market envelope; unsupported owners gain no builder", async () => {
  const numeric = readFileSync("content/authoring/r4a-logarithm-base.json", "utf8");
  assert.equal((await checkAuthorTask("equation.logarithm-base", numeric)).status, "checked");
  assert.throws(() => compileKpAuthoringMarketPublication({ sourceText: numeric, sourcePath: "bare.json" }));
  const market = await authorTaskExample("graph2d.supply-tax");
  assert.ok(market && typeof market === "object");
  const sourceText = JSON.stringify({ ...market, equationRequest: JSON.parse(numeric) });
  const input = { sourceText, sourcePath: "selected.market.json" };
  const artifact = compileKpAuthoringMarketPublication(input);
  assert.equal((await checkAuthorTask("graph2d.supply-tax", sourceText)).status, "checked");
  assert.deepEqual(JSON.parse(serializeKpAuthoringMarketPublication(artifact, input)), artifact);
  assert.throws(() => serializeKpAuthoringMarketPublication(artifact, { ...input, sourceText: sourceText + "\n" }), /source identity/);
  assert.match(artifact.payload.reading.html, /data-kp-authoring-equation-static/);
  assert.doesNotMatch(artifact.payload.reading.html, /<script\b/);
  assert.equal(supportedAuthorTasks["graph2d.supply-tax"].publication.output, "rebuildable-named-directory");
  for (const task of ["reasoning.code", "graph3d.saddle"] as const)
    assert.equal(supportedAuthorTasks[task].publication.kind, "unsupported");
});
