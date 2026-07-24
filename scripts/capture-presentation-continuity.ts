import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createKpPresentationContinuityVisualPlan } from
  "../src/editor/presentation-continuity-visual-plan.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const outputRoot = path.resolve(
  process.env["KP_VISUAL_OUTPUT"] ??
    "tmp/codex/presentation-continuity"
);
const harness = createKpVisualReviewHarness(
  process.env["KP_VISUAL_BASE_URL"] === undefined
    ? {}
    : { baseUrl: process.env["KP_VISUAL_BASE_URL"] }
);
const captures: {
  id: string;
  family: string;
  surface: "workbench-card" | "lesson";
  animationId: string;
  progress: number;
  viewport: { width: number; height: number };
  distributionGap?: {
    temporaryPx: number;
    nativePx: number;
    residualPx: number;
    temporaryFactorWidthPx: number;
    nativeFactorWidthPx: number;
    temporaryTermWidthPx: number;
    nativeTermWidthPx: number;
    temporaryInkGapPx: number;
    nativeInkGapPx: number;
    inkResidualPx: number;
    temporaryTermFontSizePx: number;
    nativeTermFontSizePx: number;
    temporaryTermText: string;
    nativeTermText: string;
    activeOwner: "source" | "target";
    activeGapPx: number;
    activeResidualPx: number;
    operatorOpacityTotal: number;
    operatorOverlapOpacity: number;
    activeOperatorOwner: "source" | "target";
    activeOperatorResidualPx: number;
    activeOperatorSizeResidualPx: number;
  } | undefined;
  screenshot: string;
  sha256: string;
}[] = [];

