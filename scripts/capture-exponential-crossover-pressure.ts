import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Locator, Page } from "playwright";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const outputRoot = path.resolve(
  "tmp/codex/exponential-crossover-pressure"
);
const desktopViewport = { width: 1_240, height: 760 } as const;
const narrowViewport = { width: 390, height: 760 } as const;

const callers = Object.freeze([
  {
    id: "product",
    label: "product · e^(a+b) → e^a e^b",
    animationId:
      "animation.algebra.exponential-homomorphism.sum-to-product"
  },
  {
    id: "quotient",
    label: "quotient · e^(a-b) → e^a/e^b",
    animationId:
      "animation.algebra.exponential-homomorphism.difference-to-quotient"
  }
] as const);

const checkpoints = Object.freeze([
  point("source", "source", 0, desktopViewport),
  point("resolve-019", "resolution begins", 0.19, desktopViewport),
  point("resolve-022", "anchor and followers appear", 0.22, desktopViewport),
  point("resolve-027", "connector and carrier resolve", 0.27, desktopViewport),
  point("resolved", "resolved structure", 0.3, desktopViewport),
  point("target", "native target", 1, desktopViewport),
  point("seek-073", "direct seek · 73%", 0.73, desktopViewport),
  point("seek-027", "direct seek · 27%", 0.27, desktopViewport),
  point("rewind-078", "rewind · 78%", 0.78, desktopViewport),
  point("rewind-018", "rewind · 18%", 0.18, desktopViewport),
  point("narrow-022", "narrow · resolution", 0.22, narrowViewport),
  point("narrow-target", "narrow · target", 1, narrowViewport)
]);

async function capture(): Promise<void> {
  await mkdir(outputRoot, { recursive: true });
  const harness = createKpVisualReviewHarness();
  const items: Array<KpVisualContactSheetItem & { readonly order: number }> = [];
  const evidence: object[] = [];
  try {
    const page = await harness.page({
      viewport: desktopViewport,
      colorScheme: "dark"
    });
    for (const [callerIndex, caller] of callers.entries()) {
      await page.setViewportSize(desktopViewport);
      await openCaller(page, harness.baseUrl, caller.animationId);
      await waitForReady(stageFor(page, caller.animationId));
      let activeViewport:
        typeof desktopViewport | typeof narrowViewport = desktopViewport;
      for (const [checkpointIndex, checkpoint] of checkpoints.entries()) {
        if (checkpoint.viewport !== activeViewport) {
          activeViewport = checkpoint.viewport;
          await resizeAndWaitForReplacement(
            page,
            stageFor(page, caller.animationId),
            activeViewport
          );
        }
        const stage = stageFor(page, caller.animationId);
        const seek = seekFor(page, caller.animationId);
        await seek.fill(String(checkpoint.progress));
        await waitForProgress(stage, checkpoint.progress);
        await settle(stage);
        const file = path.join(
          outputRoot,
          `${checkpoint.id}-${caller.id}.png`
        );
        await stage.screenshot({ path: file, animations: "disabled" });
        const state = await stage.evaluate((root) => {
          const active = root.querySelector<HTMLElement>(
            '.kp-exponential-homomorphism-stage__endpoint[aria-hidden="false"]'
          );
          return {
            visualOwner:
              root.dataset["kpExponentialHomomorphismVisualOwner"] ?? "",
            accessibleLatex:
              active?.dataset["kpExponentialHomomorphismLatex"] ?? null,
            visibleOwnerCount: [...root.querySelectorAll<HTMLElement>(
              "[data-kp-equation-material-owner-id]"
            )].filter((owner) => Number(getComputedStyle(owner).opacity) > 0)
              .length
          };
        });
        const relativeFile = path.relative(process.cwd(), file);
        evidence.push({
          callerId: caller.id,
          animationId: caller.animationId,
          checkpointId: checkpoint.id,
          progress: checkpoint.progress,
          viewport: checkpoint.viewport,
          ...state,
          file: relativeFile
        });
        const image = await readFile(file);
        items.push({
          id: `${checkpoint.id}-${caller.id}`,
          label: `${checkpoint.label} · ${caller.label}`,
          progress: checkpoint.progress,
          viewport: checkpoint.viewport,
          file: relativeFile,
          dataUrl: `data:image/png;base64,${image.toString("base64")}`,
          order: checkpointIndex * callers.length + callerIndex
        });
      }
    }

    items.sort((left, right) =>
      (left.order ?? 0) - (right.order ?? 0)
    );

    const htmlSource = buildKpVisualContactSheetHtml(items, {
      title: "Exponential crossover · product/quotient human checkpoint",
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
      schemaVersion: "kp.exponential-crossover-pressure-checkpoint.v1",
      callers: callers.map((caller) => ({
        ...caller,
        url: `/?artifact=${caller.animationId}`,
        tunerUrl: `/?artifact=${caller.animationId}` +
          "&tuneCrossover=1&crossoverStart=0.16&crossoverEnd=0.30"
      })),
      checkpoints: evidence,
      sheet: path.relative(process.cwd(), sheet),
      html: path.relative(process.cwd(), html)
    }, null, 2)}\n`, "utf8");
    console.log(`exponential crossover checkpoint: ${path.relative(
      process.cwd(), sheet
    )}`);
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

async function openCaller(
  page: Page,
  baseUrl: string,
  animationId: string
): Promise<void> {
  const url = new URL("/", baseUrl);
  url.searchParams.set("artifact", animationId);
  await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
}

function stageFor(page: Page, animationId: string): Locator {
  return page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-id="${animationId}"] ` +
    "[data-kp-exponential-homomorphism-stage]"
  );
}

function seekFor(page: Page, animationId: string): Locator {
  return page.locator(
    `[data-kp-editor-animation-id="${animationId}"] ` +
    '[data-action="seek-editor-animation"]'
  );
}

async function waitForProgress(stage: Locator, progress: number): Promise<void> {
  await stage.evaluate((root, expected) => new Promise<void>((resolve) => {
    const ready = (): boolean => Number(
      root.dataset["kpExponentialHomomorphismProgress"]
    ) === expected;
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

async function waitForReady(stage: Locator): Promise<void> {
  await stage.waitFor();
  await stage.evaluate((root) => new Promise<void>((resolve, reject) => {
    const state = (): string | undefined =>
      root.dataset["kpExponentialHomomorphismStage"];
    if (state() === "ready") return resolve();
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error(
        root.dataset["kpExponentialHomomorphismError"] ??
        "Timed out preparing exponential crossover stage."
      ));
    }, 8_000);
    const observer = new MutationObserver(() => {
      if (state() === "preparing") return;
      window.clearTimeout(timeout);
      observer.disconnect();
      if (state() === "ready") resolve();
      else reject(new Error(
        root.dataset["kpExponentialHomomorphismError"] ??
        "Exponential crossover stage failed."
      ));
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-kp-exponential-homomorphism-stage"]
    });
  }));
}

async function resizeAndWaitForReplacement(
  page: Page,
  stage: Locator,
  viewport: typeof desktopViewport | typeof narrowViewport
): Promise<void> {
  const priorRevision = await stage.getAttribute(
    "data-kp-exponential-homomorphism-measurement-revision"
  );
  await page.setViewportSize(viewport);
  await stage.evaluate((root, previous) => new Promise<void>((resolve, reject) => {
    const replaced = (): boolean =>
      root.dataset["kpExponentialHomomorphismStage"] === "ready" &&
      root.dataset["kpExponentialHomomorphismMeasurementRevision"] !== previous;
    if (replaced()) return resolve();
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error("Timed out replacing measured exponential paint."));
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
