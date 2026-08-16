import assert from "node:assert/strict";
import test from "node:test";

import type { KpVerificationCheck } from "./verification-impact.ts";
import { runKpVerifyImpactCli, type KpVerifyImpactDependencies } from "./verify-impact.ts";

test("inspect mode derives changed paths and does not execute checks", async () => {
  const harness = createHarness(["src/dev-review/review-inbox.ts"]);
  const result = await runKpVerifyImpactCli([], harness.dependencies);
  assert.equal(harness.changedPathCalls, 1);
  assert.deepEqual(harness.executed, []);
  assert.ok(result.checks.some((check) => check.id === "dev-review-browser"));
  assert.match(harness.output, /src\/dev-review\/review-inbox\.ts/);
});

test("explicit paths bypass git discovery and --run executes argv-safe checks in order", async () => {
  const harness = createHarness(["should-not-be-read.ts"]);
  const result = await runKpVerifyImpactCli([
    "--path", "docs/theseus/events/example.jsonl",
    "--run"
  ], harness.dependencies);
  assert.equal(harness.changedPathCalls, 0);
  assert.deepEqual(harness.executed, result.checks.map((check) => check.id));
  assert.deepEqual(harness.executed, ["theseus-validate"]);
});

test("release override selects the broad gate regardless of paths", async () => {
  const harness = createHarness([]);
  const result = await runKpVerifyImpactCli(["--release"], harness.dependencies);
  assert.equal(result.risk, "high");
  assert.ok(result.checks.some((check) => check.id === "build"));
  assert.ok(result.checks.some((check) => check.id === "test"));
});

test("typed mode is reported and filters later lifecycle gates", async () => {
  const harness = createHarness([]);
  const result = await runKpVerifyImpactCli([
    "--path", "src/animation/function-wrap-reception.ts",
    "--mode", "discovery"
  ], harness.dependencies);
  assert.equal(result.mode, "discovery");
  assert.deepEqual(result.checks.map(({ id }) => id), [
    "equation-surface-preservation",
    "function-wrap-visual"
  ]);
  assert.match(harness.output, /"mode": "discovery"/);
});

test("release compatibility flag cannot conflict with typed mode", async () => {
  const harness = createHarness([]);
  await assert.rejects(
    runKpVerifyImpactCli(["--release", "--mode", "contract"], harness.dependencies),
    /either --release or --mode/
  );
});

function createHarness(paths: readonly string[]): {
  readonly dependencies: KpVerifyImpactDependencies;
  readonly executed: string[];
  output: string;
  changedPathCalls: number;
} {
  const harness = {
    executed: [] as string[],
    output: "",
    changedPathCalls: 0,
    dependencies: undefined as unknown as KpVerifyImpactDependencies
  };
  harness.dependencies = {
    changedPaths: async () => {
      harness.changedPathCalls += 1;
      return paths;
    },
    execute: async (check: KpVerificationCheck) => {
      harness.executed.push(check.id);
    },
    write: (output: string) => {
      harness.output += output;
    }
  };
  return harness;
}
