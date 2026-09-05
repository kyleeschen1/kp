import { expect, test, type Locator } from "@playwright/test";

test("opt-in authoring host preserves canonical baseline and disposes cleanly", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/authoring-market/");
  await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market", "state-driven-tax");
  await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market-snapshot-count", "3");
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

test("state-driven SVG preserves canonical transit, endpoints and reverse seeks", async ({ page }, info) => {
  const positions = [0, 1, 1.25, 1.5, 1.75, 2, 4, 7, 1.5, 0];
  const reference: string[] = [];
  for (const path of ["/experiments/kinetic-figure/supply-tax/", "/experiments/authoring-market/"]) {
    await page.goto(path);
    const deck = page.locator("[data-kp-supply-tax-focus-deck]");
    await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat", "baseline-market");
    for (const [index, position] of positions.entries()) {
      await seek(deck.locator("[data-kp-supply-tax-state-scrubber]"), position);
      const svg = await deck.locator("svg").first().evaluate(element => element.outerHTML);
      if (path.includes("authoring-market")) {
        expect(svg, `canonical SVG at position ${position}`).toBe(reference[index]);
        await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market-snapshot-count", "3");
        if (index === 3) await deck.screenshot({ path: info.outputPath("state-driven-midpoint.png") });
      } else reference.push(svg);
    }
  }
});

async function seek(scrubber: Locator, position: number) {
  await scrubber.evaluate((element, value) => {
    const input = element as HTMLInputElement;
    input.value = String(value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, position);
}
