import { expect, test, type Page } from "@playwright/test";
const route = "/experiments/matrix-column-combinations/?compare=1";
const frames = (page: Page) => page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
const seek = (page: Page, value: number) => page.getByRole("slider", { name: "Comparison position" }).evaluate((node, value) => {
  if (!(node instanceof HTMLInputElement)) throw new Error("Expected comparison slider");
  node.value = String(value); node.dispatchEvent(new Event("input", { bubbles: true }));
}, value);
const styles = (page: Page) => page.locator(".comparison-stage").evaluate(stage => [...stage.querySelectorAll<HTMLElement>("[data-occ], [data-vector], .comparison-copy")].map(node => ({ style: node.getAttribute("style"), focus: node.classList.contains("comb-focus") })));

test("both mappings stay in place while the nonzero difference reaches zero", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto(route); await expect(page.locator("#comb-player")).toHaveAttribute("data-ready", "true"); await frames(page);
  const context = page.locator(".comparison-context");
  const contextPosition = () => context.evaluate(node => {
    const rect = node.getBoundingClientRect(); return { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height };
  });
  const initial = await contextPosition();
  for (const index of [0, 1, 2, 3, 4, 5]) {
    await page.getByRole("combobox", { name: "Explanation step" }).selectOption(String(index));
    expect(await contextPosition()).toEqual(initial);
    for (const key of ["u-0", "u-1", "v-0", "v-1", "au-0", "au-1", "av-0", "av-1"])
      await expect(page.locator(`[data-occ="${key}"]`)).toHaveCSS("opacity", "1");
    await page.locator(".matrix-card").screenshot({ path: info.outputPath(`step-${index}.png`) });
  }
  await expect(page.locator('[data-vector="delta"]')).toContainText("2");
  await expect(page.locator('[data-occ="delta-1"]')).toHaveText("−1");
  for (const row of [0, 1]) await expect(page.locator(`[data-occ="zero-${row}"]`)).toHaveText("0");
  await expect(page.locator('[data-vector="zero"]')).toHaveCSS("opacity", "1");
  await page.getByText("Read the complete comparison", { exact: true }).click();
  await expect(page.locator("details .katex-mathml")).toHaveCount(6);
  expect(errors).toEqual([]);
});

test("copy handoffs retain original identities, native geometry and reversible paint", async ({ page }, info) => {
  await page.goto(route); await expect(page.locator("#comb-player")).toHaveAttribute("data-ready", "true"); await frames(page);
  for (const progress of [.04, .08, .24, .32, .44, .48, .64, .72, .84, .92]) {
    await seek(page, progress); const expected = await styles(page);
    await seek(page, 1); await seek(page, 0); await seek(page, progress);
    expect(await styles(page)).toEqual(expected);
    if ([.04, .24, .44, .64, .84].includes(progress)) await page.locator(".matrix-card").screenshot({ path: info.outputPath(`transit-${progress}.png`) });
  }
  await seek(page, .0799);
  const handoff = await page.locator('[data-to="sub-v-0"]').evaluate(owner => {
    const target = document.querySelector<HTMLElement>('[data-occ="sub-v-0"]')!;
    const rect = (element: Element) => { const range = document.createRange(); range.selectNodeContents(element); return range.getBoundingClientRect().toJSON(); };
    return { from: owner.dataset["entityId"], to: target.dataset["entityId"], paint: rect(owner.firstElementChild!), target: rect(target) };
  });
  expect(handoff.from).toBe(handoff.to);
  for (const axis of ["x", "y", "width", "height"] as const) expect(Math.abs(handoff.paint[axis] - handoff.target[axis]), `${axis}: ${JSON.stringify(handoff)}`).toBeLessThan(.5);
  await seek(page, .0801);
  await expect(page.locator('[data-to="sub-v-0"]')).toHaveCSS("opacity", "0");
  await expect(page.locator('[data-occ="sub-v-0"]')).toHaveCSS("opacity", "1");
});

test("checkpoint playback, resize, reduced motion and restoration preserve the comparison", async ({ page }, info) => {
  await page.goto(`${route}#difference`); await expect(page.locator("#comb-player")).toHaveAttribute("data-ready", "true");
  await page.clock.install();
  await page.getByRole("button", { name: "Next", exact: true }).click(); await page.clock.runFor(800);
  const progress = Number(await page.getByRole("slider").inputValue()); expect(progress).toBeGreaterThan(.4); expect(progress).toBeLessThan(.6);
  await page.getByRole("button", { name: "Previous", exact: true }).click(); await page.clock.runFor(1600);
  await expect(page.locator("#comb-player")).toHaveAttribute("data-step", "difference");
  await page.getByRole("button", { name: "Next", exact: true }).click(); await page.clock.runFor(2600);
  await expect(page.locator("#comb-player")).toHaveAttribute("data-progress", "0.6");
  await page.setViewportSize({ width: 390, height: 844 }); await page.clock.runFor(100);
  await expect(page.locator("#comb-player")).toHaveAttribute("data-progress", "0.6");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const region = await page.locator(".matrix-scroll").boundingBox();
  for (const key of ["u", "v", "au", "av"]) {
    const box = await page.locator(`[data-vector="${key}"]`).boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(region!.x);
    expect(box!.x + box!.width).toBeLessThanOrEqual(region!.x + region!.width);
  }
  await page.screenshot({ path: info.outputPath("phone.png"), fullPage: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("slider").press("End"); await expect(page.locator("#comb-player")).toHaveAttribute("data-step", "zero");
  await page.reload(); await expect(page.locator("#comb-player")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#comb-player")).toHaveAttribute("data-step", "zero");
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
    history.replaceState(null, "", "#subtract"); window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
  });
  await expect(page.locator("#comb-player")).toHaveAttribute("data-step", "subtract");
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
  await expect(page.locator(".comparison-material > *")).toHaveCount(0);
});

test("cold preparation waits for the italic math face and can be disposed while waiting", async ({ page }) => {
  let release = () => {};
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/KaTeX_Math-Italic.woff2*", async request => { await held; await request.continue(); });
  const requested = page.waitForRequest(request => request.url().includes("KaTeX_Math-Italic.woff2"));
  await page.goto(route, { waitUntil: "domcontentloaded" }); await requested;
  await expect(page.locator("#comb-player")).toHaveAttribute("aria-busy", "true");
  await expect(page.locator("#comb-player")).not.toHaveAttribute("data-ready", "true");
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
  release(); await page.evaluate(() => document.fonts.ready); await frames(page);
  await expect(page.locator(".comparison-stage")).toHaveCount(0);
});
