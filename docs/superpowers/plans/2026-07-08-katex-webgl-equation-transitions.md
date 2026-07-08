# KaTeX WebGL Equation Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a V1 transition system that animates between two arbitrary rendered KaTeX equation states by blanking the DOM visually, drawing token copies in a temporary WebGL overlay, and restoring the target KaTeX at the end.

**Architecture:** Keep KaTeX HTML as the semantic and accessible source of truth. Use pure TypeScript modules for token snapshot normalization, deterministic token matching, texture atlas packing, and quad geometry; use a small direct WebGL renderer for screen-space textured quads instead of Three.js. Browser-only work stays behind a lazy controller API so the main app does not pay for transition code until requested.

**Tech Stack:** TypeScript, KaTeX, DOM APIs, Canvas 2D for token rasterization, direct WebGL 1 for compositing, Node test runner for pure units, Playwright/Chrome for browser smoke coverage.

---

## File Structure

- Create `src/rendering/katex-transition-types.ts`: shared rect, token, transition-plan, atlas, renderer, and result types.
- Create `src/rendering/katex-token-matcher.ts`: pure deterministic source/target token matching.
- Create `tests/katex-token-matcher.test.ts`: pure matcher behavior, repeated-symbol determinism, source-only/target-only coverage.
- Create `src/rendering/katex-token-snapshot.ts`: DOM snapshot wrapper plus pure token normalization helpers.
- Create `tests/katex-token-snapshot.test.ts`: pure normalization, row bucketing, and local rect behavior.
- Create `src/rendering/katex-texture-atlas.ts`: pure texture packing plus browser DOM-to-image capture helpers.
- Create `tests/katex-texture-atlas.test.ts`: atlas packing, texture coordinate, and overflow behavior.
- Create `src/rendering/katex-webgl-transition.ts`: direct WebGL renderer and pure quad interpolation helpers.
- Create `tests/katex-webgl-transition.test.ts`: quad interpolation and renderer-boundary tests that do not require a WebGL context.
- Create `src/rendering/katex-transition-controller.ts`: public `transitionKatexEquations` API, CSS class orchestration, fallback routing, cleanup, diagnostics.
- Create `tests/katex-transition-controller.test.ts`: controller fallback and dependency-injection tests.
- Modify `src/styles.css`: transient blanking and overlay classes.
- Modify `package.json` and `package-lock.json`: add `@playwright/test` and a focused browser smoke command.
- Create `playwright.config.ts`: Vite web server for browser tests.
- Create `tests/katex-transition.browser.spec.ts`: Chrome smoke test with real KaTeX, real DOM measurement, overlay lifecycle, and cleanup.

Before implementation, run `git status --short`. The current workspace may contain unrelated uncommitted edits in `src/editor/editor.ts`, `tests/editor.test.ts`, and `.superpowers/`. Do not stage those paths for this feature unless the user explicitly folds that work into this branch.

---

### Task 1: Shared Types And Deterministic Token Matching

**Files:**
- Create: `src/rendering/katex-transition-types.ts`
- Create: `src/rendering/katex-token-matcher.ts`
- Test: `tests/katex-token-matcher.test.ts`

- [ ] **Step 1: Write the failing matcher tests**

Create `tests/katex-token-matcher.test.ts`:

```ts
import { strict as assert } from "node:assert";
import test from "node:test";

import { createKatexTransitionPlan } from "../src/rendering/katex-token-matcher.ts";
import type { KatexMotionToken } from "../src/rendering/katex-transition-types.ts";

function token(
  id: string,
  text: string,
  signature: string,
  left: number,
  top: number,
  row = 0
): KatexMotionToken {
  return {
    id,
    text,
    signature,
    rect: { left, top, width: 10, height: 12 },
    localRect: { left, top, width: 10, height: 12 },
    row
  };
}

test("createKatexTransitionPlan matches equivalent tokens in stable order", () => {
  const source = [
    token("s-x-0", "x", "mord", 10, 20),
    token("s-plus", "+", "mbin", 25, 20),
    token("s-x-1", "x", "mord", 40, 20)
  ];
  const target = [
    token("t-x-0", "x", "mord", 12, 80),
    token("t-x-1", "x", "mord", 28, 80),
    token("t-plus", "+", "mbin", 44, 80)
  ];

  const plan = createKatexTransitionPlan(source, target);

  assert.deepEqual(
    plan.matched.map((match) => [match.source.id, match.target.id]),
    [
      ["s-x-0", "t-x-0"],
      ["s-plus", "t-plus"],
      ["s-x-1", "t-x-1"]
    ]
  );
  assert.equal(plan.sourceOnly.length, 0);
  assert.equal(plan.targetOnly.length, 0);
  assert.equal(plan.diagnostics.ambiguousGroupCount, 1);
});

test("createKatexTransitionPlan reports source-only and target-only tokens", () => {
  const source = [
    token("s-x", "x", "mord", 10, 20),
    token("s-minus", "-", "mbin", 25, 20)
  ];
  const target = [
    token("t-x", "x", "mord", 10, 20),
    token("t-one", "1", "mord", 25, 20)
  ];

  const plan = createKatexTransitionPlan(source, target);

  assert.deepEqual(
    plan.matched.map((match) => [match.source.id, match.target.id]),
    [["s-x", "t-x"]]
  );
  assert.deepEqual(plan.sourceOnly.map((entry) => entry.source.id), ["s-minus"]);
  assert.deepEqual(plan.targetOnly.map((entry) => entry.target.id), ["t-one"]);
  assert.equal(plan.diagnostics.sourceTokenCount, 2);
  assert.equal(plan.diagnostics.targetTokenCount, 2);
  assert.equal(plan.diagnostics.matchedCount, 1);
});

test("createKatexTransitionPlan prefers tokens in the same row bucket", () => {
  const source = [
    token("s-num-x", "x", "mord", 10, 10, 0),
    token("s-den-x", "x", "mord", 10, 40, 1)
  ];
  const target = [
    token("t-den-x", "x", "mord", 100, 40, 1),
    token("t-num-x", "x", "mord", 100, 10, 0)
  ];

  const plan = createKatexTransitionPlan(source, target);

  assert.deepEqual(
    plan.matched.map((match) => [match.source.id, match.target.id]),
    [
      ["s-num-x", "t-num-x"],
      ["s-den-x", "t-den-x"]
    ]
  );
});
```

