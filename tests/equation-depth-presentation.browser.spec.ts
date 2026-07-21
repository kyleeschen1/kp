import { expect, test, type Locator } from "@playwright/test";

const readerRoute = (progress: number) =>
  "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1" +
  `&kpProgress=${progress}`;

test("active KaTeX terms share bounded semantic depth across editor and reader", async ({ page }) => {
  await page.goto("/?animation=editor-animation.animation.linear-solve.solve-x");
  const player = page.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  await player.locator('[data-action="seek-editor-animation"]').fill("0.517");
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0.517");
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
  const editorPlus = player.locator(
    '[data-kp-equation-material-owner-id="linear-solve.lhs.plus3"]'
  );
  const editorX = player.locator(
    '[data-kp-equation-material-owner-id="linear-solve.lhs.x"]'
  );
  await expect(editorPlus).toHaveAttribute("data-kp-equation-semantic-depth", /.+/);
  await expect(editorX).not.toHaveAttribute("data-kp-equation-semantic-depth", /.+/);
  const editor = await depthEvidence(editorPlus, "data-kp-equation-semantic-depth");

  await page.goto(readerRoute(517));
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-depth-recipe",
    "semantic-depth-v1"
  );
  const readerPlus = page.locator(
    '[data-kp-reader-equation-material-fragment-id*="after-subtract.lhs.plus3"]'
  );
  const readerX = page.locator(
    '[data-kp-reader-equation-material-fragment-id*="after-subtract.lhs.x"]'
  );
  await expect(readerPlus).toHaveAttribute(
    "data-kp-reader-equation-semantic-depth",
    /.+/
  );
  await expect(readerX).not.toHaveAttribute(
    "data-kp-reader-equation-semantic-depth",
    /.+/
  );
  const reader = await depthEvidence(
    readerPlus,
    "data-kp-reader-equation-semantic-depth"
  );

  expect(editor.elevation).toBeGreaterThan(0.99);
  expect(reader.elevation).toBeCloseTo(editor.elevation, 4);
  expect(editor.filter).toContain("drop-shadow");
  expect(reader.filter).toContain("drop-shadow");
  expect(editor.fontFamily).toContain("KaTeX");
  expect(reader.fontFamily).toContain("KaTeX");
  expect(editor.transform).toContain("scale(1.025)");
  expect(reader.transform).toContain("scale(1.025)");
});

test("semantic depth is exactly flat at native endpoints", async ({ page }) => {
  for (const progress of [0, 1000]) {
    await page.goto(readerRoute(progress));
    const depthFragments = page.locator(
      "[data-kp-reader-equation-semantic-depth]"
    );
    const elevations = await depthFragments.evaluateAll((elements) =>
      elements.map((element) => Number(
        (element as HTMLElement).dataset["kpReaderEquationSemanticDepth"]
      ))
    );
    expect(elevations.every((elevation) => elevation === 0)).toBe(true);
    for (const filter of await depthFragments.evaluateAll((elements) =>
      elements.map((element) => (element as HTMLElement).style.filter)
    )) {
      expect(filter).toBe("none");
    }
  }
});

async function depthEvidence(
  locator: Locator,
  attribute: string
): Promise<{
  elevation: number;
  transform: string;
  filter: string;
  fontFamily: string;
}> {
  return locator.evaluate((element, depthAttribute) => {
    const glyph = element.querySelector<HTMLElement>(".mord") ?? element;
    return {
      elevation: Number(element.getAttribute(depthAttribute)),
      transform: (element as HTMLElement).style.transform,
      filter: (element as HTMLElement).style.filter,
      fontFamily: getComputedStyle(glyph).fontFamily
    };
  }, attribute);
}
