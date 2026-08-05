import { mkdirSync, readFileSync } from "node:fs";

import { expect, test, type Locator, type Page } from "@playwright/test";

const acceptedRoute =
  "/tutorials/economics/demand-shift/?layout=two-column-scroll";
const exemplarRoute = `${acceptedRoute}&scrub=motion-bridge`;
const dwellExemplarRoute = `${exemplarRoute}&dwell=recommended`;
const evidenceDirectory = "tmp/codex/economics-motion-bridge";

test.beforeAll(() => {
  mkdirSync(evidenceDirectory, { recursive: true });
});

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

test("recommended dwell holds the handoff through one reversible reading beat", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(dwellExemplarRoute);

  const root = tutorial(page);
  const before = root.locator("[data-kp-motion-bridge-before] p");
  const rail = root.locator(".kp-tutorial-motion-bridge__rail");
  await expect(root).toHaveAttribute(
    "data-kp-economics-motion-bridge-dwell",
    "recommended"
  );
  const samples = [
    { label: "arrival", top: 65 },
    { label: "midpoint", top: 15 },
    { label: "departure", top: -35 }
  ] as const;
  for (const sample of samples) {
    await placeTopAt(page, before, sample.top);
    await expect.poll(() => demandProgress(root)).toBeCloseTo(0.72, 3);
    await expect.poll(() => railProgress(rail)).toBeCloseTo(0.72, 3);
    await page.screenshot({
      path: `${evidenceDirectory}/desktop-dark-dwell-${sample.label}.png`,
      fullPage: false
    });
  }

  await placeTopAt(page, before, -120);
  await expect.poll(() => demandProgress(root)).toBe(1);
  await placeTopAt(page, before, 15);
  await expect.poll(() => demandProgress(root)).toBeCloseTo(0.72, 3);
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-dark-dwell-reverse.png`,
    fullPage: false
  });
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

  await page.goto(
    `${dwellExemplarRoute}#kp-checkpoint-shift-handoff`
  );
  await expect(tutorial(page)).toHaveAttribute(
    "data-kp-economics-tutorial-initial-destination",
    "checkpoint:shift-handoff"
  );
  await expect.poll(() => demandProgress(tutorial(page))).toBeCloseTo(0.72, 3);
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
  await expect(root.locator("kp-semantic-transit-layer")).toHaveCount(0);
  await expect(root).toHaveAttribute(
    "data-kp-economics-motion-bridge-artifact",
    ""
  );
  await expect(root.locator("[data-kp-two-column-scroll-paragraph]"))
    .toHaveCount(6);
});

test("semantic transit proxy layer is visual-only and preserves endpoints", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(exemplarRoute);
  const root = tutorial(page);
  const source = root.locator(
    '[data-kp-tutorial-text-reference="price-axis-inline"]'
  );
  const destination = root.locator(
    '[data-kp-tutorial-stage-object="axis-price"]'
  );
  const layer = root.locator("kp-semantic-transit-layer");
  const proxy = layer.locator(
    '[data-kp-tutorial-semantic-transit-proxy="price-axis-correspondence"]'
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-semantic-transit-layer",
    "ready"
  );
  await expect(source).toHaveCount(1);
  await expect(destination).toHaveCount(1);
  await expect(layer).toHaveAttribute("aria-hidden", "true");
  await expect(layer).toHaveAttribute("inert", "");
  await expect(proxy).toHaveCount(1);
  await expect(proxy.locator("[data-kp-tutorial-text-reference]"))
    .toHaveCount(0);
  await expect.poll(() => layer.evaluate((element) => ({
    position: getComputedStyle(element).position,
    pointerEvents: getComputedStyle(element).pointerEvents
  }))).toEqual({ position: "fixed", pointerEvents: "none" });
  await expect.poll(() => proxy.evaluate((element) => ({
    opacity: getComputedStyle(element).opacity,
    visibility: getComputedStyle(element).visibility
  }))).toEqual({ opacity: "0", visibility: "hidden" });
  expect(await source.evaluate((element) =>
    element.closest("kp-semantic-transit-layer") === null
  )).toBe(true);
  expect(await destination.evaluate((element) =>
    element.closest("kp-semantic-transit-layer") === null
  )).toBe(true);
});

