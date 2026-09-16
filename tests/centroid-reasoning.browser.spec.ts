import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
const route = "/experiments/centroid-reasoning/";

test("centroid is a source-backed readable record without JavaScript", async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(route);
  await expect(page.getByRole("heading", { name: "Two loops, one idea" })).toBeVisible();
  await expect(page.locator("[data-centroid-excerpt]")).toHaveCount(4);
  await page.screenshot({ path: info.outputPath("centroid-desktop.png"), fullPage: true });
  const disclosure = page.getByText("See both complete source files", { exact: true });
  await disclosure.focus(); await page.keyboard.press("Enter");
  for (const revision of ["before", "after"]) {
    const code = page.locator(`[data-centroid-source="${revision}"] code`);
    await expect(code).toBeVisible();
    expect(await code.textContent()).toBe(readFileSync(`examples/programming/centroid-${revision}.ts`, "utf8"));
  }
  await disclosure.click();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator('[data-centroid-source="before"]')).toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await page.setViewportSize({ width: 390, height: 844 });
  await disclosure.click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("centroid-phone.png"), fullPage: true });
  await context.close();
});
