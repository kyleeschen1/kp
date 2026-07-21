import { expect, test } from "@playwright/test";

const route = (progress: number) =>
  "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1" +
  `&kpProgress=${progress}`;

test("TOC exposes exactly one active semantic location while scrolling", async ({ page }) => {
  for (const [progress, beatId] of [
    [0, "beat.read"],
    [517, "beat.cancel"],
    [1000, "beat.solve"]
  ] as const) {
    await page.goto(route(progress));
    const toc = page.locator(".kp-lesson-toc");
    await expect(toc).toHaveAttribute("data-kp-toc-active-id", beatId);
    const active = toc.locator('[data-kp-toc-active="true"]');
    await expect(active).toHaveCount(1);
    await expect(active).toHaveAttribute("href", `#${beatId}`);
    await expect(active).toHaveAttribute("aria-current", "location");
    await expect(page.locator(`[data-kp-beat="${beatId}"]`))
      .toHaveAttribute("aria-current", "step");
  }
});

test("TOC links retain native hash navigation without hiding under the masthead", async ({ page }) => {
  await page.goto(route(0));
  const solveLink = page.locator('.kp-lesson-toc a[href="#beat.solve"]');
  await solveLink.click();
  await expect(page).toHaveURL(/#beat\.solve$/);
  await expect(page.locator(".kp-lesson-toc")).toHaveAttribute(
    "data-kp-toc-active-id",
    "beat.solve"
  );
  const masthead = await page.locator(".kp-reader-masthead").boundingBox();
  const beat = await page.locator('[data-kp-beat="beat.solve"]').boundingBox();
  if (masthead === null || beat === null) throw new Error("Reader anchors are not measurable.");
  expect(beat.y).toBeGreaterThanOrEqual(masthead.y + masthead.height);
});

test("active TOC state remains legible in the narrow horizontal layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route(517));
  const active = page.locator('.kp-lesson-toc a[href="#beat.cancel"]');
  await expect(active).toHaveAttribute("data-kp-toc-active", "true");
  await expect(active).toBeVisible();
  const styles = await active.evaluate((element) => {
    const style = getComputedStyle(element);
    return { border: style.borderLeftColor, weight: style.fontWeight };
  });
  expect(styles.border).not.toBe("rgba(0, 0, 0, 0)");
  expect(Number(styles.weight)).toBeGreaterThanOrEqual(700);
});
