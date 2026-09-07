import { expect, test, type Locator, type Page } from "@playwright/test";

const path = "/experiments/kinetic-figure/supply-tax/";

test("a queued snap restoration cannot reclaim a newer native gesture", async ({ page }) => {
  await openControlledNativeGesture(page, path);
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  const viewport = deck.locator("[data-kp-supply-tax-card-viewport]");
  // Keep the new gesture in flight until its explicit settlement checkpoint.
  await setNativeScrollPosition(viewport, 0);
  await deck.evaluate(root => {
    const input = root.querySelector<HTMLInputElement>("[data-kp-supply-tax-state-scrubber]")!;
    input.value = "1";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    // Enter the next native gesture before the previous correction's RAF.
    const viewport = root.querySelector<HTMLElement>("[data-kp-supply-tax-card-viewport]")!;
    viewport.scrollLeft = viewport.clientWidth * .9;
    viewport.dispatchEvent(new Event("scroll"));
  });
  await page.clock.runFor(48);
  await expect.poll(async () => Number(await deck.getAttribute("data-kp-supply-tax-deck-position"))).toBeCloseTo(.9, 1);
  await finishNativeScroll(viewport);
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat", "baseline-market");
});

test("canonical source survives deep-link reload, interruption, resize and retained-page lifecycle", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(path + "#beat.deadweight-loss");
  const app = page.locator("#app");
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  const scrubber = deck.locator("[data-kp-supply-tax-state-scrubber]");
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat", "deadweight-loss");
  const revision = await app.getAttribute("data-kp-canonical-tax-source-revision");
  expect(revision).toMatch(/^[a-f0-9]{64}$/);
  await page.reload();
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat", "deadweight-loss");
  await setScrubberPosition(scrubber, 1, true);
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat", "tax-input");
  await deck.locator("[data-kp-focus-deck-next]").click();
  await setScrubberPosition(scrubber, 1.37, false);
  await page.setViewportSize({ width: 430, height: 844 });
  await setScrubberPosition(scrubber, 1.37, false);
  await expect(deck).toHaveAttribute("data-kp-supply-tax-model-progress", "0.3700");
  await page.evaluate(() => {
    dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
    dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
  });
  await setScrubberPosition(scrubber, 0, true);
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat", "baseline-market");
  await expect(app).toHaveAttribute("data-kp-canonical-tax-source-revision", revision!);
  await expect(page.locator("[data-kp-focus-deck]")).toHaveCount(4);
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
  await expect(app).toHaveAttribute("data-kp-canonical-tax-source", "disposed");
  const progress = await deck.getAttribute("data-kp-supply-tax-model-progress");
  await setScrubberPosition(scrubber, 7, false);
  await page.evaluate(() => {
    dispatchEvent(new Event("resize"));
    document.dispatchEvent(new Event("visibilitychange"));
    dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false }));
  });
  await expect(deck).toHaveAttribute("data-kp-supply-tax-model-progress", progress!);
  expect(errors).toEqual([]);
});

test("canonical framework source restores all tax stops and reverse samples without preview requests", async ({ page }) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => requests.push(request.url()));
  const capture = async () => {
    await page.goto(path);
    const deck = page.locator("[data-kp-supply-tax-focus-deck]");
    await expect(deck).toBeVisible();
    const states = [];
    for (const position of [0, 1, 1.371, 2, 3, 4, 5, 6, 7, 1.371, 0]) {
      await setScrubberPosition(deck.locator("[data-kp-supply-tax-state-scrubber]"), position, false);
      states.push(await deck.evaluate(root => {
        const graph = root.querySelector(".kp-supply-tax-graph")!.cloneNode(true) as SVGSVGElement;
        // Reverse visits may insert equivalent CSS declarations in another
        // order. Compare every current value, not incidental CSSOM serialization.
        for (const node of graph.querySelectorAll<HTMLElement | SVGElement>("[style]")) {
          const style = [...node.style].sort().map(property => {
            const raw = node.style.getPropertyValue(property).trim();
            const value = /^-?\d+(?:\.\d+)?%?$/.test(raw)
              ? `${parseFloat(raw)}${raw.endsWith("%") ? "%" : ""}` : raw;
            return `${property}:${value}${node.style.getPropertyPriority(property) ? "!important" : ""}`;
          }).join(";");
          node.setAttribute("style", style);
        }
        return {
        graph: graph.innerHTML,
        prose: [...root.querySelectorAll(".kp-supply-tax-narrative__page")].map(node => node.textContent),
        label: root.querySelector("[data-kp-supply-tax-state-scrubber]")!.getAttribute("aria-valuetext"),
        progress: root.getAttribute("data-kp-supply-tax-model-progress")
      }; }));
    }
    return states;
  };
  // Pre-cutover comparison against the retired source is recorded in s22.
  // After adoption, exercise the production entry directly, not a self-comparison
  // disguised as old/new parity or a retained compatibility entry.
  const first = await capture();
  expect(first[2]).toEqual(first[9]);
  expect(first[0]).toEqual(first[10]);
  expect(await capture()).toEqual(first);
  await expect(page.locator("#app")).toHaveAttribute("data-kp-canonical-tax-source", "framework-reference");
  expect(requests.filter(url => /authoring-market-(?:article-source|model-source|preview-build)\.ts|\/__kp\/authoring-market\//.test(url))).toEqual([]);
  expect(errors).toEqual([]);
});

