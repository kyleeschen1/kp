import { expect, test } from "@playwright/test";

const readerUrl = "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=167";

test("reader material ink preserves source KaTeX typography through first scroll", async ({ page }) => {
  await page.goto(readerUrl);
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-hydrated", "true");
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage.locator("[data-kp-reader-equation-material-owner-id]").first()).toBeAttached();
  await page.evaluate(() => document.fonts.ready);

  const before = await typographySnapshot(page);
  expect(before.fragments.length).toBeGreaterThan(3);
  expect(before.fragments.every((fragment) => fragment.clone.fontFamily === fragment.source.fontFamily))
    .toBe(true);
  expect(before.fragments.every((fragment) => fragment.clone.fontSize === fragment.source.fontSize))
    .toBe(true);
  expect(before.fragments.every((fragment) => /KaTeX_(?:Main|Math)/.test(fragment.clone.fontFamily)))
    .toBe(true);
  expect(before.fragments.some((fragment) => /Inter/.test(fragment.clone.fontFamily))).toBe(false);

  await page.evaluate(() => window.scrollBy(0, 24));
  await page.waitForTimeout(120);
  const after = await typographySnapshot(page);
  expect(after.layoutReads).toBe(before.layoutReads);
  expect(after.fragments.map(({ id, clone }) => ({ id, ...clone })))
    .toEqual(before.fragments.map(({ id, clone }) => ({ id, ...clone })));
});

async function typographySnapshot(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>("[data-kp-reader-equation-stage]");
    if (stage === null) throw new Error("Reader stage is unavailable.");
    const fragments = [...stage.querySelectorAll<HTMLElement>(
      "[data-kp-reader-equation-material-fragment-id]"
    )].flatMap((fragment) => {
      const id = fragment.dataset["kpReaderEquationMaterialFragmentId"];
      if (id === undefined) return [];
      const source = stage.querySelector<HTMLElement>(
        `[data-kp-reader-equation-anchor-id="${CSS.escape(id)}"]`
      );
      const clone = fragment.querySelector<HTMLElement>(
        ".kp-reader-equation-material-visual"
      );
      if (source === null || clone === null) return [];
      return [{ id, source: inkStyle(source), clone: inkStyle(clone) }];
    }).sort((left, right) => left.id.localeCompare(right.id));
    return {
      layoutReads: Number(stage.dataset["kpReaderLayoutReads"] ?? "0"),
      fragments
    };

    function inkStyle(root: HTMLElement) {
      const glyph = root.querySelector<HTMLElement>(".mathnormal, .mord, .mbin, .mrel") ?? root;
      const style = getComputedStyle(glyph);
      return {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontStyle: style.fontStyle,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight
      };
    }
  });
}
