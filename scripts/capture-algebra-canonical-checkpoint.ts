import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Page } from "playwright";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const outputRoot = path.resolve(
  "tmp/codex/algebra-article-canonical-checkpoint"
);
const articleRoute = "/tutorials/algebra/fraction-composition/";
const readerRoute = "/reader/fraction-composition/";
const firstRangeEnd = 2 / 13;
const samples = [
  { id: "source", label: "source", localProgress: 0 },
  { id: "midpoint", label: "midpoint", localProgress: 0.5 },
  { id: "target", label: "target", localProgress: 1 }
] as const;
const profiles = [
  { id: "wide", label: "Wide", viewport: { width: 1_100, height: 800 } },
  { id: "phone", label: "Phone", viewport: { width: 390, height: 844 } }
] as const;

async function capture(): Promise<void> {
  await mkdir(outputRoot, { recursive: true });
  const harness = createKpVisualReviewHarness();
  const items: KpVisualContactSheetItem[] = [];

  try {
    for (const profile of profiles) {
      const page = await harness.page({
        viewport: profile.viewport,
        colorScheme: "dark"
      });
      for (const sample of samples) {
        const globalProgress = firstRangeEnd * sample.localProgress;
        const readerFile = await captureReader({
          page,
          baseUrl: harness.baseUrl,
          id: `${profile.id}-${sample.id}-reader`,
          globalProgress
        });
        items.push(await contactSheetItem({
          id: `${profile.id}-${sample.id}-reader`,
          label: `${profile.label} · ${sample.label} · canonical reader`,
          progress: globalProgress,
          viewport: profile.viewport,
          file: readerFile
        }));

        const articleFile = await captureArticle({
          page,
          baseUrl: harness.baseUrl,
          id: `${profile.id}-${sample.id}-article`,
          localProgress: sample.localProgress
        });
        items.push(await contactSheetItem({
          id: `${profile.id}-${sample.id}-article`,
          label: `${profile.label} · ${sample.label} · Article v1`,
          progress: globalProgress,
          viewport: profile.viewport,
          file: articleFile
        }));
      }
    }

    const sheetHtml = buildKpVisualContactSheetHtml(items, {
      title: "Canonical fraction composition · reader / Article checkpoint",
      columns: 2,
      imageFit: "contain"
    });
    const sheetPage = await harness.page({ viewport: { width: 1_440, height: 1_000 } });
    await sheetPage.setContent(sheetHtml, { waitUntil: "load" });
    const sheet = path.join(outputRoot, "contact-sheet.png");
    await sheetPage.screenshot({ path: sheet, fullPage: true, animations: "disabled" });
    const html = path.join(outputRoot, "index.html");
    await writeFile(html, sheetHtml, "utf8");
    const manifest = path.join(outputRoot, "manifest.json");
    await writeFile(manifest, `${JSON.stringify({
      schemaVersion: "kp.algebra-canonical-human-checkpoint.v1",
      canonicalReference: readerRoute,
      article: articleRoute,
      globalRange: { start: 0, end: firstRangeEnd },
      samples: samples.map(({ id, localProgress }) => ({
        id,
        localProgress,
        globalProgress: firstRangeEnd * localProgress
      })),
      profiles: profiles.map(({ id, viewport }) => ({ id, viewport, theme: "dark" })),
      captures: items.map(({ dataUrl: _dataUrl, ...item }) => item),
      sheet: path.relative(process.cwd(), sheet),
      html: path.relative(process.cwd(), html)
    }, null, 2)}\n`, "utf8");
    console.log(`algebra canonical checkpoint: ${path.relative(process.cwd(), sheet)}`);
    console.log(`review sheet: ${path.relative(process.cwd(), html)}`);
    console.log(`manifest: ${path.relative(process.cwd(), manifest)}`);
  } finally {
    await harness.close();
  }
}

async function captureReader(input: {
  readonly page: Page;
  readonly baseUrl: string;
  readonly id: string;
  readonly globalProgress: number;
}): Promise<string> {
  const url = new URL(readerRoute, input.baseUrl);
  url.searchParams.set("kpTheme", "dark");
  url.searchParams.set("kpMotion", "full");
  url.searchParams.set("kpProgress", String(Math.round(input.globalProgress * 1_000)));
  await input.page.goto(url.toString(), { waitUntil: "domcontentloaded" });
  await input.page.locator('body[data-kp-reader-hydrated="true"]').waitFor();
  await input.page.locator("[data-kp-reader-attention-scrubber]").evaluate(
    (element, progress) => {
      const scrubber = element as HTMLInputElement;
      // Review parity needs the exact 2/13 window, not learner-control rounding.
      scrubber.step = "any";
      scrubber.value = String(progress * 1_000);
      scrubber.dispatchEvent(new Event("input", { bubbles: true }));
    },
    input.globalProgress
  );
  await settle(input.page);
  return captureStage(
    input.page,
    '[data-kp-reader-equation-stage] [data-kp-reader-transition-active="true"] [data-kp-reader-fit-surface]',
    input.id
  );
}

async function captureArticle(input: {
  readonly page: Page;
  readonly baseUrl: string;
  readonly id: string;
  readonly localProgress: number;
}): Promise<string> {
  const url = new URL(articleRoute, input.baseUrl);
  url.searchParams.set("kpTheme", "dark");
  await input.page.goto(url.toString(), { waitUntil: "domcontentloaded" });
  const host = input.page.locator(
    '[data-kp-algebra-stage-host][data-kp-algebra-canonical-host-status="active"]'
  );
  await host.waitFor();
  await host.locator("[data-kp-algebra-range-scrubber]").evaluate(
    (element, progress) => {
      const scrubber = element as HTMLInputElement;
      scrubber.value = String(progress * 1_000);
      scrubber.dispatchEvent(new Event("input", { bubbles: true }));
    },
    input.localProgress
  );
  await settle(input.page);
  return captureStage(
    input.page,
    '[data-kp-algebra-stage-host] [data-kp-reader-transition-active="true"] [data-kp-reader-fit-surface]',
    input.id
  );
}

async function captureStage(
  page: Page,
  selector: string,
  id: string
): Promise<string> {
  const file = path.join(outputRoot, `${id}.png`);
  await page.locator("[data-kp-dev-toolbar]").evaluateAll((elements) => {
    for (const element of elements) {
      (element as HTMLElement).style.setProperty("display", "none", "important");
    }
  });
  const stage = page.locator(selector);
  await stage.scrollIntoViewIfNeeded();
  await stage.screenshot({ path: file, animations: "disabled" });
  return file;
}

async function contactSheetItem(input: {
  readonly id: string;
  readonly label: string;
  readonly progress: number;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly file: string;
}): Promise<KpVisualContactSheetItem> {
  const image = await readFile(input.file);
  return {
    id: input.id,
    label: input.label,
    progress: input.progress,
    viewport: input.viewport,
    file: path.relative(process.cwd(), input.file),
    dataUrl: `data:image/png;base64,${image.toString("base64")}`
  };
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });
}

await capture();
