import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { expect, test, type Page } from "@playwright/test";

const route = "/tutorials/algebra/fraction-composition/";
const outputRoot = resolve("tmp/codex/algebra-fraction-composition-review");

test.beforeAll(async () => {
  await mkdir(outputRoot, { recursive: true });
});

async function openCheckpoint(
  page: Page,
  checkpoint: string,
  viewport: { readonly width: number; readonly height: number },
  reducedMotion = false
): Promise<void> {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: reducedMotion ? "reduce" : "no-preference" });
  await page.goto(`${route}#kp-ref:solve/${checkpoint}`, {
    waitUntil: "domcontentloaded"
  });
  const host = page.locator("[data-kp-algebra-stage-host]");
  await expect(host).toHaveAttribute(
    "data-kp-algebra-static-checkpoint",
    checkpoint
  );
  await host.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
}

test("captures the wide opening and intermediate teaching states", async ({ page }) => {
  await openCheckpoint(page, "factored", { width: 1440, height: 900 });
  await page.screenshot({
    path: resolve(outputRoot, "wide-factored.png"),
    animations: "disabled"
  });

  await page.locator('[data-kp-algebra-checkpoint-link="normalized"]').click();
  await expect(page.locator("[data-kp-algebra-stage-host]")).toHaveAttribute(
    "data-kp-algebra-static-checkpoint",
    "normalized"
  );
  await page.screenshot({
    path: resolve(outputRoot, "wide-normalized.png"),
    animations: "disabled"
  });
});

test("captures the phone settled state without horizontal overflow", async ({ page }) => {
  await openCheckpoint(page, "solved", { width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390);
  await page.screenshot({
    path: resolve(outputRoot, "phone-solved.png"),
    animations: "disabled"
  });
});

test("captures the reduced-motion direct endpoint", async ({ page }) => {
  await openCheckpoint(
    page,
    "difference-simplified",
    { width: 1440, height: 900 },
    true
  );
  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveCount(0);
  await page.screenshot({
    path: resolve(outputRoot, "wide-reduced-motion.png"),
    animations: "disabled"
  });
});

test("captures the universal Pages directory on the algebra route", async ({ page }) => {
  await openCheckpoint(page, "factored", { width: 1440, height: 900 });
  const toolbar = page.getByRole("complementary", {
    name: "Development tools"
  });
  const pages = toolbar.locator(
    "[data-kp-dev-toolbar-control='kp.dev-toolbar.pages']"
  ).getByText("View", { exact: true });
  await pages.click();
  await expect(pages)
    .toHaveAttribute("aria-expanded", "true");
  await page.screenshot({
    path: resolve(outputRoot, "wide-pages-directory.png"),
    animations: "disabled"
  });
});

test("captures the whole-file Article v1 authoring surface", async ({ page }) => {
  await openCheckpoint(page, "factored", { width: 1440, height: 900 });
  const toolbar = page.getByRole("complementary", {
    name: "Development tools"
  });
  await toolbar.getByRole("button", { name: "Edit article" }).click();
  await expect(page.locator("[data-kp-article-source-editor]")).toHaveAttribute(
    "data-kp-article-source-editor-enhanced",
    "true"
  );
  await page.screenshot({
    path: resolve(outputRoot, "wide-article-editor.png"),
    animations: "disabled"
  });
});
