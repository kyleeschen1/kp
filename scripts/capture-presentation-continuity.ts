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
  animationId: string;
  progress: number;
  viewport: { width: number; height: number };
  distributionGap?: {
    temporaryPx: number;
    nativePx: number;
    residualPx: number;
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
    const url = new URL("/", harness.baseUrl);
    url.searchParams.set("view", "animation-workbench");
    url.searchParams.set("q", visualCase.query);
    url.searchParams.set("workbenchAnimation", visualCase.animationId);
    await page.goto(url.toString(), { waitUntil: "networkidle" });
    await page.evaluate(async () => document.fonts.ready);
    const player = page.locator("[data-kp-editor-animation-player]");
    await player.waitFor();
    await page.waitForFunction((animationId) =>
      document.querySelector<HTMLElement>(
        "[data-kp-editor-animation-player]"
      )?.dataset["kpEditorAnimationId"] === animationId,
      visualCase.animationId
    );
    const pause = player.locator('[data-action="pause-editor-animation"]');
    if (await pause.isEnabled()) await pause.click();
    await player.locator('[data-action="seek-editor-animation"]')
      .fill(String(visualCase.progress));
    await settle(page);
    const stage = player.locator("[data-kp-editor-equation-stage]");
    await stage.waitFor();
    const first = await stage.screenshot({ animations: "disabled" });
    await settle(page);
    const second = await stage.screenshot({ animations: "disabled" });
    const firstHash = sha256(first);
    if (firstHash !== sha256(second)) {
      throw new Error(`${visualCase.id} did not produce a stable capture.`);
    }
    const screenshotPath = path.join(outputRoot, `${visualCase.id}.png`);
    await writeFile(screenshotPath, first);
    const distributionGap = visualCase.family === "distribution"
      ? await measureDistributionGap(stage)
      : undefined;
    captures.push({
      id: visualCase.id,
      family: visualCase.family,
      animationId: visualCase.animationId,
      progress: visualCase.progress,
      viewport: visualCase.viewport,
      ...(distributionGap === undefined ? {} : { distributionGap }),
      screenshot: path.relative(process.cwd(), screenshotPath),
      sha256: firstHash
    });
  }
  const manifestPath = path.join(outputRoot, "manifest.json");
  await writeFile(manifestPath, `${JSON.stringify({
    schemaVersion: "kp.presentation-continuity-visual.v1",
    captures
  }, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    manifest: path.relative(process.cwd(), manifestPath),
    captures: captures.length
  }, null, 2));
} finally {
  await harness.close();
}

async function settle(page: import("playwright").Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  ));
}

function sha256(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

async function measureDistributionGap(
  stage: import("playwright").Locator
): Promise<{ temporaryPx: number; nativePx: number; residualPx: number }> {
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
    const temporaryPx = temporaryTerm.left - temporaryFactor.right;
    const nativePx = nativeTerm.left - nativeFactor.right;
    return {
      temporaryPx,
      nativePx,
      residualPx: temporaryPx - nativePx
    };
  });
}
