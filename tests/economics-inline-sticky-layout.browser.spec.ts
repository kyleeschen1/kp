import { mkdirSync } from "node:fs";

import { expect, test, type Locator, type Page } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/?layout=inline-sticky";
const evidenceDirectory = "tmp/codex/economics-inline-sticky-poc";

test.beforeAll(() => {
  mkdirSync(evidenceDirectory, { recursive: true });
});

test("wide continuous canvas preserves the 5vh hold and 10vh prose fade", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(route);
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const stage = root.locator("[data-kp-inline-sticky-stage]");
  const stageCard = stage.locator(".kp-economics-tutorial__stage-card");
  const demandCue = cue(root, "follow-shift");
  const followingCue = cue(root, "new-equilibrium");

  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-layout",
    "inline-sticky"
  );
  await expect(root.locator("[data-kp-economics-stage='economics-stage']"))
    .toHaveCount(1);
  await expect(root.locator("[data-kp-inline-sticky-cue]")).toHaveCount(4);
  await expect(root.locator("[data-kp-inline-sticky-attention-padding]"))
    .toHaveCount(0);
  await expect(root.locator("[data-kp-economics-stage='economics-stage']"))
    .toHaveAttribute("aria-busy", "false");
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

  await pinStage(stage);
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "pinned"
  );
  await expect.poll(() => stage.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    shadow: getComputedStyle(element).boxShadow,
    transform: getComputedStyle(element).transform
  }))).toEqual({
    background: "rgba(0, 0, 0, 0)",
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
  await expect.poll(() => stage.evaluate((element) =>
    getComputedStyle(element, "::after").content
  )).toBe("none");
  await expect.poll(() => stage.locator(".editor-animation-player__stage")
    .evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe("rgba(0, 0, 0, 0)");
  await expect.poll(() => stage.locator(".editor-graph-stage__plot-plane")
    .evaluate((element) => getComputedStyle(element).fill))
    .toBe("rgba(0, 0, 0, 0)");
  const stageWidth = await stage.evaluate(
    (element) => (element as HTMLElement).offsetWidth
  );

  const geometry = await handoffGeometry(page);
  const layoutWidth = await demandCue.evaluate(
    (element) => (element as HTMLElement).offsetWidth
  );
  expect(stageWidth).toBeGreaterThan(layoutWidth + 100);
  await expectQuietControls(root);
  const entryTop = await demandCue.evaluate(() => window.innerHeight);
  await placeCueTopAt(page, demandCue, entryTop);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    /below|approach/
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.99);
  await expect.poll(() => cueOpacity(followingCue)).toBeGreaterThan(0.99);

  const approachTop = (entryTop + geometry.stageBottom) / 2;
  await placeCueTopAt(page, demandCue, approachTop);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "approach"
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.99);
  await expectContinuousCueSurface(demandCue);
  await page.screenshot({
    path: `${evidenceDirectory}/wide-continuous-approach.png`,
    fullPage: false
  });

  await placeCueTopAt(page, demandCue, geometry.stageBottom - 1);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "hold"
  );
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeLessThan(0.001);
  await expectContinuousCueSurface(demandCue);
  expect(await page.evaluate(() =>
    getComputedStyle(document.documentElement).scrollSnapType
  )).toBe("none");
  await page.screenshot({
    path: `${evidenceDirectory}/wide-continuous-threshold.png`,
    fullPage: false
  });

  const holdSample = (geometry.stageBottom + geometry.fadeStart) / 2;
  await placeCueTopAt(page, demandCue, holdSample);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "hold"
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.99);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeLessThan(0.001);
  await page.screenshot({
    path: `${evidenceDirectory}/wide-continuous-5vh-hold.png`,
    fullPage: false
  });

  const fadeMidpoint = (geometry.fadeStart + geometry.fadeEnd) / 2;
  await placeCueTopAt(page, demandCue, fadeMidpoint);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "fade"
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.35);
  await expect.poll(() => cueOpacity(demandCue)).toBeLessThan(0.65);
  await expectContinuousCueSurface(demandCue);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeLessThan(0.001);
  await page.screenshot({
    path: `${evidenceDirectory}/wide-continuous-fade.png`,
    fullPage: false
  });

  await placeCueTopAt(page, demandCue, geometry.fadeEnd - 2);
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "pinned"
  );
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "occluded"
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeLessThan(0.01);
  await expect.poll(async () => Number(await demandCue.getAttribute(
    "data-kp-inline-sticky-fade-progress"
  ))).toBeCloseTo(1, 1);
  await expectContinuousCueSurface(demandCue);
  expect(await demandCue.evaluate((element) =>
    (element as HTMLElement).offsetWidth
  ))
    .toBe(layoutWidth);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeLessThan(0.001);
  await page.screenshot({
    path: `${evidenceDirectory}/wide-continuous-prose-cleared.png`,
    fullPage: false
  });

  await placeCueTopAt(
    page,
    demandCue,
    geometry.fadeEnd -
      (geometry.fadeEnd - geometry.stageTop) * 0.65
  );
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeGreaterThan(0.001);

  await placeCueTopAt(page, demandCue, geometry.stageTop + 20);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeGreaterThan(0.99);
  await expect.poll(() => cueOpacity(followingCue)).toBeGreaterThan(0.99);

  await placeCueTopAt(page, demandCue, geometry.fadeEnd);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeLessThan(0.01);
});

