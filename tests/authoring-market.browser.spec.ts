import { expect, test, type Locator, type Page } from "@playwright/test";

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
      // Exact accessible wording is now checked separately from preserved paint.
      const svg = await deck.locator("svg").first().evaluate(element => {
        const clone = element.cloneNode(true) as SVGSVGElement;
        clone.querySelector("desc")!.textContent = "";
        return clone.outerHTML;
      });
      if (path.includes("authoring-market")) {
        expect(svg, `canonical SVG at position ${position}`).toBe(reference[index]);
        await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market-snapshot-count", "3");
        if (index === 3) await deck.screenshot({ path: info.outputPath("state-driven-midpoint.png") });
      } else reference.push(svg);
    }
  }
});

test("native KaTeX uses exact live values and an explicitly separate endpoint ledger", async ({ page }, info) => {
  await page.goto("/experiments/authoring-market/");
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat", "baseline-market");
  await seek(deck.locator("[data-kp-supply-tax-state-scrubber]"), 1.371);
  const exact = await page.evaluate(async modulePath => {
    const { createKpAuthoringMarketFrameSession } = await import(modulePath);
    const { createKpAuthoredMarketSource } = await import(modulePath.replace("authoring-market/authoring-market-frame", "typed-linear-supply-demand/authoring-market-source"));
    const query = createKpAuthoringMarketFrameSession(createKpAuthoredMarketSource({ kind: "impose-per-unit-tax" }));
    const encoding = JSON.parse(document.querySelector<HTMLElement>("#app")!.dataset["kpAuthoringMarketAddress"]!);
    const [numerator, denominator] = encoding[5].split("/").map(Number);
    const frame = query.sample(numerator / denominator).frame;
    query.dispose();
    return frame;
  }, "/src/experiments/authoring-market/authoring-market-frame.ts");
  const latex = (value: { numerator: string; denominator: string }) => value.denominator === "1"
    ? value.numerator : `\\frac{${value.numerator}}{${value.denominator}}`;
  const expectedPaint = await nativePaint(page, `P_c=${latex(exact.market.consumerPrice)}`);
  expect(await deck.locator('[data-kp-supply-tax-math-label="consumer-price"] > div').innerHTML()).toBe(expectedPaint);
  const spoken = (value: { numerator: string; denominator: string }) => value.denominator === "1"
    ? value.numerator : `${value.numerator} divided by ${value.denominator}`;
  await expect(deck.locator("svg desc")).toHaveText(`A tax of ${spoken(exact.market.taxAmount)} shifts buyer-facing supply while original supply remains visible. Quantity is ${spoken(exact.market.quantity)}, consumers pay ${spoken(exact.market.consumerPrice)}, and producers receive ${spoken(exact.market.producerPrice)}.`);
  const comparison = page.locator("[data-kp-authoring-market-comparison]");
  await comparison.locator("summary").click();
  await expect(comparison.locator("[data-kp-supply-tax-ledger]")).toBeVisible();
  await expect(comparison.locator('[data-kp-supply-tax-ledger-role="government-revenue"] [data-kp-exact-value]'))
    .toHaveCount(2);
  await expect(comparison.locator('[data-kp-supply-tax-ledger-role="government-revenue"] [data-kp-exact-value]').last())
    .toHaveAttribute("data-kp-exact-value", "12/1");
  await comparison.screenshot({ path: info.outputPath("exact-endpoint-ledger.png") });
  await seek(deck.locator("[data-kp-supply-tax-state-scrubber]"), 2);
  expect(await deck.locator('[data-kp-supply-tax-math-label="consumer-price"] > div').innerHTML()).toBe(await nativePaint(page, "P_c=9"));
});

async function nativePaint(page: Page, latex: string) {
  return page.evaluate(async input => {
    const { renderLatexToHtml } = await import(input.path);
    const element = document.createElement("div");
    element.innerHTML = renderLatexToHtml(input.latex, { displayMode: false });
    return element.innerHTML;
  }, { path: "/src/rendering/katex-adapter.ts", latex });
}

async function seek(scrubber: Locator, position: number) {
  await scrubber.evaluate((element, value) => {
    const input = element as HTMLInputElement;
    input.value = String(value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, position);
}
