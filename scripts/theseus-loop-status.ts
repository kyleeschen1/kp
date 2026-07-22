import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

interface TheseusSnapshotQuery {
  readonly items?: readonly TheseusSnapshotItem[];
}

interface TheseusSnapshotItem {
  readonly project?: { readonly id?: string };
  readonly currentRun?: {
    readonly id?: string;
    readonly title?: string;
    readonly completedSlices?: number;
    readonly remainingSlices?: number;
    readonly nextSlice?: { readonly id?: string; readonly title?: string };
  };
  readonly blockers?: readonly string[];
}

export interface TheseusLoopStatus {
  readonly active: boolean;
  readonly headline: string;
  readonly detail: string;
}

/** Keep UI progress derived from Theseus rather than maintaining a second plan. */
export function formatTheseusLoopStatus(query: TheseusSnapshotQuery): TheseusLoopStatus {
  const snapshot = query.items?.[0];
  const projectId = snapshot?.project?.id ?? "project";
  const run = snapshot?.currentRun;
  if (run === undefined) {
    return {
      active: false,
      headline: `${projectId.toUpperCase()} · no active loop`,
      detail: "Run `theseus plan run` to select or inspect the next approved contract."
    };
  }

  const complete = nonNegativeInteger(run.completedSlices);
  const remaining = nonNegativeInteger(run.remainingSlices);
  const total = complete + remaining;
  const ordinal = remaining > 0 ? Math.min(total, complete + 1) : total;
  const title = run.title ?? run.id ?? "active run";
  const sliceLabel = total > 0 ? `${ordinal}/${total}` : "—";
  const next = run.nextSlice?.title ?? run.nextSlice?.id ?? "closeout";
  const blockerCount = snapshot?.blockers?.length ?? 0;
  return {
    active: true,
    headline: `${projectId.toUpperCase()} · ${title} · slice ${sliceLabel}`,
    detail: `${complete} complete · ${remaining} remaining · ${blockerCount} blocker${blockerCount === 1 ? "" : "s"} · next: ${next}`
  };
}

function nonNegativeInteger(value: number | undefined): number {
  return Number.isInteger(value) && (value ?? -1) >= 0 ? value as number : 0;
}

function readStatus(): TheseusLoopStatus {
  const result = spawnSync("theseus", ["--format", "json", "plan", "status"], {
    encoding: "utf8"
  });
  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || "Theseus status command failed.";
    throw new Error(detail);
  }
  return formatTheseusLoopStatus(JSON.parse(result.stdout) as TheseusSnapshotQuery);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const status = readStatus();
    process.stdout.write(`${status.headline}\n${status.detail}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
