import { expect, test } from "@playwright/test";

test("opt-in authoring host preserves canonical baseline and disposes cleanly", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/authoring-market/");
  await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market", "canonical-baseline");
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat", "baseline-market");
  await expect(deck.locator(".kp-supply-tax-graph__math .katex")).toHaveCount(27);
  await expect(deck.locator('[data-kp-supply-tax-entity="curve.economics.tax.supply"]')).toBeVisible();
  const baselineSvg = await deck.locator("svg").first().evaluate(element => element.outerHTML);
  await deck.screenshot({ path: info.outputPath("canonical-baseline.png") });
  await page.evaluate(async modulePath => {
    window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false }));
    const { mountKpAuthoringMarket } = await import(modulePath);
    const root = document.querySelector<HTMLElement>("#app")!;
    const session = mountKpAuthoringMarket({ root });
    session.dispose();
    session.dispose();
  }, "/src/experiments/authoring-market/authoring-market-host.ts");
  await expect(page.locator("#app")).toBeEmpty();
  await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market", "disposed");
  await page.goto("/experiments/kinetic-figure/supply-tax/");
  const canonicalDeck = page.locator("[data-kp-supply-tax-focus-deck]");
  await expect(canonicalDeck).toHaveAttribute("data-kp-focus-deck-active-beat", "baseline-market");
  expect(await canonicalDeck.locator("svg").first().evaluate(element => element.outerHTML)).toBe(baselineSvg);
  await expect(page.locator("#app")).not.toHaveAttribute("data-kp-authoring-market");
  expect(errors).toEqual([]);
});
