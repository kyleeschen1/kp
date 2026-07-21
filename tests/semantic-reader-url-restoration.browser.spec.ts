import { expect, test } from "@playwright/test";

const route = (progress: number, focus?: string) =>
  "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1" +
  `&kpProgress=${progress}` +
  (focus === undefined ? "" : `&kpFocus=${encodeURIComponent(focus)}`);

test("named and arbitrary reader frames restore to the exact permille", async ({ page }) => {
  for (const progress of [0, 167, 333, 500, 553, 667, 833, 933, 999, 1000]) {
    await page.goto(route(progress));
    await expect(page.locator("body")).toHaveAttribute(
      "data-kp-reader-progress",
      String(progress)
    );
  }
  await expect(page.locator(
    '[data-kp-reader-transition-active="true"] ' +
    '[data-kp-reader-equation-state="equation.linear-solve.solved"]'
  )).toHaveText("x=4");
  const finalMaterialOpacities = await page.locator(
    "[data-kp-reader-equation-material-owner-id]"
  ).evaluateAll((elements) => elements.map(
    (element) => Number(getComputedStyle(element).opacity)
  ));
  expect(finalMaterialOpacities.every((opacity) => opacity < 0.01)).toBe(true);
});

test("reload and reverse seek preserve exact frame and semantic focus", async ({ page }) => {
  await page.goto(route(667, "equation.linear-solve.left-simplified.lhs.x"));
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", "667");
  await expect(page.locator(
    '[data-kp-reader-native] ' +
    '[data-kp-reader-selector-id="equation.linear-solve.left-simplified.lhs.x"]'
  ).first()).toHaveClass(/kp-reader-semantic-focus/);
  await expect.poll(() => new URL(page.url()).searchParams.get("kpProgress"))
    .toBe("667");

  await page.reload();
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", "667");

  await page.goto(route(500));
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", "500");
  await expect(page.locator("[data-kp-reader-equation-stage]")).toHaveAttribute(
    "data-kp-reader-equation-cancellation-recipe",
    "counter-orbit-v1"
  );
  await expect(page.locator("[data-kp-reader-equation-stage]"))
    .not.toHaveAttribute("data-kp-reader-annihilation-phase");
});

test("the exact final URL presents the complete native solution", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route(1000));
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", "1000");
  const solved = page.locator(
    '[data-kp-reader-transition-active="true"] ' +
    '[data-kp-reader-native="target"] ' +
    '[data-kp-reader-equation-state="equation.linear-solve.solved"]'
  );
  await expect(solved).toBeVisible();
  await expect(solved).toHaveText("x=4");
  const four = solved.locator(
    '[data-kp-reader-selector-id="equation.linear-solve.solved.rhs.4"]'
  );
  await expect(four).toBeVisible();
  const presentation = await four.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      text: element.textContent,
      opacity: Number(style.opacity),
      color: style.color,
      visibility: style.visibility,
      display: style.display,
      transform: style.transform,
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
    };
  });
  expect(presentation.text).toBe("4");
  expect(presentation.opacity).toBeGreaterThan(0.999);
  expect(presentation.visibility).toBe("visible");
  expect(presentation.rect.width).toBeGreaterThan(0);
  const materialOpacities = await page.locator(
    "[data-kp-reader-equation-material-owner-id]"
  ).evaluateAll((elements) => elements.map(
    (element) => Number(getComputedStyle(element).opacity)
  ));
  expect(materialOpacities.every((opacity) => opacity < 0.01)).toBe(true);
});
