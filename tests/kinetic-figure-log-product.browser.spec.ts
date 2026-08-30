import { expect, test, type Locator, type Page } from "@playwright/test";

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
  const figureBox = await figure.locator(
    ".kp-kinetic-figure__figure"
  ).boundingBox();
  expect(paragraphBox).not.toBeNull();
  expect(figureBox).not.toBeNull();
  expect((paragraphBox?.x ?? 0) + (paragraphBox?.width ?? 0)).toBeLessThan(
    figureBox?.x ?? 0
  );
  expect(Math.abs(
    (paragraphBox?.y ?? 0) - (figureBox?.y ?? 0)
  )).toBeLessThan(8);
  await expect(paragraph).toHaveCSS("font-size", "16.48px");
  await figure.locator('[data-kp-kinetic-figure-state="product"]').click();
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-settled-state",
    "product"
  );
  await expect(figure.locator(
    '[data-kp-kinetic-figure-prose-link="product"]'
  )).toHaveAttribute("data-kp-semantic-salience-level", "focus");
  await expect(figure.locator(
    '[data-kp-kinetic-figure-prose-link="product"]'
  )).toHaveAttribute("aria-current", "step");
  await expect(figure.locator(
    '[data-kp-kinetic-figure-prose-link="product"]'
  )).toHaveCSS("color", "rgb(38, 41, 34)");
  await expect(figure.locator(
    '[data-kp-kinetic-figure-prose-link="product"]'
  )).toHaveCSS("background-color", "rgba(174, 91, 57, 0.12)");
  await expect(figure.locator(
    '[data-kp-kinetic-figure-state="product"]'
  )).toHaveAttribute("aria-current", "");
  await expect(figure.locator(
    '[data-kp-kinetic-figure-state="product"]'
  )).toHaveCSS("background-color", "rgb(38, 41, 34)");
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
  await expect(player.locator(
    '[data-kp-kinetic-figure-attention="focus"]:visible'
  ).first()).toHaveCSS("color", "rgb(38, 41, 34)");

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

test("Focus Deck navigates semantic beats around one full-equation rewrite", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${path}?projection=focus-deck`);

  const pageRoot = page.locator(".kp-focus-deck-page");
  const deck = page.locator("[data-kp-kinetic-figure]");
  const player = deck.locator("[data-kp-editor-animation-player]");
  const equation = deck.locator("[data-kp-log-product-equivalence-stage]");
  const beats = deck.locator("[data-kp-focus-deck-beat]");
  const stepControls = deck.locator("[data-kp-focus-deck-select]");
  const relation = equation.locator(
    ".kp-log-product-equivalence-stage__relation"
  );

  await expect(pageRoot).toHaveAttribute(
    "data-kp-kinetic-figure-projection",
    "focus-deck"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-id",
    "animation.algebra.log-product.equivalence-frame"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await expect(equation).toHaveAttribute(
    "data-kp-log-product-equivalence-stage",
    "ready",
    { timeout: 15_000 }
  );
  await expect(beats).toHaveCount(4);
  await expect(stepControls).toHaveCount(4);
  await expect(deck.locator('[data-kp-focus-deck-select][aria-current="step"]'))
    .toHaveCount(1);
  await expect(deck.locator("[data-kp-focus-deck-position]")).toHaveText(
    "Step 1 of 4"
  );
  await expect(deck.locator("[data-kp-focus-deck-sequence-ordinal]"))
    .toHaveCount(0);
  await expect(page.locator('[data-kp-visual-theme="light"]')).toHaveCount(1);
  const initialMarker = await deck.locator(
    '[data-kp-focus-deck-select="orient"]'
  ).evaluate((element) => getComputedStyle(element).borderInlineStartColor);
  const inactiveMarker = await deck.locator(
    '[data-kp-focus-deck-select="locate-product"]'
  ).evaluate((element) => getComputedStyle(element).borderInlineStartColor);
  expect(initialMarker).not.toBe(inactiveMarker);
  await expect(deck.locator("[data-kp-focus-deck-previous]"))
    .toHaveAccessibleName("Previous step");
  await expect(deck.locator("[data-kp-focus-deck-next]"))
    .toHaveAccessibleName("Next step");
  await expect(deck.locator(
    '[data-kp-focus-deck-previous] [data-kp-focus-deck-control-icon="previous"]'
  )).toHaveCount(1);
  await expect(deck.locator(
    '[data-kp-focus-deck-next] [data-kp-focus-deck-control-icon="next"]'
  )).toHaveCount(1);
  const railBounds = await deck.locator(".kp-focus-deck__steps").boundingBox();
  const mainBounds = await deck.locator(".kp-focus-deck__main").boundingBox();
  expect(railBounds).not.toBeNull();
  expect(mainBounds).not.toBeNull();
  expect(railBounds!.x + railBounds!.width).toBeLessThanOrEqual(
    mainBounds!.x + 1
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0");
  await expect(relation).toBeHidden();
  await expect(deck.locator(".editor-animation-player__controls"))
    .toHaveAttribute("aria-hidden", "true");

  await deck.locator(
    '[data-kp-focus-deck-select="locate-product"]'
  ).click();
  await expect(deck).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "locate-product"
  );
  await expect(deck.locator(
    '[data-kp-focus-deck-select="locate-product"]'
  )).toHaveAttribute("aria-current", "step");
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0");
  await expect(equation.locator(
    '.kp-log-product-equivalence-stage__frozen-source ' +
    '[data-kp-kinetic-figure-attention="focus"]'
  )).toHaveCount(1);

  await deck.locator('[data-kp-focus-deck-select="product-law"]').click();
  await expect(deck).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "product-law"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0");
  await expect(relation).toBeHidden();
  await expect(equation.locator(
    '.kp-log-product-equivalence-stage__frozen-source ' +
    '[data-kp-kinetic-figure-attention="focus"]'
  )).toHaveCount(1);
  await expect(deck.locator("[data-kp-focus-deck-next]")).toHaveText("");
  await expect(beats.nth(2)).toContainText("The pattern");
  await expect(beats.nth(2)).toContainText("so the law is available.");

  await deck.locator("[data-kp-focus-deck-next]").click();
  await expect(deck).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "apply-product-law"
  );
  await expect(deck.locator(".editor-animation-player__controls"))
    .toHaveAttribute("aria-hidden", "false");
  await expect(deck).toHaveAttribute(
    "data-kp-focus-deck-settled-beat",
    "apply-product-law",
    { timeout: 8_000 }
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "1");
  await expect(deck.locator(
    '[data-action="toggle-editor-animation"]'
  )).toHaveAccessibleName("Replay transformation");
  await expect(deck.locator(
    '[data-action="toggle-editor-animation"] ' +
    '[data-kp-focus-deck-control-icon="replay"]'
  )).toHaveCount(1);
  await expect(relation).toBeVisible();
  await expect(equation.locator(
    ".kp-log-product-equivalence-stage__frozen-source"
  )).toContainText("ln(xy)");
  await expect(equation.locator(
    ".kp-log-product-equivalence-stage__measurement--target"
  )).toContainText("ln(x)+ln(y)");

  await deck.locator("[data-kp-focus-deck-previous]").click();
  await expect(deck).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "product-law"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0");
  expect(new URL(page.url()).hash).toBe("#beat.product-law");
  expect(errors).toEqual([]);
});

test("Focus Deck direct links and reduced motion restore stable endpoints", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(
    `${path}?projection=focus-deck#beat.apply-product-law`
  );
  const deck = page.locator("[data-kp-kinetic-figure]");
  const player = deck.locator("[data-kp-editor-animation-player]");
  const equation = deck.locator("[data-kp-log-product-equivalence-stage]");
  await expect(equation).toHaveAttribute(
    "data-kp-log-product-equivalence-stage",
    "ready",
    { timeout: 15_000 }
  );
  await expect(deck).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "apply-product-law"
  );
  await expect(deck).toHaveAttribute(
    "data-kp-focus-deck-settled-beat",
    "apply-product-law"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "1");
  await expect(equation.locator(
    ".kp-log-product-equivalence-stage__relation"
  )).toBeVisible();

  await page.goBack();
  await page.goForward();
  await expect(deck).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "apply-product-law"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "1");
  const desktopExtent = await page.evaluate(() => ({
    viewportHeight: window.innerHeight,
    documentHeight: document.documentElement.scrollHeight
  }));
  expect(desktopExtent.documentHeight).toBeLessThanOrEqual(
    desktopExtent.viewportHeight + 1
  );
});

