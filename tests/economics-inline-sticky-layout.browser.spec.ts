import { mkdirSync } from "node:fs";

import { expect, test, type Locator, type Page } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/?layout=inline-sticky";
const evidenceDirectory = "tmp/codex/economics-inline-sticky-poc";

test.beforeAll(() => {
  mkdirSync(evidenceDirectory, { recursive: true });
});

test("wide paragraph-owned canvas synchronizes prose, graph, and motion", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(route);
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const stage = root.locator("[data-kp-inline-sticky-stage]");
  const stageCard = stage.locator(".kp-economics-tutorial__stage-card");
  const graph = stage.locator(".editor-graph-stage");
  const demandPassage = passage(root, "follow-shift");
  const demandParagraph = demandPassage.locator("p").first();
  const followingPassage = passage(root, "new-equilibrium");
  const motionPassage = root.locator('[data-kp-motion-passage="demand-change"]');
  const reflection = passage(root, "equation-check");

  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-layout",
    "inline-sticky"
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-lesson-theme",
    "dark"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-theme",
    "dark"
  );
  await expect(root.locator("[data-kp-economics-theme-toggle]"))
    .toHaveAttribute("aria-pressed", "true");
  await expect(root.locator("[data-kp-economics-stage='economics-stage']"))
    .toHaveCount(1);
  await expect(motionPassage).toHaveCount(1);
  await expect(motionPassage.locator(
    ".kp-economics-tutorial__motion-passage-gate--entrance"
  )).toContainText("A change in demand");
  await expect(root.locator("[data-kp-inline-sticky-cue]")).toHaveCount(3);
  await expect(reflection).toHaveAttribute(
    "data-kp-lesson-passage-role",
    "reflection"
  );
  await expect(reflection).not.toHaveAttribute("data-kp-inline-sticky-cue", "true");
  await expect(root.locator("[data-kp-inline-sticky-motion-track]"))
    .toHaveCount(0);
  await expect(root.locator("[data-kp-inline-sticky-runway]"))
    .toHaveCount(0);
  await expectNoTransportControls(root);

  await expect.poll(() => root.locator(
    ".kp-economics-tutorial__passage p"
  ).first().evaluate((element) => getComputedStyle(element).fontFamily))
    .toContain("Source Serif 4");
  await expect.poll(() => motionPassage.locator(
    ".kp-economics-tutorial__motion-passage-gate--entrance"
  ).evaluate((element) => getComputedStyle(element).fontFamily))
    .toContain("Source Serif 4");
  await expect.poll(() => root.locator(".katex").first().evaluate(
    (element) => getComputedStyle(element).fontFamily
  )).not.toContain("Source Serif 4");
  await expect.poll(() => root.locator(".kp-economics-tutorial__math")
    .first().evaluate((element) => ({
      inner: getComputedStyle(element.querySelector(".katex")!).fontSize,
      prose: getComputedStyle(element.parentElement!).fontSize,
      wrapper: getComputedStyle(element).fontSize
    }))).toEqual({ inner: "19px", prose: "19px", wrapper: "19px" });

  await motionPassage.locator(
    ".kp-economics-tutorial__motion-passage-gate--entrance"
  ).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `${evidenceDirectory}/wide-motion-passage-entrance.png`,
    fullPage: false
  });

  await pinStage(stage);
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "pinned"
  );
  await expect.poll(() => stage.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    height: element.getBoundingClientRect().height,
    marginTop: Number.parseFloat(getComputedStyle(element).marginTop),
    marginBottom: Number.parseFloat(getComputedStyle(element).marginBottom),
    paddingBottom: Number.parseFloat(getComputedStyle(element).paddingBottom),
    paddingTop: Number.parseFloat(getComputedStyle(element).paddingTop),
    shadow: getComputedStyle(element).boxShadow,
    top: element.getBoundingClientRect().top,
    transform: getComputedStyle(element).transform
  }))).toEqual({
    background: "rgba(13, 14, 28, 0.976)",
    height: 400,
    marginTop: 0,
    marginBottom: 0,
    paddingBottom: 20,
    paddingTop: 20,
    shadow: "none",
    top: 0,
    transform: "none"
  });
  await expect.poll(() => stage.evaluate((element) => {
    const style = getComputedStyle(element, "::after");
    return {
      background: style.backgroundColor,
      height: Number.parseFloat(style.height),
      width: Number.parseFloat(style.width)
    };
  })).toEqual({
    background: "rgb(98, 103, 117)",
    height: 1.5,
    width: 992
  });
  await expect.poll(() => stageCard.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    borderTop: getComputedStyle(element).borderTopWidth,
    shadow: getComputedStyle(element).boxShadow
  }))).toEqual({
    background: "rgba(0, 0, 0, 0)",
    borderTop: "0px",
    shadow: "none"
  });
  await expect.poll(() => stage.locator(".editor-animation-player__stage")
    .evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe("rgba(0, 0, 0, 0)");
  await expect.poll(() => stage.locator(".editor-graph-stage__plot-plane")
    .evaluate((element) => getComputedStyle(element).fill))
    .toBe("rgba(0, 0, 0, 0)");

  const stageWidth = await stage.evaluate(
    (element) => (element as HTMLElement).offsetWidth
  );
  const paragraphWidth = await demandPassage.evaluate(
    (element) => (element as HTMLElement).offsetWidth
  );
  expect(stageWidth).toBeGreaterThan(paragraphWidth + 100);
  await expect.poll(() => Promise.all([
    stage.evaluate((element) => Number.parseInt(getComputedStyle(element).zIndex)),
    demandPassage.evaluate((element) =>
      Number.parseInt(getComputedStyle(element).zIndex)
    )
  ])).toEqual([8, 1]);

  await expect.poll(() => graph.evaluate((element) => ({
    axis: getComputedStyle(element).getPropertyValue("--kp-graph-line-width")
      .trim(),
    curve: getComputedStyle(element).getPropertyValue(
      "--kp-graph-curve-line-width"
    ).trim(),
    grid: getComputedStyle(element).getPropertyValue(
      "--kp-graph-grid-line-width"
    ).trim(),
    stable: getComputedStyle(element).getPropertyValue("--kp-graph-stable")
      .trim(),
    changing: getComputedStyle(element).getPropertyValue("--kp-graph-changing")
      .trim()
  }))).toEqual({
    axis: "1px",
    curve: "1px",
    grid: "1px",
    stable: "#68a9df",
    changing: "#e77b74"
  });
  await expect.poll(() => graph.locator("[data-kp-editor-graph-axis]").first()
    .evaluate((element) => getComputedStyle(element).strokeWidth))
    .toBe("1px");
  await expect.poll(() => graph.locator("[data-kp-economics-supply-line]")
    .evaluate((element) => ({
      color: getComputedStyle(element).stroke,
      width: getComputedStyle(element).strokeWidth
    }))).toEqual({ color: "rgb(104, 169, 223)", width: "1px" });
  await expect.poll(() => graph.locator("[data-kp-economics-demand-line]")
    .evaluate((element) => ({
      color: getComputedStyle(element).stroke,
      width: getComputedStyle(element).strokeWidth
    }))).toEqual({ color: "rgb(231, 123, 116)", width: "1px" });
  await expect.poll(() => graph.locator(
    "[data-kp-economics-initial-demand-reference]"
  ).evaluate((element) => ({
    dash: getComputedStyle(element).strokeDasharray,
    width: getComputedStyle(element).strokeWidth
  }))).toEqual({ dash: "none", width: "1px" });
  await expect.poll(() => graph.locator(".editor-graph-stage__economics-grid-line")
    .first().evaluate((element) => getComputedStyle(element).strokeWidth))
    .toBe("1px");
  await expect.poll(() => graph.locator(".editor-graph-stage__economics-guide")
    .first().evaluate((element) => getComputedStyle(element).strokeWidth))
    .toBe("1px");
  await expect.poll(() => graph.locator(
    "[data-kp-economics-supply-movement-trace]"
  ).evaluate((element) => getComputedStyle(element).strokeWidth))
    .toBe("1px");

  for (const role of [
    "axis-quantity",
    "axis-price",
    "curve-supply",
    "curve-demand-current",
    "equilibrium-current"
  ]) {
    await expect.poll(() => graph.locator(
      `[data-kp-economics-math-label="${role}"] .katex`
    ).evaluate((element) => getComputedStyle(element).fontSize)).toBe("19px");
  }
  for (const role of ["tick-quantity-2", "tick-price-4"]) {
    await expect.poll(() => graph.locator(
      `[data-kp-economics-math-label="${role}"] .katex`
    ).evaluate((element) => getComputedStyle(element).fontSize)).toBe("14.25px");
  }
  await expect(graph.locator("[data-kp-economics-equilibrium-point]"))
    .toHaveAttribute("r", "3");
  await expect(graph.locator("[data-kp-economics-initial-equilibrium-reference]"))
    .toHaveAttribute("r", "2.75");
  await expect(graph.locator(
    '[data-kp-economics-supply-movement-target="initial"]'
  )).toHaveAttribute("r", "2.75");
  await expect(stage.locator(
    ".editor-graph-stage__economics-explanation-foreign-object"
  )).toBeHidden();

  const margins = await Promise.all([
    "follow-shift",
    "new-equilibrium",
    "shift-versus-movement",
    "equation-check"
  ].map((id) => passage(root, id).evaluate((element) => ({
    before: Number.parseFloat(getComputedStyle(element).marginTop),
    after: Number.parseFloat(getComputedStyle(element).marginBottom)
  }))));
  expect(margins.map(({ before }) => before)).toEqual([200, 200, 200, 48]);
  expect(margins.map(({ after }) => after)).toEqual([0, 0, 0, 6.4]);

  const geometry = await stageGeometry(stage);
  await placeParagraphTopAt(page, demandParagraph, 800);
  await expect(demandPassage).toHaveAttribute(
    "data-kp-inline-sticky-paragraph-phase",
    /below|approach/
  );
  await expectOpaqueParagraph(demandPassage);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.001);

  await expectQuarterViewportParagraphRhythm(
    page,
    demandPassage,
    followingPassage
  );

  await placeParagraphTopAt(
    page,
    demandParagraph,
    (800 + geometry.bottom) / 2
  );
  await expect(demandPassage).toHaveAttribute(
    "data-kp-inline-sticky-paragraph-phase",
    "approach"
  );
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.001);

  await placeParagraphTopAt(page, demandParagraph, geometry.bottom - 1);
  await expect(demandPassage).toHaveAttribute(
    "data-kp-inline-sticky-paragraph-phase",
    "crossing"
  );
  await expectOpaqueParagraph(demandPassage);
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0);
  await page.screenshot({
    path: `${evidenceDirectory}/wide-paragraph-handoff.png`,
    fullPage: false
  });

  const paragraphHeight = await demandParagraph.evaluate(
    (element) => (element as HTMLElement).offsetHeight
  );
  await placeParagraphTopAt(
    page,
    demandParagraph,
    geometry.bottom - paragraphHeight / 2
  );
  await expect.poll(async () => Number(await demandPassage.getAttribute(
    "data-kp-inline-sticky-crossing-progress"
  ))).toBeCloseTo(0.5, 1);
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0.7);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.73);
  await expectOpaqueParagraph(demandPassage);
  await page.screenshot({
    path: `${evidenceDirectory}/wide-paragraph-motion.png`,
    fullPage: false
  });

  await placeParagraphTopAt(
    page,
    demandParagraph,
    geometry.bottom - paragraphHeight + 2
  );
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0.99);
  await expectOpaqueParagraph(demandPassage);
  await expectOpaqueParagraph(followingPassage);

  // Only passages inside the bounded motion passage participate in crossing.
  for (const passageId of [
    "new-equilibrium",
    "shift-versus-movement"
  ]) {
    const focusPassage = passage(root, passageId);
    await placeParagraphTopAt(
      page,
      focusPassage.locator("p").first(),
      geometry.bottom - 1
    );
    await expect(root).toHaveAttribute(
      "data-kp-economics-tutorial-attention-passage",
      passageId
    );
    await expect(focusPassage).toHaveAttribute(
      "data-kp-inline-sticky-paragraph-phase",
      "crossing"
    );
  }

  await placeParagraphTopAt(
    page,
    reflection.locator("p").first(),
    geometry.bottom + 40
  );
  await expect(reflection).not.toHaveAttribute(
    "data-kp-inline-sticky-paragraph-phase",
    /crossing|passed/
  );
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "released"
  );
  await page.screenshot({
    path: `${evidenceDirectory}/wide-motion-passage-exit.png`,
    fullPage: false
  });

  await placeParagraphTopAt(page, demandParagraph, geometry.bottom);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.01);
});

