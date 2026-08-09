import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  createKpAnimationLibraryDisplayCatalog,
  type KpAnimationLibraryDisplayEntry
} from "../src/editor/animation-library-display-catalog.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

const promotionStatuses = [
  "promoted",
  "next",
  "queued",
  "planned",
  "later"
] as const;

export type KpPromotionLedgerStatus = typeof promotionStatuses[number];

export interface KpPromotionLedgerRow {
  readonly rank: number;
  readonly stableId: string;
  readonly canonicalExemplar: string;
  readonly referenceKey: string;
  readonly status: KpPromotionLedgerStatus;
  readonly catalogAnimationId?: string | undefined;
}

export interface KpPromotionMemoryInput {
  readonly threadMarkdown: string;
  readonly roadmapMarkdown: string;
  readonly activeThreadMarkdown: string;
  readonly nextActionsMarkdown: string;
  readonly activePlanRevision: unknown;
  readonly runContractsById: ReadonlyMap<string, unknown>;
  readonly catalogStatusByAnimationId: ReadonlyMap<
    string,
    KpAnimationLibraryDisplayEntry["canonicalFormat"]
  >;
}

export interface KpPromotionMemoryReport {
  readonly rows: readonly KpPromotionLedgerRow[];
  readonly current: KpPromotionLedgerRow;
  readonly activePhaseId: string;
  readonly activeRunContractId: string;
  readonly diagnostics: readonly string[];
}

interface PlanPhase {
  readonly id?: unknown;
  readonly objective?: unknown;
  readonly canonicalExemplar?: unknown;
  readonly status?: unknown;
  readonly evidence?: unknown;
}

interface PlanRevisionNode {
  readonly status?: unknown;
  readonly planRevision?: {
    readonly approval?: { readonly status?: unknown };
    readonly phases?: unknown;
  };
}

interface RunContractNode {
  readonly status?: unknown;
  readonly slices?: unknown;
}

export function parseKpPromotionLedger(
  threadMarkdown: string
): readonly KpPromotionLedgerRow[] {
  const section = extractMarkdownSection(
    threadMarkdown,
    "Stable Frontier Order"
  );
  const lines = section
    .split(/\r?\n/u)
    .filter((line) => line.trimStart().startsWith("|"));
  if (lines.length < 3) {
    throw new Error("Stable Frontier Order must contain a Markdown table.");
  }

  const headers = parseTableCells(lines[0] ?? "");
  const rankIndex = headers.indexOf("Rank");
  const stableIdIndex = headers.indexOf("Stable ID");
  const exemplarIndex = headers.indexOf("Canonical exemplar");
  const statusIndex = headers.indexOf("Status");
  const catalogIndex = headers.indexOf("Catalog animation ID");
  if (
    rankIndex < 0 ||
    stableIdIndex < 0 ||
    exemplarIndex < 0 ||
    statusIndex < 0 ||
    catalogIndex < 0
  ) {
    throw new Error(
      "Stable Frontier Order requires Rank, Stable ID, Canonical exemplar, " +
      "Status, and Catalog animation ID columns."
    );
  }

  const rows = lines.slice(2).map((line, rowIndex) => {
    const cells = parseTableCells(line);
    const rank = Number(cells[rankIndex]);
    const stableId = stripInlineCode(cells[stableIdIndex] ?? "");
    const canonicalExemplar = cells[exemplarIndex]?.trim() ?? "";
    const rawStatus = cells[statusIndex]?.trim() ?? "";
    const rawCatalogId = stripInlineCode(cells[catalogIndex] ?? "");
    if (!Number.isInteger(rank) || rank <= 0) {
      throw new Error(`Promotion row ${rowIndex + 1} has an invalid rank.`);
    }
    if (stableId.length === 0 || canonicalExemplar.length === 0) {
      throw new Error(
        `Promotion rank ${rank} requires a stable ID and exemplar.`
      );
    }
    if (!isPromotionStatus(rawStatus)) {
      throw new Error(
        `Promotion rank ${rank} has unsupported status ${rawStatus}.`
      );
    }
    return {
      rank,
      stableId,
      canonicalExemplar,
      referenceKey: extractReferenceKey(canonicalExemplar),
      status: rawStatus,
      ...(isBlankCatalogCell(rawCatalogId)
        ? {}
        : { catalogAnimationId: rawCatalogId })
    } satisfies KpPromotionLedgerRow;
  });

  const ranks = rows.map(({ rank }) => rank);
  const stableIds = rows.map(({ stableId }) => stableId);
  if (new Set(ranks).size !== ranks.length) {
    throw new Error("Stable Frontier Order contains a duplicate rank.");
  }
  if (new Set(stableIds).size !== stableIds.length) {
    throw new Error("Stable Frontier Order contains a duplicate stable ID.");
  }
  for (const [index, row] of rows.entries()) {
    if (row.rank !== index + 1) {
      throw new Error("Stable Frontier Order ranks must be contiguous.");
    }
  }
  return rows;
}

