import { expect, test } from "@playwright/test";

const path = "/experiments/kinetic-figure/supply-tax/";

test("built sibling sliders retain whole-step keyboard navigation", async ({ page }) => {
  await page.goto(path);
  const decks = page.locator("[data-kp-focus-deck]");
  await expect(decks).toHaveCount(4);
  for (const deck of await decks.all()) {
    const beats = await deck.locator("[data-kp-focus-deck-beat]")
      .evaluateAll(elements => elements.map(element => element.getAttribute("data-kp-focus-deck-beat")));
    await deck.locator("[data-kp-focus-deck-scrubber]").focus();
    await page.keyboard.press("ArrowRight");
    await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat", beats[1]!);
    await page.keyboard.press("ArrowLeft");
    await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat", beats[0]!);
  }
});

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`built code card preserves gradual phone passage input (${reducedMotion})`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion });
    await page.goto(`${path}#beat.typescript.move-shared-rule`);
    const code = page.locator("[data-kp-typescript-focus-card]");
    const viewport = code.locator("[data-kp-focus-deck-viewport]");
    await expect(code).toHaveAttribute("data-kp-focus-deck-active-beat", "move-shared-rule");
    await expect(viewport).toHaveCSS("overflow-x", "auto");
    const initial = Number(await code.getAttribute("data-kp-typescript-focus-card-timeline-progress"));
    await viewport.dispatchEvent("pointerdown", {
      isPrimary: true, pointerId: 1, pointerType: "touch"
    });
    await viewport.evaluate(element => {
      element.scrollLeft = element.clientWidth * 3.5;
      element.dispatchEvent(new Event("scroll"));
    });
    await expect.poll(async () => Number(await code.getAttribute(
      "data-kp-typescript-focus-card-deck-position"))).toBeCloseTo(3.5, 2);
    const intermediate = Number(await code.getAttribute("data-kp-typescript-focus-card-timeline-progress"));
    expect(intermediate).toBeGreaterThan(initial);
    expect(intermediate).toBeLessThan(0.68);
    await viewport.dispatchEvent("pointerup", {
      isPrimary: true, pointerId: 1, pointerType: "touch"
    });
    await expect(code).toHaveAttribute("data-kp-typescript-focus-card-transition", "settled");
    await expect(code).toHaveAttribute("data-kp-typescript-focus-card-timeline-progress", "0.680000");
  });

  test(`built canonical reader preserves endpoints and siblings (${reducedMotion})`, async ({ page }) => {
    const errors: string[] = [];
    const requests: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => requests.push(new URL(request.url()).pathname));
    await page.emulateMedia({ reducedMotion });
    await page.goto(path);
    await expect(page.locator("#app")).toHaveAttribute("data-kp-canonical-tax-source", "framework-reference");
    await expect(page.locator("[data-kp-focus-deck]")).toHaveCount(4);
    const deck = page.locator("[data-kp-supply-tax-focus-deck]");
    const scrubber = deck.locator("[data-kp-supply-tax-state-scrubber]");
    for (const position of [7, 0]) {
      await scrubber.evaluate((input: HTMLInputElement, value) => {
        input.value = String(value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }, position);
      await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat", position ? "deadweight-loss" : "baseline-market");
      await expect(scrubber).toHaveAttribute("aria-valuetext", /.+/);
    }
    expect(errors).toEqual([]);
    expect(requests.filter(url => /^\/(?:__kp|api|src|@vite)\//.test(url))).toEqual([]);
    expect(requests.some(url => url.startsWith("/assets/"))).toBe(true);
  });
}

test("built no-JavaScript reading carries the same revision, prose and exact facts", async ({ browser, baseURL }) => {
  if (!baseURL) throw new Error("Built delivery requires an explicit preview origin.");
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    await page.goto(path);
    const reading = page.locator("[data-kp-canonical-tax-static]");
    await expect(reading).toBeVisible();
    await expect(reading).toHaveAttribute("data-kp-canonical-tax-source-revision", /^[a-f0-9]{64}$/);
    await expect(reading.locator("[data-kp-canonical-tax-static-phrase]")).toHaveCount(8);
    await expect(reading.locator("math").first()).toBeAttached();
    for (const [name, value] of [["after.revenue", "12"], ["after.loss", "4"], ["before.consumerSurplus", "25/2"]]) {
      await expect(reading.locator("dt").filter({ hasText: new RegExp(`^${name}$`) }).locator("+ dd")).toHaveText(value!);
    }
    await expect(page.locator("input, button")).toHaveCount(0);
  } finally { await context.close(); }
});