test("supply-tax deck navigates exact semantic stops and one domain-motion edge", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(path);
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  const originalSupply = deck.locator(
    '[data-kp-supply-tax-entity="curve.economics.tax.supply"]'
  ).first();
  const taxedSupply = deck.locator(
    '[data-kp-supply-tax-entity="curve.economics.tax.supply-with-tax"]'
  );

  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "baseline-market");
  const scrubber = deck.locator("[data-kp-supply-tax-state-scrubber]");
  await expect(scrubber).toHaveCount(1);
  await expect(scrubber).toHaveAttribute("max", "7");
  await expect(scrubber).toHaveAttribute("aria-valuetext",
    "Step 1 of 8: The market before the tax");
  await expect(deck.locator("[data-kp-focus-deck-position]")).toHaveText(
    "Step 1 of 8: The market before the tax");
  const statusBox = await deck.locator(
    "[data-kp-focus-deck-position]"
  ).boundingBox();
  expect(statusBox).not.toBeNull();
  expect(statusBox!.width).toBeLessThanOrEqual(1);
  expect(statusBox!.height).toBeLessThanOrEqual(1);
  await expect(deck.locator(".kp-supply-tax-narrative__context")).toHaveCount(0);
  await expect(deck.getByText("Welfare accounting", { exact: true }))
    .toHaveCount(0);
  const deckHeader = deck.locator(".kp-supply-tax-deck__header");
  await expect(deckHeader).toHaveCSS("background-color", "rgb(82, 103, 122)");
  await expect(deckHeader).toHaveCSS("color", "rgb(255, 253, 248)");
  expect(await deckHeader.evaluate((element) =>
    getComputedStyle(element).boxShadow)).not.toBe("none");
  expect(await deck.evaluate((element) =>
    getComputedStyle(element).boxShadow)).not.toBe("none");
  const stage = deck.locator("[data-kp-supply-tax-stage]");
  await expect(stage).toHaveCSS("border-bottom-width", "1px");
  await expect(deck.locator("[data-kp-supply-tax-card-viewport]"))
    .toHaveCSS("border-top-width", "0px");
  const deckBox = await deck.boundingBox();
  const stageBox = await stage.boundingBox();
  expect(deckBox).not.toBeNull();
  expect(stageBox).not.toBeNull();
  expect(Math.abs(stageBox!.x - (deckBox!.x + 1))).toBeLessThanOrEqual(1);
  expect(Math.abs(
    stageBox!.x + stageBox!.width - (deckBox!.x + deckBox!.width - 1)
  )).toBeLessThanOrEqual(1);
  expect(deckBox!.width).toBeLessThanOrEqual(769);
  expect(deckBox!.height).toBeLessThanOrEqual(540);
  await expect(deck.locator("svg text")).toHaveCount(0);
  await expect(deck.locator(".kp-supply-tax-graph__math .katex"))
    .toHaveCount(27);
  const axisArrow = deck.locator("[data-kp-supply-tax-axis-arrow]");
  await expect(axisArrow).toHaveCount(1);
  await expect(axisArrow).toHaveAttribute("markerUnits", "strokeWidth");
  const axes = deck.locator("[data-kp-supply-tax-axis]");
  await expect(axes).toHaveCount(2);
  expect(await axes.evaluateAll((elements) => elements.map((element) =>
    element.getAttribute("marker-end"))))
    .toEqual([
      "url(#kp-supply-tax-axis-arrow)",
      "url(#kp-supply-tax-axis-arrow)"
    ]);
  for (const selector of [
    ".kp-supply-tax-graph__grid line",
    ".kp-supply-tax-graph__axes line",
    ".kp-supply-tax-graph__curve > line",
    ".kp-supply-tax-graph__guide",
    ".kp-supply-tax-graph__region",
    ".kp-supply-tax-graph__equilibrium circle",
    ".kp-supply-tax-graph__wedge > line"
  ]) {
    await expect(deck.locator(selector).first()).toHaveCSS("stroke-width", "2px");
  }
  await expect(originalSupply).toBeVisible();
  await expect(originalSupply.locator("line")).toHaveCSS(
    "vector-effect", "non-scaling-stroke"
  );
  await expect(taxedSupply).toBeHidden();
  await expect(deck.getByText(
    "Before the tax, demand and supply meet at",
    { exact: false }
  )).toHaveCount(1);

  const next = deck.locator("[data-kp-focus-deck-next]");
  await next.click();
  await expect(deck).toHaveAttribute("data-kp-supply-tax-playback-kind",
    "attention");
  await expect(deck).toHaveAttribute(
    "data-kp-supply-tax-playback-duration-ms", "480"
  );
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "tax-input", { timeout: 5_000 });
  await expect(deck).toHaveAttribute("data-kp-supply-tax-model-progress",
    "0.0000");
  await expect(deck).toHaveAttribute("data-kp-supply-tax-interaction",
    "settled");
  await expect(deck.getByText(
    "A four-dollar tax creates a wedge",
    { exact: false }
  )).toBeVisible();

  const motionStartedAt = await page.evaluate(() => performance.now());
  await next.click();
  await expect(deck).toHaveAttribute("data-kp-supply-tax-playback-kind",
    "domain-motion");
  await expect(deck).toHaveAttribute(
    "data-kp-supply-tax-playback-duration-ms", "960"
  );
  await page.waitForTimeout(560);
  await expect(deck).toHaveAttribute("data-kp-supply-tax-interaction",
    "snapping");
  const midpoint = Number(await deck.getAttribute(
    "data-kp-supply-tax-model-progress"
  ));
  expect(midpoint).toBeGreaterThan(0.35);
  expect(midpoint).toBeLessThan(0.85);
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "supply-translation", { timeout: 5_000 });
  const motionSettledAt = await page.evaluate(() => performance.now());
  expect(motionSettledAt - motionStartedAt).toBeGreaterThan(820);
  await expect(deck).toHaveAttribute("data-kp-supply-tax-model-progress",
    "1.0000");
  await expect(deck).toHaveAttribute("data-kp-scroll-score-stage-lens-to",
    "supply-translation");
  await expect(originalSupply).toBeVisible();
  await expect(taxedSupply).toBeVisible();
  await expect(deck.locator("[data-kp-supply-tax-replay]"))
    .toHaveAccessibleName("Replay transformation");

  await deck.locator("[data-kp-focus-deck-previous]").click();
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "tax-input", { timeout: 5_000 });
  await expect(deck).toHaveAttribute("data-kp-supply-tax-model-progress",
    "0.0000");
  await expect(taxedSupply).toBeHidden();
  expect(errors).toEqual([]);
});

