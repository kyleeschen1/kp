import type {
  KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import type {
  KpFlashcardValidationIssue
} from "../semantic/asset-flashcard.ts";
import {
  createLinearSolveKpAssetBundle
} from "../semantic/linear-solve-asset.ts";
import {
  createKpAnimationFlashcardPreviewRendererData,
  type KpAnimationFlashcardPreviewInteractionKind,
  type KpAnimationFlashcardPreviewRendererItem
} from "./flashcard-preview-renderer-data.ts";
import { createLinearSolveAnimationAsset } from "./linear-solve-adapter.ts";
import type {
  KpAnimationRuntimeClock,
  KpAnimationRuntimePhase,
  KpAnimationRuntimeSelectorFrame
} from "./runtime-sampler.ts";
import type {
  KpAnimationVisualFrame,
  KpAnimationVisualFrameDiagnostic,
  KpAnimationVisualGeometry,
  KpAnimationVisualNode,
  KpAnimationVisualRendererKind,
  KpAnimationVisualSelector
} from "./visual-frame-adapter.ts";
import type {
  KpAnimationRuntimeVisualFrameSampleFactory
} from "./runtime-visual-frame-sample.ts";

export interface CreateLinearSolvePausedFrameDrillDownSampleInput {
  readonly progress?: number | undefined;
  readonly createVisualSample: KpAnimationRuntimeVisualFrameSampleFactory;
}

export type KpAnimationPausedFrameDrillDownDiagnostic =
  | KpAnimationVisualFrameDiagnostic
  | KpFlashcardValidationIssue;

export interface KpAnimationPausedFrameDrillDownSample {
  readonly id: string;
  readonly kind: "animation-paused-frame-drilldown-sample";
  readonly animationId: string;
  readonly runtimeFrameId: string;
  readonly visualFrameId: string;
  readonly previewDataId: string;
  readonly clock: KpAnimationRuntimeClock;
  readonly phase: KpAnimationRuntimePhase;
  readonly activeTransformationRows:
    readonly KpAnimationPausedFrameDrillDownTransformationRow[];
  readonly selectorRows: readonly KpAnimationPausedFrameDrillDownSelectorRow[];
  readonly focusSelectorRows:
    readonly KpAnimationPausedFrameDrillDownSelectorRow[];
  readonly visualNodeRows: readonly KpAnimationPausedFrameDrillDownVisualNodeRow[];
  readonly flashcardRows: readonly KpAnimationPausedFrameDrillDownFlashcardRow[];
  readonly diagnostics: readonly KpAnimationPausedFrameDrillDownDiagnostic[];
}

export interface KpAnimationPausedFrameDrillDownTransformationRow {
  readonly id: string;
  readonly transformationId: string;
  readonly title: string;
  readonly transformType: string;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
}

export interface KpAnimationPausedFrameDrillDownSelectorRow {
  readonly id: string;
  readonly selectorId: string;
  readonly objectId: string;
  readonly kind: string;
  readonly label?: string | undefined;
  readonly roles: readonly KpAnimationRuntimeSelectorFrame["roles"][number][];
  readonly nodeIds: readonly string[];
  readonly nodeRefs: readonly string[];
  readonly geometry: readonly KpAnimationVisualGeometry[];
  readonly activeTransformationIds: readonly string[];
  readonly annotationIds: readonly string[];
  readonly renderTargetIds: readonly string[];
}

export interface KpAnimationPausedFrameDrillDownVisualNodeRow {
  readonly id: string;
  readonly nodeId: string;
  readonly targetId: string;
  readonly renderer: KpAnimationVisualRendererKind;
  readonly ref: string;
  readonly geometry?: KpAnimationVisualGeometry | undefined;
}

export interface KpAnimationPausedFrameDrillDownFlashcardRow {
  readonly id: string;
  readonly itemId: string;
  readonly projectionId: string;
  readonly cardId: string;
  readonly cardKind: string;
  readonly interactionKind: KpAnimationFlashcardPreviewInteractionKind;
  readonly phaseId: string;
  readonly activeTransformationIds: readonly string[];
  readonly hiddenSelectorIds: readonly string[];
  readonly expectedTransformationId?: string | undefined;
  readonly candidateTransformationIds: readonly string[];
}

export function createLinearSolvePausedFrameDrillDownSample(
  input: CreateLinearSolvePausedFrameDrillDownSampleInput
): KpAnimationPausedFrameDrillDownSample {
  const progress = input.progress ?? 0.5;
  const animation = createLinearSolveAnimationAsset();
  const semantic = createLinearSolveKpAssetBundle();
  const visualSample = input.createVisualSample({ progress });
  const previewData = createKpAnimationFlashcardPreviewRendererData({
    animation,
    cards: semantic.flashcards,
    progress
  });
  const sampleId = pausedFrameDrillDownId(
    animation.id,
    visualSample.runtimeFrame.clock
  );
  const selectorRows = selectorRowsForFrame(sampleId, visualSample.visualFrame);

  return {
    id: sampleId,
    kind: "animation-paused-frame-drilldown-sample",
    animationId: animation.id,
    runtimeFrameId: visualSample.runtimeFrame.id,
    visualFrameId: visualSample.visualFrame.id,
    previewDataId: previewData.id,
    clock: { ...visualSample.runtimeFrame.clock },
    phase: {
      phaseIndex: visualSample.runtimeFrame.phase.phaseIndex,
      phaseId: visualSample.runtimeFrame.phase.phaseId,
      nodeIds: [...visualSample.runtimeFrame.phase.nodeIds],
      annotationIdsByPlacement: {
        before: [
          ...visualSample.runtimeFrame.phase.annotationIdsByPlacement.before
        ],
        during: [
          ...visualSample.runtimeFrame.phase.annotationIdsByPlacement.during
        ],
        after: [
          ...visualSample.runtimeFrame.phase.annotationIdsByPlacement.after
        ]
      }
    },
    activeTransformationRows: activeTransformationRowsForFrame(
      sampleId,
      visualSample.runtimeFrame.activeTransformationIds,
      animation.transformations
    ),
    selectorRows,
    focusSelectorRows: selectorRows.filter((row) =>
      visualSample.runtimeFrame.focusSelectorIds.includes(row.selectorId)
    ),
    visualNodeRows: visualNodeRowsForFrame(sampleId, visualSample.visualFrame),
    flashcardRows: previewData.items.map((item) =>
      flashcardRowForItem(sampleId, item)
    ),
    diagnostics: [
      ...visualSample.visualFrame.diagnostics,
      ...previewData.diagnostics
    ]
  };
}

function pausedFrameDrillDownId(
  animationId: string,
  clock: KpAnimationRuntimeClock
): string {
  const clockSegment =
    clock.beat === undefined
      ? `progress-${numberId(clock.progress)}`
      : `beat-${numberId(clock.beat)}`;

  return `paused-frame-drilldown.${animationId}.${clock.direction}.${clockSegment}`;
}

function activeTransformationRowsForFrame(
  sampleId: string,
  activeTransformationIds: readonly string[],
  transformations: readonly KpSemanticTransformation[]
): readonly KpAnimationPausedFrameDrillDownTransformationRow[] {
  return activeTransformationIds.flatMap((transformationId) => {
    const transformation = transformations.find(
      (candidate) => candidate.id === transformationId
    );

    if (transformation === undefined) {
      return [];
    }

    return [{
      id: `${sampleId}.transform.${transformation.id}`,
      transformationId: transformation.id,
      title: transformation.title,
      transformType: transformation.transformType,
      sourceObjectIds: [...transformation.sourceObjectIds],
      targetObjectIds: [...transformation.targetObjectIds]
    }];
  });
}

function selectorRowsForFrame(
  sampleId: string,
  visualFrame: KpAnimationVisualFrame
): readonly KpAnimationPausedFrameDrillDownSelectorRow[] {
  const nodesById = new Map(visualFrame.nodes.map((node) => [node.id, node]));

  return visualFrame.selectorVisuals.map((selector) => {
    const nodes = selector.nodeIds
      .map((nodeId) => nodesById.get(nodeId))
      .filter((node): node is KpAnimationVisualNode => node !== undefined);

    return selectorRow(sampleId, selector, nodes);
  });
}

function selectorRow(
  sampleId: string,
  selector: KpAnimationVisualSelector,
  nodes: readonly KpAnimationVisualNode[]
): KpAnimationPausedFrameDrillDownSelectorRow {
  return {
    id: `${sampleId}.selector.${selector.selectorId}`,
    selectorId: selector.selectorId,
    objectId: selector.objectId,
    kind: selector.kind,
    ...(selector.label === undefined ? {} : { label: selector.label }),
    roles: [...selector.roles],
    nodeIds: nodes.map((node) => node.id),
    nodeRefs: nodes.map((node) => node.ref),
    geometry: nodes.flatMap((node) =>
      node.geometry === undefined ? [] : [{ ...node.geometry }]
    ),
    activeTransformationIds: [...selector.activeTransformationIds],
    annotationIds: [...selector.annotationIds],
    renderTargetIds: [...selector.renderTargetIds]
  };
}

function visualNodeRowsForFrame(
  sampleId: string,
  visualFrame: KpAnimationVisualFrame
): readonly KpAnimationPausedFrameDrillDownVisualNodeRow[] {
  return visualFrame.nodes.map((node) => ({
    id: `${sampleId}.node.${node.id}`,
    nodeId: node.id,
    targetId: node.targetId,
    renderer: node.renderer,
    ref: node.ref,
    ...(node.geometry === undefined ? {} : { geometry: { ...node.geometry } })
  }));
}

function flashcardRowForItem(
  sampleId: string,
  item: KpAnimationFlashcardPreviewRendererItem
): KpAnimationPausedFrameDrillDownFlashcardRow {
  return {
    id: `${sampleId}.flashcard.${item.cardId}`,
    itemId: item.id,
    projectionId: item.projectionId,
    cardId: item.cardId,
    cardKind: item.cardKind,
    interactionKind: item.interactionKind,
    phaseId: item.phaseId,
    activeTransformationIds: [...item.activeTransformationIds],
    hiddenSelectorIds: [...item.hiddenSelectorIds],
    ...(item.expectedTransformationId === undefined
      ? {}
      : { expectedTransformationId: item.expectedTransformationId }),
    candidateTransformationIds: [...item.candidateTransformationIds]
  };
}

function numberId(value: number): string {
  return String(Number.isInteger(value) ? value : value.toFixed(4))
    .replace(/0+$/, "")
    .replace(/\.$/, "")
    .replace(".", "-");
}
