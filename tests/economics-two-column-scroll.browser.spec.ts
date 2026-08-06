import { mkdirSync, readFileSync } from "node:fs";

import { expect, test, type Locator, type Page } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/?layout=two-column-scroll";
const evidenceDirectory = "tmp/codex/economics-two-column-scroll";
const entryBaseline = JSON.parse(readFileSync(new URL(
  "./fixtures/economics-two-column-entry-baseline.json",
  import.meta.url
), "utf8")) as {
  readonly viewport: { readonly width: number; readonly height: number };
  readonly focusLatch: {
    readonly paragraphTop: number;
    readonly stageTop: number;
    readonly stageHeight: number;
    readonly stageCenter: number;
    readonly maximumInitialDemandProgress: number;
  };
  readonly motionMidpoint: {
    readonly minimumDemandProgress: number;
    readonly maximumDemandProgress: number;
  };
  readonly terminal: {
    readonly minimumSupplyProgress: number;
    readonly releaseInset: number;
  };
};
const entryTarget = JSON.parse(readFileSync(new URL(
  "./fixtures/economics-two-column-entry-target.json",
  import.meta.url
), "utf8")) as typeof entryBaseline;

test.beforeAll(() => {
  mkdirSync(evidenceDirectory, { recursive: true });
});

test("desktop prose hands off salience beside a left-hand graph", async ({
  page
}) => {
  await page.setViewportSize(entryTarget.viewport);
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
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scrub-strategy",
    "continuous-passage"
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

  expect(entryTarget.focusLatch.stageCenter).not.toBe(
    entryBaseline.focusLatch.stageCenter
  );
  const focusTop = entryTarget.focusLatch.paragraphTop;
  await placeTopAt(page, initialParagraph, focusTop + 120);
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-passage-phase",
    "ordinary-document"
  );
  await expect(initialPassage).toHaveAttribute(
    "data-kp-two-column-endpoint-pinned",
    "true"
  );
  await expect(initialPassage).toHaveAttribute(
    "data-kp-two-column-paragraph-opacity",
    "1.0000"
  );
  await placeTopAt(page, initialParagraph, focusTop);
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-passage-phase",
    "entry-latched"
  );
  await expect(initialPassage).not.toHaveAttribute(
    "data-kp-two-column-endpoint-pinned",
    "true"
  );
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "pinned"
  );
  await expect.poll(() => stage.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { top: Math.round(bounds.top), height: Math.round(bounds.height) };
  })).toEqual({
    top: entryTarget.focusLatch.stageTop,
    height: entryTarget.focusLatch.stageHeight
  });
  await expect.poll(() => Promise.all([
    initialParagraph.evaluate((element) => Math.round(
      element.getBoundingClientRect().top
    )),
    stage.evaluate((element) => Math.round(
      element.getBoundingClientRect().top
    ))
  ])).toEqual([
    entryTarget.focusLatch.paragraphTop,
    entryTarget.focusLatch.stageTop
  ]);
  await expect.poll(() => stage.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return Math.round(bounds.top + bounds.height / 2);
  })).toBe(entryTarget.focusLatch.stageCenter);
  await expect.poll(() => root.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      focusTop: style.getPropertyValue("--kp-two-column-focus-top").trim(),
      stageTop: style.getPropertyValue("--kp-two-column-stage-top").trim(),
      stageSize: style.getPropertyValue(
        "--kp-two-column-stage-block-size"
      ).trim(),
      boundaryOffset: style.getPropertyValue(
        "--kp-two-column-horizontal-boundary-offset"
      ).trim()
    };
  })).toEqual({
    focusTop: "280px",
    stageTop: "160px",
    stageSize: "480px",
    boundaryOffset: "480px"
  });
  await expect.poll(() => stage.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return Math.round(bounds.width / bounds.height * 100) / 100;
  })).toBe(1.27);
  await expect.poll(() => graph.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return {
      ratio: Math.round(bounds.width / bounds.height * 100) / 100,
      viewBox: element.getAttribute("viewBox"),
      width: Math.round(bounds.width)
    };
  })).toEqual({ ratio: 1.52, viewBox: "0 0 640 420", width: 544 });
  await expect.poll(() => demandProgress(root)).toBe(0);
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
    .evaluate((element) => {
      const stageElement = element.closest<HTMLElement>(
        "[data-kp-inline-sticky-stage]"
      )!;
      return {
        axis: getComputedStyle(element).stroke,
        divider: getComputedStyle(stageElement).borderRightColor
      };
    })).toEqual({
      axis: "rgb(98, 103, 117)",
      divider: "rgb(98, 103, 117)"
    });
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
  const motionStart = Math.min(
    entryTarget.viewport.height * 0.62,
    focusTop + demandDistance
  );
  await placeTopAt(page, demandParagraph, motionStart);
  await expect.poll(() => demandProgress(root)).toBe(0);
  await expect.poll(async () => Number(await demandPassage.getAttribute(
    "data-kp-two-column-paragraph-opacity"
  ))).toBeGreaterThan(0.5);

  await placeTopAt(page, demandParagraph, motionStart - 1);
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0);
  await placeTopAt(page, demandParagraph, motionStart);
  await expect.poll(() => demandProgress(root)).toBe(0);

  const motionMidpoint = (motionStart + focusTop) / 2;
  await placeTopAt(page, demandParagraph, motionMidpoint);
  const forwardMidpoint = await demandProgress(root);
  expect(forwardMidpoint).toBeGreaterThan(
    entryBaseline.motionMidpoint.minimumDemandProgress
  );
  expect(forwardMidpoint).toBeLessThan(
    entryBaseline.motionMidpoint.maximumDemandProgress
  );
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
  expect(columns.proseFontWeight).toBe("400");
  expect(columns.proseLineHeight).toBeGreaterThan(32);
  expect(columns.releaseRuleHeight).toBe(1);
  expect(columns.paragraphLeft - columns.stageRight).toBeGreaterThan(20);
  expect(columns.paragraphWidth).toBeLessThan(440);
  expect(columns.stageWidth).toBeCloseTo(609.28, 1);
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
  await placeTopAt(page, supplyInterpretation.locator("p"), focusTop + 80);
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-passage-phase",
    "scrubbing"
  );
  await expect(supplyInterpretation).not.toHaveAttribute(
    "data-kp-two-column-endpoint-pinned",
    "true"
  );
  await placeTopAt(page, supplyInterpretation.locator("p"), focusTop);
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-passage-phase",
    "released"
  );
  await expect(supplyInterpretation).toHaveAttribute(
    "data-kp-two-column-endpoint-pinned",
    "true"
  );
  await expect(supplyInterpretation).toHaveAttribute(
    "data-kp-two-column-paragraph-opacity",
    "1.0000"
  );
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
  ))).toBeGreaterThan(entryBaseline.terminal.minimumSupplyProgress);
  await expect.poll(() => graph.evaluate((element) => Math.round(
    element.getBoundingClientRect().width
  ))).toBe(544);
  const stageBottom = await stage.evaluate(
    (element) => element.getBoundingClientRect().bottom
  );
  await placeBottomAt(
    page,
    body,
    stageBottom - entryBaseline.terminal.releaseInset
  );
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "released"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-passage-phase",
    "released"
  );
  await expect(supplyInterpretation).toHaveAttribute(
    "data-kp-two-column-paragraph-opacity",
    "1.0000"
  );
  await expect.poll(() => body.evaluate((element) =>
    Math.round(element.getBoundingClientRect().bottom)
  )).toBe(Math.round(stageBottom - entryBaseline.terminal.releaseInset));
  await expect.poll(() => body.evaluate((element) => {
    const stageElement = element.querySelector<HTMLElement>(
      "[data-kp-inline-sticky-stage]"
    )!;
    return Math.abs(
      stageElement.getBoundingClientRect().bottom -
        element.getBoundingClientRect().bottom
    );
  })).toBeLessThanOrEqual(1);
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
  await page.goto(`${route}&gap=100`);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const body = root.locator(".kp-economics-tutorial__motion-passage-body");
  const stage = root.locator("[data-kp-inline-sticky-stage]");
  const paragraph = card(root, "follow-shift").locator("p");
  const columnToggle = page.locator("[data-kp-economics-column-toggle]");

  await expect(root).toHaveAttribute(
    "data-kp-economics-two-column-paragraph-gap-vh",
    "100"
  );

  await expect.poll(() => body.evaluate((element) =>
    getComputedStyle(element).display
  )).toBe("block");
  await expect.poll(() => paragraph.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element.parentElement!).paddingBottom)
  )).toBeLessThan(200);
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
    color: "rgb(0, 0, 0)",
    proseWeight: "400",
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

