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

for (const action of ["close", "section"] as const) test(`${action} during a loading comparison prevents late renderer acquisition`, async ({ page }) => {
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
  await page.getByRole("button", { name: action === "section" ? "Cross-section" : "Close comparison", exact: true }).click();
  const loaded = page.waitForResponse((response) => new URL(response.url()).pathname === referencePath);
  unblock(); await loaded;
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#reference-stage canvas")).toHaveCount(0);
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().pool.active)).toBe(1);
});

declare global { interface Window { __pilotBufferUploads?: number; __pilotSkipSurface?: boolean; __pilotSurfaceDraws?: number } }

async function setRange(page: Page, selector: string, value: number) {
  await page.locator(selector).evaluate((element, next) => {
    if (!(element instanceof HTMLInputElement)) throw new Error("Missing range control");
    element.value = String(next); element.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}
async function openSection(page: Page) {
  await page.goto(`${url}?example=section`);
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-status", "ready");
  await expect(page.locator("#section-controls")).toBeVisible();
}

test("manual front-facing inspection omits every surface draw without relying on opacity or SVG", async ({ page }, info) => {
  await page.addInitScript(() => {
    window.__pilotSurfaceDraws = 0;
    WebGL2RenderingContext.prototype.drawElements = new Proxy(WebGL2RenderingContext.prototype.drawElements, {
      apply(target, receiver, args) { window.__pilotSurfaceDraws! += 1; return Reflect.apply(target, receiver, args); }
    });
  });
  await page.setViewportSize({ width: 1280, height: 1100 });
  await openSection(page);
  await page.locator("#direct-canvas").focus();
  for (let i = 0; i < 14; i++) await page.keyboard.press("ArrowRight");
  for (let i = 0; i < 9; i++) await page.keyboard.press("ArrowDown");
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-azimuth", "90");
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-inspection", "0");
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().view.elevation)).toBe(1);
  await page.locator("#section-y").focus();
  await page.evaluate(() => { window.__pilotSurfaceDraws = 0; });
  await setRange(page, "#section-y", 1.5);
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-section-y", "1.5");
  expect(await page.evaluate(() => window.__pilotSurfaceDraws)).toBe(0);
  const before = await page.locator("#direct-canvas").screenshot();
  await page.getByLabel("Surface grid", { exact: true }).uncheck();
  expect((await page.locator("#direct-canvas").screenshot()).equals(before)).toBe(true);
  expect(await paintedPixels(page)).toBeGreaterThan(600);
  await expect(page.locator(".static-view")).toBeHidden();
  await page.screenshot({ path: info.outputPath("manual-front-no-mesh.png"), fullPage: true });
  await page.getByLabel("Surface grid", { exact: true }).check();
  await page.locator("#direct-canvas").focus();
  await page.keyboard.press("ArrowUp");
  await setRange(page, "#section-y", 1.6);
  await expect.poll(async () => Number(await page.locator("#direct-stage").getAttribute("data-section-y"))).toBeCloseTo(1.6, 8);
  expect(await page.evaluate(() => window.__pilotSurfaceDraws)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().stats!.uploads)).toBe(3);
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-inspection", "0");
});

