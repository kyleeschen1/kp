import { mkdir } from "node:fs/promises";

import { expect, test } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/?view=attention-stage";
const evidenceDirectory = "tmp/codex/economics-demand-shift-attention-stage";

test("attention stage recomposes one retained graph across semantic frames", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(route);

  const publication = page.locator("[data-kp-economics-static-publication]");
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

  await deck.getByRole("button", { name: "Continue" }).click();
  await expect(publication).toHaveAttribute(
    "data-kp-economics-attention-framing",
    "inspect"
  );
  await expect(page.locator("[data-kp-editor-graph-svg]")).toHaveCount(1);
  await expect(errors).toEqual([]);

  await mkdir(evidenceDirectory, { recursive: true });
  await publication.locator(
    ".kp-economics-static-publication__projection"
  ).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `${evidenceDirectory}/desktop-inspect.png`,
    fullPage: false
  });
});

test("direct attention frames remain stable and usable on a phone", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${route}&scene=conclude`);

  const publication = page.locator("[data-kp-economics-static-publication]");
  await expect(publication).toHaveAttribute(
    "data-kp-economics-attention-framing",
    "quiet-reference"
  );
  await expect(publication).toHaveAttribute(
    "data-kp-economics-deck-scene",
    "conclude"
  );
  await expect(page.locator("[data-kp-editor-graph-svg]")).toHaveCount(1);
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