test("equation comparison enters reversibly and persists through reflection", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(route);
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const stage = root.locator("[data-kp-inline-sticky-stage]");
  const supplyPassage = passage(root, "shift-versus-movement");
  const supplyParagraph = supplyPassage.locator("p").first();
  const reflection = passage(root, "equation-check");
  const verification = stage.locator(
    '[data-kp-economics-stage-surface="equilibrium-verification"]'
  );

  await pinStage(stage);
  const geometry = await stageGeometry(stage);
  const outerBefore = await stage.boundingBox();
  expect(outerBefore).not.toBeNull();
  const paragraphHeight = await supplyParagraph.evaluate(
    (element) => (element as HTMLElement).offsetHeight
  );

  await placeParagraphTopAt(page, supplyParagraph, geometry.bottom - 1);
  await expect.poll(() => supplyProgress(root)).toBeGreaterThan(0);

  await placeParagraphTopAt(
    page,
    supplyParagraph,
    geometry.bottom - paragraphHeight * 0.7
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-stage-composition-phase",
    /composing|split/
  );
  await expect.poll(() => verification.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).opacity)
  )).toBeGreaterThan(0);
  await page.screenshot({
    path: `${evidenceDirectory}/wide-equation-composition.png`,
    fullPage: false
  });

  await placeParagraphTopAt(
    page,
    supplyParagraph,
    geometry.bottom - paragraphHeight + 2
  );
  await expect.poll(() => supplyProgress(root)).toBeGreaterThan(0.99);
  await expect(verification).toHaveAttribute(
    "data-kp-economics-stage-surface-lifecycle",
    "settled"
  );
  await expect(verification).toHaveCSS("opacity", "1");
  expect(await stage.boundingBox()).toEqual(outerBefore);

  await placeParagraphTopAt(
    page,
    reflection.locator("p").first(),
    geometry.bottom + 40
  );
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "released"
  );
  await expect.poll(() => supplyProgress(root)).toBeGreaterThan(0.99);
  await expect(verification).toHaveCount(1);

  await placeParagraphTopAt(page, supplyParagraph, geometry.bottom + 1);
  await expect.poll(() => supplyProgress(root)).toBeLessThan(0.01);
  await expect(verification).toHaveCount(1);
  await expect(verification).toHaveCSS("opacity", "0");
});

