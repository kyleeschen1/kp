import { expect, test, type Locator, type Page } from "@playwright/test";

const acceptedRoute =
  "/tutorials/economics/demand-shift/?layout=two-column-scroll";
const exemplarRoute = `${acceptedRoute}&scrub=motion-bridge`;

test("motion bridge projects exact forward and reverse semantic state", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(exemplarRoute);

  const root = tutorial(page);
  const bridge = root.locator("kp-motion-bridge[data-kp-motion-bridge='demand-increase']");
  const before = bridge.locator("[data-kp-motion-bridge-before] p");
  const after = bridge.locator("[data-kp-motion-bridge-after] p");
  const rail = bridge.locator(".kp-tutorial-motion-bridge__rail");
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scrub-strategy",
    "motion-bridge"
  );
  await expect(bridge).toHaveAttribute(
    "data-kp-motion-bridge-enhanced",
    "true"
  );
  await expect(bridge.locator(
    ":scope > .kp-tutorial-motion-bridge__rail[aria-hidden='true'], " +
    ".kp-tutorial-motion-bridge__ellipsis[aria-hidden='true']"
  )).toHaveCount(3);
  await expect.poll(() => bridgeGeometry(before, after, rail)).toEqual({
    anchorDistance: 400,
    railHeight: 400,
    railWidth: 1
  });

  const samples = [
    { top: 280, progress: 0 },
    { top: 180, progress: 0.25 },
    { top: 80, progress: 0.5 },
    { top: -20, progress: 0.75 },
    { top: -120, progress: 1 }
  ] as const;
  for (const sample of samples) {
    await placeTopAt(page, before, sample.top);
    await expect.poll(() => demandProgress(root)).toBeCloseTo(
      sample.progress,
      2
    );
    await expect.poll(() => railProgress(rail)).toBeCloseTo(
      sample.progress,
      2
    );
  }
  for (const sample of [...samples].reverse()) {
    await placeTopAt(page, before, sample.top);
    await expect.poll(() => demandProgress(root)).toBeCloseTo(
      sample.progress,
      2
    );
  }
});

test("semantic checkpoint URLs settle directly at bridge endpoints", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${exemplarRoute}#kp-checkpoint-shift-settled`);
  const root = tutorial(page);
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-initial-destination",
    "checkpoint:shift-settled"
  );
  await expect.poll(() => demandProgress(root)).toBe(1);
  await expect(root).toHaveAttribute(
    "data-kp-economics-motion-bridge-progress",
    "1.000"
  );

  await page.goto(`${exemplarRoute}#kp-checkpoint-shift-ready`);
  await expect(tutorial(page)).toHaveAttribute(
    "data-kp-economics-tutorial-initial-destination",
    "checkpoint:shift-ready"
  );
  await expect.poll(() => demandProgress(tutorial(page))).toBe(0);
});

test("accepted route has no motion bridge presentation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(acceptedRoute);
  const root = tutorial(page);
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scrub-strategy",
    "continuous-passage"
  );
  await expect(root.locator("kp-motion-bridge")).toHaveCount(0);
  await expect(root).toHaveAttribute(
    "data-kp-economics-motion-bridge-artifact",
    ""
  );
  await expect(root.locator("[data-kp-two-column-scroll-paragraph]"))
    .toHaveCount(6);
});

function tutorial(page: Page): Locator {
  return page.locator("[data-kp-economics-demand-shift-tutorial]");
}

async function bridgeGeometry(
  before: Locator,
  after: Locator,
  rail: Locator
): Promise<{
  readonly anchorDistance: number;
  readonly railHeight: number;
  readonly railWidth: number;
}> {
  const [beforeBounds, afterBounds, railBounds] = await Promise.all([
    before.boundingBox(),
    after.boundingBox(),
    rail.boundingBox()
  ]);
  return {
    anchorDistance: Math.round(afterBounds!.y - beforeBounds!.y),
    railHeight: Math.round(railBounds!.height),
    railWidth: Math.round(railBounds!.width)
  };
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

async function railProgress(rail: Locator): Promise<number> {
  return rail.evaluate((element) => Number.parseFloat(
    getComputedStyle(element).getPropertyValue(
      "--kp-tutorial-motion-bridge-progress"
    )
  ));
}
