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
  expect(errors).toEqual([]);
});

test("rail and native scroll sample proportional motion in both directions", async ({
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
    decoration: getComputedStyle(element).textDecorationLine,
    background: getComputedStyle(element).backgroundImage
  }))).toEqual(expect.objectContaining({
    focus: 1,
    opacity: "1",
    decoration: "none"
  }));
  expect(await activePhrase.evaluate((element) =>
    getComputedStyle(element).backgroundImage)).toContain("linear-gradient");
  const taxedSupply = score.locator(
    '[data-kp-supply-tax-entity="curve.economics.tax.supply-with-tax"]'
  );
  expect(await taxedSupply.evaluate((element) => Number(
    (element as HTMLElement).style.getPropertyValue(
      "--kp-supply-tax-bloom-progress"
    )
  ))).toBe(0);

  await seekPhraseProgress(page, "shift-supply", 0.25);
  await expectNumericAttribute(score, "data-kp-scroll-score-phrase-progress",
    0.25);
  await expectNumericAttribute(score, "data-kp-supply-tax-model-progress",
    0.25);

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