test("the welfare edge is scrubbed with the prose before it snaps", async ({
  page
}) => {
  await openControlledNativeGesture(page, `${path}#beat.quantity-contraction`);
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  const viewport = deck.locator("[data-kp-supply-tax-card-viewport]");
  const beforeConsumer = deck.locator(
    '.kp-supply-tax-graph__region--consumer-surplus' +
    '[data-kp-supply-tax-region-phase="untaxed"]'
  );
  const afterConsumer = deck.locator(
    '.kp-supply-tax-graph__region--consumer-surplus' +
    '[data-kp-supply-tax-region-phase="taxed"]'
  );

  await setNativeScrollPosition(viewport, 4.45);
  await expect.poll(async () => Number(await deck.getAttribute(
    "data-kp-supply-tax-deck-position"
  ))).toBeCloseTo(4.45, 1);
  await expect(deck).toHaveAttribute("data-kp-supply-tax-interaction",
    "scrubbing");
  await expect.poll(async () => Number(await deck.getAttribute(
    "data-kp-scroll-score-stage-lens-progress"
  ))).toBeCloseTo(0.45, 1);
  expect(await beforeConsumer.evaluate((element) =>
    Number((element as HTMLElement).style.opacity))).toBeGreaterThan(0.95);
  await expect(afterConsumer).toBeHidden();

  await setNativeScrollPosition(viewport, 4.65);
  await expect.poll(async () => Number(await deck.getAttribute(
    "data-kp-supply-tax-deck-position"
  ))).toBeCloseTo(4.65, 1);
  expect(await beforeConsumer.evaluate((element) =>
    Number((element as HTMLElement).style.opacity))).toBeGreaterThan(0);
  expect(await afterConsumer.evaluate((element) =>
    Number((element as HTMLElement).style.opacity))).toBeGreaterThan(0);
  await finishNativeScroll(viewport);

  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "surplus-redistribution", { timeout: 5_000 });
  await expect(deck).toHaveAttribute("data-kp-supply-tax-interaction",
    "settled");
  await expect(deck.getByText(
    "Before the tax, consumer and producer surplus fill",
    { exact: false }
  )).toBeVisible();
  await expectPanelAligned(deck, viewport, "surplus-redistribution");
});

