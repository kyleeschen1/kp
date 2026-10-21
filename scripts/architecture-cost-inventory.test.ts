import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { architectureSourcePaths } from "./architecture-cost-inventory.ts";

test("scoped audit enumeration preserves every originally selected source path", () => {
  const former = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })
    .split("\0").filter(path => /^(src|tests|scripts|domains)\//.test(path));
  assert.deepEqual(architectureSourcePaths(), former);
});
