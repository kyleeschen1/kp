import { mkdirSync } from "node:fs";

import { expect, test, type Locator, type Page } from "@playwright/test";
import { renderKpTutorialProgressRail } from
  "../src/tutorial/kp-tutorial-progress-rail-renderer.ts";

const route = "/tutorials/economics/demand-shift/?layout=animation-station";
const evidenceDirectory = "tmp/codex/economics-animation-station";

test.beforeAll(() => {
  mkdirSync(evidenceDirectory, { recursive: true });
});

test.skip("superseded single-motion station timing remains available during exemplar review", async ({
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
  const progressRail = station.locator("kp-tutorial-progress-rail");
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
  await expect(progressRail).toHaveCount(1);
  await expect(progressRail).toHaveAttribute("role", "progressbar");
  await expect(progressRail).toHaveAttribute(
    "data-kp-tutorial-progress-enhancement",
    "ready"
  );
  await expect(progressRail).toHaveAttribute("aria-valuenow", "0");
  await expect(progressRail.locator("button, input, a, [tabindex]"))
    .toHaveCount(0);
  const progressGeometry = await progressRail.boundingBox();
  expect(progressGeometry?.height).toBe(24);
  await progressRail.evaluate((element) => {
    element.setAttribute("progress", "0.5");
    element.setAttribute("progress-label", "Equilibrium handoff");
  });
  await expect(progressRail).toHaveAttribute("aria-valuenow", "50");
  await expect(progressRail).toHaveAttribute(
    "aria-valuetext",
    "Equilibrium handoff"
  );
  expect((await progressRail.boundingBox())?.height).toBe(progressGeometry?.height);
  await progressRail.evaluate((element) => {
    element.setAttribute("progress", "0");
    element.setAttribute("progress-label", "Before the shift");
  });

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
  await expect(demandCue).toHaveAttribute(
    "data-kp-animation-station-phase",
    "scrub"
  );
  await expect(demandCue).toHaveAttribute(
    "data-kp-animation-station-ownership",
    "motion-block"
  );

  await alignTop(page, demandText, 320);
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0);

  await alignTop(page, demandText, 170);
  await expect.poll(() => demandProgress(root)).toBeCloseTo(0.72, 2);
  await expect(progressRail).toHaveAttribute("aria-valuenow", "72");
  await page.screenshot({
    path: `${evidenceDirectory}/station-motion-midpoint.png`,
    fullPage: false
  });
  await alignTop(page, demandText, 14);
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0.999);
  await expect(demandCue).toHaveAttribute(
    "data-kp-animation-station-phase",
    "settle"
  );
  await expect(progressRail).toHaveAttribute("aria-valuenow", "100");
  await alignTop(page, demandText, -66);
  await expect(demandCue).toHaveAttribute(
    "data-kp-animation-station-phase",
    "handoff"
  );
  await alignTop(page, demandText, 170);
  await expect.poll(() => demandProgress(root)).toBeCloseTo(0.72, 2);
  await expect(progressRail).toHaveAttribute("aria-valuenow", "72");
  await alignTop(page, demandText, 334);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.001);
  await expect(progressRail).toHaveAttribute("aria-valuenow", "0");
  await alignTop(page, demandText, 14);
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
  await expect.poll(() => paragraphOpacity(releaseText)).toBeGreaterThan(0.98);
  await expect(releasePassage).not.toHaveAttribute(
    "data-kp-animation-station-cue"
  );
  await expect(root).toHaveAttribute(
    "data-kp-animation-station-exit-phase",
    "stationed"
  );
  await expect.poll(() => stationExit(root, "rail")).toBeLessThan(0.001);
  await expect.poll(() => stationExit(root, "graph")).toBeLessThan(0.001);

  await alignTop(page, releaseText, 652);
  await expect.poll(() => stationExit(root, "rail")).toBeCloseTo(0.5, 1);
  await expect.poll(() => stationExit(root, "graph")).toBeLessThan(0.001);
  await expect(root).toHaveAttribute(
    "data-kp-animation-station-exit-phase",
    "releasing-rails"
  );

  await alignTop(page, releaseText, 540);
  await expect.poll(() => stationExit(root, "rail")).toBeGreaterThan(0.999);
  await expect.poll(() => stationExit(root, "graph")).toBeCloseTo(0.5, 1);
  await expect(root).toHaveAttribute(
    "data-kp-animation-station-exit-phase",
    "withdrawing-stage"
  );
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
  await expect(root).toHaveAttribute(
    "data-kp-animation-station-exit-phase",
    "released"
  );
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

