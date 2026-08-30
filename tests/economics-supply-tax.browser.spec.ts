import { expect, test } from "@playwright/test";

const path = "/experiments/kinetic-figure/supply-tax/";

test("supply-tax deck navigates exact semantic stops and one motion edge", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(path);
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  const originalSupply = deck.locator(
    '[data-kp-supply-tax-entity="curve.economics.tax.supply"]'
  ).first();
  const taxedSupply = deck.locator(
    '[data-kp-supply-tax-entity="curve.economics.tax.supply-with-tax"]'
  );

  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "baseline-market");
  await expect(deck.locator("[data-kp-focus-deck-select]")).toHaveCount(8);
  await expect(deck.locator('[aria-current="step"]')).toHaveCount(1);
  await expect(deck.locator("[data-kp-focus-deck-position]")).toHaveText(
    "Step 1 of 8");
  await expect(deck.locator("svg text")).toHaveCount(0);
  await expect(deck.locator(".kp-supply-tax-graph__math .katex"))
    .toHaveCount(27);
  await expect(originalSupply).toBeVisible();
  await expect(taxedSupply).toBeHidden();
  await expect(deck.locator("[data-kp-focus-deck-previous]"))
    .toHaveAccessibleName("Previous step");
  await expect(deck.locator("[data-kp-focus-deck-next]"))
    .toHaveAccessibleName("Next step");

  await deck.locator("[data-kp-focus-deck-next]").click();
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "tax-input");
  await expect(deck).toHaveAttribute("data-kp-supply-tax-clock-progress",
    "0.0000");
  await deck.locator("[data-kp-focus-deck-next]").click();
  await expect.poll(async () => Number(
    await deck.getAttribute("data-kp-supply-tax-clock-progress")
  ), { timeout: 5_000 }).toBeCloseTo(1, 3);
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "supply-translation");
  await expect(originalSupply).toBeVisible();
  await expect(taxedSupply).toBeVisible();
  await expect(deck.locator("[data-kp-supply-tax-replay]"))
    .toHaveAccessibleName("Replay transformation");

  await deck.locator("[data-kp-focus-deck-previous]").click();
  await expect.poll(async () => Number(
    await deck.getAttribute("data-kp-supply-tax-clock-progress")
  ), { timeout: 5_000 }).toBeCloseTo(0, 3);
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "tax-input");
  await expect(taxedSupply).toBeHidden();
  expect(errors).toEqual([]);
});

test("rapid and distant requests settle without half states", async ({ page }) => {
  await page.goto(`${path}#beat.tax-input`);
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  await deck.locator("[data-kp-focus-deck-next]").click();
  await deck.locator('[data-kp-focus-deck-select="deadweight-loss"]').click();

  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "deadweight-loss");
  await expect(deck).toHaveAttribute("data-kp-supply-tax-clock-progress",
    "1.0000");
  await expect(deck.locator(
    '[data-kp-supply-tax-ledger-role="deadweight-loss"] ' +
    '[data-kp-semantic-salience-level="focus"]'
  )).toHaveCount(1);
  await expect(deck.locator(
    ".kp-supply-tax-graph__region--deadweight-loss"
  )).toBeVisible();
  expect(new URL(page.url()).hash).toBe("#beat.deadweight-loss");
});

test("direct links, reduced motion, and native find restore canonical states", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${path}#beat.supply-translation`);
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  await expect(deck).toHaveAttribute("data-kp-supply-tax-clock-progress",
    "1.0000");
  await expect(deck.locator("[data-kp-supply-tax-stage-caption]"))
    .toContainText("Quantity falls from five to three");

  const revenueSection = deck.locator(
    '[data-kp-focus-deck-beat="government-revenue"]'
  );
  await revenueSection.evaluate((element) => {
    element.dispatchEvent(new Event("beforematch", { bubbles: true }));
  });
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "government-revenue");
  await expect(revenueSection).toBeVisible();
  expect(new URL(page.url()).hash).toBe("#beat.government-revenue");
  await expect(deck.getByText(
    "the rectangle whose height is the price wedge and whose width is taxed quantity",
    { exact: false }
  )).toHaveCount(1);
});

test("supply-tax deck supports keyboard controls and fits a phone", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await page.goto(path);
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  const taxButton = deck.locator('[data-kp-focus-deck-select="tax-input"]');
  await taxButton.focus();
  await page.keyboard.press("Enter");
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "tax-input");

  const bounds = await deck.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth
  }));
  expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth + 1);
  for (const selector of [
    "[data-kp-focus-deck-previous]",
    "[data-kp-focus-deck-next]",
    "[data-kp-focus-deck-select]"
  ]) {
    const box = await deck.locator(selector).first().boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  await deck.locator(
    '[data-kp-focus-deck-select="surplus-redistribution"]'
  ).click();
  await expect(deck.locator('[data-kp-exact-value="25/2"]').first())
    .toHaveAccessibleName("25 divided by 2");
});

test("supply-tax visual checkpoint captures all eight states and phone", async ({
  page
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  const slugs = [
    "baseline-market",
    "tax-input",
    "supply-translation",
    "price-wedge",
    "quantity-contraction",
    "surplus-redistribution",
    "government-revenue",
    "deadweight-loss"
  ] as const;
  for (const [index, slug] of slugs.entries()) {
    await deck.locator(`[data-kp-focus-deck-select="${slug}"]`).click();
    await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat", slug);
    await page.screenshot({
      path: testInfo.outputPath(`supply-tax-${index + 1}-${slug}.png`),
      fullPage: true
    });
  }
  await page.setViewportSize({ width: 390, height: 760 });
  await page.screenshot({
    path: testInfo.outputPath("supply-tax-phone.png"),
    fullPage: true
  });
});
