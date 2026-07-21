import { expect, test } from "@playwright/test";

test("semantic editor opens the fractional equation reader route", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  await page.goto("/", { waitUntil: "networkidle" });
  const link = page.getByRole("link", { name: "Review fraction animation" });
  await expect(link).toHaveAttribute("href", "/reader/solve-fractional-linear/");
  await link.click();

  await expect(page).toHaveURL(/\/reader\/solve-fractional-linear\//);
  await expect(
    page.getByRole("heading", { name: "Solve an equation with a fraction", exact: true })
  ).toBeVisible();
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-lesson-variant",
    "fractional-linear"
  );
  await expect(page.locator("[data-kp-reader-hydrated]"))
    .toHaveAttribute("data-kp-reader-hydrated", "true");
  await expect(page.locator(
    "[data-kp-reader-equation-stage] [data-kp-reader-transition]"
  )).toHaveCount(6);
  await expect(page.locator(".frac-line[data-kp-reader-selector-id]").first()).toBeAttached();
  await expect(page.locator(".mopen.delimcenter[data-kp-reader-selector-id]").first())
    .toBeAttached();
  await expect(page.locator(".mclose.delimcenter[data-kp-reader-selector-id]").first())
    .toBeAttached();
  expect(pageErrors).toEqual([]);
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 360, height: 640 }
]) {
  test(`fractional reader stays finite and contained at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/reader/solve-fractional-linear/", { waitUntil: "networkidle" });
    await expect(page.locator("body")).toHaveAttribute(
      "data-kp-reader-responsive-projection",
      "compact-transcript"
    );

    const geometry = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>("[data-kp-reader-equation-stage]")!;
      const beats = [...document.querySelectorAll<HTMLElement>("[data-kp-beat]")];
      return {
        horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
        stageHeight: stage.getBoundingClientRect().height,
        beatHeights: beats.map((beat) => beat.getBoundingClientRect().height)
      };
    });
    expect(geometry.horizontalOverflow).toBeLessThanOrEqual(1);
    expect(geometry.stageHeight).toBeLessThanOrEqual(viewport.height * 0.52);
    expect(Math.max(...geometry.beatHeights)).toBeLessThanOrEqual(225);
  });
}

test("fractional reader remains searchable and mathematical without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto("/reader/solve-fractional-linear/");
    await expect(page.getByText("The fraction is not a detour")).toBeVisible();
    await expect(page.locator("[data-kp-static-state]:not([hidden]) .katex")).toBeVisible();
    await expect(page.locator("body")).not.toHaveAttribute(
      "data-kp-reader-hydrated",
      "true"
    );
    const latex = await page.locator(
      'annotation[encoding="application/x-tex"]'
    ).allTextContents();
    for (const expected of [
      "\\frac{x}{2} + 3 = 7",
      "\\frac{x}{2} + 3 - 3 = 7 - 3",
      "\\frac{x}{2} = 7 - 3",
      "\\frac{x}{2} = 4",
      "2\\left(\\frac{x}{2}\\right) = 2 \\cdot 4",
      "x = 2 \\cdot 4",
      "x = 8"
    ]) {
      expect(latex).toContain(expected);
    }
    await expect(page.locator("math")).toHaveCount(7);
  } finally {
    await context.close();
  }
});

test("fractional reader print output exposes every state and hides interaction chrome", async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  await page.goto("/reader/solve-fractional-linear/", { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".kp-reader-equation-stage")).toHaveCSS("display", "none");
  const staticStates = page.locator("[data-kp-static-state]");
  await expect(staticStates).toHaveCount(7);
  expect(await staticStates.evaluateAll((states) =>
    states.map((state) => getComputedStyle(state).display)
  )).not.toContain("none");
  await expect(page.locator(".kp-animation-beats > li")).toHaveCount(7);
  await page.waitForTimeout(100);
  expect(errors).toEqual([]);
});
