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
  const shortOrdinaryCue = passage(station, "graph-at-rest");
  const longOrdinaryCue = passage(station, "initial-equilibrium");
  const demandCue = passage(root, "follow-shift");
  const demandText = demandCue.locator("p");
  const resultText = passage(root, "new-equilibrium").locator("p");
  const releasePassage = passage(root, "equation-check");
  const releaseText = releasePassage.locator("p").first();

  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-layout",
    "animation-station"
  );
  await expect(cues).toHaveCount(4);
  await expect(station.locator("[data-kp-tutorial-motion-block]"))
    .toHaveCount(1);
  await expect(releasePassage)
    .not.toHaveAttribute("data-kp-animation-station-cue", "true");
  await expect(releasePassage).toHaveAttribute(
    "data-kp-animation-station-release-cue",
    "true"
  );
  await expect(root.locator("kp-tutorial-scrub-bar")).toHaveCount(0);

  await expect(root).toHaveAttribute(
    "data-kp-animation-station-entrance-phase",
    "approaching"
  );
  await expect.poll(() => stage.evaluate((element) => Number.parseFloat(
    getComputedStyle(element, "::before").opacity
  ))).toBeLessThan(0.001);

  await alignTop(page, stage, 120);
  await expect(root).toHaveAttribute(
    "data-kp-animation-station-entrance-phase",
    "latched"
  );
  await expect.poll(() => stage.evaluate((element) => Number.parseFloat(
    getComputedStyle(element, "::before").opacity
  ))).toBeGreaterThan(0.999);
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
    height: 560,
    top: 120,
    width: 672,
    leftRail: 2,
    rightRail: 2,
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
  })).toEqual([136, 400, 264]);
  await expect.poll(() => cues.first().evaluate(
    (element) => element.getBoundingClientRect().top
  )).toBeCloseTo(680, 0);
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
  await expect.poll(() => stationBody.evaluate((element) =>
    getComputedStyle(element, "::after").content
  )).toBe("none");
  await expect.poll(() => graph.evaluate((element) =>
    getComputedStyle(element).filter
  )).toContain("brightness(1.14)");
  await expect(
    stage.locator('[data-kp-economics-screen-space-label="equilibrium-current"]')
  ).toBeHidden();
  await page.screenshot({
    path: `${evidenceDirectory}/station-ready.png`,
    fullPage: false
  });

  await alignTop(page, shortOrdinaryCue.locator("p"), 400);
  await expect(shortOrdinaryCue).toHaveAttribute(
    "data-kp-animation-station-phase",
    "ready"
  );
  await expect(shortOrdinaryCue).toHaveAttribute(
    "data-kp-animation-station-ownership",
    "active-passage"
  );
  await alignTop(page, shortOrdinaryCue.locator("p"), 320);
  await expect(shortOrdinaryCue).toHaveAttribute(
    "data-kp-animation-station-phase",
    "handoff"
  );
  await alignTop(page, shortOrdinaryCue.locator("p"), 400);
  await expect(shortOrdinaryCue).toHaveAttribute(
    "data-kp-animation-station-phase",
    "ready"
  );

  await alignTop(page, longOrdinaryCue.locator("p"), 400);
  await expect(longOrdinaryCue).toHaveAttribute(
    "data-kp-animation-station-phase",
    "ready"
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await alignTop(page, longOrdinaryCue.locator("p"), 450);
  await expect(longOrdinaryCue).toHaveAttribute(
    "data-kp-animation-station-phase",
    "ready"
  );
  await page.setViewportSize({ width: 1280, height: 800 });

  await alignBottom(page, demandText, 805);
  await expect.poll(() => paragraphOpacity(demandText)).toBeLessThan(0.05);
  await expect(demandCue).toHaveAttribute(
    "data-kp-animation-station-cue-phase",
    "waiting"
  );

  await alignBottom(page, demandText, 620);
  await expect.poll(() => paragraphOpacity(demandText)).toBeCloseTo(0.5, 1);

  await alignBottom(page, demandText, 560);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.001);
  await expect.poll(() => paragraphOpacity(demandText)).toBeGreaterThan(0.98);
  await expect.poll(() => demandCue.evaluate((element) => Number.parseFloat(
    getComputedStyle(element).getPropertyValue(
      "--kp-animation-station-cue-scale"
    )
  ))).toBeGreaterThan(0.999);
  await page.screenshot({
    path: `${evidenceDirectory}/station-cue-focused.png`,
    fullPage: false
  });

  await alignTop(page, demandText, 440);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.001);
  await expect.poll(() => paragraphOpacity(demandText)).toBeGreaterThan(0.98);
  await expect.poll(() => passageInkTop(demandText)).toBeCloseTo(440, 0);

  await alignTop(page, demandText, 400);
  await expect.poll(() => paragraphOpacity(demandText)).toBeGreaterThan(0.98);
  await expect.poll(() => passageInkTop(demandText)).toBeCloseTo(440, 0);

  await alignTop(page, demandText, 360);
  await expect.poll(() => paragraphOpacity(demandText)).toBeGreaterThan(0.98);
  await expect.poll(() => passageInkTop(demandText)).toBeCloseTo(440, 0);

  await alignTop(page, demandText, 347);
  await expect.poll(() => paragraphOpacity(demandText)).toBeCloseTo(0.5, 1);
  await expect.poll(() => passageInkTop(demandText)).toBeCloseTo(440, 0);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.001);
  await page.screenshot({
    path: `${evidenceDirectory}/station-handoff.png`,
    fullPage: false
  });

  await alignTop(page, demandText, 334);
  await expect.poll(() => paragraphOpacity(demandText)).toBeLessThan(0.05);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.001);

  await alignTop(page, demandText, 320);
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0);

  await alignTop(page, demandText, 136);
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0.999);
  await alignBottom(page, resultText, 620);
  await expect.poll(() => paragraphOpacity(resultText)).toBeCloseTo(0.5, 1);
  await expect.poll(() => stationExit(root, "rail")).toBeLessThan(0.001);
  await expect.poll(() => stationExit(root, "graph")).toBeLessThan(0.001);
  await page.screenshot({
    path: `${evidenceDirectory}/station-settled.png`,
    fullPage: false
  });

  await alignTop(page, resultText, 347);
  await expect.poll(() => paragraphOpacity(resultText)).toBeCloseTo(0.5, 1);
  await expect.poll(() => stationExit(root, "rail")).toBeLessThan(0.001);
  await expect.poll(() => stationExit(root, "graph")).toBeLessThan(0.001);

  await alignTop(page, releaseText, 680);
  await expect.poll(() => stationExit(root, "rail")).toBeLessThan(0.001);
  await expect.poll(() => stationExit(root, "graph")).toBeLessThan(0.001);

  await alignTop(page, releaseText, 652);
  await expect.poll(() => stationExit(root, "rail")).toBeCloseTo(0.5, 1);
  await expect.poll(() => stationExit(root, "graph")).toBeLessThan(0.001);

  await alignTop(page, releaseText, 540);
  await expect.poll(() => stationExit(root, "rail")).toBeGreaterThan(0.999);
  await expect.poll(() => stationExit(root, "graph")).toBeCloseTo(0.5, 1);
  const stagger = await root.evaluate((element) => {
    const style = getComputedStyle(element);
    const value = (role: string) => Number.parseFloat(
      style.getPropertyValue(`--kp-animation-station-${role}-presence`)
    );
    return ["grid", "guide", "axis", "supply", "demand", "point", "label"]
      .map(value);
  });
  for (let index = 1; index < stagger.length; index += 1) {
    expect(stagger[index]!).toBeGreaterThan(stagger[index - 1]!);
  }
  await expect.poll(() => paragraphOpacity(releaseText)).toBeGreaterThan(0.98);
  await page.screenshot({
    path: `${evidenceDirectory}/station-exit.png`,
    fullPage: false
  });

  await alignTop(page, releaseText, 480);
  await expect.poll(() => stationExit(root, "graph")).toBeGreaterThan(0.999);
  await expect.poll(() => root.evaluate((element) => Number.parseFloat(
    getComputedStyle(element).getPropertyValue(
      "--kp-animation-station-label-presence"
    )
  ))).toBeLessThan(0.001);

  await alignTop(page, releaseText, 680);
  await expect.poll(() => stationExit(root, "rail")).toBeLessThan(0.001);
  await expect.poll(() => stationExit(root, "graph")).toBeLessThan(0.001);
  await expect.poll(() => root.evaluate((element) => Number.parseFloat(
    getComputedStyle(element).getPropertyValue(
      "--kp-animation-station-supply-presence"
    )
  ))).toBeGreaterThan(0.999);
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

async function passageInkTop(paragraph: Locator): Promise<number> {
  return paragraph.locator(".kp-economics-tutorial__passage-ink").evaluate(
    (element) => element.getBoundingClientRect().top
  );
}

async function stationExit(
  root: Locator,
  role: "rail" | "graph"
): Promise<number> {
  return root.evaluate((element, exitRole) => Number.parseFloat(
    getComputedStyle(element).getPropertyValue(
      `--kp-animation-station-${exitRole}-exit`
    )
  ), role);
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
