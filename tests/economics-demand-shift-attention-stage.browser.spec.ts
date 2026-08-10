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
  const readingWidth = (await graph.boundingBox())?.width ?? 0;

  await deck.getByRole("button", { name: "Continue" }).click();
  await deck.getByRole("button", { name: "Continue" }).click();
  await expect(publication).toHaveAttribute(
    "data-kp-economics-attention-framing",
    "demonstration"
  );
  await expect(page).toHaveURL(/view=attention-stage.*scene=shift-demand/);
  await expect.poll(async () => Number(await publication.getAttribute(
    "data-kp-economics-tutorial-motion-progress"
  )), { timeout: 4_000 }).toBeCloseTo(1, 1);
  const demonstrationWidth = (await graph.boundingBox())?.width ?? 0;
  expect(demonstrationWidth).toBeGreaterThan(readingWidth + 100);
  expect(await transportPosition(deck)).toEqual(initialTransport);
  await expectActiveCueToFit(deck);

  await deck.getByRole("button", { name: "Continue" }).click();
  await expect(publication).toHaveAttribute(
    "data-kp-economics-attention-framing",
    "inspect"
  );
  await expect(page.locator("[data-kp-editor-graph-svg]")).toHaveCount(1);
  expect(await transportPosition(deck)).toEqual(initialTransport);
  await expectActiveCueToFit(deck);
  await expect(errors).toEqual([]);

  await mkdir(evidenceDirectory, { recursive: true });
  await publication.locator(
    ".kp-economics-static-publication__projection"
  ).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-inspect.png`,
    fullPage: false
  });

  for (const sceneId of ["trace-supply", "conclude"]) {
    await deck.getByRole("button", { name: /Continue|Read/ }).click();
    await expect(publication).toHaveAttribute(
      "data-kp-economics-deck-scene",
      sceneId
    );
    expect(await transportPosition(deck)).toEqual(initialTransport);
    await expectActiveCueToFit(deck);
    await expectStageToFitViewport(page, projection);
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
  await expect(page.locator("[data-kp-editor-graph-svg]")).toHaveCount(1);
  await projection.evaluate((element) =>
    element.scrollIntoView({ block: "start", behavior: "auto" })
  );
  await expectStageToFitViewport(page, projection);
  await expectActiveCueToFit(deck);
  await expectActiveSceneToFitViewport(page, deck);
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
  await publication.locator(
    ".kp-economics-static-publication__projection"
  ).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `${evidenceDirectory}/phone-quiet-reference.png`,
    fullPage: false
  });
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