test("a transition packet simulates discrete scroll lock", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(route);
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const station = root.locator('[data-kp-motion-passage="demand-change"]');
  const stage = station.locator("[data-kp-inline-sticky-stage]");
  const graph = stage.locator(".kp-economics-tutorial__stage-card");
  const demandCue = passage(station, "follow-shift");
  const demandText = demandCue.locator("p");
  const demandTransition = demandCue.locator(
    '[data-kp-animation-station-transition="demand-shift"]'
  );
  const demandPacket = demandCue.locator(
    '[data-kp-animation-station-packet="demand-shift"]'
  );
  const demandCaption = demandCue.locator(
    '[data-kp-animation-station-caption="follow-shift"]'
  );
  const demandRail = demandCue.locator("kp-tutorial-progress-rail");
  const reading = passage(station, "new-equilibrium");
  const readingText = reading.locator("p");
  const supplyCue = passage(station, "shift-versus-movement");
  const supplyTransition = supplyCue.locator(
    '[data-kp-animation-station-transition="supply-movement"]'
  );
  const supplyRail = supplyCue.locator("kp-tutorial-progress-rail");

  await expect(station.locator("[data-kp-animation-station-cue]"))
    .toHaveCount(6);
  await expect(station.locator("[data-kp-tutorial-motion-block]"))
    .toHaveCount(2);
  await expect(station.locator("[data-kp-animation-station-reading]"))
    .toHaveCount(0);
  await expect(station.locator("[data-kp-animation-station-transition]"))
    .toHaveCount(2);
  await expect(station.locator("[data-kp-animation-station-packet]"))
    .toHaveCount(2);
  await expect(station.locator("kp-tutorial-progress-rail")).toHaveCount(2);
  await expect(station.locator("[data-kp-inline-sticky-stage]")).toHaveCount(1);
  await expect(station.locator(".editor-graph-stage")).toHaveCount(1);
  for (const paragraph of await station.locator(
    "[data-kp-animation-station-cue] p"
  ).all()) {
    await expect(paragraph).toHaveCSS("opacity", "1");
    await expect(paragraph).toHaveCSS("transform", "none");
  }
  await expect(graph).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await page.screenshot({
    path: `${evidenceDirectory}/station-stacked-prose.png`,
    fullPage: false
  });

  await alignTop(page, demandTransition, 400);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.001);
  await expect(demandPacket).toHaveCSS("position", "relative");
  await expect(demandPacket.locator(":scope > kp-tutorial-progress-rail"))
    .toHaveCount(1);
  await expect(demandPacket.locator(":scope > [data-kp-animation-station-caption]"))
    .toHaveCount(1);
  await expect.poll(() => demandRail.evaluate(
    (element) => element.getBoundingClientRect().top
  )).toBeCloseTo(400, 0);
  const lockedPacketTop = await demandPacket.evaluate(
    (element) => element.getBoundingClientRect().top
  );
  const lockedCaptionTop = await demandCaption.evaluate(
    (element) => element.getBoundingClientRect().top
  );
  await page.screenshot({
    path: `${evidenceDirectory}/station-transition-start.png`,
    fullPage: false
  });

  const scrollAtStart = await page.evaluate(() => window.scrollY);
  await alignTop(page, demandTransition, 288);
  const scrollAtMidpoint = await page.evaluate(() => window.scrollY);
  expect(scrollAtMidpoint).toBeGreaterThan(scrollAtStart + 100);
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0.1);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.99);
  await expect.poll(() => demandRail.evaluate(
    (element) => element.getBoundingClientRect().top
  )).toBeCloseTo(400, 0);
  await expect.poll(() => demandPacket.evaluate(
    (element) => element.getBoundingClientRect().top
  )).toBeCloseTo(lockedPacketTop, 0);
  await expect.poll(() => demandCaption.evaluate(
    (element) => element.getBoundingClientRect().top
  )).toBeCloseTo(lockedCaptionTop, 0);
  await expect(demandRail).toHaveAttribute("aria-valuenow", "50");
  await expect(demandText).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: `${evidenceDirectory}/station-transition-midpoint.png`,
    fullPage: false
  });

  await alignTop(page, demandTransition, 176);
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0.99);
  await expect(demandRail).toHaveAttribute("aria-valuenow", "100");
  await expect.poll(() => demandPacket.evaluate(
    (element) => element.getBoundingClientRect().top
  )).toBeCloseTo(lockedPacketTop, 0);
  await expect.poll(() => demandCaption.evaluate(
    (element) => element.getBoundingClientRect().top
  )).toBeCloseTo(lockedCaptionTop, 0);
  await page.screenshot({
    path: `${evidenceDirectory}/station-transition-settled.png`,
    fullPage: false
  });

  await alignTop(page, readingText, 520);
  await expect(readingText).toHaveCSS("opacity", "1");
  await expect(readingText).toHaveCSS("transform", "none");
  await expect.poll(() => demandPacket.evaluate(
    (element) => element.getBoundingClientRect().top
  )).toBeLessThan(lockedPacketTop - 10);
  await expect(root).not.toHaveAttribute("data-kp-animation-station-lifecycle");

  await alignTop(page, supplyTransition, 400);
  await expect.poll(() => supplyProgress(root)).toBeLessThan(0.005);
  await alignTop(page, supplyTransition, 288);
  await expect.poll(() => supplyProgress(root)).toBeGreaterThan(0.1);
  await expect.poll(() => supplyRail.evaluate(
    (element) => element.getBoundingClientRect().top
  )).toBeCloseTo(400, 0);

  await alignTop(page, demandTransition, 288);
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0.1);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.99);
  await page.screenshot({
    path: `${evidenceDirectory}/station-transition-reverse.png`,
    fullPage: false
  });
  await alignTop(page, demandTransition, 400);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.001);
  await expect(station.locator("[data-kp-inline-sticky-stage]")).toHaveCount(1);
});

