import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseUrl = process.env["KP_VISUAL_BASE_URL"] ?? "http://127.0.0.1:8000";
const outputRoot = path.resolve(
  process.env["KP_VISUAL_OUTPUT"] ?? "tmp/codex/function-wrap-visual"
);
const checkpoints = [
  { id: "source", progress: 0 },
  { id: "focus", progress: 0.14 },
  { id: "reflow", progress: 0.35 },
  { id: "enclosure-entry", progress: 0.5 },
  { id: "function-entry", progress: 0.64 },
  { id: "recognition", progress: 0.85 },
  { id: "settled", progress: 1 }
] as const;

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(async () => document.fonts.ready);
  await page.locator('[data-action="set-editor-animation"]').selectOption(
    "editor-animation.sample.animation.function-wrap.apply-f"
  );

  const player = page.locator("[data-kp-editor-animation-player]");
  const stage = player.locator("[data-kp-editor-equation-stage]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  await player.waitFor();
  await page.waitForFunction(() =>
    document.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]"
    )?.dataset["kpEditorAnimationGestaltStatus"] === "ready"
  );
  const warnings = await player.locator(
    "[data-kp-editor-gestalt-warnings] li"
  ).allInnerTexts();
  if (warnings.length > 0) {
    throw new Error(`Function-wrap exemplar warnings: ${warnings.join("; ")}`);
  }

  await stage.evaluate((element) => {
    element.dataset["kpFunctionWrapVisualIdentity"] = "stable";
  });
  const captures: {
    id: string;
    progress: number;
    direction: "forward" | "rewind";
  }[] = [];

  for (const checkpoint of checkpoints) {
    await scrubber.fill(String(checkpoint.progress));
    await nextPaint(page);
    const id = `${checkpoint.id}.png`;
    await player.screenshot({ path: path.join(outputRoot, id) });
    captures.push({ id, progress: checkpoint.progress, direction: "forward" });
  }

  await player.getByRole("button", { name: "Rewind animation" }).click();
  if (
    await stage.getAttribute("data-kp-function-wrap-visual-identity") !==
    "stable"
  ) {
    throw new Error("Function-wrap rewind replaced the measured stage.");
  }
  await scrubber.fill("0.5");
  await nextPaint(page);
  await player.screenshot({
    path: path.join(outputRoot, "rewind-enclosure-exit.png")
  });
  captures.push({
    id: "rewind-enclosure-exit.png",
    progress: 0.5,
    direction: "rewind"
  });

  await writeFile(
    path.join(outputRoot, "manifest.json"),
    `${JSON.stringify({
      schemaVersion: "kp.function-wrap-visual-review.v1",
      baseUrl,
      captures,
      warnings
    }, null, 2)}\n`,
    "utf8"
  );
  console.log(JSON.stringify({
    outputRoot: path.relative(process.cwd(), outputRoot),
    captures: captures.length,
    warnings
  }, null, 2));
} finally {
  await browser.close();
}

async function nextPaint(page: import("playwright").Page): Promise<void> {
  await page.evaluate(() =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
  );
}
