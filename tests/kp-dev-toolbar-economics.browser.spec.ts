import { expect, test } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/";

test("economics exposes one persistent bottom development toolbar", async ({ page }) => {
  await page.goto(route);
  const toolbar = page.getByRole("complementary", { name: "Development tools" });

  await expect(toolbar).toBeVisible();
  await expect(toolbar.getByRole("button", { name: "Review" })).toBeVisible();
  await expect(toolbar.getByRole("combobox", { name: "Layout" })).toHaveValue("reader");
  await expect(toolbar.getByRole("button", { name: "Dark mode" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-kp-dev-toolbar]")).toHaveCount(1);
  await expect(page.locator("[data-kp-dev-review-shell]")).toHaveCount(1);

  const geometry = await toolbar.evaluate((element) => {
    const style = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    return {
      position: style.position,
      bottom: Math.round(innerHeight - bounds.bottom),
      bodyPaddingBottom: getComputedStyle(document.body).paddingBottom
    };
  });
  expect(geometry.position).toBe("fixed");
  expect(geometry.bottom).toBe(18);
  expect(geometry.bodyPaddingBottom).toBe("0px");

  await toolbar.getByRole("button", { name: "Review" }).click();
  await expect(page.getByRole("dialog", { name: "Review this moment" })).toBeVisible();
  await page.getByRole("button", { name: "Close visual review" }).click();

  await toolbar.getByRole("combobox", { name: "Layout" }).selectOption("deck");
  await expect(page).toHaveURL(/\?view=deck/u);
  await expect(toolbar.getByRole("combobox", { name: "Layout" })).toHaveValue("deck");
  await expect(page.locator("[data-kp-dev-toolbar]")).toHaveCount(1);

  await page.screenshot({
    path: "tmp/codex/economics-dev-toolbar.png",
    fullPage: false
  });
});
