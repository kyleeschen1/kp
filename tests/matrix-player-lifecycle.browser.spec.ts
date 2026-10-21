import { expect, test, type Page } from "@playwright/test";

const route = "/experiments/matrix-column-combinations/";
const frames = (page: Page) => page.evaluate(() => new Promise<void>(resolve =>
  requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
const seek = (page: Page, progress: number) => page.locator("[data-scrub]").evaluate((slider, value) => {
  if (!(slider instanceof HTMLInputElement)) throw new Error("Missing matrix scrubber");
  slider.value = String(value); slider.dispatchEvent(new Event("input", { bubbles: true }));
}, progress);

test("cold matrix preparation waits for its native font faces", async ({ page }) => {
  let release = () => {};
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/KaTeX_Size3-Regular.woff2*", async request => { await held; await request.continue(); });
  const requested = page.waitForRequest(request => request.url().includes("KaTeX_Size3-Regular.woff2"));
  await page.goto(`${route}?input=dependent-columns#placed`, { waitUntil: "domcontentloaded" });
  await requested;
  const root = page.locator("#comb-player");
  await expect(root).toHaveAttribute("aria-busy", "true");
  await expect(root).not.toHaveAttribute("data-ready", "true");
  release();
  await expect(root).toHaveAttribute("data-ready", "true");
  expect(await page.evaluate(() => ["KaTeX_Main", "KaTeX_Size3"].every(face => document.fonts.check(`20px ${face}`)))).toBe(true);
  await expect(page.getByRole("slider")).toHaveValue("1");
});

test("reading updates preserve playback and only stage changes rebuild material", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${route}?input=dependent-columns`);
  await expect(page.locator("#comb-player")).toHaveAttribute("data-ready", "true"); await frames(page);
  const material = await page.locator(".comb-paint").first().elementHandle();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByText("Check your reasoning", { exact: true }).evaluate(summary => { summary.closest("details")!.open = true; });
  await frames(page);
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  expect(await material!.evaluate(node => node.isConnected)).toBe(true);
  await page.evaluate(() => document.dispatchEvent(new Event("kp-matrix-example-config")));
  await frames(page);
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  expect(await material!.evaluate(node => node.isConnected)).toBe(true);
  // Motion-only changes pause at the held sample, without re-cloning math.
  await page.evaluate(() => {
    document.documentElement.dataset["matrixMotion"] = "steps";
    document.dispatchEvent(new Event("kp-matrix-example-config"));
  });
  await expect(page.getByRole("button", { name: "Next step", exact: true })).toBeVisible();
  expect(await material!.evaluate(node => node.isConnected)).toBe(true);
  const progress = await page.getByRole("slider").inputValue();
  await page.setViewportSize({ width: 900, height: 950 }); await frames(page);
  expect(await material!.evaluate(node => node.isConnected)).toBe(false);
  await expect(page.getByRole("slider")).toHaveValue(progress);
});

test("phone playback completes across changing cue heights without preparing again", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${route}?input=dependent-columns`);
  await expect(page.locator("#comb-player")).toHaveAttribute("data-ready", "true"); await frames(page);
  const material = await page.locator(".comb-paint").first().elementHandle();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByRole("slider")).toHaveValue("1", { timeout: 16000 });
  expect(await material!.evaluate(node => node.isConnected)).toBe(true);
  expect(new URL(page.url()).hash).toBe("#placed");
});

for (const input of ["dependent-columns", "signed", "larger"]) {
  test(`${input} result placement preserves glyph geometry at the native handoff`, async ({ page }, info) => {
    await page.setViewportSize({ width: 1200, height: 950 });
    await page.goto(`${route}?input=${input}#sum`);
    const root = page.locator("#comb-player");
    await expect(root).toHaveAttribute("data-ready", "true"); await frames(page);
    const measure = () => page.evaluate(() => {
      const column = document.querySelector<HTMLElement>("#comb-player")!.dataset["column"];
      const rect = (node: Element) => {
        const range = document.createRange(); range.selectNodeContents(node);
        const box = range.getBoundingClientRect();
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      };
      return [0, 1].map(row => {
        const owner = document.querySelector<HTMLElement>(`[data-occurrence="c-${row}-${column}"]`)!;
        const native = document.querySelector<HTMLElement>(`[data-kp-comb-key="c-${row}-${column}"]`)!;
        return { moving: rect(owner.firstElementChild!), native: rect(native),
          source: rect(document.querySelector(`[data-kp-comb-key="sum-${row}"]`)!),
          ownerOpacity: getComputedStyle(owner).opacity, nativeOpacity: getComputedStyle(native).opacity };
      });
    });
    for (const column of [0, 1]) {
      if (column) {
        await page.getByRole("link", { name: "2", exact: true }).click();
        await expect(root).toHaveAttribute("data-column", "1"); await frames(page);
      }
      for (const width of [1200, 390]) {
        await page.setViewportSize({ width, height: 950 }); await frames(page);
        // Backwards sampling must produce the same handoff, including after a
        // geometry rebuild and with signed/multi-digit result occurrences.
        for (const progress of [.8334, .9999, 1, .9999, .8334]) {
          await seek(page, progress); const values = await measure();
          for (const [row, value] of values.entries()) {
            expect(value.ownerOpacity).toBe(progress === 1 ? "0" : "1");
            expect(value.nativeOpacity).toBe(progress === 1 ? "1" : "0");
            const target = progress < .9 ? value.source : value.native;
            for (const dimension of ["x", "y", "width", "height"] as const) {
              expect(Math.abs(value.moving[dimension] - target[dimension]), `column ${column}, row ${row}, ${progress}, ${dimension}`).toBeLessThan(.5);
            }
          }
          if (width === 1200 && column === 0 && progress === 1) {
            await info.attach("settled-geometry", { body: JSON.stringify(values), contentType: "application/json" });
          }
        }
      }
    }
  });
}
