import { mkdirSync } from "node:fs";

import { expect, test, type Locator, type Page } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/?layout=two-column-scroll";
const evidenceDirectory = "tmp/codex/economics-two-column-scroll";

test.beforeAll(() => {
  mkdirSync(evidenceDirectory, { recursive: true });
});

test("desktop cards hand off natural-distance state beside a narrow graph", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const body = root.locator(".kp-economics-tutorial__motion-passage-body");
  const stage = root.locator("[data-kp-inline-sticky-stage]");
  const cards = root.locator("[data-kp-two-column-scroll-card]");
  const initialCard = card(root, "graph-at-rest");
  const demandCard = card(root, "follow-shift");
  const demandParagraph = demandCard.locator("p");
  const reflection = card(root, "equation-check");

  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-layout",
    "two-column-scroll"
  );
  await expect(cards).toHaveCount(4);
  await expect(root.locator("kp-tutorial-scrub-bar")).toHaveCount(0);
  await expect(initialCard.locator("p")).toContainText(
    "Begin with the graph at rest."
  );
  await expect(demandParagraph).toContainText(
    "Now suppose strawberries become more desirable"
  );
  await expect(reflection).not.toHaveAttribute(
    "data-kp-two-column-scroll-card",
    "true"
  );

  await expect.poll(() => body.evaluate((element) =>
    getComputedStyle(element).display
  )).toBe("grid");
  const cardHeights = await cards.evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().height)
  );
  expect(cardHeights.slice(0, 3).every((height) => height < 400)).toBe(true);
  expect(cardHeights[3]).toBeLessThan(800);

  await placeTopAt(page, initialCard, 0);
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "pinned"
  );
  await expect.poll(() => stage.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { top: Math.round(bounds.top), height: Math.round(bounds.height) };
  })).toEqual({ top: 128, height: 544 });
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.01);
  await expect(initialCard).toHaveAttribute(
    "data-kp-two-column-card-opacity",
    "1.0000"
  );
  await expect(demandCard).toHaveAttribute(
    "data-kp-two-column-card-opacity",
    "0.2400"
  );
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-initial-graph-state.png`,
    fullPage: false
  });

  const demandDistance = await demandCard.evaluate((element) => {
    const previous = element.previousElementSibling!;
    return element.getBoundingClientRect().top -
      previous.getBoundingClientRect().top;
  });
  expect(demandDistance).toBeGreaterThan(180);
  expect(demandDistance).toBeLessThan(500);
  await placeTopAt(page, demandCard, demandDistance / 2);
  const forwardMidpoint = await demandProgress(root);
  expect(forwardMidpoint).toBeGreaterThan(0.6);
  expect(forwardMidpoint).toBeLessThan(0.73);
  await expect(demandCard).toHaveAttribute(
    "data-kp-inline-sticky-paragraph-phase",
    "crossing"
  );
  await expect.poll(async () => Number(await initialCard.getAttribute(
    "data-kp-two-column-card-opacity"
  ))).toBeCloseTo(0.62, 2);
  await expect.poll(async () => Number(await demandCard.getAttribute(
    "data-kp-two-column-card-opacity"
  ))).toBeCloseTo(0.62, 2);

  const columns = await page.evaluate(() => {
    const paragraphElement = document.querySelector<HTMLElement>(
      '[data-kp-two-column-scroll-card="true"] p'
    )!;
    const stageElement = document.querySelector<HTMLElement>(
      "[data-kp-inline-sticky-stage]"
    )!;
    const paragraphBounds = paragraphElement.getBoundingClientRect();
    const stageBounds = stageElement.getBoundingClientRect();
    return {
      divider: getComputedStyle(stageElement).borderLeftWidth,
      paragraphRight: paragraphBounds.right,
      paragraphWidth: paragraphBounds.width,
      stageLeft: stageBounds.left,
      stageWidth: stageBounds.width
    };
  });
  expect(columns.divider).toBe("1px");
  expect(columns.stageLeft - columns.paragraphRight).toBeGreaterThan(20);
  expect(columns.paragraphWidth).toBeLessThan(440);
  expect(columns.stageWidth).toBeLessThan(540);
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-mid-demand.png`,
    fullPage: false
  });

  await placeTopAt(page, demandCard, 0);
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0.99);
  await expect(demandCard).toHaveAttribute(
    "data-kp-two-column-card-opacity",
    "1.0000"
  );
  await placeTopAt(page, demandCard, demandDistance / 2);
  await expect.poll(async () => Math.abs(
    (await demandProgress(root)) - forwardMidpoint
  )).toBeLessThan(0.015);
});

test("phone keeps the accepted one-column inline geometry", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const body = root.locator(".kp-economics-tutorial__motion-passage-body");
  const stage = root.locator("[data-kp-inline-sticky-stage]");
  const paragraph = card(root, "follow-shift").locator("p");

  await expect.poll(() => body.evaluate((element) =>
    getComputedStyle(element).display
  )).toBe("block");
  await placeTopAt(page, paragraph, 500);
  await expect.poll(() => stage.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { top: Math.round(bounds.top), height: Math.round(bounds.height) };
  })).toEqual({ top: 0, height: 422 });
  await expect.poll(() => page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth
  }))).toEqual({ client: 390, scroll: 390 });
  await page.screenshot({
    path: `${evidenceDirectory}/phone-inline-fallback.png`,
    fullPage: false
  });

  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(() => body.evaluate((element) =>
    getComputedStyle(element).display
  )).toBe("block");
  await expect.poll(() => page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth
  }))).toEqual({ client: 844, scroll: 844 });
});

test("the accepted inline route remains an independent rollback reference", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/tutorials/economics/demand-shift/?layout=inline-sticky");

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  await expect(root).not.toHaveClass(/two-column-scroll/);
  await expect(root.locator("[data-kp-two-column-scroll-card]")).toHaveCount(0);
  await expect(card(root, "follow-shift").locator("p")).toContainText(
    "Begin with the graph at rest."
  );
});

function card(root: Locator, passageId: string): Locator {
  return root.locator(
    `[data-kp-economics-tutorial-passage="${passageId}"]`
  );
}

async function placeTopAt(
  page: Page,
  element: Locator,
  targetTop: number
): Promise<void> {
  await element.evaluate((node, top) => {
    const bounds = node.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + bounds.top - top, behavior: "auto" });
  }, targetTop);
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  ));
}

async function demandProgress(root: Locator): Promise<number> {
  return Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ));
}
