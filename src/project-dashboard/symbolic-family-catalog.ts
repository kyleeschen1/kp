import {
  createSymbolicManipulationFamilyRegistry
} from "../animation/symbolic-manipulation-family-registry.ts";
import {
  symbolicManipulationFamilyDashboardTags,
  validateKpSymbolicManipulationFamily,
  type KpSymbolicFlashcardHook,
  type KpSymbolicManipulationFamily
} from "../animation/symbolic-manipulation-family.ts";
import type { KpAssetMetadataValue } from "../semantic/asset.ts";
import { projectDashboardTextFieldsMatch } from "./model.ts";
import type { SemanticAssetAgendaPreviewField } from "./semantic-asset-catalog.ts";
import symbolicLibraryRunContract from "../../docs/theseus/nodes/run-contracts/run-contract.kp.animation.symbolic-manipulation-library-v0.json" with { type: "json" };

export interface SymbolicManipulationFamilyAgendaRow {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly status: string;
  readonly detail: string;
  readonly kind: string;
  readonly depth: number;
  readonly tags: readonly string[];
  readonly dataAttributes: readonly [string, string][];
  readonly relatedIds: readonly string[];
  readonly previewFields: readonly SemanticAssetAgendaPreviewField[];
  readonly searchFields: readonly string[];
}

const SYMBOLIC_LIBRARY_RUN_CONTRACT_ID =
  "run-contract.kp.animation.symbolic-manipulation-library-v0";

export function createSymbolicManipulationFamilyAgendaRows(
  query: string
): readonly SymbolicManipulationFamilyAgendaRow[] {
  return createSymbolicManipulationFamilyRegistry()
    .map(symbolicManipulationFamilyAgendaRow)
    .filter((row) => symbolicManipulationFamilyRowMatchesQuery(row, query));
}

export function createSymbolicManipulationFamilyFlashcardProjectionRows(
  query: string
): readonly SymbolicManipulationFamilyAgendaRow[] {
  return createSymbolicManipulationFamilyRegistry()
    .flatMap((family) =>
      family.flashcardHooks.map((hook) =>
        symbolicManipulationFamilyFlashcardProjectionRow(family, hook)
      )
    )
    .filter((row) => symbolicManipulationFamilyRowMatchesQuery(row, query));
}

export function createSymbolicManipulationLibraryProgressRows(
  query: string
): readonly SymbolicManipulationFamilyAgendaRow[] {
  const families = createSymbolicManipulationFamilyRegistry();
  const rows = [
    symbolicManipulationLibraryProgressRow("all", families),
    ...(["algebra", "calculus", "linear-algebra"] as const).map((domain) =>
      symbolicManipulationLibraryProgressRow(
        domain,
        families.filter((family) => family.domain === domain)
      )
    )
  ];

  return rows.filter((row) => symbolicManipulationFamilyRowMatchesQuery(row, query));
}

