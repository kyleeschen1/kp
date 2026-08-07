import { mkdirSync } from "node:fs";

import { expect, test, type Locator, type Page } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/?layout=animation-station";
const evidenceDirectory = "tmp/codex/economics-animation-station";

test.beforeAll(() => {
  mkdirSync(evidenceDirectory, { recursive: true });
});

test("compact station hands short cues to one bounded graph", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(route);
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const station = root.locator('[data-kp-motion-passage="demand-change"]');
  const stationBody = station.locator(
    ".kp-economics-tutorial__motion-passage-body"
  );
  const stage = station.locator("[data-kp-inline-sticky-stage]");
  const graph = stage.locator(".kp-economics-tutorial__stage-card");
  const cues = station.locator("[data-kp-animation-station-cue]");
  const demandCue = passage(root, "follow-shift");
  const demandText = demandCue.locator("p");
  const resultText = passage(root, "new-equilibrium").locator("p");

  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-layout",
    "animation-station"
  );
  await expect(cues).toHaveCount(4);
  await expect(station.locator("[data-kp-tutorial-motion-block]"))
    .toHaveCount(1);
  await expect(passage(root, "equation-check"))
    .not.toHaveAttribute("data-kp-animation-station-cue", "true");
  await expect(root.locator("kp-tutorial-scrub-bar")).toHaveCount(0);

  await alignTop(page, stage, 200);
  const geometry = await stage.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const before = getComputedStyle(element, "::before");
    const after = getComputedStyle(element, "::after");
    return {
      height: bounds.height,
      top: bounds.top,
      width: bounds.width,
      leftRail: Number.parseFloat(before.width),
      rightRail: Number.parseFloat(after.width),
      leftRailColor: before.backgroundColor,
      rightRailColor: after.backgroundColor,
      background: getComputedStyle(element).backgroundColor
    };
  });
  expect(geometry).toEqual({
    height: 400,
    top: 200,
    width: 576,
    leftRail: 1,
    rightRail: 1,
    leftRailColor: "rgb(98, 103, 117)",
    rightRailColor: "rgb(98, 103, 117)",
    background: "rgba(0, 0, 0, 0)"
  });
  await expect.poll(() => station.evaluate((element) => ({
    top: getComputedStyle(element).borderTopWidth,
    bottom: getComputedStyle(element).borderBottomWidth
  }))).toEqual({ top: "0px", bottom: "0px" });
  await expect.poll(() => graph.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return [bounds.top, bounds.bottom, bounds.height];
  })).toEqual([280, 520, 240]);
  await expect.poll(() => cues.first().evaluate(
    (element) => element.getBoundingClientRect().top
  )).toBeCloseTo(600, 0);
  const cueChrome = await cues.first().evaluate((element) => {
    const style = getComputedStyle(element);
    const paragraphStyle = getComputedStyle(element.querySelector("p")!);
    return {
      borderLeft: style.borderLeftWidth,
      background: style.backgroundColor,
      paragraphBackground: paragraphStyle.backgroundColor,
      paragraphOutline: paragraphStyle.outlineStyle
    };
  });
  expect(cueChrome).toEqual({
    borderLeft: "0px",
    background: "rgba(0, 0, 0, 0)",
    paragraphBackground: "rgba(0, 0, 0, 0)",
    paragraphOutline: "none"
  });
  await expect(
    stage.locator('[data-kp-economics-screen-space-label="equilibrium-current"]')
  ).toBeHidden();
  await page.screenshot({
    path: `${evidenceDirectory}/station-ready.png`,
    fullPage: false
  });

  await alignTop(page, demandText, 660);
  await expect.poll(() => paragraphOpacity(demandText)).toBeLessThan(0.05);
  await expect(demandCue).toHaveAttribute(
    "data-kp-animation-station-cue-phase",
    "waiting"
  );

  await alignTop(page, demandText, 628);
  await expect.poll(() => paragraphOpacity(demandText)).toBeCloseTo(0.5, 1);

  await alignTop(page, demandText, 600);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.001);
  await expect.poll(() => paragraphOpacity(demandText)).toBeGreaterThan(0.98);

  await alignTop(page, demandText, 520);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.001);
  await expect.poll(() => paragraphOpacity(demandText)).toBeGreaterThan(0.98);

  await alignTop(page, demandText, 500);
  await expect.poll(() => paragraphOpacity(demandText)).toBeCloseTo(0.5, 1);
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0);
  await page.screenshot({
    path: `${evidenceDirectory}/station-handoff.png`,
    fullPage: false
  });

  await alignTop(page, demandText, 480);
  await expect.poll(() => paragraphOpacity(demandText)).toBeLessThan(0.05);

  await alignTop(page, demandText, 320);
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0.999);
  await expect.poll(() => resultText.evaluate(
    (element) => element.getBoundingClientRect().top
  )).toBeCloseTo(680, 0);
  await expect.poll(() => paragraphOpacity(resultText)).toBeLessThan(0.05);
  await page.screenshot({
    path: `${evidenceDirectory}/station-settled.png`,
    fullPage: false
  });

  await alignBottom(page, stationBody, 600);
  await page.evaluate(() => window.scrollBy(0, 80));
  await expect.poll(() => root.evaluate((element) => Number.parseFloat(
    getComputedStyle(element).getPropertyValue(
      "--kp-animation-station-exit-progress"
    )
  ))).toBeGreaterThan(0.5);
  await expect.poll(() => graph.evaluate(
    (element) => Number.parseFloat(getComputedStyle(element).opacity)
  )).toBeLessThan(0.5);
  await page.screenshot({
    path: `${evidenceDirectory}/station-exit.png`,
    fullPage: false
  });
});

function passage(root: Locator, id: string): Locator {
  return root.locator(`[data-kp-economics-tutorial-passage="${id}"]`);
}

async function demandProgress(root: Locator): Promise<number> {
  return Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ));
}

async function paragraphOpacity(paragraph: Locator): Promise<number> {
  return paragraph.evaluate(
    (element) => Number.parseFloat(getComputedStyle(element).opacity)
  );
}

async function alignTop(
  page: Page,
  locator: Locator,
  desiredTop: number
): Promise<void> {
  const currentTop = await locator.evaluate(
    (element) => element.getBoundingClientRect().top
  );
  await page.evaluate(
    ({ delta }) => window.scrollBy(0, delta),
    { delta: currentTop - desiredTop }
  );
  await expect.poll(() => locator.evaluate(
    (element) => element.getBoundingClientRect().top
  )).toBeCloseTo(desiredTop, 0);
}

async function alignBottom(
  page: Page,
  locator: Locator,
  desiredBottom: number
): Promise<void> {
  const currentBottom = await locator.evaluate(
    (element) => element.getBoundingClientRect().bottom
  );
  await page.evaluate(
    ({ delta }) => window.scrollBy(0, delta),
    { delta: currentBottom - desiredBottom }
  );
  await expect.poll(() => locator.evaluate(
    (element) => element.getBoundingClientRect().bottom
  )).toBeCloseTo(desiredBottom, 0);
}
