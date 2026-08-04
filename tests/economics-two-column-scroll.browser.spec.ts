import { mkdirSync } from "node:fs";

import { expect, test, type Locator, type Page } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/?layout=two-column-scroll";
const evidenceDirectory = "tmp/codex/economics-two-column-scroll";

test.beforeAll(() => {
  mkdirSync(evidenceDirectory, { recursive: true });
});

test("desktop cards own one reversible bottom-to-top graph timeline", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const body = root.locator(".kp-economics-tutorial__motion-passage-body");
  const stage = root.locator("[data-kp-inline-sticky-stage]");
  const cards = root.locator("[data-kp-two-column-scroll-card]");
  const demandCard = card(root, "follow-shift");
  const demandParagraph = demandCard.locator("p");
  const reflection = card(root, "equation-check");

  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-layout",
    "two-column-scroll"
  );
  await expect(cards).toHaveCount(3);
  await expect(root.locator("kp-tutorial-scrub-bar")).toHaveCount(0);
  await expect(demandParagraph).toHaveText(
    "Watch the red demand curve. As this card rises, D0 shifts to D1 while S stays fixed."
  );
  await expect(reflection).not.toHaveAttribute(
    "data-kp-two-column-scroll-card",
    "true"
  );

  await expect.poll(() => body.evaluate((element) =>
    getComputedStyle(element).display
  )).toBe("grid");
  await expect.poll(() => cards.evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().height)
  )).toEqual([800, 800, 800]);

  await placeTopAt(page, demandParagraph, 799);
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "pinned"
  );
  await expect.poll(() => stage.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { top: Math.round(bounds.top), height: Math.round(bounds.height) };
  })).toEqual({ top: 128, height: 544 });
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.01);

  await placeTopAt(page, demandParagraph, 400);
  const forwardMidpoint = await demandProgress(root);
  expect(forwardMidpoint).toBeGreaterThan(0.6);
  expect(forwardMidpoint).toBeLessThan(0.73);
  await expect(demandCard).toHaveAttribute(
    "data-kp-inline-sticky-paragraph-phase",
    "crossing"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-attention-passage",
    "follow-shift"
  );

  const columns = await page.evaluate(() => {
    const cardElement = document.querySelector<HTMLElement>(
      '[data-kp-two-column-scroll-card="true"]'
    )!;
    const stageElement = document.querySelector<HTMLElement>(
      "[data-kp-inline-sticky-stage]"
    )!;
    const cardBounds = cardElement.getBoundingClientRect();
    const stageBounds = stageElement.getBoundingClientRect();
    return {
      cardRight: cardBounds.right,
      stageLeft: stageBounds.left
    };
  });
  expect(columns.stageLeft - columns.cardRight).toBeGreaterThan(55);
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-mid-demand.png`,
    fullPage: false
  });

  await placeTopAt(page, demandParagraph, -1);
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0.99);
  await placeTopAt(page, demandParagraph, 400);
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