test("Focus Deck keeps one searchable prose occurrence and fits a phone", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await page.goto(`${path}?projection=focus-deck`);
  const deck = page.locator("[data-kp-kinetic-figure]");
  await expect(deck.locator("[data-kp-log-product-equivalence-stage]"))
    .toHaveAttribute("data-kp-log-product-equivalence-stage", "ready", {
      timeout: 15_000
    });
  await expect(deck.getByText(
    "The relevant structure is multiplication:",
    { exact: false }
  )).toHaveCount(1);
  await expect(deck.getByText(
    "The left side remains as a witness",
    { exact: false }
  )).toHaveCount(1);
  await expect(deck).toHaveAttribute(
    "data-kp-focus-deck-steps-expanded",
    "false"
  );
  await deck.locator("[data-kp-focus-deck-steps-toggle]").click();
  await expect(deck).toHaveAttribute(
    "data-kp-focus-deck-steps-expanded",
    "true"
  );
  await deck.locator(
    '[data-kp-focus-deck-select="apply-product-law"]'
  ).click();
  await expect(deck).toHaveAttribute(
    "data-kp-focus-deck-steps-expanded",
    "false"
  );
  await expect(deck).toHaveAttribute(
    "data-kp-focus-deck-settled-beat",
    "apply-product-law",
    { timeout: 8_000 }
  );
  const bounds = await deck.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth
  }));
  expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth + 1);
  const stepsBounds = await deck.locator(".kp-focus-deck__steps").boundingBox();
  const stageBounds = await deck.locator(".kp-focus-deck__stage").boundingBox();
  const nextBounds = await deck.locator("[data-kp-focus-deck-next]")
    .boundingBox();
  const previousBounds = await deck.locator("[data-kp-focus-deck-previous]")
    .boundingBox();
  expect(stepsBounds).not.toBeNull();
  expect(stageBounds).not.toBeNull();
  expect(nextBounds).not.toBeNull();
  expect(previousBounds).not.toBeNull();
  expect(stepsBounds!.y + stepsBounds!.height).toBeLessThanOrEqual(
    stageBounds!.y + 1
  );
  expect(nextBounds!.height).toBeGreaterThanOrEqual(44);
  expect(nextBounds!.width).toBeCloseTo(nextBounds!.height, 1);
  expect(previousBounds!.width).toBeCloseTo(previousBounds!.height, 1);
});

