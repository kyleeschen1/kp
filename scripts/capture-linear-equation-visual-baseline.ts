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
  readonly reference?: "current-concept-room" | "canonical-symbolic-motion";
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
    id: "linear-room-coordinated-start",
    url: "/concepts/mathematics/linear-equations/solve-with-balance",
    ready: "[data-kp-linear-equation-coordinated-stage]",
    reference: "current-concept-room"
  });
  const canonicalConceptUrl = page.url();
  await page.getByRole("link", { name: "Equation", exact: true }).click();
  await page.locator("[data-kp-symbolic-equation]").waitFor();
  await captureCurrent("linear-room-plain-symbolic", "[data-kp-concept-room-shell]");
  await page.getByRole("link", { name: "Balance", exact: true }).click();
  await page.locator("[data-kp-balance-scene]").waitFor();
  await captureCurrent("linear-room-plain-balance", "[data-kp-concept-room-shell]");
  await captureDivisionCheckpoints(canonicalConceptUrl);
  await captureCoordinatedCheckpoints(canonicalConceptUrl);
  await captureMandatoryReviewStates(canonicalConceptUrl);
  await captureCorrespondenceCheckpoints(canonicalConceptUrl);
  await captureReviewMode(canonicalConceptUrl);
  await captureAccessibilityStates(canonicalConceptUrl);
  await page.setViewportSize(viewport);

  await capturePage({
    id: "ftc-composition-reference",
    url: "/?view=ftc-tutorial",
    ready: "[data-kp-ftc-tutorial-host]"
  });

  await page.goto(`${baseUrl}/?animation=editor-animation.animation.linear-solve.solve-x`);
  const player = page.locator("[data-kp-editor-animation-player]");
  await player.waitFor();
  // The editor route selects the catalogue entry, while the mounted player exposes
  // the shared runtime asset id; pin the latter so this remains a true motion reference.
  await requireAttribute(player, "data-kp-editor-animation-id", "animation.linear-solve.solve-x");
  await player.locator("[data-kp-editor-equation-stage] .katex").first().waitFor();
  await requireAttribute(
    player.locator("[data-kp-editor-equation-transition-id]").first(),
    "data-kp-editor-equation-presentation-recipe",
    "continuity-v1"
  );
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    await scrubber.fill(String(progress));
    await settle(page);
    const id = `continuity-reference-${String(Math.round(progress * 100)).padStart(3, "0")}`;
    await captureElement(id, player, progress, "canonical-symbolic-motion");
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
  readonly reference?: CaptureRecord["reference"];
}): Promise<void> {
  await page.goto(`${baseUrl}${input.url}`);
  await page.locator(input.ready).waitFor();
  await settle(page);
  await captureCurrent(input.id, "body", input.reference);
}

async function captureCurrent(
  id: string,
  selector: string,
  reference?: CaptureRecord["reference"]
): Promise<void> {
  const output = path.join(outputRoot, `${id}.png`);
  await page.screenshot({ path: output, fullPage: true });
  captures.push({
    id,
    url: page.url(),
    selector,
    output: path.relative(process.cwd(), output),
    ...(reference === undefined ? {} : { reference })
  });
}

async function captureElement(
  id: string,
  locator: ReturnType<Page["locator"]>,
  progress: number,
  reference?: CaptureRecord["reference"]
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
    ...(reference === undefined ? {} : { reference }),
    ...(currentViewport === null ? {} : { viewport: currentViewport })
  });
}

