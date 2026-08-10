import { mkdir } from "node:fs/promises";

import { expect, test, type Locator, type Page } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/?view=attention-stage";
const evidenceDirectory = "tmp/codex/economics-demand-shift-attention-stage";

test("attention stage recomposes one retained graph across semantic frames", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(route);

  const publication = page.locator("[data-kp-economics-static-publication]");
  const projection = publication.locator(
    ".kp-economics-static-publication__projection"
  );
  const graph = publication.locator(".kp-economics-static-publication__stage");
  const deck = publication.locator("[data-kp-economics-deck]");
  await expect(publication).toHaveAttribute(
    "data-kp-economics-static-enhancement",
    "ready"
  );
  await expect(publication).toHaveAttribute(
    "data-kp-economics-attention-framing",
    "reading"
  );
  await expect(deck).toBeVisible();
  expect(await deck.evaluate((element) => ({
    display: getComputedStyle(element).display,
    direction: getComputedStyle(element).flexDirection,
    passageOrder: getComputedStyle(element.querySelector(
      ".kp-economics-static-publication__deck-viewport"
    )!).order,
    progressOrder: getComputedStyle(element.querySelector(
      ".kp-economics-static-publication__deck-progress"
    )!).order,
    controlsOrder: getComputedStyle(element.querySelector(
      ".kp-economics-static-publication__deck-controls"
    )!).order
  }))).toEqual({
    display: "flex",
    direction: "column",
    passageOrder: "1",
    progressOrder: "2",
    controlsOrder: "3"
  });
  await expect(page.locator("[data-kp-editor-graph-svg]")).toHaveCount(1);
  await projection.evaluate((element) =>
    element.scrollIntoView({ block: "start", behavior: "auto" })
  );
  const initialTransport = await transportPosition(deck);
  await expectActiveCueToFit(deck);
  await expect(deck.locator(
    "[data-kp-economics-deck-scene-active=\"true\"] [data-kp-economics-deck-passage-copy]"
  )).toBeHidden();
  await expectStageToFitViewport(page, projection);
  await expectAustereCommonFrame(publication);
  await mkdir(evidenceDirectory, { recursive: true });
  await captureProjection(publication, "desktop-01-orient.png");
  await expectAttentionStageOrder(publication);
  await expectGraphSafeArea(graph);
  const axisStroke = await publication.locator("[data-kp-editor-graph-axis]")
    .first().evaluate((element) => getComputedStyle(element).stroke);
  const progress = publication.locator("[data-kp-economics-deck-progress]");
  expect(await progress.evaluate(
    (element) => getComputedStyle(element).accentColor
  )).toBe(axisStroke);
  await expect(publication.locator("[data-kp-economics-supply-line]"))
    .toBeVisible();
  await expect(publication.locator("[data-kp-economics-demand-line]"))
    .toBeVisible();
  await expect(publication.locator("[data-kp-economics-equilibrium-point]"))
    .toBeVisible();
  const readingWidth = (await graph.boundingBox())?.width ?? 0;

  await deck.getByRole("button", { name: "Continue" }).click();
  await expect(publication).toHaveAttribute(
    "data-kp-economics-deck-scene",
    "equilibrium"
  );
  await captureProjection(publication, "desktop-02-equilibrium.png");
  await deck.getByRole("button", { name: "Continue" }).click();
  await expect(publication).toHaveAttribute(
    "data-kp-economics-attention-framing",
    "demonstration"
  );
  await expect(page).toHaveURL(/view=attention-stage.*scene=shift-demand/);
  await expect.poll(async () => Number(await publication.getAttribute(
    "data-kp-economics-tutorial-motion-progress"
  )), { timeout: 4_000 }).toBeCloseTo(1, 1);
  await expectMotionProgress(publication, "demand", 1);
  const demonstrationWidth = (await graph.boundingBox())?.width ?? 0;
  expect(Math.abs(demonstrationWidth - readingWidth)).toBeLessThanOrEqual(1);
  expect(await transportPosition(deck)).toEqual(initialTransport);
  await expectActiveCueToFit(deck);
  await expectAustereCommonFrame(publication);
  await expect(publication.locator(
    ".editor-graph-stage__economics-demand-reference"
  )).toBeHidden();
  await expect(publication.locator("[data-kp-economics-equilibrium-point]"))
    .toBeHidden();
  await expect(publication.locator(
    "[data-kp-economics-math-label=\"curve-demand-current\"]"
  )).toBeHidden();
  await captureProjection(publication, "desktop-03-shift-demand.png");

  await deck.getByRole("button", { name: "Continue" }).click();
  await expect(publication).toHaveAttribute(
    "data-kp-economics-attention-framing",
    "inspect"
  );
  await expect(page.locator("[data-kp-editor-graph-svg]")).toHaveCount(1);
  expect(await transportPosition(deck)).toEqual(initialTransport);
  await expectActiveCueToFit(deck);
  await expectAustereCommonFrame(publication);
  await expect(publication.locator("[data-kp-economics-equilibrium-point]"))
    .toBeVisible();
  await expect(publication.locator(
    "[data-kp-economics-initial-equilibrium-reference]"
  )).toBeVisible();
  await expectPainted(publication.locator(
    "[data-kp-economics-equilibrium-quantity-guide]"
  ));
  await expect(errors).toEqual([]);

  await captureProjection(publication, "desktop-04-inspect-equilibrium.png");

  for (const sceneId of ["trace-supply", "conclude"]) {
    await deck.getByRole("button", { name: /Continue|Read/ }).click();
    await expect(publication).toHaveAttribute(
      "data-kp-economics-deck-scene",
      sceneId
    );
    expect(await transportPosition(deck)).toEqual(initialTransport);
    await expectActiveCueToFit(deck);
    await expectStageToFitViewport(page, projection);
    await expectAustereCommonFrame(publication);
    expect(Math.abs(((await graph.boundingBox())?.width ?? 0) - readingWidth))
      .toBeLessThanOrEqual(1);
    if (sceneId === "trace-supply") {
      await expect.poll(async () => Number(await publication.getAttribute(
        "data-kp-economics-tutorial-supply-movement-progress"
      )), { timeout: 4_000 }).toBeCloseTo(1, 1);
      await expect(publication.locator("[data-kp-economics-demand-line]"))
        .toBeHidden();
      await expect(publication.locator(
        "[data-kp-economics-supply-movement]"
      )).toBeVisible();
      await captureProjection(publication, "desktop-05-trace-supply.png");
    } else {
      await expect(publication.locator("[data-kp-economics-demand-line]"))
        .toBeVisible();
      await expect(publication.locator(
        "[data-kp-economics-math-label=\"curve-demand-current\"]"
      )).toBeHidden();
      await expect(publication.locator(
        ".editor-graph-stage__economics-demand-reference"
      )).toBeHidden();
      await captureProjection(publication, "desktop-06-conclude.png");
    }
  }
});