test("Focus Deck visual checkpoint captures the full-equation beats", async ({
  page
}, testInfo) => {
  await page.goto(`${path}?projection=focus-deck`);
  const deck = page.locator("[data-kp-kinetic-figure]");
  await expect(deck.locator("[data-kp-log-product-equivalence-stage]"))
    .toHaveAttribute("data-kp-log-product-equivalence-stage", "ready", {
      timeout: 15_000
    });

  for (const beat of [
    "orient",
    "locate-product",
    "product-law",
    "apply-product-law"
  ] as const) {
    await deck.locator(`[data-kp-focus-deck-select="${beat}"]`).click();
    await expect(deck).toHaveAttribute(
      "data-kp-focus-deck-settled-beat",
      beat,
      { timeout: 8_000 }
    );
    await page.screenshot({
      path: testInfo.outputPath(`focus-deck-${beat}.png`),
      fullPage: true
    });
  }

  await page.setViewportSize({ width: 390, height: 760 });
  await page.goto(`${path}?projection=focus-deck#beat.apply-product-law`);
  await expect(page.locator("[data-kp-kinetic-figure]")).toHaveAttribute(
    "data-kp-focus-deck-settled-beat",
    "apply-product-law",
    { timeout: 15_000 }
  );
  await page.screenshot({
    path: testInfo.outputPath("focus-deck-phone-apply-product-law.png"),
    fullPage: true
  });
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

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${path}?projection=micro-station`);
  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await scrollMicroStationToTravel(page, 0.53);
  await page.mouse.move(20, 20);
  await page.screenshot({
    path: testInfo.outputPath("kinetic-figure-micro-station-rewrite.png"),
    fullPage: false
  });
  await scrollMicroStationToTravel(page, 0.78);
  await page.mouse.move(20, 20);
  await page.screenshot({
    path: testInfo.outputPath("kinetic-figure-micro-station-inspect.png"),
    fullPage: false
  });

  await page.goto(`${path}?projection=glance-scrollytelling`);
  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await scrollGlanceStateToLanding(page, "product");
  await page.waitForTimeout(120);
  await page.mouse.move(20, 20);
  await page.screenshot({
    path: testInfo.outputPath(
      "kinetic-figure-glance-scrollytelling-product.png"
    ),
    fullPage: false
  });
  await scrollGlanceStateToLanding(page, "transform");
  await page.waitForTimeout(120);
  await page.mouse.move(20, 20);
  await page.screenshot({
    path: testInfo.outputPath(
      "kinetic-figure-glance-scrollytelling-rule.png"
    ),
    fullPage: false
  });
  await scrollGlanceEdgeToProgress(page, "transform", "result", 0.5);
  await page.waitForTimeout(120);
  await page.mouse.move(20, 20);
  await page.screenshot({
    path: testInfo.outputPath(
      "kinetic-figure-glance-scrollytelling-rewrite.png"
    ),
    fullPage: false
  });
  await scrollGlanceStateToLanding(page, "result");
  await page.waitForTimeout(120);
  await page.mouse.move(20, 20);
  await page.screenshot({
    path: testInfo.outputPath(
      "kinetic-figure-glance-scrollytelling-result.png"
    ),
    fullPage: false
  });

  await page.goto(`${path}?projection=stacked-station`);
  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await scrollStackedStageToApproach(page);
  await page.waitForTimeout(120);
  await page.mouse.move(20, 20);
  await page.screenshot({
    path: testInfo.outputPath("kinetic-figure-stacked-station-approach.png"),
    fullPage: false
  });
  await scrollStackedStateToLanding(page, "product");
  await page.waitForTimeout(120);
  await page.mouse.move(20, 20);
  await page.screenshot({
    path: testInfo.outputPath("kinetic-figure-stacked-station-product.png"),
    fullPage: false
  });
  await scrollStackedStateToLanding(page, "transform");
  await page.waitForTimeout(120);
  await page.mouse.move(20, 20);
  await page.screenshot({
    path: testInfo.outputPath("kinetic-figure-stacked-station-rule.png"),
    fullPage: false
  });
  await scrollStackedEdgeToProgress(page, "transform", "result", 0.5);
  await page.waitForTimeout(120);
  await page.mouse.move(20, 20);
  await page.screenshot({
    path: testInfo.outputPath("kinetic-figure-stacked-station-rewrite.png"),
    fullPage: false
  });
  await scrollStackedStateToLanding(page, "result");
  await page.waitForTimeout(120);
  await page.mouse.move(20, 20);
  await page.screenshot({
    path: testInfo.outputPath("kinetic-figure-stacked-station-result.png"),
    fullPage: false
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${path}?projection=stacked-station`);
  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await scrollStackedStageToApproach(page);
  await page.waitForTimeout(120);
  await page.screenshot({
    path: testInfo.outputPath(
      "kinetic-figure-stacked-station-mobile-approach.png"
    ),
    fullPage: false
  });
  await scrollStackedStateToLanding(page, "product");
  await page.waitForTimeout(120);
  await page.screenshot({
    path: testInfo.outputPath("kinetic-figure-stacked-station-mobile.png"),
    fullPage: false
  });
  await scrollStackedEdgeToProgress(page, "transform", "result", 0.5);
  await page.waitForTimeout(120);
  await page.screenshot({
    path: testInfo.outputPath(
      "kinetic-figure-stacked-station-mobile-rewrite.png"
    ),
    fullPage: false
  });
});

test("Micro Station makes scroll the reversible rewrite playhead", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${path}?projection=micro-station`);
  const pageRoot = page.locator(".kp-kinetic-figure-page");
  const figure = page.locator("[data-kp-kinetic-figure]");
  const player = figure.locator("[data-kp-editor-animation-player]");
  await expect(pageRoot).toHaveAttribute(
    "data-kp-kinetic-figure-projection",
    "micro-station"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-hydrated", "true");

  await scrollMicroStationToTravel(page, 0.25);
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-active-state",
    "product"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0");

  await scrollMicroStationToTravel(page, 0.53);
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-scroll-phase",
    "rewrite"
  );
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-settled-state",
    "scrubbing"
  );
  await expect.poll(async () => Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  )).toBeCloseTo(0.5, 2);
  await page.mouse.move(20, 20);
  await expect(figure.locator(
    '[data-kp-kinetic-figure-state="whole"]'
  )).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const paragraphBox = await figure.locator(
    ".kp-kinetic-figure__paragraph"
  ).boundingBox();
  const stageBox = await figure.locator(
    ".kp-kinetic-figure__figure"
  ).boundingBox();
  const figureBox = await figure.boundingBox();
  expect(paragraphBox).not.toBeNull();
  expect(stageBox).not.toBeNull();
  expect(figureBox?.y).toBeCloseTo(800 * 0.18, 0);
  expect((paragraphBox?.x ?? 0) + (paragraphBox?.width ?? 0)).toBeLessThan(
    stageBox?.x ?? 0
  );

  await scrollMicroStationToTravel(page, 0.47);
  const forwardSample = Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  );
  await scrollMicroStationToTravel(page, 0.64);
  await scrollMicroStationToTravel(page, 0.47);
  const reverseSample = Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  );
  expect(reverseSample).toBeCloseTo(forwardSample, 5);

  await figure.locator('[data-kp-kinetic-figure-state="result"]').click();
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-active-state",
    "result"
  );
  await expect.poll(async () => Number(
    await figure.getAttribute("data-kp-kinetic-figure-scroll-travel")
  )).toBeCloseTo(0.92, 2);
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "1");
  expect(new URL(page.url()).hash).toBe("#result");

  await page.goto(`${path}?projection=micro-station#transform`);
  const restoredFigure = page.locator("[data-kp-kinetic-figure]");
  await expect(restoredFigure.locator(
    "[data-kp-editor-animation-player]"
  )).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  await expect(restoredFigure).toHaveAttribute(
    "data-kp-kinetic-figure-active-state",
    "transform"
  );
  await expect.poll(async () => Number(
    await restoredFigure.getAttribute("data-kp-kinetic-figure-scroll-travel")
  )).toBeCloseTo(0.78, 2);
});

