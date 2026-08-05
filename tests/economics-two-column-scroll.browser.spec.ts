import { mkdirSync } from "node:fs";

import { expect, test, type Locator, type Page } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/?layout=two-column-scroll";
const evidenceDirectory = "tmp/codex/economics-two-column-scroll";

test.beforeAll(() => {
  mkdirSync(evidenceDirectory, { recursive: true });
});

test("desktop prose hands off salience beside a left-hand graph", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const body = root.locator(".kp-economics-tutorial__motion-passage-body");
  const sectionHeading = root.locator("#kp-section-market-clearing > h3");
  const stage = root.locator("[data-kp-inline-sticky-stage]");
  const graph = stage.locator(".editor-graph-stage");
  const paragraphs = root.locator("[data-kp-two-column-scroll-paragraph]");
  const initialPassage = card(root, "graph-at-rest");
  const initialParagraph = initialPassage.locator("p");
  const initialEquilibriumPassage = scrollParagraph(
    root,
    "initial-equilibrium"
  );
  const demandPassage = card(root, "follow-shift");
  const demandParagraph = demandPassage.locator("p");
  const demandInk = demandParagraph.locator(
    ".kp-economics-tutorial__passage-ink"
  );
  const supplyPassage = card(root, "shift-versus-movement");
  const supplyParagraph = supplyPassage.locator("p");
  const supplyInterpretation = scrollParagraph(root, "movement-along-supply");
  const reflection = card(root, "equation-check");

  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-layout",
    "two-column-scroll"
  );
  await expect(paragraphs).toHaveCount(6);
  await expect(root.locator("[data-kp-two-column-scroll-card]")).toHaveCount(0);
  await expect(root.locator("kp-tutorial-scrub-bar")).toHaveCount(0);
  await expect(root.locator(
    ".kp-economics-tutorial__motion-passage-gate--entrance"
  )).toHaveCount(0);
  await expect(sectionHeading).toContainText("Follow the new intersection");
  await expect(stage.locator(
    "[data-kp-economics-screen-space-overlay]"
  )).toHaveCount(1);
  await expect(stage.locator(
    "[data-kp-editor-animation-surface-slot='graph']"
  )).toHaveAttribute("data-kp-economics-screen-space-labels-ready", "true");
  await expect(initialParagraph).toContainText(
    "Begin with the graph at rest."
  );
  await expect(demandParagraph).toContainText(
    "Follow red demand and its intersection"
  );
  await expect(initialEquilibriumPassage).toContainText(
    "This point is equilibrium"
  );
  await expect(supplyInterpretation).toContainText(
    "Quantity supplied moved; the supply curve did not shift"
  );
  await expect(reflection).not.toHaveAttribute(
    "data-kp-two-column-scroll-paragraph",
    "true"
  );

  await expect.poll(() => body.evaluate((element) =>
    getComputedStyle(element).display
  )).toBe("grid");
  await expect.poll(() => sectionHeading.evaluate((element) => {
    const headingBounds = element.getBoundingClientRect();
    const bodyBounds = element.nextElementSibling!
      .querySelector<HTMLElement>(
        ".kp-economics-tutorial__motion-passage-body"
      )!.getBoundingClientRect();
    return {
      border: getComputedStyle(element).borderBottomWidth,
      leftDelta: Math.round(headingBounds.left - bodyBounds.left),
      widthDelta: Math.round(headingBounds.width - bodyBounds.width)
    };
  })).toEqual({ border: "1px", leftDelta: 0, widthDelta: 0 });
  await sectionHeading.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-essay-boundary.png`,
    fullPage: false
  });
  const passageHeights = await paragraphs.evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().height)
  );
  expect(passageHeights.slice(0, 5).every((height) => height < 500)).toBe(true);
  expect(passageHeights[5]).toBeLessThan(800);

  const focusTop = 280;
  await placeTopAt(page, initialParagraph, focusTop);
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "pinned"
  );
  await expect.poll(() => stage.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { top: Math.round(bounds.top), height: Math.round(bounds.height) };
  })).toEqual({ top: 40, height: 480 });
  await expect.poll(() => Promise.all([
    initialParagraph.evaluate((element) => Math.round(
      element.getBoundingClientRect().top
    )),
    stage.evaluate((element) => Math.round(
      element.getBoundingClientRect().top
    ))
  ])).toEqual([280, 40]);
  await expect.poll(() => stage.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return Math.round(bounds.width / bounds.height * 100) / 100;
  })).toBe(1);
  await expect.poll(() => graph.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return {
      ratio: Math.round(bounds.width / bounds.height * 100) / 100,
      viewBox: element.getAttribute("viewBox"),
      width: Math.round(bounds.width)
    };
  })).toEqual({ ratio: 1.52, viewBox: "0 0 640 420", width: 415 });
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.01);
  await expect(initialPassage).toHaveAttribute(
    "data-kp-two-column-paragraph-opacity",
    "1.0000"
  );
  await expect(demandPassage).toHaveAttribute(
    "data-kp-two-column-paragraph-opacity",
    /0\.[3-9][0-9]{3}/
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-attention-passage",
    "graph-at-rest"
  );
  await expect(stage.locator(".editor-graph-stage__economics-grid"))
    .toBeVisible();
  await expect.poll(() => stage.locator(
    ".editor-graph-stage__economics-grid-line"
  ).first().evaluate((element) => getComputedStyle(element).strokeWidth))
    .toBe("1px");
  await expect.poll(() => stage.locator(
    "[data-kp-economics-initial-demand-reference]"
  ).evaluate((element) => ({
    color: getComputedStyle(element).stroke,
    dash: getComputedStyle(element).strokeDasharray,
    opacity: getComputedStyle(element).opacity,
    width: getComputedStyle(element).strokeWidth
  }))).toEqual({
    color: "rgb(158, 98, 104)",
    dash: "none",
    opacity: "1",
    width: "1px"
  });
  await expect.poll(() => stage.locator(
    "[data-kp-economics-initial-demand-reference-core]"
  ).evaluate((element) => ({
    color: getComputedStyle(element).stroke,
    dash: getComputedStyle(element).strokeDasharray,
    width: getComputedStyle(element).strokeWidth
  }))).toEqual({
    color: "rgb(133, 142, 157)",
    dash: "none",
    width: "0.5px"
  });
  await expect.poll(() => graph.locator("[data-kp-editor-graph-axis]").first()
    .evaluate((element) => getComputedStyle(element).strokeWidth))
    .toBe("1px");
  await expect.poll(() => graph.locator("[data-kp-editor-graph-axis]").first()
    .evaluate((element) => getComputedStyle(element).stroke))
    .toBe("rgb(162, 172, 191)");
  await expect(graph).toHaveAttribute(
    "data-kp-editor-graph-origin-policy",
    "shared-endpoint"
  );
  await expect.poll(() => graph.evaluate((element) => {
    const x = element.querySelector<SVGLineElement>(
      '[data-kp-editor-graph-axis="x"]'
    )!;
    const y = element.querySelector<SVGLineElement>(
      '[data-kp-editor-graph-axis="y"]'
    )!;
    return {
      x: [x.getAttribute("x1"), x.getAttribute("y1")],
      y: [y.getAttribute("x1"), y.getAttribute("y1")]
    };
  })).toEqual({ x: ["36", "392"], y: ["36", "392"] });
  await expect(graph.locator("#kp-editor-graph-axis-arrow")).toHaveAttribute(
    "markerUnits",
    "strokeWidth"
  );
  await expect(graph.locator("#kp-editor-graph-axis-arrow")).toHaveAttribute(
    "data-kp-axis-arrow-scale",
    "6"
  );
  await expect.poll(() => graph.locator("[data-kp-economics-supply-line]")
    .evaluate((element) => getComputedStyle(element).strokeWidth))
    .toBe("1px");
  await expect.poll(() => graph.locator(
    ".editor-graph-stage__economics-guide"
  ).first().evaluate((element) => getComputedStyle(element).strokeWidth))
    .toBe("1px");
  await expect(stage.locator("[data-kp-economics-stage-aperture]"))
    .toBeHidden();
  await expect(stage.locator("[data-kp-economics-equilibrium-point]"))
    .not.toHaveCSS("opacity", "0");
  await expect.poll(() => stage.locator(
    "[data-kp-economics-equilibrium-point]"
  ).evaluate((element) => ({
    fill: getComputedStyle(element).fill,
    radius: element.getAttribute("r"),
    stroke: getComputedStyle(element).stroke
  }))).toEqual({
    fill: "rgb(13, 14, 28)",
    radius: "3",
    stroke: "rgb(255, 255, 255)"
  });
  await expect(stage.locator(
    ".editor-graph-stage__economics-supply-movement-target"
  )).toHaveCount(0);
  await expect(stage.locator(
    "[data-kp-economics-supply-movement-target]"
  )).toHaveCount(2);
  await expect.poll(() => stage.locator(
    "[data-kp-economics-screen-space-label='curve-demand-current'] .katex"
  ).evaluate((element) => getComputedStyle(element).fontSize)).toBe("19px");
  await expect.poll(() => stage.locator(
    "[data-kp-economics-math-label='curve-demand-current']"
  ).evaluate((element) => getComputedStyle(element).visibility)).toBe("hidden");
  await expect(stage.locator(
    "[data-kp-economics-screen-space-label='equilibrium-current']"
  )).toHaveCSS("visibility", "hidden");
  await expect(stage.locator(
    "[data-kp-economics-screen-space-label='axis-price']"
  )).toHaveAttribute("data-kp-economics-label-disclosure", "persistent");
  await expect(stage.locator(
    "[data-kp-economics-screen-space-label='curve-supply']"
  )).toHaveAttribute("data-kp-economics-label-disclosure", "contextual");
  await expect(stage.locator(
    "[data-kp-economics-screen-space-label='curve-supply']"
  )).toBeHidden();
  await expect(stage.locator(
    "[data-kp-economics-screen-space-label='curve-demand-current']"
  )).toBeHidden();
  await expect(stage.locator(
    "[data-kp-economics-screen-space-label='equilibrium-current']"
  )).toBeHidden();
  await expect(stage.locator(
    "[data-kp-economics-initial-equilibrium-guides]"
  )).toHaveCount(0);
  await expect(demandInk).toHaveCSS("opacity", "0.32");
  await expect.poll(() => graph.evaluate((element) => {
    const bounds = (selector: string) => element.querySelector<SVGElement>(
      selector
    )!.getBoundingClientRect();
    const labelBounds = (role: string) => element.parentElement!
      .querySelector<HTMLElement>(
        `[data-kp-economics-screen-space-label="${role}"]`
      )!.getBoundingClientRect();
    const yAxis = bounds('[data-kp-editor-graph-axis="y"]');
    const xAxis = bounds('[data-kp-editor-graph-axis="x"]');
    const price = labelBounds("axis-price");
    const quantity = labelBounds("axis-quantity");
    const priceMidpoint = (yAxis.top + yAxis.bottom) / 2;
    const quantityMidpoint = (xAxis.left + xAxis.right) / 2;
    return {
      priceGapIsDeliberate: yAxis.left - price.right >= 4,
      priceIsCentered: Math.abs(
        (price.top + price.bottom) / 2 - priceMidpoint
      ) <= 1,
      quantityGapIsDeliberate: quantity.top - xAxis.bottom >= 4,
      quantityIsCentered: Math.abs(
        (quantity.left + quantity.right) / 2 - quantityMidpoint
      ) <= 1
    };
  })).toEqual(expect.objectContaining({
    priceGapIsDeliberate: true,
    priceIsCentered: true,
    quantityGapIsDeliberate: true,
    quantityIsCentered: true
  }));
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-initial-paragraph-state.png`,
    fullPage: false
  });

  await placeTopAt(page, initialEquilibriumPassage.locator("p"), focusTop);
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-attention-passage",
    "initial-equilibrium"
  );
  await expect(stage.locator(
    '[data-kp-economics-screen-space-label="equilibrium-current"]'
  )).toBeHidden();
  await expect(stage.locator(
    '[data-kp-economics-screen-space-label="curve-supply"]'
  )).toHaveCSS("visibility", "hidden");

  const demandDistance = await demandParagraph.evaluate((element) => {
    const previous = element.parentElement!.previousElementSibling!
      .querySelector("p")!;
    return element.getBoundingClientRect().top - previous.getBoundingClientRect().top;
  });
  expect(demandDistance).toBeGreaterThan(180);
  expect(demandDistance).toBeLessThan(440);
  const motionStart = Math.min(800 * 0.62, focusTop + demandDistance);
  await placeTopAt(page, demandParagraph, motionStart);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.01);
  await expect.poll(async () => Number(await demandPassage.getAttribute(
    "data-kp-two-column-paragraph-opacity"
  ))).toBeGreaterThan(0.5);

  const motionMidpoint = (motionStart + focusTop) / 2;
  await placeTopAt(page, demandParagraph, motionMidpoint);
  const forwardMidpoint = await demandProgress(root);
  expect(forwardMidpoint).toBeGreaterThan(0.6);
  expect(forwardMidpoint).toBeLessThan(0.73);
  await expect(demandPassage).toHaveAttribute(
    "data-kp-inline-sticky-paragraph-phase",
    "crossing"
  );
  await expect.poll(async () => Number(await demandPassage.getAttribute(
    "data-kp-two-column-paragraph-salience"
  ))).toBeGreaterThan(0.75);

  const columns = await page.evaluate(() => {
    const paragraphElement = document.querySelector<HTMLElement>(
      '[data-kp-two-column-scroll-paragraph="true"]' +
      '[data-kp-economics-tutorial-passage="follow-shift"] p'
    )!;
    const bodyElement = document.querySelector<HTMLElement>(
      ".kp-economics-tutorial__motion-passage-body"
    )!;
    const stageElement = document.querySelector<HTMLElement>(
      "[data-kp-inline-sticky-stage]"
    )!;
    const paragraphBounds = paragraphElement.getBoundingClientRect();
    const stageBounds = stageElement.getBoundingClientRect();
    const passageStyle = getComputedStyle(paragraphElement.parentElement!);
    const paragraphStyle = getComputedStyle(paragraphElement);
    const paragraphRule = getComputedStyle(paragraphElement, "::before");
    const graphElement = stageElement.querySelector<HTMLElement>(
      ".editor-graph-stage"
    )!;
    const graphBounds = graphElement.getBoundingClientRect();
    return {
      divider: getComputedStyle(stageElement).borderRightWidth,
      passageBackground: passageStyle.backgroundColor,
      passageBorderLeft: passageStyle.borderLeftWidth,
      passageGap: passageStyle.paddingBottom,
      paragraphBackground: paragraphStyle.backgroundColor,
      paragraphBorderTop: paragraphStyle.borderTopWidth,
      paragraphPosition: paragraphStyle.position,
      paragraphRuleContent: paragraphRule.content,
      proseFontFamily: paragraphStyle.fontFamily,
      proseFontWeight: paragraphStyle.fontWeight,
      proseLineHeight: Number.parseFloat(paragraphStyle.lineHeight),
      releaseRuleHeight: Number.parseFloat(
        getComputedStyle(bodyElement, "::after").height
      ),
      paragraphLeft: paragraphBounds.left,
      paragraphWidth: paragraphBounds.width,
      stageRight: stageBounds.right,
      stageWidth: stageBounds.width,
      graphLeftInset: graphBounds.left - stageBounds.left,
      graphRightInset: stageBounds.right - graphBounds.right
    };
  });
  expect(columns.divider).toBe("1px");
  expect(columns.passageBackground).toBe("rgba(0, 0, 0, 0)");
  expect(columns.passageBorderLeft).toBe("0px");
  expect(columns.passageGap).toBe("128px");
  expect(columns.paragraphBackground).toBe("rgba(0, 0, 0, 0)");
  expect(columns.paragraphBorderTop).toBe("0px");
  expect(columns.paragraphPosition).toBe("relative");
  expect(columns.paragraphRuleContent).toBe("none");
  await expect(demandInk).toHaveCount(1);
  await expect.poll(() => demandInk.evaluate((element) =>
    Number(getComputedStyle(element).opacity)
  )).toBeGreaterThan(0.8);
  expect(columns.proseFontFamily).toContain("Source Serif 4 Variable");
  expect(columns.proseFontWeight).toBe("375");
  expect(columns.proseLineHeight).toBeGreaterThan(32);
  expect(columns.releaseRuleHeight).toBe(1);
  expect(columns.paragraphLeft - columns.stageRight).toBeGreaterThan(20);
  expect(columns.paragraphWidth).toBeLessThan(440);
  expect(columns.stageWidth).toBe(480);
  expect(columns.graphLeftInset).toBeGreaterThan(30);
  expect(columns.graphLeftInset).toBeLessThan(34);
  expect(Math.abs(columns.graphLeftInset - columns.graphRightInset))
    .toBeLessThan(2);
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-mid-demand.png`,
    fullPage: false
  });

  await placeTopAt(page, demandParagraph, focusTop);
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0.99);
  await expect(demandPassage).toHaveAttribute(
    "data-kp-two-column-paragraph-salience",
    "1.0000"
  );
  await expect(demandInk).toHaveCSS("opacity", "1");
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-attention-passage",
    "follow-shift"
  );
  await expect(stage.locator(
    '[data-kp-economics-screen-space-label="curve-supply"]'
  )).toBeHidden();
  await expect.poll(() => stage.locator(
    "[data-kp-economics-supply-line]"
  ).evaluate((element) => getComputedStyle(element).filter)).toBe("none");
  await expect.poll(() => stage.locator(
    '[data-kp-economics-screen-space-label="equilibrium-current"]'
  ).evaluate((element) => {
    const graphStage = element.closest<HTMLElement>(
      "[data-kp-inline-sticky-stage]"
    )!;
    return element.getBoundingClientRect().right <=
      graphStage.getBoundingClientRect().right + 1;
  })).toBe(true);
  await expect(stage.locator(
    '[data-kp-economics-screen-space-label="equilibrium-current"]'
  )).toBeHidden();
  await expect(stage.locator(
    "[data-kp-economics-initial-equilibrium-guides]"
  )).toHaveCount(1);
  await expect.poll(() => stage.locator(
    "[data-kp-economics-initial-equilibrium-quantity-guide]"
  ).evaluate((element) => ({
    color: getComputedStyle(element).stroke,
    dash: getComputedStyle(element).strokeDasharray,
    width: getComputedStyle(element).strokeWidth
  }))).toEqual({
    color: "rgb(143, 152, 170)",
    dash: "4px, 5px",
    width: "1px"
  });
  await expect.poll(() => stage.locator(
    "[data-kp-economics-initial-equilibrium-quantity-guide-core]"
  ).evaluate((element) => ({
    color: getComputedStyle(element).stroke,
    dash: getComputedStyle(element).strokeDasharray,
    width: getComputedStyle(element).strokeWidth
  }))).toEqual({
    color: "rgb(48, 53, 71)",
    dash: "4px, 5px",
    width: "0.5px"
  });
  await expect(stage.locator("[data-kp-economics-equilibrium-point]"))
    .not.toHaveCSS("opacity", "0");
  await expect.poll(() => root.locator(".kp-economics-tutorial__math .katex")
    .first().evaluate((element) => getComputedStyle(element).color))
    .toBe("rgb(185, 190, 201)");
  await expect.poll(() => reflection.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    borderLeft: getComputedStyle(element).borderLeftWidth
  }))).toEqual({
    background: "rgba(0, 0, 0, 0)",
    borderLeft: "0px"
  });
  await placeTopAt(page, demandParagraph, motionMidpoint);
  await expect.poll(async () => Math.abs(
    (await demandProgress(root)) - forwardMidpoint
  )).toBeLessThan(0.015);

  await placeTopAt(page, supplyParagraph, focusTop + 40);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-supply-movement-progress"
  ))).toBeLessThan(0.99);
  await placeTopAt(page, supplyInterpretation.locator("p"), focusTop);
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-attention-passage",
    "movement-along-supply"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-active-block",
    ""
  );
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-supply-movement-progress"
  ))).toBeGreaterThan(0.99);
  await expect.poll(() => graph.evaluate((element) => Math.round(
    element.getBoundingClientRect().width
  ))).toBe(415);
  const stageBottom = await stage.evaluate(
    (element) => element.getBoundingClientRect().bottom
  );
  await placeBottomAt(page, body, stageBottom - 1);
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "released"
  );
  await expect.poll(() => body.evaluate((element) =>
    Math.round(element.getBoundingClientRect().bottom)
  )).toBe(Math.round(stageBottom - 1));
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-native-release.png`,
    fullPage: false
  });
  const settledIntersection = await graph.locator(
    "[data-kp-economics-equilibrium-point]"
  ).evaluate((element) => ({
    cx: element.getAttribute("cx"),
    cy: element.getAttribute("cy")
  }));
  await placeTopAt(page, reflection.locator("p").first(), focusTop);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-supply-movement-progress"
  ))).toBeGreaterThan(0.99);
  await expect.poll(() => graph.locator(
    "[data-kp-economics-equilibrium-point]"
  ).evaluate((element) => ({
    cx: element.getAttribute("cx"),
    cy: element.getAttribute("cy")
  }))).toEqual(settledIntersection);
});

