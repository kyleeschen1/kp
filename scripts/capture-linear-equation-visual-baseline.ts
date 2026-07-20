import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium, type Page } from "playwright";

const baseUrl = process.env["KP_VISUAL_BASE_URL"] ?? "http://127.0.0.1:8000";
const outputRoot = path.resolve(
  process.env["KP_VISUAL_OUTPUT"] ?? "tmp/codex/linear-equation-visual-baseline"
);
const viewport = { width: 1440, height: 1000 } as const;

interface CaptureRecord {
  readonly id: string;
  readonly url: string;
  readonly selector: string;
  readonly output: string;
  readonly progress?: number;
  readonly time?: number;
  readonly viewport?: { readonly width: number; readonly height: number };
}

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport });
const captures: CaptureRecord[] = [];

try {
  await capturePage({
    id: "linear-room-plain-symbolic",
    url: "/concepts/mathematics/linear-equations/solve-with-balance",
    ready: "[data-kp-symbolic-equation]"
  });
  await page.getByRole("link", { name: "Balance", exact: true }).click();
  await page.locator("[data-kp-balance-scene]").waitFor();
  await captureCurrent("linear-room-plain-balance", "[data-kp-concept-room-shell]");
  await captureDivisionCheckpoints(page.url());
  await page.setViewportSize(viewport);

  await capturePage({
    id: "ftc-composition-reference",
    url: "/?view=ftc-tutorial",
    ready: "[data-kp-ftc-tutorial-host]"
  });

  await page.goto(`${baseUrl}/?animation=editor-animation.animation.linear-solve.solve-x`);
  const player = page.locator("[data-kp-editor-animation-player]");
  await player.waitFor();
  await player.locator("[data-kp-editor-equation-stage] .katex").first().waitFor();
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    await scrubber.fill(String(progress));
    await settle(page);
    const id = `continuity-reference-${String(Math.round(progress * 100)).padStart(3, "0")}`;
    await captureElement(id, player, progress);
  }

  await writeFile(
    path.join(outputRoot, "manifest.json"),
    `${JSON.stringify({ schemaVersion: "kp.visual-baseline.v1", baseUrl, viewport, captures }, null, 2)}\n`,
    "utf8"
  );
  console.log(`captured ${captures.length} visual baseline states in ${outputRoot}`);
} finally {
  await browser.close();
}

async function capturePage(input: {
  readonly id: string;
  readonly url: string;
  readonly ready: string;
}): Promise<void> {
  await page.goto(`${baseUrl}${input.url}`);
  await page.locator(input.ready).waitFor();
  await settle(page);
  await captureCurrent(input.id, "body");
}

async function captureCurrent(id: string, selector: string): Promise<void> {
  const output = path.join(outputRoot, `${id}.png`);
  await page.screenshot({ path: output, fullPage: true });
  captures.push({ id, url: page.url(), selector, output: path.relative(process.cwd(), output) });
}

async function captureElement(
  id: string,
  locator: ReturnType<Page["locator"]>,
  progress: number
): Promise<void> {
  const output = path.join(outputRoot, `${id}.png`);
  await locator.screenshot({ path: output });
  const currentViewport = page.viewportSize();
  captures.push({
    id,
    url: page.url(),
    selector: "[data-kp-editor-animation-player]",
    output: path.relative(process.cwd(), output),
    progress,
    ...(currentViewport === null ? {} : { viewport: currentViewport })
  });
}

async function captureDivisionCheckpoints(canonicalConceptUrl: string): Promise<void> {
  const checkpoints = [
    { time: 470, viewport: { width: 1280, height: 900 }, suffix: "desktop" },
    { time: 575, viewport: { width: 1280, height: 900 }, suffix: "desktop" },
    { time: 650, viewport: { width: 1280, height: 900 }, suffix: "desktop" },
    { time: 720, viewport: { width: 1280, height: 900 }, suffix: "desktop" },
    { time: 575, viewport: { width: 390, height: 844 }, suffix: "phone" },
    { time: 720, viewport: { width: 390, height: 844 }, suffix: "phone" }
  ] as const;

  for (const checkpoint of checkpoints) {
    await page.setViewportSize(checkpoint.viewport);
    // Preserve the route's required version and mode fields while varying only the reviewed visual state.
    const url = new URL(canonicalConceptUrl);
    url.searchParams.set("checkpoint", "subtract-three");
    url.searchParams.set("t", String(checkpoint.time));
    url.searchParams.set("projection", "balance");
    url.searchParams.append("focus", "operation.divide-two");
    const id = `linear-room-division-${checkpoint.time}-${checkpoint.suffix}`;
    console.log(`capturing ${id}`);
    await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 15_000 });
    await page.locator("[data-kp-concept-room-mounted=true]").waitFor({ state: "attached", timeout: 15_000 });
    const scene = page.locator("[data-kp-concept-viewport] [data-kp-balance-stage-root]");
    await scene.waitFor();
    await settle(page);
    const output = path.join(outputRoot, `${id}.png`);
    await scene.screenshot({ path: output });
    captures.push({
      id,
      url: page.url(),
      selector: "[data-kp-concept-viewport] [data-kp-balance-stage-root]",
      output: path.relative(process.cwd(), output),
      time: checkpoint.time,
      viewport: checkpoint.viewport
    });
  }
}

async function settle(target: Page): Promise<void> {
  await target.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}