function symbolicManipulationLibraryProgressRow(
  scope: "all" | KpSymbolicManipulationFamily["domain"],
  families: readonly KpSymbolicManipulationFamily[]
): SymbolicManipulationFamilyAgendaRow {
  const metrics = symbolicManipulationLibraryProgressMetrics(families);
  const completedSlices = symbolicLibraryRunContract.slices.filter(
    (slice) => slice.status === "complete"
  ).length;
  const scopeLabel = scope === "all" ? "All domains" : scope;
  const blockers = metrics.blockers.length === 0
    ? "None"
    : metrics.blockers.join(", ");

  return {
    id: `symbolic-library-progress-${scope}`,
    title:
      scope === "all"
        ? "Symbolic manipulation library coverage"
        : `${scopeLabel} symbolic library coverage`,
    summary:
      `Tracks ${scopeLabel.toLowerCase()} symbolic family readiness, laws, graph equivalents, ` +
      "generated-problem hooks, flashcard hooks, and paused-frame drill-down coverage.",
    status: metrics.readyFamilyCount === metrics.familyCount ? "active" : "blocked",
    detail: `${metrics.readyFamilyCount}/${metrics.familyCount} families ready`,
    kind: "report",
    depth: 0,
    tags: [
      "symbolic-library",
      "progress",
      "coverage",
      "readiness",
      "law-status",
      ...(scope === "all" ? ["cross-domain"] : [scope])
    ],
    dataAttributes: [
      ["data-kp-symbolic-library-progress", scope],
      ["data-kp-symbolic-library-run-contract", symbolicLibraryRunContract.id],
      ["data-kp-symbolic-library-law-status", metrics.lawStatus]
    ],
    relatedIds: [
      symbolicLibraryRunContract.id,
      ...families.map((family) => family.id)
    ],
    previewFields: [
      { label: "Scope", value: scopeLabel },
      { label: "Run contract", value: symbolicLibraryRunContract.id },
      {
        label: "Loop progress",
        value: `${completedSlices}/${symbolicLibraryRunContract.slices.length} slices complete`
      },
      { label: "Families", value: String(metrics.familyCount) },
      { label: "Ready families", value: String(metrics.readyFamilyCount) },
      {
        label: "Transform definitions",
        value: String(metrics.transformationDefinitionCount)
      },
      { label: "Runtime samples", value: String(metrics.runtimeSampleCount) },
      { label: "Law checks", value: String(metrics.lawCheckCount) },
      { label: "Law status", value: metrics.lawStatus },
      {
        label: "Graph equivalents",
        value: String(metrics.graphEquivalentCount)
      },
      {
        label: "Generated problem hooks",
        value: String(metrics.generatedProblemHookCount)
      },
      {
        label: "Flashcard hooks",
        value: String(metrics.flashcardHookCount)
      },
      {
        label: "Paused-frame drill-down candidates",
        value: String(metrics.pausedFrameDrillDownCandidateCount)
      },
      { label: "Blockers", value: blockers }
    ],
    searchFields: [
      "semantic asset catalog",
      "symbolic manipulation library progress",
      "symbolic library coverage",
      "symbolic",
      "library",
      symbolicLibraryRunContract.id,
      `domain:${scope}`,
      `coverage:${metrics.readyFamilyCount}/${metrics.familyCount}`,
      `law-status:${metrics.lawStatus}`,
      `blockers:${metrics.blockers.length === 0 ? "none" : "present"}`,
      `graph-equivalents:${metrics.graphEquivalentCount}`,
      `generated-problem-hooks:${metrics.generatedProblemHookCount}`,
      `flashcard-hooks:${metrics.flashcardHookCount}`,
      "paused-frame-drilldown:available",
      ...families.flatMap((family) => [
        family.id,
        family.title,
        ...family.graphEquivalents.map((equivalent) => equivalent.id),
        ...family.generatedProblemHooks.map((hook) => hook.id),
        ...family.flashcardHooks.map((hook) => hook.id)
      ])
    ]
  };
}

interface SymbolicManipulationLibraryProgressMetrics {
  readonly familyCount: number;
  readonly readyFamilyCount: number;
  readonly transformationDefinitionCount: number;
  readonly runtimeSampleCount: number;
  readonly lawCheckCount: number;
  readonly lawStatus: "passed" | "failed";
  readonly graphEquivalentCount: number;
  readonly generatedProblemHookCount: number;
  readonly flashcardHookCount: number;
  readonly pausedFrameDrillDownCandidateCount: number;
  readonly blockers: readonly string[];
}