- [ ] **Step 2: Run the matcher tests to verify they fail**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/katex-token-matcher.test.ts
```

Expected: FAIL with a module-not-found error for `katex-token-matcher.ts` or `katex-transition-types.ts`.

- [ ] **Step 3: Add shared transition types**

Create `src/rendering/katex-transition-types.ts`:

```ts
export interface KatexTokenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface KatexMotionToken {
  id: string;
  text: string;
  signature: string;
  rect: KatexTokenRect;
  localRect: KatexTokenRect;
  row: number;
  element?: Element | undefined;
}

export interface KatexMatchedToken {
  source: KatexMotionToken;
  target: KatexMotionToken;
}

export interface KatexSourceOnlyToken {
  source: KatexMotionToken;
}

export interface KatexTargetOnlyToken {
  target: KatexMotionToken;
}

export interface KatexTransitionPlanDiagnostics {
  sourceTokenCount: number;
  targetTokenCount: number;
  matchedCount: number;
  sourceOnlyCount: number;
  targetOnlyCount: number;
  ambiguousGroupCount: number;
}

export interface KatexTransitionPlan {
  matched: readonly KatexMatchedToken[];
  sourceOnly: readonly KatexSourceOnlyToken[];
  targetOnly: readonly KatexTargetOnlyToken[];
  diagnostics: KatexTransitionPlanDiagnostics;
}

export interface KatexAtlasRegion {
  tokenId: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  u0: number;
  v0: number;
  u1: number;
  v1: number;
}

export interface KatexTextureAtlas {
  width: number;
  height: number;
  pixelRatio: number;
  pages: readonly HTMLCanvasElement[];
  regions: ReadonlyMap<string, KatexAtlasRegion>;
}

export type KatexTransitionRendererKind = "webgl" | "css-fallback" | "instant";

export interface KatexTransitionResult {
  renderer: KatexTransitionRendererKind;
  sourceTokenCount: number;
  targetTokenCount: number;
  matchedCount: number;
  sourceOnlyCount: number;
  targetOnlyCount: number;
  textureCount: number;
  durationMs: number;
  fallbackReason?: string | undefined;
}
```

- [ ] **Step 4: Implement deterministic matching**

Create `src/rendering/katex-token-matcher.ts`:

```ts
import type {
  KatexMotionToken,
  KatexTransitionPlan
} from "./katex-transition-types.ts";

interface MatchCandidate {
  source: KatexMotionToken;
  target: KatexMotionToken;
  score: number;
  targetIndex: number;
}

export function createKatexTransitionPlan(
  sourceTokens: readonly KatexMotionToken[],
  targetTokens: readonly KatexMotionToken[]
): KatexTransitionPlan {
  const matched: Array<{ source: KatexMotionToken; target: KatexMotionToken }> = [];
  const usedTargets = new Set<string>();
  let ambiguousGroupCount = 0;

  for (const source of sourceTokens) {
    const candidates = targetTokens
      .map((target, targetIndex): MatchCandidate => ({
        source,
        target,
        targetIndex,
        score: scoreCandidate(source, target)
      }))
      .filter((candidate) => candidate.score > 0 && !usedTargets.has(candidate.target.id))
      .sort(compareCandidates);

    if (candidates.length === 0) {
      continue;
    }

    if (
      candidates.length > 1 &&
      candidates[0] !== undefined &&
      candidates[1] !== undefined &&
      candidates[0].score === candidates[1].score
    ) {
      ambiguousGroupCount += 1;
    }

    const best = candidates[0];

    if (best !== undefined) {
      matched.push({ source: best.source, target: best.target });
      usedTargets.add(best.target.id);
    }
  }

  const usedSources = new Set(matched.map((match) => match.source.id));
  const sourceOnly = sourceTokens
    .filter((source) => !usedSources.has(source.id))
    .map((source) => ({ source }));
  const targetOnly = targetTokens
    .filter((target) => !usedTargets.has(target.id))
    .map((target) => ({ target }));

  return {
    matched,
    sourceOnly,
    targetOnly,
    diagnostics: {
      sourceTokenCount: sourceTokens.length,
      targetTokenCount: targetTokens.length,
      matchedCount: matched.length,
      sourceOnlyCount: sourceOnly.length,
      targetOnlyCount: targetOnly.length,
      ambiguousGroupCount
    }
  };
}

function scoreCandidate(
  source: KatexMotionToken,
  target: KatexMotionToken
): number {
  if (source.text.length === 0 || target.text.length === 0) {
    return 0;
  }

  if (source.text !== target.text) {
    return 0;
  }

  const signatureScore = source.signature === target.signature ? 100 : 60;
  const rowPenalty = Math.min(Math.abs(source.row - target.row), 6) * 4;

  return Math.max(signatureScore - rowPenalty, 1);
}