test("direct attention frames remain stable and usable on a phone", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${route}&scene=conclude`);

  const publication = page.locator("[data-kp-economics-static-publication]");
  const projection = publication.locator(
    ".kp-economics-static-publication__projection"
  );
  const deck = publication.locator("[data-kp-economics-deck]");
  await expect(publication).toHaveAttribute(
    "data-kp-economics-attention-framing",
    "quiet-reference"
  );
  await expect(publication).toHaveAttribute(
    "data-kp-economics-deck-scene",
    "conclude"
  );
  await expectMotionProgress(publication, "demand", 1);
  await expectMotionProgress(publication, "supply-movement", 1);
  await expect(page.locator("[data-kp-editor-graph-svg]")).toHaveCount(1);
  await projection.evaluate((element) =>
    element.scrollIntoView({ block: "start", behavior: "auto" })
  );
  await expectStageToFitViewport(page, projection);
  await expectActiveCueToFit(deck);
  await expectActiveSceneToFitViewport(page, deck);
  await expectAttentionStageOrder(publication);
  await expectGraphSafeArea(publication.locator(
    ".kp-economics-static-publication__stage"
  ));
  await expect(deck.locator("[data-kp-economics-deck-previous]"))
    .toBeInViewport();
  await expect(deck.locator("[data-kp-economics-deck-next]"))
    .toBeInViewport();
  const toolbar = page.locator("[data-kp-dev-toolbar]");
  await expect(toolbar).toBeVisible();
  const toolbarBox = await toolbar.boundingBox();
  const controlsBox = await deck.locator(
    ".kp-economics-static-publication__deck-controls"
  ).boundingBox();
  expect(controlsBox).not.toBeNull();
  expect(toolbarBox).not.toBeNull();
  expect(controlsBox!.y + controlsBox!.height).toBeLessThanOrEqual(
    toolbarBox!.y
  );
  const viewportWidth = await page.evaluate(() =>
    document.documentElement.clientWidth
  );
  const scrollWidth = await page.evaluate(() =>
    document.documentElement.scrollWidth
  );
  expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);

  await mkdir(evidenceDirectory, { recursive: true });
  await captureProjection(publication, "phone-quiet-reference.png");
});

test("large text remains readable and degrades to ordinary page flow", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${route}&scene=trace-supply`);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });

  const publication = page.locator("[data-kp-economics-static-publication]");
  const projection = publication.locator(
    ".kp-economics-static-publication__projection"
  );
  const deck = publication.locator("[data-kp-economics-deck]");
  await expect(publication).toHaveAttribute(
    "data-kp-economics-static-enhancement",
    "ready"
  );
  await projection.scrollIntoViewIfNeeded();
  await expectActiveCueToFit(deck);
  await expectAttentionStageOrder(publication);
  await expectActiveSceneToFitViewport(page, deck);
  expect(await deck.locator(
    "[data-kp-economics-deck-scene-active=\"true\"] [data-kp-economics-attention-cue]"
  ).evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)))
    .toBeGreaterThanOrEqual(32);
  expect(await projection.evaluate((element) =>
    getComputedStyle(element).overflow
  )).toBe("visible");
  const viewportWidth = await page.evaluate(() =>
    document.documentElement.clientWidth
  );
  const scrollWidth = await page.evaluate(() =>
    document.documentElement.scrollWidth
  );
  expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);

  await mkdir(evidenceDirectory, { recursive: true });
  await captureProjection(publication, "desktop-large-text.png");

  const controls = deck.locator(
    ".kp-economics-static-publication__deck-controls"
  );
  await controls.evaluate((element) =>
    element.scrollIntoView({ block: "end", behavior: "auto" })
  );
  // Fixed overlays are not considered by scrollIntoView. A reader's ordinary
  // wheel gesture must still have enough document tail to expose the controls.
  await page.mouse.wheel(0, 500);
  const toolbar = page.locator("[data-kp-dev-toolbar]");
  await expect.poll(async () => {
    const controlsBox = await controls.boundingBox();
    const toolbarBox = await toolbar.boundingBox();
    return controlsBox === null || toolbarBox === null
      ? Number.POSITIVE_INFINITY
      : controlsBox.y + controlsBox.height - toolbarBox.y;
  }).toBeLessThanOrEqual(0);
  const controlsBox = await controls.boundingBox();
  const toolbarBox = await toolbar.boundingBox();
  expect(controlsBox).not.toBeNull();
  expect(toolbarBox).not.toBeNull();
  expect(controlsBox!.y + controlsBox!.height).toBeLessThanOrEqual(
    toolbarBox!.y
  );
  await captureProjection(publication, "desktop-large-text-controls.png");
});

