import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

import { chromium, type Page } from "playwright";
import { preview, type PreviewServer } from "vite";

const conceptPath = "/concepts/mathematics/linear-equations/solve-with-balance";
const outputRoot = path.resolve(
  process.env["KP_SEMANTIC_READER_BASELINE_OUTPUT"]
    ?? "tmp/codex/semantic-reader-current-baseline"
);
const explicitBaseUrl = process.env["KP_SEMANTIC_READER_BASE_URL"];
const viewport = { width: 1440, height: 1000 } as const;

interface LoadedAsset {
  readonly name: string;
  readonly kind: "css" | "font" | "javascript" | "other";
  readonly rawBytes?: number | undefined;
  readonly gzipBytes?: number | undefined;
}

interface MotionSample {
  readonly elapsedMs: number;
  readonly progress: number;
}

interface MotionBaseline {
  readonly from: number;
  readonly to: number;
  readonly durationMs: number;
  readonly intermediateSampleCount: number;
  readonly samples: readonly MotionSample[];
  readonly progressAfterSmallScroll: number;
}

let previewServer: PreviewServer | undefined;
await mkdir(outputRoot, { recursive: true });

try {
  const baseUrl = explicitBaseUrl ?? await startProductionPreview();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport });
    await page.goto(`${baseUrl}${conceptPath}`, { waitUntil: "domcontentloaded" });
    await page.locator("[data-kp-symbolic-story-player]").waitFor();
    await settle(page);

    const motion = await captureMotionBaseline(page);
    const resources = await loadedResourcePaths(page);
    const assets = await Promise.all(resources.map(summarizeLoadedAsset));
    const initialHtml = await fetch(`${baseUrl}${conceptPath}`).then((response) => response.text());
    const interactiveScreenshot = path.join(outputRoot, "current-story-interactive.png");
    await page.screenshot({ path: interactiveScreenshot, fullPage: false });

    const noJsContext = await browser.newContext({ javaScriptEnabled: false, viewport });
    const noJsPage = await noJsContext.newPage();
    await noJsPage.goto(`${baseUrl}${conceptPath}`, { waitUntil: "domcontentloaded" });
    const noJs = await noJsPage.evaluate(() => ({
      bodyText: document.body.innerText.trim(),
      appText: document.querySelector("#app")?.textContent?.trim() ?? "",
      headingCount: document.querySelectorAll("h1,h2,h3,h4,h5,h6").length,
      linkCount: document.querySelectorAll("a[href]").length
    }));
    await noJsPage.screenshot({
      path: path.join(outputRoot, "current-story-no-javascript.png"),
      fullPage: true
    });
    await noJsContext.close();

    const jsAndCss = assets.filter((asset) =>
      asset.kind === "javascript" || asset.kind === "css"
    );
    const baseline = {
      schemaVersion: "kp.semantic-reader-current-baseline.v1",
      capturedAt: new Date().toISOString(),
      route: conceptPath,
      viewport,
      productionPreview: explicitBaseUrl === undefined,
      initialHtml: {
        rawBytes: Buffer.byteLength(initialHtml),
        containsLessonHeading: initialHtml.includes("Solve x + 3 = 7"),
        containsAppRoot: initialHtml.includes('id="app"')
      },
      noJavaScript: {
        bodyTextLength: noJs.bodyText.length,
        appTextLength: noJs.appText.length,
        headingCount: noJs.headingCount,
        linkCount: noJs.linkCount
      },
      routeAssets: {
        files: assets,
        javascriptAndCssRawBytes: sumDefined(jsAndCss.map((asset) => asset.rawBytes)),
        javascriptAndCssGzipBytes: sumDefined(jsAndCss.map((asset) => asset.gzipBytes)),
        editorAssetNames: assets
          .map((asset) => asset.name)
          .filter((name) => /editor|equation-surface-adapter|animation-player/i.test(name)),
        threeAssetNames: assets
          .map((asset) => asset.name)
          .filter((name) => /three/i.test(name))
      },
      motion,
      screenshots: {
        interactive: path.relative(process.cwd(), interactiveScreenshot),
        noJavaScript: path.relative(
          process.cwd(),
          path.join(outputRoot, "current-story-no-javascript.png")
        )
      }
    } as const;

    await writeFile(
      path.join(outputRoot, "baseline.json"),
      `${JSON.stringify(baseline, null, 2)}\n`,
      "utf8"
    );
    console.log(JSON.stringify({
      output: path.relative(process.cwd(), path.join(outputRoot, "baseline.json")),
      initialHtml: baseline.initialHtml,
      noJavaScript: baseline.noJavaScript,
      routeAssets: {
        count: baseline.routeAssets.files.length,
        javascriptAndCssRawBytes: baseline.routeAssets.javascriptAndCssRawBytes,
        javascriptAndCssGzipBytes: baseline.routeAssets.javascriptAndCssGzipBytes,
        editorAssetNames: baseline.routeAssets.editorAssetNames,
        threeAssetNames: baseline.routeAssets.threeAssetNames
      },
      motion: {
        durationMs: baseline.motion.durationMs,
        intermediateSampleCount: baseline.motion.intermediateSampleCount,
        progressAfterSmallScroll: baseline.motion.progressAfterSmallScroll
      }
    }, null, 2));
  } finally {
    await browser.close();
  }
} finally {
  await previewServer?.close();
}

