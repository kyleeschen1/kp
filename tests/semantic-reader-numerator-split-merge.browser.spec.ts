import { expect, test } from "@playwright/test";

const route = "/reader/split-merge-fractions/";

async function expectRenderedProgress(page: import("@playwright/test").Page, value: number) {
  // Scrubber input intentionally crosses the reader's single RAF write boundary;
  // assert against the committed semantic frame, never the preceding DOM frame.
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", String(value));
}

test("semantic editor opens the searchable split-merge round trip", async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  await page.goto("/", { waitUntil: "networkidle" });
  const link = page.getByRole("link", { name: "Review split and merge" });
  await expect(link).toHaveAttribute("href", route);
  await link.click();

  await expect(page).toHaveURL(/\/reader\/split-merge-fractions\//);
  await expect(page.getByRole("heading", { name: "Split and merge a fraction", exact: true })).toBeVisible();
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-lesson-variant", "numerator-split-merge");
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-hydrated", "true");
  await expect(page.locator("[data-kp-reader-equation-stage] [data-kp-reader-transition]")).toHaveCount(2);

  const ruleIds = await page
    .locator("[data-kp-reader-equation-stage] .frac-line[data-kp-reader-selector-id]")
    .evaluateAll((rules) => [
      ...new Set(rules.map((rule) => (rule as HTMLElement).dataset["kpReaderSelectorId"])),
    ].sort());
  expect(ruleIds).toEqual([
    "equation.numerator-split-merge.combined.fraction.rule",
    "equation.numerator-split-merge.split.left.fraction.rule",
    "equation.numerator-split-merge.split.right.fraction.rule",
  ]);
  // The optional dev-review process is outside reader semantics and may be
  // offline when this product route is exercised in isolation.
  expect(errors.filter(({ name }) => name !== "KpDevReviewClientError")).toEqual([]);
});

test("split-merge reader seeks through both directions and rewinds deterministically", async ({ page }) => {
  await page.goto(`${route}?kpMotion=full`, { waitUntil: "networkidle" });
  const stage = page.locator("[data-kp-reader-equation-stage]");
  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  const seek = (value: number) => scrubber.evaluate((node, nextValue) => {
    const input = node as HTMLInputElement;
    input.value = String(nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);

  await seek(250);
  await expectRenderedProgress(page, 250);
  await expect(stage).toHaveAttribute("data-kp-reader-equation-persistent-reflow-progress", /.+/);
  const firstForwardFrame = await stage.getAttribute("data-kp-reader-equation-persistent-reflow-progress");
  await seek(750);
  await expectRenderedProgress(page, 750);
  await expect(stage).toHaveAttribute("data-kp-reader-equation-persistent-reflow-progress", /.+/);
  await seek(250);
  await expectRenderedProgress(page, 250);
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-persistent-reflow-progress",
    firstForwardFrame ?? ""
  );
  await seek(1000);
  await expectRenderedProgress(page, 1000);
  await expect(stage).toHaveAttribute("data-kp-reader-native-endpoint", "target");
  await expect(stage).toHaveAttribute("data-kp-reader-native-endpoint-passed", "true");
});

test("split and merge use exclusive canonical paint ownership", async ({ page }) => {
  await page.goto(`${route}?kpMotion=full`, { waitUntil: "networkidle" });
  const stage = page.locator("[data-kp-reader-equation-stage]");
  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  const seek = async (value: number) => {
    await scrubber.evaluate((node, nextValue) => {
      const input = node as HTMLInputElement;
      input.value = String(nextValue);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
    await expectRenderedProgress(page, value);
  };

  await expect(stage).toHaveAttribute(
    "data-kp-reader-canonical-equation-session",
    "transform.numerator-split-merge.split-sum,transform.numerator-split-merge.merge-sum"
  );
  for (const value of [250, 750]) {
    await seek(value);
    const active = stage.locator(
      '[data-kp-reader-transition-active="true"] [data-kp-reader-fit-surface]'
    );
    await expect(active).toHaveAttribute(
      "data-kp-reader-canonical-equation-session",
      "active"
    );
    await expect(active.locator(
      ".kp-reader-canonical-equation-session-material"
    )).toHaveCount(1);
    await expect(active.locator(
      ".kp-reader-equation-material:not(.kp-reader-canonical-equation-session-material) > *"
    )).toHaveCount(0);
  }
});

test("split-merge remains searchable without JavaScript and contained on phone", async ({ browser }) => {
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(route);
  await expect(staticPage.getByText("One denominator can govern every term")).toBeVisible();
  await expect(staticPage.locator("math")).toHaveCount(3);
  await staticContext.close();

  const phone = await browser.newPage({ viewport: { width: 360, height: 640 } });
  await phone.goto(route, { waitUntil: "networkidle" });
  const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await phone.close();
});

test("split and merge midpoint compositions remain visually stable", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.goto(`${route}?kpMotion=full`, { waitUntil: "networkidle" });
  const stage = page.locator("[data-kp-reader-equation-stage]");
  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  const seek = (value: number) => scrubber.evaluate((node, nextValue) => {
    const input = node as HTMLInputElement;
    input.value = String(nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);

  await seek(250);
  await expectRenderedProgress(page, 250);
  await expect(stage).toHaveScreenshot("numerator-split-midpoint.png", {
    animations: "disabled"
  });
  await seek(750);
  await expectRenderedProgress(page, 750);
  await expect(stage).toHaveScreenshot("numerator-merge-midpoint.png", {
    animations: "disabled"
  });
});