test("phone continuous canvas preserves one text measure through both bands", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const stage = root.locator("[data-kp-inline-sticky-stage]");
  const demandCue = cue(root, "follow-shift");

  await pinStage(stage);
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-fit",
    /comfortable|compact/
  );
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "pinned"
  );
  await expect.poll(() => stage.locator(".editor-animation-player__stage")
    .evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe("rgba(0, 0, 0, 0)");
  await expectQuietControls(root);
  const geometry = await handoffGeometry(page);
  await placeCueTopAt(page, demandCue, geometry.stageBottom - 1);
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.99);
  await expectContinuousCueSurface(demandCue);

  const before = await phoneProjection(page);
  await page.screenshot({
    path: `${evidenceDirectory}/phone-continuous-threshold.png`,
    fullPage: false
  });
  const holdSample = (geometry.stageBottom + geometry.fadeStart) / 2;
  await placeCueTopAt(page, demandCue, holdSample);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "hold"
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.99);

  const fadeMidpoint = (geometry.fadeStart + geometry.fadeEnd) / 2;
  await placeCueTopAt(page, demandCue, fadeMidpoint);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "fade"
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.35);
  await expect.poll(() => cueOpacity(demandCue)).toBeLessThan(0.65);
  await expectContinuousCueSurface(demandCue);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeLessThan(0.001);
  const during = await phoneProjection(page);

  expect(before.stageBottom).toBeLessThan(844 * 0.55);
  expect(before.demandWidth).toBe(during.demandWidth);
  expect(before.demandWidth).toBe(before.holdWidth);
  expect(during.fontSize).toBeGreaterThanOrEqual(17);
  expect(during.lineHeight).toBeGreaterThanOrEqual(25);
  expect(during.horizontalOverflow).toBeLessThanOrEqual(1);

  await page.screenshot({
    path: `${evidenceDirectory}/phone-continuous-fade.png`,
    fullPage: false
  });

  await placeCueTopAt(page, demandCue, geometry.fadeEnd - 2);
  await expect.poll(() => cueOpacity(demandCue)).toBeLessThan(0.01);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeLessThan(0.001);
});

test("large text selects ordinary reading flow instead of shrinking", async ({
  page
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto(route);
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const stage = root.locator("[data-kp-inline-sticky-stage]");
  const demandCue = cue(root, "follow-shift");
  await expect(root).toHaveAttribute("data-kp-inline-sticky-fit", "reading");
  await expect.poll(() => stage.evaluate((element) =>
    getComputedStyle(element).position
  )).toBe("relative");
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.99);
  await expect.poll(() => cueTransform(demandCue)).toBe("none");
  await expect.poll(() => demandCue.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize)
  )).toBeGreaterThanOrEqual(34);
});

test("reduced motion keeps every cue opaque in ordinary reading flow", async ({
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
  ]) {
    const passage = cue(root, passageId);
    await expect.poll(() => cueOpacity(passage)).toBe(1);
    await expect.poll(() => cueTransform(passage)).toBe("none");
  }
});

