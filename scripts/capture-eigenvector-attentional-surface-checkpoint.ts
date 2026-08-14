import type { AddressInfo } from "node:net";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";
import { createServer } from "vite";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import {
  createKpVisualReviewHarness,
  type KpVisualReviewHarness
} from "./visual-review-harness.ts";

const outputRoot = path.resolve(
  "tmp/codex/eigenvector-attentional-surface-checkpoint"
);
const defaultBaseUrl = "http://127.0.0.1:4195";
const route = "/learn/math/eigenvectors/";
const captures = [
  capture("fan", "Whole fan transforms", "watch-the-fan", 0.15),
  capture("survivor", "One direction survives", "one-direction-survives", 0.3),
  capture("equation", "Geometry becomes Av = 3v", "geometry-becomes-equation", 0.45, "eigenvector-demo/vector/v"),
  capture("prediction", "Learner predicts A(2v)", "predict-a-multiple", 0.65),
  capture("eigenspace", "Scalar family reveals the eigenspace", "reveal-the-eigenspace", 0.85),
  capture("recall-phone", "Phone · compressed reconstruction cue", "compressed-recall", 1, undefined, { width: 390, height: 844 })
] as const;

export async function captureKpEigenvectorAttentionalSurfaceCheckpoint() {
  await mkdir(outputRoot, { recursive: true });
  const harness = await createHarness();
  const items: KpVisualContactSheetItem[] = [];
  const manifestCaptures: object[] = [];
  try {
    await harness.start();
    for (const spec of captures) {
      const page = await harness.page({
        viewport: spec.viewport,
        colorScheme: "dark"
      });
      const url = new URL(route, harness.baseUrl);
      url.hash = spec.beatId;
      if (spec.focusObjectId !== undefined) {
        url.searchParams.set("focus", spec.focusObjectId);
      }
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await page.waitForFunction((beatId) =>
        document.querySelector<HTMLElement>("[data-kp-eigenvector-public]")
          ?.dataset["kpCurrentBeat"] === beatId,
      spec.beatId);
      await settle(page);
      await assertNoOverflow(page, spec.id);
      const file = path.join(outputRoot, `${spec.id}.png`);
      await page.screenshot({
        path: file,
        fullPage: false,
        animations: "disabled"
      });
      const image = await readFile(file);
      items.push({
        id: spec.id,
        label: spec.label,
        progress: spec.progress,
        viewport: spec.viewport,
        file: path.relative(process.cwd(), file),
        dataUrl: `data:image/png;base64,${image.toString("base64")}`
      });
      manifestCaptures.push({
        id: spec.id,
        label: spec.label,
        url: url.toString(),
        beatId: spec.beatId,
        focusObjectId: spec.focusObjectId,
        viewport: spec.viewport,
        file: path.relative(process.cwd(), file)
      });
    }
    const htmlSource = buildKpVisualContactSheetHtml(items, {
      title: "Kinetic Press · eigenvector attentional surface",
      columns: 2,
      imageFit: "contain"
    });
    const html = path.join(outputRoot, "index.html");
    await writeFile(html, htmlSource, "utf8");
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
    const manifest = path.join(outputRoot, "manifest.json");
    await writeFile(manifest, `${JSON.stringify({
      schemaVersion: "kp.eigenvector-attentional-surface-checkpoint.v1",
      disposition: "Unreviewed",
      imagesAreDisposable: true,
      route,
      captures: manifestCaptures,
      contactSheet: path.relative(process.cwd(), sheet),
      contactSheetHtml: path.relative(process.cwd(), html)
    }, null, 2)}\n`, "utf8");
    return { captures: items.length, html, manifest, sheet };
  } finally {
    await harness.close();
  }
}

function capture(
  id: string,
  label: string,
  beatId: string,
  progress: number,
  focusObjectId?: string,
  viewport = { width: 1_280, height: 900 }
) {
  return { id, label, beatId, progress, focusObjectId, viewport } as const;
}

async function createHarness(): Promise<KpVisualReviewHarness> {
  if (await isReachable(new URL(route, defaultBaseUrl))) {
    return createKpVisualReviewHarness({ baseUrl: defaultBaseUrl });
  }
  return createKpVisualReviewHarness({
    adapters: {
      startServer: async () => {
        const vite = await createServer({
          configFile: path.resolve("vite.public-eigenvectors.config.ts"),
          logLevel: "error"
        });
        await vite.listen();
        const address = vite.httpServer?.address();
        if (address === null || address === undefined ||
            typeof address === "string") {
          await vite.close();
          throw new Error("Eigenvector checkpoint server has no TCP address.");
        }
        return {
          baseUrl: addressUrl(address),
          close: () => vite.close()
        };
      },
      launchBrowser: () => chromium.launch({ headless: true })
    }
  });
}

function addressUrl(address: AddressInfo): string {
  const host = address.address === "::" ? "127.0.0.1" : address.address;
  return `http://${host}:${address.port}`;
}

async function isReachable(url: URL): Promise<boolean> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function settle(page: import("playwright").Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  ));
}

async function assertNoOverflow(
  page: import("playwright").Page,
  id: string
): Promise<void> {
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - window.innerWidth
  );
  if (overflow > 1) {
    throw new Error(`${id} overflowed its viewport by ${overflow}px.`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const result = await captureKpEigenvectorAttentionalSurfaceCheckpoint();
  console.log(JSON.stringify(result, null, 2));
}
