import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium, type Locator, type Page } from "playwright";
import { preview, type PreviewServer } from "vite";

import { kpGoldEquationParityFrames } from "../src/rendering/equation-gold-parity.ts";

const outputRoot = path.resolve(
  process.env["KP_READER_GOLD_PARITY_OUTPUT"]
    ?? "tmp/codex/reader-gold-equation-parity"
);
const viewport = { width: 1280, height: 900 } as const;
const frames = kpGoldEquationParityFrames.filter((frame) => frame.direction === "forward");

interface InkMetric {
  readonly id: string;
  readonly fontFamily: string;
  readonly fontSize: string;
  readonly fontStyle: string;
  readonly fontWeight: string;
  readonly lineHeight: string;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly opacity: number;
}

interface SurfaceFrame {
  readonly id: string;
  readonly progress: number;
  readonly screenshot: string;
  readonly stage: { readonly width: number; readonly height: number };
  readonly ink: readonly InkMetric[];
}

let server: PreviewServer | undefined;
await mkdir(outputRoot, { recursive: true });

try {
  const baseUrl = await startPreview();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport });
    const editor = await captureEditor(page, baseUrl);
    const reader = await captureReader(page, baseUrl);
    const report = {
      schemaVersion: "kp.reader-gold-equation-parity.v1",
      capturedAt: new Date().toISOString(),
      canonicalAnimationId: "animation.linear-solve.solve-x",
      viewport,
      frames: frames.map(({ id, progress }) => ({ id, progress })),
      editor,
      reader
    } as const;
    const reportPath = path.join(outputRoot, "parity.json");
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({
      output: path.relative(process.cwd(), reportPath),
      editorFrames: editor.length,
      readerFrames: reader.length,
      namedFrames: frames.map((frame) => frame.id)
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
    preview: { host: "127.0.0.1", port: 4182, strictPort: false }
  });
  const address = server.httpServer.address();
  if (address === null || typeof address === "string") {
    throw new Error("Gold-equation parity preview did not expose an address.");
  }
  return `http://127.0.0.1:${address.port}`;
}

async function captureEditor(page: Page, baseUrl: string): Promise<readonly SurfaceFrame[]> {
  const url = new URL("/", baseUrl);
  url.searchParams.set("animation", "editor-animation.animation.linear-solve.solve-x");
  await page.goto(url.toString(), { waitUntil: "networkidle" });
  const player = page.locator("[data-kp-editor-animation-player]");
  await player.waitFor();
  await requireAttribute(player, "data-kp-editor-animation-id", "animation.linear-solve.solve-x");
  await fontsReady(page);
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  const output: SurfaceFrame[] = [];
  for (const frame of frames) {
    await scrubber.fill(String(frame.progress));
    await settle(page);
    output.push(await captureSurface({
      page,
      surface: player,
      stageSelector: "[data-kp-editor-equation-stage]",
      ownerSelector: "[data-kp-equation-material-owner-id]",
      fallbackSelector: "[data-kp-motion-id]",
      surfaceName: "editor",
      ...frame
    }));
  }
  return output;
}

async function captureReader(page: Page, baseUrl: string): Promise<readonly SurfaceFrame[]> {
  const output: SurfaceFrame[] = [];
  for (const frame of frames) {
    // A fresh document makes each URL the sole frame authority; scroll state
    // from a previous named capture must not contaminate parity evidence.
    const browser = page.context().browser();
    if (browser === null) throw new Error("Reader capture requires a browser context.");
    const frameContext = await browser.newContext({ viewport });
    const framePage = await frameContext.newPage();
    try {
      const url = new URL("/reader/solve-x/", baseUrl);
      url.searchParams.set("kpLesson", "lesson.solve-x.x-plus-3");
      url.searchParams.set("kpVersion", "1");
      url.searchParams.set("kpProgress", String(Math.round(frame.progress * 1_000)));
      await framePage.goto(url.toString(), { waitUntil: "networkidle" });
      await framePage.locator('body[data-kp-reader-hydrated="true"]').waitFor();
      await fontsReady(framePage);
      await framePage.waitForFunction(
        (progressPermille) => document.body.dataset["kpReaderProgress"] ===
          String(progressPermille),
        frame.progressPermille
      );
      const stage = framePage.locator("[data-kp-reader-equation-stage]");
      await stage.waitFor();
      await settle(framePage);
      output.push(await captureSurface({
        page: framePage,
        surface: stage,
        stageSelector: ":scope",
        ownerSelector: "[data-kp-reader-equation-material-owner-id]",
        fallbackSelector: "[data-kp-reader-equation-anchor-id]",
        surfaceName: "reader",
        ...frame
      }));
    } finally {
      await frameContext.close();
    }
  }
  return output;
}

async function captureSurface(input: {
  readonly page: Page;
  readonly surface: Locator;
  readonly stageSelector: string;
  readonly ownerSelector: string;
  readonly fallbackSelector: string;
  readonly surfaceName: "editor" | "reader";
  readonly id: string;
  readonly progress: number;
}): Promise<SurfaceFrame> {
  const screenshotPath = path.join(outputRoot, `${input.surfaceName}-${input.id}.png`);
  await input.surface.screenshot({ path: screenshotPath });
  const metrics = await input.surface.evaluate((surface, selectors) => {
    const stage = selectors.stageSelector === ":scope"
      ? surface
      : surface.querySelector<HTMLElement>(selectors.stageSelector);
    if (!(stage instanceof HTMLElement)) throw new Error("Equation stage is unavailable.");
    const stageRect = stage.getBoundingClientRect();
    const visible = (element: HTMLElement): boolean => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" &&
        Number(style.opacity) > 0.001 && rect.width > 0 && rect.height > 0;
    };
    const owners = [...stage.querySelectorAll<HTMLElement>(selectors.ownerSelector)]
      .filter(visible);
    const elements = owners.length > 0
      ? owners
      : [...stage.querySelectorAll<HTMLElement>(selectors.fallbackSelector)].filter(visible);
    return {
      stage: { width: round(stageRect.width), height: round(stageRect.height) },
      ink: elements.map((element, index) => {
        const glyph = element.querySelector<HTMLElement>(".katex, .mord, .mbin, .mrel, .mathnormal")
          ?? element;
        const style = getComputedStyle(glyph);
        const rect = element.getBoundingClientRect();
        return {
          id: element.dataset["kpEquationMaterialOwnerId"]
            ?? element.dataset["kpReaderEquationMaterialOwnerId"]
            ?? element.dataset["kpMotionId"]
            ?? element.dataset["kpReaderEquationAnchorId"]
            ?? `ink-${index}`,
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontStyle: style.fontStyle,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          left: round(rect.left - stageRect.left),
          top: round(rect.top - stageRect.top),
          width: round(rect.width),
          height: round(rect.height),
          opacity: round(Number(getComputedStyle(element).opacity))
        };
      }).sort((left, right) => left.id.localeCompare(right.id))
    };

    function round(value: number): number {
      return Math.round(value * 100) / 100;
    }
  }, {
    stageSelector: input.stageSelector,
    ownerSelector: input.ownerSelector,
    fallbackSelector: input.fallbackSelector
  });
  return {
    id: input.id,
    progress: input.progress,
    screenshot: path.relative(process.cwd(), screenshotPath),
    ...metrics
  };
}

async function fontsReady(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

async function requireAttribute(
  locator: Locator,
  name: string,
  expected: string
): Promise<void> {
  const actual = await locator.getAttribute(name);
  if (actual !== expected) {
    throw new Error(`Expected ${name}=${expected}; received ${String(actual)}.`);
  }
}
