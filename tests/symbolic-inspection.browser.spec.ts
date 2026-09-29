import { expect, test } from "@playwright/test";
import { buildKpVisualContactSheetHtml, type KpVisualContactSheetItem } from "../scripts/capture-visual-contact-sheet.ts";

const route = "/experiments/authoring-distribution-focus-card/";

test("review packet compares static endpoints with the inspection flow", async ({ page }, info) => {
  const captures: KpVisualContactSheetItem[] = [];
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const checkpoint of [
    { id: "static-source", progress: 0, inspect: false, width: 1280 },
    { id: "static-target", progress: 1, inspect: false, width: 1280 },
    { id: "inspect-source", progress: 0, inspect: true, width: 1280 },
    { id: "inspect-transit", progress: .5, inspect: true, width: 1280 },
    { id: "inspect-target", progress: 1, inspect: true, width: 1280 },
    { id: "inspect-phone", progress: 1, inspect: true, width: 390 },
  ]) {
    await page.setViewportSize({ width: checkpoint.width, height: 900 });
    await page.goto(route + (checkpoint.inspect ? "?inspection=true" : ""));
    const card = page.locator('[data-kp-authoring-distribution-card="ready"]');
    await expect(card).toBeVisible();
    await card.locator("[data-kp-focus-deck-scrubber]").fill(String(checkpoint.progress));
    if (checkpoint.inspect) {
      await page.getByRole("combobox", { name: "Occurrence to inspect" }).selectOption("0");
      await expect(page.getByRole("button", { name: /^Follow target/ })).toHaveCount(2);
    }
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const file = info.outputPath(`${checkpoint.id}.png`);
    const capture = await page.screenshot({ path: file, fullPage: true });
    captures.push({ id: checkpoint.id, label: checkpoint.id, progress: checkpoint.progress,
      viewport: { width: checkpoint.width, height: 900 }, file,
      dataUrl: `data:image/png;base64,${capture.toString("base64")}` });
  }
  expect(errors).toEqual([]);
  const sheet = await page.context().newPage();
  await sheet.setViewportSize({ width: 1500, height: 1000 });
  await sheet.setContent(buildKpVisualContactSheetHtml(captures, {
    title: "Symbolic inspection · endpoints and correspondence", columns: 2, imageFit: "contain", imageHeightPx: 480
  }));
  await sheet.screenshot({ path: info.outputPath("inspection-contact-sheet.png"), fullPage: true });
  await sheet.close();
});
test("inspection is opt-in and preserves canonical seek and reverse", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => requests.push(request.url()));
  await page.goto(route);
  const card = page.locator('[data-kp-authoring-distribution-card="ready"]');
  await expect(card).toBeVisible();
  expect(requests.some(url => url.includes("inspection-bridge"))).toBe(false);
  await expect(page.locator("[data-kp-symbolic-inspection]")).toHaveCount(0);
  await page.goto(route + "?inspection=true");
  await expect(page.locator('[data-kp-symbolic-inspection="ready"]')).toBeVisible();
  await expect(card).toBeVisible();
  for (const progress of [0, .5, 1, .5, 0]) {
    await card.locator("[data-kp-focus-deck-scrubber]").fill(String(progress));
    await expect(card).toHaveAttribute("data-kp-distribution-progress", String(progress));
    await expect(card.locator("[data-kp-reader-canonical-paint-owner]")).toHaveAttribute("data-kp-reader-canonical-paint-owner", "true");
  }
});

test("keyboard inspection follows descendants and clears at the held position", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route + "?inspection=true");
  const card = page.locator('[data-kp-authoring-distribution-card="ready"]');
  await expect(card).toBeVisible();
  await card.locator("[data-kp-focus-deck-scrubber]").fill("0.5");
  const before = await card.boundingBox();
  const chooser = page.getByRole("combobox", { name: "Occurrence to inspect" });
  // Native popup keystrokes are platform-dependent in headless Chromium;
  // select through its native API, then exercise keyboard follow and Escape.
  await chooser.selectOption("0");
  await expect(page.locator("[data-inspection-result]")).not.toContainText("Select an occurrence");
  await expect(card).toHaveAttribute("data-kp-distribution-progress", "0.5");
  await expect(page.getByRole("button", { name: /^Follow target/ })).toHaveCount(2);
  await page.getByRole("button", { name: /^Follow target/ }).first().focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: /^Follow source/ })).toHaveCount(1);
  await page.getByText("Audit evidence", { exact: true }).click();
  await expect(page.locator("[data-inspection-audit]")).toContainText("do not prove mathematical equivalence");
  await page.screenshot({ path: info.outputPath("inspection-held.png"), fullPage: true });
  await chooser.press("Escape");
  await expect(page.locator("[data-inspection-result]")).toContainText("Select an occurrence");
  await expect(card).toHaveAttribute("data-kp-distribution-progress", "0.5");
  expect(await card.boundingBox()).toEqual(before);
});

test("native occurrence click focuses through the existing compositor without seeking", async ({ page }) => {
  await page.goto(route + "?inspection=true");
  const card = page.locator('[data-kp-authoring-distribution-card="ready"]');
  await expect(card).toBeVisible();
  const selector = "fraction-fan-out.source.addend.x";
  await card.locator(`[data-kp-inspection-hit-endpoint] [data-kp-reader-selector-id="${selector}"]`).click();
  await expect(page.locator("#authored-focus-card")).toHaveAttribute("data-kp-inspection-selector", selector);
  await expect(card).toHaveAttribute("data-kp-distribution-progress", "0");
  await expect(card.locator("[data-kp-reader-focus-source]")).toHaveAttribute("data-kp-reader-focus-source", "pointer");
  await card.locator("[data-kp-focus-deck-scrubber]").fill("1");
  const target = "fraction-fan-out.target.addend.x";
  await card.locator(`[data-kp-inspection-hit-endpoint] [data-kp-reader-selector-id="${target}"]`).click();
  await expect(page.locator("#authored-focus-card")).toHaveAttribute("data-kp-inspection-selector", target);
  await expect(card).toHaveAttribute("data-kp-distribution-progress", "1");
});
