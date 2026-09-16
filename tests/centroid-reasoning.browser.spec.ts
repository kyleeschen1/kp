import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
const route = "/experiments/centroid-reasoning/";

test("centroid is a source-backed readable record without JavaScript", async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(route);
  await expect(page.getByRole("heading", { name: "Two loops, one idea" })).toBeVisible();
  await expect(page.locator("[data-centroid-excerpt]")).toHaveCount(4);
  await page.screenshot({ path: info.outputPath("centroid-desktop.png"), fullPage: true });
  const disclosure = page.getByText("See both complete source files", { exact: true });
  await disclosure.focus(); await page.keyboard.press("Enter");
  for (const revision of ["before", "after"]) {
    const code = page.locator(`[data-centroid-source="${revision}"] code`);
    await expect(code).toBeVisible();
    expect(await code.textContent()).toBe(readFileSync(`examples/programming/centroid-${revision}.ts`, "utf8"));
  }
  await disclosure.click();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator('[data-centroid-source="before"]')).toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await page.setViewportSize({ width: 390, height: 844 });
  await disclosure.click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("centroid-phone.png"), fullPage: true });
  await context.close();
});

test("local extraction animates steps and rewinds names through the native painter", async ({ page }, info) => {
  await page.goto(route);
  const root = page.locator("[data-centroid-local-inspection]");
  await page.getByRole("button", { name: "Trace the first loop" }).click();
  const seek = page.getByRole("slider", { name: "Inspect first-loop extraction" });
  const native = root.locator("[data-centroid-native]");
  const theater = root.locator("[data-kp-typescript-token-theater]");
  const sample = async (p: number) => { await seek.fill(String(p)); await seek.dispatchEvent("input"); };
  await expect(native).toContainText("const cx = sx / xs.length");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect.poll(async () => Number(await root.getAttribute("data-centroid-progress"))).toBeGreaterThan(0);
  expect(Number(await root.getAttribute("data-centroid-progress"))).toBeLessThan(.5);
  await expect(root).toHaveAttribute("data-centroid-progress", "0.5", { timeout: 6000 });
  await expect(native).toContainText("return sx / xs.length");
  await seek.press("ArrowRight");
  await expect(root).toHaveAttribute("data-centroid-progress", "1", { timeout: 6000 });
  await expect(native).toContainText("return s / vs.length");
  const pose = () => theater.locator("[data-kp-typescript-token-id]").evaluateAll(nodes => nodes.map(node => node.outerHTML).sort());
  await sample(.61); const first = await pose();
  await sample(.85); await sample(.61); expect(await pose()).toEqual(first);
  await page.mouse.wheel(0, 100); await expect(root).toHaveAttribute("data-centroid-progress", "0.61");
  const stageSize = await root.locator("[data-centroid-stage]").boundingBox();
  for (const p of [0, .15, .3, .5, .65, .8, 1]) {
    await sample(p);
    const box = await root.locator("[data-centroid-stage]").boundingBox();
    expect(box?.height).toBe(stageSize?.height);
    expect(box?.width).toBe(stageSize?.width);
    await root.screenshot({ path: info.outputPath(`centroid-motion-${p}.png`) });
  }
  const track = await seek.boundingBox();
  await page.mouse.move(track!.x + track!.width * .7, track!.y + track!.height / 2);
  await page.mouse.down(); await page.mouse.move(track!.x + track!.width * .25, track!.y + track!.height / 2, { steps: 10 }); await page.mouse.up();
  const held = await root.getAttribute("data-centroid-progress");
  expect(Number(held)).toBeGreaterThan(.15); expect(Number(held)).toBeLessThan(.35);
  await expect(root).toHaveAttribute("data-centroid-progress", held!);
  await sample(.24); await page.getByRole("button", { name: "Return to reading" }).click();
  await expect(page.locator('[data-centroid-excerpt="helper"]')).toBeVisible();
  await page.getByRole("button", { name: "Trace the first loop" }).click();
  await expect(root).toHaveAttribute("data-centroid-progress", "0.24");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator('[data-centroid-excerpt="helper"]')).toBeVisible();
  await expect(root.locator("[data-centroid-stage]")).toBeHidden();
});

test("reduced motion reaches named endpoints and stale source cannot mount", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);
  await page.getByRole("button", { name: "Trace the first loop" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator("[data-centroid-local-inspection]")).toHaveAttribute("data-centroid-progress", "0.5");
  await page.route("**/experiments/centroid-reasoning/", async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(/data-centroid-source-pin="[^"]+"/, 'data-centroid-source-pin="stale"') });
  });
  await page.goto(route);
  await expect(page.locator("[data-centroid-error]")).toContainText("source and motion differ");
  await expect(page.locator('[data-centroid-excerpt="helper"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Trace the first loop" })).toBeHidden();
});
