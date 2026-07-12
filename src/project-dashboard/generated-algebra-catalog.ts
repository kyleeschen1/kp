import { runKpInterpreter } from "../semantic/asset-interpreter.ts";
import { createKpDashboardAssetPreviewInterpreter } from "../semantic/dashboard-preview-interpreter.ts";
import {
  createGeneratedLinearSolveTutorialFixtures,
  type GeneratedLinearSolveTutorialFixture
} from "../semantic/generated-algebra-tutorial-fixture.ts";
import {
  dashboardAssetPreviewDataAttributes,
  dashboardAssetPreviewFields,
  dashboardAssetPreviewSearchFields,
  type DashboardAssetPreviewField
} from "./asset-preview-fields.ts";
import { createGeneratedLinearSolveTutorialCardSampleTarget } from "./generated-fixture-sample-targets.ts";
import { projectDashboardTextFieldsMatch } from "./model.ts";
import {
  dashboardSampleTargetPreviewFields,
  dashboardSampleTargetPreviewLinks,
  dashboardSampleTargetSearchFields,
  type DashboardSampleTargetPreviewLink
} from "./sample-target-preview.ts";

export type GeneratedAlgebraAgendaPreviewField = DashboardAssetPreviewField;

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
  readonly previewLinks: readonly DashboardSampleTargetPreviewLink[];
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
    const sampleTargets = [
      createGeneratedLinearSolveTutorialCardSampleTarget(fixture)
    ];

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
        ...dashboardAssetPreviewDataAttributes(interpretation)
      ],
      relatedIds: ["asset-linear-solve-bundle", "port-algebra-trace-fixture"],
      previewFields: [
        { label: "Generated fixture", value: fixture.id },
        { label: "Initial LaTeX", value: initialLatex },
        { label: "Solved LaTeX", value: solvedLatex },
        { label: "Trace steps", value: String(fixture.trace.steps.length) },
        ...dashboardSampleTargetPreviewFields(sampleTargets),
        ...dashboardAssetPreviewFields(interpretation)
      ],
      previewLinks: dashboardSampleTargetPreviewLinks(sampleTargets),
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
        ...dashboardSampleTargetSearchFields(sampleTargets),
        ...dashboardAssetPreviewSearchFields(interpretation)
      ]
    };
  });

  return rows.filter((row) => generatedAlgebraRowMatchesQuery(row, query));
}

export function createGeneratedAlgebraMaturityAgendaRows(
  query: string
): readonly GeneratedAlgebraFixtureAgendaRow[] {
  const fixtures = createGeneratedLinearSolveTutorialFixtures();
  const rows: GeneratedAlgebraFixtureAgendaRow[] = [
    {
      id: "generated-linear-solve-family-maturity",
      title: "Generated linear-solve family maturity",
      summary:
        "Tracks generated fixture coverage across semantic closure, renderer preservation, port diagnostics, drill-downs, flashcards, and export manifests.",
      status: "active",
      detail: "generated family maturity",
      kind: "protocol-api",
      depth: 0,
      tags: [
        "generated",
        "algebra",
        "linear-solve",
        "maturity",
        "dependency-manifest"
      ],
      dataAttributes: [
        ["data-kp-generated-algebra-family", "generated.linear-solve"],
        ["data-kp-generated-algebra-maturity", "active"]
      ],
      relatedIds: [
        "asset-linear-solve-bundle",
        "port-algebra-trace-fixture",
        "generated-linear-solve-x-plus-3"
      ],
      previewFields: [
        { label: "Fixture family", value: "generated.linear-solve" },
        { label: "Fixtures", value: String(fixtures.length) },
        {
          label: "Semantic objects",
          value: String(sum(fixtures, (fixture) => fixture.bundle.objects.length))
        },
        {
          label: "Transformations",
          value: String(sum(fixtures, (fixture) => fixture.transformations.length))
        },
        {
          label: "Drill-down hooks",
          value: String(sum(fixtures, (fixture) => fixture.drillDownHooks.length))
        },
        {
          label: "Flashcards",
          value: String(sum(fixtures, (fixture) => fixture.flashcards.length))
        },
        { label: "Dependency manifests", value: "iframe, static-step" },
        { label: "Closure law", value: "asset-fixture.reference-closure" },
        {
          label: "Renderer law",
          value: "renderer-frame.semantic-preservation"
        },
        {
          label: "Port diagnostics",
          value: "trace-transformation-mismatch, trace-rule-mismatch"
        }
      ],
      previewLinks: [],
      searchFields: [
        "semantic asset catalog",
        "generated algebra fixture catalog",
        "generated fixture maturity",
        "generated fixture dependency manifests",
        "linear solve fixture family",
        "asset-fixture.reference-closure",
        "renderer-frame semantic-preservation",
        "trace-transformation-mismatch",
        "trace-rule-mismatch",
        "dependency-manifest",
        "iframe static-step",
        ...fixtures.map((fixture) => fixture.id),
        ...fixtures.flatMap((fixture) =>
          fixture.transformations.map((transformation) => transformation.id)
        ),
        ...fixtures.flatMap((fixture) =>
          fixture.drillDownHooks.map((hook) => hook.id)
        ),
        ...fixtures.flatMap((fixture) =>
          fixture.flashcards.map((flashcard) => flashcard.id)
        )
      ]
    }
  ];

  return rows.filter((row) => generatedAlgebraRowMatchesQuery(row, query));
}

function agendaIdFromGeneratedFixtureId(id: string): string {
  return `generated-${id.replace(/^generated\./, "").replaceAll(".", "-")}`;
}

function sum<T>(values: readonly T[], select: (value: T) => number): number {
  return values.reduce((total, value) => total + select(value), 0);
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
