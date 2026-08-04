import { mkdirSync } from "node:fs";

import { expect, test } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/?layout=inline-sticky";
const evidenceDirectory = "tmp/codex/economics-inline-sticky-poc";

test.beforeAll(() => {
  mkdirSync(evidenceDirectory, { recursive: true });
});

test("wide proof lifts one embedded graph and docks its motion prose", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(route);
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const stage = root.locator("[data-kp-inline-sticky-stage]");
  const demandAnchor = root.locator(
    '[data-kp-inline-sticky-motion-anchor="demand-shift"]'
  );
  const demandPassage = root.locator(
    '.kp-economics-tutorial__passage[data-kp-economics-tutorial-passage="follow-shift"]'
  );

  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-layout",
    "inline-sticky"
  );
  await expect(root.locator("[data-kp-economics-stage='economics-stage']"))
    .toHaveCount(1);
  await expect(demandPassage).toHaveCount(1);

  await stage.evaluate((element) => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, top - window.innerHeight * 0.04) });
  });
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "lifted"
  );
  await expect.poll(() => stage.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element, "::before").opacity)
  )).toBeGreaterThan(0.9);

  await demandAnchor.evaluate((element) => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top - window.innerHeight * 0.44 });
  });
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-active-block",
    "demand-shift"
  );
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeGreaterThan(0.05);
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeLessThan(0.95);

  const geometry = await Promise.all([
    stage.boundingBox(),
    demandPassage.boundingBox()
  ]);
  expect(geometry[0]).not.toBeNull();
  expect(geometry[1]).not.toBeNull();
  expect(Math.abs(
    geometry[1]!.y - (geometry[0]!.y + geometry[0]!.height)
  )).toBeLessThanOrEqual(2);

  await page.screenshot({
    path: `${evidenceDirectory}/wide-demand-docked.png`,
    fullPage: false
  });

  const forwardProgress = Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ));
  await demandAnchor.evaluate((element) => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top - window.innerHeight * 0.66 });
  });
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeLessThan(forwardProgress);
});

test("phone proof keeps readable text and the joined platform inside the viewport", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const demandAnchor = root.locator(
    '[data-kp-inline-sticky-motion-anchor="demand-shift"]'
  );

  await demandAnchor.evaluate((element) => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top - window.innerHeight * 0.44 });
  });
  await expect(root).toHaveAttribute("data-kp-inline-sticky-fit", "comfortable");
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "lifted"
  );

  const projection = await page.evaluate(() => {
    const stageElement = document.querySelector<HTMLElement>(
      "[data-kp-inline-sticky-stage]"
    )!;
    const passage = document.querySelector<HTMLElement>(
      '.kp-economics-tutorial__passage[data-kp-economics-tutorial-passage="follow-shift"]'
    )!;
    const stageBounds = stageElement.getBoundingClientRect();
    const passageBounds = passage.getBoundingClientRect();
    const style = getComputedStyle(passage);
    return {
      stageBottom: stageBounds.bottom,
      passageTop: passageBounds.top,
      passageBottom: passageBounds.bottom,
      fontSize: Number.parseFloat(style.fontSize),
      lineHeight: Number.parseFloat(style.lineHeight),
      horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth
    };
  });
  expect(Math.abs(projection.passageTop - projection.stageBottom))
    .toBeLessThanOrEqual(2);
  expect(projection.passageBottom).toBeLessThanOrEqual(844);
  expect(projection.fontSize).toBeGreaterThanOrEqual(17);
  expect(projection.lineHeight).toBeGreaterThanOrEqual(25);
  expect(projection.horizontalOverflow).toBeLessThanOrEqual(1);

  await page.screenshot({
    path: `${evidenceDirectory}/phone-demand-docked.png`,
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
  await expect(root).toHaveAttribute("data-kp-inline-sticky-fit", "reading");
  await expect.poll(() => stage.evaluate((element) =>
    getComputedStyle(element).position
  )).toBe("relative");
  await expect.poll(() => root.locator(
    '.kp-economics-tutorial__passage[data-kp-economics-tutorial-passage="follow-shift"]'
  ).evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)))
    .toBeGreaterThanOrEqual(34);
});
