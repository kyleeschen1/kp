import { expect, test } from "@playwright/test";

const route =
  "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=150";

test("prose focus and equation salience share one restrained vocabulary", async ({ page }) => {
  await page.goto(route);
  const stage = page.locator("[data-kp-reader-equation-stage]");
  const link = page.getByRole("button", { name: "the unknown" });
  const xSelector = "equation.linear-solve.initial.lhs.x";
  const x = page.locator(`[data-kp-reader-selector-id="${xSelector}"]`).first();

  await expect(stage).toHaveAttribute("data-kp-reader-focus-source", "story");
  await expect(page.locator(
    '[data-kp-reader-transition-active="true"] .kp-reader-semantic-focus'
  )).toHaveCount(0);
  await expect(link).toHaveAttribute(
    "title",
    "x stays the same object as the equation changes"
  );

  await link.dispatchEvent("pointerover");
  await expect(stage).toHaveAttribute("data-kp-reader-focus-source", "pointer");
  await expect(x).toHaveClass(/kp-reader-semantic-focus/);
  await expect(x).toHaveCSS("color", "rgb(31, 99, 113)");
  await expect(page.locator(
    '[data-kp-reader-equation-material-focused="true"]'
  ).first()).toHaveCSS("color", "rgb(31, 99, 113)");

  await link.dispatchEvent("pointerout");
  await expect(stage).toHaveAttribute("data-kp-reader-focus-source", "story");
  await expect(x).not.toHaveClass(/kp-reader-semantic-focus/);

  await link.focus();
  await expect(stage).toHaveAttribute("data-kp-reader-focus-source", "keyboard");
  await expect(link).toBeFocused();
  await expect(link).toHaveCSS("outline-color", "rgb(31, 99, 113)");
  await expect(x).toHaveCSS("color", "rgb(31, 99, 113)");
});
