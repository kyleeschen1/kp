import type {
  KatexAtlasRegion,
  KatexMotionToken,
  KatexTextureAtlas
} from "./katex-transition-types.ts";

export interface KatexAtlasPackingOptions {
  width: number;
  height: number;
  padding: number;
  pixelRatio: number;
}

export interface KatexTextureCaptureOptions {
  maxTextureSize?: number | undefined;
  padding?: number | undefined;
  pixelRatio?: number | undefined;
}

export function packKatexTextureRegions(
  tokens: readonly KatexMotionToken[],
  options: KatexAtlasPackingOptions
): readonly KatexAtlasRegion[] {
  const regions: KatexAtlasRegion[] = [];
  let page = 0;
  let cursorX = options.padding;
  let cursorY = options.padding;
  let rowHeight = 0;

  for (const token of tokens) {
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

    const image = await captureElementImage(token.element, token.rect, pixelRatio);
    const context = page.getContext("2d");

    if (context === null) {
      throw new Error("Could not create a 2D atlas canvas context.");
    }

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

async function captureElementImage(
  element: Element,
  rect: DOMRect | { width: number; height: number },
  pixelRatio: number
): Promise<HTMLImageElement> {
  const width = Math.max(1, Math.ceil(rect.width * pixelRatio));
  const height = Math.max(1, Math.ceil(rect.height * pixelRatio));
  const clone = element.cloneNode(true);

  if (!(clone instanceof HTMLElement)) {
    throw new Error("Expected a KaTeX token clone to be an HTMLElement.");
  }

  clone.setAttribute(
    "style",
    `${copyComputedTextStyle(element)};display:inline-block;margin:0;transform:scale(${pixelRatio});transform-origin:top left;`
  );

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="display:inline-block">${clone.outerHTML}</div>
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