test("Glance Scrollytelling couples complete paragraphs to one sticky stage", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${path}?projection=glance-scrollytelling`);
  const pageRoot = page.locator(".kp-kinetic-figure-page");
  const figure = page.locator("[data-kp-kinetic-figure]");
  const player = figure.locator("[data-kp-editor-animation-player]");
  const passages = figure.locator(
    "[data-kp-kinetic-figure-scroll-passage]"
  );
  await expect(pageRoot).toHaveAttribute(
    "data-kp-kinetic-figure-projection",
    "glance-scrollytelling"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  await expect(passages).toHaveCount(4);
  await expect(passages.nth(2)).toContainText(
    "The product law,"
  );
  await expect(passages.nth(2)).toContainText(
    "applies because the argument is a product."
  );
  await expect(figure.locator("[data-kp-kinetic-figure-rule-toggle]"))
    .toHaveCount(0);
  await expect(figure.locator("[data-kp-kinetic-figure-state]"))
    .toHaveCount(0);
  await expect(passages.nth(2)).toHaveAttribute(
    "id",
    "passage.log-product.rule"
  );
  await expect(passages.nth(2).locator("a")).toHaveAttribute(
    "href",
    "#passage.log-product.rule"
  );

  const wholeLink = passages.nth(0).locator(
    '[data-kp-kinetic-figure-prose-link="whole"]'
  );
  const productLink = passages.nth(1).locator(
    '[data-kp-kinetic-figure-prose-link="product"]'
  );
  const ruleLink = passages.nth(2).locator(
    '[data-kp-kinetic-figure-prose-link="transform"]'
  );

  await scrollGlanceEdgeToProgress(page, "whole", "product", 0.325);
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-scroll-phase",
    "focus-release"
  );
  await expectNumericCustomProperty(
    wholeLink,
    "--kp-kinetic-figure-passage-rail-scale",
    0.5
  );
  await expect(productLink).toHaveCSS(
    "--kp-kinetic-figure-passage-rail-scale",
    "0.0000"
  );

  await scrollGlanceEdgeToProgress(page, "whole", "product", 0.675);
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-scroll-phase",
    "focus-reception"
  );
  await expect(wholeLink).toHaveCSS(
    "--kp-kinetic-figure-passage-rail-scale",
    "0.0000"
  );
  await expectNumericCustomProperty(
    productLink,
    "--kp-kinetic-figure-passage-rail-scale",
    0.5
  );
  await expectNumericCustomProperty(
    player,
    "--kp-kinetic-figure-product-mark-scale",
    0.5
  );

  await scrollGlanceStateToLanding(page, "product");
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-active-state",
    "product"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0");
  await expect(productLink).toHaveAttribute(
    "data-kp-semantic-salience-level",
    "focus"
  );
  await expect(productLink).toHaveCSS(
    "--kp-kinetic-figure-passage-rail-scale",
    "1.0000"
  );
  expect(await productLink.evaluate((element) =>
    getComputedStyle(element).color
  )).toBe(await wholeLink.evaluate((element) =>
    getComputedStyle(element).color
  ));
  expect(await productLink.evaluate((element) =>
    element.style.getPropertyValue(
      "--kp-kinetic-figure-passage-ink-share"
    )
  )).toBe("");
  expect(await player.evaluate((element) =>
    element.style.getPropertyValue("--kp-kinetic-figure-stage-ink-share")
  )).toBe("");
  await expect(player.locator(
    '[data-kp-kinetic-figure-attention="focus"]:visible'
  ).first()).toHaveCSS("background-image", /linear-gradient/);
  const narrativeBox = await figure.locator(
    ".kp-kinetic-figure__narrative-track"
  ).boundingBox();
  const stageBox = await figure.locator(
    ".kp-kinetic-figure__figure"
  ).boundingBox();
  expect(narrativeBox).not.toBeNull();
  expect(stageBox).not.toBeNull();
  expect((stageBox?.x ?? 0) + (stageBox?.width ?? 0)).toBeLessThan(
    narrativeBox?.x ?? 0
  );
  expect((narrativeBox?.x ?? 0) - (
    (stageBox?.x ?? 0) + (stageBox?.width ?? 0)
  )).toBeLessThan(40);
  expect(await figure.locator(
    ".kp-kinetic-figure__narrative-track + .kp-kinetic-figure__figure"
  )).toHaveCount(1);
  const productPassageBox = await passages.nth(1).boundingBox();
  expect(productPassageBox).not.toBeNull();
  expect(productPassageBox?.y).toBeCloseTo(800 * 0.36, 0);
  expect((stageBox?.y ?? 0) + (stageBox?.height ?? 0) / 2)
    .toBeCloseTo(800 * 0.36, 0);

  await scrollGlanceEdgeToProgress(page, "product", "transform", 0.325);
  await expectNumericCustomProperty(
    productLink,
    "--kp-kinetic-figure-passage-rail-scale",
    0.5
  );
  await expect(ruleLink).toHaveCSS(
    "--kp-kinetic-figure-passage-rail-scale",
    "0.0000"
  );
  await expectNumericCustomProperty(
    player,
    "--kp-kinetic-figure-product-mark-scale",
    0.5
  );

  await scrollGlanceEdgeToProgress(page, "product", "transform", 0.675);
  await expect(productLink).toHaveCSS(
    "--kp-kinetic-figure-passage-rail-scale",
    "0.0000"
  );
  await expectNumericCustomProperty(
    ruleLink,
    "--kp-kinetic-figure-passage-rail-scale",
    0.5
  );
  await expect(player).toHaveCSS(
    "--kp-kinetic-figure-product-mark-scale",
    "0.0000"
  );

  await scrollGlanceStateToLanding(page, "transform");
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-scroll-phase",
    "rule"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0");
  await expect(passages.nth(2).locator("a")).toHaveAttribute(
    "aria-current",
    "step"
  );
  expect(await passages.nth(2).locator(
    ".kp-kinetic-figure__rule-template"
  ).evaluate((element) => element.getClientRects().length)).toBe(1);
  expect(new URL(page.url()).hash).toBe("#passage.log-product.rule");

  await scrollGlanceEdgeToProgress(page, "transform", "result", 0.25);
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-scroll-phase",
    "armed"
  );
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-attention-owner",
    "stage"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0");
  await expect(passages.locator("a[aria-current]"))
    .toHaveCount(0);

  await scrollGlanceEdgeToProgress(page, "transform", "result", 0.5);
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-settled-state",
    "scrubbing"
  );
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-scroll-phase",
    "rewrite"
  );
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-attention-owner",
    "stage"
  );
  await expect.poll(async () => Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  )).toBeCloseTo(0.5, 2);
  await expect(passages.locator("a[aria-current]"))
    .toHaveCount(0);
  await expect(passages.nth(2).locator("a")).toHaveCSS(
    "--kp-kinetic-figure-passage-rail-scale",
    "0.0000"
  );
  await expect(passages.nth(3).locator("a")).toHaveCSS(
    "--kp-kinetic-figure-passage-rail-scale",
    "0.0000"
  );
  expect(new URL(page.url()).hash).toBe("#passage.log-product.rule");
  const forwardSample = Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  );
  await scrollGlanceEdgeToProgress(page, "transform", "result", 0.64);
  await scrollGlanceEdgeToProgress(page, "transform", "result", 0.5);
  const reverseSample = Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  );
  expect(reverseSample).toBeCloseTo(forwardSample, 5);

  await scrollGlanceStateToLanding(page, "result");
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-active-state",
    "result"
  );
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-scroll-phase",
    "inspect"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "1");
  await expect(passages.nth(3).locator("a")).toHaveAttribute(
    "aria-current",
    "step"
  );
  const resultPassageBox = await passages.nth(3).boundingBox();
  expect(resultPassageBox).not.toBeNull();
  expect(resultPassageBox?.y).toBeCloseTo(800 * 0.36, 0);
  expect(new URL(page.url()).hash).toBe("#passage.log-product.result");

  await page.goto(
    `${path}?projection=glance-scrollytelling#passage.log-product.rule`
  );
  const restoredFigure = page.locator("[data-kp-kinetic-figure]");
  await expect(restoredFigure.locator(
    "[data-kp-editor-animation-player]"
  )).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  await expect(restoredFigure).toHaveAttribute(
    "data-kp-kinetic-figure-active-state",
    "transform"
  );
  await expect(restoredFigure.locator(
    "[data-kp-editor-animation-player]"
  )).toHaveAttribute("data-kp-editor-animation-progress", "0");
  await expect(restoredFigure).toHaveAttribute(
    "data-kp-kinetic-figure-scroll-phase",
    "rule"
  );

  await page.goto(
    `${path}?projection=glance-scrollytelling#passage.log-product.result`
  );
  const restoredResultFigure = page.locator("[data-kp-kinetic-figure]");
  const restoredResultPlayer = restoredResultFigure.locator(
    "[data-kp-editor-animation-player]"
  );
  await expect(restoredResultPlayer).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await expect(restoredResultFigure).toHaveAttribute(
    "data-kp-kinetic-figure-scroll-phase",
    "inspect"
  );
  await expect(restoredResultPlayer).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "1"
  );
  await page.waitForTimeout(180);
  await expect(restoredResultPlayer).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "1"
  );
});

