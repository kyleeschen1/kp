import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("review observations are durable local data, not source or disposable scratch", async () => {
  const [ignore, policy, devScript] = await Promise.all([
    readFile(".gitignore", "utf8"),
    readFile("docs/dev-visual-review.md", "utf8"),
    readFile("scripts/dev.ts", "utf8")
  ]);

  assert.match(ignore, /^\/\.kp\/review-logs\/$/m);
  assert.match(devScript, /\.kp\/review-logs/);
  assert.match(policy, /survive server restarts and Codex sessions/);
  assert.match(policy, /never expire, compact, upload/);
  assert.match(policy, /production servers and production bundles unaware/);
  assert.doesNotMatch(devScript, /tmp\/codex.*review/i);
});