test("economics uses one non-KaTeX family across lesson and review surfaces", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(route);
  await page.evaluate(() => document.fonts.ready);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const review = page.locator("[data-kp-dev-review-shell]");
  await expect(review).toHaveAttribute("data-kp-dev-review-available", "true");
  const nonMathSurfaces = [
    root.locator(".kp-economics-tutorial__prose p").first(),
    root.locator(".kp-economics-tutorial__prose h3").first(),
    root.locator("kp-tutorial-toc a").first(),
    root.locator("[data-kp-inline-sticky-stage] svg").first(),
    page.locator("[data-kp-economics-column-toggle]"),
    page.locator("[data-kp-economics-spacing-tuner] summary"),
    page.locator("[data-kp-economics-theme-toggle]"),
    review.locator("textarea"),
    review.locator(".route")
  ];
  for (const surface of nonMathSurfaces) {
    await expect.poll(() => surface.evaluate((element) =>
      getComputedStyle(element).fontFamily
    )).toContain("Source Serif 4 Variable");
  }

  const inlineMath = root.locator(".kp-economics-tutorial__prose .katex")
    .first();
  await expect.poll(() => inlineMath.evaluate((element) =>
    getComputedStyle(element).fontFamily
  )).toContain("KaTeX_Main");
  await expect.poll(() => inlineMath.evaluate((element) =>
    getComputedStyle(element).fontFamily
  )).not.toContain("Source Serif 4 Variable");

  await page.locator("[data-kp-economics-theme-toggle]").click();
  await expect(root).toHaveAttribute("data-kp-economics-tutorial-theme", "light");
  await expect.poll(() => review.locator("textarea").evaluate((element) =>
    getComputedStyle(element).fontFamily
  )).toContain("Source Serif 4 Variable");
  await expect.poll(() => inlineMath.evaluate((element) =>
    getComputedStyle(element).fontFamily
  )).toContain("KaTeX_Main");
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
    stageWidth: 609,
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
    stageWidth: 609,
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

test("spacing tuner preserves the active cue across its full URL range", async ({
  page
}) => {
  await page.addInitScript(() => {
    (window as Window & {
      __kpEconomicsPerformanceProbeRequested?: boolean;
    }).__kpEconomicsPerformanceProbeRequested = true;
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const paragraph = card(root, "follow-shift").locator("p");
  const tuner = page.locator("[data-kp-economics-spacing-tuner]");
  const input = tuner.locator("[data-kp-economics-spacing-tuner-input]");
  await placeTopAt(page, paragraph, 280);
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-attention-passage",
    "follow-shift"
  );
  await tuner.locator("summary").click();

  for (const gapVh of [0, 16, 50, 100]) {
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
    const before = await page.evaluate(() => {
      const target = window as Window & {
        __kpEconomicsTutorialRuntimePerformance?: {
          resetScrollCoordinator: () => void;
        };
      };
      target.__kpEconomicsTutorialRuntimePerformance!
        .resetScrollCoordinator();
      const root = document.querySelector<HTMLElement>(
        "[data-kp-economics-demand-shift-tutorial]"
      )!;
      return {
        progress: root.dataset["kpEconomicsTutorialDemandProgress"],
        passage: root.dataset["kpEconomicsTutorialAttentionPassage"]
      };
    });
    await input.fill(String(gapVh));
    await expect(root).toHaveAttribute(
      "data-kp-economics-two-column-paragraph-gap-vh",
      String(gapVh)
    );
    await expect(tuner.locator("output[for='kp-economics-paragraph-gap']"))
      .toHaveText(`${gapVh}vh`);
    await expect.poll(() => paragraph.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element.parentElement!).paddingBottom)
    )).toBe(gapVh * 8);
    await expect.poll(() => page.evaluate(() => {
      const target = window as Window & {
        __kpEconomicsTutorialRuntimePerformance?: {
          snapshotScrollCoordinator: () => { executedFrames: number };
        };
      };
      return target.__kpEconomicsTutorialRuntimePerformance!
        .snapshotScrollCoordinator().executedFrames;
    })).toBeGreaterThan(0);
    const coordinator = await page.evaluate(() => {
      const target = window as Window & {
        __kpEconomicsTutorialRuntimePerformance?: {
          snapshotScrollCoordinator: () => {
            executedFrames: number;
            registrationReads: number;
            layoutReads: number;
          };
        };
      };
      return target.__kpEconomicsTutorialRuntimePerformance!
        .snapshotScrollCoordinator();
    });
    // One invalidation remeasures the two motion-block anchors. A second
    // cached frame is allowed only for the viewport-anchor scroll correction.
    expect(coordinator.registrationReads).toBe(2);
    expect(coordinator.layoutReads).toBe(2);
    expect(coordinator.executedFrames).toBeLessThanOrEqual(2);
    await expect(root).toHaveAttribute(
      "data-kp-economics-tutorial-demand-progress",
      before.progress ?? ""
    );
    await expect(root).toHaveAttribute(
      "data-kp-economics-tutorial-attention-passage",
      before.passage ?? ""
    );
    expect(await page.evaluate(() =>
      new URL(window.location.href).searchParams.get("gap")
    )).toBe(gapVh === 16 ? null : String(gapVh));
  }

  await placeTopAt(page, paragraph, 390);
  const forwardProgress = await demandProgress(root);
  await placeTopAt(page, paragraph, 280);
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0.99);
  await placeTopAt(page, paragraph, 390);
  await expect.poll(async () => Math.abs(
    (await demandProgress(root)) - forwardProgress
  )).toBeLessThan(0.015);
});

