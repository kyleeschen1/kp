import { createLinearSolveKpAssetBundle } from "../semantic/linear-solve-asset.ts";
import {
  createEquationToGraphRepresentationSample,
  createEquationToMatrixRepresentationSample,
  type EquationToGraphRepresentationSample,
  type EquationToMatrixRepresentationSample
} from "../animation/representation-transform-samples.ts";
import type { KpAssetMetadataValue } from "../semantic/asset.ts";
import { projectDashboardTextFieldsMatch } from "./model.ts";
import {
  createAnimationAssetAgendaRows,
  createGeneratedAlgebraFixtureAgendaRows,
  createGeneratedAlgebraMaturityAgendaRows,
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
    ...createAnimationAssetAgendaRows(query),
    ...createRepresentationTransformAgendaRows(query),
    ...createGeneratedAlgebraMaturityAgendaRows(query),
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
        "semantic asset catalog",
        "linear solve drill-down catalog",
        "transformation explanation catalog",
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
        "semantic asset catalog",
        "linear solve flashcard catalog",
        "spaced repetition catalog",
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

function createRepresentationTransformAgendaRows(
  query: string
): readonly SemanticAssetCatalogAgendaRow[] {
  const rows = [
    representationTransformRow(createEquationToGraphRepresentationSample()),
    representationTransformRow(createEquationToMatrixRepresentationSample())
  ];

  return rows.filter((row) => semanticAssetRowMatchesQuery(row, query));
}

function representationTransformRow(
  sample:
    | EquationToGraphRepresentationSample
    | EquationToMatrixRepresentationSample
): SemanticAssetCatalogAgendaRow {
  const targetAnimation = sample.result.targetAnimation;
  const targetRenderTarget = targetAnimation.renderTargets[0];
  const metadata = targetRenderTarget?.metadata ?? {};
  const derivation =
    metadataString(metadata["graphDerivationCapability"]) ??
    metadataString(metadata["matrixDerivationCapability"]) ??
    "None";

  return {
    id: agendaIdFromSemanticId("representation", sample.transform.id),
    title: sample.transform.title,
    summary:
      `${sample.transform.sourceRepresentation} to ${sample.transform.targetRepresentation} representation transform preserving semantic animation identity.`,
    status: "active",
    detail: "representation transform",
    kind: "protocol-api",
    depth: 0,
    tags: [
      "representation-transform",
      sample.transform.sourceRepresentation,
      sample.transform.targetRepresentation,
      "animation"
    ],
    dataAttributes: [
      ["data-kp-representation-transform", sample.transform.id],
      ["data-kp-source-representation", sample.transform.sourceRepresentation],
      ["data-kp-target-representation", sample.transform.targetRepresentation]
    ],
    relatedIds: [
      sample.sourceAnimation.id,
      targetAnimation.id,
      targetRenderTarget?.id ?? ""
    ].filter((id) => id.length > 0),
    previewFields: [
      { label: "Representation transform", value: sample.transform.id },
      {
        label: "Source representation",
        value: sample.transform.sourceRepresentation
      },
      {
        label: "Target representation",
        value: sample.transform.targetRepresentation
      },
      { label: "Preservation", value: sample.transform.preservation },
      { label: "Source animation", value: sample.sourceAnimation.id },
      {
        label: "Target render target",
        value: `${targetRenderTarget?.id ?? "None"} (${targetRenderTarget?.kind ?? "none"})`
      },
      { label: "Derivation", value: derivation },
      ...representationSamplePreviewFields(sample),
      {
        label: "Diagnostics",
        value: sample.result.diagnostics.length === 0 ? "passed" : "failed"
      }
    ],
    searchFields: [
      "semantic asset catalog",
      "representation transform catalog",
      "representation transform",
      sample.transform.id,
      sample.transform.title,
      sample.transform.sourceRepresentation,
      sample.transform.targetRepresentation,
      `${sample.transform.sourceRepresentation}-to-${sample.transform.targetRepresentation}`,
      sample.sourceAnimation.id,
      targetAnimation.id,
      targetRenderTarget?.id ?? "",
      targetRenderTarget?.kind ?? "",
      derivation,
      ...metadataSearchFields(metadata),
      ...representationSampleSearchFields(sample)
    ]
  };
}

function representationSamplePreviewFields(
  sample:
    | EquationToGraphRepresentationSample
    | EquationToMatrixRepresentationSample
): readonly SemanticAssetAgendaPreviewField[] {
  if ("graphSceneObjectIds" in sample) {
    return [
      {
        label: "Graph scene objects",
        value: sample.graphSceneObjectIds.join(", ")
      }
    ];
  }

  return [
    {
      label: "Matrix rows",
      value: sample.matrixRows.map((row) => row.join(" ")).join("; ")
    }
  ];
}

function representationSampleSearchFields(
  sample:
    | EquationToGraphRepresentationSample
    | EquationToMatrixRepresentationSample
): readonly string[] {
  if ("graphSceneObjectIds" in sample) {
    return sample.graphSceneObjectIds;
  }

  return sample.matrixRows.flatMap((row) => row.map(String));
}

function agendaIdFromSemanticId(prefix: string, id: string): string {
  return `${prefix}-${id.replace(/^(card|drilldown|generated|representation)\./, "").replaceAll(".", "-")}`;
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

function metadataString(
  value: KpAssetMetadataValue | undefined
): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function metadataSearchFields(
  metadata: Readonly<Record<string, KpAssetMetadataValue>>
): readonly string[] {
  return Object.entries(metadata).flatMap(([key, value]) => {
    const stringValue = String(value);

    return [key, stringValue, `${key}:${stringValue}`];
  });
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
