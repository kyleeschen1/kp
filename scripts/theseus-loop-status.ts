import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
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
  readonly health?: { readonly activeRunContracts?: number };
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

export function formatStoredContractStatus(value: unknown, expectedId: string): TheseusLoopStatus {
  if (!isRecord(value) || value["kind"] !== "run-contract" || value["id"] !== expectedId
    || typeof value["title"] !== "string" || typeof value["status"] !== "string"
    || !Array.isArray(value["slices"])) throw new Error("Invalid stored run contract.");
  const seen = new Set<string>();
  const slices = value["slices"].map((slice: unknown) => {
    if (!isRecord(slice) || typeof slice["id"] !== "string" || !slice["id"]
      || typeof slice["title"] !== "string" || typeof slice["status"] !== "string"
      || seen.has(slice["id"])) throw new Error("Invalid or duplicate stored slice.");
    seen.add(slice["id"]);
    return { id: slice["id"], title: slice["title"], status: slice["status"] };
  });
  const completed = slices.filter(slice => slice.status === "complete").length;
  const next = slices.find(slice => slice.status === "in-progress") ?? slices.find(slice => slice.status !== "complete");
  return {
    active: value["status"] === "active",
    headline: `KP · ${value["title"]} · ${completed}/${slices.length} complete`,
    detail: `contract: ${expectedId} (${value["status"]}) · next: ${next?.title ?? "closeout"} · global blockers not queried`
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStatus(): TheseusLoopStatus {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const id = args[1];
    if (args.length !== 2 || args[0] !== "--contract" || !id || !/^run-contract\.[a-zA-Z0-9.-]+$/.test(id))
      throw new Error("Use --contract run-contract.<id> for explicit stored progress.");
    // Explicit selection reads the executable record; it never elects a run or
    // treats an incomplete global snapshot as permission to start work.
    return formatStoredContractStatus(JSON.parse(readFileSync(`docs/theseus/nodes/run-contracts/${id}.json`, "utf8")), id);
  }
  const scoped = readSnapshot(["--scope", "kp"]);
  // Scope selection does not yet retain newly-created contracts that lack a
  // scopeId, even though its health summary can see the active global run.
  const query = requiresUnscopedRunLookup(scoped) ? readSnapshot([]) : scoped;
  return formatTheseusLoopStatus(query);
}

export function requiresUnscopedRunLookup(query: TheseusSnapshotQuery): boolean {
  const snapshot = query.items?.[0];
  return snapshot?.currentRun === undefined
    && (snapshot?.health?.activeRunContracts ?? 0) > 0;
}

function readSnapshot(extraArgs: readonly string[]): TheseusSnapshotQuery {
  const result = spawnSync("theseus", ["--format", "json", "plan", "status", ...extraArgs], {
    encoding: "utf8"
  });
  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || "Theseus status command failed.";
    throw new Error(detail);
  }
  return JSON.parse(result.stdout) as TheseusSnapshotQuery;
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
