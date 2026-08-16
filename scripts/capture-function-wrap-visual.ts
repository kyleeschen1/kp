import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const animationId = "animation.generated.function-wrap.apply-f";
const configuredBaseUrl = process.env["KP_VISUAL_BASE_URL"];
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
const harness = createKpVisualReviewHarness(
  configuredBaseUrl === undefined ? {} : { baseUrl: configuredBaseUrl }
);
const page = await harness.page({
  viewport: { width: 1280, height: 900 },
  colorScheme: "dark"
});

try {
  const url = new URL("/", harness.baseUrl);
  url.searchParams.set("artifact", animationId);
  await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => document.fonts.ready);

  const player = page.locator(
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-editor-equation-stage]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  await player.waitFor();
  await stage.waitFor();
  await scrubber.waitFor();
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

  // Seeking backward is the portable rewind contract; compact hosts need not
  // project the optional transport button used by the full workbench.
  await scrubber.fill("0.5");
  if (
    await stage.getAttribute("data-kp-function-wrap-visual-identity") !==
    "stable"
  ) {
    throw new Error("Function-wrap rewind replaced the measured stage.");
  }
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
      animationId,
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
  await harness.close();
}

async function nextPaint(page: import("playwright").Page): Promise<void> {
  await page.evaluate(() =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
  );
}
