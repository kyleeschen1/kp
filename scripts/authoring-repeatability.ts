import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { checkAuthorTask } from "./author-check-owner-dispatch.ts";
import type { AuthorCheckReport } from "../src/authoring/author-check-report.ts";
import { repeatabilityCases, readFrozenInput, verifyFrozenInput, type RepeatabilityCase } from "./authoring-repeatability-cases.ts";
import { createTrialRecord, createFailedTrialRecord, type TrialWork } from "./authoring-repeatability-records.ts";

const baselineWork: TrialWork = {
  sourceEditsAfterFreeze: 0, adapterEdits: 0, engineEdits: 0, editorialCorrections: [], engineeringMinutes: null,
  notes: "No per-case source, adapter or engine correction. Trial infrastructure is separate; checker elapsed time excludes preview and is not engineering time."
};

// Injection is for deterministic failure tests. The CLI always delegates to the
// existing task dispatcher; it does not issue compilation or host authority.
export async function runRepeatabilityCase(item: RepeatabilityCase, dependencies: {
  read: (item: RepeatabilityCase) => string;
  check: (task: RepeatabilityCase["task"], input: string) => Promise<AuthorCheckReport>;
  clock: () => number;
} = { read: readFrozenInput, check: checkAuthorTask, clock: () => performance.now() }) {
  try {
    const input = verifyFrozenInput(item, dependencies.read(item));
    const started = dependencies.clock();
    const report = await dependencies.check(item.task, input);
    return createTrialRecord(item, report, dependencies.clock() - started, baselineWork);
  } catch (error) { return createFailedTrialRecord(item, error); }
}

export function parseTrialArguments(args: readonly string[]) {
  let phase: "baseline" | "rerun" | undefined;
  let record = false, all = false;
  const ids: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flag === "--phase" && !phase) {
      const value = args[++i];
      if (value !== "baseline" && value !== "rerun") throw new Error("Select --phase baseline or rerun.");
      phase = value;
    } else if (flag === "--case") {
      const id = args[++i];
      if (!id || ids.includes(id) || !repeatabilityCases.some(item => item.id === id)) throw new Error("Select a unique frozen --case id.");
      ids.push(id);
    } else if (flag === "--all" && !all) all = true;
    else if (flag === "--record" && !record) record = true;
    else throw new Error(`Unknown or repeated trial option: ${flag}`);
  }
  if (!phase || (all ? ids.length !== 0 : ids.length === 0)) throw new Error("Use --phase with either --all or one or more --case ids.");
  return { phase, record, cases: repeatabilityCases.filter(item => all || ids.includes(item.id)) };
}

async function main() {
  const options = parseTrialArguments(process.argv.slice(2));
  const git = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" });
  if (git.status !== 0) throw new Error("Cannot retain implementation revision.");
  for (const item of options.cases) {
    const result = await runRepeatabilityCase(item);
    const command = `npm run trial:authoring -- --phase ${options.phase} --case ${item.id} --record`;
    if (options.record) {
      const directory = new URL(`../docs/project/reviews/authoring-repeatability/${options.phase}/`, import.meta.url);
      mkdirSync(directory, { recursive: true });
      // Preserve first outcomes, including failures. Reruns have a separate path.
      writeFileSync(new URL(`${item.id}.json`, directory), JSON.stringify({ ...result, phase: options.phase,
        implementationCommit: git.stdout.trim(), recordedAt: new Date().toISOString(), command,
        invocation: process.argv.slice(2) }, null, 2) + "\n", { flag: "wx" });
    }
    console.log(`${item.id}: ${result.actual}; preview=${result.preview.status}; expected=${result.expectationMatched ? "matched" : "UNEXPECTED"}`);
    if (!result.expectationMatched) process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
