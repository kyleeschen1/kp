import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

import { chromium, type Page } from "playwright";
import { preview, type PreviewServer } from "vite";

const route = "/reader/solve-x/";
const outputRoot = path.resolve("tmp/codex/semantic-reader-review");
const viewport = { width: 1280, height: 900 } as const;
const reviewStates = [
  ["read-equality", 0],
  ["subtract-motion", 167],
  ["subtract-settled", 333],
  ["cancel-motion", 500],
  ["cancel-settled", 667],
  ["solution-motion", 833],
  ["solution-settled", 1_000]
] as const;

interface AssetSummary {
  readonly name: string;
  readonly kind: "javascript" | "css" | "font" | "other";
  readonly rawBytes: number;
  readonly gzipBytes: number;
}

let server: PreviewServer | undefined;
await mkdir(outputRoot, { recursive: true });

try {
  const baseUrl = await startPreview();
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await openReader(page, baseUrl, 0);
    const resourcePaths = await loadedResourcePaths(page);
    const assets = await Promise.all(resourcePaths.map(summarizeAsset));
    const captures: string[] = [];
    for (const [id, progress] of reviewStates) {
      await openReader(page, baseUrl, progress);
      captures.push(await capture(page, `${id}-desktop.png`));
    }
    await openReader(page, baseUrl, 0);
    await page.locator(".kp-semantic-link").hover();
    captures.push(await capture(page, "semantic-focus-desktop.png"));
    const motion = await measureContinuousMotion(page, baseUrl);
    await context.close();

    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1
    });
    const mobilePage = await mobile.newPage();
    await openReader(mobilePage, baseUrl, 500);
    captures.push(await capture(mobilePage, "cancel-motion-phone.png"));
    await mobile.close();

    const reduced = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const reducedPage = await reduced.newPage();
    await openReader(reducedPage, baseUrl, 500);
    const reducedProgress = Number(await reducedPage.locator("body").getAttribute(
      "data-kp-reader-progress"
    ));
    const reducedMode = await reducedPage.locator("body").getAttribute(
      "data-kp-reader-motion-mode"
    );
    captures.push(await capture(reducedPage, "reduced-motion-checkpoint.png"));
    await reduced.close();

    const forced = await browser.newContext({ viewport, forcedColors: "active" });
    const forcedPage = await forced.newPage();
    await openReader(forcedPage, baseUrl, 500);
    captures.push(await capture(forcedPage, "forced-colors-cancel.png"));
    await forced.close();

    const noJs = await browser.newContext({ viewport, javaScriptEnabled: false });
    const noJsPage = await noJs.newPage();
    await noJsPage.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    const noJavaScript = await noJsPage.evaluate(() => ({
      bodyTextLength: document.body.innerText.trim().length,
      headingCount: document.querySelectorAll("h1,h2,h3,h4,h5,h6").length,
      linkCount: document.querySelectorAll("a[href]").length,
      visibleStaticMathCount: document.querySelectorAll(
        "[data-kp-static-state]:not([hidden]) .katex"
      ).length
    }));
    captures.push(await capture(noJsPage, "no-javascript-document.png", true));
    await noJs.close();

    const initialHtmlBytes = await readFile(
      path.resolve("dist/reader/solve-x/index.html")
    );
    const codeAssets = assets.filter((asset) =>
      asset.kind === "javascript" || asset.kind === "css"
    );
    const entryAssets = codeAssets.filter((asset) =>
      /reader-solve-x|modulepreload-polyfill/.test(asset.name)
    );
    const forbiddenAssets = assets.filter((asset) =>
      /editor|equation-surface-adapter|animation-player|three|webgl|katex-.*\.js/i.test(asset.name)
    );
    const result = {
      schemaVersion: "kp.semantic-reader-review.v1",
      capturedAt: new Date().toISOString(),
      route,
      viewport,
      initialHtml: {
        rawBytes: initialHtmlBytes.byteLength,
        gzipBytes: gzipSync(initialHtmlBytes).byteLength,
        containsSearchableLesson: initialHtmlBytes.includes(Buffer.from("An equation is a promise")),
        containsMathMl: initialHtmlBytes.includes(Buffer.from("<math"))
      },
      noJavaScript,
      routeAssets: {
        files: assets,
        javascriptAndCssRawBytes: sum(codeAssets.map((asset) => asset.rawBytes)),
        javascriptAndCssGzipBytes: sum(codeAssets.map((asset) => asset.gzipBytes)),
        readerEntryGzipBytes: sum(entryAssets.map((asset) => asset.gzipBytes)),
        forbiddenAssetNames: forbiddenAssets.map((asset) => asset.name),
        fullEquationBudgetGzipBytes: 100 * 1_024,
        readerEntryBudgetGzipBytes: 20 * 1_024
      },
      motion,
      accessibility: {
        reducedMode,
        reducedProgress,
        forcedColorsCapture: "forced-colors-cancel.png"
      },
      captures
    } as const;
    assertReview(result);
    const reportPath = path.join(outputRoot, "review.json");
    await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({
      output: path.relative(process.cwd(), reportPath),
      initialHtml: result.initialHtml,
      noJavaScript: result.noJavaScript,
      routeAssets: {
        count: result.routeAssets.files.length,
        javascriptAndCssGzipBytes: result.routeAssets.javascriptAndCssGzipBytes,
        readerEntryGzipBytes: result.routeAssets.readerEntryGzipBytes,
        forbiddenAssetNames: result.routeAssets.forbiddenAssetNames
      },
      motion,
      accessibility: result.accessibility,
      captureCount: captures.length
    }, null, 2));
  } finally {
    await browser.close();
  }
} finally {
  await server?.close();
}