function symbolicManipulationLibraryProgressMetrics(
  families: readonly KpSymbolicManipulationFamily[]
): SymbolicManipulationLibraryProgressMetrics {
  const blockers = families.flatMap((family) =>
    symbolicManipulationFamilyProgressBlockers(family)
  );

  return {
    familyCount: families.length,
    readyFamilyCount: families.filter(
      (family) => symbolicManipulationFamilyProgressBlockers(family).length === 0
    ).length,
    transformationDefinitionCount: families.reduce(
      (count, family) => count + family.transformationDefinitions.length,
      0
    ),
    runtimeSampleCount: families.reduce(
      (count, family) => count + family.runtimeSamples.length,
      0
    ),
    lawCheckCount: families.reduce(
      (count, family) =>
        count +
        family.transformationDefinitions.reduce(
          (definitionCount, definition) =>
            definitionCount + (definition.lawRefs ?? []).length,
          0
        ) +
        family.graphEquivalents.reduce(
          (equivalentCount, equivalent) =>
            equivalentCount + (equivalent.lawRefs ?? []).length,
          0
        ),
      0
    ),
    lawStatus: blockers.some((blocker) => blocker.includes("validation"))
      ? "failed"
      : "passed",
    graphEquivalentCount: families.reduce(
      (count, family) => count + family.graphEquivalents.length,
      0
    ),
    generatedProblemHookCount: families.reduce(
      (count, family) => count + family.generatedProblemHooks.length,
      0
    ),
    flashcardHookCount: families.reduce(
      (count, family) => count + family.flashcardHooks.length,
      0
    ),
    pausedFrameDrillDownCandidateCount: new Set(
      families.flatMap((family) =>
        family.runtimeSamples.flatMap(
          (sample) => sample.transformationDefinitionIds ?? []
        )
      )
    ).size,
    blockers
  };
}

function symbolicManipulationFamilyProgressBlockers(
  family: KpSymbolicManipulationFamily
): readonly string[] {
  return [
    ...validateKpSymbolicManipulationFamily(family).map(
      (issue) => `${family.id}:validation:${issue.path}`
    ),
    ...(family.status === "seed" ? [`${family.id}:status:seed`] : []),
    ...(family.runtimeSamples.length === 0
      ? [`${family.id}:runtime-sample:missing`]
      : []),
    ...(family.graphEquivalents.length === 0
      ? [`${family.id}:graph-equivalent:missing`]
      : []),
    ...(family.generatedProblemHooks.length === 0
      ? [`${family.id}:generated-problem-hook:missing`]
      : []),
    ...(family.flashcardHooks.length === 0
      ? [`${family.id}:flashcard-hook:missing`]
      : [])
  ];
}

function symbolicManipulationFamilyFlashcardProjectionRow(
  family: KpSymbolicManipulationFamily,
  hook: KpSymbolicFlashcardHook
): SymbolicManipulationFamilyAgendaRow {
  const cardKind = symbolicFlashcardCardKind(hook.kind);

  return {
    id:
      `symbolic-flashcard-${dashboardIdPart(family.id)}` +
      `-${dashboardIdPart(hook.id)}`,
    title: `${family.title}: ${cardKind}`,
    summary:
      hook.summary ??
      `${cardKind} projection for symbolic family ${family.title}.`,
    status: family.status === "seed" ? "planned" : "active",
    detail: "symbolic flashcard hook",
    kind: "protocol-api",
    depth: 0,
    tags: [
      "symbolic-flashcard",
      family.domain,
      hook.kind,
      cardKind,
      "study"
    ],
    dataAttributes: [
      ["data-kp-symbolic-flashcard-family", family.id],
      ["data-kp-symbolic-flashcard-hook", hook.id],
      ["data-kp-symbolic-flashcard-kind", cardKind]
    ],
    relatedIds: [
      family.id,
      hook.id,
      ...hook.transformationDefinitionIds,
      SYMBOLIC_LIBRARY_RUN_CONTRACT_ID
    ],
    previewFields: [
      { label: "Symbolic family", value: family.id },
      { label: "Flashcard hook", value: hook.id },
      { label: "Hook kind", value: hook.kind },
      { label: "Card kind", value: cardKind },
      {
        label: "Transform definitions",
        value: hook.transformationDefinitionIds.join(", ")
      },
      { label: "Lesson markup", value: "not duplicated" }
    ],
    searchFields: [
      "semantic asset catalog",
      "symbolic family flashcard projection",
      "symbolic-flashcard",
      family.id,
      family.title,
      ...dashboardSearchTokens(family.title),
      family.domain,
      hook.id,
      hook.kind,
      cardKind,
      `flashcard:${cardKind}`,
      `hook-kind:${hook.kind}`,
      "lesson-markup:false",
      hook.summary ?? "",
      ...hook.transformationDefinitionIds
    ]
  };
}

function symbolicFlashcardCardKind(
  kind: KpSymbolicFlashcardHook["kind"]
): "cloze" | "focus-relationship" | "predict-next" {
  return kind === "focus" || kind === "relationship"
    ? "focus-relationship"
    : kind;
}

