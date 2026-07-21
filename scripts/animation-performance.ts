import { gzipSync } from "node:zlib";
import { readFile, readdir } from "node:fs/promises";
import { chromium, type Page } from "playwright";
import { preview, type PreviewServer } from "vite";
import {
  evaluateKpAnimationPerformance,
  initialScriptTransferBytes,
  type KpAnimationFramePerformance,
  type KpAnimationPerformanceBaseline,
  type KpAnimationPerformanceSnapshot,
  type KpAnimationRuntimePerformance
} from "../src/animation/performance-budget.ts";

const root = process.cwd();
const baselinePath = new URL(
  "../tests/fixtures/animation-performance-baseline.json",
  import.meta.url
);
const strictTargets = process.argv.includes("--strict-targets");

const baseline = JSON.parse(
  await readFile(baselinePath, "utf8")
) as KpAnimationPerformanceBaseline;
const artifacts = await readArtifacts();
const externalUrl = process.env["KP_ANIMATION_PERF_URL"];
let server: PreviewServer | undefined;

try {
  const baseUrl = externalUrl ?? await startPreview();
  const browser = await chromium.launch({ headless: true });
  try {
    const normal = await measureRuntime(browser, baseUrl, false);
    const constrained = await measureRuntime(browser, baseUrl, true);
    const snapshot: KpAnimationPerformanceSnapshot = {
      capturedAt: new Date().toISOString(),
      artifacts,
      normal,
      constrained
    };
    const issues = evaluateKpAnimationPerformance({ snapshot, baseline });
    const regressions = issues.filter((issue) => issue.severity === "regression");
    const targets = issues.filter((issue) => issue.severity === "target");

    console.log(JSON.stringify({
      snapshot,
      derived: {
        initialScriptTransferBytes: initialScriptTransferBytes(snapshot)
      },
      regressions,
      targets,
      passed: regressions.length === 0 && (!strictTargets || targets.length === 0)
    }, null, 2));

    if (regressions.length > 0 || (strictTargets && targets.length > 0)) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
} finally {
  await server?.close();
}

async function startPreview(): Promise<string> {
  server = await preview({
    root,
    logLevel: "silent",
    preview: {
      host: "127.0.0.1",
      port: 4176,
      strictPort: false
    }
  });
  const address = server.httpServer.address();
  if (address === null || typeof address === "string") {
    throw new Error("Vite preview did not expose a TCP address.");
  }
  return `http://127.0.0.1:${address.port}/`;
}

async function readArtifacts(): Promise<KpAnimationPerformanceSnapshot["artifacts"]> {
  const indexHtml = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  // Rollup entry names follow the configured input key (currently `main`),
  // so the production module tag is the authority rather than a filename prefix.
  const entryName = indexHtml.match(
    /<script\b[^>]*\btype="module"[^>]*\bsrc="\/assets\/([^"]+\.js)"/
  )?.[1];
  if (entryName === undefined) {
    throw new Error("Build first: dist/index.html has no production entry script.");
  }
  const assetNames = await readdir(new URL("../dist/assets/", import.meta.url));
  const threeName = assetNames.find((name) =>
    name.startsWith("graph-webgl-three-") && name.endsWith(".js")
  );
  if (threeName === undefined) {
    throw new Error("Expected a graph-webgl-three production chunk.");
  }
  const [entry, three] = await Promise.all([
    readFile(new URL(`../dist/assets/${entryName}`, import.meta.url)),
    readFile(new URL(`../dist/assets/${threeName}`, import.meta.url))
  ]);
  return {
    entryScriptBytes: entry.byteLength,
    entryScriptGzipBytes: gzipSync(entry).byteLength,
    threeScriptBytes: three.byteLength,
    threeScriptGzipBytes: gzipSync(three).byteLength
  };
}

