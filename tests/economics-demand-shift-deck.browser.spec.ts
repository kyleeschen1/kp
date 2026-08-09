import { mkdir } from "node:fs/promises";

import { expect, test } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/?view=deck";
const evidenceDirectory = "tmp/codex/economics-demand-shift-deck";

test("deck projects six explicit scenes through one retained stage", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(route);

  const publication = page.locator("[data-kp-economics-static-publication]");
  const deck = publication.locator("[data-kp-economics-deck]");
  await expect(publication).toHaveAttribute(
    "data-kp-economics-static-enhancement",
    "ready"
  );
  await expect(deck).toBeVisible();
  await expect(page.locator("[data-kp-editor-graph-svg]")).toHaveCount(1);
  await expect(deck.locator("[data-kp-economics-deck-scene]")).toHaveCount(6);
  await expect(deck.locator("[data-kp-economics-deck-count]")).toHaveText(
    "1 of 6"
  );
  expect(await page.locator("body").innerText()).toContain(
    "follow only the red demand curve and the intersection it determines"
  );

  await deck.getByRole("button", { name: "Continue" }).click();
  await expect(publication).toHaveAttribute(
    "data-kp-economics-deck-scene",
    "equilibrium"
  );
  await deck.getByRole("button", { name: "Continue" }).click();
  await expect(publication).toHaveAttribute(
    "data-kp-economics-deck-scene",
    "shift-demand"
  );
  await expect.poll(async () => Number(await publication.getAttribute(
    "data-kp-economics-tutorial-motion-progress"
  ))).toBeGreaterThan(0);
  await expect.poll(async () => Number(await publication.getAttribute(
    "data-kp-economics-tutorial-motion-progress"
  )), { timeout: 4_000 }).toBeCloseTo(1, 1);
  await expect(publication.locator("[data-kp-economics-stage-caption]"))
    .toHaveText("New equilibrium after demand increases.");
  await expect(page).toHaveURL(/view=deck.*scene=shift-demand/);
  await expect(errors).toEqual([]);
  const stageHeight = await publication.locator(
    ".kp-economics-static-publication__stage-slot"
  ).evaluate((element) => element.getBoundingClientRect().height);
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  expect(stageHeight).toBeLessThanOrEqual(0.49 * viewportHeight);

  await mkdir(evidenceDirectory, { recursive: true });
  await publication.locator(
    ".kp-economics-static-publication__projection"
  ).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-scene-3.png`,
    fullPage: false
  });
});

test("view switching preserves one document navigation and restores publication", async ({
  page
}) => {
  await page.goto("/tutorials/economics/demand-shift/?view=reader");
  const navigationCount = await page.evaluate(() =>
    performance.getEntriesByType("navigation").length
  );
  await page.getByRole("link", { name: "Deck", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-economics-view",
    "deck"
  );
  await expect(page.locator("[data-kp-economics-deck]")).toBeVisible();
  expect(await page.evaluate(() =>
    performance.getEntriesByType("navigation").length
  )).toBe(navigationCount);

  await page.getByText("Experiments", { exact: true }).click();
  await page.getByRole("link", { name: "Split", exact: true }).click();
  await expect(page.locator("[data-kp-economics-demand-shift-tutorial]"))
    .toBeVisible({ timeout: 30_000 });
  await page.getByRole("link", { name: "Reader", exact: true }).click();
  await expect(page.locator("[data-kp-economics-static-publication]"))
    .toBeVisible({ timeout: 30_000 });
  expect(await page.evaluate(() =>
    performance.getEntriesByType("navigation").length
  )).toBe(navigationCount);
});

test("a direct deck scene seeks immediately and remains usable on a phone", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(
    "/tutorials/economics/demand-shift/?view=deck&scene=trace-supply"
  );
  const publication = page.locator("[data-kp-economics-static-publication]");
  await expect(publication).toHaveAttribute(
    "data-kp-economics-deck-scene",
    "trace-supply"
  );
  await expect(publication).toHaveAttribute(
    "data-kp-economics-tutorial-supply-movement-progress",
    "1.000"
  );
  await expect(page.locator("[data-kp-economics-deck]")).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
});
