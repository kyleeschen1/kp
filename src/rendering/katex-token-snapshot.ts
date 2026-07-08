import type { KatexMotionToken, KatexTokenRect } from "./katex-transition-types.ts";

const TOKEN_CLASS_NAMES = new Set([
  "mord",
  "mbin",
  "mrel",
  "mop",
  "mopen",
  "mclose",
  "mpunct",
  "minner",
  "mfrac",
  "msupsub",
  "sqrt",
  "accent"
]);

const STRUCTURAL_TOKEN_CLASS_NAMES = new Set([
  "frac-line",
  "hline",
  "hdashline",
  "hide-tail",
  "rule",
  "sqrt-line",
  "overline-line",
  "underline-line"
]);

const NOISY_CLASS_NAMES = new Set([
  "base",
  "strut",
  "vlist",
  "vlist-t",
  "vlist-r",
  "vlist-s",
  "sizing"
]);

export interface KatexSnapshotOptions {
  overlayRect?: KatexTokenRect | undefined;
  rowTolerancePx?: number | undefined;
}

export interface KatexSnapshot {
  tokens: readonly KatexMotionToken[];
  bounds: KatexTokenRect;
}

export function snapshotKatexTokens(
  root: Element,
  options: KatexSnapshotOptions = {}
): KatexSnapshot {
  const overlayRect =
    options.overlayRect ?? domRectToTokenRect(root.getBoundingClientRect());
  const candidates = Array.from(
    root.querySelectorAll<HTMLElement>(".katex-html span")
  );
  const tokens = candidates
    .filter(isMotionElement)
    .map((element, index): KatexMotionToken | undefined => {
      const rect = domRectToTokenRect(element.getBoundingClientRect());
      const text =
        normalizeKatexTokenText(element.textContent ?? "") ||
        structuralTokenText(element);

      if (text.length === 0 || rect.width <= 0 || rect.height <= 0) {
        return undefined;
      }

      return {
        id: `katex-token-${index}`,
        text,
        signature: normalizeKatexTokenSignature(element.className),
        rect,
        localRect: createLocalTokenRect(rect, overlayRect),
        row: 0,
        element
      };
    })
    .filter((token): token is KatexMotionToken => token !== undefined);

  return {
    tokens: assignKatexTokenRows(tokens, options.rowTolerancePx ?? 5),
    bounds: overlayRect
  };
}

export function normalizeKatexTokenText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function normalizeKatexTokenSignature(className: string): string {
  return className
    .split(/\s+/)
    .filter((name) => name.length > 0 && !isNoisyClassName(name))
    .sort()
    .join(" ");
}

export function createLocalTokenRect(
  rect: KatexTokenRect,
  overlayRect: KatexTokenRect
): KatexTokenRect {
  return {
    left: rect.left - overlayRect.left,
    top: rect.top - overlayRect.top,
    width: rect.width,
    height: rect.height
  };
}

export function assignKatexTokenRows(
  tokens: readonly KatexMotionToken[],
  rowTolerancePx: number
): readonly KatexMotionToken[] {
  const rowTops: number[] = [];
  const rowByTokenIndex = new Map<number, number>();

  tokens
    .map((token, index) => ({ token, index }))
    .sort((a, b) => a.token.rect.top - b.token.rect.top)
    .forEach(({ token, index }) => {
      const rowIndex = findRowIndex(rowTops, token.rect.top, rowTolerancePx);

      if (rowIndex === rowTops.length) {
        rowTops.push(token.rect.top);
      }

      rowByTokenIndex.set(index, rowIndex);
    });

  return tokens.map((token, index) => ({
    ...token,
    row: rowByTokenIndex.get(index) ?? 0
  }));
}

function findRowIndex(
  rowTops: readonly number[],
  top: number,
  tolerance: number
): number {
  const index = rowTops.findIndex((rowTop) => Math.abs(rowTop - top) <= tolerance);

  return index === -1 ? rowTops.length : index;
}

function isNoisyClassName(name: string): boolean {
  return NOISY_CLASS_NAMES.has(name) || /^reset-size\d+$/.test(name);
}

function isMotionElement(element: HTMLElement): boolean {
  if (isStructuralMotionElement(element)) {
    return true;
  }

  const classes = element.className.split(/\s+/);

  if (!classes.some((name) => TOKEN_CLASS_NAMES.has(name))) {
    return false;
  }

  return !Array.from(element.children).some((child) =>
    normalizeKatexTokenText(child.textContent ?? "").length > 0
  );
}

function isStructuralMotionElement(element: HTMLElement): boolean {
  return element.className
    .split(/\s+/)
    .some((name) => STRUCTURAL_TOKEN_CLASS_NAMES.has(name));
}

function structuralTokenText(element: HTMLElement): string {
  const structuralClasses = element.className
    .split(/\s+/)
    .filter((name) => STRUCTURAL_TOKEN_CLASS_NAMES.has(name))
    .sort();

  return structuralClasses.length === 0
    ? ""
    : `structural:${structuralClasses.join(".")}`;
}

function domRectToTokenRect(rect: DOMRect): KatexTokenRect {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height
  };
}
