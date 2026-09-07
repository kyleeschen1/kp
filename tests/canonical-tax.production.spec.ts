import { expect, test } from "@playwright/test";

const path = "/experiments/kinetic-figure/supply-tax/";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
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