async function startProductionPreview(): Promise<string> {
  await access(path.resolve("dist/index.html"));
  previewServer = await preview({
    logLevel: "error",
    preview: {
      host: "127.0.0.1",
      port: 4174,
      strictPort: false,
      proxy: {
        "/api": {
          changeOrigin: true,
          target: process.env["API_TARGET"] ?? "http://127.0.0.1:8001"
        }
      }
    }
  });
  const address = previewServer.httpServer.address();
  if (address === null || typeof address === "string") {
    throw new Error("Vite preview did not expose a TCP address.");
  }
  return `http://127.0.0.1:${address.port}`;
}

async function captureMotionBaseline(page: Page): Promise<MotionBaseline> {
  const measurement = await page.evaluate(async () => {
    const player = document.querySelector<HTMLElement>("[data-kp-symbolic-story-player]");
    const beat = document.querySelector<HTMLElement>(
      '[data-kp-symbolic-story-beat="subtract-both-sides"]'
    );
    if (player === null || beat === null) throw new Error("Symbolic story baseline is unavailable.");
    const samples: MotionSample[] = [];
    const startedAt = performance.now();
    const readProgress = (): number => Number.parseFloat(
      player.dataset["kpEditorAnimationProgress"] ?? "0"
    );
    const sample = (): void => {
      const progress = readProgress();
      const previous = samples.at(-1)?.progress;
      if (previous !== progress) {
        samples.push({ elapsedMs: performance.now() - startedAt, progress });
      }
    };
    sample();
    const observer = new MutationObserver(sample);
    observer.observe(player, {
      attributes: true,
      attributeFilter: ["data-kp-editor-animation-progress"]
    });
    beat.scrollIntoView({ block: "center" });

    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("Story motion baseline timed out.")), 3_000);
      const poll = (): void => {
        sample();
        if (Math.abs(readProgress() - 0.333) <= 0.000_001) {
          window.clearTimeout(timeout);
          resolve();
          return;
        }
        requestAnimationFrame(poll);
      };
      requestAnimationFrame(poll);
    });
    observer.disconnect();
    sample();
    const durationMs = performance.now() - startedAt;
    window.scrollBy({ top: 60 });
    await new Promise<void>((resolve) => window.setTimeout(resolve, 150));
    return {
      durationMs,
      samples,
      progressAfterSmallScroll: readProgress()
    };
  });

  return {
    from: measurement.samples[0]?.progress ?? 0,
    to: measurement.samples.at(-1)?.progress ?? 0.333,
    durationMs: round(measurement.durationMs),
    intermediateSampleCount: Math.max(0, measurement.samples.length - 2),
    samples: measurement.samples.map((sample) => ({
      elapsedMs: round(sample.elapsedMs),
      progress: round(sample.progress, 6)
    })),
    progressAfterSmallScroll: round(measurement.progressAfterSmallScroll, 6)
  };
}

async function loadedResourcePaths(page: Page): Promise<readonly string[]> {
  const urls = await page.evaluate(() => (
    performance.getEntriesByType("resource") as PerformanceResourceTiming[]
  ).map((entry) => entry.name));
  return [...new Set(urls.map((url) => new URL(url).pathname))]
    .filter((pathname) => pathname.startsWith("/assets/"))
    .sort();
}

async function summarizeLoadedAsset(pathname: string): Promise<LoadedAsset> {
  const name = pathname.slice("/assets/".length);
  const kind = assetKind(name);
  const file = path.resolve("dist/assets", name);
  try {
    const bytes = await readFile(file);
    return {
      name,
      kind,
      rawBytes: bytes.byteLength,
      gzipBytes: gzipSync(bytes).byteLength
    };
  } catch {
    return { name, kind };
  }
}

function assetKind(name: string): LoadedAsset["kind"] {
  if (name.endsWith(".js")) return "javascript";
  if (name.endsWith(".css")) return "css";
  if (/\.(?:woff2?|ttf)$/.test(name)) return "font";
  return "other";
}

function sumDefined(values: readonly (number | undefined)[]): number {
  return values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
}

function round(value: number, precision = 2): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    }));
  });
}
