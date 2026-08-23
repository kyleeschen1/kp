import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Locator, Page } from "playwright";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const outputRoot = path.resolve(
  "tmp/codex/animation-governance-v2-calibration"
);

const exemplars = Object.freeze([
  {
    id: "animation.algebra.log-product.equivalence-frame",
    label: "Log equivalence",
    stageSelector: "[data-kp-log-product-equivalence-stage]",
    checkpoints: Object.freeze([
      { id: "source", label: "source", progress: 0 },
      { id: "crossover", label: "semantic crossover", progress: 0.48 },
      { id: "target", label: "native target", progress: 1 }
    ])
  },
  {
    id: "animation.generated.calculus.derivative.power-rule-x-cubed",
    label: "Derivative evaluation",
    stageSelector: "[data-kp-editor-equation-stage]",
    checkpoints: Object.freeze([
      { id: "source", label: "source", progress: 0 },
      { id: "lineage", label: "exponent lineage", progress: 0.49 },
      { id: "target", label: "native target", progress: 1 }
    ])
  },
  {
    id: "animation.equation.finite-sum-expansion.v1",
    label: "Finite-sum typography",
    stageSelector: "[data-kp-finite-sum-stage]",
    checkpoints: Object.freeze([
      { id: "source", label: "source", progress: 0 },
      { id: "generation", label: "term generation", progress: 0.5 },
      { id: "target", label: "native target", progress: 1 }
    ])
  }
] as const);

const profiles = Object.freeze([
  {
    id: "wide-dark",
    label: "wide / dark",
    viewport: { width: 1_240, height: 760 },
    theme: "dark",
    colorScheme: "dark"
  },
  {
    id: "narrow-dark",
    label: "narrow / dark",
    viewport: { width: 390, height: 844 },
    theme: "dark",
    colorScheme: "dark"
  },
  {
    id: "wide-light",
    label: "wide / light",
    viewport: { width: 1_240, height: 760 },
    theme: "light",
    colorScheme: "light"
  },
  {
    id: "narrow-light",
    label: "narrow / light",
    viewport: { width: 390, height: 844 },
    theme: "light",
    colorScheme: "light"
  }
] as const);

interface CalibrationEvidence {
  readonly id: string;
  readonly animationId: string;
  readonly checkpointId: string;
  readonly progress: number;
  readonly profileId: string;
  readonly reviewUrl: string;
  readonly stageWidth: number;
  readonly stageHeight: number;
  readonly file: string;
}