export function evaluateKpPromotionMemory(
  input: KpPromotionMemoryInput
): KpPromotionMemoryReport {
  const rows = parseKpPromotionLedger(input.threadMarkdown);
  const diagnostics: string[] = [];
  const unresolved = rows.filter(({ status }) => status !== "promoted");
  const current = unresolved[0];
  if (current === undefined) {
    throw new Error("Stable Frontier Order has no unresolved exemplar.");
  }
  const nextRows = rows.filter(({ status }) => status === "next");
  if (nextRows.length !== 1 || nextRows[0]?.stableId !== current.stableId) {
    diagnostics.push(
      "Exactly the first unresolved promotion row must have status next."
    );
  }

  const currentAction = extractFrontmatterField(
    input.threadMarkdown,
    "Current Next Action"
  );
  if (!containsReference(currentAction, current.referenceKey)) {
    diagnostics.push(
      `Thread Current Next Action does not name ${current.referenceKey}.`
    );
  }
  const promotionExecutionPaused = containsReference(
    currentAction,
    current.referenceKey
  ) && /\b(?:paused|tabled)\b/u.test(normalizeReference(currentAction));
  // The promotion ledger owns rank; the roadmap-selected active thread is a
  // projection. A deliberately tabled frontier remains retrievable without
  // taking priority back from the product work the user selected instead.
  const activeThreadAction = extractFrontmatterField(
    input.activeThreadMarkdown,
    "Current Next Action"
  );
  if (
    !promotionExecutionPaused &&
    !containsReference(activeThreadAction, current.referenceKey)
  ) {
    diagnostics.push(
      `Active thread Current Next Action does not name ${current.referenceKey}.`
    );
  }
  if (
    !input.roadmapMarkdown.includes(
      "threads/animation-library-promotion.md"
    ) ||
    !containsReference(input.roadmapMarkdown, current.referenceKey)
  ) {
    diagnostics.push(
      `Roadmap does not link the promotion ledger and name ${current.referenceKey}.`
    );
  }
  const currentQueue = extractMarkdownSection(
    input.nextActionsMarkdown,
    "Current Queue"
  );
  const firstQueueItem = currentQueue.match(
    /^\s*1\.\s+([\s\S]*?)(?=^\s*2\.\s+|(?![\s\S]))/mu
  )?.[1] ?? "";
  const queueProjection = promotionExecutionPaused
    ? currentQueue
    : firstQueueItem;
  if (!containsReference(queueProjection, current.referenceKey)) {
    diagnostics.push(
      promotionExecutionPaused
        ? `Current Queue does not retain tabled frontier ${current.referenceKey}.`
        : `Current Queue item 1 does not name ${current.referenceKey}.`
    );
  }

  for (const row of rows.filter(({ status }) => status === "promoted")) {
    const animationId = row.catalogAnimationId;
    if (animationId === undefined) {
      diagnostics.push(
        `${row.stableId} claims promotion without a catalog animation ID.`
      );
      continue;
    }
    if (input.catalogStatusByAnimationId.get(animationId) !== "ported") {
      diagnostics.push(
        `${row.stableId} claims promotion but ${animationId} is not evidence-derived as ported.`
      );
    }
  }

  const phases = readPlanPhases(input.activePlanRevision);
  const matchingPhases = phases.filter((phase) =>
    (phase.status === "active" || phase.status === "planned") &&
    containsReference(
      `${stringValue(phase.objective)} ${stringValue(phase.canonicalExemplar)}`,
      current.referenceKey
    )
  );
  if (matchingPhases.length !== 1) {
    diagnostics.push(
      `Active Theseus plan must contain exactly one active or planned phase for ${current.referenceKey}.`
    );
  }
  const activePhase = matchingPhases[0];
  const activePhaseId = stringValue(activePhase?.id);
  const evidenceIds = Array.isArray(activePhase?.evidence)
    ? activePhase.evidence.filter(
        (candidate): candidate is string => typeof candidate === "string"
      )
    : [];
  const matchingRunContracts = activePhase?.status === "active"
    ? evidenceIds.filter((id) =>
        isActiveRunContract(input.runContractsById.get(id))
      )
    : [];
  // A roadmap phase may be current while its proposal awaits approval. Only a
  // typed run contract authorizes implementation, so zero is a valid planning
  // state; multiple live contracts would create competing execution authority.
  if (matchingRunContracts.length > 1) {
    diagnostics.push(
      `Active Theseus phase ${activePhaseId || "(missing)"} cannot point to multiple live run contracts.`
    );
  }

  return {
    rows,
    current,
    activePhaseId,
    activeRunContractId: matchingRunContracts[0] ?? "",
    diagnostics
  };
}