async function requireAttribute(
  locator: ReturnType<Page["locator"]>,
  name: string,
  expected: string
): Promise<void> {
  const actual = await locator.getAttribute(name);
  if (actual !== expected) {
    throw new Error(`Visual reference requires ${name}=${expected}; received ${String(actual)}.`);
  }
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

async function captureCoordinatedCheckpoints(canonicalConceptUrl: string): Promise<void> {
  const checkpoints = [
    { time: 575, viewport: { width: 1280, height: 900 }, suffix: "desktop" },
    { time: 720, viewport: { width: 1280, height: 900 }, suffix: "desktop" },
    { time: 575, viewport: { width: 390, height: 844 }, suffix: "phone" },
    { time: 720, viewport: { width: 390, height: 844 }, suffix: "phone" }
  ] as const;

  for (const checkpoint of checkpoints) {
    await page.setViewportSize(checkpoint.viewport);
    const url = new URL(canonicalConceptUrl);
    url.searchParams.set("checkpoint", "subtract-three");
    url.searchParams.set("t", String(checkpoint.time));
    url.searchParams.set("projection", "coordinated");
    url.searchParams.append("focus", "operation.divide-two");
    const id = `linear-room-coordinated-${checkpoint.time}-${checkpoint.suffix}`;
    console.log(`capturing ${id}`);
    await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 15_000 });
    await page.locator("[data-kp-concept-room-mounted=true]").waitFor({ state: "attached", timeout: 15_000 });
    const visualField = page.locator("[data-kp-concept-visual-field]");
    await visualField.locator("[data-kp-linear-equation-coordinated-stage]").waitFor();
    await settle(page);
    const output = path.join(outputRoot, `${id}.png`);
    await visualField.screenshot({ path: output });
    captures.push({
      id,
      url: page.url(),
      selector: "[data-kp-concept-visual-field]",
      output: path.relative(process.cwd(), output),
      time: checkpoint.time,
      viewport: checkpoint.viewport
    });
  }
}

async function captureMandatoryReviewStates(canonicalConceptUrl: string): Promise<void> {
  const states = [
    { id: "initial", checkpoint: "start", time: 0, focus: "equation.initial" },
    { id: "subtraction-transit", checkpoint: "start", time: 200, focus: "operation.subtract-three" },
    { id: "subtraction-settlement", checkpoint: "subtract-three", time: 400, focus: "operation.subtract-three" },
    { id: "division-transit", checkpoint: "subtract-three", time: 575, focus: "operation.divide-two" },
    { id: "final", checkpoint: "solved", time: 1000, focus: "equation.solved" }
  ] as const;
  const viewports = [
    { width: 1280, height: 900, suffix: "desktop" },
    { width: 390, height: 844, suffix: "phone" }
  ] as const;

  for (const state of states) {
    for (const target of viewports) {
      await page.setViewportSize(target);
      const url = new URL(canonicalConceptUrl);
      url.searchParams.set("checkpoint", state.checkpoint);
      url.searchParams.set("t", String(state.time));
      url.searchParams.set("projection", "coordinated");
      url.searchParams.set("mode", "touch");
      url.searchParams.delete("focus");
      url.searchParams.append("focus", state.focus);
      await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 15_000 });
      const visualField = page.locator("[data-kp-concept-visual-field]");
      await visualField.locator("[data-kp-linear-equation-coordinated-stage]").waitFor();
      await page.locator("[data-kp-linear-equation-coordinated-stage]")
        .waitFor({ state: "visible" });
      await page.locator(
        `[data-kp-linear-equation-coordinated-stage][data-kp-coordinated-settled-time-permille="${state.time}"]`
      ).waitFor();
      await settle(page);
      const id = `linear-room-review-${state.id}-${target.suffix}`;
      const output = path.join(outputRoot, `${id}.png`);
      await visualField.screenshot({ path: output });
      captures.push({
        id,
        url: page.url(),
        selector: "[data-kp-concept-visual-field]",
        output: path.relative(process.cwd(), output),
        time: state.time,
        viewport: target
      });
    }
  }
}

