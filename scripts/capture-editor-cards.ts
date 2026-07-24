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
  const distributionDescriptorId =
    "editor-animation.sample.animation.distribution.expand-a-sum";
  const distributionUrl = new URL(baseUrl);
  distributionUrl.searchParams.set("animation", distributionDescriptorId);
  await page.goto(distributionUrl.href, { waitUntil: "networkidle" });
  const distributionPlayer = page.locator(
    "[data-kp-editor-animation-player]"
  );
  await distributionPlayer.waitFor();
  await page.waitForFunction(() =>
    document.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]"
    )?.dataset["kpEditorAnimationHydrated"] === "true"
  );
  const distributionScrubber = distributionPlayer.locator(
    '[data-action="seek-editor-animation"]'
  );
  const distributionSourceFactor = distributionPlayer.locator(
    '[data-kp-editor-equation-source] [data-kp-motion-id$=".factored.factor"]'
  );
  const distributionFrames = [
    ["source", "0"],
    ["before-former-seam", "0.359"],
    ["after-former-seam", "0.36"],
    ["follower-peel", "0.7"],
    ["settled", "1"]
  ] as const;
  const distributionGeometry: Array<{
    readonly id: string;
    readonly progress: number;
    readonly sourceFactor: {
      readonly x: number;
      readonly y: number;
      readonly opacity: number;
    };
  }> = [];
  for (const [id, progress] of distributionFrames) {
    await distributionScrubber.fill(progress);
    await page.evaluate(async () => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );
    });
    distributionGeometry.push({
      id,
      progress: Number(progress),
      sourceFactor: await distributionSourceFactor.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          opacity: Number(getComputedStyle(element).opacity)
        };
      })
    });
    await distributionPlayer.screenshot({
      path: path.join(outputRoot, `distribution-${id}.png`)
    });
  }
  const before = distributionGeometry[1]!.sourceFactor;
  const after = distributionGeometry[2]!.sourceFactor;
  const formerSeamDeltaPx = Math.hypot(
    after.x - before.x,
    after.y - before.y
  );
  if (
    formerSeamDeltaPx >= 1 ||
    Math.abs(after.opacity - before.opacity) >= 0.01
  ) {
    throw new Error(
      `Distribution former seam is discontinuous: ${formerSeamDeltaPx}px.`
    );
  }
  await writeFile(
    path.join(outputRoot, "manifest.json"),
    `${JSON.stringify({ schemaVersion: "kp.editor-card-visual.v1", baseUrl, viewport, order,
      captures: [
        ...captures.map(({ id }) => `${id}.png`),
        ...distributionFrames.map(([id]) => `distribution-${id}.png`)
      ],
      distribution: {
        descriptorId: distributionDescriptorId,
        choreographyId:
          "choreography.lesson.distribution-area.algebra-and-area",
        formerSeamDeltaPx,
        geometry: distributionGeometry
      } }, null, 2)}\n`,
    "utf8"
  );
  console.log(
    `captured ${captures.length + distributionFrames.length} editor card states in ${outputRoot}`
  );
} finally {
  await browser.close();
}
