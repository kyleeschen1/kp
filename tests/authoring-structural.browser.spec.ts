import { expect, test, type Page } from "@playwright/test";

// The canonical reference is measured first. Subsequent integration slices must
// compare their aggregate-backed path against this session, not replace it with
// screenshots of a different distribution demo.
async function seek(page: Page, progress: number) {
  await page.locator("[data-kp-reader-attention-scrubber]").evaluate((element, value) => {
    const input = element as HTMLInputElement;
    input.value = String(value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, progress);
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", String(progress));
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

test("canonical distribution reference traverses the real native session and restores on reverse", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/reader/fraction-composition/?kpLesson=lesson.algebra.fraction-composition&kpVersion=1&kpProgress=38&kpMotion=full&kpProfile=standard&kpFoldMode=expanded");
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-hydrated", "true");
  await page.evaluate(() => document.fonts.ready);
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute("data-kp-reader-canonical-equation-session-active", "true");
  const active = page.locator("[data-kp-reader-transition-active='true']");
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute("data-kp-reader-transition", "fraction-solve.step.distribute");
  await expect(active.locator("[data-kp-reader-fit-surface]")).toHaveCount(1);
  // Captures supplement ownership assertions; they are not new goldens or proof
  // that an authored-state adapter exists before its implementation slice.
  await seek(page, 38);
  const reference = await page.locator("body").getAttribute("data-kp-reader-review-frame");
  await stage.screenshot({ path: info.outputPath("canonical-distribution-transit.png") });
  await seek(page, 0);
  await stage.screenshot({ path: info.outputPath("canonical-distribution-source.png") });
  await seek(page, 77);
  await stage.screenshot({ path: info.outputPath("canonical-distribution-target-boundary.png") });
  await seek(page, 38);
  await expect(active).toHaveAttribute("data-kp-reader-transition", "fraction-solve.step.distribute");
  expect(await page.locator("body").getAttribute("data-kp-reader-review-frame")).toBe(reference);
  expect(errors).toEqual([]);
});
