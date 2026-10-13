import { expect, test } from "@playwright/test";

for (const width of [1100, 390]) test(`reference reader still mounts at ${width}px`, async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width, height: 844 });
  await page.goto("/reader/foldable-distribution/?kpProgress=0&kpMotion=full&kpFoldMode=expanded");
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-hydrated", "true");
  expect(errors).toEqual([]);
  await expect(page.locator("body")).toHaveAttribute("data-kp-animation-host-status", "ready");
});

for (const width of [1100, 390]) test(`source-authored affine collection at ${width}px`, async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width, height: 844 });
  await page.goto("/reader/foldable-distribution/?example=transfer&kpProgress=0&kpMotion=full&kpFoldMode=expanded");
  const body = page.locator("body");
  await expect(body).toHaveAttribute("data-kp-reader-hydrated", "true");
  expect(errors).toEqual([]);
  await expect(page.locator("[data-kp-static-state]")).toHaveCount(6);
  await expect(page.locator("[data-kp-static-state]").last()).toContainText("7y");
  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  // Forward, reversal and interrupted evaluation use the same semantic clock.
  for (const progress of [0, 115, 230, 345, 460, 550, 650, 750, 825, 910, 975, 1000, 910, 650, 0, 1000]) {
    await scrubber.evaluate((node, value) => {
      const input = node as HTMLInputElement;
      input.value = String(value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, progress);
    await expect(body).toHaveAttribute("data-kp-reader-progress", String(progress));
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(page.locator("[data-kp-reader-transition-active='true']")).toHaveAttribute("data-kp-reader-stage-layout-applied", /equation-stage/);
    if (width === 1100 && [115, 550, 910, 975].includes(progress))
      await page.screenshot({ path: `tmp/codex/affine-collection-review/phase-${progress}.png` });
  }
  const target = page.locator("[data-kp-reader-transition-active='true'] [data-kp-reader-native='target'] .katex-html");
  await expect(target).toContainText("7y−2");
  await page.screenshot({ path: `tmp/codex/affine-collection-review/final-${width}.png`, fullPage: false });
  expect(errors).toEqual([]);
});