async function transportPosition(deck: Locator): Promise<{
  readonly previousX: number;
  readonly previousY: number;
  readonly nextX: number;
  readonly nextY: number;
}> {
  const previous = await deck.locator(
    "[data-kp-economics-deck-previous]"
  ).boundingBox();
  const next = await deck.locator(
    "[data-kp-economics-deck-next]"
  ).boundingBox();
  expect(previous).not.toBeNull();
  expect(next).not.toBeNull();
  return {
    previousX: Math.round(previous!.x),
    previousY: Math.round(previous!.y),
    nextX: Math.round(next!.x),
    nextY: Math.round(next!.y)
  };
}

async function expectActiveCueToFit(deck: Locator): Promise<void> {
  const cue = deck.locator(
    "[data-kp-economics-deck-scene-active=\"true\"] [data-kp-economics-attention-cue]"
  );
  await expect(cue).toBeVisible();
  expect(await cue.evaluate((element) =>
    ({
      fitsInline: element.scrollWidth <= element.clientWidth + 1,
      fitsBlock: element.scrollHeight <= element.clientHeight + 1
    })
  )).toEqual({ fitsInline: true, fitsBlock: true });
}

async function expectStageToFitViewport(
  page: Page,
  projection: Locator
): Promise<void> {
  const box = await projection.boundingBox();
  expect(box).not.toBeNull();
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  expect(box!.height).toBeLessThanOrEqual(viewportHeight);
  expect(await projection.evaluate((element) =>
    element.scrollHeight <= element.clientHeight + 1
  )).toBe(true);
}

