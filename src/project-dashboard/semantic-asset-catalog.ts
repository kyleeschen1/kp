import { createLinearSolveKpAssetBundle } from "../semantic/linear-solve-asset.ts";
import { projectDashboardTextFieldsMatch } from "./model.ts";
import {
  createGeneratedAlgebraFixtureAgendaRows,
  type GeneratedAlgebraAgendaPreviewField,
  type GeneratedAlgebraFixtureAgendaRow
} from "./generated-algebra-catalog.ts";

export interface SemanticAssetAgendaPreviewField {
  readonly label: string;
  readonly value: string;
}

export interface SemanticAssetCatalogAgendaRow {
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
  readonly previewFields: readonly (
    SemanticAssetAgendaPreviewField | GeneratedAlgebraAgendaPreviewField
  )[];
  readonly searchFields: readonly string[];
}

export function createSemanticAssetCatalogAgendaRows(
  query: string
): readonly (SemanticAssetCatalogAgendaRow | GeneratedAlgebraFixtureAgendaRow)[] {
  return [
    ...createLinearSolveDerivedAgendaRows(query),
    ...createGeneratedAlgebraFixtureAgendaRows(query)
  ];
}

function createLinearSolveDerivedAgendaRows(
  query: string
): readonly SemanticAssetCatalogAgendaRow[] {
  const asset = createLinearSolveKpAssetBundle();
  const rows: SemanticAssetCatalogAgendaRow[] = [
    ...asset.drillDownHooks.map((hook) => ({
      id: agendaIdFromSemanticId("drilldown", hook.id),
      title: hook.title,
      summary: hook.summary ?? `Drill-down for ${hook.transformationId}.`,
      status: "active",
      detail: "drill-down hook",
      kind: "protocol-api",
      depth: 0,
      tags: ["drilldown", "linear-solve", "semantic", "explanation"],
      dataAttributes: [["data-kp-linear-solve-drilldown", hook.id] as [string, string]],
      relatedIds: ["asset-linear-solve-bundle"],
      previewFields: [
        { label: "Drill-down hook", value: hook.id },
        { label: "Transformation", value: hook.transformationId },
        { label: "Explainer asset", value: hook.asset.id },
        { label: "Explainer objects", value: String(hook.asset.objects.length) }
      ],
      searchFields: [
        hook.id,
        hook.transformationId,
        hook.asset.id,
        hook.asset.title,
        ...hook.asset.objects.map((object) => object.id)
      ]
    })),
    ...asset.flashcards.map((card) => ({
      id: agendaIdFromSemanticId("flashcard", card.id),
      title: card.title,
      summary: card.prompt,
      status: "active",
      detail: card.kind,
      kind: "protocol-api",
      depth: 0,
      tags: ["flashcard", "linear-solve", card.kind, "study"],
      dataAttributes: [["data-kp-linear-solve-flashcard", card.id] as [string, string]],
      relatedIds: ["asset-linear-solve-bundle", "asset-linear-solve-flashcards"],
      previewFields: [
        { label: "Flashcard id", value: card.id },
        { label: "Flashcard kind", value: card.kind },
        ...previewListField("Selectors", card.selectorIds),
        ...previewListField("Transformations", card.transformationIds),
        { label: "Answer", value: formatFlashcardAnswer(card.answer) }
      ],
      searchFields: [
        card.id,
        card.kind,
        card.prompt,
        ...(card.selectorIds ?? []),
        ...(card.transformationIds ?? []),
        card.answer?.value ?? ""
      ]
    }))
  ];

  return rows.filter((row) => semanticAssetRowMatchesQuery(row, query));
}

function agendaIdFromSemanticId(prefix: string, id: string): string {
  return `${prefix}-${id.replace(/^(card|drilldown|generated)\./, "").replaceAll(".", "-")}`;
}

function formatFlashcardAnswer(
  answer: { readonly kind: string; readonly value: string } | undefined
): string {
  return answer === undefined ? "None" : `${answer.kind}: ${answer.value}`;
}

function previewListField(
  label: string,
  values: readonly string[] | undefined
): readonly SemanticAssetAgendaPreviewField[] {
  return values === undefined || values.length === 0
    ? []
    : [{ label, value: values.join(", ") }];
}

function semanticAssetRowMatchesQuery(
  row: SemanticAssetCatalogAgendaRow,
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