function cue(root: Locator, passageId: string): Locator {
  return root.locator(
    `[data-kp-economics-tutorial-passage="${passageId}"]`
  );
}

async function pinStage(stage: Locator): Promise<void> {
  await stage.evaluate((element) => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, top - window.innerHeight * 0.04) });
  });
}

async function placeCueTopAt(
  page: Page,
  cueElement: Locator,
  viewportY: number
): Promise<void> {
  // Sticky settlement can change stage geometry after the first scroll. A few
  // bounded corrections make the visual checkpoint sample the requested top.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await cueElement.evaluate((element, targetY) => {
      const bounds = element.getBoundingClientRect();
      const layoutHeight = (element as HTMLElement).offsetHeight;
      const untransformedTop = bounds.top + bounds.height / 2 - layoutHeight / 2;
      window.scrollBy({
        top: untransformedTop - targetY,
        behavior: "auto"
      });
    }, viewportY);
    await page.evaluate(() => new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    ));
  }
}

async function handoffGeometry(page: Page): Promise<{
  readonly stageTop: number;
  readonly stageBottom: number;
  readonly fadeStart: number;
  readonly fadeEnd: number;
}> {
  return page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-inline-sticky-stage]"
    )!;
    const bounds = stage.getBoundingClientRect();
    return {
      stageTop: bounds.top,
      stageBottom: bounds.bottom,
      fadeStart: bounds.bottom - window.innerHeight * 0.05,
      fadeEnd: bounds.bottom - window.innerHeight * 0.15
    };
  });
}

async function phoneProjection(page: Page): Promise<{
  readonly stageBottom: number;
  readonly demandWidth: number;
  readonly holdWidth: number;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly horizontalOverflow: number;
}> {
  return page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-inline-sticky-stage]"
    )!;
    const demand = document.querySelector<HTMLElement>(
      '[data-kp-inline-sticky-cue][data-kp-economics-tutorial-passage="follow-shift"]'
    )!;
    const hold = document.querySelector<HTMLElement>(
      '[data-kp-inline-sticky-cue][data-kp-economics-tutorial-passage="new-equilibrium"]'
    )!;
    const demandStyle = getComputedStyle(demand);
    return {
      stageBottom: stage.getBoundingClientRect().bottom,
      demandWidth: demand.offsetWidth,
      holdWidth: hold.offsetWidth,
      fontSize: Number.parseFloat(demandStyle.fontSize),
      lineHeight: Number.parseFloat(demandStyle.lineHeight),
      horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth
    };
  });
}

async function cueOpacity(cueElement: Locator): Promise<number> {
  return cueElement.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).opacity)
  );
}

async function cueTransform(cueElement: Locator): Promise<string> {
  return cueElement.evaluate((element) => getComputedStyle(element).transform);
}

async function expectContinuousCueSurface(cueElement: Locator): Promise<void> {
  await expect.poll(() => cueElement.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    borderLeft: getComputedStyle(element).borderLeftWidth,
    shadow: getComputedStyle(element).boxShadow,
    transform: getComputedStyle(element).transform,
    beforeContent: getComputedStyle(element, "::before").content,
    afterContent: getComputedStyle(element, "::after").content
  }))).toEqual({
    background: "rgba(0, 0, 0, 0)",
    borderLeft: "0px",
    shadow: "none",
    transform: "none",
    beforeContent: "none",
    afterContent: "none"
  });
}

async function expectQuietControls(root: Locator): Promise<void> {
  const action = root.locator(".kp-tutorial-scrub__action").first();
  await expect.poll(() => action.evaluate((element) => ({
    borderTop: getComputedStyle(element).borderTopWidth,
    borderRadius: getComputedStyle(element).borderRadius,
    shadow: getComputedStyle(element).boxShadow,
    transform: getComputedStyle(element).transform,
    afterContent: getComputedStyle(element, "::after").content
  }))).toEqual({
    borderTop: "0px",
    borderRadius: "0px",
    shadow: "none",
    transform: "none",
    afterContent: "none"
  });
}
