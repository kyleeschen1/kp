import { expect, test } from "@playwright/test";

const path = "/experiments/kinetic-figure/surface-contour/";

test("visual checkpoint: one stage carries the level set from surface to map", async ({
  page
}, testInfo) => {
  await page.goto(path);
  const deck = page.locator("[data-kp-surface-contour-deck]");
  await expect(deck).toBeVisible();
  await expect(deck).toHaveAttribute("data-kp-surface-contour-active-beat",
    "read-the-surface");
  await expect(deck.locator(".katex")).not.toHaveCount(0);
  await expect(deck.locator("svg text")).toHaveCount(0);
  await expect(deck.locator(
    "[data-kp-semantic-identity=\"identity.calculus.surface-contour.same-level-set\"]"
  )).toHaveCount(1);
  await expect(deck.locator("[data-kp-surface-contour-view]"))
    .toHaveCount(1);
  const stage = deck.locator("[data-kp-surface-contour-stage]");
  await expectSurfaceContourStageToFit(stage);
  expect(await maximumPassageOverflow(page)).toBeLessThanOrEqual(1);
  await page.screenshot({
    path: testInfo.outputPath("surface-contour-orient.png"),
    fullPage: true
  });

  for (const slug of ["choose-a-height", "find-the-intersection"]) {
    await deck.locator("[data-kp-focus-deck-next]").click();
    await expect(deck).toHaveAttribute("data-kp-surface-contour-active-beat",
      slug);
    await expect(deck).toHaveAttribute("data-kp-surface-contour-transition",
      "settled");
    await expectSurfaceContourStageToFit(stage);
  }

  const levelSet = deck.locator("[data-kp-surface-contour-level-set]");
  await expect(levelSet).toHaveCSS("opacity", "1");
  const intersectionPath = await levelSet.getAttribute("d");
  await page.screenshot({
    path: testInfo.outputPath("surface-contour-find-the-intersection.png"),
    fullPage: true
  });

  await deck.locator("[data-kp-focus-deck-next]").click();
  await expect(deck).toHaveAttribute("data-kp-surface-contour-active-beat",
    "project-the-contour");
  await expect(deck.locator("[data-kp-surface-contour-stage]"))
    .toHaveAttribute("data-kp-surface-contour-view-progress", "1.0000");
  await expectSurfaceContourStageToFit(stage);
  expect(await levelSet.getAttribute("d")).not.toBe(intersectionPath);
  await page.screenshot({
    path: testInfo.outputPath("surface-contour-project-the-contour.png"),
    fullPage: true
  });

  await deck.locator("[data-kp-focus-deck-next]").click();
  await expect(deck).toHaveAttribute("data-kp-surface-contour-active-beat",
    "vary-the-level");
  await expect(deck.locator("[data-kp-surface-contour-stage]"))
    .toHaveAttribute("data-kp-surface-contour-map-progress", "1.0000");
  await expectSurfaceContourStageToFit(stage);

  await deck.locator("[data-kp-focus-deck-next]").click();
  await expect(deck).toHaveAttribute("data-kp-surface-contour-active-beat",
    "read-the-map");
  await expect(deck.locator("[data-kp-surface-contour-context]"))
    .toHaveCSS("opacity", "1");
  await expectSurfaceContourStageToFit(stage);

  const level = deck.locator("[data-kp-surface-contour-level]");
  await expect(level).toBeEnabled();
  const before = await levelSet.getAttribute("d");
  await level.fill("2.4");
  await expect(deck.locator("[data-kp-surface-contour-stage]"))
    .toHaveAttribute("data-kp-surface-contour-current-level", "2.4000");
  expect(await levelSet.getAttribute("d")).not.toBe(before);
  await expect(deck.locator("[data-kp-surface-contour-level-output]"))
    .toHaveText("2.4");
  await expectSurfaceContourStageToFit(stage);

  await page.screenshot({
    path: testInfo.outputPath("surface-contour-focus-card.png"),
    fullPage: true
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${path}#beat.project-the-contour`);
  const phoneDeck = page.locator("[data-kp-surface-contour-deck]");
  await expect(phoneDeck.locator("[data-kp-surface-contour-view]"))
    .toHaveCount(1);
  await expectSurfaceContourStageToFit(
    phoneDeck.locator("[data-kp-surface-contour-stage]")
  );
  expect(await maximumPassageOverflow(page)).toBeLessThanOrEqual(1);
  const bounds = await phoneDeck.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: testInfo.outputPath("surface-contour-phone.png"),
    fullPage: true
  });
});

test("semantic URLs restore directly without replaying intermediate beats", async ({
  page
}) => {
  await page.goto(`${path}#beat.read-the-map`);
  const deck = page.locator("[data-kp-surface-contour-deck]");
  await expect(deck).toHaveAttribute("data-kp-surface-contour-active-beat",
    "read-the-map");
  await expect(deck).toHaveAttribute("data-kp-surface-contour-transition",
    "settled");
  await expect(deck.locator("[data-kp-surface-contour-state]"))
    .toHaveValue("5");
  await expect(deck.locator("[data-kp-surface-contour-stage]"))
    .toHaveAttribute("data-kp-surface-contour-map-progress", "1.0000");
});

