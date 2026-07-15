import { runKpInterpreter } from "../semantic/asset-interpreter.ts";
import {
  createKpAnimationAssets,
  createGeneratedAlgebraAnimationAssets
} from "../animation/catalog.ts";
import {
  createKpAnimationFlashcardProjections
} from "../animation/flashcard-projection.ts";
import {
  createKpAnimationFlashcardPreviewRendererData
} from "../animation/flashcard-preview-renderer-data.ts";
import {
  createLinearSolveFlashcardRendererSample,
  type LinearSolveFlashcardRendererSample
} from "../animation/flashcard-renderer-sample.ts";
import {
  createLinearSolvePausedFrameDrillDownSample,
  type KpAnimationPausedFrameDrillDownSample
} from "../animation/paused-frame-drilldown.ts";
import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw,
  type KpAnimationAsset
} from "../animation/asset.ts";
import {
  createKpAnimationRuntimeScrubberControl,
  sampleKpAnimationRuntimeFrame,
  type KpAnimationRuntimeChildFrame,
  type KpAnimationRuntimeScrubberControl
} from "../animation/runtime-sampler.ts";
import {
  createKpAnimationVisualFrameDiagnosticsPanelData,
  type KpAnimationVisualFrameDiagnosticsPanelData
} from "../animation/visual-frame-diagnostics-panel.ts";
import { createKpDashboardAssetPreviewInterpreter } from "../semantic/dashboard-preview-interpreter.ts";
import {
  createGeneratedAlgebraTutorialFixtures,
  createGeneratedLinearSolveTutorialFixtures,
  type GeneratedAlgebraTutorialFixture
} from "../semantic/generated-algebra-tutorial-fixture.ts";
import {
  createGeneratedCalculusProblemFixtures
} from "../semantic/generated-calculus-problem-fixture.ts";
import {
  createGeneratedLinearAlgebraProblemFixtures
} from "../semantic/generated-linear-algebra-problem-fixture.ts";
import {
  createGeneratedProblemRegistryRecords,
  type GeneratedProblemRegistryRecord
} from "../semantic/generated-problem-registry.ts";
import type {
  KpFlashcardSpec
} from "../semantic/asset-flashcard.ts";
import {
  createLinearSolveKpAssetBundle
} from "../semantic/linear-solve-asset.ts";
import {
  defaultEquationTransformVisualMotifRules
} from "../rendering/equation-visual-motif-defaults.ts";
import {
  createLinearSolveRuntimeVisualFrameSample,
  type LinearSolveRuntimeVisualFrameSample
} from "../rendering/linear-solve-runtime-visual-sample.ts";
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
import { createKpEditorAnimationLibrary } from "../editor/animation-library.ts";
import {
  kpEditorAnimationSelectionHref
} from "../editor/animation-selection-route.ts";

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
  return createAnimationAssetAgendaRowsForAssets({
    animations: createGeneratedAlgebraAnimationAssets(),
    catalogSearchLabel: "generated algebra animation asset",
    query
  });
}

export function createGeneratedProblemRegistryAgendaRows(
  query: string
): readonly GeneratedAlgebraFixtureAgendaRow[] {
  const rows = createGeneratedProblemRegistryRecords().map(
    generatedProblemRegistryAgendaRow
  );

  return rows.filter((row) => generatedAlgebraRowMatchesQuery(row, query));
}

export function createAnimationAssetAgendaRows(
  query: string
): readonly GeneratedAlgebraFixtureAgendaRow[] {
  return createAnimationAssetAgendaRowsForAssets({
    animations: createKpAnimationAssets(),
    catalogSearchLabel: "animation asset catalog",
    query
  });
}