function compareCandidates(a: MatchCandidate, b: MatchCandidate): number {
  if (a.score !== b.score) {
    return b.score - a.score;
  }

  const aDistance = tokenDistance(a.source, a.target);
  const bDistance = tokenDistance(b.source, b.target);

  if (aDistance !== bDistance) {
    return aDistance - bDistance;
  }

  return a.targetIndex - b.targetIndex;
}

function tokenDistance(source: KatexMotionToken, target: KatexMotionToken): number {
  const sourceCenterX = source.localRect.left + source.localRect.width / 2;
  const sourceCenterY = source.localRect.top + source.localRect.height / 2;
  const targetCenterX = target.localRect.left + target.localRect.width / 2;
  const targetCenterY = target.localRect.top + target.localRect.height / 2;

  return Math.hypot(targetCenterX - sourceCenterX, targetCenterY - sourceCenterY);
}
```

- [ ] **Step 5: Run the matcher tests**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/katex-token-matcher.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

```bash
git add src/rendering/katex-transition-types.ts src/rendering/katex-token-matcher.ts tests/katex-token-matcher.test.ts
git commit -m "render: add katex token matcher"
```

---

### Task 2: KaTeX Token Snapshot Normalization

**Files:**
- Create: `src/rendering/katex-token-snapshot.ts`
- Test: `tests/katex-token-snapshot.test.ts`

- [ ] **Step 1: Write failing snapshot-normalization tests**

Create `tests/katex-token-snapshot.test.ts`:

```ts
import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createLocalTokenRect,
  normalizeKatexTokenText,
  normalizeKatexTokenSignature,
  assignKatexTokenRows
} from "../src/rendering/katex-token-snapshot.ts";
import type { KatexMotionToken } from "../src/rendering/katex-transition-types.ts";

test("normalizeKatexTokenText collapses whitespace and ignores empty content", () => {
  assert.equal(normalizeKatexTokenText("  x  "), "x");
  assert.equal(normalizeKatexTokenText("\n + \t"), "+");
  assert.equal(normalizeKatexTokenText("   "), "");
});

test("normalizeKatexTokenSignature keeps stable KaTeX class names", () => {
  assert.equal(
    normalizeKatexTokenSignature("mord mathnormal sizing reset-size6 size3"),
    "mathnormal mord size3"
  );
  assert.equal(normalizeKatexTokenSignature("mbin mspace"), "mbin mspace");
});

test("createLocalTokenRect maps viewport rects into overlay-local coordinates", () => {
  assert.deepEqual(
    createLocalTokenRect(
      { left: 120, top: 80, width: 30, height: 14 },
      { left: 100, top: 50, width: 200, height: 120 }
    ),
    { left: 20, top: 30, width: 30, height: 14 }
  );
});

test("assignKatexTokenRows groups nearby token tops into row buckets", () => {
  const tokens: KatexMotionToken[] = [
    token("a", 10),
    token("b", 12),
    token("c", 38),
    token("d", 41)
  ];

  assert.deepEqual(
    assignKatexTokenRows(tokens, 6).map((entry) => [entry.id, entry.row]),
    [
      ["a", 0],
      ["b", 0],
      ["c", 1],
      ["d", 1]
    ]
  );
});

function token(id: string, top: number): KatexMotionToken {
  return {
    id,
    text: id,
    signature: "mord",
    rect: { left: 0, top, width: 10, height: 12 },
    localRect: { left: 0, top, width: 10, height: 12 },
    row: 0
  };
}
```

- [ ] **Step 2: Run the snapshot tests to verify they fail**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/katex-token-snapshot.test.ts
```

Expected: FAIL with a module-not-found error for `katex-token-snapshot.ts`.

- [ ] **Step 3: Implement pure normalization and browser snapshot wrapper**

Create `src/rendering/katex-token-snapshot.ts`:

```ts
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

const NOISY_CLASS_NAMES = new Set([
  "base",
  "strut",
  "vlist",
  "vlist-t",
  "vlist-r",
  "vlist-s",
  "reset-size6",
  "reset-size5",
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
      const text = normalizeKatexTokenText(element.textContent ?? "");

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
    .filter((name) => name.length > 0 && !NOISY_CLASS_NAMES.has(name))
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
  const sortedRows: number[] = [];

  return tokens.map((token) => {
    const rowIndex = findRowIndex(sortedRows, token.rect.top, rowTolerancePx);

    if (rowIndex === sortedRows.length) {
      sortedRows.push(token.rect.top);
    }

    return { ...token, row: rowIndex };
  });
}

function findRowIndex(
  rowTops: readonly number[],
  top: number,
  tolerance: number
): number {
  const index = rowTops.findIndex((rowTop) => Math.abs(rowTop - top) <= tolerance);

  return index === -1 ? rowTops.length : index;
}

function isMotionElement(element: HTMLElement): boolean {
  const classes = element.className.split(/\s+/);

  if (!classes.some((name) => TOKEN_CLASS_NAMES.has(name))) {
    return false;
  }

  return !Array.from(element.children).some((child) =>
    normalizeKatexTokenText(child.textContent ?? "").length > 0
  );
}

function domRectToTokenRect(rect: DOMRect): KatexTokenRect {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height
  };
}
```