test("section visual journey keeps one curve through the planar turn and restores the saved camera", async ({ page }, info) => {
  const errors: string[] = [], requests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => requests.push(request.url()));
  await page.setViewportSize({ width: 1280, height: 1100 });
  await openSection(page);
  await page.locator("#direct-canvas").focus(); await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowUp");
  await setRange(page, "#section-y", 1.5);
  await expect(page.locator("#section-equation")).toContainText("x² − 2.25");
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-section-y", "1.5");
  const saved = await page.evaluate(() => window.__kpGraphPilot!.inspect().view);
  await page.locator("#section-y").focus();
  const before = await page.locator("#direct-canvas").screenshot();
  await page.screenshot({ path: info.outputPath("section-3d.png"), fullPage: true });
  await page.getByRole("button", { name: "Inspect in 2D", exact: true }).click();
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-inspection", "1");
  expect(await paintedPixels(page)).toBeGreaterThan(600);
  await page.screenshot({ path: info.outputPath("section-planar.png"), fullPage: true });
  await page.locator("#direct-canvas").focus(); await page.keyboard.press("ArrowRight");
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().view.azimuth)).toBe(saved.azimuth);
  await page.getByRole("button", { name: "Return to 3D", exact: true }).click();
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-inspection", "0");
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().view)).toEqual(saved);
  // Compare the same unfocused canvas; native focus-visible follows input modality.
  await page.locator("#section-y").focus();
  const after = await page.locator("#direct-canvas").screenshot();
  await writeFile(info.outputPath("section-return.png"), after);
  expect(after.equals(before)).toBe(true);
  for (const [phase, progress] of [["fill-fading", .18], ["wire-only", .4], ["wire-fading", .55], ["clear-turn", .75]] as const) {
    await setRange(page, "#section-inspection", progress);
    await expect(page.locator("#direct-stage")).toHaveAttribute("data-inspection", String(progress));
    await page.screenshot({ path: info.outputPath(`section-${phase}.png`), fullPage: true });
  }
  await setRange(page, "#section-inspection", 1);
  await setRange(page, "#section-y", -2);
  await setRange(page, "#denominator", 8);
  await expect(page.locator("#section-equation")).toHaveText("z = (x² − 4) / 8 · vertex (0, -0.5)");
  await page.getByRole("button", { name: "Dark theme" }).click();
  await page.screenshot({ path: info.outputPath("section-dark.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: info.outputPath("section-phone.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const label of await page.locator(".axis-label").all()) {
    expect(await label.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
  }
  expect(requests.some((request) => /(?:graph-webgl-three|\/reference\.ts|\/three[._/])/.test(request))).toBe(false);
  expect(errors).toEqual([]);
});

test("withdrawn faces cannot occlude the section and its grid, including interrupted return", async ({ page }, info) => {
  await page.addInitScript(() => {
    // A reference with the actual surface submissions omitted detects depth
    // occlusion, even when a transparent surface is still submitted for its wire.
    WebGL2RenderingContext.prototype.drawElements = new Proxy(WebGL2RenderingContext.prototype.drawElements, {
      apply(target, receiver, args) {
        if (!window.__pilotSkipSurface) return Reflect.apply(target, receiver, args);
      }
    });
  });
  await page.setViewportSize({ width: 1280, height: 1100 });
  await openSection(page);
  await page.getByLabel("Surface grid", { exact: true }).uncheck();
  const canvas = page.locator("#direct-canvas");
  for (const [theme, y] of [["light", 1.5], ["dark", -2]] as const) {
    if (theme === "dark") await page.getByRole("button", { name: "Dark theme" }).click();
    await setRange(page, "#section-y", y);
    await setRange(page, "#section-inspection", .45);
    const before = await canvas.screenshot();
    await writeFile(info.outputPath(`unoccluded-${theme}.png`), before);
    // A round trip through the fill phase must not retain depth or stale paint.
    await setRange(page, "#section-inspection", .12);
    expect((await canvas.screenshot()).equals(before)).toBe(false);
    await setRange(page, "#section-inspection", .45);
    expect((await canvas.screenshot()).equals(before)).toBe(true);
    await page.evaluate(() => { window.__pilotSkipSurface = true; });
    await setRange(page, "#section-inspection", .45);
    expect((await canvas.screenshot()).equals(before)).toBe(true);
    await page.evaluate(() => { window.__pilotSkipSurface = false; });
    await setRange(page, "#section-inspection", .45);
    await page.getByLabel("Surface grid", { exact: true }).check();
    // The same frame still has a real wire trace; we have not hidden the whole
    // surface early merely to make the zero-fill comparison pass.
    expect((await canvas.screenshot()).equals(before)).toBe(false);
    await page.screenshot({ path: info.outputPath(`wire-only-${theme}.png`), fullPage: true });
    await page.getByLabel("Surface grid", { exact: true }).uncheck();
    await setRange(page, "#section-inspection", .8);
    const settled = await canvas.screenshot();
    await page.getByLabel("Surface grid", { exact: true }).check();
    expect((await canvas.screenshot()).equals(settled)).toBe(true);
    await page.getByLabel("Surface grid", { exact: true }).uncheck();
  }
});

test("section playback reverses, scrubs, switches mode and recovers without geometry uploads or stale clocks", async ({ page }, info) => {
  await page.addInitScript(() => {
    window.__pilotBufferUploads = 0;
    WebGL2RenderingContext.prototype.bufferData = new Proxy(WebGL2RenderingContext.prototype.bufferData, {
      apply(target, receiver, args) { window.__pilotBufferUploads! += 1; return Reflect.apply(target, receiver, args); }
    });
  });
  await openSection(page);
  await setRange(page, "#section-y", -2.8);
  await page.getByRole("button", { name: "Sweep slice", exact: true }).click();
  const intervals = await page.evaluate(async () => {
    const samples: number[] = []; let previous = performance.now();
    for (let i = 0; i < 60; i++) await new Promise<void>((resolve) => requestAnimationFrame((now) => {
      samples.push(now - previous); previous = now; resolve();
    }));
    return samples.slice(1).sort((a, b) => a - b);
  });
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().view.section.y)).toBeGreaterThan(-2.8);
  await page.getByRole("button", { name: "Inspect in 2D", exact: true }).click();
  const turnIntervals = await page.evaluate(async () => {
    const samples: number[] = []; let previous = performance.now();
    // Sample the actual translucent interval, then interrupt before 2D settles.
    for (let i = 0; i < 120; i++) {
      await new Promise<void>((resolve) => requestAnimationFrame((now) => {
        samples.push(Math.max(0, now - previous)); previous = now; resolve();
      }));
      if (window.__kpGraphPilot!.inspect().view.section.inspection >= .65) break;
    }
    return samples.slice(1).sort((a, b) => a - b);
  });
  await expect.poll(() => page.evaluate(() => window.__kpGraphPilot!.inspect().view.section.inspection)).toBeGreaterThan(.1);
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().sectionClocks.scan)).toBe("paused");
  await page.getByRole("button", { name: "Return to 3D", exact: true }).click();
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-inspection", "0");
  await setRange(page, "#section-inspection", .73);
  await page.getByRole("button", { name: "Saddle surface", exact: true }).click();
  await expect(page.locator("#section-controls")).toBeHidden();
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().sectionClocks)).toEqual({ scan: "paused", turn: "paused" });
  await page.getByRole("button", { name: "Cross-section", exact: true }).click();
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-inspection", "0.73");
  expect(await page.evaluate(() => window.__pilotBufferUploads)).toBe(3);
  const stats = await page.evaluate(() => window.__kpGraphPilot!.inspect().stats);
  const runtime = { sample: "saddle section sweep", rafP50Ms: intervals[Math.floor(intervals.length * .5)],
    rafP95Ms: intervals[Math.ceil(intervals.length * .95) - 1], rafMaxMs: intervals.at(-1), stats,
    withdrawal: { samples: turnIntervals.length, rafP50Ms: turnIntervals[Math.floor(turnIntervals.length * .5)],
      rafP95Ms: turnIntervals[Math.ceil(turnIntervals.length * .95) - 1], rafMaxMs: turnIntervals.at(-1) } };
  await writeFile(info.outputPath("section-runtime.json"), JSON.stringify(runtime, null, 2));
  console.log(`Section sweep: p95 RAF ${runtime.rafP95Ms?.toFixed(2)}ms; p95 JS submission ${stats?.submitP95Ms.toFixed(2)}ms; ${stats?.uploads} retained uploads.`);
  console.log(`Section withdrawal: p95 RAF ${runtime.withdrawal.rafP95Ms?.toFixed(2)}ms from ${turnIntervals.length} intervals.`);
  await page.locator("#direct-canvas").evaluate((element) => {
    if (!(element instanceof HTMLCanvasElement)) throw new Error("Missing canvas");
    const extension = element.getContext("webgl2")?.getExtension("WEBGL_lose_context");
    if (!extension) throw new Error("Need context loss extension for this check");
    extension.loseContext();
  });
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-status", "fallback");
  await expect(page.locator(".static-view svg[data-entity-id='saddle-section:curve']")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sweep slice", exact: true })).toBeDisabled();
  const lost = await page.evaluate(() => window.__kpGraphPilot!.inspect().view);
  await page.getByRole("button", { name: "Retry graphics" }).click();
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-status", "ready");
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().view)).toEqual(lost);
  await page.getByRole("button", { name: "Return to 3D", exact: true }).click();
  await page.evaluate(() => window.__kpGraphPilot!.dispose());
  const disposed = await page.evaluate(() => window.__kpGraphPilot!.inspect());
  await page.waitForTimeout(120);
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().stats!.frames)).toBe(disposed.stats!.frames);
  expect(disposed.pool.active).toBe(0);
});