test("phone paragraph crossing preserves readable type and exact motion", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const stage = root.locator("[data-kp-inline-sticky-stage]");
  const graph = stage.locator(".editor-graph-stage");
  const demandPassage = passage(root, "follow-shift");
  const demandParagraph = demandPassage.locator("p").first();
  const followingPassage = passage(root, "new-equilibrium");

  await pinStage(stage);
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-fit",
    /comfortable|compact/
  );
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "pinned"
  );
  await expect.poll(() => stage.evaluate((element) =>
    getComputedStyle(element).backgroundColor
  )).toBe("rgba(13, 14, 28, 0.976)");
  await expect.poll(() => stage.evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    top: element.getBoundingClientRect().top
  }))).toEqual({ height: 422, top: 0 });
  await expect.poll(() => stage.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element, "::after").width)
  )).toBe(390);
  await expectNoTransportControls(root);
  await expect(root.locator("[data-kp-inline-sticky-motion-track]"))
    .toHaveCount(0);
  await expectQuarterViewportParagraphRhythm(
    page,
    demandPassage,
    followingPassage
  );

  const proseFontSize = await demandParagraph.evaluate((element) =>
    getComputedStyle(element).fontSize
  );
  for (const role of ["axis-quantity", "curve-supply"] ) {
    await expect.poll(() => graph.locator(
      `[data-kp-economics-math-label="${role}"] .katex`
    ).evaluate((element) => getComputedStyle(element).fontSize))
      .toBe(proseFontSize);
  }
  await expect.poll(() => graph.locator(
    '[data-kp-economics-math-label="tick-quantity-2"] .katex'
  ).evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)))
    .toBeCloseTo(Number.parseFloat(proseFontSize) * 0.75, 2);
  const geometry = await stageGeometry(stage);
  const paragraphHeight = await demandParagraph.evaluate(
    (element) => (element as HTMLElement).offsetHeight
  );
  await placeParagraphTopAt(
    page,
    demandParagraph,
    geometry.bottom - paragraphHeight / 2
  );
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0.7);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.73);
  await expectOpaqueParagraph(demandPassage);
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth - window.innerWidth
  )).toBeLessThanOrEqual(1);
  await page.screenshot({
    path: `${evidenceDirectory}/phone-paragraph-motion.png`,
    fullPage: false
  });
});

