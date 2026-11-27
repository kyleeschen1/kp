import { test, expect, type Page } from "@playwright/test";

const path = "/experiments/saddle-section-reference/";
async function state(page: Page) {
  return page.evaluate(async () => {
    // Reuse Vite's exact entry URL, including its revision; importing a stale URL would boot a second host.
    const entry = document.querySelector<HTMLScriptElement>('script[src*="/src/experiments/saddle-section-reference/app.ts"]');
    if (!entry) throw new Error("Missing section reference entry");
    const url = entry.src;
    const { players }: typeof import("../src/experiments/saddle-section-reference/app.ts") = await import(url);
    return players.map(player => ({ snapshot: player.snapshot(), metrics: player.inspect() }));
  });
}
async function open(page: Page) {
  await page.goto(path);
  await expect(page.locator('.kp-section-player[data-renderer="ready"]')).toHaveCount(2);
  await expect.poll(async () => (await state(page))[0]!.metrics.gpu?.frames ?? 0).toBeGreaterThan(0);
}
test("two independent occurrences edit, reverse, return and restore precise state from their URL", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await open(page);
  const first = page.locator('[data-occurrence="0"]'), second = page.locator('[data-occurrence="1"]');
  await first.locator(".stage").focus(); await page.keyboard.press("ArrowLeft");
  const camera = (await state(page))[0]!.snapshot.view;
  await first.getByRole("button", { name: "Inspect in 2D" }).click();
  await expect.poll(async () => (await state(page))[0]!.snapshot.view.inspection).toBeGreaterThan(.15);
  await first.getByRole("button", { name: "Return to 3D" }).click();
  await expect(first.locator(".kp-section-player")).toHaveAttribute("data-inspection", "0");
  expect((await state(page))[0]!.snapshot.view).toEqual(camera);
  await first.locator("[data-denominator]").fill("6.123456789"); await first.locator("[data-y]").fill("-2");
  await first.getByRole("button", { name: "Inspect in 2D" }).click();
  await expect(first.locator(".kp-section-player")).toHaveAttribute("data-surface", "absent");
  await expect(first.locator(".kp-section-player")).toHaveAttribute("data-inspection", "1");
  await expect(second.locator(".kp-section-player")).toHaveAttribute("data-inspection", "0");
  expect((await state(page))[1]!.snapshot.source).toMatchObject({ y: 1, denominator: 4 });
  expect((await state(page)).map(s => s.metrics.gpu?.uploads)).toEqual([3, 3]);
  await expect.poll(() => new URL(page.url()).searchParams.get("sections")).toContain("6.123456789");
  await expect.poll(() => new URL(page.url()).searchParams.get("sections")).toContain('"inspection":1');
  await page.screenshot({ path: test.info().outputPath("independent-sections-light.png"), fullPage: true });
  const before = (await state(page)).map(s => ({ source: s.snapshot.source, view: s.snapshot.view }));
  await page.reload(); await expect(page.locator(".kp-section-player")).toHaveCount(2);
  expect((await state(page)).map(s => ({ source: s.snapshot.source, view: s.snapshot.view }))).toEqual(before);
  await page.getByRole("button", { name: "Dark theme" }).click();
  expect((await state(page)).map(s => s.metrics.gpu?.uploads)).toEqual([3, 3]);
  await page.screenshot({ path: test.info().outputPath("independent-sections-dark.png"), fullPage: true });
  expect(errors).toEqual([]);
});
test("invalid edits and links leave no substituted mathematical source", async ({ page }) => {
  await open(page); const first = page.locator('[data-occurrence="0"]');
  await first.locator("[data-denominator]").fill("2");
  await expect(first.locator("[data-error]")).toContainText("4…8");
  expect((await state(page))[0]!.snapshot.source.denominator).toBe(4);
  await page.goto(`${path}?sections=${encodeURIComponent('[{"source":{"kind":"sphere"}}]')}`);
  await expect(page.locator("#error")).toContainText("No substituted source");
  await expect(page.locator(".kp-section-player")).toHaveCount(0);
});
test("context loss keeps a static section, remount releases the lease, and reduced motion settles directly", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" }); await open(page);
  const first = page.locator('[data-occurrence="0"]');
  await first.getByRole("button", { name: "Inspect in 2D" }).click();
  await expect(first.locator(".kp-section-player")).toHaveAttribute("data-inspection", "1");
  await first.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const extension = canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context");
    if (!extension) throw new Error("Context loss extension unavailable"); extension.loseContext();
  });
  await expect(first.locator(".kp-section-player")).toHaveAttribute("data-renderer", "unavailable");
  await expect(first.locator("canvas")).toBeHidden(); await expect(first.locator("svg")).toBeVisible();
  await first.getByRole("button", { name: "Return to 3D" }).click();
  await expect(first.locator(".kp-section-player")).toHaveAttribute("data-inspection", "0");
  await first.locator("summary").click();
  for (let n = 0; n < 3; n++) {
    await first.getByRole("button", { name: "Remount this view" }).click();
    await expect(first.locator('.kp-section-player[data-renderer="ready"]')).toHaveCount(1);
    await expect(first.locator("svg")).toHaveCount(0);
  }
  expect((await state(page))[1]!.metrics.renderer.status).toBe("ready");
});
test("phone layout stays bounded and offscreen occurrences pause", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await open(page);
  const first = page.locator('[data-occurrence="0"]');
  await first.getByRole("button", { name: "Inspect in 2D" }).click();
  await expect.poll(async () => (await state(page))[0]!.snapshot.view.inspection).toBeGreaterThan(0);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(async () => (await state(page))[0]!.snapshot.status).not.toBe("playing");
  const frozen = (await state(page))[0]!.snapshot.view.inspection;
  await page.waitForTimeout(150); expect((await state(page))[0]!.snapshot.view.inspection).toBe(frozen);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("sections-phone.png") });
});
test("unavailable WebGL retains source-linked static paint and direct inspection without scheduling motion", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value(this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
        return kind === "webgl2" ? null : Reflect.apply(original, this, [kind, ...args]);
      }
    });
  });
  await page.goto(path);
  const first = page.locator('[data-occurrence="0"]');
  await expect(page.locator('.kp-section-player[data-renderer="unavailable"]')).toHaveCount(2);
  await expect(first.locator("svg")).toBeVisible();
  const before = await first.locator("svg").innerHTML();
  await first.locator("[data-y]").fill("-2"); await first.locator("[data-denominator]").fill("8");
  await expect(first.locator("[data-equation]")).toHaveText("y = -2 → z = (x² − (-2)²) / 8");
  expect(await first.locator("svg").innerHTML()).not.toBe(before);
  await first.getByRole("button", { name: "Inspect in 2D" }).click();
  await expect(first.locator(".kp-section-player")).toHaveAttribute("data-inspection", "1");
  expect((await state(page))[0]!.snapshot.status).toBe("paused");
  await page.screenshot({ path: test.info().outputPath("static-section-fallback.png"), fullPage: true });
  await first.locator("[data-detour]").click(); await expect(page).toHaveURL(/\/why\//);
  await page.getByRole("button", { name: "Reveal the reasoning" }).click();
  await expect(page.locator("[data-answer]")).toBeVisible(); await expect(page.locator("svg")).toBeVisible();
  await expect(page.locator(".kp-section-player")).toHaveAttribute("data-renderer", "unavailable");
  await page.getByRole("link", { name: "Return to Section 1" }).click();
  await expect(first.locator(".kp-section-player")).toHaveAttribute("data-inspection", "1");
});
test("a question preserves prediction and returns to the exact source, camera, object and progress after reload", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await open(page);
  const second = page.locator('[data-occurrence="1"]');
  await second.locator("[data-denominator]").fill("7.125"); await second.locator("[data-y]").fill("-1.25");
  await second.locator(".stage").focus(); await page.keyboard.press("ArrowLeft");
  await second.locator("[data-scrub]").fill("0.371");
  const origin = (await state(page)).map(s => ({ source: s.snapshot.source, view: s.snapshot.view }));
  await second.locator("[data-detour]").click();
  await expect(page).toHaveURL(/\/why\//);
  const context = JSON.parse(new URL(page.url()).searchParams.get("context")!);
  expect(context.origin).toEqual(origin);
  await expect(page.locator("[data-answer]")).toBeHidden(); await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "Different curve", exact: true }).click();
  await page.reload(); await expect(page.getByRole("button", { name: "Different curve", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Reveal the reasoning" }).click();
  await expect(page.locator("[data-answer]")).toContainText("The x/z curve is the same");
  await page.getByRole("button", { name: "Compare y = 1.25", exact: true }).click();
  await page.getByRole("button", { name: "See in 3D" }).click();
  await expect(page.locator(".kp-section-player")).toHaveAttribute("data-inspection", "0");
  await expect.poll(() => new URL(page.url()).searchParams.get("context")).toContain('"inspection":0');
  await page.reload(); await expect(page.locator("[data-answer]")).toBeVisible();
  await expect(page.locator("[data-equation]")).toContainText("y = 1.25");
  await expect(page.locator("[data-prediction]")).toContainText("a different curve");
  await page.screenshot({ path: test.info().outputPath("question-revealed.png"), fullPage: true });
  await page.getByRole("link", { name: "Return to Section 2" }).click();
  await expect(page.locator('.kp-section-player[data-renderer="ready"]')).toHaveCount(2);
  expect((await state(page)).map(s => ({ source: s.snapshot.source, view: s.snapshot.view }))).toEqual(origin);
  await expect(second.locator("[data-detour]")).toBeFocused();
  // Native scroll offsets round to device pixels; source/camera/progress above remain exact.
  await expect.poll(async () => Math.abs(await second.locator(".stage").evaluate(el => el.getBoundingClientRect().top) - context.returnTo.offset)).toBeLessThanOrEqual(1);
  await page.goBack(); await expect(page).toHaveURL(/\/why\//); await expect(page.locator("[data-answer]")).toBeVisible();
  await page.goForward(); await expect(page.locator('.kp-section-player[data-renderer="ready"]')).toHaveCount(2);
  expect((await state(page)).map(s => ({ source: s.snapshot.source, view: s.snapshot.view }))).toEqual(origin);
  expect(errors).toEqual([]);
});
test("phone return targets the selected object and remount does not leave stale navigation owners", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await open(page);
  const second = page.locator('[data-occurrence="1"]');
  await second.locator("summary").click(); await second.getByRole("button", { name: "Remount this view" }).click();
  await second.locator("[data-y]").fill("0");
  await second.locator("[data-detour]").click(); await expect(page).toHaveURL(/\/why\//);
  const context = JSON.parse(new URL(page.url()).searchParams.get("context")!);
  await page.getByRole("button", { name: "Unsure", exact: true }).click(); await page.getByRole("button", { name: "Reveal the reasoning" }).click();
  await expect(page.locator("[data-answer]")).toContainText("two planes also coincide");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("question-phone.png"), fullPage: true });
  await page.getByRole("link", { name: "Return to Section 2" }).click();
  await expect(second.locator("[data-detour]")).toBeFocused();
  await expect.poll(async () => Math.abs(await second.locator(".stage").evaluate(el => el.getBoundingClientRect().top) - context.returnTo.offset)).toBeLessThanOrEqual(1);
  await expect(second.locator("[data-y]")).toHaveValue("0");
});
test("invalid drafts and foreign or missing context never create a substituted question", async ({ page }) => {
  await open(page); const first = page.locator('[data-occurrence="0"]');
  await first.locator("[data-y]").fill("4"); await first.locator("[data-detour]").click();
  await expect(page.locator("#error")).toContainText("Fix invalid parameter"); expect(page.url()).not.toContain("/why/");
  await first.locator("[data-y]").fill("2"); await first.locator("[data-detour]").click();
  await expect(page).toHaveURL(/\/why\//);
  const context = JSON.parse(new URL(page.url()).searchParams.get("context")!); context.returnTo.sourceId = "foreign";
  await page.goto(`${path}why/?context=${encodeURIComponent(JSON.stringify(context))}`);
  await expect(page.getByRole("alert")).toContainText("Return context"); await expect(page.locator("canvas")).toHaveCount(0);
  await page.goto(`${path}why/`); await expect(page.getByRole("alert")).toContainText("Missing");
});