test("phone keeps the accepted one-column inline geometry", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const body = root.locator(".kp-economics-tutorial__motion-passage-body");
  const stage = root.locator("[data-kp-inline-sticky-stage]");
  const paragraph = card(root, "follow-shift").locator("p");
  const columnToggle = page.locator("[data-kp-economics-column-toggle]");

  await expect.poll(() => body.evaluate((element) =>
    getComputedStyle(element).display
  )).toBe("block");
  await expect(columnToggle).toBeHidden();
  await placeTopAt(page, paragraph, 500);
  await expect.poll(() => stage.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { top: Math.round(bounds.top), height: Math.round(bounds.height) };
  })).toEqual({ top: 0, height: 422 });
  await expect.poll(() => page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth
  }))).toEqual({ client: 390, scroll: 390 });
  await page.screenshot({
    path: `${evidenceDirectory}/phone-inline-fallback.png`,
    fullPage: false
  });

  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(() => body.evaluate((element) =>
    getComputedStyle(element).display
  )).toBe("block");
  await expect.poll(() => page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth
  }))).toEqual({ client: 844, scroll: 844 });
});

test("light theme applies one compensated graph width and prose weight", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${route}&theme=light`);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const stage = root.locator("[data-kp-inline-sticky-stage]");
  const graph = stage.locator(".editor-graph-stage");
  const paragraph = card(root, "graph-at-rest").locator("p");
  await placeTopAt(page, paragraph, 280);

  await expect.poll(() => root.evaluate((element) => ({
    color: getComputedStyle(element).color,
    proseWeight: getComputedStyle(
      element.querySelector<HTMLElement>(".kp-economics-tutorial__prose")!
    ).fontWeight,
    stageDivider: getComputedStyle(
      element.querySelector<HTMLElement>("[data-kp-inline-sticky-stage]")!
    ).borderRightWidth
  }))).toEqual({
    color: "rgb(24, 26, 27)",
    proseWeight: "425",
    stageDivider: "1px"
  });
  await expect.poll(() => graph.evaluate((element) => {
    const selectors = [
      "[data-kp-editor-graph-axis]",
      "[data-kp-economics-supply-line]",
      ".editor-graph-stage__economics-grid-line",
      ".editor-graph-stage__economics-guide"
    ];
    return selectors.map((selector) => getComputedStyle(
      element.querySelector<SVGElement>(selector)!
    ).strokeWidth);
  })).toEqual(["1.25px", "1.25px", "1.25px", "1.25px"]);
  await expect.poll(() => graph.locator(
    ".editor-graph-stage__economics-grid-line"
  ).first().evaluate((element) => ({
    color: getComputedStyle(element).stroke,
    opacity: getComputedStyle(element).opacity
  }))).toEqual({ color: "rgb(219, 225, 224)", opacity: "1" });
  await expect.poll(() => graph.evaluate((element) => ({
    axis: getComputedStyle(element.querySelector<SVGElement>(
      "[data-kp-editor-graph-axis]"
    )!).stroke,
    supply: getComputedStyle(element.querySelector<SVGElement>(
      "[data-kp-economics-supply-line]"
    )!).stroke
  }))).toEqual({
    axis: "rgb(17, 19, 25)",
    supply: "rgb(70, 130, 180)"
  });
  await expect.poll(() => graph.locator(
    "[data-kp-economics-equilibrium-point]"
  ).evaluate((element) => ({
    fill: getComputedStyle(element).fill,
    stroke: getComputedStyle(element).stroke
  }))).toEqual({
    fill: "rgb(244, 241, 233)",
    stroke: "rgb(17, 19, 25)"
  });
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-light-optical-compensation.png`,
    fullPage: false
  });
});

