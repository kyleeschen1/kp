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
