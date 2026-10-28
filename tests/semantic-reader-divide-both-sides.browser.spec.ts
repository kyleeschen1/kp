import { expect, test } from "@playwright/test";

const route = "/reader/divide-both-sides/";

test("semantic editor opens the divide-both-sides exemplar", async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  await page.goto("/", { waitUntil: "networkidle" });
  const link = page.getByRole("link", { name: "Review division animation" });
  await expect(link).toHaveAttribute("href", route);
  await link.click();

  await expect(page).toHaveURL(/\/reader\/divide-both-sides\//);
  await expect(page.getByRole("heading", { name: "Divide both sides", exact: true })).toBeVisible();
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-lesson-variant", "divide-both-sides");
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-hydrated", "true");
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-cancellation-recipe",
    "counter-orbit-v1"
  );
  await expect(stage.locator("[data-kp-reader-transition]")).toHaveCount(3);
  const fractionRuleIds = await page
    .locator("[data-kp-reader-equation-stage] .frac-line[data-kp-reader-selector-id]")
    .evaluateAll((rules) => [
      ...new Set(rules.map((rule) => (rule as HTMLElement).dataset["kpReaderSelectorId"])),
    ].sort());
  expect(fractionRuleIds).toEqual([
    "equation.divide-both-sides.coefficient-cancelled.rhs.fraction.rule",
    "equation.divide-both-sides.divided.lhs.fraction.rule",
    "equation.divide-both-sides.divided.rhs.fraction.rule",
  ]);
  expect(errors).toEqual([]);
});

test("divide-both-sides reader seeks, rewinds, and settles at native endpoints", async ({ page }) => {
  await page.goto(`${route}?kpMotion=full`, { waitUntil: "networkidle" });
  const stage = page.locator("[data-kp-reader-equation-stage]");
  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  const seek = (value: number) => scrubber.evaluate((node, nextValue) => {
    const input = node as HTMLInputElement;
    input.value = String(nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);

  await seek(333);
  await expect(stage).toHaveAttribute("data-kp-reader-equation-persistent-reflow-progress", /.+/);
  await seek(667);
  await seek(333);
  await expect(stage).toHaveAttribute("data-kp-reader-equation-persistent-reflow-progress", /.+/);
  await seek(1000);
  await expect(stage).toHaveAttribute("data-kp-reader-native-endpoint", "target");
  await expect(stage).toHaveAttribute("data-kp-reader-native-endpoint-passed", "true");
});

test("divide-both-sides remains searchable without JavaScript and contained on phone", async ({ browser }) => {
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(route);
  await expect(staticPage.getByText("One equal move can uncover the unknown")).toBeVisible();
  await expect(staticPage.locator("math")).toHaveCount(4);
  await staticContext.close();

  const phone = await browser.newPage({ viewport: { width: 360, height: 640 } });
  await phone.goto(route, { waitUntil: "networkidle" });
  const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await phone.close();
});

test("divide-both-sides preparation reuses color-only focus and retires on resize and disposal", async ({ page }) => {
  await page.goto(`${route}?kpMotion=full`, { waitUntil: "networkidle" });
  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  const seek = async (progress: number) => {
    await scrubber.evaluate(async (node, value) => {
      if (!(node instanceof HTMLInputElement)) throw new Error("Expected semantic scrubber");
      node.value = String(value);
      node.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    }, progress);
    await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", String(progress));
  };
  await seek(600);
  const layer = page.locator('.kp-reader-canonical-equation-session-material');
  await expect(layer).toHaveCount(1);
  const initial = await layer.elementHandle();
  // Stay within one narrative focus interval as well as one transformation.
  for (const progress of [560, 580, 620, 580, 560, 600]) await seek(progress);
  expect(await initial!.evaluate(node => node.isConnected)).toBe(true);
  const caches = await layer.locator('[data-kp-equation-material-owner-id]').evaluateAll(owners => owners.map(owner => ({
    children: owner.childElementCount,
    misses: Number(owner.getAttribute('data-kp-equation-material-visual-cache-miss-count')),
    active: [...owner.children].filter(child => getComputedStyle(child).display !== 'none').length
  })));
  expect(caches.length).toBeGreaterThan(0);
  expect(caches.every(cache => cache.children <= 2 && cache.misses <= 2 && cache.active === 1)).toBe(true);
  await seek(600); // Settle playback direction before testing an identical frame.
  const applies = () => page.evaluate(async () => {
    const path = '/src/reader/runtime/reader-runtime-metrics.ts';
    const { inspectKpReaderRuntimeMetrics } = await import(path);
    return inspectKpReaderRuntimeMetrics(window).canonicalSessionApplies;
  });
  const beforeRepeated = await applies();
  for (let index = 0; index < 5; index++) await seek(600);
  expect(await applies()).toBe(beforeRepeated);
  await page.locator('.kp-semantic-link').first().dispatchEvent('pointerover');
  await page.waitForTimeout(200);
  expect(await initial!.evaluate(node => node.isConnected)).toBe(true);
  const focused = await layer.elementHandle();
  await page.setViewportSize({ width: 600, height: 800 });
  await expect.poll(() => focused!.evaluate(node => node.isConnected)).toBe(false);
  await expect(layer).toHaveCount(1);
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
  await expect(layer).toHaveCount(0);
});
