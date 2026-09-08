import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { checkReasoningText, runReasoningAuthoringCli } from "../scripts/author-reasoning.ts";
import { createKpReasoningSource } from "../src/experiments/reusable-reasoning/source.ts";
import { createCodeReasoningSource } from "../src/experiments/reusable-reasoning/code-evidence.ts";

test("authoring packet accepts a supported prefix and diagnoses its broken binding before repair", () => {
  const source = createKpReasoningSource();
  const reason = { ...source.reason, operationIds: source.reason.operationIds.slice(0, 3) };
  const broken = checkReasoningText("equation", JSON.stringify({ ...source, reason }));
  assert.equal(broken.status, "repair-gap");
  if (broken.status === "repair-gap") {
    assert.ok(broken.diagnostic.path); assert.ok(broken.diagnostic.expected);
  }
  const fixed = checkReasoningText("equation", JSON.stringify({ ...source, reason,
    parent: { ...source.parent, targetStateId: "fraction-solve.state.constant-product" } }));
  assert.equal(fixed.status, "compiled");
  if (fixed.status === "compiled") assert.equal(fixed.checkpointCount, 4);
});

test("code packet permits prose but rejects invented stages, proof and geometry", () => {
  const source = createCodeReasoningSource();
  const accepted = checkReasoningText("code", JSON.stringify({ ...source, title: "Name the shared decision" }));
  assert.equal(accepted.status, "compiled");
  if (accepted.status === "compiled") assert.equal(accepted.checkpointCount, 7);
  for (const bad of [{ ...source, stageIds: [...source.stageIds].reverse() }, { ...source, proof: "equivalent" },
    { ...source, geometry: {} }, { ...source, sourceRevisionId: "unverified-source" }]) {
    assert.equal(checkReasoningText("code", JSON.stringify(bad)).status, "repair-gap");
  }
});

test("read-only CLI emits executable starter JSON and typed rejection with exit two", () => {
  for (const domain of ["equation", "code"] as const) {
    const example = runReasoningAuthoringCli(["--domain", domain, "--example"]);
    const child = spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", "scripts/author-reasoning.ts",
      "--domain", domain, "--request", "-"], { input: JSON.stringify(example), encoding: "utf8" });
    assert.equal(child.status, 0, child.stderr);
    assert.equal(JSON.parse(child.stdout).status, "compiled");
  }
  const bad = spawnSync(process.execPath, ["scripts/author-reasoning.ts", "--domain", "code", "--request", "-"],
    { input: "{", encoding: "utf8" });
  assert.equal(bad.status, 2);
  assert.equal(JSON.parse(bad.stdout).diagnostic.code, "kp.reasoning.json");
  assert.equal(checkReasoningText("code", " ".repeat(100_001)).status, "repair-gap");
  assert.equal(checkReasoningText("equation", JSON.stringify({ ...createKpReasoningSource(), renderer: "fade" })).status, "repair-gap");
  assert.equal((runReasoningAuthoringCli(["--domain", "unknown"]) as { status: string }).status, "repair-gap");
});
