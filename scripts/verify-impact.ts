import { execFile as execFileCallback, spawn } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import {
  selectKpVerificationImpact,
  type KpVerificationCheck,
  type KpVerificationSelection
} from "./verification-impact.ts";

const execFile = promisify(execFileCallback);

export interface KpVerifyImpactDependencies {
  readonly changedPaths: (staged: boolean) => Promise<readonly string[]>;
  readonly execute: (check: KpVerificationCheck) => Promise<void>;
  readonly write: (output: string) => void;
}

export async function runKpVerifyImpactCli(
  argv: readonly string[],
  dependencies: KpVerifyImpactDependencies = defaultDependencies
): Promise<KpVerificationSelection> {
  const { values } = parseArgs({
    args: [...argv],
    strict: true,
    options: {
      path: { type: "string", multiple: true },
      staged: { type: "boolean", default: false },
      release: { type: "boolean", default: false },
      run: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false }
    }
  });
  if (values.help) {
    dependencies.write(helpText);
    return selectKpVerificationImpact([], { release: values.release });
  }
  const paths = values.path ?? await dependencies.changedPaths(values.staged);
  const selection = selectKpVerificationImpact(paths, { release: values.release });
  dependencies.write(`${JSON.stringify({ paths, ...selection }, null, 2)}\n`);
  if (values.run) {
    for (const check of selection.checks) {
      dependencies.write(`\n[verify:impact] ${check.id}\n`);
      await dependencies.execute(check);
    }
  }
  return selection;
}

async function changedPaths(staged: boolean): Promise<readonly string[]> {
  if (staged) {
    const { stdout } = await execFile("git", ["diff", "--cached", "--name-only"]);
    return lines(stdout);
  }
  const [{ stdout: tracked }, { stdout: untracked }] = await Promise.all([
    execFile("git", ["diff", "--name-only", "HEAD"]),
    execFile("git", ["ls-files", "--others", "--exclude-standard"])
  ]);
  return [...new Set([...lines(tracked), ...lines(untracked)])].sort();
}

async function execute(check: KpVerificationCheck): Promise<void> {
  const [command, ...args] = check.command;
  if (command === undefined) throw new Error(`Verification check ${check.id} has no command`);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: false });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${check.id} failed with ${signal ?? `exit ${String(code)}`}`));
    });
  });
}

function lines(value: string): readonly string[] {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

const helpText = `Usage: npm run verify:impact -- [options]

Inspect the selected checks by default. Add --run to execute them sequentially.

  --path <path>  Select from an explicit changed path (repeatable)
  --staged       Inspect staged changes only instead of all working-tree changes
  --release      Select the explicit broad release gate
  --run          Execute the selected argv-safe commands in order
`;

const defaultDependencies: KpVerifyImpactDependencies = {
  changedPaths,
  execute,
  write: (output) => process.stdout.write(output)
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await runKpVerifyImpactCli(process.argv.slice(2));
}

