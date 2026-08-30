import { expect, test } from "@playwright/test";

const path = "/experiments/kinetic-figure/supply-tax-scroll-score/";

async function seekPhraseProgress(
  page: import("@playwright/test").Page,
  phraseId: string,
  progress: number
): Promise<void> {
  const phrase = page.locator(
    `[data-kp-scroll-score-phrase="${phraseId}"]`
  );
  const units = await phrase.evaluate((element, requestedProgress) => {
    const node = element as HTMLElement;
    const start = Number(node.dataset["kpScrollScoreStartUnits"]);
    const end = Number(node.dataset["kpScrollScoreEndUnits"]);
    return start + (end - start) * requestedProgress;
  }, progress);
  await page.locator("[data-kp-scroll-score-rail]").evaluate(
    (element, value) => {
      const input = element as HTMLInputElement;
      input.value = String(value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    },
    units
  );
}

async function expectNumericAttribute(
  locator: import("@playwright/test").Locator,
  name: string,
  expected: number
): Promise<void> {
  await expect.poll(async () => Number(await locator.getAttribute(name)))
    .toBeCloseTo(expected, 2);
}

test("Scroll Score mounts one searchable two-paragraph semantic station", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(path);
  const score = page.locator("[data-kp-supply-tax-scroll-score]");
  await expect(score).toHaveAttribute(
    "data-kp-scroll-score-phrase-focus-profile",
    "reception-wave"
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-kp-visual-theme",
    "dark"
  );
  await expect(page.locator(".kp-scroll-score-page")).toHaveCSS(
    "background-color",
    "rgb(13, 14, 28)"
  );
  await expect(score).toHaveAttribute("data-kp-scroll-score-active-phrase",
    "orient-market");
  await expect(score.locator("[data-kp-scroll-score-cue]")).toHaveCount(2);
  await expect(score.locator("[data-kp-scroll-score-phrase]")).toHaveCount(8);
  await expect(score.getByText(
    "The contraction reduces consumer and producer surplus",
    { exact: false }
  )).toHaveCount(1);
  await expect(score.locator("[data-kp-scroll-score-rail]"))
    .toHaveAccessibleName("Supply-tax semantic score");
  await expect(score.locator("svg text")).toHaveCount(0);
  await expect(score.locator(".kp-supply-tax-graph__math .katex"))
    .toHaveCount(27);
  const proseMath = score.locator(
    ".kp-scroll-score-phrase .kp-article-math--inline"
  );
  expect(await proseMath.count()).toBeGreaterThan(0);
  await expect(proseMath.first()).toHaveAttribute(
    "data-kp-scroll-score-coverage-unit",
    /\d+/u
  );
  await expect(proseMath.locator("[data-kp-scroll-score-coverage-unit]"))
    .toHaveCount(0);
  expect(errors).toEqual([]);
});

