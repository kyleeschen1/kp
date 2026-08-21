import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Locator, Page } from "playwright";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const animationId = "animation.algebra.radical.solve-x-squared-nine";
const outputRoot = path.resolve("tmp/codex/even-root-checkpoint");
const desktopViewport = { width: 1_240, height: 760 } as const;
const narrowViewport = { width: 390, height: 760 } as const;

const checkpoints = Object.freeze([
  point("source", "source · powered equation", 0, desktopViewport),
  point("inverse-early", "inverse power · transfer begins", 0.12, desktopViewport),
  point("inverse-mid", "inverse power · exponent travels", 0.3, desktopViewport),
  point("inverse-late", "inverse power · root forms", 0.48, desktopViewport),
  point("radical", "semantic seam · both real branches", 0.58, desktopViewport),
  point("evaluate-early", "root evaluation · compression begins", 0.66, desktopViewport),
  point("evaluate-knot", "root evaluation · ink knot", 0.79, desktopViewport),
  point("evaluate-late", "root evaluation · result expands", 0.91, desktopViewport),
  point("target", "target · two real solutions", 1, desktopViewport),
  point("rewind-radical", "rewind · radical state", 0.58, desktopViewport),
  point("rewind-source", "rewind · powered equation", 0, desktopViewport),
  point("narrow-radical", "narrow · radical state", 0.58, narrowViewport),
  point("narrow-target", "narrow · target", 1, narrowViewport)
]);

