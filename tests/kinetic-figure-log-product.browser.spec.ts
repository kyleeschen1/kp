import { expect, test } from "@playwright/test";

const path = "/experiments/kinetic-figure/log-product/";

test("numbered and prose controls project the same semantic reading states", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(path);

  const figure = page.locator("[data-kp-kinetic-figure]");
  const paragraph = figure.locator(".kp-kinetic-figure__paragraph");
  const player = figure.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  await expect(figure.locator("[data-kp-kinetic-figure-state]")).toHaveCount(4);

  const paragraphText = await paragraph.textContent();
  const paragraphBox = await paragraph.boundingBox();
  await figure.locator('[data-kp-kinetic-figure-state="product"]').click();
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-settled-state",
    "product"
  );
  await expect(figure.locator(
    '[data-kp-kinetic-figure-prose-link="product"]'
  )).toHaveAttribute("data-kp-semantic-salience-level", "focus");
  await expect(figure.locator(
    '[data-kp-kinetic-figure-state="product"]'
  )).toHaveAttribute("aria-current", "");
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0");
  expect(await player.locator(
    '[data-kp-kinetic-figure-attention="focus"]'
  ).count()).toBeGreaterThan(0);
  await expect(player.locator(
    '[data-kp-kinetic-figure-attention="focus"]:visible'
  ).first()).toHaveCSS("color", "rgb(141, 59, 37)");

  await figure.locator(
    '[data-kp-kinetic-figure-prose-link="transform"]'
  ).hover();
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-active-state",
    "product"
  );
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-preview-state",
    "transform"
  );
  await expect(figure.locator(
    '[data-kp-kinetic-figure-state="transform"]'
  )).toHaveAttribute("data-kp-kinetic-figure-preview", "true");
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0");
  expect(new URL(page.url()).hash).toBe("#product");

  await page.locator("#products-heading").hover();
  await expect(figure).not.toHaveAttribute(
    "data-kp-kinetic-figure-preview-state",
    "transform"
  );

  await figure.locator(
    '[data-kp-kinetic-figure-prose-link="transform"]'
  ).click();
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-settled-state",
    "transform",
    { timeout: 8_000 }
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "1");
  await expect(figure.locator(
    '[data-kp-kinetic-figure-prose-link="transform"]'
  )).toHaveAttribute("data-kp-semantic-salience-level", "focus");
  expect(await player.locator(
    '[data-kp-kinetic-figure-attention="focus"]:visible'
  ).count()).toBeGreaterThanOrEqual(7);
  await expect(player.locator(
    '[data-kp-semantic-identity-id="semantic.log-product.variable.x"]:visible'
  ).first()).toHaveCSS("color", "rgb(13, 14, 18)");

  await figure.locator(
    '[data-kp-kinetic-figure-prose-link="result"]'
  ).click();
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-settled-state",
    "result",
    { timeout: 8_000 }
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "1");
  await expect(figure.locator(
    '[data-kp-kinetic-figure-state="result"]'
  )).toHaveAttribute("aria-current", "");

  const ruleToggle = figure.locator(
    "[data-kp-kinetic-figure-rule-toggle]"
  );
  const rule = figure.locator(
    "[data-kp-kinetic-figure-rule-disclosure]"
  );
  await expect(rule).toBeHidden();
  await ruleToggle.click();
  await expect(ruleToggle).toHaveAttribute("aria-expanded", "true");
  await expect(rule).toBeVisible();
  await expect(rule.locator(".katex")).toHaveCount(3);
  await ruleToggle.click();
  await expect(rule).toBeHidden();

  expect(await paragraph.textContent()).toBe(paragraphText);
  const settledParagraphBox = await paragraph.boundingBox();
  expect(settledParagraphBox?.width).toBeCloseTo(paragraphBox?.width ?? 0, 1);
  expect(settledParagraphBox?.height).toBeCloseTo(paragraphBox?.height ?? 0, 1);
  expect(errors).toEqual([]);
});

test("visual checkpoint captures the four quiet reading states", async ({ page },
  testInfo) => {
  await page.goto(path);
  const figure = page.locator("[data-kp-kinetic-figure]");
  await expect(figure.locator("[data-kp-editor-animation-player]")).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );

  for (const state of ["whole", "product", "transform", "result"] as const) {
    await figure.locator(`[data-kp-kinetic-figure-state="${state}"]`).click();
    await expect(figure).toHaveAttribute(
      "data-kp-kinetic-figure-settled-state",
      state,
      { timeout: 8_000 }
    );
    await page.waitForTimeout(220);
    await page.screenshot({
      path: testInfo.outputPath(`kinetic-figure-${state}.png`),
      fullPage: true
    });
  }

  await figure.locator("[data-kp-kinetic-figure-rule-toggle]").click();
  await page.screenshot({
    path: testInfo.outputPath("kinetic-figure-rule-open.png"),
    fullPage: true
  });
});

test("the local figure remains deterministic and contained without motion", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${path}#transform`);
  const figure = page.locator("[data-kp-kinetic-figure]");
  await expect(figure.locator("[data-kp-editor-animation-player]")).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-settled-state",
    "transform"
  );
  await expect(figure.locator(
    "[data-kp-editor-animation-player]"
  )).toHaveAttribute("data-kp-editor-animation-progress", "1");
  await figure.locator('[data-kp-kinetic-figure-state="result"]').click();
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-settled-state",
    "result"
  );
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  )).toBe(true);
});
