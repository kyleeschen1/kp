import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { runAuthorCheckCli } from "./author-check.ts";

export const trialDirectory = "docs/project/threads/2026-09-10-authoring-trial";
export const trialCases = ["case-01", "case-02", "case-03", "case-04", "case-05",
  "probe-factorization", "probe-evaluation", "probe-unsupported"] as const;

export function validateTrialInventory(names: readonly string[], complete = false) {
  const attempts = names.filter(name => /\.attempt-\d+\.json$/.test(name)).sort();
  for (const name of attempts) {
    const match = /^(case-0[1-5]|probe-factorization|probe-evaluation|probe-unsupported)\.attempt-([1-4])\.json$/.exec(name);
    assert.ok(match, `Unexpected case or exceeded attempt cap: ${name}`);
    const [, id, number] = match;
    assert.ok(names.includes(`${id}.notes.md`), `Missing author provenance: ${id}`);
    assert.ok(names.includes(name.replace(/\.json$/, ".report.json")), `Missing original checker report: ${name}`);
    for (let n = 1; n < Number(number); n++)
      assert.ok(names.includes(`${id}.attempt-${n}.json`), `Missing earlier failed attempt: ${name}`);
  }
  for (const name of names.filter(name => /\.attempt-\d+\.report\.json$/.test(name)))
    assert.ok(names.includes(name.replace(".report.json", ".json")), `Orphan report: ${name}`);
  if (complete) for (const id of trialCases)
    assert.ok(names.includes(`${id}.attempt-1.json`), `Missing predeclared case: ${id}`);
  return attempts;
}

export async function checkUnfamiliarAuthoringTrial(complete = false) {
  const names = readdirSync(trialDirectory);
  const attempts = validateTrialInventory(names, complete);
  const results = [];
  for (const name of attempts) {
    const source = join(trialDirectory, name);
    const recorded: unknown = JSON.parse(readFileSync(source.replace(/\.json$/, ".report.json"), "utf8"));
    const current = await runAuthorCheckCli(["--task", "equation.composed-algebra", "--request", source]);
    // Compare the full report so a formerly rejected source cannot be silently
    // relabeled successful after a packet or implementation change.
    assert.deepEqual(current, recorded, `Recorded checker evidence drifted: ${name}`);
    assert.ok(current && typeof current === "object" && "status" in current,
      `Expected a source-check outcome: ${name}`);
    results.push({ source, status: current.status });
  }
  return { kind: "unfamiliar-authoring-trial-replay", provenance: "replay-not-new-author-evidence",
    completeInventory: complete, expectedCases: trialCases.length, attemptCount: attempts.length,
    humanComprehension: "not-measured", results };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  assert.ok(process.argv.slice(2).every(arg => arg === "--complete"), "Use only --complete.");
  console.log(JSON.stringify(await checkUnfamiliarAuthoringTrial(process.argv.includes("--complete")), null, 2));
}