async function startPreview(): Promise<string> {
  await access(path.resolve("dist/reader/solve-x/index.html"));
  server = await preview({
    logLevel: "error",
    preview: { host: "127.0.0.1", port: 4180, strictPort: false }
  });
  const address = server.httpServer.address();
  if (address === null || typeof address === "string") {
    throw new Error("Semantic reader review preview did not expose an address.");
  }
  return `http://127.0.0.1:${address.port}`;
}

async function openReader(page: Page, baseUrl: string, progress: number): Promise<void> {
  const url = new URL(route, baseUrl);
  url.searchParams.set("kpLesson", "lesson.solve-x.x-plus-3");
  url.searchParams.set("kpVersion", "1");
  url.searchParams.set("kpProgress", String(progress));
  await page.goto(url.toString(), { waitUntil: "networkidle" });
  await page.locator('body[data-kp-reader-hydrated="true"]').waitFor();
  await settle(page);
}

async function capture(page: Page, name: string, fullPage = false): Promise<string> {
  const file = path.join(outputRoot, name);
  await page.screenshot({ path: file, fullPage });
  return path.relative(process.cwd(), file);
}

async function measureContinuousMotion(page: Page, baseUrl: string) {
  await openReader(page, baseUrl, 400);
  return page.evaluate(async () => {
    const body = document.body;
    const stage = document.querySelector<HTMLElement>("[data-kp-reader-equation-stage]");
    if (stage === null) throw new Error("Reader equation stage is unavailable.");
    const readProgress = (): number => Number(body.dataset["kpReaderProgress"] ?? "0");
    const before = readProgress();
    const readsBefore = Number(stage.dataset["kpReaderLayoutReads"] ?? "0");
    window.scrollBy(0, 80);
    await waitForFrames(3);
    const forward = readProgress();
    window.scrollBy(0, -80);
    await waitForFrames(3);
    const rewind = readProgress();
    await new Promise((resolve) => window.setTimeout(resolve, 220));
    return {
      before,
      forward,
      rewind,
      deltaAfterSmallScroll: forward - before,
      rewindErrorPermille: Math.abs(rewind - before),
      layoutReadsBefore: readsBefore,
      layoutReadsAfter: Number(stage.dataset["kpReaderLayoutReads"] ?? "0"),
      settledUrlProgress: Number(new URL(window.location.href).searchParams.get("kpProgress"))
    };

    function waitForFrames(count: number): Promise<void> {
      return new Promise((resolve) => {
        const step = (): void => {
          count -= 1;
          if (count <= 0) resolve();
          else requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }
  });
}

async function loadedResourcePaths(page: Page): Promise<readonly string[]> {
  return page.evaluate(() => [...new Set(
    (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
      .map((entry) => new URL(entry.name).pathname)
      .filter((pathname) => pathname.startsWith("/assets/"))
  )].sort());
}

async function summarizeAsset(pathname: string): Promise<AssetSummary> {
  const name = pathname.slice("/assets/".length);
  const bytes = await readFile(path.resolve("dist/assets", name));
  return { name, kind: assetKind(name), rawBytes: bytes.byteLength, gzipBytes: gzipSync(bytes).byteLength };
}

function assetKind(name: string): AssetSummary["kind"] {
  if (name.endsWith(".js")) return "javascript";
  if (name.endsWith(".css")) return "css";
  if (/\.(?:woff2?|ttf)$/.test(name)) return "font";
  return "other";
}

function assertReview(result: {
  readonly initialHtml: { readonly containsSearchableLesson: boolean; readonly containsMathMl: boolean };
  readonly noJavaScript: { readonly bodyTextLength: number; readonly headingCount: number; readonly visibleStaticMathCount: number };
  readonly routeAssets: { readonly javascriptAndCssGzipBytes: number; readonly readerEntryGzipBytes: number; readonly forbiddenAssetNames: readonly string[]; readonly fullEquationBudgetGzipBytes: number; readonly readerEntryBudgetGzipBytes: number };
  readonly motion: { readonly deltaAfterSmallScroll: number; readonly rewindErrorPermille: number; readonly layoutReadsBefore: number; readonly layoutReadsAfter: number };
  readonly accessibility: { readonly reducedMode: string | null; readonly reducedProgress: number };
}): void {
  if (!result.initialHtml.containsSearchableLesson || !result.initialHtml.containsMathMl) {
    throw new Error("Production reader HTML is not a complete searchable math document.");
  }
  if (result.noJavaScript.bodyTextLength < 300 || result.noJavaScript.headingCount < 5 || result.noJavaScript.visibleStaticMathCount < 1) {
    throw new Error("JavaScript-disabled reader output is incomplete.");
  }
  if (result.routeAssets.forbiddenAssetNames.length > 0) {
    throw new Error(`Reader loaded forbidden assets: ${result.routeAssets.forbiddenAssetNames.join(", ")}`);
  }
  if (result.routeAssets.javascriptAndCssGzipBytes > result.routeAssets.fullEquationBudgetGzipBytes) {
    throw new Error("Reader route exceeds the provisional full-equation gzip budget.");
  }
  if (result.routeAssets.readerEntryGzipBytes > result.routeAssets.readerEntryBudgetGzipBytes) {
    throw new Error("Reader entry exceeds the provisional core gzip budget.");
  }
  if (result.motion.deltaAfterSmallScroll <= 0 || result.motion.rewindErrorPermille > 3) {
    throw new Error("Reader scroll motion is not continuous and reversible.");
  }
  if (result.motion.layoutReadsBefore !== result.motion.layoutReadsAfter) {
    throw new Error("Ordinary reader frames performed additional layout reads.");
  }
  if (result.accessibility.reducedMode !== "checkpoint" || result.accessibility.reducedProgress !== 667) {
    throw new Error("Reduced-motion reader did not project to the directional checkpoint.");
  }
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}