test("inline P transits to axis P with exact transform-only reverse", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(exemplarRoute);
  const root = tutorial(page);
  const paragraph = root.locator(
    '[data-kp-economics-tutorial-passage="graph-at-rest"] p'
  );
  const proxy = root.locator(
    '[data-kp-tutorial-semantic-transit-proxy="price-axis-correspondence"]'
  );
  const samples = [0, 0.25, 0.5, 0.75, 1] as const;
  const forward: Array<{ x: string | null; y: string | null }> = [];
  await placeTopAt(page, paragraph, 624);
  const settledGeometryReads = await root.evaluate((element) =>
    element.getAttribute(
      "data-kp-economics-semantic-transit-geometry-reads"
    )
  );
  expect(Number(settledGeometryReads)).toBeGreaterThanOrEqual(3);
  for (const progress of samples) {
    await placeTopAt(page, paragraph, 624 - 344 * progress);
    await expect.poll(() => semanticTransitProgress(root)).toBeCloseTo(
      progress,
      2
    );
    await expect(root).toHaveAttribute(
      "data-kp-economics-semantic-transit-geometry-reads",
      settledGeometryReads!
    );
    forward.push({
      x: await proxy.getAttribute("data-kp-tutorial-semantic-transit-x"),
      y: await proxy.getAttribute("data-kp-tutorial-semantic-transit-y")
    });
    if (progress > 0 && progress < 1) {
      await expect(proxy).toHaveCSS("visibility", "visible");
      await expect(proxy).toHaveCSS("opacity", "1");
    } else {
      await expect(proxy).toHaveCSS("visibility", "hidden");
    }
  }
  for (const [index, progress] of [...samples].reverse().entries()) {
    await placeTopAt(page, paragraph, 624 - 344 * progress);
    await expect.poll(() => semanticTransitProgress(root)).toBeCloseTo(
      progress,
      2
    );
    expect({
      x: await proxy.getAttribute("data-kp-tutorial-semantic-transit-x"),
      y: await proxy.getAttribute("data-kp-tutorial-semantic-transit-y")
    }).toEqual(forward[forward.length - index - 1]);
  }
  const source = root.locator(
    '[data-kp-tutorial-text-reference="price-axis-inline"]'
  );
  const destination = root.locator(
    '[data-kp-tutorial-stage-object="axis-price"]'
  );
  for (const progress of [0.001, 0.999]) {
    await placeTopAt(page, paragraph, 624 - 344 * progress);
    const [proxyBounds, sourceBounds, destinationBounds] = await Promise.all([
      proxy.boundingBox(),
      source.boundingBox(),
      destination.boundingBox()
    ]);
    const projectedProgress = await semanticTransitProgress(root);
    const expectedX = center(sourceBounds!, "x") +
      (center(destinationBounds!, "x") - center(sourceBounds!, "x")) *
      projectedProgress;
    const expectedY = center(sourceBounds!, "y") +
      (center(destinationBounds!, "y") - center(sourceBounds!, "y")) *
      projectedProgress;
    expect(Math.abs(
      center(proxyBounds!, "x") - expectedX
    )).toBeLessThan(1.5);
    expect(Math.abs(
      center(proxyBounds!, "y") - expectedY
    )).toBeLessThan(1.5);
  }
  await placeTopAt(page, paragraph, 452);
  await expect.poll(() => semanticTransitProgress(root)).toBeCloseTo(0.5, 2);
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-dark-transit-midpoint.png`,
    fullPage: false
  });
});

test("phone and reduced-motion layouts preserve static semantic endpoints", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(exemplarRoute);
  let root = tutorial(page);
  let proxy = root.locator(
    '[data-kp-tutorial-semantic-transit-proxy="price-axis-correspondence"]'
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-semantic-transit-state",
    "phone-static"
  );
  await expect(proxy).toHaveCSS("visibility", "hidden");
  await expect(root.locator(
    '[data-kp-tutorial-text-reference="price-axis-inline"]'
  )).toHaveCount(1);
  await expect(root.locator(
    '[data-kp-tutorial-stage-object="axis-price"]'
  )).toHaveCount(1);
  const phoneParagraph = root.locator(
    '[data-kp-economics-tutorial-passage="graph-at-rest"] p'
  );
  await placeTopAt(page, phoneParagraph, 430);
  await page.screenshot({
    path: `${evidenceDirectory}/phone-static-transit-fallback.png`,
    fullPage: false
  });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(exemplarRoute);
  root = tutorial(page);
  proxy = root.locator(
    '[data-kp-tutorial-semantic-transit-proxy="price-axis-correspondence"]'
  );
  const paragraph = root.locator(
    '[data-kp-economics-tutorial-passage="graph-at-rest"] p'
  );
  await placeTopAt(page, paragraph, 452);
  await expect(root).toHaveAttribute(
    "data-kp-economics-semantic-transit-state",
    "reduced-motion-static"
  );
  await expect.poll(() => semanticTransitProgress(root)).toBeCloseTo(0.5, 2);
  await expect(proxy).toHaveCSS("visibility", "hidden");
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-reduced-motion-transit-fallback.png`,
    fullPage: false
  });
});