test("column toggle swaps prose and graph without resetting the lesson", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const body = root.locator(".kp-economics-tutorial__motion-passage-body");
  const paragraph = card(root, "follow-shift").locator("p");
  const toggle = page.locator("[data-kp-economics-column-toggle]");
  const themeToggle = page.locator("[data-kp-economics-theme-toggle]");
  const review = page.locator("[data-kp-dev-review-shell]");

  await placeTopAt(page, paragraph, 390);
  const before = await page.evaluate(() => ({
    scrollY: window.scrollY,
    progress: document.querySelector<HTMLElement>(
      "[data-kp-economics-demand-shift-tutorial]"
    )!.dataset["kpEconomicsTutorialDemandProgress"]
  }));
  await expect(root).toHaveAttribute(
    "data-kp-economics-two-column-text-side",
    "right"
  );
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(toggle).toContainText("Text right");
  await expect(themeToggle).toBeVisible();
  await expect(themeToggle).toContainText("Dark mode");
  await expect.poll(() => columnGeometry(body)).toEqual({
    order: "graph-text",
    stageBorderLeft: "0px",
    stageBorderRight: "1px",
    stageWidth: 480,
    proseWidth: 384
  });

  await expect(review).toHaveCount(1);
  await expect(review.locator("button.launcher")).toBeVisible();
  const dockGeometry = await page.evaluate(() => {
    const reviewHost = document.querySelector<HTMLElement>(
      "[data-kp-dev-review-shell]"
    )!.getBoundingClientRect();
    const toggleButton = document.querySelector<HTMLElement>(
      "[data-kp-economics-column-toggle]"
    )!.getBoundingClientRect();
    const themeButton = document.querySelector<HTMLElement>(
      "[data-kp-economics-theme-toggle]"
    )!.getBoundingClientRect();
    return {
      gap: toggleButton.left - reviewHost.right,
      bottomDifference: Math.abs(toggleButton.bottom - reviewHost.bottom),
      themeGap: themeButton.left - toggleButton.right,
      themeBottomDifference: Math.abs(themeButton.bottom - reviewHost.bottom)
    };
  });
  expect(dockGeometry.gap).toBeGreaterThanOrEqual(4);
  expect(dockGeometry.bottomDifference).toBeLessThan(2);
  expect(dockGeometry.themeGap).toBeGreaterThanOrEqual(8);
  expect(dockGeometry.themeBottomDifference).toBeLessThan(2);

  await toggle.click();
  await expect(root).toHaveAttribute(
    "data-kp-economics-two-column-text-side",
    "left"
  );
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle).toContainText("Text left");
  await expect(page).toHaveURL(/text=left/);
  await expect.poll(() => columnGeometry(body)).toEqual({
    order: "text-graph",
    stageBorderLeft: "1px",
    stageBorderRight: "0px",
    stageWidth: 480,
    proseWidth: 384
  });
  await expect.poll(() => page.evaluate(() => window.scrollY))
    .toBeCloseTo(before.scrollY, 0);
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-demand-progress",
    before.progress ?? ""
  );
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-text-left.png`,
    fullPage: false
  });

  await toggle.click();
  await expect(root).toHaveAttribute(
    "data-kp-economics-two-column-text-side",
    "right"
  );
  await expect(page).not.toHaveURL(/text=left/);
});

test("line tuner preserves optical theme compensation and URL state", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const graph = root.locator(".editor-graph-stage");
  const tuner = page.locator("kp-graph-style-tuner");
  const range = tuner.locator("input[data-kp-graph-style-tuner-stroke]");
  const output = tuner.locator("[data-kp-graph-style-tuner-output]");

  await expect(tuner).toHaveAttribute(
    "data-kp-graph-style-tuner-enhancement",
    "ready"
  );
  await tuner.locator("summary").click();
  await range.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = "1.20";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(root).toHaveAttribute(
    "data-kp-economics-graph-stroke-scale",
    "1.20"
  );
  await expect(output).toContainText("dark 1.20px · light 1.50px");
  await expect(page).toHaveURL(/stroke=1.20/);
  await expect.poll(() => graph.locator(
    "[data-kp-economics-supply-line]"
  ).evaluate((element) => getComputedStyle(element).strokeWidth)).toBe("1.2px");
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-line-tuner.png`,
    fullPage: false
  });

  await page.locator("[data-kp-economics-theme-toggle]").click();
  await expect.poll(() => graph.locator(
    "[data-kp-economics-supply-line]"
  ).evaluate((element) => getComputedStyle(element).strokeWidth)).toBe("1.5px");
  await expect(page).toHaveURL(/stroke=1.20/);
  await expect(graph.locator("#kp-editor-graph-axis-arrow")).toHaveAttribute(
    "markerUnits",
    "strokeWidth"
  );

  await page.reload();
  await expect(root).toHaveAttribute(
    "data-kp-economics-graph-stroke-scale",
    "1.20"
  );
  await expect(page.locator("[data-kp-economics-theme-toggle]")).toHaveAttribute(
    "aria-pressed",
    "false"
  );
  await expect.poll(() => root.locator(
    "[data-kp-economics-supply-line]"
  ).evaluate((element) => getComputedStyle(element).strokeWidth)).toBe("1.5px");
});

