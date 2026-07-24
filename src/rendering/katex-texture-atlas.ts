import type {
  KatexAtlasRegion,
  KatexMotionToken,
  KatexTokenRect,
  KatexTextureAtlas
} from "./katex-transition-types.ts";

export interface KatexAtlasPackingOptions {
  width: number;
  height: number;
  padding: number;
  pixelRatio: number;
}

export interface KatexTextureCaptureOptions {
  forceVisibleTokenIds?: readonly string[] | undefined;
  resetTransformTokenIds?: readonly string[] | undefined;
  maxTextureSize?: number | undefined;
  padding?: number | undefined;
  pixelRatio?: number | undefined;
}

export interface KatexTextureCaptureRectOptions {
  includeTransparent?: boolean | undefined;
  resetTransforms?: boolean | undefined;
}

export function packKatexTextureRegions(
  tokens: readonly KatexMotionToken[],
  options: KatexAtlasPackingOptions
): readonly KatexAtlasRegion[] {
  validatePackingOptions(options);
  assertUniqueTokenIds(tokens);

  const regions: KatexAtlasRegion[] = [];
  let page = 0;
  let cursorX = options.padding;
  let cursorY = options.padding;
  let rowHeight = 0;

  for (const token of tokens) {
    validateTokenDimensions(token);

    const width = Math.ceil(token.localRect.width * options.pixelRatio);
    const height = Math.ceil(token.localRect.height * options.pixelRatio);
    const paddedWidth = width + options.padding * 2;
    const paddedHeight = height + options.padding * 2;

    if (paddedWidth > options.width || paddedHeight > options.height) {
      throw new Error(`KaTeX token ${token.id} does not fit in the texture atlas.`);
    }

    if (cursorX + width + options.padding > options.width) {
      cursorX = options.padding;
      cursorY += rowHeight + options.padding * 2;
      rowHeight = 0;
    }

    if (cursorY + height + options.padding > options.height) {
      page += 1;
      cursorX = options.padding;
      cursorY = options.padding;
      rowHeight = 0;
    }

    regions.push({
      tokenId: token.id,
      page,
      x: cursorX,
      y: cursorY,
      width,
      height,
      u0: cursorX / options.width,
      v0: cursorY / options.height,
      u1: (cursorX + width) / options.width,
      v1: (cursorY + height) / options.height
    });

    cursorX += width + options.padding * 2;
    rowHeight = Math.max(rowHeight, height);
  }

  return regions;
}

export async function createKatexTextureAtlas(
  tokens: readonly KatexMotionToken[],
  options: KatexTextureCaptureOptions = {}
): Promise<KatexTextureAtlas> {
  assertTokensHaveElements(tokens);
  await waitForDocumentFontsReady();

  const pixelRatio = options.pixelRatio ?? window.devicePixelRatio ?? 1;
  const width = options.maxTextureSize ?? 2048;
  const height = options.maxTextureSize ?? 2048;
  const regions = packKatexTextureRegions(tokens, {
    width,
    height,
    padding: options.padding ?? 2,
    pixelRatio
  });
  const pageCount = Math.max(1, Math.max(...regions.map((region) => region.page)) + 1);
  const pages = Array.from({ length: pageCount }, () => {
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    return canvas;
  });

  for (const token of tokens) {
    const region = regions.find((entry) => entry.tokenId === token.id);
    const page = region === undefined ? undefined : pages[region.page];

    if (region === undefined || page === undefined || token.element === undefined) {
      continue;
    }

    const context = page.getContext("2d");

    if (context === null) {
      throw new Error("Could not create a 2D atlas canvas context.");
    }

    if (isNativeClippedSvgToken(token)) {
      await drawNativeClippedSvgToken(
        context,
        token,
        region
      );
      continue;
    }

    if (shouldPaintStructuralToken(token)) {
      drawStructuralToken(context, token, region, pixelRatio);
      continue;
    }

    const image = await captureElementImage(
      token.element,
      token.rect,
      pixelRatio,
      options.forceVisibleTokenIds?.includes(token.id) ?? false,
      options.resetTransformTokenIds?.includes(token.id) ?? false
    );

    context.drawImage(image, region.x, region.y, region.width, region.height);
  }

  return {
    width,
    height,
    pixelRatio,
    pages,
    regions: new Map(regions.map((region) => [region.tokenId, region]))
  };
}

async function waitForDocumentFontsReady(): Promise<void> {
  if (document.fonts === undefined) {
    return;
  }

  await document.fonts.ready;
}