test("interrupted scroll and responsive resize settle without stale proxy paint", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(exemplarRoute);
  let root = tutorial(page);
  let paragraph = root.locator(
    '[data-kp-economics-tutorial-passage="graph-at-rest"] p'
  );
  let proxy = root.locator(
    '[data-kp-tutorial-semantic-transit-proxy="price-axis-correspondence"]'
  );
  await placeTopAt(page, paragraph, 452);
  await expect(proxy).toHaveCSS("visibility", "visible");
  const interruptedTransform = await proxy.getAttribute("style");
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  ));
  expect(await proxy.getAttribute("style")).toBe(interruptedTransform);
  const readsBeforeResize = Number(await root.getAttribute(
    "data-kp-economics-semantic-transit-geometry-reads"
  ));

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(root).toHaveAttribute(
    "data-kp-economics-semantic-transit-state",
    "phone-static"
  );
  await expect(proxy).toHaveCSS("visibility", "hidden");
  await page.setViewportSize({ width: 1280, height: 800 });
  root = tutorial(page);
  paragraph = root.locator(
    '[data-kp-economics-tutorial-passage="graph-at-rest"] p'
  );
  proxy = root.locator(
    '[data-kp-tutorial-semantic-transit-proxy="price-axis-correspondence"]'
  );
  await placeTopAt(page, paragraph, 452);
  await expect(root).toHaveAttribute(
    "data-kp-economics-semantic-transit-state",
    "animated"
  );
  await expect(proxy).toHaveCSS("visibility", "visible");
  const settledReads = Number(await root.getAttribute(
    "data-kp-economics-semantic-transit-geometry-reads"
  ));
  expect(settledReads).toBeGreaterThan(readsBeforeResize);
  await placeTopAt(page, paragraph, 418);
  await expect(root).toHaveAttribute(
    "data-kp-economics-semantic-transit-geometry-reads",
    String(settledReads)
  );
});

test("semantic transit checkpoint captures both desktop themes", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const theme of ["dark", "light"] as const) {
    await page.goto(`${exemplarRoute}&theme=${theme}`);
    const root = tutorial(page);
    const paragraph = root.locator(
      '[data-kp-economics-tutorial-passage="graph-at-rest"] p'
    );
    const proxy = root.locator(
      '[data-kp-tutorial-semantic-transit-proxy="price-axis-correspondence"]'
    );
    await placeTopAt(page, paragraph, 452);
    await expect.poll(() => semanticTransitProgress(root)).toBeCloseTo(0.5, 2);
    await expect(proxy).toHaveCSS("visibility", "visible");
    await page.screenshot({
      path: `${evidenceDirectory}/desktop-${theme}-transit-midpoint.png`,
      fullPage: false
    });
  }
});

