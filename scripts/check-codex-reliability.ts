import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface PolicyResult {
  readonly decision?: string;
  readonly matchedRules?: readonly unknown[];
}

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const rules = [
  resolve(homedir(), ".codex/rules/default.rules"),
  resolve(projectRoot, ".codex/rules/kp.rules")
];

const allowed = [
  ["rg", "--files"],
  ["grep", "-n", "needle", "AGENTS.md"],
  ["git", "status", "--short"],
  ["git", "add", "AGENTS.md"],
  ["npm", "run", "typecheck"],
  ["theseus", "plan", "status"]
];

const reviewed = [
  ["node", "tmp/codex/changing-check.mjs"],
  ["git", "rm", "--", "some-file"],
  ["rm", "-rf", "tmp/codex/output"],
  ["/bin/zsh", "-lc", "node tmp/codex/changing-check.mjs"]
];

const strictConfig = spawnSync("codex", ["--strict-config", "--version"], {
  cwd: projectRoot,
  encoding: "utf8"
});
assert.equal(strictConfig.status, 0, strictConfig.stderr || strictConfig.stdout);

for (const command of allowed) {
  const result = check(command);
  assert.equal(result.decision, "allow", `Expected audited allow rule for: ${command.join(" ")}`);
  assert.ok((result.matchedRules?.length ?? 0) > 0, `Expected a matched rule for: ${command.join(" ")}`);
}

for (const command of reviewed) {
  const result = check(command);
  assert.equal(result.matchedRules?.length ?? 0, 0, `Unsafe broad approval matched: ${command.join(" ")}`);
}

process.stdout.write(`Codex reliability policy passed: ${allowed.length} direct commands allowed, ${reviewed.length} risky cohorts left for review.\n`);

function check(command: readonly string[]): PolicyResult {
  const args = ["execpolicy", "check"];
  for (const path of rules) {
    args.push("--rules", path);
  }
  args.push(...command);
  const result = spawnSync("codex", args, { cwd: projectRoot, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout) as PolicyResult;
}
