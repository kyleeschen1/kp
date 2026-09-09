import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { authorTaskExample, checkAuthorTask } from "../scripts/author-check-owner-dispatch.ts";
import { runAuthorCheckCli } from "../scripts/author-check.ts";
import { inspectAuthorSourceLimits } from "../src/authoring/author-source-limits.ts";
import { supportedAuthorTasks, isSupportedAuthorTask } from "../src/authoring/supported-author-tasks.ts";

test("all selected domains reject foreign source and serialized report authority", async () => {
  for (const task of Object.keys(supportedAuthorTasks)) {
    assert.ok(isSupportedAuthorTask(task));
    const example = await authorTaskExample(task);
    const checked = await checkAuthorTask(task, JSON.stringify(example));
    assert.equal((await checkAuthorTask(task, JSON.stringify(checked))).status, "repair-gap");
    for (const other of Object.keys(supportedAuthorTasks)) {
      assert.ok(isSupportedAuthorTask(other));
      if (other !== task) assert.equal((await checkAuthorTask(other, JSON.stringify(example))).status, "repair-gap", `${task} into ${other}`);
    }
  }
});

test("size and nesting guards run before recursive domain checks, with quoted brackets preserved", async () => {
  const graph = structuredClone(await authorTaskExample("graph3d.saddle"));
  assert.ok(graph && typeof graph === "object");
  const json = JSON.stringify({ ...graph, extra: "NESTED" }).replace('"NESTED"', "[".repeat(6000) + "0" + "]".repeat(6000));
  for (const task of Object.keys(supportedAuthorTasks)) {
    assert.ok(isSupportedAuthorTask(task));
    for (const input of [json, "é".repeat(60_000)]) {
      const result = await checkAuthorTask(task, input);
      assert.equal(result.status, "repair-gap");
      assert.ok("diagnostic" in result.result);
      assert.match(result.result.diagnostic.code, /^author.source-(depth|size)$/);
    }
  }
  assert.equal(inspectAuthorSourceLimits(JSON.stringify({ text: '\\"' + "[".repeat(5000) + '"\\' })), undefined);
  assert.equal(inspectAuthorSourceLimits("[".repeat(64) + "0" + "]".repeat(64)), undefined);
  assert.equal(inspectAuthorSourceLimits("[".repeat(65) + "0" + "]".repeat(65))?.diagnostic.code, "author.source-depth");
  const result = await runAuthorCheckCli(["--task", "graph3d.saddle", "--request", "fixture"], () => json);
  assert.ok(result && typeof result === "object" && "kind" in result);
  assert.equal(result.kind, "author-invocation-gap");
});

test("market envelope rejects forged publication and proof fields", async () => {
  const source = await authorTaskExample("graph2d.supply-tax");
  assert.ok(source && typeof source === "object");
  for (const key of ["authority", "publishedRevision", "proof", "__proto__", "constructor"]) {
    const result = await checkAuthorTask("graph2d.supply-tax", JSON.stringify({ ...source, [key]: "forged" }));
    assert.equal(result.status, "repair-gap");
    assert.ok("diagnostic" in result.result);
    assert.equal(result.result.diagnostic.path, `$.${key}`);
  }
});

test("Graph3D semantic object key order is irrelevant while changed pins remain gaps", async () => {
  const source = JSON.parse(JSON.stringify(await authorTaskExample("graph3d.saddle")));
  const before = await checkAuthorTask("graph3d.saddle", JSON.stringify(source));
  source.intent.parameters = Object.fromEntries(Object.entries(source.intent.parameters).reverse());
  assert.deepEqual((await checkAuthorTask("graph3d.saddle", JSON.stringify(source))).result, before.result);
  source.intent.parameters.targetDenominator = 9;
  assert.equal((await checkAuthorTask("graph3d.saddle", JSON.stringify(source))).status, "repair-gap");
});

test("invalid UTF-8 and extreme nesting exit with a repair before owner loading", () => {
  const hook = `export function resolve(specifier, context, nextResolve) {
    if (specifier.includes("author-check-owner-dispatch")) throw new Error("Owner loaded before transport rejection");
    return nextResolve(specifier, context);
  }`;
  const script = `import { register } from "node:module";
    register(${JSON.stringify(`data:text/javascript,${encodeURIComponent(hook)}`)}, import.meta.url);
    const { runAuthorCheckCli } = await import("./scripts/author-check.ts");
    const result = await runAuthorCheckCli(["--task", "graph3d.saddle", "--request", "-" ]);
    if (result.kind !== "author-invocation-gap") throw new Error("Expected transport repair");`;
  for (const input of [Buffer.from([0xff]), Buffer.from("[".repeat(6000) + "0" + "]".repeat(6000))]) {
    const result = spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", "--input-type=module", "-e", script],
      { input, timeout: 30_000, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  }
});
