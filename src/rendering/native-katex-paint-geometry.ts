import {
  normalizeKpStageRelativeRect,
  type KpStageRelativeRect
} from "./native-katex-fragment-observer.ts";
import type {
  KpNativeKatexPaintAtomObservation,
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";

export type KpNativeKatexPaintMeasuredTrack<Track> = Track & {
  readonly startPaintRect: KpStageRelativeRect;
  readonly endPaintRect: KpStageRelativeRect;
};

export function attachKpNativeKatexTrackPaintGeometry<
  Track extends {
    readonly sourceAtomId?: string | undefined;
    readonly targetAtomId?: string | undefined;
  }
>(input: {
  readonly tracks: readonly Track[];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): readonly KpNativeKatexPaintMeasuredTrack<Track>[] {
  const sourceAtoms = new Map(input.source.atoms.map((atom) => [atom.id, atom]));
  const targetAtoms = new Map(input.target.atoms.map((atom) => [atom.id, atom]));
  const paintRect = (
    atom: KpNativeKatexPaintAtomObservation | undefined,
    stage: HTMLElement
  ) => atom === undefined
    ? undefined
    : atom.paintKind === "glyph" &&
        typeof atom.sourceElement.ownerDocument.createRange === "function"
      ? measureKpNativeKatexTextInkRect(stage, atom.sourceElement)
      : atom.paintKind === "rule" &&
          typeof atom.sourceElement.getBoundingClientRect === "function" &&
          atom.sourceElement.ownerDocument.defaultView !== null
        // A rule element's client rect includes layout content around the
        // border. Track the actual border ink so clone alignment compares
        // paint with paint, not paint with the larger layout rectangle.
        ? measureKpNativeKatexSubtreePaintRect(
            stage,
            atom.sourceElement
          ) ?? atom.rect
      : atom.rect;
  return Object.freeze(input.tracks.map((track) => {
    const sourceAtom =
      sourceAtoms.get(track.sourceAtomId ?? "") ??
      targetAtoms.get(track.sourceAtomId ?? "");
    const targetAtom =
      targetAtoms.get(track.targetAtomId ?? "") ??
      sourceAtoms.get(track.targetAtomId ?? "");
    const startPaintRect = paintRect(sourceAtom, input.source.stage);
    const endPaintRect = paintRect(targetAtom, input.target.stage);
    if (startPaintRect === undefined || endPaintRect === undefined) {
      throw new Error(
        "Native KaTeX render tracks require measured paint at both endpoints."
      );
    }
    return Object.freeze({
      ...track,
      startPaintRect,
      endPaintRect
    });
  }));
}

/**
 * Measures visible glyph ink rather than the Range/element line box.
 */
export function measureKpNativeKatexTextInkRect(
  stage: HTMLElement,
  element: HTMLElement
): KpStageRelativeRect {
  const range = element.ownerDocument.createRange();
  range.selectNodeContents(element);
  const rangeRect = range.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const layoutRect =
    rangeRect.width > 0 && rangeRect.height > 0 ? rangeRect : elementRect;
  const text = visibleDirectText(element) || element.textContent?.trim() || "";
  const computed = getComputedStyle(element);
  const canvas = element.ownerDocument.createElement("canvas");
  const context = canvas.getContext("2d");
  if (context === null || text === "") {
    return stageRelativeRect(stage, layoutRect);
  }
  context.font = [
    computed.fontStyle,
    computed.fontWeight,
    computed.fontSize,
    computed.fontFamily
  ].join(" ");
  const metrics = context.measureText(text);
  if (
    !(metrics.width > 0) ||
    !(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent > 0)
  ) {
    return stageRelativeRect(stage, layoutRect);
  }
  const scaleX = layoutRect.width / metrics.width;
  const lineHeight = Number.parseFloat(computed.lineHeight);
  const scaleY = Number.isFinite(lineHeight) && lineHeight > 0
    ? layoutRect.height / lineHeight
    : scaleX;
  const baseline = measureInlineBaseline(element);
  return stageRelativeRect(stage, {
    left: layoutRect.left - metrics.actualBoundingBoxLeft * scaleX,
    top: baseline - metrics.actualBoundingBoxAscent * scaleY,
    width:
      (metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight) *
      scaleX,
    height:
      (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) *
      scaleY
  });
}

/**
 * Unions text ink and CSS rules without admitting layout-only KaTeX struts.
 */
export function measureKpNativeKatexSubtreePaintRect(
  stage: HTMLElement,
  root: HTMLElement
): KpStageRelativeRect | undefined {
  const rects = [root, ...root.querySelectorAll<HTMLElement>("*")]
    .filter((element) => element.closest(".katex-mathml") === null)
    .flatMap((element) => [
      ...(visibleDirectText(element) === ""
        ? []
        : [measureKpNativeKatexTextInkRect(stage, element)]),
      ...measureBorderPaintRects(stage, element)
    ]);
  if (rects.length === 0) return undefined;
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return {
    left,
    top,
    width: right - left,
    height: bottom - top
  };
}

export function measureKpNativeKatexBaselineY(
  stage: HTMLElement,
  element: HTMLElement
): number {
  const stageRect = stage.getBoundingClientRect();
  const scaleY = stageRect.height > 0
    ? (stage.offsetHeight || stageRect.height) / stageRect.height
    : 1;
  return (measureInlineBaseline(element) - stageRect.top) * scaleY;
}

function visibleDirectText(element: HTMLElement): string {
  return [...element.childNodes]
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent ?? "")
    .join("")
    .replace(/[\s\u200b-\u200d\ufeff]+/g, "");
}

function measureInlineBaseline(element: HTMLElement): number {
  const marker = element.ownerDocument.createElement("span");
  marker.setAttribute("aria-hidden", "true");
  marker.style.cssText = [
    "display:inline-block",
    "width:0",
    "height:0",
    "padding:0",
    "margin:0",
    "border:0",
    "line-height:0",
    "vertical-align:baseline"
  ].join(";");
  element.append(marker);
  try {
    return marker.getBoundingClientRect().top;
  } finally {
    marker.remove();
  }
}

function measureBorderPaintRects(
  stage: HTMLElement,
  element: HTMLElement
): readonly KpStageRelativeRect[] {
  const computed = getComputedStyle(element);
  const bounds = element.getBoundingClientRect();
  if (
    computed.display === "none" ||
    computed.visibility === "hidden" ||
    bounds.width <= 0 ||
    bounds.height <= 0
  ) {
    return [];
  }
  const borders = [
    {
      style: computed.borderTopStyle,
      width: Number.parseFloat(computed.borderTopWidth),
      rect: (width: number) => ({
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: width
      })
    },
    {
      style: computed.borderRightStyle,
      width: Number.parseFloat(computed.borderRightWidth),
      rect: (width: number) => ({
        left: bounds.right - width,
        top: bounds.top,
        width,
        height: bounds.height
      })
    },
    {
      style: computed.borderBottomStyle,
      width: Number.parseFloat(computed.borderBottomWidth),
      rect: (width: number) => ({
        left: bounds.left,
        top: bounds.bottom - width,
        width: bounds.width,
        height: width
      })
    },
    {
      style: computed.borderLeftStyle,
      width: Number.parseFloat(computed.borderLeftWidth),
      rect: (width: number) => ({
        left: bounds.left,
        top: bounds.top,
        width,
        height: bounds.height
      })
    }
  ];
  return borders.flatMap((border) =>
    border.style === "none" ||
    border.style === "hidden" ||
    !(border.width > 0)
      ? []
      : [stageRelativeRect(stage, border.rect(border.width))]
  );
}

function stageRelativeRect(
  stage: HTMLElement,
  fragmentClientRect: Pick<DOMRect, "left" | "top" | "width" | "height">
): KpStageRelativeRect {
  const stageClientRect = stage.getBoundingClientRect();
  return normalizeKpStageRelativeRect({
    stageClientRect,
    stageLayoutWidth: stage.offsetWidth || stageClientRect.width,
    stageLayoutHeight: stage.offsetHeight || stageClientRect.height,
    fragmentClientRect
  });
}