async function measureRuntime(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  baseUrl: string,
  constrained: boolean
): Promise<KpAnimationRuntimePerformance> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  if (constrained) {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: 209_715,
      uploadThroughput: 96_000,
      connectionType: "cellular3g"
    });
  }

  const startedAt = Date.now();
  await page.goto(baseUrl, { waitUntil: "load", timeout: 120_000 });
  await page.waitForFunction(() =>
    document.querySelector("[data-kp-editor-animation-player]")
      ?.getAttribute("data-kp-editor-animation-hydrated") === "true",
  undefined, { timeout: 120_000 });
  const hydrationMs = Date.now() - startedAt;
  await page.waitForTimeout(1_000);
  const resources = await resourceSummary(page);
  await page.selectOption(
    "[data-action=set-editor-animation]",
    "editor-animation.sample.animation.matrix-matrix.basic"
  );
  await page.waitForTimeout(300);
  const matrixFrame = await measureFrames(page);
  await context.close();

  return {
    hydrationMs,
    ...resources,
    matrixFrame
  };
}

async function resourceSummary(page: Page): Promise<Pick<
  KpAnimationRuntimePerformance,
  "initialScriptTransferBytes" | "initialFontTransferBytes" | "initialScriptNames"
>> {
  return page.evaluate(() => {
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const scripts = resources.filter((resource) => resource.name.endsWith(".js"));
    const fonts = resources.filter((resource) => /\.(woff2?|ttf)$/.test(resource.name));
    return {
      initialScriptTransferBytes: scripts.reduce(
        (total, resource) => total + resource.transferSize,
        0
      ),
      initialFontTransferBytes: fonts.reduce(
        (total, resource) => total + resource.transferSize,
        0
      ),
      initialScriptNames: scripts.map((resource) => resource.name.split("/").at(-1) ?? resource.name)
    };
  });
}

async function measureFrames(page: Page): Promise<KpAnimationFramePerformance> {
  return page.evaluate(async () => {
    const longTasks: number[] = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) longTasks.push(entry.duration);
    });
    try {
      observer.observe({ entryTypes: ["longtask"] });
    } catch {
      // Long-task observation is optional; frame intervals remain authoritative.
    }
    const deltas: number[] = [];
    const player = document.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]"
    );
    const initialDiagnosticPublishes = Number(
      player?.dataset["kpEditorAnimationDiagnosticsPublishCount"] ?? 0
    );
    const initialInspectionPublishes = Number(
      player?.dataset["kpEditorAnimationInspectionPublishCount"] ?? 0
    );
    const stage = player?.querySelector<HTMLElement>(
      "[data-kp-editor-equation-stage]"
    );
    const initialLayoutCacheBuilds = Number(
      stage?.dataset["kpEditorEquationCacheBuildCount"] ?? 0
    );
    const initialOverlayGeometryMeasures = Number(
      stage?.dataset["kpEditorEquationOverlayGeometryMeasureCount"] ?? 0
    );
    let previous: number | undefined;
    const startedAt = performance.now();
    document.querySelector<HTMLButtonElement>(
      '[data-kp-editor-animation-player] button[aria-label="Play animation"]'
    )?.click();
    await new Promise<void>((resolve) => {
      const tick = (now: number): void => {
        if (previous !== undefined) deltas.push(now - previous);
        previous = now;
        if (now - startedAt >= 3_000) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    observer.disconnect();
    const sorted = [...deltas].sort((left, right) => left - right);
    const percentile = (ratio: number): number =>
      sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))] ?? 0;
    return {
      frames: deltas.length,
      meanMs: deltas.reduce((sum, value) => sum + value, 0) / deltas.length,
      p95Ms: percentile(0.95),
      p99Ms: percentile(0.99),
      maxMs: Math.max(...deltas),
      over33Ms: deltas.filter((value) => value > 33.4).length,
      longestTaskMs: Math.max(0, ...longTasks),
      diagnosticPublishes: Math.max(
        0,
        Number(player?.dataset["kpEditorAnimationDiagnosticsPublishCount"] ?? 0) -
          initialDiagnosticPublishes
      ),
      inspectionPublishes: Math.max(
        0,
        Number(player?.dataset["kpEditorAnimationInspectionPublishCount"] ?? 0) -
          initialInspectionPublishes
      ),
      layoutCacheBuilds: Math.max(
        0,
        Number(stage?.dataset["kpEditorEquationCacheBuildCount"] ?? 0) -
          initialLayoutCacheBuilds
      ),
      overlayGeometryMeasures: Math.max(
        0,
        Number(
          stage?.dataset["kpEditorEquationOverlayGeometryMeasureCount"] ?? 0
        ) - initialOverlayGeometryMeasures
      )
    };
  });
}
