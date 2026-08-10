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
  await expect(publication.locator("[data-kp-algebra-range-transport]"))
    .toHaveCount(0);
  await expect(publication.locator("[data-kp-algebra-stage-fallback]"))
    .toBeVisible();
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
  const transport = publication.locator("[data-kp-algebra-range-transport]");
  await expect(transport).toBeVisible();
  expect(await transport.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { left: bounds.left, right: bounds.right };
  })).toEqual(expect.objectContaining({
    left: expect.any(Number),
    right: expect.any(Number)
  }));
  expect(await transport.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.left >= -1 && bounds.right <= window.innerWidth + 1;
  })).toBe(true);
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
  const host = publication.locator("[data-kp-algebra-stage-host]");
  const scrubber = publication.locator("[data-kp-algebra-range-scrubber]");
  await scrubber.focus();
  await expect(scrubber).toBeFocused();
  await scrubber.press("Home");
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-local-progress",
    "0"
  );
  await scrubber.press("End");
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-local-progress",
    "1000"
  );
  await expect(publication.locator('[data-kp-algebra-range-action="replay"]'))
    .toHaveAttribute("type", "button");
});

test("reduced motion transport seeks the exact range endpoint without autoplay", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(articleRoute);
  const host = page.locator("[data-kp-algebra-stage-host]");
  await host.locator('[data-kp-algebra-range-action="play"]').click();
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-local-progress",
    "1000"
  );
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-range-status",
    "paused"
  );
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-clock-source",
    "controls"
  );
  await expect(host.locator('[data-kp-algebra-range-action="pause"]'))
    .toBeDisabled();
  await expect(host.locator("[data-kp-algebra-range-status]"))
    .toHaveText("Complete");
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
  const play = publication.locator('[data-kp-algebra-range-action="play"]');
  await play.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(play).toBeFocused();
  expect(await play.evaluate((element) => {
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
