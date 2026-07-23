import type {
  KpWorkbenchRoadmapRow
} from "./semantic-animation-workbench-roadmap.ts";

export const KP_WORKBENCH_ROADMAP_SORTS = [
  "canonical",
  "name",
  "topic",
  "horizon",
  "state"
] as const;

export type KpWorkbenchRoadmapSort =
  (typeof KP_WORKBENCH_ROADMAP_SORTS)[number];
export type KpWorkbenchRoadmapSortDirection = "ascending" | "descending";

export interface KpWorkbenchRoadmapQuery {
  readonly sortBy: KpWorkbenchRoadmapSort;
  readonly direction: KpWorkbenchRoadmapSortDirection;
  readonly topics?: readonly string[];
  readonly horizons?: readonly KpWorkbenchRoadmapRow["horizon"][];
  readonly states?: readonly KpWorkbenchRoadmapRow["state"][];
}

const horizonRank: Record<KpWorkbenchRoadmapRow["horizon"], number> = {
  now: 0,
  next: 1,
  later: 2,
  someday: 3
};

const stateRank: Record<KpWorkbenchRoadmapRow["state"], number> = {
  active: 0,
  planned: 1,
  complete: 2,
  deferred: 3
};

export function queryKpWorkbenchRoadmap(
  rows: readonly KpWorkbenchRoadmapRow[],
  query: KpWorkbenchRoadmapQuery
): readonly KpWorkbenchRoadmapRow[] {
  const topics = new Set(query.topics ?? []);
  const horizons = new Set(query.horizons ?? []);
  const states = new Set(query.states ?? []);
  const direction = query.direction === "ascending" ? 1 : -1;

  return rows
    .filter(
      (row) =>
        (topics.size === 0 || (row.topic !== undefined && topics.has(row.topic))) &&
        (horizons.size === 0 || horizons.has(row.horizon)) &&
        (states.size === 0 || states.has(row.state))
    )
    .sort(
      (left, right) =>
        direction * compareRoadmapRows(left, right, query.sortBy) ||
        left.order - right.order ||
        left.id.localeCompare(right.id)
    );
}

export function listKpWorkbenchRoadmapTopics(
  rows: readonly KpWorkbenchRoadmapRow[]
): readonly string[] {
  return [...new Set(rows.flatMap(({ topic }) => topic ?? []))].sort((left, right) =>
    left.localeCompare(right)
  );
}

function compareRoadmapRows(
  left: KpWorkbenchRoadmapRow,
  right: KpWorkbenchRoadmapRow,
  sortBy: KpWorkbenchRoadmapSort
): number {
  switch (sortBy) {
    case "canonical":
      return left.order - right.order;
    case "name":
      return left.title.localeCompare(right.title);
    case "topic":
      return compareOptionalText(left.topic, right.topic);
    case "horizon":
      return horizonRank[left.horizon] - horizonRank[right.horizon];
    case "state":
      return stateRank[left.state] - stateRank[right.state];
  }
}

function compareOptionalText(
  left: string | undefined,
  right: string | undefined
): number {
  if (left === undefined) return right === undefined ? 0 : 1;
  if (right === undefined) return -1;
  return left.localeCompare(right);
}
