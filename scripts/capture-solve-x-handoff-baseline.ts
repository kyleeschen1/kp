import { chromium, type Page } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const outputDirectory = "tmp/codex/solve-x-handoff-baseline";
const outputPath = `${outputDirectory}/samples.json`;
const route = "http://127.0.0.1:8000/reader/solve-x/";

// These samples bracket each 8% native/material seam without conflating the
// fade with the expressive motion in the middle of a transformation.
const progressSamples = [
  0, 1, 10, 20, 26, 27,
  306, 307, 313, 323, 332, 333,
  334, 343, 353, 359, 360,
  640, 647, 657, 666, 667,
  668, 677, 687, 693, 694,
  973, 974, 980, 990, 999, 1_000
] as const;

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const samples = [];
for (const progress of progressSamples) {
  await page.goto(
    `${route}?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=${progress}`
  );
  await page.locator("[data-kp-reader-equation-stage]").waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });
  samples.push(await sampleFrame(page, progress));
}
await browser.close();
await writeFile(outputPath, `${JSON.stringify(samples, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ output: outputPath, samples: samples.length }, null, 2)}\n`);

async function sampleFrame(page: Page, requestedProgress: number): Promise<unknown> {
  return page.evaluate((progress) => {
    const rect = (element: Element): Record<string, number> => {
      const box = element.getBoundingClientRect();
      return {
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height
      };
    };
    const stage = document.querySelector<HTMLElement>("[data-kp-reader-equation-stage]");
    const active = document.querySelector<HTMLElement>("[data-kp-reader-transition-active=true]");
    if (stage === null || active === null) throw new Error("Solve-x frame is not ready");
    const material = [...document.querySelectorAll<HTMLElement>(
      "[data-kp-reader-equation-material-owner-id]"
    )].map((element) => ({
      id: element.dataset["kpReaderEquationMaterialOwnerId"],
      opacity: Number(getComputedStyle(element).opacity),
      rect: rect(element)
    }));
    const native = [...active.querySelectorAll<HTMLElement>(
      "[data-kp-reader-equation-anchor-id]"
    )].map((element) => ({
      id: element.dataset["kpReaderEquationAnchorId"],
      opacity: Number(getComputedStyle(element).opacity),
      rect: rect(element)
    }));
    return {
      requestedProgress: progress,
      renderedProgress: Number(document.body.dataset["kpReaderProgress"]),
      transitionId: document.body.dataset["kpReaderTransition"],
      playbackDirection: document.body.dataset["kpReaderPlaybackDirection"],
      endpoint: stage.dataset["kpReaderNativeEndpoint"],
      material,
      native
    };
  }, requestedProgress);
}