- [ ] **Step 4: Run the snapshot tests**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/katex-token-snapshot.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/rendering/katex-token-snapshot.ts tests/katex-token-snapshot.test.ts
git commit -m "render: snapshot katex motion tokens"
```

---

### Task 3: Texture Atlas Packing And DOM Capture Boundary

**Files:**
- Create: `src/rendering/katex-texture-atlas.ts`
- Test: `tests/katex-texture-atlas.test.ts`

- [ ] **Step 1: Write failing atlas tests**

Create `tests/katex-texture-atlas.test.ts`:

```ts
import { strict as assert } from "node:assert";
import test from "node:test";

import { packKatexTextureRegions } from "../src/rendering/katex-texture-atlas.ts";
import type { KatexMotionToken } from "../src/rendering/katex-transition-types.ts";

test("packKatexTextureRegions packs token rects with padding and uv coordinates", () => {
  const regions = packKatexTextureRegions(
    [token("x", 10, 12), token("plus", 8, 12)],
    { width: 64, height: 64, padding: 2, pixelRatio: 2 }
  );

  assert.equal(regions.length, 2);
  assert.equal(regions[0]?.tokenId, "x");
  assert.deepEqual(
    regions.map((region) => [region.page, region.x, region.y, region.width, region.height]),
    [
      [0, 2, 2, 20, 24],
      [0, 26, 2, 16, 24]
    ]
  );
  assert.equal(regions[0]?.u0, 2 / 64);
  assert.equal(regions[0]?.v0, 2 / 64);
});

test("packKatexTextureRegions starts a new row when the current row is full", () => {
  const regions = packKatexTextureRegions(
    [token("a", 12, 10), token("b", 12, 10), token("c", 12, 10)],
    { width: 40, height: 64, padding: 2, pixelRatio: 1 }
  );

  assert.deepEqual(
    regions.map((region) => [region.tokenId, region.x, region.y]),
    [
      ["a", 2, 2],
      ["b", 18, 2],
      ["c", 2, 16]
    ]
  );
});

test("packKatexTextureRegions rejects tokens larger than the atlas page", () => {
  assert.throws(
    () =>
      packKatexTextureRegions([token("huge", 100, 100)], {
        width: 64,
        height: 64,
        padding: 2,
        pixelRatio: 1
      }),
    /does not fit/
  );
});

function token(id: string, width: number, height: number): KatexMotionToken {
  return {
    id,
    text: id,
    signature: "mord",
    rect: { left: 0, top: 0, width, height },
    localRect: { left: 0, top: 0, width, height },
    row: 0
  };
}
```

- [ ] **Step 2: Run the atlas tests to verify they fail**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/katex-texture-atlas.test.ts
```

Expected: FAIL with a module-not-found error for `katex-texture-atlas.ts`.

- [ ] **Step 3: Implement atlas packing and browser capture functions**

Create `src/rendering/katex-texture-atlas.ts`:

```ts
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
```

- [ ] **Step 4: Run the atlas tests**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/katex-texture-atlas.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/rendering/katex-texture-atlas.ts tests/katex-texture-atlas.test.ts
git commit -m "render: pack katex texture atlas"
```

---

### Task 4: Direct WebGL Quad Renderer

**Files:**
- Create: `src/rendering/katex-webgl-transition.ts`
- Test: `tests/katex-webgl-transition.test.ts`

- [ ] **Step 1: Write failing WebGL geometry tests**

Create `tests/katex-webgl-transition.test.ts`:

```ts
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createKatexQuadFrame } from "../src/rendering/katex-webgl-transition.ts";
import type {
  KatexAtlasRegion,
  KatexMatchedToken,
  KatexMotionToken
} from "../src/rendering/katex-transition-types.ts";

test("createKatexQuadFrame interpolates matched token position and opacity", () => {
  const source = token("s-x", 10, 20, 8, 12);
  const target = token("t-x", 50, 80, 16, 24);
  const region: KatexAtlasRegion = {
    tokenId: source.id,
    page: 0,
    x: 0,
    y: 0,
    width: 8,
    height: 12,
    u0: 0,
    v0: 0,
    u1: 0.25,
    v1: 0.5
  };

  const frame = createKatexQuadFrame(
    {
      matched: [{ source, target } satisfies KatexMatchedToken],
      sourceOnly: [],
      targetOnly: [],
      diagnostics: {
        sourceTokenCount: 1,
        targetTokenCount: 1,
        matchedCount: 1,
        sourceOnlyCount: 0,
        targetOnlyCount: 0,
        ambiguousGroupCount: 0
      }
    },
    new Map([[source.id, region]]),
    0.5
  );

  assert.equal(frame.quads.length, 1);
  assert.deepEqual(frame.quads[0]?.rect, {
    left: 30,
    top: 50,
    width: 12,
    height: 18
  });
  assert.equal(frame.quads[0]?.opacity, 1);
});

test("createKatexQuadFrame fades source-only and target-only tokens", () => {
  const source = token("s-minus", 10, 20, 8, 12);
  const target = token("t-one", 50, 80, 8, 12);
  const regions = new Map<string, KatexAtlasRegion>([
    [source.id, regionFor(source.id)],
    [target.id, regionFor(target.id)]
  ]);

  const frame = createKatexQuadFrame(
    {
      matched: [],
      sourceOnly: [{ source }],
      targetOnly: [{ target }],
      diagnostics: {
        sourceTokenCount: 1,
        targetTokenCount: 1,
        matchedCount: 0,
        sourceOnlyCount: 1,
        targetOnlyCount: 1,
        ambiguousGroupCount: 0
      }
    },
    regions,
    0.25
  );

  assert.deepEqual(
    frame.quads.map((quad) => [quad.tokenId, quad.opacity]),
    [
      ["s-minus", 0.75],
      ["t-one", 0.25]
    ]
  );
});

