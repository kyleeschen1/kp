import { mkdirSync } from "node:fs";

import { expect, test, type Locator, type Page } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/?layout=inline-sticky";
const evidenceDirectory = "tmp/codex/economics-inline-sticky-poc";

test.beforeAll(() => {
  mkdirSync(evidenceDirectory, { recursive: true });
});

test("wide proof raises a cue then eases every property out by midpoint", async ({
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
    background: "rgba(244, 241, 233, 0.9)",
    shadow: "none",
    transform: "none"
  });
  await expect.poll(() => stageCard.evaluate((element) =>
    getComputedStyle(element).boxShadow
  )).toBe("none");
  const stageBackground = await stage.evaluate((element) =>
    getComputedStyle(element).backgroundColor
  );

  const geometry = await handoffGeometry(page);
  const layoutWidth = await demandCue.evaluate(
    (element) => (element as HTMLElement).offsetWidth
  );
  const entryCenter = await demandCue.evaluate((element) =>
    window.innerHeight + (element as HTMLElement).offsetHeight / 2
  );
  await placeCueCenterAt(page, demandCue, entryCenter);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    /below|approach/
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.99);
  await expect.poll(() => cueElevation(demandCue)).toBeLessThan(0.001);
  await expect.poll(() => cueOpacity(followingCue)).toBeGreaterThan(0.99);
  const belowTransform = await cueTransform(demandCue);

  const approachCenter = (entryCenter + geometry.stageBottom) / 2;
  await placeCueCenterAt(page, demandCue, approachCenter);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "approach"
  );
  await expect.poll(() => cueElevation(demandCue)).toBeGreaterThan(0.1);
  await expect.poll(() => cueElevation(demandCue)).toBeLessThan(0.9);
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.99);
  const approachPresentation = await cuePresentation(demandCue);
  expect(approachPresentation.focusOpacity).toBeGreaterThan(0.1);
  expect(approachPresentation.focusOpacity).toBeLessThan(0.9);
  await page.screenshot({
    path: `${evidenceDirectory}/wide-cue-approach.png`,
    fullPage: false
  });

  await placeCueCenterAt(page, demandCue, geometry.stageBottom);
  await expect.poll(() => cueElevation(demandCue)).toBeGreaterThan(0.99);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-stacking",
    "front"
  );
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeLessThan(0.001);
  const peak = await cuePresentation(demandCue);
  expect(peak.baseBackground).toBe(stageBackground);
  expect(peak.focusBackground).toBe("none");
  expect(peak.focusOpacity).toBeGreaterThan(0.99);
  expect(peak.focusShadow).not.toBe("none");
  expect(peak.focusShadow).toBe(approachPresentation.focusShadow);
  expect(await page.evaluate(() =>
    getComputedStyle(document.documentElement).scrollSnapType
  )).toBe("none");
  await page.screenshot({
    path: `${evidenceDirectory}/wide-cue-peak-lift.png`,
    fullPage: false
  });

  const descentCenter = (geometry.stageBottom + geometry.stageMidpoint) / 2;
  await placeCueCenterAt(page, demandCue, descentCenter);
  await expect.poll(() => cueElevation(demandCue)).toBeGreaterThan(0.45);
  await expect.poll(() => cueElevation(demandCue)).toBeLessThan(0.55);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-stacking",
    "front"
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.45);
  await expect.poll(() => cueOpacity(demandCue)).toBeLessThan(0.55);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeLessThan(0.001);
  await page.screenshot({
    path: `${evidenceDirectory}/wide-cue-fade-out.png`,
    fullPage: false
  });

  await placeCueCenterAt(page, demandCue, geometry.stageMidpoint - 2);
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "pinned"
  );
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "occluded"
  );
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-stacking",
    "behind"
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeLessThan(0.01);
  await expect.poll(() => cueElevation(demandCue)).toBeLessThan(0.001);
  await expect.poll(async () => Number(await demandCue.getAttribute(
    "data-kp-inline-sticky-handoff-progress"
  ))).toBeCloseTo(1, 1);
  expect(await cueTransform(demandCue)).toBe(belowTransform);
  expect((await cuePresentation(demandCue)).focusOpacity).toBeLessThan(0.001);
  expect(await demandCue.evaluate((element) =>
    (element as HTMLElement).offsetWidth
  ))
    .toBe(layoutWidth);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeLessThan(0.001);
  await page.screenshot({
    path: `${evidenceDirectory}/wide-cue-midpoint-crossing.png`,
    fullPage: false
  });

  await placeCueCenterAt(
    page,
    demandCue,
    geometry.stageMidpoint -
      (geometry.stageMidpoint - geometry.stageTop) * 0.65
  );
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeGreaterThan(0.001);

  await placeCueCenterAt(page, demandCue, geometry.stageTop + 20);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeGreaterThan(0.99);
  await expect.poll(() => cueOpacity(followingCue)).toBeGreaterThan(0.99);

  await placeCueCenterAt(page, demandCue, geometry.stageMidpoint);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeLessThan(0.01);
});