function createAnimationAssetAgendaRowsForAssets(input: {
  readonly animations: readonly KpAnimationAsset[];
  readonly catalogSearchLabel: string;
  readonly query: string;
}): readonly GeneratedAlgebraFixtureAgendaRow[] {
  const editorDescriptors = createKpEditorAnimationLibrary();
  const rows = input.animations.map(
    (animation): GeneratedAlgebraFixtureAgendaRow => {
      const transformDefinitionIds = animationDefinitionIds(animation);
      const renderTargetIds = animation.renderTargets.map((target) => target.id);
      const renderTargetKinds = uniqueStrings(
        animation.renderTargets.map((target) => target.kind)
      );
      const exportTargetIds = animation.exportTargets.map((target) => target.id);
      const objectTypes = uniqueStrings(
        animation.bundle.objects.map((object) => object.objectType)
      );
      const sourceRefIds = animation.dashboard?.sourceRefIds ?? [];
      const childAnimationIds = childAnimationIdsForAnimation(animation);
      const checkFacets = animation.checks.map(
        (check) => `${check.lawId}:${check.level}`
      );
      const metadataSearchFields = animationMetadataSearchFields(
        animation.metadata
      );
      const renderTargetMetadataSearchFields = animation.renderTargets.flatMap(
        (target) => animationMetadataSearchFields(target.metadata)
      );
      const bundleSearchFields = animationBundleSearchFields(animation);
      const humanSearchAliases = animationHumanSearchAliases(animation);
      const runtimeFrame = sampleKpAnimationRuntimeFrame({
        id: `runtime.${animation.id}.preview-midpoint`,
        animation,
        progress: 0.5,
        childAnimations: input.animations
      });
      const runtimeScrubber = createKpAnimationRuntimeScrubberControl(animation);
      const midpointFrame = runtimeFrame.frameDescriptor;
      const referenceClosure = checkKpAnimationAssetReferenceClosure(animation);
      const seekRewind = checkKpAnimationAssetSeekRewindLaw(animation);
      const flashcards = flashcardsForAnimation(animation);
      const flashcardProjections = createKpAnimationFlashcardProjections({
        animation,
        cards: flashcards
      });
      const flashcardPreviewRendererData =
        createKpAnimationFlashcardPreviewRendererData({
          animation,
          cards: flashcards
        });
      const flashcardRendererSample =
        flashcardRendererSampleForAnimation(animation);
      const pausedFrameDrillDownSample =
        pausedFrameDrillDownSampleForAnimation(animation);
      const flashcardKinds = uniqueStrings(
        flashcardProjections.map((projection) => projection.cardKind)
      );
      const flashcardPreviewInteractionKinds = uniqueStrings(
        flashcardPreviewRendererData.items.map((item) => item.interactionKind)
      );
      const katexVisualSample = linearSolveVisualSampleForAnimation(animation);

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
            label: "Render target kinds",
            value: renderTargetKinds.join(", ")
          },
          {
            label: "Object types",
            value: objectTypes.join(", ")
          },
          {
            label: "Checks",
            value: checkFacets.join(", ")
          },
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
          },
          {
            label: "Runtime frame",
            value: runtimeFrame.id
          },
          {
            label: "Runtime scrubber",
            value: formatRuntimeScrubber(runtimeScrubber)
          },
          {
            label: "Runtime clock",
            value:
              `progress ${runtimeFrame.clock.progress}, beat ${runtimeFrame.clock.beat ?? "None"}`
          },
          {
            label: "Runtime active targets",
            value:
              runtimeFrame.activeRenderTargets.map((target) => target.id).join(", ")
          },
          {
            label: "Runtime focus selectors",
            value:
              runtimeFrame.focusSelectorIds.length === 0
                ? "None"
                : runtimeFrame.focusSelectorIds.join(", ")
          },
          {
            label: "Runtime child frames",
            value: formatRuntimeChildFrames(runtimeFrame.childFrames)
          },
          {
            label: "Flashcard projections",
            value: String(flashcardProjections.length)
          },
          {
            label: "Flashcard kinds",
            value:
              flashcardKinds.length === 0 ? "None" : flashcardKinds.join(", ")
          },
          {
            label: "Flashcard preview data",
            value: flashcardPreviewRendererData.id
          },
          {
            label: "Flashcard preview interactions",
            value:
              flashcardPreviewInteractionKinds.length === 0
                ? "None"
                : flashcardPreviewInteractionKinds.join(", ")
          },
          ...flashcardRendererSamplePreviewFields(flashcardRendererSample),
          ...pausedFrameDrillDownPreviewFields(pausedFrameDrillDownSample),
          ...katexVisualPreviewFields(katexVisualSample)
        ],
        previewLinks: editorDescriptors
          .filter(
            (descriptor) =>
              descriptor.id === `editor-animation.${animation.id}`
          )
          .map((descriptor) => ({
            label: `Open ${descriptor.title} in editor`,
            href: kpEditorAnimationSelectionHref({
              pathname: "/",
              search: "",
              hash: "#editor-animation-library-title",
              descriptorId: descriptor.id
            }),
            dataAttributes: [
              ["data-kp-preview-link", "editor-animation"],
              ["data-kp-preview-editor-animation", descriptor.id],
              ["data-kp-preview-animation-asset", animation.id]
            ]
          })),
        searchFields: [
          "semantic asset catalog",
          "animation asset catalog",
          "composable animation asset",
          input.catalogSearchLabel,
          "motif source",
          animation.id,
          animation.title,
          animation.bundle.id,
          animation.transformationTree.root.id,
          animation.timeline?.id ?? "",
          ...(animation.timeline === undefined
            ? []
            : [`timeline:${animation.timeline.id}`]),
          animation.layout?.id ?? "",
          animation.layout?.kind ?? "",
          ...(animation.layout === undefined
            ? []
            : [
                `layout:${animation.layout.id}`,
                `layout-kind:${animation.layout.kind}`
              ]),
          `reference-closure:${formatLawStatus(referenceClosure.passed)}`,
          `seek-rewind:${formatLawStatus(seekRewind.passed)}`,
          runtimeFrame.id,
          `runtime-frame:${runtimeFrame.id}`,
          runtimeScrubber.id,
          runtimeScrubber.unit,
          `runtime-scrubber:${runtimeScrubber.unit}`,
          `runtime-scrubber-id:${runtimeScrubber.id}`,
          runtimeFrame.phase.phaseId,
          `runtime-phase:${runtimeFrame.phase.phaseId}`,
          ...runtimeFrame.activeAnnotationIds,
          ...runtimeFrame.activeAnnotationIds.map((id) => `runtime-annotation:${id}`),
          ...runtimeFrame.focusSelectorIds,
          ...runtimeFrame.focusSelectorIds.map((id) => `runtime-focus:${id}`),
          ...runtimeFrame.activeRenderTargets.flatMap((target) => [
            target.id,
            `runtime-target:${target.id}`
          ]),
          ...runtimeFrame.selectorFrames.flatMap((selector) => [
            selector.id,
            `runtime-selector:${selector.id}`,
            ...selector.roles.map((role) => `runtime-selector-role:${role}`)
          ]),
          ...runtimeFrame.childFrames.flatMap((child) => [
            child.renderTargetId,
            child.animationId,
            child.frame.phase.phaseId,
            `runtime-child:${child.animationId}`,
            `runtime-child-target:${child.renderTargetId}`
          ]),
          ...runtimeFrame.phaseDiagnostics.map((diagnostic) => diagnostic.code),
          ...runtimeFrame.selectorDiagnostics.map((diagnostic) => diagnostic.code),
          ...runtimeFrame.childDiagnostics.map((diagnostic) => diagnostic.code),
          ...(flashcardProjections.length === 0
            ? []
            : ["flashcard-projection"]),
          ...flashcardProjections.flatMap((projection) => [
            projection.id,
            projection.cardId,
            projection.cardKind,
            projection.title,
            projection.prompt,
            `flashcard-projection:${projection.cardKind}`,
            ...projection.objectIds,
            ...projection.selectorIds,
            ...projection.transformationIds,
            ...projection.diagnostics.map((diagnostic) => diagnostic.message)
          ]),
          ...(flashcardPreviewRendererData.items.length === 0
            ? []
            : ["flashcard-preview-renderer"]),
          flashcardPreviewRendererData.id,
          ...flashcardPreviewRendererData.items.flatMap((item) => [
            item.id,
            item.projectionId,
            item.cardId,
            item.cardKind,
            item.interactionKind,
            `flashcard-preview-interaction:${item.interactionKind}`,
            ...item.objectIds,
            ...item.selectorIds,
            ...item.transformationIds,
            ...item.hiddenSelectorIds,
            ...(item.expectedTransformationId === undefined
              ? []
              : [
                  item.expectedTransformationId,
                  `flashcard-preview-expected:${item.expectedTransformationId}`
                ]),
            ...item.candidateTransformationIds.map(
              (transformationId) =>
                `flashcard-preview-candidate:${transformationId}`
            ),
            ...item.activeTransformationIds.map(
              (transformationId) =>
                `flashcard-preview-active:${transformationId}`
            )
          ]),
          ...flashcardRendererSampleSearchFields(flashcardRendererSample),
          ...pausedFrameDrillDownSearchFields(pausedFrameDrillDownSample),
          ...katexVisualSearchFields(katexVisualSample),
          midpointFrame.phaseId,
          ...midpointFrame.nodeIds,
          ...(animation.dashboard?.tags ?? []),
          ...sourceRefIds,
          ...sourceRefIds.map((sourceRefId) => `source:${sourceRefId}`),
          ...childAnimationIds,
          ...childAnimationIds.map((childId) => `component:${childId}`),
          ...metadataSearchFields,
          ...renderTargetMetadataSearchFields,
          ...bundleSearchFields,
          ...humanSearchAliases,
          ...animation.bundle.objects.flatMap((object) => [
            object.id,
            object.objectType,
            `object-type:${object.objectType}`
          ]),
          ...animation.transformations.flatMap((transformation) => [
            transformation.id,
            transformation.title,
            transformation.transformType,
            `transform:${transformation.transformType}`,
            transformation.definitionId ?? "",
            ...(transformation.definitionId === undefined
              ? []
              : [`definition:${transformation.definitionId}`]),
            ...(transformation.lawRefs ?? []).flatMap((lawRef) => [
              lawRef.id,
              `law:${lawRef.id}`,
              `law-level:${lawRef.level}`
            ]),
            ...transformation.sourceObjectIds,
            ...transformation.targetObjectIds
          ]),
          ...renderTargetIds,
          ...renderTargetIds.map((targetId) => `render-target:${targetId}`),
          ...renderTargetKinds,
          ...renderTargetKinds.map((kind) => `render-target-kind:${kind}`),
          ...checkFacets,
          ...animation.checks.flatMap((check) => [
            check.id,
            check.lawId,
            `check:${check.lawId}`,
            `check-level:${check.level}`
          ]),
          ...exportTargetIds
        ]
      };
    }
  );

  return rows.filter((row) => generatedAlgebraRowMatchesQuery(row, input.query));
}