test("Stacked Station gives prose and the stage sequential attention ownership", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${path}?projection=stacked-station`);
  const pageRoot = page.locator(".kp-kinetic-figure-page");
  const figure = page.locator("[data-kp-kinetic-figure]");
  const stage = figure.locator(".kp-kinetic-figure__figure");
  const player = figure.locator("[data-kp-editor-animation-player]");
  const passages = figure.locator(
    "[data-kp-kinetic-figure-scroll-passage]"
  );
  const narrative = figure.locator(".kp-kinetic-figure__narrative-track");
  const transitionMarker = figure.locator(
    "[data-kp-kinetic-figure-transition]"
  );
  const transitionLabel = transitionMarker.locator(
    "[data-kp-kinetic-figure-transition-label]"
  );
  await expect(pageRoot).toHaveAttribute(
    "data-kp-kinetic-figure-projection",
    "stacked-station"
  );
  await expect(pageRoot).toHaveAttribute(
    "data-kp-kinetic-figure-passage-scroll",
    ""
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  await expect(passages).toHaveCount(4);
  await expect(transitionMarker).toHaveCount(1);
  await expect(transitionMarker).toContainText("Apply the product law");
  await expect(narrative.getByText(
    "Nothing has been approximated",
    { exact: false }
  )).toHaveCount(1);
  expect(await passages.evaluateAll((elements) => elements.every((element) => {
    const style = getComputedStyle(element);
    return style.display !== "none" && style.visibility === "visible" &&
      style.opacity === "1";
  }))).toBe(true);
  expect(await page.evaluate(() => {
    const searchableWindow = window as unknown as Window & {
      find(text: string): boolean;
    };
    const found = searchableWindow.find("Nothing has been approximated");
    window.getSelection()?.removeAllRanges();
    return found;
  })).toBe(true);
  await expect(figure.locator(
    ".kp-kinetic-figure__figure + .kp-kinetic-figure__narrative-track"
  )).toHaveCount(1);
  await expect(figure.locator("[data-kp-kinetic-figure-rule-toggle]"))
    .toHaveCount(0);
  await expect(figure.locator("[data-kp-kinetic-figure-state]"))
    .toHaveCount(0);

  const productLink = passages.nth(1).locator(
    '[data-kp-kinetic-figure-prose-link="product"]'
  );
  const ruleLink = passages.nth(2).locator(
    '[data-kp-kinetic-figure-prose-link="transform"]'
  );

  const intrinsicStageBox = await stage.boundingBox();
  expect(intrinsicStageBox).not.toBeNull();
  expect(intrinsicStageBox?.height ?? 800).toBeLessThan(800 * 0.25);
  const narrativeBox = await narrative.boundingBox();
  expect(narrativeBox).not.toBeNull();
  expect(intrinsicStageBox?.width).toBeCloseTo(narrativeBox?.width ?? 0, 1);

  await scrollStackedStateToLanding(page, "product");
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-scroll-phase",
    "locate"
  );
  await expect(productLink).toHaveAttribute("aria-current", "step");
  await expectNumericCustomProperty(
    productLink,
    "--kp-kinetic-figure-passage-rail-scale",
    1
  );
  await expectNumericCustomProperty(
    figure,
    "--kp-kinetic-figure-stage-ownership-scale",
    0
  );
  expect(await productLink.evaluate((element) =>
    getComputedStyle(element, "::before").content
  )).toBe("none");
  expect(await stage.evaluate((element) =>
    getComputedStyle(element, "::after").content
  )).toBe("none");
  const productNumber = productLink.locator(
    ".kp-kinetic-figure__passage-number"
  );
  const contextNumber = passages.nth(0).locator(
    ".kp-kinetic-figure__passage-number"
  );
  await expect.poll(async () =>
    await productNumber.evaluate((element) => getComputedStyle(element).color) !==
      await contextNumber.evaluate((element) => getComputedStyle(element).color)
  ).toBe(true);
  await expect(player.locator(
    '[data-kp-kinetic-figure-attention="focus"]:visible'
  ).first()).toHaveCSS("background-image", /linear-gradient/);
  const productPassageBox = await passages.nth(1).boundingBox();
  const productStageBox = await stage.boundingBox();
  expect(productPassageBox).not.toBeNull();
  expect(productStageBox).not.toBeNull();
  expect(productPassageBox?.y).toBeCloseTo(800 * 0.58, 0);
  expect((productStageBox?.y ?? 0) + (productStageBox?.height ?? 0))
    .toBeCloseTo(800 * 0.5, 1);
  expect(productStageBox?.height ?? 800).toBeLessThan(800 * 0.25);
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-station-lifecycle",
    "docked"
  );
  await expect.poll(async () => Number.parseFloat(await narrative.evaluate(
    (element) => getComputedStyle(element).getPropertyValue(
      "--kp-kinetic-figure-narrative-clip-top"
    )
  ))).toBeGreaterThan(0);
  const productMaterialBox = await stage.locator(
    ".kp-log-product-stage"
  ).boundingBox();
  const productMaterialCenterY = (productMaterialBox?.y ?? 0) +
    (productMaterialBox?.height ?? 0) / 2;
  expect(productMaterialCenterY).toBeGreaterThan(800 * 0.37);
  expect(productMaterialCenterY).toBeLessThan(800 * 0.43);
  expect((productStageBox?.y ?? 0) + (productStageBox?.height ?? 0))
    .toBeLessThan(productPassageBox?.y ?? 0);
  expect(Math.abs(
    (productStageBox?.x ?? 0) + (productStageBox?.width ?? 0) / 2 -
      ((productPassageBox?.x ?? 0) + (productPassageBox?.width ?? 0) / 2)
  )).toBeLessThan(2);

  const approachTop = await scrollStackedStageToApproach(page);
  await expect.poll(async () => (await stage.boundingBox())?.y ?? 0)
    .toBeCloseTo(approachTop, 0);
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-station-lifecycle",
    "approaching"
  );
  await expect.poll(async () => Number.parseFloat(await narrative.evaluate(
    (element) => getComputedStyle(element).getPropertyValue(
      "--kp-kinetic-figure-narrative-clip-top"
    )
  ))).toBeCloseTo(0, 1);
  await scrollStackedStateToLanding(page, "product");

  await scrollStackedStateToLanding(page, "transform");
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-scroll-phase",
    "rule"
  );
  await expect(ruleLink).toHaveAttribute("aria-current", "step");
  expect(await ruleLink.locator(
    ".kp-kinetic-figure__rule-template"
  ).evaluate((element) => element.getClientRects().length)).toBe(1);
  const ruleStageBox = await stage.boundingBox();
  expect(ruleStageBox?.y).toBeCloseTo(productStageBox?.y ?? 0, 1);

  await scrollStackedEdgeToProgress(page, "transform", "result", 0.25);
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-scroll-phase",
    "armed"
  );
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-attention-owner",
    "stage"
  );
  await expect(passages.locator("a[aria-current]")).toHaveCount(0);
  await expectNumericCustomProperty(
    figure,
    "--kp-kinetic-figure-stage-ownership-scale",
    1
  );
  const armedTransitionLabelBox = await transitionLabel.boundingBox();
  expect(armedTransitionLabelBox?.y).toBeCloseTo(800 * 0.58, 1);
  await expect(transitionLabel).toHaveCSS("opacity", "1");
  expect(await transitionLabel.evaluate((element) =>
    getComputedStyle(element, "::after").content
  )).toBe("none");
  expect(await transitionLabel.evaluate((element) => Number.parseFloat(
    getComputedStyle(element, "::before").width
  ))).toBeLessThan(24);

  await scrollStackedEdgeToProgress(page, "transform", "result", 0.5);
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-scroll-phase",
    "rewrite"
  );
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-settled-state",
    "scrubbing"
  );
  await expect.poll(async () => Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  )).toBeCloseTo(0.5, 2);
  const rewriteStageBox = await stage.boundingBox();
  expect(rewriteStageBox?.y).toBeCloseTo(ruleStageBox?.y ?? 0, 1);
  const rewriteTransitionLabelBox = await transitionLabel.boundingBox();
  expect(rewriteTransitionLabelBox?.y).toBeCloseTo(800 * 0.58, 1);
  const forwardSample = Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  );
  await scrollStackedEdgeToProgress(page, "transform", "result", 0.64);
  await scrollStackedEdgeToProgress(page, "transform", "result", 0.5);
  expect(Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  )).toBeCloseTo(forwardSample, 5);

  await scrollStackedEdgeToProgress(page, "transform", "result", 0.75);
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-scroll-phase",
    "settled"
  );
  await expect(transitionLabel).toHaveCSS("opacity", "0");

  await scrollStackedStateToLanding(page, "result");
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-scroll-phase",
    "inspect"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "1");
  await expect(passages.nth(3).locator("a")).toHaveAttribute(
    "aria-current",
    "step"
  );
  await expectNumericCustomProperty(
    figure,
    "--kp-kinetic-figure-stage-ownership-scale",
    0
  );
  await expect(transitionLabel).toHaveCSS("opacity", "0");
  const resultPassageBox = await passages.nth(3).boundingBox();
  expect(resultPassageBox?.y).toBeCloseTo(800 * 0.58, 0);
  expect(new URL(page.url()).hash).toBe("#passage.log-product.result");

  await page.evaluate(() => window.scrollTo(
    0,
    document.documentElement.scrollHeight
  ));
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-station-lifecycle",
    "releasing"
  );

  await page.goto(
    `${path}?projection=stacked-station#passage.log-product.rule`
  );
  const restoredFigure = page.locator("[data-kp-kinetic-figure]");
  await expect(restoredFigure.locator(
    "[data-kp-editor-animation-player]"
  )).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  await expect(restoredFigure).toHaveAttribute(
    "data-kp-kinetic-figure-scroll-phase",
    "rule"
  );
  await expect(restoredFigure.locator(
    "[data-kp-kinetic-figure-transition-label]"
  )).toHaveCSS("opacity", "1");
  await expect(restoredFigure.locator(
    "[data-kp-editor-animation-player]"
  )).toHaveAttribute("data-kp-editor-animation-progress", "0");
});