test("rail and native scroll settle a reversible semantic reception wave", async ({
  page
}) => {
  await page.goto(path);
  const score = page.locator("[data-kp-supply-tax-scroll-score]");
  await seekPhraseProgress(page, "shift-supply", 0.5);
  await expect(score).toHaveAttribute("data-kp-scroll-score-active-phrase",
    "shift-supply");
  await expectNumericAttribute(score, "data-kp-scroll-score-phrase-progress",
    0.5);
  await expectNumericAttribute(score, "data-kp-supply-tax-model-progress",
    0.5);
  await expectNumericAttribute(score, "data-kp-supply-tax-transition-progress",
    0.5);
  const activePhrase = score.locator(
    '[data-kp-scroll-score-phrase="shift-supply"]'
  );
  await expect(activePhrase).toHaveAttribute(
    "data-kp-scroll-score-phrase-attention",
    "focus"
  );
  expect(await activePhrase.evaluate((element) => ({
    focus: Number((element as HTMLElement).style.getPropertyValue(
      "--kp-scroll-score-phrase-focus"
    )),
    opacity: getComputedStyle(element).opacity,
    decoration: getComputedStyle(element).textDecorationLine
  }))).toEqual(expect.objectContaining({
    focus: 1,
    opacity: "1",
    decoration: "none"
  }));
  const progressUnits = activePhrase.locator(
    "[data-kp-scroll-score-coverage-unit]"
  );
  expect(await progressUnits.count()).toBeGreaterThan(3);
  const settledAtHalf = await progressUnits.evaluateAll((elements) =>
    elements.map((element) => Number(
      (element as HTMLElement).style.getPropertyValue(
        "--kp-scroll-score-unit-coverage"
      )
    )));
  expect(settledAtHalf.every((value) => value === 1)).toBe(true);
  expect(await progressUnits.first().evaluate((element) => ({
    background: getComputedStyle(element).backgroundImage,
    opacity: getComputedStyle(element).opacity
  }))).toEqual(expect.objectContaining({
    background: "none",
    opacity: "1"
  }));
  const taxedSupply = score.locator(
    '[data-kp-supply-tax-entity="curve.economics.tax.supply-with-tax"]'
  );
  expect(await taxedSupply.evaluate((element) => Number(
    (element as HTMLElement).style.getPropertyValue(
      "--kp-supply-tax-bloom-progress"
    )
  ))).toBe(0);

  await seekPhraseProgress(page, "shift-supply", 0.09);
  await expectNumericAttribute(score, "data-kp-scroll-score-phrase-progress",
    0.09);
  await expectNumericAttribute(score, "data-kp-supply-tax-model-progress",
    0.09);
  const waveAtReception = await progressUnits.evaluateAll((elements) =>
    elements.map((element) => Number(
      (element as HTMLElement).style.getPropertyValue(
        "--kp-scroll-score-unit-coverage"
      )
    )));
  expect(Math.max(...waveAtReception)).toBeGreaterThan(0.75);
  expect(Math.min(...waveAtReception)).toBeGreaterThan(0.4);
  expect(Math.min(...waveAtReception)).toBeLessThan(0.6);
  expect(new Set(await progressUnits.evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).color))).size)
    .toBeGreaterThan(1);

  await seekPhraseProgress(page, "shift-supply", 0.5);
  await seekPhraseProgress(page, "shift-supply", 0.09);
  expect(await progressUnits.evaluateAll((elements) =>
    elements.map((element) => Number(
      (element as HTMLElement).style.getPropertyValue(
        "--kp-scroll-score-unit-coverage"
      )
    )))).toEqual(waveAtReception);

  const stationBox = await score.locator(
    "[data-kp-scroll-score-station]"
  ).boundingBox();
  const cueBox = await score.locator(
    '[data-kp-scroll-score-corridor="market-adjustment"] ' +
    "[data-kp-scroll-score-cue]"
  ).boundingBox();
  expect(stationBox).not.toBeNull();
  expect(cueBox).not.toBeNull();
  expect(cueBox!.y).toBeGreaterThanOrEqual(
    stationBox!.y + stationBox!.height - 2
  );
  expect(cueBox!.y + cueBox!.height).toBeLessThanOrEqual(
    (await page.viewportSize())!.height + 1);
});

test("semantic links, keyboard rail, and native find seek stable endpoints", async ({
  page
}) => {
  await page.goto(`${path}#phrase.trace-revenue`);
  const score = page.locator("[data-kp-supply-tax-scroll-score]");
  await expect(score).toHaveAttribute("data-kp-scroll-score-active-phrase",
    "trace-revenue");
  await expect(score.locator(
    ".kp-supply-tax-graph__region--government-revenue"
  )).toBeVisible();

  const rail = score.locator("[data-kp-scroll-score-rail]");
  await rail.focus();
  await page.keyboard.press("ArrowRight");
  await expect(score).toHaveAttribute("data-kp-scroll-score-active-phrase",
    "identify-loss");
  expect(new URL(page.url()).hash).toBe("#phrase.identify-loss");

  await page.goto(path);
  expect(await page.evaluate(() => {
    const searchable = window as unknown as Window & {
      find(text: string): boolean;
    };
    return searchable.find("prevented trades between three and five");
  })).toBe(true);
  await expect(score).toHaveAttribute("data-kp-scroll-score-active-phrase",
    "identify-loss");
  await expect(score.locator(
    ".kp-supply-tax-graph__region--deadweight-loss"
  )).toBeVisible();
});

