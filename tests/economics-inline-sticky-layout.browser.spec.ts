import { mkdirSync } from "node:fs";

import { expect, test, type Locator, type Page } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/?layout=inline-sticky";
const evidenceDirectory = "tmp/codex/economics-inline-sticky-poc";

test.beforeAll(() => {
  mkdirSync(evidenceDirectory, { recursive: true });
});

test("wide proof hands an opaque cue into an unelevated sticky stage", async ({
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
    shadow: getComputedStyle(element).boxShadow,
    transform: getComputedStyle(element).transform
  }))).toEqual({ shadow: "none", transform: "none" });
  await expect.poll(() => stageCard.evaluate((element) =>
    getComputedStyle(element).boxShadow
  )).toBe("none");

  const geometry = await handoffGeometry(page);
  const layoutWidth = await demandCue.evaluate(
    (element) => (element as HTMLElement).offsetWidth
  );
  await placeCueCenterAt(page, demandCue, geometry.stageBottom + 48);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "below"
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.99);
  await expect.poll(() => cueOpacity(followingCue)).toBeGreaterThan(0.99);
  const belowTransform = await cueTransform(demandCue);

  await placeCueCenterAt(page, demandCue, geometry.stageBottom);
  await expect.poll(async () => Number(await demandCue.getAttribute(
    "data-kp-inline-sticky-emphasis"
  ))).toBeGreaterThan(0.99);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeLessThan(0.001);
  const punctuation = await cuePresentation(demandCue);
  expect(punctuation.background).toContain("0.58");
  expect(punctuation.textShadow).not.toBe("none");
  expect(await page.evaluate(() =>
    getComputedStyle(document.documentElement).scrollSnapType
  )).toBe("none");
  await page.screenshot({
    path: `${evidenceDirectory}/wide-cue-punctuation.png`,
    fullPage: false
  });

  const halfway = (geometry.stageBottom + geometry.stageMidpoint) / 2;
  await placeCueCenterAt(page, demandCue, halfway);
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "pinned"
  );
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "handoff"
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.2);
  await expect.poll(() => cueOpacity(demandCue)).toBeLessThan(0.3);
  await expect.poll(async () => Number(await demandCue.getAttribute(
    "data-kp-inline-sticky-handoff-progress"
  ))).toBeCloseTo(0.5, 1);
  expect(await cueTransform(demandCue)).not.toBe(belowTransform);
  expect((await cuePresentation(demandCue)).textShadow)
    .not.toBe(punctuation.textShadow);
  expect(await demandCue.evaluate((element) =>
    (element as HTMLElement).offsetWidth
  ))
    .toBe(layoutWidth);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeLessThan(0.001);
  await page.screenshot({
    path: `${evidenceDirectory}/wide-cue-depth-handoff.png`,
    fullPage: false
  });

  await placeCueCenterAt(page, demandCue, geometry.stageMidpoint - 2);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "occluded"
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeLessThan(0.01);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeLessThan(0.001);

  await placeCueCenterAt(
    page,
    demandCue,
    geometry.stageMidpoint -
      (geometry.stageMidpoint - geometry.stageTop) * 0.35
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

test("phone proof preserves one text measure through the depth handoff", async ({
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
  await placeCueCenterAt(page, demandCue, geometry.stageBottom);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "below"
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.99);
  await expect.poll(async () => Number(await demandCue.getAttribute(
    "data-kp-inline-sticky-emphasis"
  ))).toBeGreaterThan(0.99);

  const before = await phoneProjection(page);
  const punctuation = await cuePresentation(demandCue);
  expect(punctuation.background).toContain("0.58");
  expect(punctuation.textShadow).not.toBe("none");
  await page.screenshot({
    path: `${evidenceDirectory}/phone-cue-punctuation.png`,
    fullPage: false
  });
  const halfway = (geometry.stageBottom + geometry.stageMidpoint) / 2;
  await placeCueCenterAt(page, demandCue, halfway);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "handoff"
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.2);
  await expect.poll(() => cueOpacity(demandCue)).toBeLessThan(0.3);
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
    path: `${evidenceDirectory}/phone-cue-depth-handoff.png`,
    fullPage: false
  });
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

async function cueTransform(cueElement: Locator): Promise<string> {
  return cueElement.evaluate((element) => getComputedStyle(element).transform);
}

async function cuePresentation(cueElement: Locator): Promise<{
  readonly background: string;
  readonly textShadow: string;
}> {
  return cueElement.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    textShadow: getComputedStyle(element.querySelector("p")!).textShadow
  }));
}