async function captureCorrespondenceCheckpoints(canonicalConceptUrl: string): Promise<void> {
  const url = new URL(canonicalConceptUrl);
  url.searchParams.set("checkpoint", "start");
  url.searchParams.set("t", "0");
  url.searchParams.set("projection", "coordinated");
  url.searchParams.set("mode", "touch");
  url.searchParams.delete("focus");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.locator('[data-kp-concept-semantic-link="term.two-x"]').first().hover();
  await settle(page);
  const desktopId = "linear-room-correspondence-hover-desktop";
  const desktopOutput = path.join(outputRoot, `${desktopId}.png`);
  await page.locator("[data-kp-concept-visual-field]").screenshot({ path: desktopOutput });
  captures.push({
    id: desktopId,
    url: page.url(),
    selector: "[data-kp-concept-visual-field]",
    output: path.relative(process.cwd(), desktopOutput),
    time: 0,
    viewport: { width: 1280, height: 900 }
  });

  url.searchParams.set("checkpoint", "subtract-three");
  url.searchParams.set("t", "575");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.locator(
    '[data-kp-correspondence-surface="balance"][data-kp-correspondence-semantic-id="operation.divide-two"]'
  ).first().dispatchEvent("click");
  await settle(page);
  const phoneId = "linear-room-correspondence-pinned-phone";
  const phoneOutput = path.join(outputRoot, `${phoneId}.png`);
  await page.locator("[data-kp-concept-visual-field]").screenshot({ path: phoneOutput });
  captures.push({
    id: phoneId,
    url: page.url(),
    selector: "[data-kp-concept-visual-field]",
    output: path.relative(process.cwd(), phoneOutput),
    time: 575,
    viewport: { width: 390, height: 844 }
  });
}

async function captureReviewMode(canonicalConceptUrl: string): Promise<void> {
  const url = new URL(canonicalConceptUrl);
  url.searchParams.set("checkpoint", "divide-two");
  url.searchParams.set("t", "750");
  url.searchParams.set("projection", "coordinated");
  url.searchParams.set("mode", "review");
  url.searchParams.delete("focus");
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 15_000 });
  const review = page.locator("[data-kp-concept-review-mode]");
  await review.waitFor();
  await settle(page);
  const id = "linear-room-review-desktop";
  const output = path.join(outputRoot, `${id}.png`);
  await page.locator("[data-kp-concept-room-shell]").screenshot({ path: output });
  captures.push({
    id,
    url: page.url(),
    selector: "[data-kp-concept-room-shell]",
    output: path.relative(process.cwd(), output),
    time: 750,
    viewport: { width: 900, height: 900 }
  });
}

async function captureAccessibilityStates(canonicalConceptUrl: string): Promise<void> {
  const url = new URL(canonicalConceptUrl);
  url.searchParams.set("checkpoint", "subtract-three");
  url.searchParams.set("t", "575");
  url.searchParams.set("projection", "coordinated");
  url.searchParams.set("mode", "touch");
  url.searchParams.delete("focus");
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "none" });
  await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.locator('[data-kp-symbolic-motion-state="native-reduced-motion"]').waitFor();
  await settle(page);
  await captureAccessibilityState("linear-room-reduced-motion-desktop", url.href);

  await page.emulateMedia({ reducedMotion: "no-preference", forcedColors: "active" });
  url.searchParams.append("focus", "term.two-x");
  await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.locator([
    '[data-kp-correspondence-keyboard-target="true"]',
    '[data-kp-correspondence-semantic-id="term.two-x"]'
  ].join("")).first().focus();
  await settle(page);
  await captureAccessibilityState("linear-room-forced-colors-desktop", url.href);

  await page.emulateMedia({ reducedMotion: "no-preference", forcedColors: "none" });
}

async function captureAccessibilityState(id: string, url: string): Promise<void> {
  const output = path.join(outputRoot, `${id}.png`);
  await page.locator("[data-kp-concept-visual-field]").screenshot({ path: output });
  captures.push({
    id,
    url,
    selector: "[data-kp-concept-visual-field]",
    output: path.relative(process.cwd(), output),
    time: 575,
    viewport: { width: 1280, height: 900 }
  });
}

async function settle(target: Page): Promise<void> {
  await target.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}