test("rapid and distant requests settle without half states", async ({ page }) => {
  await page.goto(`${path}#beat.tax-input`);
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  const scrubber = deck.locator("[data-kp-supply-tax-state-scrubber]");
  await deck.locator("[data-kp-focus-deck-next]").click();
  await setScrubberPosition(scrubber, 7, true);

  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "deadweight-loss");
  await expect(deck).toHaveAttribute("data-kp-supply-tax-deck-position",
    "7.0000");
  await expect(deck).toHaveAttribute("data-kp-supply-tax-interaction",
    "settled");
  await expect(deck.locator(
    '[data-kp-scroll-score-stage-fact="deadweight-loss"]'
  )).toBeVisible();
  await expect(deck.locator(
    ".kp-supply-tax-graph__region--deadweight-loss"
  )).toBeVisible();
  expect(new URL(page.url()).hash).toBe("#beat.deadweight-loss");
});

test("the semantic scrubber previews an edge and scales to distant states", async ({
  page
}) => {
  await page.goto(path);
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  const scrubber = deck.locator("[data-kp-supply-tax-state-scrubber]");

  await setScrubberPosition(scrubber, 2.45, false);
  await expect.poll(async () => Number(await deck.getAttribute(
    "data-kp-supply-tax-deck-position"
  ))).toBeCloseTo(2.45, 1);
  await expect(deck).toHaveAttribute("data-kp-supply-tax-interaction",
    "scrubbing");
  await expect(scrubber).toHaveAttribute("aria-valuetext",
    "Step 3 of 8: Translate buyer-facing supply");

  await setScrubberPosition(scrubber, 2.45, true);
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "supply-translation", { timeout: 5_000 });
  await scrubber.focus();
  await page.keyboard.press("End");
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "deadweight-loss", { timeout: 5_000 });
  expect(new URL(page.url()).hash).toBe("#beat.deadweight-loss");
});

test("direct links, reduced motion, and native find restore canonical states", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${path}#phrase.shift-supply`);
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "supply-translation");
  await expect(deck).toHaveAttribute("data-kp-supply-tax-model-progress",
    "1.0000");
  await expect(deck.locator("[data-kp-supply-tax-stage-caption]"))
    .toContainText("lifts buyer-facing supply by four");

  const lossSection = deck.locator(
    '[data-kp-focus-deck-beat="deadweight-loss"]'
  );
  const found = await page.evaluate(() => {
    const nativeFind = Reflect.get(window, "find") as
      ((query: string) => boolean) | undefined;
    return nativeFind?.call(window,
      "The remaining triangle is not transferred to anyone") ?? false;
  });
  expect(found).toBe(true);
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "deadweight-loss");
  await expect(lossSection).toBeVisible();
  expect(new URL(page.url()).hash).toBe("#beat.deadweight-loss");
  await expect(deck.getByText(
    "The remaining triangle is not transferred to anyone",
    { exact: false }
  )).toHaveCount(1);
});

