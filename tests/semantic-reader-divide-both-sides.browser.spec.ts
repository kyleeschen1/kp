import { expect, test } from "@playwright/test";

const route = "/reader/divide-both-sides/";

test("semantic editor opens the divide-both-sides exemplar", async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  await page.goto("/", { waitUntil: "networkidle" });
  const link = page.getByRole("link", { name: "Review division animation" });
  await expect(link).toHaveAttribute("href", route);
  await link.click();

  await expect(page).toHaveURL(/\/reader\/divide-both-sides\//);
  await expect(page.getByRole("heading", { name: "Divide both sides", exact: true })).toBeVisible();
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-lesson-variant", "divide-both-sides");
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-hydrated", "true");
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-cancellation-recipe",
    "counter-orbit-v1"
  );
  await expect(stage.locator("[data-kp-reader-transition]")).toHaveCount(3);
  const fractionRuleIds = await page
    .locator("[data-kp-reader-equation-stage] .frac-line[data-kp-reader-selector-id]")
    .evaluateAll((rules) => [
      ...new Set(rules.map((rule) => (rule as HTMLElement).dataset["kpReaderSelectorId"])),
    ].sort());
  expect(fractionRuleIds).toEqual([
    "equation.divide-both-sides.coefficient-cancelled.rhs.fraction.rule",
    "equation.divide-both-sides.divided.lhs.fraction.rule",
    "equation.divide-both-sides.divided.rhs.fraction.rule",
  ]);
  expect(errors).toEqual([]);
});

test("divide-both-sides reader seeks, rewinds, and settles at native endpoints", async ({ page }) => {
  await page.goto(`${route}?kpMotion=full`, { waitUntil: "networkidle" });
  const stage = page.locator("[data-kp-reader-equation-stage]");
  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  const seek = (value: number) => scrubber.evaluate((node, nextValue) => {
    const input = node as HTMLInputElement;
    input.value = String(nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);

  await seek(333);
  await expect(stage).toHaveAttribute("data-kp-reader-equation-persistent-reflow-progress", /.+/);
  await seek(667);
  await seek(333);
  await expect(stage).toHaveAttribute("data-kp-reader-equation-persistent-reflow-progress", /.+/);
  await seek(1000);
  await expect(stage).toHaveAttribute("data-kp-reader-native-endpoint", "target");
  await expect(stage).toHaveAttribute("data-kp-reader-native-endpoint-passed", "true");
});

test("divide-both-sides remains searchable without JavaScript and contained on phone", async ({ browser }) => {
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(route);
  await expect(staticPage.getByText("One equal move can uncover the unknown")).toBeVisible();
  await expect(staticPage.locator("math")).toHaveCount(4);
  await staticContext.close();

  const phone = await browser.newPage({ viewport: { width: 360, height: 640 } });
  await phone.goto(route, { waitUntil: "networkidle" });
  const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await phone.close();
});