test("dark light and reverse midpoint states remain visually inspectable", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const theme of ["dark", "light"] as const) {
    await page.goto(`${exemplarRoute}&theme=${theme}`);
    const root = tutorial(page);
    const before = root.locator("[data-kp-motion-bridge-before] p");
    const bridgeInk = root.locator(
      "kp-motion-bridge .kp-economics-tutorial__passage-ink"
    );
    await placeTopAt(page, before, 80);
    await expect.poll(() => demandProgress(root)).toBeCloseTo(0.5, 2);
    await expect.poll(async () => Math.min(...await bridgeInk.evaluateAll(
      (elements) => elements.map((element) => Number.parseFloat(
        getComputedStyle(element).opacity
      ))
    ))).toBeGreaterThanOrEqual(0.52);
    await page.screenshot({
      path: `${evidenceDirectory}/desktop-${theme}-midpoint.png`,
      fullPage: false
    });
  }

  await page.goto(exemplarRoute);
  const root = tutorial(page);
  const before = root.locator("[data-kp-motion-bridge-before] p");
  await placeTopAt(page, before, -120);
  await expect.poll(() => demandProgress(root)).toBe(1);
  await placeTopAt(page, before, 80);
  await expect.poll(() => demandProgress(root)).toBeCloseTo(0.5, 2);
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-dark-reverse-midpoint.png`,
    fullPage: false
  });
});

test("compiled bridge has a complete no-JS prose fallback", async ({
  browser
}) => {
  const artifact = JSON.parse(readFileSync(new URL(
    "../src/tutorial/economics-demand-shift/economics-demand-shift-publication.generated.json",
    import.meta.url
  ), "utf8")) as {
    readonly payload: {
      readonly motionBridgeHtml?: Readonly<Record<string, string>>;
    };
  };
  const bridgeHtml = artifact.payload.motionBridgeHtml?.["demand-increase"];
  expect(bridgeHtml).toBeTruthy();
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 720, height: 520 }
  });
  const page = await context.newPage();
  await page.setContent(`<!doctype html><html><head><style>
    :root { color-scheme: dark; background: #0d0e1c; color: #c5c7cd; }
    body { max-width: 38rem; margin: 0 auto; padding: 5rem 2rem;
      font: 20px/1.72 Georgia, serif; }
    kp-motion-bridge { display: block; }
    kp-motion-bridge p { margin: 0 0 2rem; text-indent: 1.35em; }
    .kp-tutorial-motion-bridge__ellipsis { color: #a9afbf; }
    .kp-tutorial-motion-bridge__rail { display: none; }
    .katex-html { display: none; }
    .katex-mathml { position: static !important; clip: auto !important;
      width: auto !important; height: auto !important; overflow: visible !important; }
  </style></head><body>${bridgeHtml}</body></html>`);
  const bridge = page.locator("kp-motion-bridge");
  await expect(bridge.locator("p")).toHaveCount(2);
  await expect(bridge).toContainText("Begin at");
  await expect(bridge).toContainText("The new curves meet");
  await expect(bridge.locator(".kp-tutorial-motion-bridge__rail"))
    .toBeHidden();
  await page.screenshot({
    path: `${evidenceDirectory}/compiled-no-js-prose.png`,
    fullPage: false
  });
  await context.close();
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

async function semanticTransitProgress(root: Locator): Promise<number> {
  return Number(await root.getAttribute(
    "data-kp-economics-semantic-transit-progress"
  ));
}

async function railProgress(rail: Locator): Promise<number> {
  return rail.evaluate((element) => Number.parseFloat(
    getComputedStyle(element).getPropertyValue(
      "--kp-tutorial-motion-bridge-progress"
    )
  ));
}

function center(
  bounds: { x: number; y: number; width: number; height: number },
  axis: "x" | "y"
): number {
  return axis === "x"
    ? bounds.x + bounds.width / 2
    : bounds.y + bounds.height / 2;
}