test("phone and large text fall back to ordinary document flow", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const station = root.locator('[data-kp-motion-passage="demand-change"]');
  const stage = station.locator("[data-kp-inline-sticky-stage]");
  const cues = station.locator("[data-kp-animation-station-cue]");
  const release = passage(root, "equation-check").locator("p").first();

  await expect(root).toHaveAttribute("data-kp-inline-sticky-fit", "reading");
  await expect(stage).toHaveCSS("position", "relative");
  await expect.poll(() => stage.evaluate((element) =>
    getComputedStyle(element, "::before").content
  )).toBe("none");
  for (let index = 0; index < 6; index += 1) {
    await expect.poll(() => cues.nth(index).evaluate((element) =>
      element.getBoundingClientRect().height
    )).toBeLessThan(240);
    await expect.poll(() => paragraphOpacity(cues.nth(index).locator("p")))
      .toBeGreaterThan(0.98);
  }
  await page.screenshot({
    path: `${evidenceDirectory}/station-phone-reading.png`,
    fullPage: false
  });
  await page.addStyleTag({ content: "html { font-size: 175%; }" });
  await expect.poll(() => release.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize)
  )).toBeGreaterThan(27);
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth - window.innerWidth
  )).toBeLessThanOrEqual(1);
});

test("reduced motion settles as readable flow without sticky rails", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${route}#kp-checkpoint-shift-settled`);
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const station = root.locator('[data-kp-motion-passage="demand-change"]');
  const stage = station.locator("[data-kp-inline-sticky-stage]");
  const rail = station.locator("kp-tutorial-progress-rail");

  await expect(root).toHaveAttribute("data-kp-inline-sticky-fit", "reading");
  await expect(stage).toHaveCSS("position", "relative");
  await expect.poll(() => stage.evaluate((element) =>
    getComputedStyle(element, "::before").content
  )).toBe("none");
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0.999);
  await expect(rail.first()).toHaveAttribute("aria-valuenow", "100");
  await page.screenshot({
    path: `${evidenceDirectory}/station-reduced-motion.png`,
    fullPage: false
  });
});

test("light theme preserves opaque stage and readable seams", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(
    "/tutorials/economics/demand-shift/?layout=animation-station&theme=light"
  );
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const station = root.locator('[data-kp-motion-passage="demand-change"]');
  const graph = station.locator(".kp-economics-tutorial__stage-card");
  const transition = station.locator(
    '[data-kp-animation-station-transition="demand-shift"]'
  );
  const rail = transition.locator("kp-tutorial-progress-rail");
  await alignTop(page, transition, 288);
  await expect(graph).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect.poll(() => rail.evaluate(
    (element) => element.getBoundingClientRect().top
  )).toBeCloseTo(400, 0);
  await expect(passage(root, "new-equilibrium").locator("p"))
    .toHaveCSS("opacity", "1");
  await page.screenshot({
    path: `${evidenceDirectory}/station-seam-light.png`,
    fullPage: false
  });
});

