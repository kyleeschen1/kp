import { expect, test } from "@playwright/test";

const route =
  "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=517";

test("masthead and equation remain non-overlapping sticky surfaces", async ({ page }) => {
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(route);
    const masthead = page.locator(".kp-reader-masthead");
    const visual = page.locator(".kp-animation-static");
    await expect(masthead).toBeVisible();
    await expect(visual).toBeVisible();
    await expect(masthead).toHaveCSS(
      "box-shadow",
      "rgba(22, 35, 29, 0.08) 0px 1px 0px 0px, rgba(22, 35, 29, 0.06) 0px 10px 30px 0px"
    );

    await page.evaluate(() => window.scrollBy(0, 180));
    await page.evaluate(() => new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    ));
    const mastheadBounds = await masthead.boundingBox();
    const visualBounds = await visual.boundingBox();
    if (mastheadBounds === null || visualBounds === null) {
      throw new Error("Sticky reader surfaces are not measurable.");
    }
    expect(Math.abs(mastheadBounds.y)).toBeLessThan(0.5);
    expect(visualBounds.y).toBeGreaterThanOrEqual(
      mastheadBounds.y + mastheadBounds.height + 8
    );

    const scrollEvidence = await page.evaluate(() => ({
      documentScrollable: document.documentElement.scrollHeight > window.innerHeight,
      nested: [...document.querySelectorAll<HTMLElement>("body *")].filter((element) => {
        const style = getComputedStyle(element);
        return /(auto|scroll)/.test(style.overflowY) &&
          element.scrollHeight > element.clientHeight + 1;
      }).length
    }));
    expect(scrollEvidence.documentScrollable).toBe(true);
    expect(scrollEvidence.nested).toBe(0);
    await expect(page.locator("[data-kp-reader-share]")).toBeVisible();
  }
});

test("sticky masthead preserves keyboard focus affordance", async ({ page }) => {
  await page.goto(route);
  const share = page.locator("[data-kp-reader-share]");
  await share.focus();
  await expect(share).toBeFocused();
  const outline = await share.evaluate((element) => {
    const style = getComputedStyle(element);
    return { width: style.outlineWidth, style: style.outlineStyle };
  });
  expect(Number.parseFloat(outline.width)).toBeGreaterThanOrEqual(3);
  expect(outline.style).not.toBe("none");
});