test("Stacked Station keeps the same document and trigger grammar on mobile", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${path}?projection=stacked-station`);
  const pageRoot = page.locator(".kp-kinetic-figure-page");
  const figure = page.locator("[data-kp-kinetic-figure]");
  const stage = figure.locator(".kp-kinetic-figure__figure");
  const passages = figure.locator(
    "[data-kp-kinetic-figure-scroll-passage]"
  );
  const transitionLabel = figure.locator(
    "[data-kp-kinetic-figure-transition-label]"
  );
  await expect(pageRoot).toHaveAttribute(
    "data-kp-kinetic-figure-projection",
    "stacked-station"
  );
  await expect(passages).toHaveCount(4);
  await expect(transitionLabel).toHaveText("Apply the product law");

  await scrollStackedStateToLanding(page, "product");
  const productStageBox = await stage.boundingBox();
  const productPassageBox = await passages.nth(1).boundingBox();
  expect((productStageBox?.y ?? 0) + (productStageBox?.height ?? 0))
    .toBeCloseTo(844 * 0.5, 1);
  expect(productStageBox?.height ?? 844).toBeLessThan(844 * 0.25);
  expect(productPassageBox?.y).toBeCloseTo(844 * 0.58, 0);
  const productMaterialBox = await stage.locator(
    ".kp-log-product-stage"
  ).boundingBox();
  const productMaterialCenterY = (productMaterialBox?.y ?? 0) +
    (productMaterialBox?.height ?? 0) / 2;
  expect(productMaterialCenterY).toBeGreaterThan(844 * 0.37);
  expect(productMaterialCenterY).toBeLessThan(844 * 0.43);
  expect((productStageBox?.y ?? 0) + (productStageBox?.height ?? 0))
    .toBeLessThan(productPassageBox?.y ?? 0);

  await scrollStackedEdgeToProgress(page, "transform", "result", 0.5);
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-scroll-phase",
    "rewrite"
  );
  await expect.poll(async () => Number(await figure.locator(
    "[data-kp-editor-animation-player]"
  ).getAttribute("data-kp-editor-animation-progress"))).toBeCloseTo(0.5, 2);
  const transitionLabelBox = await transitionLabel.boundingBox();
  expect(transitionLabelBox?.y).toBeCloseTo(844 * 0.58, 1);
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <=
      document.documentElement.clientWidth + 1
  )).toBe(true);
});

test("the local figure remains deterministic and contained without motion", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${path}?projection=micro-station#transform`);
  await expect(page.locator(".kp-kinetic-figure-page")).toHaveAttribute(
    "data-kp-kinetic-figure-projection",
    "local-split"
  );
  const figure = page.locator("[data-kp-kinetic-figure]");
  await expect(figure.locator("[data-kp-editor-animation-player]")).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-settled-state",
    "transform"
  );
  const paragraphBox = await figure.locator(
    ".kp-kinetic-figure__paragraph"
  ).boundingBox();
  const figureBox = await figure.locator(
    ".kp-kinetic-figure__figure"
  ).boundingBox();
  expect(paragraphBox).not.toBeNull();
  expect(figureBox).not.toBeNull();
  expect((paragraphBox?.y ?? 0) + (paragraphBox?.height ?? 0)).toBeLessThan(
    figureBox?.y ?? 0
  );
  await expect(figure.locator(
    "[data-kp-editor-animation-player]"
  )).toHaveAttribute("data-kp-editor-animation-progress", "1");
  await figure.locator('[data-kp-kinetic-figure-state="result"]').click();
  await expect(figure).toHaveAttribute(
    "data-kp-kinetic-figure-settled-state",
    "result"
  );

  await page.goto(
    `${path}?projection=stacked-station#passage.log-product.rule`
  );
  const stackedFallback = page.locator("[data-kp-kinetic-figure]");
  await expect(page.locator(".kp-kinetic-figure-page")).toHaveAttribute(
    "data-kp-kinetic-figure-projection",
    "local-split"
  );
  await expect(stackedFallback).toHaveAttribute(
    "data-kp-kinetic-figure-settled-state",
    "transform"
  );
  await expect(stackedFallback.locator(
    "[data-kp-editor-animation-player]"
  )).toHaveAttribute("data-kp-editor-animation-progress", "1");
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  )).toBe(true);
});