async function expectActiveSceneToFitViewport(
  page: Page,
  deck: Locator
): Promise<void> {
  const scene = deck.locator(
    "[data-kp-economics-deck-scene-active=\"true\"]"
  );
  const box = await scene.boundingBox();
  expect(box).not.toBeNull();
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(Math.round(box!.x + box!.width)).toBeLessThanOrEqual(viewportWidth + 1);
}

async function expectAustereCommonFrame(publication: Locator): Promise<void> {
  await expect(publication.locator(".editor-graph-stage__economics-grid"))
    .toBeHidden();
  await expect(publication.locator(
    ".editor-graph-stage__economics-explanation-foreign-object"
  )).toBeHidden();
  await expect(publication.locator(
    "[data-kp-economics-math-label=\"equilibrium-current\"]"
  )).toBeHidden();
  await expect(publication.locator("[data-kp-economics-stage-caption]"))
    .toBeHidden();
  await expect(publication.locator(
    "[data-kp-economics-deck-scene-active=\"true\"] h3"
  )).toBeHidden();
}

async function expectAttentionStageOrder(publication: Locator): Promise<void> {
  const elements = [
    publication.locator(".kp-economics-static-publication__stage"),
    publication.locator(
      "[data-kp-economics-deck-scene-active=\"true\"] [data-kp-economics-attention-cue]"
    ),
    publication.locator(".kp-economics-static-publication__deck-progress"),
    publication.locator(".kp-economics-static-publication__deck-controls")
  ];
  const boxes = await Promise.all(elements.map((element) => element.boundingBox()));
  for (const box of boxes) expect(box).not.toBeNull();
  for (let index = 1; index < boxes.length; index += 1) {
    expect(boxes[index]!.y).toBeGreaterThanOrEqual(
      boxes[index - 1]!.y + boxes[index - 1]!.height - 1
    );
  }
}

async function expectGraphSafeArea(stage: Locator): Promise<void> {
  const stageBox = await stage.boundingBox();
  const svgBox = await stage.locator("[data-kp-editor-graph-svg]").boundingBox();
  expect(stageBox).not.toBeNull();
  expect(svgBox).not.toBeNull();
  expect(svgBox!.x - stageBox!.x).toBeGreaterThanOrEqual(10);
  expect(stageBox!.x + stageBox!.width - svgBox!.x - svgBox!.width)
    .toBeGreaterThanOrEqual(10);
  expect(svgBox!.y - stageBox!.y).toBeGreaterThanOrEqual(6);
  expect(stageBox!.y + stageBox!.height - svgBox!.y - svgBox!.height)
    .toBeGreaterThanOrEqual(6);
}

async function captureProjection(
  publication: Locator,
  filename: string
): Promise<void> {
  await publication.locator(
    ".kp-economics-static-publication__projection"
  ).screenshot({ path: `${evidenceDirectory}/${filename}` });
}

async function expectPainted(locator: Locator): Promise<void> {
  expect(await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" &&
      Number(style.opacity) > 0;
  })).toBe(true);
}

async function expectMotionProgress(
  publication: Locator,
  motion: "demand" | "supply-movement",
  expected: number
): Promise<void> {
  const owner = motion === "demand"
    ? publication.locator("[data-kp-editor-graph-svg]")
    : publication;
  const attribute = motion === "demand"
    ? "data-kp-editor-graph-progress"
    : "data-kp-economics-tutorial-supply-movement-progress";
  await expect.poll(async () => Number(await owner.getAttribute(attribute)), {
    timeout: 4_000
  }).toBeCloseTo(expected, 1);
}
