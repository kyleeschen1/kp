import { spawnSync } from "node:child_process";
import { relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

interface StopHookInput {
  readonly cwd?: string;
  readonly hook_event_name?: string;
}

interface PlanStatusQuery {
  readonly items?: readonly PlanStatusItem[];
}

interface PlanStatusItem {
  readonly project?: { readonly id?: string };
  readonly currentRun?: {
    readonly id?: string;
    readonly title?: string;
    readonly completedSlices?: number;
    readonly remainingSlices?: number;
    readonly nextSlice?: { readonly id?: string; readonly title?: string };
  };
}

export interface StopHookOutput {
  readonly continue: true;
  readonly systemMessage: string;
}

/** Warn only for an in-scope, unfinished run; every uncertain case fails open. */
export function codexStopGuardDecision(
  input: StopHookInput,
  query: PlanStatusQuery,
  projectRoot: string
): StopHookOutput | undefined {
  if (input.hook_event_name !== "Stop" || !isInside(input.cwd, projectRoot)) {
    return undefined;
  }

  const snapshot = query.items?.[0];
  const run = snapshot?.currentRun;
  const complete = nonNegativeInteger(run?.completedSlices);
  const remaining = nonNegativeInteger(run?.remainingSlices);
  if (run === undefined || remaining === 0) {
    return undefined;
  }

  const total = complete + remaining;
  const ordinal = Math.min(total, complete + 1);
  const project = snapshot?.project?.id?.toUpperCase() ?? "PROJECT";
  const title = run.title ?? run.id ?? "active run";
  const next = run.nextSlice?.title ?? run.nextSlice?.id ?? "next approved slice";
  return {
    continue: true,
    systemMessage: `${project} · ${title} · slice ${ordinal}/${total}. ${remaining} approved slice${remaining === 1 ? " remains" : "s remain"}; next: ${next}. Continue unless a named contract stop condition fired. Before finalizing, report one explicit stop outcome and the exact resume command.`
  };
}

function isInside(candidate: string | undefined, projectRoot: string): boolean {
  if (candidate === undefined) {
    return false;
  }
  const path = relative(resolve(projectRoot), resolve(candidate));
  return path === "" || (!path.startsWith("..") && !path.startsWith("/"));
}

function nonNegativeInteger(value: number | undefined): number {
  return Number.isInteger(value) && (value ?? -1) >= 0 ? value as number : 0;
}

function readStdin(): Promise<string> {
  return new Promise((resolveInput, reject) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk: string) => { input += chunk; });
    process.stdin.on("end", () => resolveInput(input));
    process.stdin.on("error", reject);
  });
}

async function main(): Promise<void> {
  try {
    const projectRoot = fileURLToPath(new URL("..", import.meta.url));
    const input = JSON.parse(await readStdin()) as StopHookInput;
    if (!isInside(input.cwd, projectRoot) || input.hook_event_name !== "Stop") {
      return;
    }
    const result = spawnSync("theseus", ["--format", "json", "plan", "status"], {
      cwd: projectRoot,
      encoding: "utf8",
      timeout: 8_000
    });
    if (result.status !== 0 || result.error !== undefined) {
      return;
    }
    const output = codexStopGuardDecision(input, JSON.parse(result.stdout) as PlanStatusQuery, projectRoot);
    if (output !== undefined) {
      process.stdout.write(`${JSON.stringify(output)}\n`);
    }
  } catch {
    // A continuity reminder must never block a legitimate Codex stop.
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void main();
}