test("the compact card keeps a protected stage and reading-size prose on a phone", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await page.goto(path);
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  const card = deck.locator(".kp-supply-tax-card");
  const stage = deck.locator("[data-kp-supply-tax-stage]");
  const passage = deck.locator("[data-kp-supply-tax-card-viewport]");
  const initialCardBox = await card.boundingBox();
  const [stageBox, passageBox] = await Promise.all([
    stage.boundingBox(),
    passage.boundingBox()
  ]);
  expect(initialCardBox).not.toBeNull();
  expect(stageBox).not.toBeNull();
  expect(passageBox).not.toBeNull();
  expect(stageBox!.height / initialCardBox!.height).toBeCloseTo(0.65, 1);
  expect(passageBox!.height / initialCardBox!.height).toBeCloseTo(0.35, 1);
  const proseSize = Number.parseFloat(await deck.locator(
    '[data-kp-focus-deck-beat="baseline-market"] > div > p:last-child'
  ).evaluate((element) => getComputedStyle(element).fontSize));
  expect(proseSize).toBeGreaterThanOrEqual(15);
  expect(proseSize).toBeLessThanOrEqual(16.5);
  const graphBox = await deck.locator(".kp-supply-tax-graph").boundingBox();
  expect(graphBox).not.toBeNull();
  expect(graphBox!.width / stageBox!.width).toBeGreaterThan(0.56);
  expect(stageBox!.y + stageBox!.height - (graphBox!.y + graphBox!.height))
    .toBeGreaterThanOrEqual(8);

  const bounds = await deck.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth
  }));
  expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth + 1);
  for (const selector of [
    "[data-kp-focus-deck-previous]",
    "[data-kp-focus-deck-next]",
    "[data-kp-supply-tax-state-scrubber]"
  ]) {
    const box = await deck.locator(selector).first().boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }

  await setScrubberPosition(
    deck.locator("[data-kp-supply-tax-state-scrubber]"), 5, true
  );
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "surplus-redistribution");
  const finalCardBox = await card.boundingBox();
  expect(finalCardBox!.height).toBeCloseTo(initialCardBox!.height, 1);
  await expect(deck.locator(
    '[data-kp-scroll-score-stage-fact="surplus-redistribution"]'
  )).toBeVisible();
});

test("native scroll sampling and Safari correction land on exact page geometry", async ({
  page
}) => {
  await openControlledNativeGesture(page, path);
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  const viewport = deck.locator("[data-kp-supply-tax-card-viewport]");
  await expect(viewport).toHaveCSS("overflow-x", "auto");
  await expect(viewport).toHaveCSS("scroll-snap-type", "x mandatory");
  await expect(viewport.locator(":scope > [data-kp-focus-deck-beat]"))
    .toHaveCount(8);
  expect(await viewport.evaluate((element) => element.scrollLeft)).toBe(0);
  await expectPanelAligned(deck, viewport, "baseline-market");

  await setNativeScrollPosition(viewport, 0.04);
  await expect.poll(async () => Number(await deck.getAttribute(
    "data-kp-supply-tax-deck-position"
  ))).toBeCloseTo(0.04, 1);
  await finishNativeScroll(viewport);
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "baseline-market", { timeout: 5_000 });
  await expectPanelAligned(deck, viewport, "baseline-market");

  await setNativeScrollPosition(viewport, 0.1);
  await expect.poll(async () => Number(await deck.getAttribute(
    "data-kp-supply-tax-deck-position"
  ))).toBeCloseTo(0.1, 1);
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "baseline-market");
  await expect(deck).toHaveAttribute("data-kp-supply-tax-interaction",
    "scrubbing");
  await finishNativeScroll(viewport);
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "tax-input", { timeout: 5_000 });
  expect(new URL(page.url()).hash).toBe("#beat.tax-input");
  await expectPanelAligned(deck, viewport, "tax-input");

  await setNativeScrollPosition(viewport, 0.9);
  await expect.poll(async () => Number(await deck.getAttribute(
    "data-kp-supply-tax-deck-position"
  ))).toBeCloseTo(0.9, 1);
  await finishNativeScroll(viewport);
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "baseline-market", { timeout: 5_000 });
  await expectPanelAligned(deck, viewport, "baseline-market");

  await setNativeScrollPosition(viewport, 1.47);
  await finishNativeScroll(viewport);
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "tax-input", { timeout: 5_000 });
  await expectPanelAligned(deck, viewport, "tax-input");
  await expect.poll(async () => Number(await deck.getAttribute(
    "data-kp-supply-tax-deck-position"
  ))).toBe(1);
  await expect.poll(async () => viewport.evaluate((element) =>
    Math.abs(element.scrollLeft - element.clientWidth)))
    .toBeLessThanOrEqual(1);

  // A native momentum gesture may traverse several cards before scrollend.
  // Settlement must honor the card the reader can see, not clamp back to one
  // card beyond the gesture's stale origin.
  await setNativeScrollPosition(viewport, 4.2);
  await finishNativeScroll(viewport);
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "quantity-contraction", { timeout: 5_000 });
  await expectPanelAligned(deck, viewport, "quantity-contraction");

  await setNativeScrollPosition(viewport, 1.2);
  await finishNativeScroll(viewport);
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "tax-input", { timeout: 5_000 });
  await expectPanelAligned(deck, viewport, "tax-input");

  // Safari can emit a viewport resize while a gesture is still in flight.
  // The new page width must preserve the fractional reader position instead
  // of restoring the last settled card.
  await setNativeScrollPosition(viewport, 3.25);
  await expect.poll(async () => Number(await deck.getAttribute(
    "data-kp-supply-tax-deck-position"
  ))).toBeCloseTo(3.25, 1);
  await page.setViewportSize({ width: 930, height: 780 });
  await page.clock.runFor(32);
  await expect.poll(async () => Number(await deck.getAttribute(
    "data-kp-supply-tax-deck-position"
  ))).toBeCloseTo(3.25, 1);
  await expect.poll(async () => viewport.evaluate((element) =>
    element.scrollLeft / Math.max(1, element.clientWidth)))
    .toBeCloseTo(3.25, 1);
  await finishNativeScroll(viewport);
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "price-wedge", { timeout: 5_000 });
  await expectPanelAligned(deck, viewport, "price-wedge");
});