async function capture(): Promise<void> {
  await mkdir(outputRoot, { recursive: true });
  const harness = createKpVisualReviewHarness();
  const evidence: object[] = [];
  const items: KpVisualContactSheetItem[] = [];
  const pageErrors: string[] = [];
  try {
    const page = await harness.page({
      viewport: desktopViewport,
      colorScheme: "dark"
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await openExemplar(page, harness.baseUrl);
    await waitForReady(stageFor(page));
    await assertExecutableMotion(stageFor(page));

    let activeViewport:
      typeof desktopViewport | typeof narrowViewport = desktopViewport;
    for (const checkpoint of checkpoints) {
      if (checkpoint.viewport !== activeViewport) {
        activeViewport = checkpoint.viewport;
        await resizeAndWaitForReplacement(
          page,
          stageFor(page),
          activeViewport
        );
      }
      const stage = stageFor(page);
      await seekFor(page).fill(String(checkpoint.progress));
      await waitForProgress(stage, checkpoint.progress);
      await settle(stage);
      const file = path.join(outputRoot, `${checkpoint.id}.png`);
      await stage.screenshot({ path: file, animations: "disabled" });
      const state = await readCheckpointState(stage);
      const relativeFile = path.relative(process.cwd(), file);
      evidence.push({
        checkpointId: checkpoint.id,
        progress: checkpoint.progress,
        viewport: checkpoint.viewport,
        ...state,
        file: relativeFile
      });
      const image = await readFile(file);
      items.push({
        id: checkpoint.id,
        label: checkpoint.label,
        progress: checkpoint.progress,
        viewport: checkpoint.viewport,
        file: relativeFile,
        dataUrl: `data:image/png;base64,${image.toString("base64")}`
      });
    }

    if (pageErrors.length > 0) {
      throw new Error(`Even-root page errors: ${pageErrors.join(" | ")}`);
    }
    const htmlSource = buildKpVisualContactSheetHtml(items, {
      title: "Even-root inverse and evaluation · human checkpoint",
      columns: 2,
      imageFit: "contain",
      imageHeightPx: 250
    });
    const sheetPage = await harness.page({
      viewport: { width: 1_440, height: 1_000 }
    });
    await sheetPage.setContent(htmlSource, { waitUntil: "load" });
    const sheet = path.join(outputRoot, "contact-sheet.png");
    await sheetPage.screenshot({
      path: sheet,
      fullPage: true,
      animations: "disabled"
    });
    const html = path.join(outputRoot, "index.html");
    await writeFile(html, htmlSource, "utf8");
    const manifest = path.join(outputRoot, "manifest.json");
    await writeFile(manifest, `${JSON.stringify({
      schemaVersion: "kp.even-root-human-checkpoint.v1",
      animationId,
      url: `/?artifact=${animationId}`,
      checkpoints: evidence,
      pageErrors,
      sheet: path.relative(process.cwd(), sheet),
      html: path.relative(process.cwd(), html)
    }, null, 2)}\n`, "utf8");
    console.log(`even-root checkpoint: ${path.relative(process.cwd(), sheet)}`);
    console.log(`review sheet: ${path.relative(process.cwd(), html)}`);
    console.log(`manifest: ${path.relative(process.cwd(), manifest)}`);
  } finally {
    await harness.close();
  }
}

function point(
  id: string,
  label: string,
  progress: number,
  viewport: typeof desktopViewport | typeof narrowViewport
) {
  return Object.freeze({ id, label, progress, viewport });
}

async function openExemplar(page: Page, baseUrl: string): Promise<void> {
  const url = new URL("/", baseUrl);
  url.searchParams.set("artifact", animationId);
  await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
}

function stageFor(page: Page): Locator {
  return page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-id="${animationId}"] ` +
    "[data-kp-even-root-stage]"
  );
}

function seekFor(page: Page): Locator {
  return page.locator(
    `[data-kp-editor-animation-id="${animationId}"] ` +
    '[data-action="seek-editor-animation"]'
  );
}

async function waitForReady(stage: Locator): Promise<void> {
  await stage.waitFor();
  await stage.evaluate((root) => new Promise<void>((resolve, reject) => {
    const state = (): string | undefined => root.dataset["kpEvenRootStage"];
    if (state() === "ready") return resolve();
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error(
        root.dataset["kpEvenRootError"] ??
        "Timed out preparing even-root checkpoint stage."
      ));
    }, 8_000);
    const observer = new MutationObserver(() => {
      if (state() === "preparing") return;
      window.clearTimeout(timeout);
      observer.disconnect();
      if (state() === "ready") resolve();
      else reject(new Error(
        root.dataset["kpEvenRootError"] ?? "Even-root stage failed."
      ));
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-kp-even-root-stage"]
    });
  }));
}

async function assertExecutableMotion(stage: Locator): Promise<void> {
  const evidence = await stage.evaluate((root) => ({
    transitionCount: Number(root.dataset["kpEvenRootExecutableTransitions"]),
    dynamicTrackCounts: JSON.parse(
      root.dataset["kpEvenRootDynamicTrackCounts"] ?? "[]"
    ) as number[]
  }));
  if (evidence.transitionCount !== 2 ||
      evidence.dynamicTrackCounts.length !== 2 ||
      evidence.dynamicTrackCounts.some((count) => count <= 0)) {
    throw new Error(
      `Even-root stage lacks executable motion evidence: ${JSON.stringify(evidence)}`
    );
  }
}

async function waitForProgress(stage: Locator, progress: number): Promise<void> {
  await stage.evaluate((root, expected) => new Promise<void>((resolve) => {
    const ready = (): boolean => Number(root.dataset["kpEvenRootProgress"]) === expected;
    if (ready()) return resolve();
    const observer = new MutationObserver(() => {
      if (!ready()) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(root, { attributes: true });
  }), progress);
}

async function settle(stage: Locator): Promise<void> {
  await stage.evaluate(async (root) => {
    await root.ownerDocument.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });
}

async function readCheckpointState(stage: Locator): Promise<object> {
  return stage.evaluate((root) => {
    const active = root.querySelector<HTMLElement>(
      '[data-kp-even-root-endpoint][aria-hidden="false"]'
    );
    return {
      transition: root.dataset["kpEvenRootTransition"] ?? null,
      transitionProgress: Number(
        root.dataset["kpEvenRootTransitionProgress"]
      ),
      activeLatex: active?.dataset["kpEvenRootLatex"] ?? null,
      materialOwners: [...root.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )].map((owner) => ({
        semanticEntityId:
          owner.dataset["kpEquationMaterialSemanticEntityId"] ?? null,
        fragmentRole: owner.dataset["kpEquationMaterialFragmentRole"] ?? null,
        opacity: Number(getComputedStyle(owner).opacity),
        visibility: getComputedStyle(owner).visibility,
        svgCount: owner.querySelectorAll("svg").length,
        text: owner.textContent?.trim() ?? ""
      })),
      dynamicTrackCounts: JSON.parse(
        root.dataset["kpEvenRootDynamicTrackCounts"] ?? "[]"
      ) as number[]
    };
  });
}

async function resizeAndWaitForReplacement(
  page: Page,
  stage: Locator,
  viewport: typeof desktopViewport | typeof narrowViewport
): Promise<void> {
  const priorRevision = await stage.getAttribute(
    "data-kp-even-root-measurement-revision"
  );
  await page.setViewportSize(viewport);
  await stage.evaluate((root, previous) => new Promise<void>((resolve, reject) => {
    const replaced = (): boolean =>
      root.dataset["kpEvenRootStage"] === "ready" &&
      root.dataset["kpEvenRootMeasurementRevision"] !== previous;
    if (replaced()) return resolve();
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error("Timed out replacing measured even-root paint."));
    }, 8_000);
    const observer = new MutationObserver(() => {
      if (!replaced()) return;
      window.clearTimeout(timeout);
      observer.disconnect();
      resolve();
    });
    observer.observe(root, { attributes: true });
  }), priorRevision);
}

await capture();