test("legacy attention comparisons remain geometry-compatible", async ({
  page
}) => {
  await page.goto(`${path}?phrase-focus=reception#phrase.shift-supply`);
  const score = page.locator("[data-kp-supply-tax-scroll-score]");
  await expect(score).toHaveAttribute(
    "data-kp-scroll-score-phrase-focus-profile",
    "reception"
  );
  const phrase = score.locator(
    '[data-kp-scroll-score-phrase="shift-supply"]'
  );
  await expect(phrase.locator("[data-kp-scroll-score-coverage-unit]"))
    .toHaveCount(0);
  expect(await phrase.evaluate((element) =>
    getComputedStyle(element).backgroundImage)).toContain("linear-gradient");
  const receptionHeight = await score.locator(
    '[data-kp-scroll-score-corridor="market-adjustment"] ' +
    "[data-kp-scroll-score-cue]"
  ).evaluate((element) => element.getBoundingClientRect().height);

  await page.goto(`${path}?phrase-focus=coverage#phrase.shift-supply`);
  await expect(score).toHaveAttribute(
    "data-kp-scroll-score-phrase-focus-profile",
    "coverage"
  );
  const coverageHeight = await score.locator(
    '[data-kp-scroll-score-corridor="market-adjustment"] ' +
    "[data-kp-scroll-score-cue]"
  ).evaluate((element) => element.getBoundingClientRect().height);
  expect(Math.abs(coverageHeight - receptionHeight)).toBeLessThanOrEqual(1);
  expect(await score.locator(
    '[data-kp-scroll-score-phrase="shift-supply"] ' +
    "[data-kp-scroll-score-coverage-unit]"
  ).first().evaluate((element) =>
    getComputedStyle(element).backgroundImage)).toContain("linear-gradient");
  await expect(score.locator(
    '[data-kp-scroll-score-phrase="shift-supply"]'
  )).toContainText("buyer-facing supply shifts upward");

  await page.goto(`${path}?phrase-focus=karaoke#phrase.shift-supply`);
  await expect(score).toHaveAttribute(
    "data-kp-scroll-score-phrase-focus-profile",
    "karaoke"
  );
  const karaokeHeight = await score.locator(
    '[data-kp-scroll-score-corridor="market-adjustment"] ' +
    "[data-kp-scroll-score-cue]"
  ).evaluate((element) => element.getBoundingClientRect().height);
  expect(Math.abs(karaokeHeight - receptionHeight)).toBeLessThanOrEqual(1);
});

test("reduced motion projects discrete checkpoints without losing prose", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
  const score = page.locator("[data-kp-supply-tax-scroll-score]");
  await seekPhraseProgress(page, "shift-supply", 0.6);
  await expect(score).toHaveAttribute("data-kp-supply-tax-model-progress",
    "0.0000");
  await expect(score.locator(
    '[data-kp-scroll-score-phrase="shift-supply"]'
  )).toHaveCSS("--kp-scroll-score-phrase-focus", "1.0000");
  expect(await score.locator(
    '[data-kp-scroll-score-phrase="shift-supply"] ' +
    "[data-kp-scroll-score-coverage-unit]"
  ).evaluateAll((elements) => elements.every((element) =>
    (element as HTMLElement).style.getPropertyValue(
      "--kp-scroll-score-unit-coverage"
    ) === "1.0000"))).toBe(true);
  await seekPhraseProgress(page, "shift-supply", 1);
  await expect(score).toHaveAttribute("data-kp-supply-tax-model-progress",
    "1.0000");
  await expect(score.locator(
    '[data-kp-scroll-score-phrase="shift-supply"]'
  )).toContainText("buyer-facing supply shifts upward");
});

test("stacked phone station fits or exposes the ordinary-flow fallback", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await page.goto(path);
  const score = page.locator("[data-kp-supply-tax-scroll-score]");
  await expect(score).toHaveAttribute("data-kp-scroll-score-fit",
    /stationary|ordinary/u);
  const bounds = await page.locator("body").evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth
  }));
  expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth + 1);
  await expect(score.locator("[data-kp-scroll-score-phrase]")).toHaveCount(8);
});

test("Scroll Score visual checkpoint captures both compact arguments", async ({
  page
}, testInfo) => {
  await page.goto(path);
  await seekPhraseProgress(page, "shift-supply", 0.09);
  await page.screenshot({
    path: testInfo.outputPath("supply-tax-scroll-score-reception-wave-dark.png")
  });
  await page.goto(`${path}#phrase.contract-quantity`);
  await page.screenshot({
    path: testInfo.outputPath("supply-tax-scroll-score-market.png")
  });
  await page.goto(`${path}#phrase.identify-loss`);
  await page.screenshot({
    path: testInfo.outputPath("supply-tax-scroll-score-welfare.png")
  });
  await page.setViewportSize({ width: 390, height: 760 });
  await page.goto(`${path}#phrase.trace-revenue`);
  await page.screenshot({
    path: testInfo.outputPath("supply-tax-scroll-score-phone.png")
  });
});
