import type {
  KpAnimationFlashcardPreviewRendererItem
} from "./flashcard-preview-renderer-data.ts";
import type {
  KpAnimationVisualFrame,
  KpAnimationVisualFrameDiagnostic,
  KpAnimationVisualGeometry,
  KpAnimationVisualRendererKind
} from "./visual-frame-adapter.ts";

export interface CreateKpAnimationClozeVisualMaskDataInput {
  readonly item: KpAnimationFlashcardPreviewRendererItem;
  readonly visualFrame: KpAnimationVisualFrame;
}

export interface KpAnimationClozeVisualMaskData {
  readonly id: string;
  readonly kind: "animation-cloze-visual-mask-data";
  readonly visualFrameId: string;
  readonly animationId: string;
  readonly cardId: string;
  readonly hiddenSelectorIds: readonly string[];
  readonly masks: readonly KpAnimationClozeVisualMaskEntry[];
  readonly diagnostics: readonly KpAnimationVisualFrameDiagnostic[];
}

export interface KpAnimationClozeVisualMaskEntry {
  readonly id: string;
  readonly selectorId: string;
  readonly nodeId: string;
  readonly nodeRef: string;
  readonly renderer: KpAnimationVisualRendererKind;
  readonly geometry?: KpAnimationVisualGeometry | undefined;
}

export function createKpAnimationClozeVisualMaskData(
  input: CreateKpAnimationClozeVisualMaskDataInput
): KpAnimationClozeVisualMaskData {
  const masks: KpAnimationClozeVisualMaskEntry[] = [];
  const diagnostics: KpAnimationVisualFrameDiagnostic[] = [];

  if (input.item.interactionKind !== "cloze") {
    diagnostics.push({
      severity: "warning",
      code: "cloze-mask.non-cloze-item",
      path: `items[${input.item.cardId}]`,
      message:
        `Flashcard preview item ${input.item.cardId} is ${input.item.interactionKind}, not cloze.`
    });
  }

  input.item.hiddenSelectorIds.forEach((selectorId) => {
    const selector = input.visualFrame.selectorVisuals.find(
      (candidate) => candidate.selectorId === selectorId
    );

    if (selector === undefined) {
      diagnostics.push({
        severity: "warning",
        code: "cloze-mask.selector-missing",
        path: `selectorVisuals[${selectorId}]`,
        message:
          `Hidden selector ${selectorId} is not present in visual frame ${input.visualFrame.id}.`
      });
      return;
    }

    if (selector.nodeIds.length === 0) {
      diagnostics.push({
        severity: "warning",
        code: "cloze-mask.selector-unbound",
        path: `selectorVisuals[${selectorId}].nodeIds`,
        message:
          `Hidden selector ${selectorId} has no visual nodes in frame ${input.visualFrame.id}.`
      });
      return;
    }

    selector.nodeIds.forEach((nodeId) => {
      const node = input.visualFrame.nodes.find((candidate) => candidate.id === nodeId);

      if (node === undefined) {
        diagnostics.push({
          severity: "warning",
          code: "cloze-mask.node-missing",
          path: `nodes[${nodeId}]`,
          message:
            `Hidden selector ${selectorId} references missing visual node ${nodeId}.`
        });
        return;
      }

      masks.push({
        id: `cloze-mask-entry.${input.item.cardId}.${selectorId}.${node.id}`,
        selectorId,
        nodeId: node.id,
        nodeRef: node.ref,
        renderer: node.renderer,
        ...(node.geometry === undefined
          ? {}
          : { geometry: { ...node.geometry } })
      });
    });
  });

  return {
    id: `cloze-mask.${input.visualFrame.id}.${input.item.cardId}`,
    kind: "animation-cloze-visual-mask-data",
    visualFrameId: input.visualFrame.id,
    animationId: input.visualFrame.animationId,
    cardId: input.item.cardId,
    hiddenSelectorIds: [...input.item.hiddenSelectorIds],
    masks,
    diagnostics
  };
}
