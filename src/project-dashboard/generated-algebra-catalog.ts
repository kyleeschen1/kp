import { runKpInterpreter, type KpInterpretation } from "../semantic/asset-interpreter.ts";
import {
  createKpDashboardAssetPreviewInterpreter,
  type KpDashboardAssetPreview
} from "../semantic/dashboard-preview-interpreter.ts";
import {
  createGeneratedLinearSolveTutorialFixtures,
  type GeneratedLinearSolveTutorialFixture
} from "../semantic/generated-algebra-tutorial-fixture.ts";
import { projectDashboardTextFieldsMatch } from "./model.ts";

export interface GeneratedAlgebraAgendaPreviewField {
  readonly label: string;
  readonly value: string;
}

export interface GeneratedAlgebraFixtureAgendaRow {
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
  readonly previewFields: readonly GeneratedAlgebraAgendaPreviewField[];
  readonly searchFields: readonly string[];
}

export function createGeneratedAlgebraFixtureAgendaRows(
  query: string
): readonly GeneratedAlgebraFixtureAgendaRow[] {
  const rows = createGeneratedLinearSolveTutorialFixtures().map((fixture) => {
    const interpretation = runKpInterpreter(
      createKpDashboardAssetPreviewInterpreter(),
      fixture.bundle
    );
    const initialLatex = latexValueAt(fixture, 0);
    const solvedLatex = latexValueAt(fixture, fixture.bundle.objects.length - 1);

    return {
      id: agendaIdFromGeneratedFixtureId(fixture.id),
      title: fixture.title,
      summary: `Generated algebra tutorial fixture from ${initialLatex} to ${solvedLatex}.`,
      status: "active",
      detail: "generated algebra",
      kind: "protocol-api",
      depth: 0,
      tags: ["generated", "algebra", "linear-solve", "fixture"],
      dataAttributes: [
        ["data-kp-generated-algebra-fixture", fixture.id] as [string, string],
        ...semanticAssetPreviewDataAttributes(interpretation)
      ],
      relatedIds: ["asset-linear-solve-bundle", "port-algebra-trace-fixture"],
      previewFields: [
        { label: "Generated fixture", value: fixture.id },
        { label: "Initial LaTeX", value: initialLatex },
        { label: "Solved LaTeX", value: solvedLatex },
        { label: "Trace steps", value: String(fixture.trace.steps.length) },
        ...semanticAssetPreviewFields(interpretation)
      ],
      searchFields: [
        "semantic asset catalog",
        "generated algebra fixture catalog",
        "generated tutorial fixture",
        "linear solve fixture family",
        fixture.id,
        fixture.title,
        fixture.bundle.id,
        fixture.diagram.id,
        initialLatex,
        solvedLatex,
        ...fixture.transformations.flatMap((transformation) => [
          transformation.id,
          transformation.title,
          transformation.transformType,
          ...transformation.sourceObjectIds,
          ...transformation.targetObjectIds
        ]),
        ...fixture.trace.steps.flatMap((step) => [step.id, step.latex]),
        ...fixture.flashcards.flatMap((card) => [
          card.id,
          card.kind,
          card.title,
          card.prompt,
          ...(card.selectorIds ?? []),
          ...(card.transformationIds ?? [])
        ]),
        ...semanticAssetPreviewSearchFields(interpretation)
      ]
    };
  });

  return rows.filter((row) => generatedAlgebraRowMatchesQuery(row, query));
}

function agendaIdFromGeneratedFixtureId(id: string): string {
  return `generated-${id.replace(/^generated\./, "").replaceAll(".", "-")}`;
}

function latexValueAt(
  fixture: GeneratedLinearSolveTutorialFixture,
  index: number
): string {
  const value = fixture.bundle.objects[index]?.value;

  return (
    typeof value === "object" &&
    value !== null &&
    "latex" in value &&
    typeof value.latex === "string"
  )
    ? value.latex
    : "";
}

function semanticAssetPreviewFields(
  interpretation: KpInterpretation<KpDashboardAssetPreview>
): readonly GeneratedAlgebraAgendaPreviewField[] {
  return [
    { label: "Dashboard interpreter", value: interpretation.interpreterId },
    { label: "Asset summary", value: interpretation.output.summary },
    ...interpretation.output.fields,
    ...previewListField(
      "Asset diagnostics",
      interpretation.diagnostics.map((diagnostic) => diagnostic.message)
    )
  ];
}

function semanticAssetPreviewSearchFields(
  interpretation: KpInterpretation<KpDashboardAssetPreview>
): readonly string[] {
  return [
    interpretation.interpreterId,
    interpretation.output.summary,
    ...interpretation.output.searchFields,
    ...interpretation.diagnostics.map((diagnostic) => diagnostic.message)
  ];
}

function semanticAssetPreviewDataAttributes(
  interpretation: KpInterpretation<KpDashboardAssetPreview>
): readonly [string, string][] {
  return [["data-kp-dashboard-preview-interpreter", interpretation.interpreterId]];
}

function previewListField(
  label: string,
  values: readonly string[] | undefined
): readonly GeneratedAlgebraAgendaPreviewField[] {
  return values === undefined || values.length === 0
    ? []
    : [{ label, value: values.join(", ") }];
}

function generatedAlgebraRowMatchesQuery(
  row: GeneratedAlgebraFixtureAgendaRow,
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