test("katex-webgl-transition does not import Three.js", () => {
  const source = readFileSync(
    new URL("../src/rendering/katex-webgl-transition.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /from "three"|from 'three'/);
});

function token(
  id: string,
  left: number,
  top: number,
  width: number,
  height: number
): KatexMotionToken {
  return {
    id,
    text: id,
    signature: "mord",
    rect: { left, top, width, height },
    localRect: { left, top, width, height },
    row: 0
  };
}

function regionFor(tokenId: string): KatexAtlasRegion {
  return {
    tokenId,
    page: 0,
    x: 0,
    y: 0,
    width: 8,
    height: 12,
    u0: 0,
    v0: 0,
    u1: 0.25,
    v1: 0.5
  };
}
```

- [ ] **Step 2: Run the WebGL transition tests to verify they fail**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/katex-webgl-transition.test.ts
```

Expected: FAIL with a module-not-found error for `katex-webgl-transition.ts`.

- [ ] **Step 3: Implement quad interpolation and direct WebGL renderer boundary**

Create `src/rendering/katex-webgl-transition.ts`:

```ts
import type {
  KatexAtlasRegion,
  KatexTextureAtlas,
  KatexTokenRect,
  KatexTransitionPlan
} from "./katex-transition-types.ts";

export interface KatexQuad {
  tokenId: string;
  rect: KatexTokenRect;
  opacity: number;
  region: KatexAtlasRegion;
}

export interface KatexQuadFrame {
  quads: readonly KatexQuad[];
}

export interface KatexWebGLRenderer {
  render(progress: number): void;
  dispose(): void;
}

export function createKatexQuadFrame(
  plan: KatexTransitionPlan,
  regions: ReadonlyMap<string, KatexAtlasRegion>,
  progress: number
): KatexQuadFrame {
  const clampedProgress = clamp(progress, 0, 1);
  const quads: KatexQuad[] = [];

  for (const match of plan.matched) {
    const region = regions.get(match.source.id);

    if (region !== undefined) {
      quads.push({
        tokenId: match.source.id,
        rect: interpolateRect(match.source.localRect, match.target.localRect, clampedProgress),
        opacity: 1,
        region
      });
    }
  }

  for (const entry of plan.sourceOnly) {
    const region = regions.get(entry.source.id);

    if (region !== undefined) {
      quads.push({
        tokenId: entry.source.id,
        rect: entry.source.localRect,
        opacity: 1 - clampedProgress,
        region
      });
    }
  }

  for (const entry of plan.targetOnly) {
    const region = regions.get(entry.target.id);

    if (region !== undefined) {
      quads.push({
        tokenId: entry.target.id,
        rect: entry.target.localRect,
        opacity: clampedProgress,
        region
      });
    }
  }

  return { quads };
}

export function createKatexWebGLRenderer(
  canvas: HTMLCanvasElement,
  plan: KatexTransitionPlan,
  atlas: KatexTextureAtlas
): KatexWebGLRenderer {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    depth: false,
    premultipliedAlpha: true
  });

  if (gl === null) {
    throw new Error("WebGL is unavailable for KaTeX transitions.");
  }

  const program = createProgram(gl);
  const textures = atlas.pages.map((page) => createTexture(gl, page));
  const buffer = gl.createBuffer();

  if (buffer === null) {
    throw new Error("Could not create a WebGL buffer for KaTeX transitions.");
  }

  return {
    render(progress) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

      const frame = createKatexQuadFrame(plan, atlas.regions, progress);

      for (const quad of frame.quads) {
        const texture = textures[quad.region.page];

        if (texture === undefined) {
          continue;
        }

        drawQuad(gl, program, texture, canvas, quad);
      }
    },
    dispose() {
      for (const texture of textures) {
        gl.deleteTexture(texture);
      }

      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    }
  };
}

function interpolateRect(
  source: KatexTokenRect,
  target: KatexTokenRect,
  progress: number
): KatexTokenRect {
  return {
    left: interpolate(source.left, target.left, progress),
    top: interpolate(source.top, target.top, progress),
    width: interpolate(source.width, target.width, progress),
    height: interpolate(source.height, target.height, progress)
  };
}

function interpolate(source: number, target: number, progress: number): number {
  return source + (target - source) * progress;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const vertexShader = compileShader(
    gl,
    gl.VERTEX_SHADER,
    `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      uniform vec2 u_resolution;
      varying vec2 v_texCoord;
      void main() {
        vec2 zeroToOne = a_position / u_resolution;
        vec2 clipSpace = zeroToOne * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `
  );
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform float u_opacity;
      varying vec2 v_texCoord;
      void main() {
        vec4 color = texture2D(u_texture, v_texCoord);
        gl_FragColor = vec4(color.rgb, color.a * u_opacity);
      }
    `
  );
  const program = gl.createProgram();

  if (program === null) {
    throw new Error("Could not create a WebGL program for KaTeX transitions.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(String(gl.getProgramInfoLog(program)));
  }

  return program;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);

  if (shader === null) {
    throw new Error("Could not create a WebGL shader for KaTeX transitions.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(String(gl.getShaderInfoLog(shader)));
  }

  return shader;
}

function createTexture(
  gl: WebGLRenderingContext,
  source: HTMLCanvasElement
): WebGLTexture {
  const texture = gl.createTexture();

  if (texture === null) {
    throw new Error("Could not create a WebGL texture for KaTeX transitions.");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

  return texture;
}

function drawQuad(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  texture: WebGLTexture,
  canvas: HTMLCanvasElement,
  quad: KatexQuad
): void {
  const { left, top, width, height } = quad.rect;
  const x0 = left;
  const x1 = left + width;
  const y0 = top;
  const y1 = top + height;
  const { u0, v0, u1, v1 } = quad.region;
  const vertices = new Float32Array([
    x0, y0, u0, v0,
    x1, y0, u1, v0,
    x0, y1, u0, v1,
    x0, y1, u0, v1,
    x1, y0, u1, v0,
    x1, y1, u1, v1
  ]);
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  const opacityLocation = gl.getUniformLocation(program, "u_opacity");

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
  gl.enableAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
  gl.enableAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8);
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  gl.uniform1f(opacityLocation, quad.opacity);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
```

- [ ] **Step 4: Run the WebGL transition tests**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/katex-webgl-transition.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 4**

```bash
git add src/rendering/katex-webgl-transition.ts tests/katex-webgl-transition.test.ts
git commit -m "render: add katex webgl quad renderer"
```

---

### Task 5: Transition Controller And CSS Fallback

**Files:**
- Create: `src/rendering/katex-transition-controller.ts`
- Test: `tests/katex-transition-controller.test.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing controller tests**

Create `tests/katex-transition-controller.test.ts`:

```ts
import { strict as assert } from "node:assert";
import test from "node:test";

import {
  prefersReducedKatexMotion,
  summarizeKatexTransitionResult
} from "../src/rendering/katex-transition-controller.ts";

test("prefersReducedKatexMotion reads matchMedia defensively", () => {
  assert.equal(prefersReducedKatexMotion(undefined), false);
  assert.equal(
    prefersReducedKatexMotion((query) => ({
      media: query,
      matches: true,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false
    })),
    true
  );
});

test("summarizeKatexTransitionResult reports plan diagnostics and fallback reason", () => {
  assert.deepEqual(
    summarizeKatexTransitionResult(
      {
        matched: [],
        sourceOnly: [{ source: token("source") }],
        targetOnly: [{ target: token("target") }],
        diagnostics: {
          sourceTokenCount: 1,
          targetTokenCount: 1,
          matchedCount: 0,
          sourceOnlyCount: 1,
          targetOnlyCount: 1,
          ambiguousGroupCount: 0
        }
      },
      "css-fallback",
      120,
      0,
      "reduced-motion"
    ),
    {
      renderer: "css-fallback",
      sourceTokenCount: 1,
      targetTokenCount: 1,
      matchedCount: 0,
      sourceOnlyCount: 1,
      targetOnlyCount: 1,
      textureCount: 0,
      durationMs: 120,
      fallbackReason: "reduced-motion"
    }
  );
});

function token(id: string) {
  return {
    id,
    text: id,
    signature: "mord",
    rect: { left: 0, top: 0, width: 10, height: 12 },
    localRect: { left: 0, top: 0, width: 10, height: 12 },
    row: 0
  };
}
```

- [ ] **Step 2: Run controller tests to verify they fail**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/katex-transition-controller.test.ts
```

Expected: FAIL with a module-not-found error for `katex-transition-controller.ts`.

- [ ] **Step 3: Implement the controller API**

Create `src/rendering/katex-transition-controller.ts`:

```ts
import { createKatexTransitionPlan } from "./katex-token-matcher.ts";
import { snapshotKatexTokens } from "./katex-token-snapshot.ts";
import { createKatexTextureAtlas } from "./katex-texture-atlas.ts";
import type {
  KatexTextureAtlas,
  KatexTransitionPlan,
  KatexTransitionRendererKind,
  KatexTransitionResult
} from "./katex-transition-types.ts";

export interface KatexTransitionOptions {
  durationMs?: number | undefined;
  easing?: ((progress: number) => number) | undefined;
  forceFallback?: boolean | undefined;
}

type MatchMediaLike = typeof window.matchMedia;

const DEFAULT_DURATION_MS = 550;

export async function transitionKatexEquations(
  sourceEl: HTMLElement,
  targetEl: HTMLElement,
  options: KatexTransitionOptions = {}
): Promise<KatexTransitionResult> {
  const startedAt = performance.now();
  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;
  const bounds = combinedBounds(sourceEl, targetEl);
  const sourceSnapshot = snapshotKatexTokens(sourceEl, { overlayRect: bounds });
  const targetSnapshot = snapshotKatexTokens(targetEl, { overlayRect: bounds });
  const plan = createKatexTransitionPlan(sourceSnapshot.tokens, targetSnapshot.tokens);

  if (
    options.forceFallback === true ||
    prefersReducedKatexMotion(window.matchMedia.bind(window))
  ) {
    await runCssFallback(sourceEl, targetEl, durationMs);

    return summarizeKatexTransitionResult(
      plan,
      "css-fallback",
      performance.now() - startedAt,
      0,
      options.forceFallback === true ? "forced-fallback" : "reduced-motion"
    );
  }

  let atlas: KatexTextureAtlas | undefined;
  let overlay: HTMLCanvasElement | undefined;

  try {
    atlas = await createKatexTextureAtlas([
      ...plan.matched.map((match) => match.source),
      ...plan.sourceOnly.map((entry) => entry.source),
      ...plan.targetOnly.map((entry) => entry.target)
    ]);
    overlay = createOverlayCanvas(bounds, atlas.pixelRatio);
    const { createKatexWebGLRenderer } = await import(
      "./katex-webgl-transition.ts"
    );
    const renderer = createKatexWebGLRenderer(overlay, plan, atlas);

    document.body.append(overlay);
    sourceEl.classList.add("katex-transition-source-hidden");
    targetEl.classList.add("katex-transition-target-hidden");
    await animate(durationMs, options.easing ?? easeInOut, (progress) => {
      renderer.render(progress);
    });
    renderer.dispose();
    targetEl.classList.remove("katex-transition-target-hidden");

    return summarizeKatexTransitionResult(
      plan,
      "webgl",
      performance.now() - startedAt,
      atlas.pages.length
    );
  } catch (error: unknown) {
    await runCssFallback(sourceEl, targetEl, durationMs);

    return summarizeKatexTransitionResult(
      plan,
      "css-fallback",
      performance.now() - startedAt,
      atlas?.pages.length ?? 0,
      error instanceof Error ? error.message : "webgl-transition-failed"
    );
  } finally {
    overlay?.remove();
    sourceEl.classList.remove("katex-transition-source-hidden");
    targetEl.classList.remove("katex-transition-target-hidden");
  }
}

export function prefersReducedKatexMotion(
  matchMedia: MatchMediaLike | undefined
): boolean {
  return matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function summarizeKatexTransitionResult(
  plan: KatexTransitionPlan,
  renderer: KatexTransitionRendererKind,
  durationMs: number,
  textureCount: number,
  fallbackReason?: string
): KatexTransitionResult {
  return {
    renderer,
    sourceTokenCount: plan.diagnostics.sourceTokenCount,
    targetTokenCount: plan.diagnostics.targetTokenCount,
    matchedCount: plan.diagnostics.matchedCount,
    sourceOnlyCount: plan.diagnostics.sourceOnlyCount,
    targetOnlyCount: plan.diagnostics.targetOnlyCount,
    textureCount,
    durationMs,
    fallbackReason
  };
}

function combinedBounds(sourceEl: HTMLElement, targetEl: HTMLElement) {
  const source = sourceEl.getBoundingClientRect();
  const target = targetEl.getBoundingClientRect();
  const left = Math.min(source.left, target.left);
  const top = Math.min(source.top, target.top);
  const right = Math.max(source.right, target.right);
  const bottom = Math.max(source.bottom, target.bottom);

  return {
    left,
    top,
    width: right - left,
    height: bottom - top
  };
}

function createOverlayCanvas(
  bounds: { left: number; top: number; width: number; height: number },
  pixelRatio: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");

  canvas.className = "katex-transition-overlay";
  canvas.width = Math.max(1, Math.ceil(bounds.width * pixelRatio));
  canvas.height = Math.max(1, Math.ceil(bounds.height * pixelRatio));
  canvas.style.left = `${bounds.left + window.scrollX}px`;
  canvas.style.top = `${bounds.top + window.scrollY}px`;
  canvas.style.width = `${bounds.width}px`;
  canvas.style.height = `${bounds.height}px`;

  return canvas;
}

function animate(
  durationMs: number,
  easing: (progress: number) => number,
  render: (progress: number) => void
): Promise<void> {
  const startedAt = performance.now();

  return new Promise((resolve) => {
    function tick(now: number): void {
      const progress = Math.min((now - startedAt) / durationMs, 1);

      render(easing(progress));

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(tick);
  });
}

function easeInOut(progress: number): number {
  return progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
}

async function runCssFallback(
  sourceEl: HTMLElement,
  targetEl: HTMLElement,
  durationMs: number
): Promise<void> {
  sourceEl.classList.add("katex-transition-fallback-source");
  targetEl.classList.add("katex-transition-fallback-target");

  await new Promise((resolve) => window.setTimeout(resolve, durationMs));

  sourceEl.classList.remove("katex-transition-fallback-source");
  targetEl.classList.remove("katex-transition-fallback-target");
}
```

- [ ] **Step 4: Add transition CSS**

Modify `src/styles.css` near the KaTeX math styles:

```css
.katex-transition-overlay {
  position: absolute;
  z-index: 30;
  pointer-events: none;
}

.katex-transition-source-hidden,
.katex-transition-target-hidden {
  color: transparent;
}

.katex-transition-source-hidden *,
.katex-transition-target-hidden * {
  color: transparent !important;
}

.katex-transition-fallback-source {
  opacity: 0;
  transition: opacity 160ms ease;
}

.katex-transition-fallback-target {
  opacity: 1;
  transition: opacity 160ms ease;
}
```

- [ ] **Step 5: Run controller tests and typecheck**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/katex-transition-controller.test.ts
npm run typecheck
```

Expected: both commands PASS.

- [ ] **Step 6: Commit Task 5**

```bash
git add src/rendering/katex-transition-controller.ts tests/katex-transition-controller.test.ts src/styles.css
git commit -m "render: add katex transition controller"
```

---

### Task 6: Browser Smoke Harness With Real KaTeX And Chrome

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `playwright.config.ts`
- Create: `tests/katex-transition.browser.spec.ts`

- [ ] **Step 1: Install Playwright test dependency**

Run:

```bash
npm install --save-dev @playwright/test
```

Expected: `package.json` and `package-lock.json` include `@playwright/test`.

- [ ] **Step 2: Add browser test scripts**

Modify `package.json` scripts:

```json
{
  "scripts": {
    "test:browser:katex": "playwright test tests/katex-transition.browser.spec.ts --project=chromium"
  }
}
```

Keep the existing scripts unchanged.

- [ ] **Step 3: Add Playwright config**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: "npm run dev:client -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env["CI"]
  }
});
```

- [ ] **Step 4: Write failing browser smoke test**

Create `tests/katex-transition.browser.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("KaTeX WebGL transition blanks DOM during overlay and reveals target", async ({
  page
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const [{ renderLatexToHtml }, { transitionKatexEquations }] =
      await Promise.all([
        import("/src/rendering/katex-adapter.ts"),
        import("/src/rendering/katex-transition-controller.ts")
      ]);
    const host = document.createElement("section");

    host.setAttribute("data-testid", "katex-transition-host");
    host.innerHTML = `
      <div data-testid="source">${renderLatexToHtml(String.raw`x + x = 2x`)}</div>
      <div data-testid="target">${renderLatexToHtml(String.raw`\frac{x^2 - 1}{x - 1} = x + 1`)}</div>
    `;
    document.body.append(host);

    const source = host.querySelector<HTMLElement>('[data-testid="source"]');
    const target = host.querySelector<HTMLElement>('[data-testid="target"]');

    if (source === null || target === null) {
      throw new Error("Expected source and target KaTeX nodes.");
    }

    target.style.position = "absolute";
    target.style.left = `${source.getBoundingClientRect().left}px`;
    target.style.top = `${source.getBoundingClientRect().bottom + 24}px`;
    target.style.visibility = "visible";

    window.__kpKatexTransitionPromise = transitionKatexEquations(source, target, {
      durationMs: 120
    });
  });

  await expect(page.locator(".katex-transition-overlay")).toBeVisible();
  await expect(page.locator('[data-testid="source"]')).toHaveClass(
    /katex-transition-source-hidden/
  );
  const result = await page.evaluate(() => window.__kpKatexTransitionPromise);

  expect(result.renderer).toMatch(/webgl|css-fallback/);
  expect(result.sourceTokenCount).toBeGreaterThan(0);
  expect(result.targetTokenCount).toBeGreaterThan(0);
  await expect(page.locator(".katex-transition-overlay")).toHaveCount(0);
  await expect(page.locator('[data-testid="target"] .katex')).toBeVisible();
});

declare global {
  interface Window {
    __kpKatexTransitionPromise?: Promise<{
      renderer: string;
      sourceTokenCount: number;
      targetTokenCount: number;
    }>;
  }
}
```

- [ ] **Step 5: Run browser test to verify the harness**

Run:

```bash
npm run test:browser:katex
```

Expected: PASS in Chromium. If it fails because browsers are not installed, run:

```bash
npx playwright install chromium
```

Then rerun:

```bash
npm run test:browser:katex
```

- [ ] **Step 6: Commit Task 6**

```bash
git add package.json package-lock.json playwright.config.ts tests/katex-transition.browser.spec.ts
git commit -m "test: add katex transition browser smoke"
```

---

### Task 7: Full Verification And Documentation Update

**Files:**
- Modify: `docs/superpowers/specs/2026-07-08-katex-webgl-equation-transitions-design.md`

- [ ] **Step 1: Update the spec with the chosen V1 renderer decision**

Append this note under `Open Follow-Up Work` in `docs/superpowers/specs/2026-07-08-katex-webgl-equation-transitions-design.md`:

```md

## Implementation Note

The V1 implementation uses a small direct WebGL compositor for screen-space
token quads. It does not use Three.js for equation transitions because the
renderer does not need scene graph, camera, lighting, or depth behavior.
```

- [ ] **Step 2: Run focused tests**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/katex-token-matcher.test.ts tests/katex-token-snapshot.test.ts tests/katex-texture-atlas.test.ts tests/katex-webgl-transition.test.ts tests/katex-transition-controller.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run full Node test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 4: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Run browser smoke**

Run:

```bash
npm run test:browser:katex
```

Expected: PASS.

- [ ] **Step 6: Run production build**

Run:

```bash
npm run build
```

Expected: PASS. Inspect the output and confirm the KaTeX transition code does not add Three.js to the primary application chunk beyond the existing graph renderer split.

- [ ] **Step 7: Check diff hygiene**

Run:

```bash
git diff --check
git status --short
```

Expected: `git diff --check` produces no output. `git status --short` shows only files intentionally changed for the KaTeX transition feature plus any pre-existing unrelated files that were already dirty before implementation.

- [ ] **Step 8: Commit Task 7**

```bash
git add docs/superpowers/specs/2026-07-08-katex-webgl-equation-transitions-design.md
git commit -m "docs: record katex transition renderer choice"
```

## Self-Review Checklist

- Spec coverage: Tasks 1-2 cover token identity and arbitrary KaTeX snapshots; Task 3 covers texture atlas capture; Task 4 covers WebGL compositor; Task 5 covers controller, blanking, cleanup, reduced motion, and fallback results; Task 6 covers browser verification with real KaTeX; Task 7 covers full verification and documentation.
- Placeholder scan: This plan contains no forbidden placeholder markers or unspecified implementation steps.
- Type consistency: The plan uses `KatexMotionToken`, `KatexTransitionPlan`, `KatexTextureAtlas`, `KatexTransitionResult`, and `transitionKatexEquations` consistently across tasks.
