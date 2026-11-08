export interface VisionExecution {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly complete: number;
  readonly total: number;
  readonly next: string | null;
}

/** The selected contract is the only progress authority; missing or foreign data
 * must never look like an idle or completed project. */
export function readVisionExecution(value: unknown, expectedId: string): VisionExecution {
  if (!isRecord(value) || value["kind"] !== "run-contract" || value["id"] !== expectedId
    || typeof value["title"] !== "string" || !value["title"].trim()
    || typeof value["status"] !== "string" || !value["status"].trim()
    || !Array.isArray(value["slices"]) || value["slices"].length === 0) {
    throw new Error("Missing or mismatched execution contract");
  }
  const ids = new Set<string>();
  const slices = value["slices"].map((slice: unknown) => {
    if (!isRecord(slice) || typeof slice["id"] !== "string" || !slice["id"].trim()
      || ids.has(slice["id"]) || typeof slice["title"] !== "string" || !slice["title"].trim()
      || typeof slice["status"] !== "string"
      || !["planned", "in-progress", "complete", "blocked", "deferred"].includes(slice["status"])) {
      throw new Error("Invalid or duplicate execution slice");
    }
    ids.add(slice["id"]);
    return { title: slice["title"], status: slice["status"] };
  });
  const next = slices.find(slice => slice.status === "in-progress")
    ?? slices.find(slice => slice.status !== "complete");
  return {
    id: expectedId, title: value["title"], status: value["status"],
    complete: slices.filter(slice => slice.status === "complete").length,
    total: slices.length, next: next?.title ?? null
  };
}

export function describeVisionExecution(execution: VisionExecution): string {
  return `${execution.complete}/${execution.total} work packages complete · contract ${execution.status}. ${execution.next ? `Next unfinished: ${execution.next}.` : "All packages recorded complete; consult the review evidence."}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