async function scrollMicroStationToTravel(
  page: Page,
  travel: number
): Promise<void> {
  await page.evaluate((nextTravel) => {
    const anchor = document.querySelector<HTMLElement>(
      "[data-kp-kinetic-figure-corridor-anchor]"
    );
    if (anchor === null) throw new Error("Missing Micro Station corridor anchor.");
    const anchorDocumentTop = anchor.getBoundingClientRect().top + window.scrollY;
    const start = window.innerHeight * 0.18;
    const end = window.innerHeight * -0.72;
    const targetAnchorTop = start - nextTravel * (start - end);
    window.scrollTo(0, anchorDocumentTop - targetAnchorTop);
  }, travel);
  await expect.poll(async () => Number(
    await page.locator("[data-kp-kinetic-figure]").getAttribute(
      "data-kp-kinetic-figure-scroll-travel"
    )
  )).toBeCloseTo(travel, 2);
}

type PassageStateId = "whole" | "product" | "transform" | "result";

async function scrollStackedStageToApproach(page: Page): Promise<number> {
  return page.evaluate(() => {
    const station = document.querySelector<HTMLElement>(
      "[data-kp-kinetic-figure]"
    );
    if (station === null) throw new Error("Missing intrinsic dock station.");
    const stage = station.querySelector<HTMLElement>(
      ".kp-kinetic-figure__figure"
    );
    if (stage === null) throw new Error("Missing intrinsic dock stage.");
    const stationStyle = getComputedStyle(station);
    const naturalStageDocumentTop = station.getBoundingClientRect().top +
      window.scrollY + Number.parseFloat(stationStyle.borderTopWidth) +
      Number.parseFloat(stationStyle.paddingTop);
    const stageStyle = getComputedStyle(stage);
    const dockTop = Number.parseFloat(stageStyle.getPropertyValue(
      "--kp-kinetic-figure-stage-dock-top"
    ));
    const targetTop = dockTop + stage.getBoundingClientRect().height * 0.15;
    window.scrollTo(0, naturalStageDocumentTop - targetTop);
    return targetTop;
  });
}

