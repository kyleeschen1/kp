import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { checkCodeReasoningSource } from "../src/experiments/reusable-reasoning/code-author-check.ts";
import { bindCodeReasoningEvidence, createCodeReasoningSource } from "../src/experiments/reusable-reasoning/code-evidence.ts";
import { checkReasoningText } from "../scripts/author-reasoning.ts";
import { checkAuthorTask } from "../scripts/author-check-owner-dispatch.ts";
import { supportedAuthorTasks } from "../src/authoring/supported-author-tasks.ts";

test("code route retains bounded language evidence and legacy output without asserting publication parity", async () => {
  const source = { ...createCodeReasoningSource(), title: "One named threshold decision" };
  const json = JSON.stringify(source), evidence = bindCodeReasoningEvidence(source), checked = checkCodeReasoningSource(json);
  assert.equal(checked.status, "compiled");
  if (checked.status !== "compiled") return;
  assert.equal(checked.revisionId, evidence.revisionId);
  assert.equal(checked.checkpointKind, "pedagogical-stage");
  assert.equal(checked.checkpointCount, 7);
  assert.deepEqual(checked.assumptions, evidence.context.assumptions);
  assert.deepEqual(checked, checkReasoningText("code", json));
  assert.deepEqual((await checkAuthorTask("reasoning.code", json)).result, checked);
  assert.equal(supportedAuthorTasks["reasoning.code"].preview.kind, "reference-only");
  assert.equal(supportedAuthorTasks["reasoning.code"].publication.kind, "unsupported");
});

test("code route rejects foreign syntax, stages, proof and equation sources", async () => {
  const source = createCodeReasoningSource();
  for (const value of [{ ...source, code: "eval(untrusted)" }, { ...source, sourceRevisionId: "arbitrary-source" },
    { ...source, stageIds: [...source.stageIds].reverse() }, { ...source, proof: true },
    { schemaVersion: "kp.reasoning-example.v1" }]) {
    const json = JSON.stringify(value), checked = checkCodeReasoningSource(json);
    assert.equal(checked.status, "repair-gap");
    assert.deepEqual((await checkAuthorTask("reasoning.code", json)).result, checked);
    assert.deepEqual(checkReasoningText("code", json), checked);
  }
});

test("selected code checking runs with equation frontend loading forbidden", () => {
  const hook = `export function resolve(specifier, context, nextResolve) {
    if (specifier.includes("equation-author-check") || specifier.includes("author-reasoning.ts") || specifier.includes("authoring-structural/"))
      throw new Error("Code checking attempted an equation owner load: " + specifier);
    return nextResolve(specifier, context);
  }`;
  const script = `import { register } from "node:module";
    register(${JSON.stringify(`data:text/javascript,${encodeURIComponent(hook)}`)}, import.meta.url);
    const { runAuthorCheckCli } = await import("./scripts/author-check.ts");
    const source = await runAuthorCheckCli(["--task", "reasoning.code", "--example"]);
    const checked = await runAuthorCheckCli(["--task", "reasoning.code", "--request", "fixture"], () => JSON.stringify(source));
    if (checked.status !== "checked") throw new Error("Code source failed");`;
  const result = spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", "--input-type=module", "-e", script],
    { encoding: "utf8", timeout: 30_000 });
  assert.equal(result.status, 0, result.stderr);
});