test("a mouse drag swipes the native viewport and settles in either direction", async ({
  page
}) => {
  await page.goto(path);
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  const viewport = deck.locator("[data-kp-supply-tax-card-viewport]");
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  const y = box!.y + box!.height * 0.5;

  await page.mouse.move(box!.x + box!.width * 0.72, y);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.62, y, { steps: 5 });
  await expect.poll(async () => Number(await deck.getAttribute(
    "data-kp-supply-tax-deck-position"
  ))).toBeGreaterThan(0.06);
  await expect(viewport).toHaveAttribute("data-kp-supply-tax-mouse-dragging",
    "true");
  await page.mouse.up();
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "tax-input", { timeout: 5_000 });
  await expectPanelAligned(deck, viewport, "tax-input");

  await page.mouse.move(box!.x + box!.width * 0.28, y);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.38, y, { steps: 5 });
  await expect.poll(async () => Number(await deck.getAttribute(
    "data-kp-supply-tax-deck-position"
  ))).toBeLessThan(0.94);
  await page.mouse.up();
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "baseline-market", { timeout: 5_000 });
  await expectPanelAligned(deck, viewport, "baseline-market");
});

test("a horizontal trackpad gesture reaches the native snap viewport", async ({
  page
}) => {
  await openControlledNativeGesture(page, path);
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  const viewport = deck.locator("[data-kp-supply-tax-card-viewport]");
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  await dispatchHorizontalWheelIntent(viewport, box!.width * 0.015);
  await dispatchHorizontalWheelIntent(viewport, box!.width * 0.015);
  await page.clock.runFor(500);
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "tax-input", { timeout: 5_000 });
  await expectPanelAligned(deck, viewport, "tax-input");

  await dispatchHorizontalWheelIntent(viewport, box!.width * -0.015);
  await dispatchHorizontalWheelIntent(viewport, box!.width * -0.015);
  await page.clock.runFor(500);
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "baseline-market", { timeout: 5_000 });
  await expectPanelAligned(deck, viewport, "baseline-market");
});

