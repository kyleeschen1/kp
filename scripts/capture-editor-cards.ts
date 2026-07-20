import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseUrl = process.env["KP_VISUAL_BASE_URL"] ?? "http://127.0.0.1:8000";
const outputRoot = path.resolve(
  process.env["KP_VISUAL_OUTPUT"] ?? "tmp/codex/editor-cards"
);
const viewport = { width: 1440, height: 1000 } as const;

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport });

try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const column = page.locator(".preview-stage");
  const experiences = page.locator("[data-kp-learner-experience-library]");
  const graph = page.locator('.preview-stage > [data-kp-type="graph-3d"]').first();
  const ftc = page.locator("[data-kp-ftc-editor-launcher]");
  await experiences.waitFor();
  await graph.waitFor();
  await ftc.waitFor();
  await graph.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const shell = document.querySelector<HTMLElement>(
      '.preview-stage > [data-kp-type="graph-3d"] [data-kp-webgl-status]'
    );
    return shell?.dataset["kpWebglStatus"] === "ready" ||
      shell?.dataset["kpWebglStatus"] === "fallback";
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });

  const order = await column.locator(":scope > *").evaluateAll((cards) => cards.map((card) => {
    const element = card as HTMLElement;
    if (element.dataset["kpLearnerExperienceLibrary"] !== undefined) return "learner-experiences";
    if (element.dataset["kpEditorAnimationLibrary"] !== undefined) return "animation-library";
    if (element.dataset["kpType"] === "graph-3d") return "graph-3d";
    if (element.dataset["kpEquationMotionDemo"] !== undefined) return "equation-motion";
    if (element.dataset["kpFtcEditorLauncher"] !== undefined) return "ftc";
    return element.dataset["kpObject"] ?? element.tagName.toLowerCase();
  }));
  if (order[0] !== "learner-experiences" || order[1] !== "animation-library" ||
    order[2] !== "graph-3d" || order.at(-1) !== "ftc") {
    throw new Error(`Unexpected editor card order: ${order.join(", ")}`);
  }

  const captures = [
    { id: "editor-card-first-learner-experiences", locator: experiences },
    { id: "editor-card-third-graph-3d", locator: graph },
    { id: "editor-card-last-ftc", locator: ftc },
    { id: "editor-card-column", locator: column }
  ] as const;
  for (const capture of captures) {
    await capture.locator.screenshot({ path: path.join(outputRoot, `${capture.id}.png`) });
  }
  await writeFile(
    path.join(outputRoot, "manifest.json"),
    `${JSON.stringify({ schemaVersion: "kp.editor-card-visual.v1", baseUrl, viewport, order,
      captures: captures.map(({ id }) => `${id}.png`) }, null, 2)}\n`,
    "utf8"
  );
  console.log(`captured ${captures.length} editor card states in ${outputRoot}`);
} finally {
  await browser.close();
}
