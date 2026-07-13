import { runKpInterpreter } from "../semantic/asset-interpreter.ts";
import {
  createGeneratedAlgebraAnimationAssets
} from "../animation/catalog.ts";
import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw,
  type KpAnimationAsset
} from "../animation/asset.ts";
import {
  sampleKpAnimationFrameDescriptor
} from "../animation/frame-descriptor.ts";
import { createKpDashboardAssetPreviewInterpreter } from "../semantic/dashboard-preview-interpreter.ts";
import {
  createGeneratedAlgebraTutorialFixtures,
  createGeneratedLinearSolveTutorialFixtures,
  type GeneratedAlgebraTutorialFixture
} from "../semantic/generated-algebra-tutorial-fixture.ts";
import {
  defaultEquationTransformVisualMotifRules
} from "../rendering/equation-visual-motif-defaults.ts";
import {
  dashboardAssetPreviewDataAttributes,
  dashboardAssetPreviewFields,
  dashboardAssetPreviewSearchFields,
  type DashboardAssetPreviewField
} from "./asset-preview-fields.ts";
import {
  createGeneratedAlgebraTutorialCardSampleTarget,
  createGeneratedLinearSolveTutorialCardSampleTarget
} from "./generated-fixture-sample-targets.ts";
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
    const transformDefinitionIds = definitionIdsForFixture(fixture);

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
        [
          "data-kp-generated-algebra-transform-definitions",
          transformDefinitionIds.join(" ")
        ] as [string, string],
        ...dashboardAssetPreviewDataAttributes(interpretation)
      ],
      relatedIds: [
        "asset-linear-solve-bundle",
        "port-algebra-trace-fixture",
        ...transformDefinitionIds
      ],
      previewFields: [
        { label: "Generated fixture", value: fixture.id },
        { label: "Initial LaTeX", value: initialLatex },
        { label: "Solved LaTeX", value: solvedLatex },
        { label: "Trace steps", value: String(fixture.trace.steps.length) },
        {
          label: "Transform definitions",
          value: transformDefinitionIds.join(", ")
        },
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
          transformation.definitionId ?? "",
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

export function createGeneratedAlgebraAnimationAssetAgendaRows(
  query: string
): readonly GeneratedAlgebraFixtureAgendaRow[] {
  const rows = createGeneratedAlgebraAnimationAssets().map(
    (animation): GeneratedAlgebraFixtureAgendaRow => {
      const transformDefinitionIds = animationDefinitionIds(animation);
      const renderTargetIds = animation.renderTargets.map((target) => target.id);
      const exportTargetIds = animation.exportTargets.map((target) => target.id);
      const sourceRefIds = animation.dashboard?.sourceRefIds ?? [];
      const midpointFrame = sampleKpAnimationFrameDescriptor({
        id: `frame.${animation.id}.preview-midpoint`,
        animation,
        direction: "forward",
        progress: 0.5
      });
      const referenceClosure = checkKpAnimationAssetReferenceClosure(animation);
      const seekRewind = checkKpAnimationAssetSeekRewindLaw(animation);

      return {
        id: animation.dashboard?.rowId ?? `animation-${animation.id}`,
        title: animation.title,
        summary:
          `Composable animation asset with ${animation.bundle.objects.length} semantic objects and ${animation.transformations.length} transformations.`,
        status: "active",
        detail: "animation asset",
        kind: "protocol-api",
        depth: 0,
        tags: animation.dashboard?.tags ?? ["animation"],
        dataAttributes: [
          ["data-kp-animation-asset", animation.id] as [string, string],
          ["data-kp-animation-timeline", animation.timeline?.id ?? ""] as [
            string,
            string
          ],
          [
            "data-kp-animation-transformations",
            animation.transformations
              .map((transformation) => transformation.id)
              .join(" ")
          ] as [string, string],
          [
            "data-kp-animation-render-targets",
            renderTargetIds.join(" ")
          ] as [string, string]
        ],
        relatedIds: [
          animation.id,
          animation.bundle.id,
          animation.transformationTree.root.id,
          ...transformDefinitionIds,
          ...renderTargetIds,
          ...exportTargetIds
        ],
        previewFields: [
          { label: "Animation asset", value: animation.id },
          { label: "Bundle", value: animation.bundle.id },
          { label: "Timeline", value: animation.timeline?.id ?? "None" },
          { label: "Beats", value: String(animation.timeline?.beatCount ?? 0) },
          {
            label: "Duration",
            value:
              animation.timeline?.durationMs === undefined
                ? "None"
                : `${animation.timeline.durationMs}ms`
          },
          { label: "Layout", value: animation.layout?.kind ?? "None" },
          {
            label: "Semantic objects",
            value: String(animation.bundle.objects.length)
          },
          {
            label: "Transformations",
            value: String(animation.transformations.length)
          },
          {
            label: "Transform definitions",
            value: transformDefinitionIds.join(", ")
          },
          {
            label: "Render targets",
            value: renderTargetIds.join(", ")
          },
          {
            label: "Export targets",
            value: exportTargetIds.join(", ")
          },
          {
            label: "Reference closure",
            value: formatLawStatus(referenceClosure.passed)
          },
          {
            label: "Seek/Rewind law",
            value: formatLawStatus(seekRewind.passed)
          },
          {
            label: "Midpoint phase",
            value:
              `${midpointFrame.phaseId}: ${midpointFrame.nodeIds.join(", ")}`
          },
          {
            label: "Midpoint beat",
            value: String(midpointFrame.beat ?? "None")
          }
        ],
        previewLinks: [],
        searchFields: [
          "semantic asset catalog",
          "animation asset catalog",
          "composable animation asset",
          "generated algebra animation asset",
          "motif source",
          animation.id,
          animation.title,
          animation.bundle.id,
          animation.transformationTree.root.id,
          animation.timeline?.id ?? "",
          animation.layout?.id ?? "",
          animation.layout?.kind ?? "",
          `reference-closure:${formatLawStatus(referenceClosure.passed)}`,
          `seek-rewind:${formatLawStatus(seekRewind.passed)}`,
          midpointFrame.phaseId,
          ...midpointFrame.nodeIds,
          ...(animation.dashboard?.tags ?? []),
          ...sourceRefIds,
          ...sourceRefIds.map((sourceRefId) => `source:${sourceRefId}`),
          ...animation.bundle.objects.map((object) => object.id),
          ...animation.transformations.flatMap((transformation) => [
            transformation.id,
            transformation.title,
            transformation.transformType,
            `transform:${transformation.transformType}`,
            transformation.definitionId ?? "",
            ...(transformation.definitionId === undefined
              ? []
              : [`definition:${transformation.definitionId}`]),
            ...transformation.sourceObjectIds,
            ...transformation.targetObjectIds
          ]),
          ...renderTargetIds,
          ...exportTargetIds
        ]
      };
    }
  );

  return rows.filter((row) => generatedAlgebraRowMatchesQuery(row, query));
}

export function createGeneratedAlgebraMaturityAgendaRows(
  query: string
): readonly GeneratedAlgebraFixtureAgendaRow[] {
  const rows = generatedFixturesGroupedByFamily(
    createGeneratedAlgebraTutorialFixtures()
  ).map(({ familyId, fixtures }): GeneratedAlgebraFixtureAgendaRow => {
    const familyLabel = familyId.replace(/^generated\./, "");
    const sampleTargets = fixtures.map((fixture) =>
      createGeneratedAlgebraTutorialCardSampleTarget(fixture)
    );
    const transformTypes = uniqueStrings(
      fixtures.flatMap((fixture) =>
        fixture.transformations.map((transformation) => transformation.transformType)
      )
    );
    const transformDefinitionIds = uniqueStrings(
      fixtures.flatMap(definitionIdsForFixture)
    );
    const motifKinds = uniqueStrings(
      transformTypes.flatMap((transformType) =>
        defaultEquationTransformVisualMotifRules
          .filter((rule) => rule.transformationKind === transformType)
          .map((rule) => rule.descriptor.kind)
      )
    );

    return {
      id: `generated-${familyLabel.replaceAll(".", "-")}-family-maturity`,
      title: `Generated ${familyLabel} family maturity`,
      summary:
        "Tracks generated fixture coverage across semantic closure, renderer preservation, port diagnostics, drill-downs, flashcards, and export manifests.",
      status: "active",
      detail: "generated family maturity",
      kind: "protocol-api",
      depth: 0,
      tags: [
        "generated",
        "algebra",
        familyLabel,
        "maturity",
        "dependency-manifest"
      ],
      dataAttributes: [
        ["data-kp-generated-algebra-family", familyId] as [string, string],
        ["data-kp-generated-algebra-maturity", "active"] as [string, string],
        [
          "data-kp-generated-algebra-transform-definitions",
          transformDefinitionIds.join(" ")
        ] as [string, string]
      ],
      relatedIds: [
        "port-algebra-trace-fixture",
        ...transformDefinitionIds,
        ...fixtures.map((fixture) => agendaIdFromGeneratedFixtureId(fixture.id))
      ],
      previewFields: [
        { label: "Fixture family", value: familyId },
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
        {
          label: "Transform definitions",
          value: String(transformDefinitionIds.length)
        },
        ...dashboardSampleTargetPreviewFields(sampleTargets),
        { label: "Closure law", value: "asset-fixture.reference-closure" },
        {
          label: "Renderer law",
          value: "renderer-frame.semantic-preservation"
        },
        {
          label: "Port diagnostics",
          value:
            "trace-latex-mismatch, trace-transformation-mismatch, trace-rule-mismatch"
        }
      ],
      previewLinks: dashboardSampleTargetPreviewLinks(sampleTargets),
      searchFields: [
        "semantic asset catalog",
        "generated algebra fixture catalog",
        "generated fixture maturity",
        "generated fixture dependency manifests",
        `${familyLabel} fixture family`,
        `family:${familyId}`,
        "maturity:active",
        familyId,
        "asset-fixture.reference-closure",
        "renderer-frame semantic-preservation",
        "trace-latex-mismatch",
        "trace-transformation-mismatch",
        "trace-rule-mismatch",
        "dependency-manifest",
        "iframe static-step",
        ...transformTypes.map((transformType) => `transform:${transformType}`),
        ...transformDefinitionIds,
        ...transformDefinitionIds.map((definitionId) => `definition:${definitionId}`),
        ...motifKinds.map((motifKind) => `motif:${motifKind}`),
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
    };
  });

  return rows.filter((row) => generatedAlgebraRowMatchesQuery(row, query));
}

function agendaIdFromGeneratedFixtureId(id: string): string {
  return `generated-${id.replace(/^generated\./, "").replaceAll(".", "-")}`;
}

function sum<T>(values: readonly T[], select: (value: T) => number): number {
  return values.reduce((total, value) => total + select(value), 0);
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values));
}