test("adjacent controls expose real forward and rewind intermediate frames", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(path);
  const deck = page.locator("[data-kp-surface-contour-deck]");
  const next = deck.locator("[data-kp-focus-deck-next]");
  const previous = deck.locator("[data-kp-focus-deck-previous]");
  await expect(deck.locator(".graph-webgl")).toHaveAttribute(
    "data-kp-surface-contour-capability",
    "ready"
  );

  await beginPositionRecording(deck);
  await next.click();
  await expect(deck).toHaveAttribute(
    "data-kp-surface-contour-transition",
    "settled",
    { timeout: 4_000 }
  );
  expect(await endPositionRecording(deck)).toContain(true);

  await beginPositionRecording(deck);
  await previous.click();
  await expect(deck).toHaveAttribute(
    "data-kp-surface-contour-transition",
    "settled",
    { timeout: 4_000 }
  );
  expect(await endPositionRecording(deck)).toContain(true);
});

test("native passage travel updates the playhead and settles one 3D endpoint", async ({
  page
}) => {
  await page.goto(path);
  const deck = page.locator("[data-kp-surface-contour-deck]");
  const viewport = deck.locator("[data-kp-focus-deck-viewport]");
  const scrubber = deck.locator("[data-kp-focus-deck-scrubber]");
  await expect(viewport).not.toHaveAttribute("data-kp-focus-deck-snap-disabled");
  await viewport.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
  const sampled = await viewport.evaluate(async (element) => {
    const viewportElement = element as HTMLElement;
    viewportElement.dataset["kpFocusDeckSnapDisabled"] = "true";
    viewportElement.style.scrollSnapType = "none";
    void viewportElement.offsetWidth;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    viewportElement.scrollLeft = viewportElement.clientWidth * 1.5;
    viewportElement.dispatchEvent(new Event("scroll"));
    const deck = viewportElement.closest<HTMLElement>(
      "[data-kp-surface-contour-deck]"
    )!;
    const scrubber = deck.querySelector<HTMLInputElement>(
      "[data-kp-focus-deck-scrubber]"
    )!;
    return {
      requested: viewportElement.scrollLeft /
        Math.max(1, viewportElement.clientWidth),
      position: Number(deck.dataset["kpSurfaceContourPosition"]),
      scrubber: Number(scrubber.value)
    };
  });
  expect(sampled.requested).toBeCloseTo(1.5, 1);
  expect(sampled.position).toBeCloseTo(1.5, 1);
  expect(sampled.scrubber).toBeCloseTo(sampled.position, 2);
  await expect(deck).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "find-the-intersection"
  );
  await expect(deck).toHaveAttribute(
    "data-kp-surface-contour-position",
    "2.0000"
  );
  await expect(scrubber).toHaveValue("2");
});

test("all prose remains in the searchable document and selection restores its beat", async ({
  page
}) => {
  await page.goto(path);
  const deck = page.locator("[data-kp-surface-contour-deck]");
  await expect(deck.locator("[data-kp-surface-contour-beat]"))
    .toHaveCount(6);
  await expect(deck).toContainText("Each nested contour records another height.");
  await page.evaluate(() => {
    const passage = document.querySelector<HTMLElement>(
      "[data-kp-surface-contour-beat=\"read-the-map\"]"
    );
    const text = passage?.querySelector("p:last-child")?.firstChild;
    if (text === undefined || text === null) throw new Error("Missing final passage text.");
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(text);
    selection?.removeAllRanges();
    selection?.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
  });
  await expect(deck).toHaveAttribute("data-kp-surface-contour-active-beat",
    "read-the-map");
});

async function maximumPassageOverflow(page: import("@playwright/test").Page):
Promise<number> {
  return page.evaluate(() => Math.max(0, ...[
    ...document.querySelectorAll<HTMLElement>(
      "[data-kp-surface-contour-deck] .kp-focus-deck__passage-page"
    )
  ].map((passage) => passage.scrollHeight - passage.clientHeight)));
}

async function expectSurfaceContourStageToFit(
  stage: import("@playwright/test").Locator
): Promise<void> {
  await expect.poll(async () => {
    const status = await stage.getAttribute("data-kp-stage-fit-status");
    if (status === "satisfied") return status;
    const gaps = await stage.getAttribute("data-kp-stage-fit-repair-gaps");
    const bounds = await stage.getAttribute("data-kp-stage-fit-observed-bounds");
    return `${status ?? "missing"}; gaps=${gaps ?? "missing"}; bounds=${bounds ?? "missing"}`;
  }).toBe("satisfied");
}

async function beginPositionRecording(
  deck: import("@playwright/test").Locator
): Promise<void> {
  await deck.evaluate((element) => {
    const state = element as HTMLElement & {
      kpPositionObserver?: MutationObserver;
      kpRecordedIntermediatePositions?: boolean[];
    };
    state.kpRecordedIntermediatePositions = [];
    state.kpPositionObserver = new MutationObserver(() => {
      const position = Number(state.dataset["kpSurfaceContourPosition"]);
      state.kpRecordedIntermediatePositions?.push(
        position > 0.02 && position < 0.98
      );
    });
    state.kpPositionObserver.observe(state, {
      attributes: true,
      attributeFilter: ["data-kp-surface-contour-position"]
    });
  });
}

async function endPositionRecording(
  deck: import("@playwright/test").Locator
): Promise<readonly boolean[]> {
  return deck.evaluate((element) => {
    const state = element as HTMLElement & {
      kpPositionObserver?: MutationObserver;
      kpRecordedIntermediatePositions?: boolean[];
    };
    state.kpPositionObserver?.disconnect();
    return state.kpRecordedIntermediatePositions ?? [];
  });
}