test("default midnight theme toggles without navigation", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${route}&demand=19`);
  const html = page.locator("html");
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const stage = root.locator("[data-kp-inline-sticky-stage]");
  const graph = stage.locator(".editor-graph-stage");
  const paragraph = passage(root, "follow-shift").locator("p").first();
  const toggle = root.locator("[data-kp-economics-theme-toggle]");

  await expect(html).toHaveAttribute("data-kp-lesson-theme", "dark");
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-theme",
    "dark"
  );
  await expect(root).toHaveAttribute(
    "data-kp-tutorial-review-evidence",
    JSON.stringify({ themeId: "theme.kp.lesson.economics-midnight-v1" })
  );
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => html.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    colorScheme: getComputedStyle(element).colorScheme
  }))).toEqual({ background: "rgb(13, 14, 28)", colorScheme: "dark" });
  await expect.poll(() => root.evaluate((element) => ({
    background: getComputedStyle(element).getPropertyValue(
      "--kp-lesson-theme-page"
    ).trim(),
    color: getComputedStyle(element).color,
    math: getComputedStyle(element).getPropertyValue(
      "--kp-lesson-theme-math-foreground"
    ).trim()
  }))).toEqual({
    background: "#0d0e1c",
    color: "rgb(197, 199, 205)",
    math: "#b9bec9"
  });
  const darkBodyContrast = await contrastRatio(root, page.locator("body"));
  expect(darkBodyContrast).toBeGreaterThan(10);
  expect(darkBodyContrast).toBeLessThan(12);
  await expect.poll(() => stage.evaluate((element) =>
    getComputedStyle(element).backgroundColor
  )).toBe("rgba(13, 14, 28, 0.976)");
  await expect.poll(() => graph.evaluate((element) => ({
    axis: getComputedStyle(element).getPropertyValue("--kp-graph-axis").trim(),
    changing: getComputedStyle(element).getPropertyValue(
      "--kp-graph-changing"
    ).trim(),
    focal: getComputedStyle(element).getPropertyValue("--kp-graph-focal").trim(),
    grid: getComputedStyle(element).getPropertyValue("--kp-graph-grid").trim(),
    plane: getComputedStyle(element).getPropertyValue("--kp-graph-plane").trim(),
    stable: getComputedStyle(element).getPropertyValue("--kp-graph-stable").trim()
  }))).toEqual({
    axis: "#a2acbf",
    changing: "#e77b74",
    focal: "#c5c7cd",
    grid: "#25293b",
    plane: "transparent",
    stable: "#68a9df"
  });
  await expect.poll(() => root.evaluate((element) => {
    const graphElement = element.querySelector<SVGElement>(
      ".editor-graph-stage"
    )!;
    const axis = graphElement.querySelector<SVGElement>(
      "[data-kp-editor-graph-axis]"
    )!;
    const curve = graphElement.querySelector<SVGElement>(
      "[data-kp-economics-demand-line]"
    )!;
    const gridLine = graphElement.querySelector<SVGElement>(
      ".editor-graph-stage__economics-grid-line"
    )!;
    return {
      axisWidth: getComputedStyle(axis).strokeWidth,
      curveWidth: getComputedStyle(curve).strokeWidth,
      gridOpacity: getComputedStyle(gridLine).opacity,
      gridWidth: getComputedStyle(gridLine).strokeWidth,
      proseWeight: getComputedStyle(
        element.querySelector<HTMLElement>(".kp-economics-tutorial__prose")!
      ).fontWeight
    };
  })).toEqual({
    axisWidth: "1px",
    curveWidth: "1px",
    gridOpacity: "1",
    gridWidth: "1px",
    proseWeight: "375"
  });
  await expect.poll(() => root.locator(".kp-economics-tutorial__math .katex")
    .first().evaluate((element) => getComputedStyle(element).color))
    .toBe("rgb(185, 190, 201)");
  await expect.poll(() => passage(root, "synthesis").evaluate((element) =>
    getComputedStyle(element).backgroundColor
  )).toBe("rgba(37, 44, 65, 0.72)");

  await pinStage(stage);
  const geometry = await stageGeometry(stage);
  const paragraphHeight = await paragraph.evaluate(
    (element) => (element as HTMLElement).offsetHeight
  );
  await placeParagraphTopAt(
    page,
    paragraph,
    geometry.bottom - paragraphHeight / 2
  );
  await page.screenshot({
    path: `${evidenceDirectory}/dark-wide-paragraph-motion.png`,
    fullPage: false
  });

  await toggle.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    (window as Window & { kpThemeDocumentIdentity?: Document })
      .kpThemeDocumentIdentity = document;
  });
  const beforeToggle = await root.evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    scrollY: window.scrollY,
    width: element.getBoundingClientRect().width
  }));
  await toggle.click();
  await expect(html).toHaveAttribute("data-kp-lesson-theme", "light");
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-theme",
    "light"
  );
  await expect(root).toHaveAttribute(
    "data-kp-tutorial-review-evidence",
    JSON.stringify({ themeId: "theme.kp.lesson.economics-paper-v1" })
  );
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => page.evaluate(() => ({
    demand: new URL(location.href).searchParams.get("demand"),
    documentPreserved:
      (window as Window & { kpThemeDocumentIdentity?: Document })
        .kpThemeDocumentIdentity === document,
    layout: new URL(location.href).searchParams.get("layout"),
    theme: new URL(location.href).searchParams.get("theme")
  }))).toEqual({
    demand: "19",
    documentPreserved: true,
    layout: "inline-sticky",
    theme: "light"
  });
  await expect.poll(() => root.evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    scrollY: window.scrollY,
    width: element.getBoundingClientRect().width
  }))).toEqual(beforeToggle);
  await expect.poll(() => stage.evaluate((element) =>
    getComputedStyle(element).backgroundColor
  )).toBe("rgba(244, 241, 233, 0.976)");
  await expect.poll(() => root.evaluate((element) => {
    const graphElement = element.querySelector<SVGElement>(
      ".editor-graph-stage"
    )!;
    const axis = graphElement.querySelector<SVGElement>(
      "[data-kp-editor-graph-axis]"
    )!;
    const curve = graphElement.querySelector<SVGElement>(
      "[data-kp-economics-demand-line]"
    )!;
    const gridLine = graphElement.querySelector<SVGElement>(
      ".editor-graph-stage__economics-grid-line"
    )!;
    const math = element.querySelector<HTMLElement>(
      ".kp-economics-tutorial__math .katex"
    )!;
    return {
      axisWidth: getComputedStyle(axis).strokeWidth,
      curveWidth: getComputedStyle(curve).strokeWidth,
      gridColor: getComputedStyle(gridLine).stroke,
      gridOpacity: getComputedStyle(gridLine).opacity,
      gridWidth: getComputedStyle(gridLine).strokeWidth,
      mathColor: getComputedStyle(math).color,
      proseWeight: getComputedStyle(
        element.querySelector<HTMLElement>(".kp-economics-tutorial__prose")!
      ).fontWeight
    };
  })).toEqual({
    axisWidth: "1.25px",
    curveWidth: "1.25px",
    gridColor: "rgb(219, 225, 224)",
    gridOpacity: "1",
    gridWidth: "1.25px",
    mathColor: "rgb(79, 87, 94)",
    proseWeight: "425"
  });
  await page.screenshot({
    path: `${evidenceDirectory}/light-footer-toggle.png`,
    fullPage: false
  });

  await toggle.click();
  await expect(html).toHaveAttribute("data-kp-lesson-theme", "dark");
  await expect.poll(() => new URL(page.url()).searchParams.get("theme"))
    .toBeNull();
  await expect.poll(() => passage(root, "synthesis").evaluate((element) =>
    getComputedStyle(element).backgroundColor
  )).toBe("rgba(37, 44, 65, 0.72)");
  await expect.poll(() => toggle.locator(
    ".kp-economics-tutorial__theme-toggle-thumb"
  ).evaluate((element) => getComputedStyle(element).transform))
    .toBe("matrix(1, 0, 0, 1, 12.16, 0)");
  await page.screenshot({
    path: `${evidenceDirectory}/dark-footer-toggle.png`,
    fullPage: false
  });
});

test("default phone theme keeps graph, prose, and footer within one viewport", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const stage = root.locator("[data-kp-inline-sticky-stage]");
  const paragraph = passage(root, "follow-shift").locator("p").first();
  await pinStage(stage);
  const geometry = await stageGeometry(stage);
  const paragraphHeight = await paragraph.evaluate(
    (element) => (element as HTMLElement).offsetHeight
  );
  await placeParagraphTopAt(
    page,
    paragraph,
    geometry.bottom - paragraphHeight / 2
  );
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth - window.innerWidth
  )).toBeLessThanOrEqual(1);
  await expect(root.locator("[data-kp-economics-theme-toggle]"))
    .toHaveAttribute("aria-pressed", "true");
  await page.screenshot({
    path: `${evidenceDirectory}/dark-phone-paragraph-motion.png`,
    fullPage: false
  });
});

test("large text may exceed the lower viewport without shrinking or fading", async ({
  page
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto(route);
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const stage = root.locator("[data-kp-inline-sticky-stage]");
  const demandPassage = passage(root, "follow-shift");
  const demandParagraph = demandPassage.locator("p").first();
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-fit",
    /comfortable|compact/
  );
  await expect.poll(() => stage.evaluate((element) =>
    getComputedStyle(element).position
  )).toBe("sticky");
  await expect.poll(() => demandParagraph.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize)
  )).toBeGreaterThanOrEqual(34);
  await expect.poll(() => root.locator(".kp-economics-tutorial__math")
    .first().evaluate((element) => ({
      inner: getComputedStyle(element.querySelector(".katex")!).fontSize,
      prose: getComputedStyle(element.parentElement!).fontSize
    }))).toEqual({ inner: "34px", prose: "34px" });
  const geometry = await stageGeometry(stage);
  expect(await demandParagraph.evaluate(
    (element) => (element as HTMLElement).offsetHeight
  )).toBeGreaterThan(640 - geometry.bottom);
  await expectOpaqueParagraph(demandPassage);
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll<HTMLElement>(
    "body *"
  )].map((element) => ({
    className: element.className.toString(),
    right: element.getBoundingClientRect().right,
    tag: element.tagName
  })).filter(({ right }) => right > window.innerWidth + 1)
    .sort((left, right) => right.right - left.right)
    .slice(0, 8))).toEqual([]);
});

test("reduced motion returns opaque paragraphs and the stage to reading flow", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const stage = root.locator("[data-kp-inline-sticky-stage]");
  await expect.poll(() => stage.evaluate((element) =>
    getComputedStyle(element).position
  )).toBe("relative");
  for (const passageId of [
    "follow-shift",
    "new-equilibrium",
    "shift-versus-movement",
    "equation-check"
  ]) await expectOpaqueParagraph(passage(root, passageId));
  await expect(root.locator("[data-kp-inline-sticky-motion-track]"))
    .toHaveCount(0);
});

function passage(root: Locator, passageId: string): Locator {
  return root.locator(
    `[data-kp-economics-tutorial-passage="${passageId}"]`
  );
}

async function pinStage(stage: Locator): Promise<void> {
  await stage.evaluate((element) => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, top + 1) });
    window.scrollTo({ top: Math.max(0, top + 1) });
  });
}

async function placeParagraphTopAt(
  page: Page,
  paragraph: Locator,
  viewportY: number
): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await paragraph.evaluate((element, targetY) => {
      window.scrollBy({
        top: element.getBoundingClientRect().top - targetY,
        behavior: "auto"
      });
    }, viewportY);
    await page.evaluate(() => new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    ));
  }
}

async function stageGeometry(stage: Locator): Promise<{
  readonly top: number;
  readonly bottom: number;
}> {
  return stage.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { top: bounds.top, bottom: bounds.bottom };
  });
}

async function demandProgress(root: Locator): Promise<number> {
  return Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ));
}

async function supplyProgress(root: Locator): Promise<number> {
  return Number(await root.getAttribute(
    "data-kp-economics-tutorial-supply-movement-progress"
  ));
}

async function expectOpaqueParagraph(passageElement: Locator): Promise<void> {
  await expect.poll(() => passageElement.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    opacity: Number.parseFloat(getComputedStyle(element).opacity),
    transform: getComputedStyle(element).transform
  }))).toEqual({
    background: "rgba(0, 0, 0, 0)",
    opacity: 1,
    transform: "none"
  });
}

async function expectNoTransportControls(root: Locator): Promise<void> {
  await expect(root.locator("kp-tutorial-scrub-bar")).toHaveCount(0);
  await expect(root.locator(".kp-tutorial-scrub__action")).toHaveCount(0);
}

async function expectQuarterViewportParagraphRhythm(
  page: Page,
  passageElement: Locator,
  followingPassage: Locator
): Promise<void> {
  await expect.poll(() => Promise.all([
    passageElement.evaluate((element) => element.getBoundingClientRect().bottom),
    followingPassage.evaluate((element) => element.getBoundingClientRect().top)
  ]).then(([passageBottom, followingTop]) => followingTop - passageBottom))
    .toBeCloseTo(page.viewportSize()!.height * 0.25, 0);
}

async function contrastRatio(
  foreground: Locator,
  background: Locator
): Promise<number> {
  const [foregroundColor, backgroundColor] = await Promise.all([
    foreground.evaluate((element) => getComputedStyle(element).color),
    background.evaluate((element) => getComputedStyle(element).backgroundColor)
  ]);
  const foregroundLuminance = relativeLuminance(foregroundColor);
  const backgroundLuminance = relativeLuminance(backgroundColor);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

function relativeLuminance(color: string): number {
  const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (channels === undefined || channels.length !== 3) {
    throw new Error(`Expected an RGB color, received ${color}.`);
  }
  const [red, green, blue] = channels.map((channel) => {
    const normalized = channel! / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return red! * 0.2126 + green! * 0.7152 + blue! * 0.0722;
}
