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
  const stage = station.locator("[data-kp-inline-sticky-stage]");
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

  await alignTop(page, stage, 0);
  const geometry = await stage.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const before = getComputedStyle(element, "::before");
    const after = getComputedStyle(element, "::after");
    return {
      height: bounds.height,
      top: bounds.top,
      width: bounds.width,
      leftRail: Number.parseFloat(before.width),
      rightRail: Number.parseFloat(after.width)
    };
  });
  expect(geometry).toEqual({
    height: 240,
    top: 0,
    width: 576,
    leftRail: 1,
    rightRail: 1
  });
  await expect.poll(() => cues.first().evaluate(
    (element) => element.getBoundingClientRect().top
  )).toBeCloseTo(geometry.height, 0);
  await page.screenshot({
    path: `${evidenceDirectory}/station-ready.png`,
    fullPage: false
  });

  await alignTop(page, demandText, geometry.height);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.001);
  await expect.poll(() => paragraphOpacity(demandText)).toBeGreaterThan(0.98);

  const textHeight = await demandText.evaluate(
    (element) => element.getBoundingClientRect().height
  );
  await alignTop(page, demandText, geometry.height - textHeight);
  await expect.poll(() => paragraphOpacity(demandText)).toBeLessThan(0.05);
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0);
  await page.screenshot({
    path: `${evidenceDirectory}/station-handoff.png`,
    fullPage: false
  });

  await alignTop(page, demandText, 0);
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0.999);
  await expect.poll(() => resultText.evaluate(
    (element) => element.getBoundingClientRect().top
  )).toBeCloseTo(geometry.height, 0);
  await expect.poll(() => paragraphOpacity(resultText)).toBeGreaterThan(0.98);
  await page.screenshot({
    path: `${evidenceDirectory}/station-settled.png`,
    fullPage: false
  });

  await alignTop(page, resultText, 0);
  await page.evaluate(() => window.scrollBy(0, 60));
  await expect.poll(() => root.evaluate((element) => Number.parseFloat(
    getComputedStyle(element).getPropertyValue(
      "--kp-animation-station-exit-progress"
    )
  ))).toBeGreaterThan(0.5);
  await expect.poll(() => stage.evaluate(
    (element) => Number.parseFloat(getComputedStyle(element).opacity)
  )).toBeLessThan(0.5);
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