async function scrollGlanceStateToLanding(
  page: Page,
  stateId: PassageStateId
): Promise<void> {
  await scrollPassageStateToLanding(page, stateId, 0.36);
}

async function scrollStackedStateToLanding(
  page: Page,
  stateId: PassageStateId
): Promise<void> {
  await scrollPassageStateToLanding(page, stateId, 0.58);
}

async function scrollPassageStateToLanding(
  page: Page,
  stateId: PassageStateId,
  readingLineViewportRatio: number
): Promise<void> {
  await page.evaluate(({ nextStateId, readingLineViewportRatio }) => {
    const passage = document.querySelector<HTMLElement>(
      `[data-kp-kinetic-figure-scroll-passage="${nextStateId}"]`
    );
    if (passage === null) {
      throw new Error("Missing passage-scroll paragraph.");
    }
    const passageDocumentTop = passage.getBoundingClientRect().top +
      window.scrollY;
    window.scrollTo(
      0,
      passageDocumentTop - window.innerHeight * readingLineViewportRatio
    );
  }, { nextStateId: stateId, readingLineViewportRatio });
  await expect(page.locator("[data-kp-kinetic-figure]")).toHaveAttribute(
    "data-kp-kinetic-figure-active-state",
    stateId
  );
}

async function scrollGlanceEdgeToProgress(
  page: Page,
  sourceStateId: PassageStateId,
  targetStateId: PassageStateId,
  progress: number
): Promise<void> {
  await scrollPassageEdgeToProgress(
    page,
    sourceStateId,
    targetStateId,
    progress,
    0.36
  );
}

async function scrollStackedEdgeToProgress(
  page: Page,
  sourceStateId: PassageStateId,
  targetStateId: PassageStateId,
  progress: number
): Promise<void> {
  if (sourceStateId !== "transform" || targetStateId !== "result") {
    await scrollPassageEdgeToProgress(
      page,
      sourceStateId,
      targetStateId,
      progress,
      0.58
    );
    return;
  }
  await page.evaluate((semanticProgress) => {
    const documentTop = (element: Element): number =>
      element.getBoundingClientRect().top + window.scrollY;
    const source = document.querySelector<HTMLElement>(
      '[data-kp-kinetic-figure-scroll-passage="transform"]'
    );
    const target = document.querySelector<HTMLElement>(
      '[data-kp-kinetic-figure-scroll-passage="result"]'
    );
    const marker = document.querySelector<HTMLElement>(
      "[data-kp-kinetic-figure-transition]"
    );
    if (source === null || target === null || marker === null) {
      throw new Error("Missing Stacked Station transition geometry.");
    }
    const readingLine = window.innerHeight * 0.58;
    const sourceLanding = documentTop(source) - readingLine;
    const targetLanding = documentTop(target) - readingLine;
    const markerBounds = marker.getBoundingClientRect();
    const transitionStart = documentTop(marker) - readingLine;
    const transitionEnd = documentTop(marker) + markerBounds.height * 0.8 -
      readingLine;
    const project = (
      value: number,
      sourceStart: number,
      sourceEnd: number,
      targetStart: number,
      targetEnd: number
    ): number => targetStart +
      (value - sourceStart) / (sourceEnd - sourceStart) *
        (targetEnd - targetStart);
    const scrollY = semanticProgress <= 0.2
      ? project(semanticProgress, 0, 0.2, sourceLanding, transitionStart)
      : semanticProgress <= 0.8
        ? project(
            semanticProgress,
            0.2,
            0.8,
            transitionStart,
            transitionEnd
          )
        : project(
            semanticProgress,
            0.8,
            1,
            transitionEnd,
            targetLanding
          );
    window.scrollTo(0, scrollY);
  }, progress);
  await expect.poll(async () => Number(
    await page.locator("[data-kp-kinetic-figure]").getAttribute(
      "data-kp-kinetic-figure-scroll-travel"
    )
  )).toBeCloseTo(progress, 2);
}

async function scrollPassageEdgeToProgress(
  page: Page,
  sourceStateId: PassageStateId,
  targetStateId: PassageStateId,
  progress: number,
  readingLineViewportRatio: number
): Promise<void> {
  await page.evaluate(({
    sourceStateId,
    targetStateId,
    progress,
    readingLineViewportRatio
  }) => {
    const passageDocumentTop = (stateId: PassageStateId): number => {
      const passage = document.querySelector<HTMLElement>(
        `[data-kp-kinetic-figure-scroll-passage="${stateId}"]`
      );
      if (passage === null) {
        throw new Error("Missing passage-scroll paragraph.");
      }
      return passage.getBoundingClientRect().top + window.scrollY;
    };
    const readingLine = window.innerHeight * readingLineViewportRatio;
    const sourceLanding = passageDocumentTop(sourceStateId) - readingLine;
    const targetLanding = passageDocumentTop(targetStateId) - readingLine;
    window.scrollTo(
      0,
      sourceLanding + progress * (targetLanding - sourceLanding)
    );
  }, {
    sourceStateId,
    targetStateId,
    progress,
    readingLineViewportRatio
  });
  await expect.poll(async () => Number(
    await page.locator("[data-kp-kinetic-figure]").getAttribute(
      "data-kp-kinetic-figure-scroll-travel"
    )
  )).toBeCloseTo(progress, 2);
}

async function expectNumericCustomProperty(
  locator: Locator,
  property: string,
  expected: number
): Promise<void> {
  await expect.poll(async () => Number(await locator.evaluate(
    (element, propertyName) => getComputedStyle(element)
      .getPropertyValue(propertyName),
    property
  ))).toBeCloseTo(expected, 1);
}