async function capture(): Promise<void> {
  await mkdir(outputRoot, { recursive: true });
  const harness = createKpVisualReviewHarness();
  const items: KpVisualContactSheetItem[] = [];
  const evidence: CalibrationEvidence[] = [];

  try {
    for (const exemplar of exemplars) {
      for (const checkpoint of exemplar.checkpoints) {
        for (const profile of profiles) {
          const page = await harness.page({
            viewport: profile.viewport,
            colorScheme: profile.colorScheme
          });
          const reviewUrl = new URL("/", harness.baseUrl);
          reviewUrl.searchParams.set("artifact", exemplar.id);
          reviewUrl.searchParams.set("playhead", String(checkpoint.progress));
          reviewUrl.searchParams.set("theme", profile.theme);
          reviewUrl.searchParams.set("view", "animation-catalogue");
          await page.goto(reviewUrl.toString(), {
            waitUntil: "domcontentloaded"
          });

          const player = page.locator(
            `[data-kp-editor-animation-player]` +
            `[data-kp-editor-animation-id="${exemplar.id}"]`
          );
          await waitForReady(page, player, exemplar.id);
          const stage = player.locator(exemplar.stageSelector);
          await stage.waitFor({ state: "visible" });
          const scrubber = player.locator(
            '[data-action="seek-editor-animation"]'
          );
          await scrubber.fill(String(checkpoint.progress));
          await waitForProgress(page, exemplar.id, checkpoint.progress);
          await settle(stage);

          const id = [exemplar.label, checkpoint.id, profile.id]
            .join("-")
            .toLowerCase()
            .replaceAll(/[^a-z0-9-]/g, "-");
          const file = path.join(outputRoot, `${id}.png`);
          await stage.screenshot({ path: file, animations: "disabled" });
          const bounds = await stage.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
          });
          if (bounds.width <= 0 || bounds.height <= 0) {
            throw new Error(`${id} produced an empty calibration stage.`);
          }
          const image = await readFile(file);
          items.push({
            id,
            label: `${exemplar.label} · ${checkpoint.label} · ${profile.label}`,
            progress: checkpoint.progress,
            viewport: profile.viewport,
            file: path.relative(process.cwd(), file),
            dataUrl: `data:image/png;base64,${image.toString("base64")}`
          });
          evidence.push({
            id,
            animationId: exemplar.id,
            checkpointId: checkpoint.id,
            progress: checkpoint.progress,
            profileId: profile.id,
            reviewUrl: publicReviewUrl(exemplar.id, checkpoint.progress,
              profile.theme),
            stageWidth: bounds.width,
            stageHeight: bounds.height,
            file: path.relative(process.cwd(), file)
          });
        }
      }
    }

    const htmlSource = buildKpVisualContactSheetHtml(items, {
      title: "Animation governance v2 · calibration checkpoint",
      columns: profiles.length,
      imageFit: "contain",
      imageHeightPx: 260
    });
    const sheetPage = await harness.page({
      viewport: { width: 1_760, height: 1_000 },
      colorScheme: "light"
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
      schemaVersion: "kp.animation-governance-v2-calibration.v1",
      reviewStatus: "human-checkpoint",
      promotionAuthorized: false,
      exemplars: exemplars.map(({ id, label, checkpoints }) => ({
        id,
        label,
        checkpoints
      })),
      profiles,
      captures: evidence,
      sheet: path.relative(process.cwd(), sheet),
      html: path.relative(process.cwd(), html)
    }, null, 2)}\n`, "utf8");

    console.log(
      `governance calibration: ${path.relative(process.cwd(), sheet)}`
    );
    console.log(`review sheet: ${path.relative(process.cwd(), html)}`);
    console.log(`manifest: ${path.relative(process.cwd(), manifest)}`);
  } finally {
    await harness.close();
  }
}

async function waitForReady(
  page: Page,
  player: Locator,
  animationId: string
): Promise<void> {
  await player.waitFor({ state: "attached" });
  await page.waitForFunction((expectedId) => {
    const player = document.querySelector<HTMLElement>(
      `[data-kp-editor-animation-player]` +
      `[data-kp-editor-animation-id="${expectedId}"]`
    );
    const surface = player?.querySelector<HTMLElement>(
      "[data-kp-editor-animation-surface-slot]"
    );
    return player?.dataset["kpEditorAnimationHydrated"] === "true" &&
      surface?.dataset["kpEditorAnimationAdapterStatus"] === "ready";
  }, animationId);
}

async function waitForProgress(
  page: Page,
  animationId: string,
  expectedProgress: number
): Promise<void> {
  await page.waitForFunction(({ animationId: expectedId, expectedProgress }) => {
    const player = document.querySelector<HTMLElement>(
      `[data-kp-editor-animation-player]` +
      `[data-kp-editor-animation-id="${expectedId}"]`
    );
    return Math.abs(
      Number(player?.dataset["kpEditorAnimationProgress"] ?? -1) -
        expectedProgress
    ) < 0.000_1;
  }, { animationId, expectedProgress });
}

async function settle(stage: Locator): Promise<void> {
  await stage.evaluate(async (element) => {
    await element.ownerDocument.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });
}

function publicReviewUrl(
  animationId: string,
  progress: number,
  theme: string
): string {
  const url = new URL("http://127.0.0.1:8000/");
  url.searchParams.set("artifact", animationId);
  url.searchParams.set("playhead", String(progress));
  url.searchParams.set("theme", theme);
  url.searchParams.set("view", "animation-catalogue");
  return url.toString();
}

await capture();
