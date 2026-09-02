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

test("Vertical Score mounts eight searchable paragraph landmarks", async ({
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
    "light"
  );
  await expect(page.locator(".kp-scroll-score-page")).toHaveCSS(
    "background-color",
    "rgb(244, 241, 233)"
  );
  await expect(score).toHaveAttribute("data-kp-scroll-score-active-phrase",
    "orient-market");
  await expect(score).toHaveAttribute("data-kp-scroll-score-projection",
    "inline-sticky-score");
  await expect(page.locator("html")).toHaveCSS("scroll-snap-type", "none");
  await expect(score.locator("[data-kp-scroll-score-cue]")).toHaveCount(8);
  await expect(score.locator("[data-kp-scroll-score-phrase]")).toHaveCount(8);
  await expect(score.locator("[data-kp-scroll-score-phrase] > p"))
    .toHaveCount(8);
  await expect(score.locator("[data-kp-scroll-score-phrase]").first())
    .toHaveCSS("scroll-snap-align", "none");
  await expect(score.locator("[data-kp-scroll-score-transition]"))
    .toHaveCount(0);
  await expect(score.locator(".kp-scroll-score-rest")).toHaveCount(0);
  const station = score.locator("[data-kp-scroll-score-station]");
  await expect(station).toHaveCSS("position", "sticky");
  await expect(station).toHaveCSS("box-shadow", "none");
  await expect(station).toHaveCSS("border-top-width", "0px");
  await expect(score.getByText(
    "Before the tax, consumer and producer surplus",
    { exact: false }
  )).toHaveCount(1);
  await expect(score.locator("[data-kp-supply-tax-ledger]")).toHaveCount(0);
  await expect(score.locator("[data-kp-scroll-score-stage-fact]"))
    .toHaveCount(7);
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

test("the local stage lens keeps each causal beat visually sparse", async ({
  page
}) => {
  await page.goto(path);
  const score = page.locator("[data-kp-supply-tax-scroll-score]");
  await expect(score).toHaveAttribute("data-kp-scroll-score-stage-lens-to",
    "baseline-market");
  await expect(score.locator(
    '[data-kp-supply-tax-math-label="untaxed-equilibrium"]'
  )).toBeVisible();
  await expect(score.locator(
    '[data-kp-supply-tax-math-label="consumer-price"]'
  )).toBeHidden();
  expect(await score.locator(
    '[data-kp-supply-tax-math-label^="quantity-tick-"], ' +
    '[data-kp-supply-tax-math-label^="price-tick-"]'
  ).evaluateAll((elements) => elements.every((element) =>
    getComputedStyle(element).visibility === "hidden"))).toBe(true);

  await page.goto(`${path}#phrase.introduce-tax`);
  await expect(score).toHaveAttribute("data-kp-scroll-score-stage-lens-to",
    "tax-input");
  await expect.poll(async () => Number(await score.locator(
    '[data-kp-scroll-score-stage-fact="tax-wedge"]'
  ).evaluate((element) => getComputedStyle(element).opacity)))
    .toBeGreaterThan(0.99);
  await expect(score.locator(
    '[data-kp-supply-tax-math-label="taxed-supply"]'
  )).toBeHidden();

  await page.goto(`${path}#phrase.shift-supply`);
  await expect(score).toHaveAttribute("data-kp-scroll-score-stage-lens-to",
    "supply-translation");
  await expect(score.locator(
    '[data-kp-supply-tax-math-label="taxed-supply"]'
  )).toBeVisible();
  await expect(score.locator(
    '[data-kp-supply-tax-math-label="consumer-price"]'
  )).toBeHidden();
  await expect(score.locator(
    ".kp-supply-tax-graph__curve--demand > line"
  )).toHaveCSS("stroke-opacity", "0.42");
  await expect.poll(async () => Number(await score.locator(
    ".kp-supply-tax-graph__curve--taxed-supply > line"
  ).evaluate((element) => getComputedStyle(element).strokeOpacity)))
    .toBeGreaterThan(0.99);

  await seekPhraseProgress(page, "compare-private-surplus", 0.3);
  const consumerBefore = score.locator(
    '.kp-supply-tax-graph__region--consumer-surplus' +
    '[data-kp-supply-tax-region-phase="untaxed"]'
  );
  const consumerAfter = score.locator(
    '.kp-supply-tax-graph__region--consumer-surplus' +
    '[data-kp-supply-tax-region-phase="taxed"]'
  );
  await expect(consumerBefore).toHaveCSS("opacity", "1");
  await expect(consumerAfter).toHaveCSS("opacity", "0");
  await seekPhraseProgress(page, "compare-private-surplus", 0.82);
  await expect(consumerBefore).toHaveCSS("opacity", "0");
  await expect(consumerAfter).toHaveCSS("opacity", "1");

  await page.goto(`${path}#phrase.trace-revenue`);
  await expect(score.locator(
    ".kp-supply-tax-graph__region--government-revenue"
  )).toHaveCSS("opacity", "1");
  await expect(consumerAfter).toHaveCSS("opacity", "0.22");
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

  await page.goto(`${path}#phrase.shift-supply`);
  const stationBox = await score.locator(
    "[data-kp-scroll-score-station]"
  ).boundingBox();
  const cueBox = await score.locator(
    '[data-kp-scroll-score-phrase="shift-supply"]'
  ).boundingBox();
  expect(stationBox).not.toBeNull();
  expect(cueBox).not.toBeNull();
  expect(cueBox!.y).toBeGreaterThanOrEqual(
    stationBox!.y + stationBox!.height - 2
  );
  expect(cueBox!.y + cueBox!.height).toBeLessThanOrEqual(
    (await page.viewportSize())!.height + 1);
});

test("ordinary paragraph settlement starts one deterministic semantic edge", async ({
  page
}) => {
  await page.goto(`${path}#phrase.introduce-tax`);
  const score = page.locator("[data-kp-supply-tax-scroll-score]");
  const current = score.locator(
    '[data-kp-scroll-score-phrase="introduce-tax"]'
  );
  const target = score.locator(
    '[data-kp-scroll-score-phrase="shift-supply"]'
  );
  const paragraphGap = await current.evaluate((element) => {
    const next = element.closest("[data-kp-scroll-score-beat]")
      ?.nextElementSibling?.querySelector<HTMLElement>(
        "[data-kp-scroll-score-phrase]"
      );
    if (next === null || next === undefined) return Number.NaN;
    return next.getBoundingClientRect().top -
      element.getBoundingClientRect().bottom;
  });
  expect(paragraphGap).toBeGreaterThanOrEqual(12);
  expect(paragraphGap).toBeLessThanOrEqual(20);
  const targetY = await target.evaluate((element) => {
    const snapTop = Number.parseFloat(getComputedStyle(
      document.documentElement
    ).getPropertyValue("--kp-scroll-score-snap-top"));
    return window.scrollY + element.getBoundingClientRect().top - snapTop;
  });
  await page.evaluate((top) => window.scrollTo({ top, behavior: "auto" }),
    targetY);
  await expect(score).toHaveAttribute("data-kp-scroll-score-scroll-phase",
    "reader");
  await page.waitForTimeout(40);
  await expect(score).toHaveAttribute("data-kp-scroll-score-active-phrase",
    "introduce-tax");
  await expect(score).toHaveAttribute("data-kp-scroll-score-active-phrase",
    "shift-supply");
  await expect(score).toHaveAttribute("data-kp-scroll-score-transition",
    "playing");
  await expect.poll(async () => Number(await score.getAttribute(
    "data-kp-supply-tax-model-progress"
  ))).toBeGreaterThan(0);
  expect(Number(await score.getAttribute("data-kp-supply-tax-model-progress")))
    .toBeLessThan(1);
  await expect(score).toHaveAttribute("data-kp-scroll-score-transition",
    "settled", { timeout: 2_000 });
  await expectNumericAttribute(score, "data-kp-supply-tax-model-progress", 1);
});

test("live reader input stays monotone before one proportional nearest snap", async ({
  page
}) => {
  await page.goto(`${path}#phrase.introduce-tax`);
  const score = page.locator("[data-kp-supply-tax-scroll-score]");
  const samples: number[] = [];
  for (let index = 0; index < 18; index += 1) {
    await page.mouse.wheel(0, 32);
    await page.waitForTimeout(70);
    samples.push(await page.evaluate(() => window.scrollY));
  }
  const reversals = samples.flatMap((value, index) => {
    const previous = samples[index - 1];
    return previous !== undefined && value < previous - 1
      ? [{ index, previous, value }]
      : [];
  });
  expect(reversals, JSON.stringify(samples)).toEqual([]);
  const expected = await score.locator(
    "[data-kp-scroll-score-phrase]"
  ).evaluateAll((elements) => {
    const snapTop = Number.parseFloat(getComputedStyle(
      document.documentElement
    ).getPropertyValue("--kp-scroll-score-snap-top"));
    const maximumY = Math.max(0,
      document.documentElement.scrollHeight - window.innerHeight);
    return elements.map((element) => ({
      id: (element as HTMLElement).dataset["kpScrollScorePhrase"]!,
      y: Math.max(0, Math.min(maximumY,
        window.scrollY + element.getBoundingClientRect().top - snapTop))
    })).reduce((winner, candidate) =>
      Math.abs(candidate.y - window.scrollY) <
          Math.abs(winner.y - window.scrollY)
        ? candidate
        : winner);
  });
  const snapStartY = await page.evaluate(() => window.scrollY);
  await expect(score).toHaveAttribute("data-kp-scroll-score-scroll-phase",
    "snapping");
  const snapSamples: number[] = [snapStartY];
  for (let index = 0; index < 24; index += 1) {
    await page.waitForTimeout(20);
    snapSamples.push(await page.evaluate(() => window.scrollY));
    if (await score.getAttribute("data-kp-scroll-score-scroll-phase") ===
        "settled") break;
  }
  const towardTarget = Math.sign(expected.y - snapStartY);
  const correctionReversals = snapSamples.flatMap((value, index) => {
    const previous = snapSamples[index - 1];
    if (previous === undefined || towardTarget === 0) return [];
    const reversed = towardTarget > 0
      ? value < previous - 1
      : value > previous + 1;
    const overshot = towardTarget > 0
      ? value > expected.y + 1
      : value < expected.y - 1;
    return reversed || overshot ? [{ index, previous, value }] : [];
  });
  expect(correctionReversals, JSON.stringify(snapSamples)).toEqual([]);
  await expect(score).toHaveAttribute("data-kp-scroll-score-scroll-phase",
    "settled", { timeout: 2_000 });
  await expect(score).toHaveAttribute("data-kp-scroll-score-last-snap-target",
    expected.id);
  await expect.poll(async () => Math.abs(
    await page.evaluate(() => window.scrollY) - expected.y
  )).toBeLessThanOrEqual(1);
  const duration = Number(await score.getAttribute(
    "data-kp-scroll-score-last-snap-duration-ms"
  ));
  expect(duration).toBeGreaterThanOrEqual(180);
  expect(duration).toBeLessThanOrEqual(340);
  const settledY = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(420);
  expect(Math.abs(await page.evaluate(() => window.scrollY) - settledY))
    .toBeLessThanOrEqual(1);
});

test("new input interrupts a simulated snap before applying its own delta", async ({
  page
}) => {
  await page.goto(`${path}#phrase.introduce-tax`);
  const score = page.locator("[data-kp-supply-tax-scroll-score]");
  await page.mouse.wheel(0, 64);
  await expect(score).toHaveAttribute("data-kp-scroll-score-scroll-phase",
    "reader");
  await page.waitForFunction(() => document.querySelector(
    "[data-kp-supply-tax-scroll-score]"
  )?.getAttribute("data-kp-scroll-score-scroll-phase") === "snapping");
  const beforeInterrupt = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 88);
  await expect(score).toHaveAttribute("data-kp-scroll-score-scroll-phase",
    "reader");
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(
    beforeInterrupt - 1
  );
  await expect(score).toHaveAttribute("data-kp-scroll-score-scroll-phase",
    "settled", { timeout: 2_000 });
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
  await rail.evaluate((element) => {
    (element as HTMLInputElement).focus({ preventScroll: true });
  });
  await page.keyboard.press("ArrowRight");
  await expect(score).toHaveAttribute("data-kp-scroll-score-active-phrase",
    "identify-loss");
  expect(new URL(page.url()).hash).toBe("#phrase.identify-loss");

  await page.goto(path);
  expect(await page.evaluate(() => {
    const searchable = window as unknown as Window & {
      find(text: string): boolean;
    };
    return searchable.find("remaining triangle is not transferred to anyone");
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
    '[data-kp-scroll-score-phrase="shift-supply"]'
  ).evaluate((element) => element.getBoundingClientRect().height);

  await page.goto(`${path}?phrase-focus=coverage#phrase.shift-supply`);
  await expect(score).toHaveAttribute(
    "data-kp-scroll-score-phrase-focus-profile",
    "coverage"
  );
  const coverageHeight = await score.locator(
    '[data-kp-scroll-score-phrase="shift-supply"]'
  ).evaluate((element) => element.getBoundingClientRect().height);
  expect(Math.abs(coverageHeight - receptionHeight)).toBeLessThanOrEqual(1);
  expect(await score.locator(
    '[data-kp-scroll-score-phrase="shift-supply"] ' +
    "[data-kp-scroll-score-coverage-unit]"
  ).first().evaluate((element) =>
    getComputedStyle(element).backgroundImage)).toContain("linear-gradient");
  await expect(score.locator(
    '[data-kp-scroll-score-phrase="shift-supply"]'
  )).toContainText("buyer-facing supply rises by four dollars");

  await page.goto(`${path}?phrase-focus=karaoke#phrase.shift-supply`);
  await expect(score).toHaveAttribute(
    "data-kp-scroll-score-phrase-focus-profile",
    "karaoke"
  );
  const karaokeHeight = await score.locator(
    '[data-kp-scroll-score-phrase="shift-supply"]'
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
  )).toContainText("buyer-facing supply rises by four dollars");
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
    path: testInfo.outputPath("supply-tax-scroll-score-reception-wave-light.png")
  });
  await page.goto(`${path}#phrase.contract-quantity`);
  await page.screenshot({
    path: testInfo.outputPath("supply-tax-scroll-score-market.png")
  });
  await page.goto(path);
  await seekPhraseProgress(page, "compare-private-surplus", 0.3);
  await page.screenshot({
    path: testInfo.outputPath("supply-tax-scroll-score-surplus-before.png")
  });
  await seekPhraseProgress(page, "compare-private-surplus", 0.82);
  await page.screenshot({
    path: testInfo.outputPath("supply-tax-scroll-score-surplus-after.png")
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
