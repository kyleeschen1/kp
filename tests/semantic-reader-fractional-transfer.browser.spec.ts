import { expect, test } from "@playwright/test";

const route = "/reader/fractional-transfer/";

async function seek(page: import("@playwright/test").Page, value: number) {
  await page.locator("[data-kp-reader-attention-scrubber]").evaluate((node, next) => {
    const input = node as HTMLInputElement;
    input.value = String(next);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    String(value)
  );
}

test("semantic editor opens the profile comparison with Standard selected", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const link = page.getByRole("link", { name: "Compare proof and shortcut" });
  await expect(link).toHaveAttribute("href", route);
  await link.click();

  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(page).toHaveURL(/\/reader\/fractional-transfer\//);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-equation-profile",
    "standard"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-animation-id",
    "animation.fractional-linear.x-over-2.balanced-proof"
  );
  await expect(page.getByLabel("Equation explanation view")).toHaveValue("standard");
  await expect(page.getByLabel("Equation explanation view").locator("option")).toHaveText([
    "Explain",
    "Standard",
    "Fluent"
  ]);
  await expect(stage.locator("[data-kp-reader-transition]")).toHaveCount(4);
});

test("Fluent uses only the certified projection and rewinds deterministically", async ({ page }) => {
  await page.goto(`${route}?kpProfile=fluent&kpMotion=full`, { waitUntil: "networkidle" });
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-animation-id",
    "animation.fractional-linear.x-over-2.fluent-projection"
  );
  await seek(page, 250);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-transition",
    "transform.fractional-linear.project-certified-transfer"
  );
  await expect(stage).toHaveAttribute("data-kp-reader-motion-authority", "operation-specific");
  const proxy = page.locator(
    '[data-kp-reader-equation-material-owner-id="material-owner.projection.fractional-linear.x-over-2.denominator-proxy"]'
  );
  await expect(proxy).toHaveCount(1);
  const firstTransform = await proxy.getAttribute("style");

  await seek(page, 1000);
  await expect(stage).toHaveAttribute("data-kp-reader-native-endpoint", "target");
  await expect(stage).toHaveAttribute("data-kp-reader-native-endpoint-passed", "true");
  await seek(page, 250);
  await expect(proxy).toHaveAttribute("style", firstTransform ?? "");
});

test("profile control preserves the current semantic moment in the URL", async ({ page }) => {
  await page.goto(
    `${route}?kpLesson=lesson.solve-x.fractional-transfer-comparison&kpVersion=1&kpProgress=333&kpMotion=full`,
    { waitUntil: "networkidle" }
  );
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", "333");
  await page.getByLabel("Equation explanation view").selectOption("fluent");
  await expect(page).toHaveURL(/kpProfile=fluent/);
  await expect(page).toHaveURL(/kpProgress=333/);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-equation-profile",
    "fluent"
  );
});

test("comparison remains searchable without JavaScript and contained on phone", async ({ browser }) => {
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(route);
  await expect(staticPage.getByText("The same algebra can be shown at different levels")).toBeVisible();
  await expect(staticPage.locator("math")).toHaveCount(4);
  await staticContext.close();

  const phone = await browser.newPage({ viewport: { width: 360, height: 640 } });
  await phone.goto(`${route}?kpProfile=fluent`, { waitUntil: "networkidle" });
  const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(phone.getByLabel("Equation explanation view")).toBeVisible();
  await phone.close();
});

test("balanced and fluent midpoint compositions remain visually stable", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 800 });
  const stage = page.locator("[data-kp-reader-equation-stage]");

  await page.goto(`${route}?kpProfile=standard&kpMotion=full`, { waitUntil: "networkidle" });
  await seek(page, 225);
  await expect(stage).toHaveScreenshot("fractional-transfer-balanced-midpoint.png", {
    animations: "disabled"
  });

  await page.goto(`${route}?kpProfile=fluent&kpMotion=full`, { waitUntil: "networkidle" });
  await seek(page, 250);
  await expect(stage).toHaveScreenshot("fractional-transfer-fluent-midpoint.png", {
    animations: "disabled"
  });
});