function definitionIdsForFixture(
  fixture: GeneratedAlgebraTutorialFixture
): readonly string[] {
  return uniqueStrings(
    fixture.transformations.flatMap((transformation) =>
      transformation.definitionId === undefined
        ? []
        : [transformation.definitionId]
    )
  );
}

function animationDefinitionIds(
  animation: KpAnimationAsset
): readonly string[] {
  return uniqueStrings(
    animation.transformations.flatMap((transformation) =>
      transformation.definitionId === undefined
        ? []
        : [transformation.definitionId]
    )
  );
}

function formatLawStatus(passed: boolean): string {
  return passed ? "passed" : "failed";
}

function latexValueAt(
  fixture: GeneratedAlgebraTutorialFixture,
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

function generatedFixturesGroupedByFamily(
  fixtures: readonly GeneratedAlgebraTutorialFixture[]
): readonly {
  readonly familyId: GeneratedAlgebraTutorialFixture["familyId"];
  readonly fixtures: readonly GeneratedAlgebraTutorialFixture[];
}[] {
  const groups = new Map<
    GeneratedAlgebraTutorialFixture["familyId"],
    GeneratedAlgebraTutorialFixture[]
  >();

  fixtures.forEach((fixture) => {
    const group = groups.get(fixture.familyId) ?? [];

    group.push(fixture);
    groups.set(fixture.familyId, group);
  });

  return Array.from(groups, ([familyId, familyFixtures]) => ({
    familyId,
    fixtures: familyFixtures
  }));
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
      ...searchablePreviewFields(row).flatMap((field) => [
        field.label,
        field.value
      ])
    ],
    query
  );
}

function searchablePreviewFields(
  row: GeneratedAlgebraFixtureAgendaRow
): readonly GeneratedAlgebraAgendaPreviewField[] {
  if (row.detail !== "generated family maturity") {
    return row.previewFields;
  }

  // Family maturity rows summarize many samples; keep sample target labels display-only
  // so formula-specific searches resolve to concrete fixture rows.
  return row.previewFields.filter(
    (field) =>
      field.label !== "Sample targets" &&
      !field.label.startsWith("Tutorial card ")
  );
}
