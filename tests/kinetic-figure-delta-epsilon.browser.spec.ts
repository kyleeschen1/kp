import { expect, test } from "@playwright/test";

const path = "/experiments/kinetic-figure/delta-epsilon/";

test("delta-epsilon deck separates semantic navigation, lens, and playback", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(path);
  const deck = page.locator("[data-kp-delta-epsilon-focus-deck]");
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "read-limit");
  await expect(deck.locator("[data-kp-focus-deck-select]")).toHaveCount(5);
  await expect(deck.locator("[data-kp-focus-deck-position]")).toHaveText(
    "Step 1 of 5"
  );
  await expect(deck.locator("[data-kp-focus-deck-sequence-ordinal]"))
    .toHaveCount(0);
  await expect(page.locator('[data-kp-visual-theme="light"]')).toHaveCount(1);
  const initialMarker = await deck.locator(
    '[data-kp-focus-deck-select="read-limit"]'
  ).evaluate((element) => getComputedStyle(element).borderInlineStartColor);
  const inactiveMarker = await deck.locator(
    '[data-kp-focus-deck-select="inspect-hole"]'
  ).evaluate((element) => getComputedStyle(element).borderInlineStartColor);
  expect(initialMarker).not.toBe(inactiveMarker);
  await expect(deck.locator("[data-kp-focus-deck-previous]"))
    .toHaveAccessibleName("Previous step");
  await expect(deck.locator("[data-kp-focus-deck-next]"))
    .toHaveAccessibleName("Next step");
  await expect(deck.locator("svg text")).toHaveCount(0);
  await expect(deck.locator(".kp-delta-epsilon-graph__hole")).toHaveCount(1);
  await expect(deck.locator(".kp-delta-epsilon-graph__math .katex"))
    .toHaveCount(6);

  await deck.locator('[data-kp-focus-deck-select="set-output-challenge"]')
    .click();
  await expect(deck.locator('[data-kp-delta-epsilon-lens="inspect"]'))
    .toHaveAttribute("aria-pressed", "false");
  await deck.locator('[data-kp-delta-epsilon-lens="inspect"]').click();
  await expect(deck).toHaveAttribute("data-kp-delta-epsilon-active-lens",
    "inspect");
  await expect(deck.locator(
    '[data-kp-delta-epsilon-entity="epsilon-band"]'
  ).first()).toHaveAttribute("data-kp-semantic-salience-level", "focus");
  expect(new URL(page.url()).searchParams.get("lens")).toBe("inspect");

  await deck.locator('[data-kp-focus-deck-select="choose-input-window"]')
    .click();
  const wideBand = Number(await deck.locator(
    "[data-kp-delta-epsilon-epsilon-band]"
  ).getAttribute("height"));
  await deck.locator("[data-kp-focus-deck-next]").click();
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "reintegrate-proof");
  await expect(deck.locator(
    '[data-kp-focus-deck-select="reintegrate-proof"]'
  )).toHaveAttribute("aria-current", "step");
  await expect.poll(async () => Number(
    await deck.getAttribute("data-kp-delta-epsilon-progress")
  ), { timeout: 8_000 }).toBeCloseTo(1, 2);
  const narrowBand = Number(await deck.locator(
    "[data-kp-delta-epsilon-epsilon-band]"
  ).getAttribute("height"));
  expect(narrowBand).toBeLessThan(wideBand);
  await expect(deck.locator("[data-kp-delta-epsilon-play]"))
    .toHaveAccessibleName("Replay transformation");
  await expect(deck.locator(
    '[data-kp-delta-epsilon-play] [data-kp-focus-deck-control-icon="replay"]'
  )).toHaveCount(1);
  await expect(deck.locator(
    '[data-kp-delta-epsilon-entity="formal-definition"]'
  )).toHaveAttribute("data-kp-presence", "true");
  expect(errors).toEqual([]);
});

test("delta-epsilon direct links restore endpoints and the independent lens", async ({
  page
}) => {
  await page.goto(`${path}?lens=inspect#beat.reintegrate-proof`);
  const deck = page.locator("[data-kp-delta-epsilon-focus-deck]");
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat",
    "reintegrate-proof");
  await expect(deck).toHaveAttribute("data-kp-delta-epsilon-active-lens",
    "inspect");
  await expect(deck).toHaveAttribute("data-kp-delta-epsilon-progress", "1.0000");
  await expect(deck.locator('[data-kp-delta-epsilon-lens="inspect"]'))
    .toHaveAttribute("aria-pressed", "true");
  const desktopExtent = await page.evaluate(() => ({
    viewportHeight: window.innerHeight,
    documentHeight: document.documentElement.scrollHeight
  }));
  expect(desktopExtent.documentHeight).toBeLessThanOrEqual(
    desktopExtent.viewportHeight + 1
  );
});

test("delta-epsilon deck keeps prose searchable and fits a phone", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await page.goto(path);
  const deck = page.locator("[data-kp-delta-epsilon-focus-deck]");
  await expect(deck.getByText("The open circle marks the excluded point.", {
    exact: false
  })).toHaveCount(1);
  await expect(deck).toHaveAttribute("data-kp-focus-deck-steps-expanded",
    "false");
  await deck.locator("[data-kp-focus-deck-steps-toggle]").click();
  await expect(deck).toHaveAttribute("data-kp-focus-deck-steps-expanded",
    "true");
  const bounds = await deck.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth
  }));
  expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth + 1);
  for (const selector of [
    "[data-kp-focus-deck-previous]",
    "[data-kp-focus-deck-next]"
  ]) {
    const box = await deck.locator(selector).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeCloseTo(box!.height, 1);
  }
});

test("delta-epsilon visual checkpoint captures context and inspection", async ({
  page
}, testInfo) => {
  await page.goto(`${path}#beat.reintegrate-proof`);
  const deck = page.locator("[data-kp-delta-epsilon-focus-deck]");
  await expect(deck).toHaveAttribute("data-kp-delta-epsilon-progress", "1.0000");
  await page.screenshot({
    path: testInfo.outputPath("delta-epsilon-context.png"),
    fullPage: true
  });
  await deck.locator('[data-kp-delta-epsilon-lens="inspect"]').click();
  await page.screenshot({
    path: testInfo.outputPath("delta-epsilon-inspect.png"),
    fullPage: true
  });
  await page.setViewportSize({ width: 390, height: 760 });
  await page.screenshot({
    path: testInfo.outputPath("delta-epsilon-phone.png"),
    fullPage: true
  });
});
