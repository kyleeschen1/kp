import { mkdirSync } from "node:fs";

import { expect, test, type Locator, type Page } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/?layout=inline-sticky";
const evidenceDirectory = "tmp/codex/economics-inline-sticky-poc";

test.beforeAll(() => {
  mkdirSync(evidenceDirectory, { recursive: true });
});

test("wide proof pins an unelevated stage and projects one cue envelope", async ({
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

  const geometry = await attentionGeometry(page);
  const widthBefore = (await demandCue.boundingBox())!.width;
  await placeCueAt(page, demandCue, geometry.focusLine + geometry.approach * 0.7);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "approaching"
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.18);
  await expect.poll(() => cueOpacity(demandCue)).toBeLessThan(1);

  await placeCueAt(page, demandCue, geometry.focusLine);
  await expect.poll(async () => (await demandCue.boundingBox())!.y)
    .toBeCloseTo(geometry.focusLine, 0);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "reading"
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.99);
  const widthAtFocus = (await demandCue.boundingBox())!.width;
  expect(Math.abs(widthAtFocus - widthBefore)).toBeLessThanOrEqual(0.5);
  await page.screenshot({
    path: `${evidenceDirectory}/wide-cue-reading-shelf.png`,
    fullPage: false
  });

  await placeCueAt(
    page,
    demandCue,
    geometry.stageBottom + geometry.padding * 0.45
  );
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "pinned"
  );
  await expect.poll(async () => (await demandCue.boundingBox())!.y)
    .toBeCloseTo(geometry.stageBottom + geometry.padding * 0.45, 0);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "receding"
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeGreaterThan(0.05);
  await expect.poll(() => cueOpacity(demandCue)).toBeLessThan(0.95);
  const widthWhileReceding = (await demandCue.boundingBox())!.width;
  expect(Math.abs(widthWhileReceding - widthAtFocus)).toBeLessThanOrEqual(0.5);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeGreaterThan(0.001);
  await page.screenshot({
    path: `${evidenceDirectory}/wide-cue-receding.png`,
    fullPage: false
  });

  await placeCueAt(page, demandCue, geometry.stageBottom - 2);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "occluded"
  );
  await expect.poll(() => cueOpacity(demandCue)).toBeLessThan(0.01);

  await placeCueAt(page, demandCue, 800 * 0.16 - 2);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeGreaterThan(0.99);
  await expect(followingCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "waiting"
  );

  await placeCueAt(page, demandCue, geometry.stageBottom);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeLessThan(0.99);
  await placeCueAt(page, demandCue, geometry.focusLine);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeLessThan(0.01);
});

test("phone proof preserves one text measure and a readable focus shelf", async ({
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
  const geometry = await attentionGeometry(page);
  await placeCueAt(page, demandCue, geometry.focusLine);
  await expect(demandCue).toHaveAttribute(
    "data-kp-inline-sticky-cue-phase",
    "reading"
  );

  const projection = await page.evaluate(() => {
    const stageElement = document.querySelector<HTMLElement>(
      "[data-kp-inline-sticky-stage]"
    )!;
    const demand = document.querySelector<HTMLElement>(
      '[data-kp-inline-sticky-cue][data-kp-economics-tutorial-passage="follow-shift"]'
    )!;
    const hold = document.querySelector<HTMLElement>(
      '[data-kp-inline-sticky-cue][data-kp-economics-tutorial-passage="new-equilibrium"]'
    )!;
    const demandBounds = demand.getBoundingClientRect();
    const demandStyle = getComputedStyle(demand);
    return {
      stageBottom: stageElement.getBoundingClientRect().bottom,
      demandBottom: demandBounds.bottom,
      demandWidth: demandBounds.width,
      holdWidth: hold.getBoundingClientRect().width,
      fontSize: Number.parseFloat(demandStyle.fontSize),
      lineHeight: Number.parseFloat(demandStyle.lineHeight),
      opacity: Number.parseFloat(demandStyle.opacity),
      horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth
    };
  });
  expect(projection.stageBottom).toBeLessThan(844 * 0.55);
  expect(projection.demandBottom).toBeLessThanOrEqual(844);
  expect(Math.abs(projection.demandWidth - projection.holdWidth))
    .toBeLessThanOrEqual(0.5);
  expect(projection.fontSize).toBeGreaterThanOrEqual(17);
  expect(projection.lineHeight).toBeGreaterThanOrEqual(25);
  expect(projection.opacity).toBeGreaterThan(0.99);
  expect(projection.horizontalOverflow).toBeLessThanOrEqual(1);

  await page.screenshot({
    path: `${evidenceDirectory}/phone-cue-reading-shelf.png`,
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
  ]) await expect.poll(() => cueOpacity(cue(root, passageId))).toBe(1);
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

async function placeCueAt(
  page: Page,
  cueElement: Locator,
  viewportY: number
): Promise<void> {
  await cueElement.evaluate((element, targetY) => {
    window.scrollBy({
      top: element.getBoundingClientRect().top - targetY,
      behavior: "auto"
    });
  }, viewportY);
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  ));
}

async function attentionGeometry(page: Page): Promise<{
  readonly stageBottom: number;
  readonly padding: number;
  readonly approach: number;
  readonly focusLine: number;
}> {
  return page.evaluate(() => {
    const root = document.querySelector<HTMLElement>(
      "[data-kp-economics-demand-shift-tutorial]"
    )!;
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-inline-sticky-stage]"
    )!;
    const style = getComputedStyle(root);
    const stageBottom = stage.getBoundingClientRect().bottom;
    const padding = Number.parseFloat(
      style.getPropertyValue("--kp-inline-sticky-padding-height")
    );
    const approach = Number.parseFloat(
      style.getPropertyValue("--kp-inline-sticky-approach-height")
    );
    return { stageBottom, padding, approach, focusLine: stageBottom + padding };
  });
}

async function cueOpacity(cueElement: Locator): Promise<number> {
  return cueElement.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).opacity)
  );
}
