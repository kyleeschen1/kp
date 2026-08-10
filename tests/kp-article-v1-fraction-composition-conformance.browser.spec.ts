import { expect, test } from "@playwright/test";

const articleRoute = "/tutorials/algebra/fraction-composition/";

test("the static-first algebra article remains complete without JavaScript", async ({
  browser
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();
  await page.goto(articleRoute);
  const publication = page.locator(
    "[data-kp-algebra-fraction-composition-publication]"
  );
  await expect(publication).toBeVisible();
  await expect(page.getByRole("heading", {
    name: "What does the fraction multiply?"
  })).toBeVisible();
  await expect(publication).toContainText("The exact solution is");
  await expect(publication).toContainText("The check succeeds");
  await expect(publication.locator("svg[role='img']")).toHaveCount(6);
  await expect(publication.locator(".katex-mathml").first()).toBeAttached();
  await expect(page.locator("[data-kp-dev-toolbar]")).toHaveCount(0);
  expect(await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth
  }))).toEqual({ documentWidth: 390, viewportWidth: 390 });
  await context.close();
});

test("phone enhancement fits canonical and static math while preserving prose", async ({
  page
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto(articleRoute);
  const publication = page.locator(
    "[data-kp-algebra-fraction-composition-publication]"
  );
  await publication.locator("[data-kp-algebra-stage-host]").scrollIntoViewIfNeeded();
  await expect(publication.locator("[data-kp-algebra-stage-fallback]"))
    .toBeHidden();
  await expect(publication.locator(
    '[data-kp-canonical-equation-host="chrome-free-v1"]'
  )).toBeVisible();
  const geometry = await page.evaluate(() => {
    const stages = [...document.querySelectorAll<HTMLElement>(
      ".kp-algebra-article__equation-stage:not([hidden]), " +
      '[data-kp-canonical-equation-host="chrome-free-v1"]'
    )];
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      stages: stages.map((stage) => {
        const bounds = stage.getBoundingClientRect();
        return { left: bounds.left, right: bounds.right, width: bounds.width };
      }),
      text: document.body.innerText
    };
  });
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.stages.length).toBeGreaterThan(0);
  for (const stage of geometry.stages) {
    expect(stage.left).toBeGreaterThanOrEqual(-1);
    expect(stage.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  }
  expect(geometry.text).toContain("The denominator is gone");
  expect(geometry.text).toContain("before trusting the final line");
});

test("checkpoint and semantic controls remain keyboard-addressable", async ({ page }) => {
  await page.goto(articleRoute);
  const publication = page.locator(
    "[data-kp-algebra-fraction-composition-publication]"
  );
  const factor = publication.getByRole("link", { name: "factor", exact: true });
  await factor.focus();
  await expect(factor).toBeFocused();
  await factor.press("Enter");
  await expect(factor).toHaveAttribute("data-kp-article-semantic-pinned", "");
  const checkpoint = publication.locator(
    "[data-kp-algebra-checkpoint-link='normalized']"
  );
  await checkpoint.focus();
  await expect(checkpoint).toBeFocused();
  await checkpoint.press("Enter");
  await expect(checkpoint).toHaveAttribute("aria-current", "step");
  await expect(publication.locator("[data-kp-algebra-stage-host]"))
    .toHaveAttribute("data-kp-algebra-static-checkpoint", "normalized");
});

test("forced colors gives pinned semantic controls a non-color outline", async ({
  page
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(articleRoute);
  const publication = page.locator(
    "[data-kp-algebra-fraction-composition-publication]"
  );
  const factor = publication.getByRole("link", { name: "factor", exact: true });
  await factor.click();
  await expect(factor).toHaveAttribute("data-kp-article-semantic-pinned", "");
  expect(await factor.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: style.outlineWidth };
  })).toEqual({ style: "solid", width: "2px" });
});

test("every static checkpoint explains its endpoint without runtime chrome", async ({
  browser
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(articleRoute);
  const figures = page.locator(
    "[data-kp-algebra-fraction-composition-publication] figure"
  );
  await expect(figures).toHaveCount(6);
  for (let index = 0; index < 6; index += 1) {
    const figure = figures.nth(index);
    const image = figure.locator("svg[role='img']");
    await expect(image).toHaveAttribute("aria-label", /\S/u);
    await expect(figure.locator("figcaption")).toContainText(/\S/u);
  }
  await context.close();
});