test("supply-tax visual checkpoint captures all eight states and phone", async ({
  page
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  const slugs = [
    "baseline-market",
    "tax-input",
    "supply-translation",
    "price-wedge",
    "quantity-contraction",
    "surplus-redistribution",
    "government-revenue",
    "deadweight-loss"
  ] as const;
  const scrubber = deck.locator("[data-kp-supply-tax-state-scrubber]");
  for (const [index, slug] of slugs.entries()) {
    await setScrubberPosition(scrubber, index, true);
    await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat", slug);
    await expect.poll(async () => Number(await deck.getAttribute(
      "data-kp-supply-tax-deck-position"
    ))).toBeCloseTo(index, 2);
    await page.screenshot({
      path: testInfo.outputPath(`supply-tax-${index + 1}-${slug}.png`),
      fullPage: true
    });
  }
  await page.setViewportSize({ width: 390, height: 760 });
  await page.screenshot({
    path: testInfo.outputPath("supply-tax-phone.png"),
    fullPage: true
  });
});

async function openControlledNativeGesture(page: Page, url: string): Promise<void> {
  // Holding scrollend alone cannot hold the runtime's idle fallback. Own test
  // time so remote assertion latency cannot silently finish an in-flight drag.
  // Real timers/RAF still execute, but only at the checkpoints below.
  await page.clock.install({ time: "2026-01-01T00:00:00Z" });
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.clock.pauseAt("2026-01-01T01:00:00Z");
  await page.clock.runFor(48);
}

async function setNativeScrollPosition(
  viewport: Locator,
  position: number
): Promise<void> {
  await viewport.evaluate((element, nextPosition) => {
    if (element.dataset["kpSupplyTaxScrollHarness"] !== "installed") {
      element.dataset["kpSupplyTaxScrollHarness"] = "installed";
      element.addEventListener("scrollend", (event) => {
        if (element.dataset["kpSupplyTaxHoldScrollEnd"] === "true") {
          event.stopImmediatePropagation();
        }
      }, { capture: true });
    }
    element.dataset["kpSupplyTaxHoldScrollEnd"] = "true";
    element.dataset["kpSupplyTaxSnapDisabled"] = "true";
    // Model the runtime's WebKit boundary: snap-off must be committed before
    // a scripted fractional scroll can represent an in-flight native gesture.
    void (element as HTMLElement).offsetWidth;
    element.scrollLeft = element.clientWidth * nextPosition;
    element.dispatchEvent(new Event("scroll"));
  }, position);
  await viewport.page().clock.runFor(32);
}

async function setScrubberPosition(
  scrubber: Locator,
  position: number,
  commit: boolean
): Promise<void> {
  await scrubber.evaluate((element, input) => {
    const range = element as HTMLInputElement;
    range.value = String(input.position);
    range.dispatchEvent(new Event("input", { bubbles: true }));
    if (input.commit) {
      range.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, { position, commit });
}

async function dispatchHorizontalWheelIntent(
  viewport: Locator,
  deltaX: number
): Promise<void> {
  await viewport.evaluate((element, delta) => {
    element.dispatchEvent(new WheelEvent("wheel", {
      bubbles: true,
      deltaX: delta,
      deltaY: 0,
      deltaMode: WheelEvent.DOM_DELTA_PIXEL
    }));
  }, deltaX);
}

async function finishNativeScroll(viewport: Locator): Promise<void> {
  await viewport.evaluate((element) => {
    delete element.dataset["kpSupplyTaxHoldScrollEnd"];
    element.dispatchEvent(new Event("scrollend"));
  });
  // Browser scrollend from the corrective scroll can arrive after the first
  // timer batch. Finish that exact endpoint's snap restoration before starting
  // another gesture; do not write into the runtime's correcting phase.
  await viewport.page().clock.runFor(500);
  await expect.poll(async () => {
    await viewport.page().clock.runFor(32);
    return viewport.getAttribute("data-kp-supply-tax-snap-disabled");
  }).toBeNull();
}

async function expectPanelAligned(
  deck: Locator,
  viewport: Locator,
  slug: string
): Promise<void> {
  await expect.poll(async () => {
    const [viewportBox, panelBox] = await Promise.all([
      viewport.boundingBox(),
      deck.locator(`[data-kp-focus-deck-beat="${slug}"]`).boundingBox()
    ]);
    if (viewportBox === null || panelBox === null) return Number.POSITIVE_INFINITY;
    return Math.max(
      Math.abs(panelBox.x - viewportBox.x),
      Math.abs(panelBox.width - viewportBox.width)
    );
  }).toBeLessThanOrEqual(1);
}
