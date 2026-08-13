import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const scripts = (JSON.parse(readFileSync("package.json", "utf8")) as {
  readonly scripts: Readonly<Record<string, string>>;
}).scripts;

test("pre-expansion health has focused and explicit release commands", () => {
  const focused = scripts["health:pre-expansion"] ?? "";
  for (const gate of [
    "check:architecture",
    "typecheck",
    "test:semantic-animation-convergence",
    "test:svelte-catalogue-shell",
    "current-direction-authoring-ratchet.test.ts",
    "pre-expansion-negative-health-fixtures.test.ts",
    "check:animation-library-bundle-boundary",
    "check:economics-demand-shift-publication"
  ]) assert.match(focused, new RegExp(gate.replaceAll(":", "\\:")));

  const release = scripts["health:pre-expansion:release"] ?? "";
  for (const gate of [
    "health:pre-expansion",
    "test:browser:animation-equation-capability",
    "npm test",
    "npm run build:bundle",
    "workspace validate"
  ]) assert.ok(release.includes(gate), gate);

  assert.match(scripts["test"] ?? "", /--test-concurrency=2/u);
  assert.equal((scripts["build"] ?? "").includes("build:bundle"), true);
  assert.equal((scripts["build:bundle"] ?? "").includes("typecheck"), false);
});

test("root TypeScript checks keep their caches in ignored scratch space", () => {
  for (const path of [
    "tsconfig.app.json",
    "tsconfig.node.json",
    "tsconfig.test.json",
    "domains/tsconfig.json"
  ]) {
    const config = JSON.parse(readFileSync(path, "utf8")) as {
      readonly compilerOptions?: {
        readonly incremental?: boolean;
        readonly tsBuildInfoFile?: string;
      };
    };
    assert.equal(config.compilerOptions?.incremental, true, path);
    assert.match(config.compilerOptions?.tsBuildInfoFile ?? "", /tmp\/codex\/tsbuildinfo/u);
  }
});
