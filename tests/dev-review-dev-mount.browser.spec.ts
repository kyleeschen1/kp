import { expect, test } from "@playwright/test";

test("review shell reports an unavailable inbox without claiming readiness", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/dev/reviews/v2/query", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "review service unavailable" })
    });
  });

  await page.goto("/reader/solve-x/");
  const host = page.locator("[data-kp-dev-review-shell]");
  await expect(host).toHaveAttribute(
    "data-kp-dev-review-available",
    "false"
  );
  await expect(page.locator("body")).not.toHaveAttribute(
    "data-kp-dev-review-ready",
    "true"
  );
  await host.locator("button.launcher").click();
  await expect(host.locator("output.review-round")).toHaveText(
    "Review service unavailable"
  );
  await expect(host.locator("output.status")).toContainText("npm run dev");
  await expect(host.locator("textarea")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test("reader mounts the review shell by default in Vite development", async ({ page }) => {
  await page.goto("/reader/solve-x/");
  await expect(page.locator("body")).toHaveAttribute("data-kp-dev-review-ready", "true");
  const host = page.locator("[data-kp-dev-review-shell]");
  await expect(host.locator("button.launcher")).toBeVisible();
  await expect(host).toHaveAttribute("data-kp-dev-review-placement", "left-prose-rail");
  await expect(host).toHaveCSS("left", "18px");
  await host.locator("button.launcher").click();
  await expect(host.locator("textarea")).toBeEnabled();
  await expect(host).toHaveCSS("z-index", "2147483000");
  await expect(host.locator("[role=dialog]")).toHaveCSS("pointer-events", "auto");
  await expect(host.locator("textarea")).toHaveCSS("background-color", "rgb(255, 253, 247)");
  await host.locator("textarea").focus();
  await expect(host.locator("textarea")).toHaveCSS("outline-width", "3px");
  await expect(host.locator("textarea")).toHaveCSS("outline-color", "rgb(31, 99, 113)");
  await expect(host.locator(".meta")).not.toContainText("State unavailable");
  await expect(host.locator(".meta")).toContainText("Type to capture this moment");
  await expect(host.locator(".route")).toBeEmpty();

  // Opening the tool is intentionally capture-free; first input establishes
  // the immutable moment so idle review UI never freezes stale reader state.
  await host.locator("textarea").fill("Check this moment");
  await expect(host.locator(".meta")).toContainText("Locked");
  await expect(host.locator(".route")).toHaveText("/reader/solve-x/");

  const stage = await page.locator("[data-kp-reader-equation-stage]").boundingBox();
  const panel = await host.locator("[role=dialog]").boundingBox();
  expect(stage).not.toBeNull();
  expect(panel).not.toBeNull();
  expect(panel!.x + panel!.width).toBeLessThanOrEqual(stage!.x);
});

test("narrow reader locks a bounded captured-moment sheet and responds to breakpoint changes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=833");
  await expect(page.locator("body")).toHaveAttribute("data-kp-dev-review-ready", "true");
  const host = page.locator("[data-kp-dev-review-shell]");
  await expect(host).toHaveAttribute("data-kp-dev-review-placement", "captured-moment-sheet");
  await expect(host.locator("[role=dialog]")).toBeHidden();
  await expect(host.locator("button.launcher")).toBeVisible();
  await host.locator("button.launcher").click();
  await expect(host.locator("button.launcher")).toBeHidden();

  await expect(host.locator(".intro")).toContainText("moment locked when the sheet opened");
  await expect(host.locator(".meta")).toContainText("Locked");
  const stage = await page.locator("[data-kp-reader-equation-stage]").boundingBox();
  const panel = await host.locator("[role=dialog]").boundingBox();
  expect(stage).not.toBeNull();
  expect(panel).not.toBeNull();
  expect(panel!.y).toBeGreaterThanOrEqual(stage!.y + stage!.height);
  expect(panel!.height).toBeLessThanOrEqual(844 * 0.38 + 1);

  await page.setViewportSize({ width: 1000, height: 844 });
  await expect(host).toHaveAttribute("data-kp-dev-review-placement", "left-prose-rail");
  await expect(host.locator(".intro")).toContainText("exact reader state is attached automatically");
});
