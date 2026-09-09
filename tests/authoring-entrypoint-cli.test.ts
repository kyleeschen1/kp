import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { authorSourceByteLimit, readAuthorSource, runAuthorCheckCli } from "../scripts/author-check.ts";
import { supportedAuthorTasks } from "../src/authoring/supported-author-tasks.ts";

test("every declared task has an executable example and existing-owner check", async () => {
  for (const task of Object.keys(supportedAuthorTasks)) {
    const example = await runAuthorCheckCli(["--task", task, "--example"]);
    const result = await runAuthorCheckCli(["--task", task, "--request", "fixture"], () => JSON.stringify(example));
    assert.ok(result && typeof result === "object" && "status" in result);
    assert.equal(result.status, "checked", `${task}: ${JSON.stringify(result)}`);
    assert.doesNotThrow(() => JSON.stringify(result));
  }
});

test("invalid selection and discovery never read a source or load an owner", async () => {
  const source = readFileSync("scripts/author-check.ts", "utf8");
  const staticImports = [...source.matchAll(/^import .+ from "([^"]+)"/gm)].map(match => match[1]!);
  assert.ok(staticImports.every(path => path.startsWith("node:") || path.endsWith("supported-author-tasks.ts") || path.endsWith("author-source-limits.ts")));
  const noRead = () => { throw new Error("Source must not be read"); };
  for (const args of [[], ["--task", "constructor", "--example"], ["--task", "bayes.binary", "--request"],
    ["--task", "bayes.binary", "--example", "extra"], ["--task", "../module.ts", "--request", "secret"]]) {
    const result = await runAuthorCheckCli(args, noRead);
    assert.ok(result && typeof result === "object" && "kind" in result);
    assert.equal(result.kind, "author-invocation-gap");
  }
  const list = await runAuthorCheckCli(["--list"], noRead);
  assert.ok(list && typeof list === "object" && "kind" in list);
  assert.equal(list.kind, "author-task-inventory");
});

test("input is bounded in bytes and rejects unreadable or non-file sources", async () => {
  assert.throws(() => readAuthorSource("content"), /regular source file/);
  for (const read of [() => { throw new Error("missing"); }, () => "x".repeat(authorSourceByteLimit + 1),
    () => "é".repeat(authorSourceByteLimit)]) {
    const result = await runAuthorCheckCli(["--task", "bayes.binary", "--request", "fixture"], read);
    assert.ok(result && typeof result === "object" && "status" in result);
    assert.equal(result.status, "repair-gap");
  }
});

test("real CLI accepts stdin and uses failure exit codes without file writes", () => {
  const run = (input: string) => spawnSync(process.execPath,
    ["--disable-warning=ExperimentalWarning", "scripts/author-check.ts", "--task", "bayes.binary", "--request", "-"],
    { input, encoding: "utf8", timeout: 30_000 });
  const valid = run(readFileSync("content/authoring/r4a-urn-prior.bayes.json", "utf8"));
  assert.equal(valid.status, 0, valid.stderr);
  assert.equal(JSON.parse(valid.stdout).result.checkpointCount, 7);
  const invalid = run("{}");
  assert.equal(invalid.status, 2, invalid.stderr);
  assert.equal(JSON.parse(invalid.stdout).status, "repair-gap");
  const oversized = run("x".repeat(authorSourceByteLimit + 1));
  assert.equal(oversized.status, 2, oversized.stderr);
});

test("discovery and invalid selection execute with domain loading forbidden", () => {
  const hook = `export function resolve(specifier, context, nextResolve) {
    if (specifier.includes("author-check-owner-dispatch") || specifier.includes("/experiments/") || specifier.includes("gallery-"))
      throw new Error("Discovery attempted a domain load: " + specifier);
    return nextResolve(specifier, context);
  }`;
  const script = `import { register } from "node:module";
    register(${JSON.stringify(`data:text/javascript,${encodeURIComponent(hook)}`)}, import.meta.url);
    const { runAuthorCheckCli } = await import("./scripts/author-check.ts");
    await runAuthorCheckCli(["--list"]);
    await runAuthorCheckCli(["--task", "unknown", "--example"]);`;
  const result = spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", "--input-type=module", "-e", script],
    { encoding: "utf8", timeout: 30_000 });
  assert.equal(result.status, 0, result.stderr);
});
