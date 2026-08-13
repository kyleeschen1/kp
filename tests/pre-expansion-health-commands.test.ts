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
    "pre-expansion-negative-health-fixtures.test.ts",
    "check:animation-library-bundle-boundary",
    "check:economics-demand-shift-publication"
  ]) assert.match(focused, new RegExp(gate.replaceAll(":", "\\:")));

  const release = scripts["health:pre-expansion:release"] ?? "";
  for (const gate of [
    "health:pre-expansion",
    "test:browser:animation-equation-capability",
    "npm test",
    "npm run build",
    "workspace validate"
  ]) assert.ok(release.includes(gate), gate);
});
