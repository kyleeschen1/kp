import { expect, test } from "@playwright/test";

const route = "/experiments/authoring-distribution-focus-card/";
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