export function measureKatexTextureCaptureRect(
  element: Element,
  options: KatexTextureCaptureRectOptions = {}
): KatexTokenRect {
  const measure = () => {
    const rects = [element, ...Array.from(element.querySelectorAll("*"))]
      .filter(isCaptureRectElement)
      .filter((entry) =>
        isVisibleCaptureElement(entry, options.includeTransparent ?? false)
      )
      .map((entry) => entry.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);

    return unionCaptureRects(
      rects.length === 0 ? [element.getBoundingClientRect()] : rects
    );
  };
  return options.resetTransforms === true
    ? withResetCaptureTransforms(element, measure)
    : measure();
}

async function captureElementImage(
  element: Element,
  rect: KatexTokenRect,
  pixelRatio: number,
  forceVisible: boolean,
  resetTransforms: boolean
): Promise<HTMLImageElement> {
  const width = Math.max(1, Math.ceil(rect.width * pixelRatio));
  const height = Math.max(1, Math.ceil(rect.height * pixelRatio));
  const elementRect = element.getBoundingClientRect();
  const clone = element.cloneNode(true);

  if (!(clone instanceof HTMLElement)) {
    throw new Error("Expected a KaTeX token clone to be an HTMLElement.");
  }

  inlineComputedCaptureStyles(element, clone, forceVisible);
  if (resetTransforms) resetCaptureTransforms(clone);

  const captureStyle = [
    copyComputedTextStyle(element),
    copyComputedBoxStyle(element, elementRect),
    `position:absolute`,
    `left:${elementRect.left - rect.left}px`,
    `top:${elementRect.top - rect.top}px`,
    `display:inline-block`,
    `margin:0`,
    `opacity:1`,
    `visibility:visible`,
    `transform:none`
  ].join(";");

  appendInlineStyle(clone, captureStyle);

  // KaTeX vlist descendants can paint outside their parent rect, so the
  // wrapper owns the capture bounds while the cloned element keeps its DOM
  // offset inside that larger visual frame.
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="position:relative;display:block;width:${rect.width}px;height:${rect.height}px;overflow:visible;margin:0;transform:scale(${pixelRatio});transform-origin:top left">${clone.outerHTML}</div>
      </foreignObject>
    </svg>
  `;
  const image = new Image(width, height);
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not rasterize KaTeX token."));
    image.src = dataUrl;
  });

  return image;
}

function withResetCaptureTransforms<T>(
  element: Element,
  read: () => T
): T {
  const styledElements = [element, ...Array.from(element.querySelectorAll("*"))]
    .filter((entry): entry is HTMLElement | SVGElement =>
      entry instanceof HTMLElement || entry instanceof SVGElement
    );
  const inlineStyles = styledElements.map((entry) => entry.getAttribute("style"));
  try {
    resetCaptureTransforms(element);
    return read();
  } finally {
    styledElements.forEach((entry, index) => {
      const style = inlineStyles[index];
      if (style === null || style === undefined) {
        entry.removeAttribute("style");
      } else {
        entry.setAttribute("style", style);
      }
    });
  }
}

function resetCaptureTransforms(element: Element): void {
  [element, ...Array.from(element.querySelectorAll("*"))].forEach((entry) => {
    if (!(entry instanceof HTMLElement || entry instanceof SVGElement)) return;
    entry.style.setProperty("transform", "none", "important");
    entry.style.setProperty("translate", "none", "important");
    entry.style.setProperty("scale", "none", "important");
  });
}

function isNativeClippedSvgToken(token: KatexMotionToken): boolean {
  return (
    token.element instanceof HTMLElement &&
    token.element.dataset["kpRadicalNativeVisual"] === "true" &&
    token.element.querySelector("svg") !== null
  );
}

async function drawNativeClippedSvgToken(
  context: CanvasRenderingContext2D,
  token: KatexMotionToken,
  region: KatexAtlasRegion
): Promise<void> {
  if (!(token.element instanceof HTMLElement)) {
    throw new Error(`KaTeX token ${token.id} is not an HTML clip owner.`);
  }
  const sourceSvg = token.element.querySelector<SVGSVGElement>("svg");
  if (sourceSvg === null) {
    throw new Error(`KaTeX token ${token.id} has no native SVG geometry.`);
  }
  const sourceRect = sourceSvg.getBoundingClientRect();
  const viewBox = sourceSvg.viewBox.baseVal;
  if (
    sourceRect.width <= 0 ||
    sourceRect.height <= 0 ||
    viewBox.width <= 0 ||
    viewBox.height <= 0
  ) {
    throw new Error(`KaTeX token ${token.id} has invalid native SVG geometry.`);
  }

  const sliceScale = Math.max(
    sourceRect.width / viewBox.width,
    sourceRect.height / viewBox.height
  );
  const cropViewBox = {
    x: viewBox.x,
    y: viewBox.y,
    width: token.rect.width / sliceScale,
    height: token.rect.height / sliceScale
  };
  const clone = sourceSvg.cloneNode(true);
  if (!(clone instanceof SVGSVGElement)) {
    throw new Error(`KaTeX token ${token.id} could not clone its native SVG.`);
  }

  inlineComputedCaptureStyles(sourceSvg, clone);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(region.width));
  clone.setAttribute("height", String(region.height));
  clone.setAttribute(
    "viewBox",
    [
      cropViewBox.x,
      cropViewBox.y,
      cropViewBox.width,
      cropViewBox.height
    ].join(" ")
  );
  clone.setAttribute("preserveAspectRatio", "none");
  appendInlineStyle(
    clone,
    `display:block;width:${region.width}px;height:${region.height}px;overflow:visible`
  );

  // .hide-tail clips the extremely wide KaTeX SVG from xMinYMin. Preserve
  // that origin exactly; viewport offsets describe layout, not path-space
  // crop offsets, and applying them would amputate the radical hook.
  const image = await loadSvgImage(
    clone.outerHTML,
    region.width,
    region.height
  );
  context.drawImage(image, region.x, region.y, region.width, region.height);
}

async function loadSvgImage(
  markup: string,
  width: number,
  height: number
): Promise<HTMLImageElement> {
  const image = new Image(width, height);
  const dataUrl =
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(
      new Error("Could not rasterize native KaTeX SVG geometry.")
    );
    image.src = dataUrl;
  });

  return image;
}

function isCaptureRectElement(element: Element): boolean {
  return !(element instanceof SVGElement && element.ownerSVGElement !== null);
}

function isVisibleCaptureElement(
  element: Element,
  includeTransparent: boolean
): boolean {
  const style = window.getComputedStyle(element);

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    (includeTransparent || style.opacity !== "0")
  );
}

function unionCaptureRects(rects: readonly DOMRect[]): KatexTokenRect {
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));

  return {
    left,
    top,
    width: right - left,
    height: bottom - top
  };
}

const COMPUTED_CAPTURE_STYLE_PROPERTIES = [
  "background-color",
  "border-bottom-color",
  "border-bottom-style",
  "border-bottom-width",
  "border-left-color",
  "border-left-style",
  "border-left-width",
  "border-right-color",
  "border-right-style",
  "border-right-width",
  "border-top-color",
  "border-top-style",
  "border-top-width",
  "bottom",
  "box-sizing",
  "color",
  "display",
  "font-family",
  "font-size",
  "font-style",
  "font-variant",
  "font-weight",
  "height",
  "left",
  "letter-spacing",
  "line-height",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-top",
  "max-height",
  "max-width",
  "min-height",
  "min-width",
  "opacity",
  "overflow",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-top",
  "position",
  "right",
  "text-align",
  "text-decoration-color",
  "text-decoration-line",
  "text-decoration-style",
  "text-decoration-thickness",
  "top",
  "transform",
  "transform-origin",
  "vertical-align",
  "white-space",
  "width"
] as const;

function inlineComputedCaptureStyles(
  source: Element,
  clone: Element,
  forceVisible = false
): void {
  if (clone instanceof HTMLElement || clone instanceof SVGElement) {
    appendInlineStyle(clone, serializeComputedCaptureStyle(source));
    if (forceVisible) {
      appendInlineStyle(clone, "opacity:1;visibility:visible");
    }
  }

  const sourceChildren = Array.from(source.children);
  const cloneChildren = Array.from(clone.children);

  sourceChildren.forEach((sourceChild, index) => {
    const cloneChild = cloneChildren[index];

    if (cloneChild !== undefined) {
      inlineComputedCaptureStyles(sourceChild, cloneChild, forceVisible);
    }
  });
}

function serializeComputedCaptureStyle(element: Element): string {
  const style = window.getComputedStyle(element);

  return COMPUTED_CAPTURE_STYLE_PROPERTIES.map(
    (property) => `${property}:${style.getPropertyValue(property)}`
  ).join(";");
}

function appendInlineStyle(element: Element, style: string): void {
  const existingStyle = element.getAttribute("style");

  element.setAttribute(
    "style",
    existingStyle === null || existingStyle.length === 0
      ? style
      : `${existingStyle};${style}`
  );
}

function copyComputedTextStyle(element: Element): string {
  const style = window.getComputedStyle(element);

  return [
    `font:${style.font}`,
    `color:${style.color}`,
    `letter-spacing:${style.letterSpacing}`,
    `white-space:${style.whiteSpace}`,
    `line-height:${style.lineHeight}`
  ].join(";");
}

function copyComputedBoxStyle(
  element: Element,
  rect: DOMRect | { width: number; height: number }
): string {
  const style = window.getComputedStyle(element);

  return [
    `box-sizing:${style.boxSizing}`,
    `width:${rect.width}px`,
    `height:${rect.height}px`,
    `background:${style.background}`,
    `border-top:${style.borderTopWidth} ${style.borderTopStyle} ${style.borderTopColor}`,
    `border-right:${style.borderRightWidth} ${style.borderRightStyle} ${style.borderRightColor}`,
    `border-bottom:${style.borderBottomWidth} ${style.borderBottomStyle} ${style.borderBottomColor}`,
    `border-left:${style.borderLeftWidth} ${style.borderLeftStyle} ${style.borderLeftColor}`
  ].join(";");
}

function shouldPaintStructuralToken(token: KatexMotionToken): boolean {
  return (
    token.text.startsWith("structural:") &&
    token.element?.querySelector("svg") === null
  );
}

function drawStructuralToken(
  context: CanvasRenderingContext2D,
  token: KatexMotionToken,
  region: KatexAtlasRegion,
  pixelRatio: number
): void {
  if (token.element === undefined) {
    return;
  }

  const style = window.getComputedStyle(token.element);

  if (hasClassName(token.element, "rule")) {
    context.save();
    context.fillStyle =
      style.borderTopColor ||
      style.borderRightColor ||
      style.backgroundColor ||
      style.color ||
      "#000";
    context.fillRect(region.x, region.y, region.width, region.height);
    context.restore();
    return;
  }

  const borderWidth = Number.parseFloat(style.borderBottomWidth);
  const lineHeight = Math.max(
    1,
    Math.min(
      region.height,
      Number.isFinite(borderWidth)
        ? Math.ceil(borderWidth * pixelRatio)
        : region.height
    )
  );
  const lineTop = region.y + Math.max(0, region.height - lineHeight);
  const lineColor = style.borderBottomColor || style.color || "#000";

  context.save();
  if (
    style.borderBottomStyle === "dashed" ||
    style.borderBottomStyle === "dotted"
  ) {
    const dashLength =
      style.borderBottomStyle === "dotted"
        ? Math.max(1, lineHeight)
        : Math.max(4, lineHeight * 4);
    const gapLength = Math.max(2, lineHeight * 3);

    context.strokeStyle = lineColor;
    context.lineWidth = lineHeight;
    context.setLineDash([dashLength, gapLength]);
    context.beginPath();
    context.moveTo(region.x, lineTop + lineHeight / 2);
    context.lineTo(region.x + region.width, lineTop + lineHeight / 2);
    context.stroke();
  } else {
    context.fillStyle = lineColor;
    context.fillRect(region.x, lineTop, region.width, lineHeight);
  }
  context.restore();
}

function hasClassName(element: Element, className: string): boolean {
  return element.className.split(/\s+/).includes(className);
}

function validatePackingOptions(options: KatexAtlasPackingOptions): void {
  assertPositiveFinite(options.width, "Invalid KaTeX texture atlas width.");
  assertPositiveFinite(options.height, "Invalid KaTeX texture atlas height.");
  assertPositiveFinite(options.pixelRatio, "Invalid KaTeX texture atlas pixelRatio.");

  if (!Number.isFinite(options.padding) || options.padding < 0) {
    throw new Error("Invalid KaTeX texture atlas padding.");
  }
}

function validateTokenDimensions(token: KatexMotionToken): void {
  assertPositiveFinite(token.localRect.width, `Invalid KaTeX token ${token.id} width.`);
  assertPositiveFinite(token.localRect.height, `Invalid KaTeX token ${token.id} height.`);
}

function assertPositiveFinite(value: number, message: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(message);
  }
}

function assertUniqueTokenIds(tokens: readonly KatexMotionToken[]): void {
  const ids = new Set<string>();

  for (const token of tokens) {
    if (ids.has(token.id)) {
      throw new Error(`Duplicate KaTeX token id ${token.id}.`);
    }

    ids.add(token.id);
  }
}

function assertTokensHaveElements(tokens: readonly KatexMotionToken[]): void {
  for (const token of tokens) {
    if (token.element === undefined) {
      throw new Error(`KaTeX token ${token.id} is missing an element for texture capture.`);
    }
  }
}