function readWorkspaceInput(): KpPromotionMemoryInput {
  const theseusRoot = resolve(projectRoot, "docs/theseus/nodes");
  const planRevisionDirectory = resolve(theseusRoot, "plan-revisions");
  const activePlans = readdirSync(planRevisionDirectory)
    .filter((name) => name.endsWith(".json"))
    .map((name) =>
      JSON.parse(
        readFileSync(resolve(planRevisionDirectory, name), "utf8")
      ) as PlanRevisionNode
    )
    .filter(
      (node) =>
        node.status === "active" &&
        node.planRevision?.approval?.status === "approved"
    );
  if (activePlans.length !== 1) {
    throw new Error(
      `Expected one approved active Theseus plan revision, found ${activePlans.length}.`
    );
  }

  const runContractDirectory = resolve(theseusRoot, "run-contracts");
  const runContracts = readdirSync(runContractDirectory)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const node = JSON.parse(
        readFileSync(resolve(runContractDirectory, name), "utf8")
      ) as { readonly id?: unknown };
      return [stringValue(node.id), node] as const;
    })
    .filter(([id]) => id.length > 0);
  const catalog = createKpAnimationLibraryDisplayCatalog();
  const roadmapMarkdown = readProjectFile("docs/project/roadmap.md");
  const activeThreadPath = stripInlineCode(extractFrontmatterField(
    roadmapMarkdown,
    "Active Thread"
  ));
  if (
    !activeThreadPath.startsWith("threads/") ||
    activeThreadPath.includes("..")
  ) {
    throw new Error(`Roadmap Active Thread is invalid: ${activeThreadPath}.`);
  }

  return {
    threadMarkdown: readProjectFile(
      "docs/project/threads/animation-library-promotion.md"
    ),
    roadmapMarkdown,
    activeThreadMarkdown: readProjectFile(`docs/project/${activeThreadPath}`),
    nextActionsMarkdown: readProjectFile("docs/project/next-actions.md"),
    activePlanRevision: activePlans[0],
    runContractsById: new Map(runContracts),
    catalogStatusByAnimationId: new Map(
      catalog.map(({ animationId, canonicalFormat }) => [
        animationId,
        canonicalFormat
      ])
    )
  };
}

function readPlanPhases(node: unknown): readonly PlanPhase[] {
  const candidate = node as PlanRevisionNode;
  return Array.isArray(candidate.planRevision?.phases)
    ? candidate.planRevision.phases as readonly PlanPhase[]
    : [];
}

function isActiveRunContract(node: unknown): boolean {
  const candidate = node as RunContractNode | undefined;
  if (candidate === undefined || candidate.status !== "ready") return false;
  if (!Array.isArray(candidate.slices)) return false;
  return candidate.slices.some((slice) => {
    const status = (slice as { readonly status?: unknown }).status;
    return status === "planned" || status === "in-progress";
  });
}

function extractMarkdownSection(markdown: string, heading: string): string {
  const expression = new RegExp(
    `^## ${escapeRegExp(heading)}\\s*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`,
    "mu"
  );
  const match = markdown.match(expression);
  if (match?.[1] === undefined) {
    throw new Error(`Missing Markdown section: ${heading}.`);
  }
  return match[1];
}

function extractFrontmatterField(markdown: string, field: string): string {
  const beforeFirstSection = markdown.split(/^## /mu, 1)[0] ?? "";
  const expression = new RegExp(
    `^${escapeRegExp(field)}:\\s*([\\s\\S]*?)(?=^[A-Z][^\\n]*:\\s|(?![\\s\\S]))`,
    "mu"
  );
  return beforeFirstSection.match(expression)?.[1]?.trim() ?? "";
}

function parseTableCells(line: string): readonly string[] {
  return line
    .trim()
    .replace(/^\|/u, "")
    .replace(/\|$/u, "")
    .split("|")
    .map((cell) => cell.trim());
}

function extractReferenceKey(exemplar: string): string {
  const inlineCode = exemplar.match(/`([^`]+)`/u)?.[1]?.trim();
  return inlineCode && inlineCode.length > 0
    ? inlineCode
    : stripInlineCode(exemplar).trim();
}

function containsReference(value: string, reference: string): boolean {
  return normalizeReference(value).includes(normalizeReference(reference));
}

function normalizeReference(value: string): string {
  return stripInlineCode(value)
    .replace(/\s+/gu, " ")
    .trim()
    .toLocaleLowerCase("en-US");
}

function stripInlineCode(value: string): string {
  return value.trim().replace(/^`|`$/gu, "");
}

function isBlankCatalogCell(value: string): boolean {
  return value === "" || value === "—" || value === "-";
}

function isPromotionStatus(value: string): value is KpPromotionLedgerStatus {
  return (promotionStatuses as readonly string[]).includes(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function readProjectFile(path: string): string {
  return readFileSync(resolve(projectRoot, path), "utf8");
}

function run(): void {
  const report = evaluateKpPromotionMemory(readWorkspaceInput());
  if (report.diagnostics.length > 0) {
    throw new Error(
      `Animation promotion memory drifted:\n- ${report.diagnostics.join("\n- ")}`
    );
  }
  const execution = report.activeRunContractId.length > 0
    ? `active contract ${report.activeRunContractId}`
    : "proposal review; no active implementation contract";
  process.stdout.write(
    `Promotion memory aligned: rank ${report.current.rank} ` +
    `${report.current.stableId} via ${report.activePhaseId}; ${execution}.\n`
  );
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  run();
}
