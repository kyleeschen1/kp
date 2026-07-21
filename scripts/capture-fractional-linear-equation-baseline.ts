import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Page } from "playwright";

import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const outputRoot = path.resolve(
  process.env["KP_FRACTIONAL_LINEAR_BASELINE_OUTPUT"]
    ?? "tmp/codex/fractional-linear-equation-baseline"
);
const explicitBaseUrl = process.env["KP_VISUAL_BASE_URL"];
const harness = createKpVisualReviewHarness(
  explicitBaseUrl === undefined ? {} : { baseUrl: explicitBaseUrl }
);

await mkdir(outputRoot, { recursive: true });

try {
  const page = await harness.page({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "no-preference"
  });
  const fraction = await captureFractionReference(page);
  const linear = await captureLinearReference(page);
  const baseline = {
    schemaVersion: "kp.fractional-linear-equation-baseline.v1",
    capturedAt: new Date().toISOString(),
    references: { fraction, linear }
  } as const;
  await writeFile(
    path.join(outputRoot, "baseline.json"),
    `${JSON.stringify(baseline, null, 2)}\n`,
    "utf8"
  );
  process.stdout.write(`${JSON.stringify({
    output: path.relative(process.cwd(), path.join(outputRoot, "baseline.json")),
    fractionSamples: fraction.samples.length,
    linearSamples: linear.samples.length
  }, null, 2)}\n`);
} finally {
  await harness.close();
}

async function captureFractionReference(page: Page): Promise<{
  readonly route: string;
  readonly samples: readonly unknown[];
}> {
  const route = "/?animation=editor-animation.sample.animation.fraction-simplification.basic";
  await page.goto(harness.url(route), { waitUntil: "networkidle" });
  const player = page.locator("[data-kp-editor-animation-player]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  await player.waitFor();
  await settle(page);
  const samples = [];
  for (const progress of [0, 0.08, 0.5, 0.86, 1] as const) {
    await scrubber.fill(String(progress));
    await settle(page);
    samples.push(await sampleEquationSurface(page, progress));
    await player.screenshot({
      path: path.join(outputRoot, `fraction-${String(progress).replace(".", "-")}.png`)
    });
  }
  return { route, samples };
}

async function captureLinearReference(page: Page): Promise<{
  readonly route: string;
  readonly samples: readonly unknown[];
}> {
  const route = "/reader/solve-x/";
  const samples = [];
  for (const progress of [0, 500, 1_000] as const) {
    const url = new URL(route, harness.baseUrl);
    url.searchParams.set("kpLesson", "lesson.solve-x.x-plus-3");
    url.searchParams.set("kpVersion", "1");
    url.searchParams.set("kpProgress", String(progress));
    await page.goto(url.toString(), { waitUntil: "networkidle" });
    const stage = page.locator("[data-kp-reader-equation-stage]");
    await stage.waitFor();
    await settle(page);
    samples.push(await sampleEquationSurface(page, progress));
    await stage.screenshot({
      path: path.join(outputRoot, `linear-${String(progress).padStart(4, "0")}.png`)
    });
  }
  return { route, samples };
}

async function sampleEquationSurface(page: Page, requestedProgress: number): Promise<unknown> {
  return page.evaluate((progress) => {
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player], [data-kp-reader-equation-stage]"
    );
    if (stage === null) throw new Error("Equation surface is unavailable");
    const stageRect = stage.getBoundingClientRect();
    const katex = [...stage.querySelectorAll<HTMLElement>(".katex")];
    const motion = [...stage.querySelectorAll<HTMLElement>("[data-kp-motion-id]")];
    return {
      requestedProgress: progress,
      renderedProgress: document.body.dataset["kpReaderProgress"]
        ?? stage.dataset["kpEditorAnimationProgress"]
        ?? null,
      transitionId: document.body.dataset["kpReaderTransition"]
        ?? stage.querySelector<HTMLElement>("[data-kp-editor-equation-transition-id]")
          ?.dataset["kpEditorEquationTransitionId"]
        ?? null,
      stage: {
        width: stageRect.width,
        height: stageRect.height,
        scrollWidth: stage.scrollWidth,
        scrollHeight: stage.scrollHeight
      },
      katex: katex.map((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          text: element.textContent?.trim() ?? "",
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          width: rect.width,
          height: rect.height
        };
      }),
      motionOwnerCount: motion.length,
      fractionRuleCount: stage.querySelectorAll(".frac-line").length
    };
  }, requestedProgress);
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });
}
