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

export type KpNativeKatexTrackWithoutMotionPath<Track> =
  Track extends unknown
    ? Omit<Track, "motionPath" | "motionPathSampling">
    : never;

/**
 * Replacing measured geometry invalidates any route planned from the old
 * endpoints. Callers must clear both fields together so a stale path cannot
 * silently override their new rectangles at sample time.
 */
export function invalidateKpNativeKatexMotionPath<
  Track extends {
    readonly motionPath?: unknown;
    readonly motionPathSampling?: unknown;
  }
>(track: Track): KpNativeKatexTrackWithoutMotionPath<Track> {
  const {
    motionPath: _motionPath,
    motionPathSampling: _motionPathSampling,
    ...withoutPath
  } = track;
  return withoutPath as KpNativeKatexTrackWithoutMotionPath<Track>;
}

export function attachKpNativeKatexTrackPaintGeometry<
  Track extends {
    readonly sourceAtomId?: string | undefined;
    readonly targetAtomId?: string | undefined;
    readonly startPaintRect?: KpStageRelativeRect | undefined;
    readonly endPaintRect?: KpStageRelativeRect | undefined;
  }
>(input: {
  readonly tracks: readonly Track[];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): readonly KpNativeKatexPaintMeasuredTrack<Track>[] {
  const sourceAtoms = new Map(input.source.atoms.map((atom) => [atom.id, atom]));
  const targetAtoms = new Map(input.target.atoms.map((atom) => [atom.id, atom]));
  return Object.freeze(input.tracks.map((track) => {
    const sourceAtom =
      sourceAtoms.get(track.sourceAtomId ?? "") ??
      targetAtoms.get(track.sourceAtomId ?? "");
    const targetAtom =
      targetAtoms.get(track.targetAtomId ?? "") ??
      sourceAtoms.get(track.targetAtomId ?? "");
    // A typed choreography may intentionally author structural paint geometry
    // after endpoint measurement (for example, a fraction bar growing from a
    // hairline). Preserve that renderer-session authority instead of silently
    // overwriting it with the static endpoint measurement.
    const startPaintRect = track.startPaintRect ??
      (sourceAtom === undefined ? undefined :
        measureKpNativeKatexPaintAtomRect(input.source.stage, sourceAtom));
    const endPaintRect = track.endPaintRect ??
      (targetAtom === undefined ? undefined :
        measureKpNativeKatexPaintAtomRect(input.target.stage, targetAtom));
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
 * One measurement function defines native paint geometry for both compositor
 * tracks and semantic bindings. This prevents a selector layout box from
 * being compared with glyph ink at a later settlement seam.
 */
export function measureKpNativeKatexPaintAtomRect(
  stage: HTMLElement,
  atom: KpNativeKatexPaintAtomObservation
): KpStageRelativeRect {
  if (
    atom.paintMeasurement === "atomic-text" &&
    typeof atom.sourceElement.ownerDocument.createRange === "function"
  ) {
    return measureKpNativeKatexTextInkRect(stage, atom.sourceElement);
  }
  if (
    atom.paintMeasurement === "subtree" &&
    typeof atom.sourceElement.getBoundingClientRect === "function" &&
    atom.sourceElement.ownerDocument.defaultView !== null
  ) {
    // Rules, delimiters, and compound owners carry layout space beyond
    // visible paint. Their actual subtree union is the endpoint authority.
    return measureKpNativeKatexSubtreePaintRect(
      stage,
      atom.sourceElement
    ) ?? atom.rect;
  }
  if (
    atom.paintKind === "glyph" &&
    typeof atom.sourceElement.ownerDocument.createRange === "function"
  ) {
    // Compatibility for external renderer-session fixtures created before
    // paint measurement became explicit.
    return measureKpNativeKatexTextInkRect(stage, atom.sourceElement);
  }
  return atom.rect;
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

export function measureKpNativeKatexBaselineY(stage: HTMLElement, element: HTMLElement): number {
  return measureInlineBaseline(element, stage);
}

function visibleDirectText(element: HTMLElement): string {
  return [...element.childNodes]
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent ?? "")
    .join("")
    .replace(/[\s\u200b-\u200d\ufeff]+/g, "");
}

function measureInlineBaseline(element: HTMLElement, stage?: HTMLElement): number {
  const marker = element.ownerDocument.createElement("span");
  marker.setAttribute("aria-hidden", "true");
  marker.style.cssText = "display:inline-block;width:0;height:0;padding:0;margin:0;border:0;line-height:0;vertical-align:baseline";
  element.append(marker);
  try {
    const baseline = marker.getBoundingClientRect().top;
    if (!stage) return baseline;
    // Keep the probe present for both reads: scroll anchoring moves the stage.
    const rect = stage.getBoundingClientRect();
    return (baseline - rect.top) * (rect.height > 0 ? (stage.offsetHeight || rect.height) / rect.height : 1);
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
    bounds.width <= 0 ||
    bounds.height <= 0
  ) {
    return [];
  }
  // Endpoint geometry is measured even when another compositor owner holds
  // the paint. Match text measurement: visibility must not remove native
  // rules from a hidden endpoint's geometry during resize or reverse seeking.
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