test("phone proof preserves one text measure through the midpoint fade", async ({
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
  const geometry = await handoffGeometry(page);
  await placeCueCenterAt(page, demandCue, geometry.stageBottom - 1);
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.99);
  await expect.poll(() => cueElevation(demandCue)).toBeGreaterThan(0.99);

  const before = await phoneProjection(page);
  const stageBackground = await stage.evaluate((element) =>
    getComputedStyle(element).backgroundColor
  );
  const peak = await cuePresentation(demandCue);
  expect(peak.baseBackground).toBe(stageBackground);
  expect(peak.focusBackground).toBe("none");
  expect(peak.focusOpacity).toBeGreaterThan(0.99);
  expect(peak.focusShadow).not.toBe("none");
  await page.screenshot({
    path: `${evidenceDirectory}/phone-cue-peak-lift.png`,
    fullPage: false
  });
  const fadeMidpoint = (geometry.stageBottom + geometry.stageMidpoint) / 2;
  await placeCueCenterAt(page, demandCue, fadeMidpoint);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "handoff"
  );
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-stacking",
    "front"
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.45);
  await expect.poll(() => cueOpacity(demandCue)).toBeLessThan(0.55);
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
    path: `${evidenceDirectory}/phone-cue-fade-out.png`,
    fullPage: false
  });

  await placeCueCenterAt(page, demandCue, geometry.stageMidpoint - 2);
  await expect.poll(() => cueOpacity(demandCue)).toBeLessThan(0.01);
  await expect.poll(() => cueElevation(demandCue)).toBeLessThan(0.001);
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

async function placeCueCenterAt(
  page: Page,
  cueElement: Locator,
  viewportY: number
): Promise<void> {
  await cueElement.evaluate((element, targetY) => {
    const bounds = element.getBoundingClientRect();
    window.scrollBy({
      top: bounds.top + bounds.height / 2 - targetY,
      behavior: "auto"
    });
  }, viewportY);
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  ));
}

async function handoffGeometry(page: Page): Promise<{
  readonly stageTop: number;
  readonly stageBottom: number;
  readonly stageMidpoint: number;
}> {
  return page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-inline-sticky-stage]"
    )!;
    const bounds = stage.getBoundingClientRect();
    return {
      stageTop: bounds.top,
      stageBottom: bounds.bottom,
      stageMidpoint: bounds.top + bounds.height / 2
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

async function cueElevation(cueElement: Locator): Promise<number> {
  return Number(await cueElement.getAttribute(
    "data-kp-inline-sticky-elevation"
  ));
}

async function cueTransform(cueElement: Locator): Promise<string> {
  return cueElement.evaluate((element) => getComputedStyle(element).transform);
}

async function cuePresentation(cueElement: Locator): Promise<{
  readonly baseBackground: string;
  readonly focusBackground: string;
  readonly focusOpacity: number;
  readonly focusShadow: string;
}> {
  return cueElement.evaluate((element) => ({
    baseBackground: getComputedStyle(element, "::before").backgroundColor,
    focusBackground: getComputedStyle(element, "::after").backgroundImage,
    focusOpacity: Number.parseFloat(
      getComputedStyle(element, "::after").opacity
    ),
    focusShadow: getComputedStyle(element, "::after").boxShadow
  }));
}