test("section playback pauses offscreen and reduced motion still exposes both exact endpoints", async ({ page }) => {
  await openSection(page);
  await page.getByRole("button", { name: "Inspect in 2D", exact: true }).click();
  await page.evaluate(() => { document.body.style.paddingBottom = "2000px"; scrollTo(0, document.body.scrollHeight); });
  await expect.poll(() => page.evaluate(() => window.__kpGraphPilot!.inspect().sectionClocks.turn)).toBe("paused");
  const paused = await page.evaluate(() => window.__kpGraphPilot!.inspect());
  await page.waitForTimeout(120);
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().stats!.frames)).toBe(paused.stats!.frames);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setRange(page, "#section-inspection", 0);
  await page.getByRole("button", { name: "Inspect in 2D", exact: true }).click();
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-inspection", "1");
  await page.getByRole("button", { name: "Return to 3D", exact: true }).click();
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-inspection", "0");
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().view.azimuth)).toBe(48);
});

test("section fallback keeps its equation and projection editable without GPU or autoplay", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = new Proxy(HTMLCanvasElement.prototype.getContext, {
      apply(target, receiver, args) { return args[0] === "webgl2" ? null : Reflect.apply(target, receiver, args); }
    });
  });
  await page.goto(`${url}?example=section`);
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-status", "fallback");
  await page.getByRole("button", { name: "Inspect in 2D", exact: true }).click();
  await expect(page.locator("#direct-stage")).toHaveAttribute("data-inspection", "1");
  await setRange(page, "#section-y", -3);
  await expect(page.locator("#section-equation")).toContainText("x² − 9");
  await expect(page.locator(".static-view svg")).toBeVisible();
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().pool.active)).toBe(0);
  expect(await page.evaluate(() => window.__kpGraphPilot!.inspect().sectionClocks)).toEqual({ scan: "paused", turn: "paused" });
});