await mkdir(outputRoot, { recursive: true });
try {
  for (const visualCase of createKpPresentationContinuityVisualPlan()) {
    const page = await harness.page({
      viewport: visualCase.viewport,
      reducedMotion: "no-preference"
    });
    const stage = visualCase.surface === "lesson"
      ? await openDistributionLesson(page, visualCase.progress)
      : await openWorkbenchCard(page, {
          animationId: visualCase.animationId,
          query: visualCase.query,
          progress: visualCase.progress
        });
    const first = await stage.screenshot({ animations: "disabled" });
    await settle(page);
    const second = await stage.screenshot({ animations: "disabled" });
    const firstHash = sha256(first);
    if (firstHash !== sha256(second)) {
      throw new Error(`${visualCase.id} did not produce a stable capture.`);
    }
    const screenshotPath = path.join(outputRoot, `${visualCase.id}.png`);
    await writeFile(screenshotPath, first);
    const distributionGap =
      visualCase.family === "distribution" &&
      visualCase.surface === "workbench-card"
      ? await measureDistributionGap(stage)
      : undefined;
    captures.push({
      id: visualCase.id,
      family: visualCase.family,
      surface: visualCase.surface,
      animationId: visualCase.animationId,
      progress: visualCase.progress,
      viewport: visualCase.viewport,
      ...(distributionGap === undefined ? {} : { distributionGap }),
      screenshot: path.relative(process.cwd(), screenshotPath),
      sha256: firstHash
    });
  }
  const manifestPath = path.join(outputRoot, "manifest.json");
  const contactSheetPath = path.join(
    outputRoot,
    "distribution-contact-sheet.html"
  );
  await writeFile(contactSheetPath, distributionContactSheet(captures), "utf8");
  await writeFile(manifestPath, `${JSON.stringify({
    schemaVersion: "kp.presentation-continuity-visual.v1",
    captures
  }, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    manifest: path.relative(process.cwd(), manifestPath),
    captures: captures.length,
    distributionContactSheet: path.relative(process.cwd(), contactSheetPath)
  }, null, 2));
} finally {
  await harness.close();
}

async function openWorkbenchCard(
  page: import("playwright").Page,
  input: { animationId: string; query: string; progress: number }
): Promise<import("playwright").Locator> {
  const url = new URL("/", harness.baseUrl);
  url.searchParams.set("view", "animation-workbench");
  url.searchParams.set("q", input.query);
  url.searchParams.set("workbenchAnimation", input.animationId);
  await page.goto(url.toString(), { waitUntil: "networkidle" });
  await page.evaluate(async () => document.fonts.ready);
  const player = page.locator("[data-kp-editor-animation-player]");
  await player.waitFor();
  await page.waitForFunction((animationId) =>
    document.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]"
    )?.dataset["kpEditorAnimationId"] === animationId,
    input.animationId
  );
  const pause = player.locator('[data-action="pause-editor-animation"]');
  if (await pause.isEnabled()) await pause.click();
  await player.locator('[data-action="seek-editor-animation"]')
    .fill(String(input.progress));
  await settle(page);
  const stage = player.locator("[data-kp-editor-equation-stage]");
  await stage.waitFor();
  return stage;
}

async function openDistributionLesson(
  page: import("playwright").Page,
  choreographyProgress: number
): Promise<import("playwright").Locator> {
  await page.goto(harness.url("/reader/distribution-area/"), {
    waitUntil: "networkidle"
  });
  await page.locator('body[data-kp-reader-hydrated="true"]').waitFor();
  await page.evaluate(async () => document.fonts.ready);
  const stage = page.locator("[data-kp-distribution-stage]");
  await stage.scrollIntoViewIfNeeded();
  await settle(page);
  const scrubber = page.locator("[data-kp-distribution-scrubber]");
  await scrubber.fill(String(Math.round(choreographyProgress * 720)));
  await settle(page);
  // Locator capture may make a final subpixel scroll adjustment; warm it
  // before the authoritative control-owned sample.
  await stage.screenshot({ animations: "disabled" });
  await scrubber.fill(String(Math.round(choreographyProgress * 720)));
  await settle(page);
  await stage.waitFor();
  return stage;
}

async function settle(page: import("playwright").Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  ));
}

function sha256(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function distributionContactSheet(
  records: readonly {
    id: string;
    family: string;
    surface: "workbench-card" | "lesson";
    progress: number;
    viewport: { width: number; height: number };
    screenshot: string;
  }[]
): string {
  const distribution = records.filter((record) =>
    record.family === "distribution"
  );
  const cells = distribution.map((record) => {
    const source = path.basename(record.screenshot);
    return `<figure><img src="${source}" alt="${record.id}"><figcaption>` +
      `${record.surface} · ${record.viewport.width}px · ` +
      `${record.progress.toFixed(2)}</figcaption></figure>`;
  }).join("");
  return "<!doctype html><meta charset=\"utf-8\">" +
    "<title>Distribution presentation continuity</title>" +
    "<style>body{font:14px system-ui;margin:24px}main{display:grid;" +
    "grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}" +
    "figure{margin:0;border:1px solid #ccd5df;padding:12px}" +
    "img{display:block;max-width:100%;margin:auto}figcaption{margin-top:8px}" +
    "</style><h1>Distribution presentation continuity</h1><main>" +
    cells + "</main>";
}

async function measureDistributionGap(
  stage: import("playwright").Locator
): Promise<{
  temporaryPx: number;
  nativePx: number;
  residualPx: number;
  temporaryFactorWidthPx: number;
  nativeFactorWidthPx: number;
  temporaryTermWidthPx: number;
  nativeTermWidthPx: number;
  temporaryInkGapPx: number;
  nativeInkGapPx: number;
  inkResidualPx: number;
  temporaryTermFontSizePx: number;
  nativeTermFontSizePx: number;
  temporaryTermText: string;
  nativeTermText: string;
  activeOwner: "source" | "target";
  activeGapPx: number;
  activeResidualPx: number;
  operatorOpacityTotal: number;
  operatorOverlapOpacity: number;
  activeOperatorOwner: "source" | "target";
  activeOperatorResidualPx: number;
  activeOperatorSizeResidualPx: number;
}> {
  return stage.evaluate((element) => {
    const rect = (selector: string) => {
      const node = element.querySelector<HTMLElement>(selector);
      if (node === null) throw new Error(`Missing distribution probe ${selector}.`);
      return node.getBoundingClientRect();
    };
    const temporaryFactor = rect(
      '[data-kp-editor-equation-source] [data-kp-motion-id$=".factored.factor"]'
    );
    const temporaryTerm = rect(
      '[data-kp-editor-equation-source] [data-kp-motion-id$=".factored.left-term"]'
    );
    const nativeFactor = rect(
      '[data-kp-editor-equation-target] [data-kp-motion-id$=".expanded.left-factor"]'
    );
    const nativeTerm = rect(
      '[data-kp-editor-equation-target] [data-kp-motion-id$=".expanded.left-term"]'
    );
    const temporaryOperatorNode = element.querySelector<HTMLElement>(
      '[data-kp-editor-equation-source] [data-kp-motion-id$=".factored.plus"]'
    );
    const nativeOperatorNode = element.querySelector<HTMLElement>(
      '[data-kp-editor-equation-target] [data-kp-motion-id$=".expanded.plus"]'
    );
    if (temporaryOperatorNode === null || nativeOperatorNode === null) {
      throw new Error("Missing distribution operator continuity probe.");
    }
    const temporaryOperatorOpacity = Number(
      getComputedStyle(temporaryOperatorNode).opacity
    );
    const nativeOperatorOpacity = Number(
      getComputedStyle(nativeOperatorNode).opacity
    );
    const activeOperatorOwner =
      nativeOperatorOpacity >= 0.5 ? "target" : "source";
    const inkRect = (selector: string) => {
      const node = element.querySelector<HTMLElement>(selector);
      if (node === null) throw new Error(`Missing distribution ink probe ${selector}.`);
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      const rects: DOMRect[] = [];
      while (walker.nextNode() !== null) {
        const text = walker.currentNode;
        if ((text.textContent ?? "").trim().length === 0) continue;
        const range = document.createRange();
        range.selectNodeContents(text);
        rects.push(range.getBoundingClientRect());
      }
      if (rects.length === 0) return node.getBoundingClientRect();
      const left = Math.min(...rects.map((rect) => rect.left));
      const top = Math.min(...rects.map((rect) => rect.top));
      const right = Math.max(...rects.map((rect) => rect.right));
      const bottom = Math.max(...rects.map((rect) => rect.bottom));
      return new DOMRect(left, top, right - left, bottom - top);
    };
    const temporaryFactorInk = inkRect(
      '[data-kp-editor-equation-source] [data-kp-motion-id$=".factored.factor"]'
    );
    const temporaryTermInk = inkRect(
      '[data-kp-editor-equation-source] [data-kp-motion-id$=".factored.left-term"]'
    );
    const nativeFactorInk = inkRect(
      '[data-kp-editor-equation-target] [data-kp-motion-id$=".expanded.left-factor"]'
    );
    const nativeTermInk = inkRect(
      '[data-kp-editor-equation-target] [data-kp-motion-id$=".expanded.left-term"]'
    );
    const temporaryOperatorInk = inkRect(
      '[data-kp-editor-equation-source] [data-kp-motion-id$=".factored.plus"]'
    );
    const nativeOperatorInk = inkRect(
      '[data-kp-editor-equation-target] [data-kp-motion-id$=".expanded.plus"]'
    );
    const activeOperatorInk = activeOperatorOwner === "target"
      ? nativeOperatorInk
      : temporaryOperatorInk;
    const nativeOperatorCenter = {
      x: nativeOperatorInk.left + nativeOperatorInk.width / 2,
      y: nativeOperatorInk.top + nativeOperatorInk.height / 2
    };
    const temporaryPx = temporaryTerm.left - temporaryFactor.right;
    const nativePx = nativeTerm.left - nativeFactor.right;
    const targetOpacity = Number(getComputedStyle(
      element.querySelector<HTMLElement>(
        '[data-kp-editor-equation-target] [data-kp-motion-id$=".expanded.left-factor"]'
      )!
    ).opacity);
    const activeOwner = targetOpacity >= 0.5 ? "target" : "source";
    const activeGapPx = activeOwner === "target" ? nativePx : temporaryPx;
    const temporaryInkGapPx =
      temporaryTermInk.left - temporaryFactorInk.right;
    const nativeInkGapPx = nativeTermInk.left - nativeFactorInk.right;
    return {
      temporaryPx,
      nativePx,
      residualPx: temporaryPx - nativePx,
      temporaryFactorWidthPx: temporaryFactor.width,
      nativeFactorWidthPx: nativeFactor.width,
      temporaryTermWidthPx: temporaryTerm.width,
      nativeTermWidthPx: nativeTerm.width,
      temporaryInkGapPx,
      nativeInkGapPx,
      inkResidualPx: temporaryInkGapPx - nativeInkGapPx,
      temporaryTermFontSizePx: Number.parseFloat(
        getComputedStyle(element.querySelector<HTMLElement>(
          '[data-kp-editor-equation-source] [data-kp-motion-id$=".factored.left-term"]'
        )!).fontSize
      ),
      nativeTermFontSizePx: Number.parseFloat(
        getComputedStyle(element.querySelector<HTMLElement>(
          '[data-kp-editor-equation-target] [data-kp-motion-id$=".expanded.left-term"]'
        )!).fontSize
      ),
      temporaryTermText: element.querySelector<HTMLElement>(
        '[data-kp-editor-equation-source] [data-kp-motion-id$=".factored.left-term"]'
      )!.textContent ?? "",
      nativeTermText: element.querySelector<HTMLElement>(
        '[data-kp-editor-equation-target] [data-kp-motion-id$=".expanded.left-term"]'
      )!.textContent ?? "",
      activeOwner,
      activeGapPx,
      activeResidualPx: activeGapPx - nativePx,
      operatorOpacityTotal:
        temporaryOperatorOpacity + nativeOperatorOpacity,
      operatorOverlapOpacity: Math.min(
        temporaryOperatorOpacity,
        nativeOperatorOpacity
      ),
      activeOperatorOwner,
      activeOperatorResidualPx: Math.hypot(
        activeOperatorInk.left +
          activeOperatorInk.width / 2 -
          nativeOperatorCenter.x,
        activeOperatorInk.top +
          activeOperatorInk.height / 2 -
          nativeOperatorCenter.y
      ),
      activeOperatorSizeResidualPx: Math.hypot(
        activeOperatorInk.width - nativeOperatorInk.width,
        activeOperatorInk.height - nativeOperatorInk.height
      )
    };
  });
}
