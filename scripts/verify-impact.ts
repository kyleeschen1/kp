import { execFile as execFileCallback, spawn } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import {
  selectKpVerificationImpact,
  type KpVerificationCheck,
  type KpVerificationMode,
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
      mode: { type: "string" },
      run: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false }
    }
  });
  const mode = parseMode(values.mode);
  if (values.release && mode !== undefined) {
    throw new Error("Use either --release or --mode, not both.");
  }
  if (values.help) {
    dependencies.write(helpText);
    return selectKpVerificationImpact([], selectionOptions(mode, values.release));
  }
  const paths = values.path ?? await dependencies.changedPaths(values.staged);
  const selection = selectKpVerificationImpact(
    paths,
    selectionOptions(mode, values.release)
  );
  dependencies.write(`${JSON.stringify({ paths, ...selection }, null, 2)}\n`);
  if (values.run) {
    for (const check of selection.checks) {
      dependencies.write(`\n[verify:impact] ${check.id}\n`);
      await dependencies.execute(check);
    }
  }
  return selection;
}

function selectionOptions(
  mode: KpVerificationMode | undefined,
  release: boolean
): { readonly mode?: KpVerificationMode; readonly release: boolean } {
  return mode === undefined ? { release } : { mode, release };
}

function parseMode(value: string | undefined): KpVerificationMode | undefined {
  if (value === undefined) return undefined;
  if (
    value === "discovery" ||
    value === "contract" ||
    value === "promotion" ||
    value === "release"
  ) return value;
  throw new Error(
    `Unknown verification mode ${JSON.stringify(value)}; expected discovery, contract, promotion, or release.`
  );
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
  --mode <mode>  discovery | contract | promotion | release (default: promotion)
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