function dashboardIdPart(id: string): string {
  return id.replaceAll(".", "-");
}

function dashboardSearchTokens(value: string): readonly string[] {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function symbolicManipulationFamilyAgendaRow(
  family: KpSymbolicManipulationFamily
): SymbolicManipulationFamilyAgendaRow {
  const validation = validateKpSymbolicManipulationFamily(family);
  const tags = symbolicManipulationFamilyDashboardTags(family);
  const searchSummary = metadataString(family.metadata?.["searchSummary"]) ?? "";
  const graphEquivalentKinds = metadataList(
    family.metadata?.["graphEquivalentKinds"]
  );
  const practiceMaturity = symbolicManipulationFamilyPracticeMaturity(family);

  return {
    id: family.dashboard?.rowId ?? `symbolic-family-${family.id}`,
    title: family.title,
    summary:
      metadataString(family.metadata?.["summary"]) ??
      `Symbolic manipulation family for ${family.domain}.`,
    status: family.status === "seed" ? "planned" : "active",
    detail: "symbolic family",
    kind: "protocol-api",
    depth: 0,
    tags,
    dataAttributes: [
      ["data-kp-symbolic-family", family.id],
      ["data-kp-symbolic-family-domain", family.domain],
      ["data-kp-symbolic-family-status", family.status]
    ],
    relatedIds: [family.id, SYMBOLIC_LIBRARY_RUN_CONTRACT_ID],
    previewFields: [
      { label: "Symbolic family", value: family.id },
      { label: "Domain", value: family.domain },
      { label: "Family status", value: family.status },
      { label: "Object roles", value: String(family.objectRoles.length) },
      {
        label: "Transform definitions",
        value: String(family.transformationDefinitions.length)
      },
      { label: "Visual motifs", value: String(family.visualMotifs.length) },
      { label: "Runtime samples", value: String(family.runtimeSamples.length) },
      {
        label: "Graph equivalents",
        value: String(family.graphEquivalents.length)
      },
      {
        label: "Generated problem hooks",
        value: String(family.generatedProblemHooks.length)
      },
      { label: "Flashcard hooks", value: String(family.flashcardHooks.length) },
      { label: "Validation", value: validation.length === 0 ? "passed" : "failed" },
      { label: "Practice maturity", value: practiceMaturity }
    ],
    searchFields: [
      "semantic asset catalog",
      "symbolic manipulation family catalog",
      "symbolic family",
      family.id,
      family.title,
      family.domain,
      family.status,
      ...tags.filter((tag) => tag !== "symbolic-family" && tag !== family.domain && tag !== family.status),
      searchSummary,
      ...graphEquivalentKinds.map((kind) => `graph-equivalent:${kind}`),
      `flashcard-ready:${String(family.flashcardHooks.length > 0)}`,
      `generated-problem-ready:${String(family.generatedProblemHooks.length > 0)}`,
      `maturity:${practiceMaturity}`
    ]
  };
}

function symbolicManipulationFamilyPracticeMaturity(
  family: KpSymbolicManipulationFamily
): string {
  if (family.status === "seed") {
    return "seed";
  }

  if (
    family.generatedProblemHooks.length > 0 &&
    family.flashcardHooks.length > 0 &&
    family.runtimeSamples.length > 0
  ) {
    return "practice-ready";
  }

  if (family.generatedProblemHooks.length > 0) {
    return "generated-ready";
  }

  return "needs-hooks";
}

function symbolicManipulationFamilyRowMatchesQuery(
  row: SymbolicManipulationFamilyAgendaRow,
  query: string
): boolean {
  return projectDashboardTextFieldsMatch(
    [
      row.id,
      row.title,
      row.summary,
      row.status,
      row.detail,
      row.kind,
      ...row.tags,
      ...row.searchFields,
      ...row.previewFields.flatMap((field) => [field.label, field.value])
    ],
    query
  );
}

function metadataString(
  value: KpAssetMetadataValue | undefined
): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function metadataList(
  value: KpAssetMetadataValue | undefined
): readonly string[] {
  return typeof value === "string" && value.length > 0 ? value.split(",") : [];
}
