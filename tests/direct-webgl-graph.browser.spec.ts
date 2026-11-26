import { test, expect, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import type {} from "../src/experiments/direct-webgl-graph/page.ts";

// Import the page's ambient debug type without executing its browser entry.
// The actual page is loaded through the shared service in every test below.
const url = "/experiments/direct-webgl-graph/";
async function paintedPixels(page: Page): Promise<number> {
  const shot = await page.locator("#direct-canvas").screenshot();
  return page.evaluate(async (base64) => {
    const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${base64}`)).blob());
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Missing pixel inspection context");
    context.drawImage(bitmap, 0, 0); bitmap.close();
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let painted = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (Math.max(Math.abs(pixels[i]! - pixels[0]!), Math.abs(pixels[i + 1]! - pixels[1]!), Math.abs(pixels[i + 2]! - pixels[2]!)) > 12) painted++;
    }
    return painted;
  }, shot.toString("base64"));
}
async function open(page: Page) {
  await page.goto(url);
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-status", "ready");
  await expect.poll(() => page.evaluate(() => window.__kpGraphPilot?.inspect().stats?.frames ?? 0)).toBeGreaterThan(0);
}
test("grid and saddle paint, rotate, theme and resize without requesting Three.js", async ({ page }, info) => {
  const errors: string[] = [], requests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => requests.push(request.url()));
  await page.setViewportSize({ width: 1280, height: 1000 });
  await open(page);
  expect(await paintedPixels(page)).toBeGreaterThan(5000);
  await page.screenshot({ path: info.outputPath("saddle.png"), fullPage: true });
  await page.locator("#direct-canvas").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-azimuth", "51");
  await page.keyboard.press("Home");
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-azimuth", "48");
  await page.getByRole("button", { name: "3D grid", exact: true }).click();
  expect(await paintedPixels(page)).toBeGreaterThan(300);
  await page.screenshot({ path: info.outputPath("grid.png"), fullPage: true });
  await expect(page.locator("#saddle-controls")).toBeHidden();
  await page.getByRole("button", { name: "Saddle surface", exact: true }).click();
  await page.getByLabel("Coordinate planes", { exact: true }).check();
  await page.screenshot({ path: info.outputPath("saddle-with-planes.png"), fullPage: true });
  await page.getByLabel("Coordinate planes", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Dark theme" }).click();
  await page.screenshot({ path: info.outputPath("dark-saddle.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.locator("#direct-canvas").evaluate((element) => element.clientWidth)).toBeLessThan(390);
  await page.screenshot({ path: info.outputPath("phone.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(requests.some((request) => /(?:graph-webgl-three|\/reference\.ts|\/three[._/])/.test(request))).toBe(false);
  expect(errors).toEqual([]);
});

test("playback changes only uniforms, can reverse and scrub, and stops drawing when idle", async ({ page }, info) => {
  await page.addInitScript(() => {
    window.__pilotBufferUploads = 0;
    WebGL2RenderingContext.prototype.bufferData = new Proxy(WebGL2RenderingContext.prototype.bufferData, {
      apply(target, receiver, args) { window.__pilotBufferUploads! += 1; return Reflect.apply(target, receiver, args); }
    });
  });
  await open(page);
  expect(await page.evaluate(() => window.__pilotBufferUploads)).toBe(3);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  const intervals = await page.evaluate(async () => {
    const samples: number[] = []; let previous = performance.now();
    for (let i = 0; i < 60; i++) await new Promise<void>((resolve) => requestAnimationFrame((now) => {
      samples.push(Math.max(0, now - previous)); previous = now; resolve();
    }));
    return samples.slice(1).sort((a, b) => a - b);
  });
  const beforeReverse = await page.evaluate(() => window.__kpGraphPilot!.inspect().view.denominator);
  expect(beforeReverse).toBeGreaterThan(4);
  await page.getByRole("button", { name: "Reverse", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__kpGraphPilot!.inspect().view.denominator)).toBeLessThan(beforeReverse);
  await page.locator("#denominator").focus(); await page.keyboard.press("End");
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-denominator", "8");
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  const idle = await page.evaluate(() => window.__kpGraphPilot!.inspect().stats!.frames);
  await page.waitForTimeout(180);
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().stats!.frames)).toBe(idle);
  expect(await page.evaluate(() => window.__pilotBufferUploads)).toBe(3);
  const device = await page.locator("#direct-canvas").evaluate((element) => {
    if (!(element instanceof HTMLCanvasElement)) throw new Error("Missing canvas");
    const gl = element.getContext("webgl2");
    const debug = gl?.getExtension("WEBGL_debug_renderer_info");
    return { renderer: gl && debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : "unavailable",
      canvas: [element.width, element.height], devicePixelRatio, userAgent: navigator.userAgent };
  });
  const runtime = { rafP50Ms: intervals[Math.floor(intervals.length * .5)],
    rafP95Ms: intervals[Math.ceil(intervals.length * .95) - 1], rafMaxMs: intervals.at(-1), device,
    ...await page.evaluate(() => window.__kpGraphPilot!.inspect()) };
  await writeFile(info.outputPath("runtime.json"), JSON.stringify(runtime, null, 2));
  await info.attach("runtime.json", { path: info.outputPath("runtime.json"), contentType: "application/json" });
  console.log(`Direct GPU: p95 RAF ${runtime.rafP95Ms?.toFixed(2)}ms; p95 JS submission ${runtime.stats?.submitP95Ms.toFixed(2)}ms; ${runtime.stats?.uploads} retained uploads.`);
});

test("comparison loads explicitly, follows the camera and releases its lease on close", async ({ page }, info) => {
  await open(page);
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().pool.active)).toBe(1);
  await page.getByRole("button", { name: "Compare current renderer" }).click();
  await page.locator("#reference-stage").scrollIntoViewIfNeeded();
  await expect(page.locator("#reference-stage .graph-webgl")).toHaveAttribute("data-kp-webgl-status", "ready");
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().pool.active)).toBe(2);
  const before = await page.locator("#reference-stage canvas").screenshot();
  await page.locator("#direct-canvas").focus(); await page.keyboard.press("ArrowRight");
  await page.locator("#reference-stage").scrollIntoViewIfNeeded();
  expect(await page.locator("#reference-stage canvas").screenshot()).not.toEqual(before);
  await page.screenshot({ path: info.outputPath("comparison.png"), fullPage: true });
  await page.getByRole("button", { name: "Close comparison" }).click();
  await expect.poll(() => page.evaluate(() => window.__kpGraphPilot!.inspect().pool.active)).toBe(1);
  await page.getByRole("button", { name: "Compare current renderer" }).click();
  await page.getByRole("button", { name: "Close comparison" }).click();
  await expect(page.locator("#reference-stage canvas")).toHaveCount(0);
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().pool.active)).toBe(1);
});

test("loss and retry preserve the sample and camera; disposal cancels all owned work", async ({ page }) => {
  await open(page);
  await page.locator("#denominator").focus(); await page.keyboard.press("End");
  await page.locator("#direct-canvas").focus(); await page.keyboard.press("ArrowRight");
  await page.locator("#direct-canvas").evaluate((element) => {
    if (!(element instanceof HTMLCanvasElement)) throw new Error("Missing canvas");
    const extension = element.getContext("webgl2")?.getExtension("WEBGL_lose_context");
    if (!extension) throw new Error("Context loss extension required for this browser check");
    extension.loseContext();
  });
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-status", "fallback");
  await expect(page.locator(".static-view svg")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeDisabled();
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().pool.active)).toBe(0);
  await page.getByRole("button", { name: "Retry graphics" }).click();
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-status", "ready");
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-denominator", "8");
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-azimuth", "51");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.evaluate(() => window.__kpGraphPilot!.dispose());
  const snapshot = await page.evaluate(() => window.__kpGraphPilot!.inspect());
  expect(snapshot.pool).toMatchObject({ active: 0, waiting: 0 });
  await page.waitForTimeout(120);
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().stats!.frames)).toBe(snapshot.stats!.frames);
});

test("offscreen playback pauses and reduced motion reaches exact endpoints", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.evaluate(() => { document.body.style.paddingBottom = "2000px"; scrollTo(0, document.body.scrollHeight); });
  await expect.poll(() => page.evaluate(() => window.__kpGraphPilot!.inspect().playing)).toBe("paused");
  const frames = await page.evaluate(() => window.__kpGraphPilot!.inspect().stats!.frames);
  await page.waitForTimeout(120);
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().stats!.frames)).toBe(frames);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-denominator", "8");
  await page.getByRole("button", { name: "Reverse", exact: true }).click();
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-denominator", "4");
});

test("unavailable WebGL has a static source view and explicit retry without an animation loop", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = new Proxy(HTMLCanvasElement.prototype.getContext, {
      apply(target, receiver, args) { return args[0] === "webgl2" ? null : Reflect.apply(target, receiver, args); }
    });
  });
  await page.goto(url);
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-status", "fallback");
  await expect(page.locator(".static-view svg")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeDisabled();
  await page.locator("#denominator").focus(); await page.keyboard.press("End");
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-denominator", "8");
  await page.getByRole("button", { name: "Retry graphics" }).click();
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-status", "fallback");
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().pool.active)).toBe(0);
});

test("closing a loading comparison prevents late renderer acquisition", async ({ page }) => {
  let unblock!: () => void, acknowledge!: () => void;
  const blocked = new Promise<void>((resolve) => { unblock = resolve; });
  const requested = new Promise<void>((resolve) => { acknowledge = resolve; });
  const referencePath = "/src/experiments/direct-webgl-graph/reference.ts";
  // Vite appends HMR revisions; intercept module identity independently of them.
  await page.route((request) => request.pathname === referencePath, async (route) => {
    acknowledge(); await blocked; await route.continue();
  });
  await open(page);
  await page.getByRole("button", { name: "Compare current renderer" }).click();
  await requested;
  await page.getByRole("button", { name: "Close comparison" }).click();
  const loaded = page.waitForResponse((response) => new URL(response.url()).pathname === referencePath);
  unblock(); await loaded;
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#reference-stage canvas")).toHaveCount(0);
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().pool.active)).toBe(1);
});

declare global { interface Window { __pilotBufferUploads?: number } }