test("station checkpoint URLs restore the shared playhead directly", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${route}#kp-checkpoint-shift-handoff`);
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const rail = root.locator(
    '[data-kp-tutorial-progress-rail="demand-shift"]'
  );
  const packet = root.locator(
    '[data-kp-animation-station-packet="demand-shift"]'
  );
  await expect.poll(() => demandProgress(root)).toBeCloseTo(0.72, 2);
  await expect(rail).toHaveAttribute("aria-valuenow", "57");
  await expect.poll(() => packet.evaluate(
    (element) => element.getBoundingClientRect().top
  )).toBeCloseTo(400, 0);
  const cue = passage(
    root.locator('[data-kp-motion-passage="demand-change"]'),
    "follow-shift"
  );
  await expect(cue).toHaveAttribute(
    "data-kp-animation-station-phase",
    "scrub"
  );
});

test("published motion progress survives without JavaScript", async ({
  browser
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 820, height: 700 }
  });
  const page = await context.newPage();
  try {
    const html = renderKpTutorialProgressRail({
      blockId: "demand-shift",
      label: "Demand shift animation progress",
      initialLabel: "Before the shift"
    });
    await page.setContent(`<!doctype html>
      <html>
        <head>
          <link rel="stylesheet" href="http://127.0.0.1:4173/src/tutorial/kp-tutorial-progress-rail.css">
          <style>main { width: 640px; }</style>
        </head>
        <body><main>${html}</main></body>
      </html>`);
    const rail = page.locator("kp-tutorial-progress-rail");
    await expect(rail).toHaveAttribute(
      "data-kp-tutorial-progress-enhancement",
      "pending"
    );
    await expect(rail).toHaveAttribute("role", "progressbar");
    await expect(rail).toHaveAttribute("aria-valuenow", "0");
    await expect(rail.locator("button, input, a, [tabindex]")).toHaveCount(0);
    expect((await rail.boundingBox())?.height).toBe(24);
  } finally {
    await context.close();
  }
});

test("progress rail upgrades existing geometry without a layout shift", async ({
  page
}) => {
  await page.goto(route);
  const html = renderKpTutorialProgressRail({
    blockId: "fixture",
    label: "Fixture animation progress",
    initialLabel: "Ready"
  });
  await page.locator("body").evaluate((body, staticHtml) => {
    const frame = document.createElement("iframe");
    frame.dataset["kpProgressFixture"] = "true";
    frame.srcdoc = `<link rel="stylesheet" href="/src/tutorial/kp-tutorial-progress-rail.css"><main style="width:640px">${staticHtml}</main>`;
    body.append(frame);
  }, html);
  const fixture = page.locator('iframe[data-kp-progress-fixture="true"]');
  await expect(fixture).toBeAttached();
  const frame = page.frames().find((candidate) =>
    candidate !== page.mainFrame() && candidate.url() === "about:srcdoc"
  )!;
  await frame.waitForFunction(() => document.styleSheets.length > 0);
  const before = await frame.evaluate(() => {
    const host = document.querySelector("kp-tutorial-progress-rail")!;
    const track = host.querySelector("[data-kp-tutorial-progress-track]")!;
    const bounds = host.getBoundingClientRect();
    (window as unknown as { kpProgressTrack: Element }).kpProgressTrack = track;
    return { width: bounds.width, height: bounds.height };
  });
  const after = await frame.evaluate(async () => {
    const moduleUrl = "/src/tutorial/kp-tutorial-progress-rail.ts";
    const module = await import(/* @vite-ignore */ moduleUrl);
    module.defineKpTutorialProgressRail();
    await customElements.whenDefined("kp-tutorial-progress-rail");
    const host = document.querySelector("kp-tutorial-progress-rail")!;
    const bounds = host.getBoundingClientRect();
    const stored = (window as unknown as {
      kpProgressTrack: Element;
    }).kpProgressTrack;
    return {
      width: bounds.width,
      height: bounds.height,
      sameTrack: stored === host.querySelector(
        "[data-kp-tutorial-progress-track]"
      ),
      enhancement: host.getAttribute(
        "data-kp-tutorial-progress-enhancement"
      )
    };
  });
  expect(after).toEqual({
    ...before,
    sameTrack: true,
    enhancement: "ready"
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

async function supplyProgress(root: Locator): Promise<number> {
  return Number(await root.getAttribute(
    "data-kp-economics-tutorial-supply-movement-progress"
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
  )).toBeGreaterThanOrEqual(desiredTop - 0.75);
  await expect.poll(() => locator.evaluate(
    (element) => element.getBoundingClientRect().top
  )).toBeLessThanOrEqual(desiredTop + 0.75);
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
