import {
  createSymbolicManipulationFamilyRegistry
} from "../animation/symbolic-manipulation-family-registry.ts";
import {
  symbolicManipulationFamilyDashboardTags,
  validateKpSymbolicManipulationFamily,
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

function symbolicManipulationFamilyAgendaRow(
  family: KpSymbolicManipulationFamily
): SymbolicManipulationFamilyAgendaRow {
  const validation = validateKpSymbolicManipulationFamily(family);
  const tags = symbolicManipulationFamilyDashboardTags(family);
  const searchSummary = metadataString(family.metadata?.["searchSummary"]) ?? "";
  const graphEquivalentKinds = metadataList(
    family.metadata?.["graphEquivalentKinds"]
  );

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
      { label: "Validation", value: validation.length === 0 ? "passed" : "failed" }
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
      `generated-problem-ready:${String(family.generatedProblemHooks.length > 0)}`
    ]
  };
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