function generatedProblemRegistryAgendaRow(
  record: GeneratedProblemRegistryRecord
): GeneratedAlgebraFixtureAgendaRow {
  return {
    id: `generated-problem-registry-${record.fixtureId.replaceAll(".", "-")}`,
    title: record.title,
    summary:
      `Generated problem registry record for ${record.familyId} with ${record.transformationCount} transformations and ${record.flashcardCount} flashcards.`,
    status: "active",
    detail: "generated problem registry",
    kind: "protocol-api",
    depth: 0,
    tags: [
      "generated-problem",
      "registry",
      record.domain,
      record.familyId
    ],
    dataAttributes: [
      ["data-kp-generated-problem-registry", record.fixtureId],
      ["data-kp-generated-problem-family", record.familyId],
      ["data-kp-generated-problem-animation", record.animationId]
    ],
    relatedIds: [
      record.fixtureId,
      record.familyId,
      record.bundleId,
      record.animationId,
      record.animationRowId,
      record.traceId,
      ...record.transformDefinitionIds,
      ...record.lawIds
    ],
    previewFields: [
      { label: "Fixture", value: record.fixtureId },
      { label: "Family", value: record.familyId },
      { label: "Domain", value: record.domain },
      { label: "Animation asset", value: record.animationId },
      { label: "Animation row", value: record.animationRowId },
      { label: "Trace", value: record.traceId },
      { label: "Objects", value: String(record.objectCount) },
      { label: "Selectors", value: String(record.selectorCount) },
      { label: "Transformations", value: String(record.transformationCount) },
      { label: "Trace steps", value: String(record.traceStepCount) },
      { label: "Flashcards", value: String(record.flashcardCount) },
      {
        label: "Flashcard kinds",
        value:
          record.flashcardKinds.length === 0
            ? "None"
            : record.flashcardKinds.join(", ")
      },
      {
        label: "Transform definitions",
        value:
          record.transformDefinitionIds.length === 0
            ? "None"
            : record.transformDefinitionIds.join(", ")
      },
      {
        label: "Laws",
        value: record.lawIds.length === 0 ? "None" : record.lawIds.join(", ")
      }
    ],
    previewLinks: [],
    searchFields: [
      "semantic asset catalog",
      "generated problem registry",
      "generated problem registry surface",
      ...record.searchFields
    ]
  };
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

function childAnimationIdsForAnimation(
  animation: KpAnimationAsset
): readonly string[] {
  const metadataChildIds = splitMetadataIds(
    animation.metadata?.["childAnimationIds"]
  );
  const renderTargetChildIds = animation.renderTargets.flatMap((target) =>
    splitMetadataIds(target.metadata?.["childAnimationId"])
  );

  return uniqueStrings([...metadataChildIds, ...renderTargetChildIds]);
}

function flashcardsForAnimation(
  animation: KpAnimationAsset
): readonly KpFlashcardSpec[] {
  const linearSolve = createLinearSolveKpAssetBundle();

  if (animation.bundle.id === linearSolve.bundle.id) {
    return linearSolve.flashcards;
  }

  const sourceFixtureId = metadataString(animation.metadata?.["sourceFixtureId"]);
  const fixture = [
    ...createGeneratedAlgebraTutorialFixtures(),
    ...createGeneratedCalculusProblemFixtures(),
    ...createGeneratedLinearAlgebraProblemFixtures()
  ].find((candidate) =>
    candidate.bundle.id === animation.bundle.id ||
    (sourceFixtureId !== undefined && candidate.id === sourceFixtureId)
  );

  return fixture?.flashcards ?? [];
}

function flashcardRendererSampleForAnimation(
  animation: KpAnimationAsset
): LinearSolveFlashcardRendererSample | undefined {
  return animation.id === "animation.linear-solve.solve-x"
    ? createLinearSolveFlashcardRendererSample()
    : undefined;
}

function flashcardRendererSamplePreviewFields(
  sample: LinearSolveFlashcardRendererSample | undefined
): readonly DashboardAssetPreviewField[] {
  if (sample === undefined) {
    return [];
  }

  return [
    { label: "Flashcard renderer sample", value: sample.id },
    {
      label: "Flashcard renderer diagnostics",
      value: String(sample.diagnostics.length)
    }
  ];
}

function flashcardRendererSampleSearchFields(
  sample: LinearSolveFlashcardRendererSample | undefined
): readonly string[] {
  if (sample === undefined) {
    return [];
  }

  return [
    "flashcard-renderer-sample",
    sample.id,
    sample.previewDataId,
    sample.visualFrameId,
    sample.clozeMask.id,
    sample.predictNextPending.id,
    sample.predictNextCorrect.id,
    ...sample.itemIds,
    ...sample.clozeMask.hiddenSelectorIds,
    ...sample.predictNextPending.candidates.map(
      (candidate) => `flashcard-renderer-candidate:${candidate.transformationId}`
    )
  ];
}

function pausedFrameDrillDownSampleForAnimation(
  animation: KpAnimationAsset
): KpAnimationPausedFrameDrillDownSample | undefined {
  return animation.id === "animation.linear-solve.solve-x"
    ? createLinearSolvePausedFrameDrillDownSample({ progress: 0.5 })
    : undefined;
}

function pausedFrameDrillDownPreviewFields(
  sample: KpAnimationPausedFrameDrillDownSample | undefined
): readonly DashboardAssetPreviewField[] {
  if (sample === undefined) {
    return [];
  }

  return [
    { label: "Paused frame drill-down", value: sample.id },
    {
      label: "Paused focus selectors",
      value:
        sample.focusSelectorRows.length === 0
          ? "None"
          : sample.focusSelectorRows.map((row) => row.selectorId).join(", ")
    },
    {
      label: "Paused active transforms",
      value:
        sample.activeTransformationRows.length === 0
          ? "None"
          : sample.activeTransformationRows
              .map((row) => row.transformationId)
              .join(", ")
    }
  ];
}

function pausedFrameDrillDownSearchFields(
  sample: KpAnimationPausedFrameDrillDownSample | undefined
): readonly string[] {
  if (sample === undefined) {
    return [];
  }

  return [
    "paused-frame-drilldown",
    sample.id,
    sample.runtimeFrameId,
    sample.visualFrameId,
    sample.previewDataId,
    sample.phase.phaseId,
    `paused-frame-phase:${sample.phase.phaseId}`,
    ...sample.phase.nodeIds,
    ...sample.activeTransformationRows.flatMap((row) => [
      row.transformationId,
      row.transformType,
      `paused-frame-transform:${row.transformationId}`,
      `paused-frame-transform-type:${row.transformType}`,
      ...row.sourceObjectIds,
      ...row.targetObjectIds
    ]),
    ...sample.focusSelectorRows.flatMap((row) => [
      row.selectorId,
      `paused-frame-focus:${row.selectorId}`,
      ...row.nodeRefs.map((nodeRef) => `paused-frame-token:${nodeRef}`)
    ]),
    ...sample.selectorRows.flatMap((row) => [
      row.selectorId,
      row.label ?? "",
      ...row.roles.map((role) => `paused-frame-selector-role:${role}`),
      ...row.nodeRefs
    ]),
    ...sample.flashcardRows.flatMap((row) => [
      row.itemId,
      row.cardId,
      row.cardKind,
      row.interactionKind,
      `paused-frame-flashcard:${row.interactionKind}`,
      row.phaseId,
      ...row.activeTransformationIds,
      ...row.hiddenSelectorIds,
      row.expectedTransformationId ?? "",
      ...row.candidateTransformationIds
    ])
  ];
}

function splitMetadataIds(
  value: string | number | boolean | undefined
): readonly string[] {
  return typeof value === "string"
    ? value.split(/\s+/).filter((part) => part.length > 0)
    : [];
}

function metadataString(
  value: string | number | boolean | undefined
): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function animationMetadataSearchFields(
  metadata: Readonly<Record<string, string | number | boolean>> | undefined
): readonly string[] {
  return Object.entries(metadata ?? {}).flatMap(([key, value]) => {
    const stringValue = String(value);

    return [
      key,
      stringValue,
      `${key}:${stringValue}`,
      `metadata:${key}:${stringValue}`
    ];
  });
}

function animationBundleSearchFields(
  animation: KpAnimationAsset
): readonly string[] {
  return animation.bundle.objects.flatMap((object) => [
    object.id,
    object.objectType,
    object.title,
    ...animationMetadataSearchFields(object.metadata),
    ...object.selectors.flatMap((selector) => [
      selector.id,
      selector.kind,
      selector.label ?? "",
      selector.summary ?? "",
      `${selector.kind}:${selector.label ?? selector.id}`,
      ...animationMetadataSearchFields(selector.metadata)
    ])
  ]);
}

function animationHumanSearchAliases(
  animation: KpAnimationAsset
): readonly string[] {
  const fields = [
    animation.id,
    animation.title,
    animation.bundle.id,
    animation.bundle.title,
    ...(animation.dashboard?.tags ?? []),
    ...animationMetadataSearchFields(animation.metadata),
    ...animationBundleSearchFields(animation)
  ].join(" ").toLowerCase();
  const aliases: string[] = [];

  if (fields.includes("fundamental") || fields.includes("ftc")) {
    aliases.push(
      "ftc",
      "ftc duality",
      "fundamental theorem animation",
      "fundamental theorem calculus animation",
      "integral derivative duality"
    );
  }

  if (fields.includes("fourier")) {
    aliases.push(
      "fourier animation",
      "fourier kernel",
      "fourier transform animation",
      "inverse fourier animation",
      "frequency transform pair"
    );
  }

  if (fields.includes("jacobian") && fields.includes("hessian")) {
    aliases.push(
      "jacobian hessian",
      "jacobian hessian comparison",
      "derivative matrix comparison"
    );
  }

  return aliases;
}

function formatLawStatus(passed: boolean): string {
  return passed ? "passed" : "failed";
}

function formatRuntimeChildFrames(
  childFrames: readonly KpAnimationRuntimeChildFrame[]
): string {
  return childFrames.length === 0
    ? "None"
    : childFrames
        .map((child) =>
          `${child.renderTargetId}:${child.animationId}@${child.frame.phase.phaseId}`
        )
        .join(", ");
}

function formatRuntimeScrubber(
  scrubber: KpAnimationRuntimeScrubberControl
): string {
  return `${scrubber.unit} ${scrubber.min}-${scrubber.max} step ${scrubber.step} default ${scrubber.defaultValue}`;
}

function linearSolveVisualSampleForAnimation(
  animation: KpAnimationAsset
): LinearSolveRuntimeVisualFrameSample | undefined {
  return animation.id === "animation.linear-solve.solve-x"
    ? createLinearSolveRuntimeVisualFrameSample()
    : undefined;
}

function katexVisualPreviewFields(
  sample: LinearSolveRuntimeVisualFrameSample | undefined
): readonly GeneratedAlgebraAgendaPreviewField[] {
  if (sample === undefined) {
    return [];
  }

  const diagnosticsPanel = createKpAnimationVisualFrameDiagnosticsPanelData(
    sample.visualFrame
  );

  return [
    {
      label: "KaTeX visual frame",
      value: sample.visualFrame.id
    },
    {
      label: "KaTeX visual nodes",
      value: String(sample.visualFrame.nodes.length)
    },
    {
      label: "KaTeX focus token refs",
      value: formatKatexFocusTokenRefs(sample)
    },
    {
      label: "KaTeX visual diagnostics",
      value:
        sample.visualFrame.diagnostics.length === 0
          ? "passed"
          : sample.visualFrame.diagnostics
              .map((diagnostic) => diagnostic.code)
              .join(", ")
    },
    {
      label: "KaTeX diagnostics panel",
      value: formatVisualDiagnosticsPanel(diagnosticsPanel)
    },
    {
      label: "KaTeX binding coverage",
      value: formatVisualBindingCoverage(diagnosticsPanel)
    }
  ];
}

function katexVisualSearchFields(
  sample: LinearSolveRuntimeVisualFrameSample | undefined
): readonly string[] {
  if (sample === undefined) {
    return [];
  }

  const diagnosticsPanel = createKpAnimationVisualFrameDiagnosticsPanelData(
    sample.visualFrame
  );

  return [
    "katex-visual-frame",
    sample.visualFrame.id,
    sample.runtimeFrame.id,
    ...sample.visualFrame.renderTargetVisuals.map(
      (target) => `katex-visual-target:${target.renderTargetId}`
    ),
    ...sample.visualFrame.selectorVisuals.flatMap((selector) => [
      selector.selectorId,
      `katex-visual-selector:${selector.selectorId}`,
      ...selector.nodeIds
    ]),
    ...sample.visualFrame.nodes.flatMap((node) => [
      node.id,
      node.ref,
      `katex-token:${node.ref}`
    ]),
    ...sample.visualFrame.diagnostics.map((diagnostic) => diagnostic.code),
    ...diagnosticsPanel.searchFields
  ];
}

function formatVisualDiagnosticsPanel(
  panel: KpAnimationVisualFrameDiagnosticsPanelData
): string {
  return `${panel.status} (${panel.severityCounts.warning} warnings, ${panel.severityCounts.error} errors)`;
}

function formatVisualBindingCoverage(
  panel: KpAnimationVisualFrameDiagnosticsPanelData
): string {
  const summary = panel.bindingSummary;

  return `targets ${summary.boundRenderTargetCount}/${summary.renderTargetCount}, selectors ${summary.boundSelectorCount}/${summary.selectorCount}, nodes ${summary.nodeCount}`;
}

function formatKatexFocusTokenRefs(
  sample: LinearSolveRuntimeVisualFrameSample
): string {
  const visualFrame = sample.visualFrame;

  return visualFrame.selectorVisuals
    .filter((selector) => selector.roles.includes("focus"))
    .map((selector) => {
      const refs = selector.nodeIds
        .map((nodeId) =>
          visualFrame.nodes.find((node) => node.id === nodeId)?.ref
        )
        .filter((ref): ref is string => ref !== undefined);

      return `${selector.selectorId}:${refs.join(" ")}`;
    })
    .join("; ");
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
  if (row.detail === "animation asset") {
    return row.previewFields.filter(
      (field) =>
        ![
          "Beats",
          "Duration",
          "Semantic objects",
          "Transformations",
          "Midpoint beat"
        ].includes(field.label)
    );
  }

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
