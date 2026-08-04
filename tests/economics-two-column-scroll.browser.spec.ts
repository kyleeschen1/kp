import { mkdirSync } from "node:fs";

import { expect, test, type Locator, type Page } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/?layout=two-column-scroll";
const evidenceDirectory = "tmp/codex/economics-two-column-scroll";

test.beforeAll(() => {
  mkdirSync(evidenceDirectory, { recursive: true });
});

test("desktop prose hands off salience beside a left-hand graph", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const body = root.locator(".kp-economics-tutorial__motion-passage-body");
  const stage = root.locator("[data-kp-inline-sticky-stage]");
  const paragraphs = root.locator("[data-kp-two-column-scroll-paragraph]");
  const initialPassage = card(root, "graph-at-rest");
  const initialParagraph = initialPassage.locator("p");
  const demandPassage = card(root, "follow-shift");
  const demandParagraph = demandPassage.locator("p");
  const reflection = card(root, "equation-check");

  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-layout",
    "two-column-scroll"
  );
  await expect(paragraphs).toHaveCount(4);
  await expect(root.locator("[data-kp-two-column-scroll-card]")).toHaveCount(0);
  await expect(root.locator("kp-tutorial-scrub-bar")).toHaveCount(0);
  await expect(initialParagraph).toContainText(
    "Begin with the graph at rest."
  );
  await expect(demandParagraph).toContainText(
    "Now suppose strawberries become more desirable"
  );
  await expect(reflection).not.toHaveAttribute(
    "data-kp-two-column-scroll-paragraph",
    "true"
  );

  await expect.poll(() => body.evaluate((element) =>
    getComputedStyle(element).display
  )).toBe("grid");
  const passageHeights = await paragraphs.evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().height)
  );
  expect(passageHeights.slice(0, 3).every((height) => height < 500)).toBe(true);
  expect(passageHeights[3]).toBeLessThan(800);

  const dividerTop = 128;
  await placeTopAt(page, initialParagraph, dividerTop);
  await expect(root).toHaveAttribute(
    "data-kp-inline-sticky-stage-state",
    "pinned"
  );
  await expect.poll(() => stage.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { top: Math.round(bounds.top), height: Math.round(bounds.height) };
  })).toEqual({ top: 128, height: 544 });
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.01);
  await expect(initialPassage).toHaveAttribute(
    "data-kp-two-column-paragraph-opacity",
    "1.0000"
  );
  await expect(demandPassage).toHaveAttribute(
    "data-kp-two-column-paragraph-opacity",
    "0.3200"
  );
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-initial-paragraph-state.png`,
    fullPage: false
  });

  const demandDistance = await demandParagraph.evaluate((element) => {
    const previous = element.parentElement!.previousElementSibling!
      .querySelector("p")!;
    return element.getBoundingClientRect().top - previous.getBoundingClientRect().top;
  });
  expect(demandDistance).toBeGreaterThan(240);
  expect(demandDistance).toBeLessThan(520);
  const motionStart = Math.min(800 * 0.42, dividerTop + demandDistance);
  await placeTopAt(page, demandParagraph, motionStart);
  await expect.poll(() => demandProgress(root)).toBeLessThan(0.01);
  await expect(demandPassage).toHaveAttribute(
    "data-kp-two-column-paragraph-opacity",
    "1.0000"
  );
  await expect(demandPassage).toHaveAttribute(
    "data-kp-two-column-rule-scale",
    "1.0000"
  );

  const motionMidpoint = (motionStart + dividerTop) / 2;
  await placeTopAt(page, demandParagraph, motionMidpoint);
  const forwardMidpoint = await demandProgress(root);
  expect(forwardMidpoint).toBeGreaterThan(0.6);
  expect(forwardMidpoint).toBeLessThan(0.73);
  await expect(demandPassage).toHaveAttribute(
    "data-kp-inline-sticky-paragraph-phase",
    "crossing"
  );
  await expect.poll(async () => Number(await demandPassage.getAttribute(
    "data-kp-two-column-paragraph-salience"
  ))).toBeCloseTo(0.825, 2);

  const columns = await page.evaluate(() => {
    const paragraphElement = document.querySelector<HTMLElement>(
      '[data-kp-two-column-scroll-paragraph="true"] p'
    )!;
    const stageElement = document.querySelector<HTMLElement>(
      "[data-kp-inline-sticky-stage]"
    )!;
    const paragraphBounds = paragraphElement.getBoundingClientRect();
    const stageBounds = stageElement.getBoundingClientRect();
    const passageStyle = getComputedStyle(paragraphElement.parentElement!);
    const paragraphStyle = getComputedStyle(paragraphElement);
    const paragraphRule = getComputedStyle(paragraphElement, "::before");
    return {
      divider: getComputedStyle(stageElement).borderRightWidth,
      passageBackground: passageStyle.backgroundColor,
      passageBorderLeft: passageStyle.borderLeftWidth,
      passageGap: passageStyle.paddingBottom,
      paragraphBackground: paragraphStyle.backgroundColor,
      paragraphBorderTop: paragraphStyle.borderTopWidth,
      paragraphPosition: paragraphStyle.position,
      paragraphRuleWidth: paragraphRule.width,
      paragraphLeft: paragraphBounds.left,
      paragraphWidth: paragraphBounds.width,
      stageRight: stageBounds.right,
      stageWidth: stageBounds.width
    };
  });
  expect(columns.divider).toBe("1px");
  expect(columns.passageBackground).toBe("rgba(0, 0, 0, 0)");
  expect(columns.passageBorderLeft).toBe("0px");
  expect(columns.passageGap).toBe("128px");
  expect(columns.paragraphBackground).toBe("rgba(0, 0, 0, 0)");
  expect(columns.paragraphBorderTop).toBe("0px");
  expect(columns.paragraphPosition).toBe("relative");
  expect(columns.paragraphRuleWidth).toBe("2px");
  expect(columns.paragraphLeft - columns.stageRight).toBeGreaterThan(20);
  expect(columns.paragraphWidth).toBeLessThan(440);
  expect(columns.stageWidth).toBeLessThan(540);
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-mid-demand.png`,
    fullPage: false
  });

  await placeTopAt(page, demandParagraph, dividerTop);
  await expect.poll(() => demandProgress(root)).toBeGreaterThan(0.99);
  await expect(demandPassage).toHaveAttribute(
    "data-kp-two-column-paragraph-salience",
    "0.6500"
  );
  await placeTopAt(page, demandParagraph, motionMidpoint);
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
  await expect(root.locator("[data-kp-two-column-scroll-paragraph]")).toHaveCount(0);
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