test("the accepted inline route remains an independent rollback reference", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/tutorials/economics/demand-shift/?layout=inline-sticky");

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  await expect(root).not.toHaveClass(/two-column-scroll/);
  await expect(root.locator("[data-kp-two-column-scroll-card]")).toHaveCount(0);
  await expect(root.locator("[data-kp-two-column-scroll-paragraph]")).toHaveCount(0);
  await expect(page.locator("[data-kp-economics-column-toggle]")).toHaveCount(0);
  await expect(card(root, "follow-shift").locator("p")).toContainText(
    "Begin at"
  );
});

function card(root: Locator, passageId: string): Locator {
  return root.locator(
    `[data-kp-economics-tutorial-passage="${passageId}"]`
  );
}

function scrollParagraph(root: Locator, passageId: string): Locator {
  return root.locator(
    `[data-kp-two-column-scroll-paragraph="true"]` +
    `[data-kp-economics-tutorial-passage="${passageId}"]`
  );
}

async function placeTopAt(
  page: Page,
  element: Locator,
  targetTop: number
): Promise<void> {
  await element.evaluate((node, top) => {
    const bounds = node.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + bounds.top - top, behavior: "auto" });
  }, targetTop);
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  ));
}

async function placeBottomAt(
  page: Page,
  element: Locator,
  targetBottom: number
): Promise<void> {
  await element.evaluate((node, bottom) => {
    const bounds = node.getBoundingClientRect();
    window.scrollTo({
      top: window.scrollY + bounds.bottom - bottom,
      behavior: "auto"
    });
  }, targetBottom);
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  ));
}

async function columnGeometry(
  body: Locator
): Promise<{
  readonly order: "graph-text" | "text-graph";
  readonly stageBorderLeft: string;
  readonly stageBorderRight: string;
  readonly stageWidth: number;
  readonly proseWidth: number;
}> {
  return body.evaluate((element) => {
    const stageElement = element.querySelector<HTMLElement>(
      "[data-kp-inline-sticky-stage]"
    )!;
    const proseElement = element.querySelector<HTMLElement>(
      ".kp-economics-tutorial__motion-passage-prose"
    )!;
    const stageBounds = stageElement.getBoundingClientRect();
    const proseBounds = proseElement.getBoundingClientRect();
    const stageStyle = getComputedStyle(stageElement);
    return {
      order: stageBounds.left < proseBounds.left
        ? "graph-text" as const
        : "text-graph" as const,
      stageBorderLeft: stageStyle.borderLeftWidth,
      stageBorderRight: stageStyle.borderRightWidth,
      stageWidth: Math.round(stageBounds.width),
      proseWidth: Math.round(proseBounds.width)
    };
  });
}

async function demandProgress(root: Locator): Promise<number> {
  return Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ));
}
