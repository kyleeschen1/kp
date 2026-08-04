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
  const demandTransport = demandPassage.locator("kp-tutorial-scrub-bar");
  const followingParagraph = passage(root, "new-equilibrium").locator("p").first();
  const followingPassage = passage(root, "new-equilibrium");

  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-layout",
    "inline-sticky"
  );
  await expect(root.locator("[data-kp-economics-stage='economics-stage']"))
    .toHaveCount(1);
  await expect(root.locator("[data-kp-inline-sticky-cue]")).toHaveCount(4);
  await expect(root.locator("[data-kp-inline-sticky-motion-track]"))
    .toHaveCount(0);
  await expect(root.locator("[data-kp-inline-sticky-runway]"))
    .toHaveCount(0);
  await expectNoVisibleSliders(root);

  await expect.poll(() => root.locator(
    ".kp-economics-tutorial__passage p"
  ).first().evaluate((element) => getComputedStyle(element).fontFamily))
    .toContain("Gill Sans");
  await expect.poll(() => root.locator(
    ".kp-tutorial-scrub__action"
  ).first().evaluate((element) => getComputedStyle(element).fontFamily))
    .toContain("Gill Sans");
  await expect.poll(() => root.locator(".katex").first().evaluate(
    (element) => getComputedStyle(element).fontFamily
  )).not.toContain("Gill Sans");
  await expect.poll(() => root.locator(".kp-economics-tutorial__math")
    .first().evaluate((element) => ({
      inner: getComputedStyle(element.querySelector(".katex")!).fontSize,
      prose: getComputedStyle(element.parentElement!).fontSize,
      wrapper: getComputedStyle(element).fontSize
    }))).toEqual({ inner: "19px", prose: "19px", wrapper: "19px" });

  await pinStage(stage);
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "pinned"
  );
  await expect.poll(() => stage.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    marginTop: Number.parseFloat(getComputedStyle(element).marginTop),
    marginBottom: Number.parseFloat(getComputedStyle(element).marginBottom),
    shadow: getComputedStyle(element).boxShadow,
    transform: getComputedStyle(element).transform
  }))).toEqual({
    background: "rgba(244, 241, 233, 0.96)",
    marginTop: 20,
    marginBottom: 24,
    shadow: "none",
    transform: "none"
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
    curve: "calc(1px * 1.5)",
    grid: "calc(1px * 0.5)",
    stable: "#4682b4",
    changing: "#dc443c"
  });
  await expect.poll(() => graph.locator("[data-kp-editor-graph-axis]").first()
    .evaluate((element) => getComputedStyle(element).strokeWidth))
    .toBe("1px");
  await expect.poll(() => graph.locator("[data-kp-economics-supply-line]")
    .evaluate((element) => ({
      color: getComputedStyle(element).stroke,
      width: getComputedStyle(element).strokeWidth
    }))).toEqual({ color: "rgb(70, 130, 180)", width: "1.5px" });
  await expect.poll(() => graph.locator("[data-kp-economics-demand-line]")
    .evaluate((element) => ({
      color: getComputedStyle(element).stroke,
      width: getComputedStyle(element).strokeWidth
    }))).toEqual({ color: "rgb(220, 68, 60)", width: "1.5px" });
  await expect.poll(() => graph.locator(
    "[data-kp-economics-initial-demand-reference]"
  ).evaluate((element) => ({
    dash: getComputedStyle(element).strokeDasharray,
    width: getComputedStyle(element).strokeWidth
  }))).toEqual({ dash: "none", width: "1.5px" });
  await expect.poll(() => graph.locator(".editor-graph-stage__economics-grid-line")
    .first().evaluate((element) => getComputedStyle(element).strokeWidth))
    .toBe("0.5px");
  await expect.poll(() => graph.locator(".editor-graph-stage__economics-guide")
    .first().evaluate((element) => getComputedStyle(element).strokeWidth))
    .toBe("1px");
  await expect.poll(() => graph.locator(
    "[data-kp-economics-supply-movement-trace]"
  ).evaluate((element) => getComputedStyle(element).strokeWidth))
    .toBe("1.5px");

  for (const role of [
    "axis-quantity",
    "axis-price",
    "tick-quantity-2",
    "tick-price-4",
    "curve-supply",
    "curve-demand-current",
    "equilibrium-current"
  ]) {
    await expect.poll(() => graph.locator(
      `[data-kp-economics-math-label="${role}"] .katex`
    ).evaluate((element) => getComputedStyle(element).fontSize)).toBe("19px");
  }
  await expect(graph.locator("[data-kp-economics-equilibrium-point]"))
    .toHaveAttribute("r", "3");
  await expect(graph.locator("[data-kp-economics-initial-equilibrium-reference]"))
    .toHaveAttribute("r", "2.75");
  await expect(graph.locator(
    '[data-kp-economics-supply-movement-target="initial"]'
  )).toHaveAttribute("r", "4.5");
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
  expect(new Set(margins.map(({ before }) => before))).toEqual(new Set([20]));
  expect(new Set(margins.map(({ after }) => after))).toEqual(new Set([20]));

  const geometry = await stageGeometry(stage);
  await placeParagraphTopAt(page, demandParagraph, 800);
  await expect(demandPassage).toHaveAttribute(
    "data-kp-inline-sticky-paragraph-phase",
    /below|approach/
  );
  await expectOpaqueParagraph(demandPassage);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.001);

  await expectModerateParagraphRhythm(
    demandParagraph,
    demandTransport,
    followingParagraph
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
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.001);
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
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0.55);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.68);
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

  // A paragraph owns attention precisely while it crosses the stage; even
  // focus-only passages therefore participate in the same spatial grammar.
  for (const passageId of [
    "new-equilibrium",
    "shift-versus-movement",
    "equation-check"
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

  await placeParagraphTopAt(page, demandParagraph, geometry.bottom);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.01);
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
  const demandTransport = demandPassage.locator("kp-tutorial-scrub-bar");
  const followingParagraph = passage(root, "new-equilibrium").locator("p").first();

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
  )).toBe("rgba(244, 241, 233, 0.96)");
  await expectNoVisibleSliders(root);
  await expect(root.locator("[data-kp-inline-sticky-motion-track]"))
    .toHaveCount(0);
  await expectModerateParagraphRhythm(
    demandParagraph,
    demandTransport,
    followingParagraph
  );

  const proseFontSize = await demandParagraph.evaluate((element) =>
    getComputedStyle(element).fontSize
  );
  for (const role of ["axis-quantity", "tick-quantity-2", "curve-supply"] ) {
    await expect.poll(() => graph.locator(
      `[data-kp-economics-math-label="${role}"] .katex`
    ).evaluate((element) => getComputedStyle(element).fontSize))
      .toBe(proseFontSize);
  }
  const geometry = await stageGeometry(stage);
  const paragraphHeight = await demandParagraph.evaluate(
    (element) => (element as HTMLElement).offsetHeight
  );
  await placeParagraphTopAt(
    page,
    demandParagraph,
    geometry.bottom - paragraphHeight / 2
  );
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0.55);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.68);
  await expectOpaqueParagraph(demandPassage);
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth - window.innerWidth
  )).toBeLessThanOrEqual(1);
  await page.screenshot({
    path: `${evidenceDirectory}/phone-paragraph-motion.png`,
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
    window.scrollTo({ top: Math.max(0, top - window.innerHeight * 0.04) });
    window.scrollTo({ top: Math.max(0, top - window.innerHeight * 0.04) });
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

async function expectNoVisibleSliders(root: Locator): Promise<void> {
  await expect(root.locator("kp-tutorial-scrub-bar input[data-action='seek']"))
    .toHaveCount(2);
  for (const slider of await root.locator(
    "kp-tutorial-scrub-bar input[data-action='seek']"
  ).all()) await expect(slider).toBeHidden();
  for (const output of await root.locator(
    "kp-tutorial-scrub-bar .kp-tutorial-scrub__progress"
  ).all()) await expect(output).toBeHidden();
  await expect(root.locator(".kp-tutorial-scrub__action")).toHaveCount(8);
}

async function expectModerateParagraphRhythm(
  paragraph: Locator,
  transport: Locator,
  followingParagraph: Locator
): Promise<void> {
  await expect.poll(() => Promise.all([
    paragraph.evaluate((element) => element.getBoundingClientRect().bottom),
    transport.evaluate((element) => element.getBoundingClientRect().top)
  ]).then(([paragraphBottom, transportTop]) => transportTop - paragraphBottom))
    .toBeGreaterThanOrEqual(7);
  await expect.poll(() => Promise.all([
    transport.evaluate((element) => element.getBoundingClientRect().bottom),
    followingParagraph.evaluate((element) => element.getBoundingClientRect().top)
  ]).then(([transportBottom, paragraphTop]) => paragraphTop - transportBottom))
    .toBeGreaterThanOrEqual(18);
  await expect.poll(() => Promise.all([
    transport.evaluate((element) => element.getBoundingClientRect().bottom),
    followingParagraph.evaluate((element) => element.getBoundingClientRect().top)
  ]).then(([transportBottom, paragraphTop]) => paragraphTop - transportBottom))
    .toBeLessThanOrEqual(60);
}
