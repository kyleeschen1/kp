import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  evaluateKpDiscretePresentationHandoff,
  type KpPresentationHandoffSample
} from "../src/animation/presentation-group-continuity.ts";
import { createKpPresentationContinuityVisualPlan } from
  "../src/editor/presentation-continuity-visual-plan.ts";
import type {
  KpRadicalWebglSourceInkComparison
} from "../src/rendering/radical-webgl-morph.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

interface DistributionHandoffObservation
  extends KpPresentationHandoffSample {
  readonly id: "left-term" | "right-term" | "operator";
  readonly activeOwner: "source" | "target";
  readonly overlapOpacity: number;
  readonly vacancyOpacity: number;
}

interface DistributionGapMeasurement {
  readonly temporaryPx: number;
  readonly nativePx: number;
  readonly residualPx: number;
  readonly temporaryFactorWidthPx: number;
  readonly nativeFactorWidthPx: number;
  readonly temporaryTermWidthPx: number;
  readonly nativeTermWidthPx: number;
  readonly temporaryInkGapPx: number;
  readonly nativeInkGapPx: number;
  readonly inkResidualPx: number;
  readonly temporaryTermFontSizePx: number;
  readonly nativeTermFontSizePx: number;
  readonly temporaryTermText: string;
  readonly nativeTermText: string;
  readonly activeOwner: "source" | "target";
  readonly activeGapPx: number;
  readonly activeResidualPx: number;
  readonly handoffs: readonly DistributionHandoffObservation[];
}

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
  distributionGap?: DistributionGapMeasurement | undefined;
  radicalSourceInk?: KpRadicalWebglSourceInkComparison | undefined;
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
    const radicalSourceInk =
      visualCase.family === "radical" &&
      visualCase.surface === "workbench-card"
      ? await measureRadicalSourceInk(stage)
      : undefined;
    captures.push({
      id: visualCase.id,
      family: visualCase.family,
      surface: visualCase.surface,
      animationId: visualCase.animationId,
      progress: visualCase.progress,
      viewport: visualCase.viewport,
      ...(distributionGap === undefined ? {} : { distributionGap }),
      ...(radicalSourceInk === undefined ? {} : { radicalSourceInk }),
      screenshot: path.relative(process.cwd(), screenshotPath),
      sha256: firstHash
    });
  }
  enforceDistributionHandoffContinuity(captures);
  const manifestPath = path.join(outputRoot, "manifest.json");
  const contactSheetPath = path.join(
    outputRoot,
    "distribution-contact-sheet.html"
  );
  await writeFile(contactSheetPath, distributionContactSheet(captures), "utf8");
  await writeFile(manifestPath, `${JSON.stringify({
    schemaVersion: "kp.presentation-continuity-visual.v2",
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

async function measureRadicalSourceInk(
  stage: import("playwright").Locator
): Promise<KpRadicalWebglSourceInkComparison> {
  return stage.evaluate(async (element) => {
    if (!(element instanceof HTMLElement)) {
      throw new Error("Radical stage must be an HTML element.");
    }
    const moduleUrl = "/src/rendering/radical-webgl-morph.ts";
    const module = await import(moduleUrl) as {
      measureKpRadicalWebglSourceInk(
        stage: HTMLElement
      ): KpRadicalWebglSourceInkComparison | undefined;
    };
    const comparison = module.measureKpRadicalWebglSourceInk(element);
    if (comparison === undefined) {
      throw new Error(
        "Could not compare actual WebGL fraction ink with live native KaTeX."
      );
    }
    return comparison;
  });
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
): Promise<DistributionGapMeasurement> {
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
    const handoffObservation = (
      id: "left-term" | "right-term" | "operator",
      sourceSelector: string,
      targetSelector: string
    ) => {
      const source = element.querySelector<HTMLElement>(sourceSelector);
      const target = element.querySelector<HTMLElement>(targetSelector);
      if (source === null || target === null) {
        throw new Error(`Missing distribution ${id} handoff probe.`);
      }
      const movingOpacity = Number(getComputedStyle(source).opacity);
      const nativeOpacity = Number(getComputedStyle(target).opacity);
      const activeOwner: "source" | "target" =
        nativeOpacity >= 0.5 ? "target" : "source";
      const movingInk = inkRect(sourceSelector);
      const nativeInk = inkRect(targetSelector);
      const activeInk = activeOwner === "target" ? nativeInk : movingInk;
      const center = (rect: DOMRect) => ({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
      const activeCenter = center(activeInk);
      const nativeCenter = center(nativeInk);
      return {
        id,
        progress: 0,
        movingOpacity,
        nativeOpacity,
        activeOwner,
        overlapOpacity: Math.min(movingOpacity, nativeOpacity),
        vacancyOpacity: 1 - Math.max(movingOpacity, nativeOpacity),
        positionResidualPx: Math.hypot(
          activeCenter.x - nativeCenter.x,
          activeCenter.y - nativeCenter.y
        ),
        sizeResidualPx: Math.hypot(
          activeInk.width - nativeInk.width,
          activeInk.height - nativeInk.height
        ),
        // Deterministic seek captures are settled before measurement.
        relativeVelocityPxPerProgress: 0
      };
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
      handoffs: [
        handoffObservation(
          "left-term",
          '[data-kp-editor-equation-source] [data-kp-motion-id$=".factored.left-term"]',
          '[data-kp-editor-equation-target] [data-kp-motion-id$=".expanded.left-term"]'
        ),
        handoffObservation(
          "right-term",
          '[data-kp-editor-equation-source] [data-kp-motion-id$=".factored.right-term"]',
          '[data-kp-editor-equation-target] [data-kp-motion-id$=".expanded.right-term"]'
        ),
        handoffObservation(
          "operator",
          '[data-kp-editor-equation-source] [data-kp-motion-id$=".factored.plus"]',
          '[data-kp-editor-equation-target] [data-kp-motion-id$=".expanded.plus"]'
        )
      ]
    };
  });
}

function enforceDistributionHandoffContinuity(
  records: readonly {
    id: string;
    family: string;
    surface: "workbench-card" | "lesson";
    progress: number;
    viewport: { width: number; height: number };
    distributionGap?: DistributionGapMeasurement | undefined;
  }[]
): void {
  const workbenchRecords = records.filter((record) =>
    record.family === "distribution" &&
    record.surface === "workbench-card" &&
    record.distributionGap !== undefined
  );
  const viewportKeys = new Set(workbenchRecords.map((record) =>
    `${record.viewport.width}x${record.viewport.height}`
  ));
  for (const viewportKey of viewportKeys) {
    const viewportRecords = workbenchRecords.filter((record) =>
      `${record.viewport.width}x${record.viewport.height}` === viewportKey
    );
    for (const handoffId of ["left-term", "right-term", "operator"] as const) {
      const samples = viewportRecords.flatMap((record) => {
        const observation = record.distributionGap?.handoffs.find(
          (handoff) => handoff.id === handoffId
        );
        return observation === undefined
          ? []
          : [{ ...observation, progress: record.progress }];
      });
      const issues = evaluateKpDiscretePresentationHandoff({
        contract: {
          id: `distribution.${viewportKey}.${handoffId}`,
          kind: "presentation-handoff",
          semanticEntityIds: [`distribution.${handoffId}`],
          movingOwnerId: `distribution.${handoffId}.moving`,
          nativeOwnerId: `distribution.${handoffId}.native`,
          mode: "discrete-at-equivalence"
        },
        samples
      });
      if (issues.length > 0) {
        throw new Error(
          `Distribution ${handoffId} handoff failed at ${viewportKey}: ` +
          issues.map((issue) => `${issue.kind} (${issue.residual})`).join(", ")
        );
      }
    }
  }
}