test("salience and prose tuners preserve graph focus and fill the shared width", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const body = root.locator(".kp-economics-tutorial__motion-passage-body");
  const paragraph = card(root, "follow-shift").locator("p");
  const supply = root.locator("[data-kp-economics-supply-line]");
  const demand = root.locator("[data-kp-economics-demand-line]");
  const lineTuner = page.locator("kp-graph-style-tuner");
  const layoutTuner = page.locator("[data-kp-economics-spacing-tuner]");
  const initialColumns = await columnGeometry(body);

  await placeTopAt(page, paragraph, 280);
  const initialProgress = await demandProgress(root);
  await lineTuner.locator("summary").click();
  await lineTuner.locator("[data-kp-economics-context-opacity-input]")
    .fill("0.35");
  await expect(root).toHaveAttribute("data-kp-economics-context-opacity", "0.35");
  await expect.poll(() => demand.evaluate((element) =>
    getComputedStyle(element).filter
  )).toBe("opacity(0.35)");
  await expect.poll(() => supply.evaluate((element) =>
    getComputedStyle(element).filter
  )).toBe("none");

  await lineTuner.locator("[data-kp-economics-muted-blue-input]").check();
  await lineTuner.locator("[data-kp-economics-muted-red-input]").check();
  await expect(root).toHaveAttribute("data-kp-economics-muted-blue", "true");
  await expect(root).toHaveAttribute("data-kp-economics-muted-red", "true");
  await expect.poll(() => supply.evaluate((element) =>
    getComputedStyle(element).stroke
  )).toBe("rgb(138, 168, 189)");
  await expect.poll(() => demand.evaluate((element) =>
    getComputedStyle(element).stroke
  )).toBe("rgb(193, 143, 139)");

  await layoutTuner.locator("summary").click();
  await layoutTuner.locator("[data-kp-economics-text-width-input]")
    .fill("20");
  await layoutTuner.locator("[data-kp-economics-prose-line-height-input]")
    .fill("2");
  await layoutTuner.locator("[data-kp-economics-prose-weight-input]")
    .fill("500");
  await expect(root).toHaveAttribute("data-kp-economics-text-width-rem", "20");
  await expect(root).toHaveAttribute("data-kp-economics-prose-line-height", "2.00");
  await expect(root).toHaveAttribute("data-kp-economics-prose-weight", "500");
  const tunedColumns = await columnGeometry(body);
  expect(tunedColumns.proseWidth).toBeLessThan(initialColumns.proseWidth);
  expect(tunedColumns.stageWidth).toBeGreaterThan(initialColumns.stageWidth);
  expect(tunedColumns.proseWidth + tunedColumns.stageWidth).toBe(
    initialColumns.proseWidth + initialColumns.stageWidth
  );
  await expect.poll(() => paragraph.evaluate((element) =>
    getComputedStyle(element).color
  )).toBe("rgb(255, 255, 255)");
  await expect.poll(() => paragraph.evaluate((element) =>
    getComputedStyle(element).fontWeight
  )).toBe("500");
  await expect.poll(() => paragraph.evaluate((element) => {
    const style = getComputedStyle(element);
    return Number.parseFloat(style.lineHeight) /
      Number.parseFloat(style.fontSize);
  })).toBeCloseTo(2, 2);
  await expect.poll(() => demandProgress(root)).toBeCloseTo(initialProgress, 2);
  await expect(page).toHaveURL(/context=0.35/);
  await expect(page).toHaveURL(/mutedBlue=1/);
  await expect(page).toHaveURL(/mutedRed=1/);
  await expect(page).toHaveURL(/measure=20/);
  await expect(page).toHaveURL(/leading=2.00/);
  await expect(page).toHaveURL(/weight=500/);

  await page.locator("[data-kp-economics-theme-toggle]").click();
  await expect.poll(() => paragraph.evaluate((element) =>
    getComputedStyle(element).color
  )).toBe("rgb(0, 0, 0)");
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-salience-tuning.png`,
    fullPage: false
  });

  await page.reload();
  await expect(root).toHaveAttribute("data-kp-economics-context-opacity", "0.35");
  await expect(root).toHaveAttribute("data-kp-economics-text-width-rem", "20");
  await expect(root).toHaveAttribute("data-kp-economics-prose-weight", "500");
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

test("scroll frames reuse cached two-column viewport geometry", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => {
    const target = window as typeof window & {
      __kpTwoColumnRootStyleReads?: number;
    };
    const nativeGetComputedStyle = window.getComputedStyle;
    target.__kpTwoColumnRootStyleReads = 0;
    window.getComputedStyle = function getComputedStyle(
      element: Element,
      pseudoElement?: string | null
    ): CSSStyleDeclaration {
      if (element.matches("[data-kp-economics-demand-shift-tutorial]")) {
        target.__kpTwoColumnRootStyleReads =
          (target.__kpTwoColumnRootStyleReads ?? 0) + 1;
      }
      return nativeGetComputedStyle.call(window, element, pseudoElement);
    };
  });
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-coordinator",
    "connected"
  );
  await page.waitForTimeout(100);
  const readsAfterMount = await page.evaluate(() => (
    window as typeof window & { __kpTwoColumnRootStyleReads?: number }
  ).__kpTwoColumnRootStyleReads ?? 0);
  expect(readsAfterMount).toBeGreaterThan(0);

  for (const ratio of [0.15, 0.35, 0.6, 0.85, 0.4, 0.1]) {
    await page.evaluate((scrollRatio) => {
      window.scrollTo({
        top: (document.documentElement.scrollHeight - window.innerHeight) *
          scrollRatio,
        behavior: "auto"
      });
    }, ratio);
    await page.evaluate(() => new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    ));
  }
  const readsAfterScroll = await page.evaluate(() => (
    window as typeof window & { __kpTwoColumnRootStyleReads?: number }
  ).__kpTwoColumnRootStyleReads ?? 0);
  expect(readsAfterScroll).toBe(readsAfterMount);

  await page.setViewportSize({ width: 1280, height: 760 });
  await expect.poll(() => page.evaluate(() => (
    window as typeof window & { __kpTwoColumnRootStyleReads?: number }
  ).__kpTwoColumnRootStyleReads ?? 0)).toBeGreaterThan(readsAfterScroll);
});

test("forward and reverse traversal project identical passage state", async ({
  page
}) => {
  await page.setViewportSize(entryTarget.viewport);
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const first = card(root, "graph-at-rest").locator("p");
  const demand = card(root, "follow-shift").locator("p");
  const final = scrollParagraph(root, "movement-along-supply").locator("p");
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-coordinator",
    "connected"
  );

  const focusTop = entryTarget.focusLatch.paragraphTop;
  const demandDistance = await demand.evaluate((element) => {
    const previous = element.parentElement!.previousElementSibling!
      .querySelector("p")!;
    return element.getBoundingClientRect().top -
      previous.getBoundingClientRect().top;
  });
  const motionStart = Math.min(
    entryTarget.viewport.height * 0.62,
    focusTop + demandDistance
  );
  const positions = [
    { id: "ordinary", anchor: first, top: focusTop + 120 },
    { id: "latched", anchor: first, top: focusTop },
    {
      id: "demand-midpoint",
      anchor: demand,
      top: (motionStart + focusTop) / 2
    },
    { id: "released", anchor: final, top: focusTop }
  ] as const;

  const forward = new Map<string, Awaited<ReturnType<typeof symmetrySnapshot>>>();
  for (const position of positions) {
    await placeTopAt(page, position.anchor, position.top);
    forward.set(position.id, await symmetrySnapshot(root, position.id));
  }
  expect(positions.map(({ id }) => forward.get(id)?.passagePhase)).toEqual([
    "ordinary-document",
    "entry-latched",
    "scrubbing",
    "released"
  ]);
  expect(positions.map(({ id }) => forward.get(id)?.stageState)).toEqual([
    "embedded",
    "pinned",
    "pinned",
    "released"
  ]);
  expect(forward.get("ordinary")?.stageTop).toBe(
    entryTarget.focusLatch.stageTop + 120
  );

  for (const position of [...positions].reverse()) {
    await placeTopAt(page, position.anchor, position.top);
    await expect.poll(() => symmetrySnapshot(root, position.id)).toEqual(
      forward.get(position.id)
    );
  }
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

async function symmetrySnapshot(
  root: Locator,
  positionId: string
): Promise<{
  readonly attention: string | null;
  readonly demandProgress: string | null;
  readonly equilibrium: readonly [string | null, string | null];
  readonly passagePhase: string | null;
  readonly relevantOpacity: string | null;
  readonly relevantPinned: string | null;
  readonly stageBottom: number;
  readonly stageState: string | null;
  readonly stageTop: number;
  readonly supplyProgress: string | null;
}> {
  return root.evaluate((element, id) => {
    const relevantPassageId = id === "ordinary" || id === "latched"
      ? "graph-at-rest"
      : id === "demand-midpoint"
        ? "follow-shift"
        : "movement-along-supply";
    const relevant = element.querySelector<HTMLElement>(
      `[data-kp-economics-tutorial-passage="${relevantPassageId}"]`
    )!;
    const stage = element.querySelector<HTMLElement>(
      "[data-kp-inline-sticky-stage]"
    )!;
    const stageBounds = stage.getBoundingClientRect();
    const equilibrium = element.querySelector<SVGElement>(
      "[data-kp-economics-equilibrium-point]"
    )!;
    return {
      attention: element.getAttribute(
        "data-kp-economics-tutorial-attention-passage"
      ),
      demandProgress: element.getAttribute(
        "data-kp-economics-tutorial-demand-progress"
      ),
      equilibrium: [
        equilibrium.getAttribute("cx"),
        equilibrium.getAttribute("cy")
      ] as const,
      passagePhase: element.getAttribute(
        "data-kp-economics-tutorial-passage-phase"
      ),
      relevantOpacity: relevant.getAttribute(
        "data-kp-two-column-paragraph-opacity"
      ),
      relevantPinned: relevant.getAttribute(
        "data-kp-two-column-endpoint-pinned"
      ),
      stageBottom: Math.round(stageBounds.bottom),
      stageState: element.getAttribute("data-kp-inline-sticky-stage-state"),
      stageTop: Math.round(stageBounds.top),
      supplyProgress: element.getAttribute(
        "data-kp-economics-tutorial-supply-movement-progress"
      )
    };
  }, positionId);
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
