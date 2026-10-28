import assert from "node:assert/strict";
import path from "node:path";
import type { Page } from "playwright";
import { inspectPaint } from "./fractional-linear-theme-comparison.ts";

export async function checkFractionalRisingPassages(page: Page, baseUrl: string, outputRoot: string) {
  for (const size of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    await page.goto(new URL("/reader/solve-fractional-linear/", baseUrl).toString(), { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.body.dataset["kpReaderLayout"] === "rising-passages");
    const samples = [];
    for (const y of [0.75, 0.5, 0.475, 0.45, 0.5]) {
      await page.evaluate((fraction) => {
        const passage = document.querySelector<HTMLElement>('[data-kp-rising-beat="beat.multiply"]')!;
        const rect = passage.getBoundingClientRect();
        const header = document.querySelector(".kp-reader-masthead")!.getBoundingClientRect().height;
        window.dispatchEvent(new WheelEvent("wheel"));
        window.scrollTo(0, scrollY + rect.top - header - (innerHeight - header) * fraction);
      }, y);
      await settle(page);
      const sample = await page.evaluate(() => {
        const passage = document.querySelector<HTMLElement>('[data-kp-rising-beat="beat.multiply"]')!;
        const stage = document.querySelector<HTMLElement>('[data-kp-reader-equation-stage]')!;
        const rect = passage.getBoundingClientRect();
        const stageRect = stage.getBoundingClientRect();
        const header = document.querySelector(".kp-reader-masthead")!.getBoundingClientRect().height;
        const divider = document.querySelector(".kp-reader-equation-progress")!;
        return { y: (rect.top - header) / (innerHeight - header), header,
          textSizes: [...document.querySelectorAll(".kp-rising-passage h1, .kp-rising-passage h2, .kp-rising-passage p")].map((node) => getComputedStyle(node).fontSize),
          dividerColor: getComputedStyle(divider).backgroundColor,
          opacity: Number(getComputedStyle(passage).opacity),
          stageTop: stageRect.top, stageBottom: stageRect.bottom,
          stageBorder: getComputedStyle(stage).borderTopWidth,
          progress: Number(document.body.dataset["kpReaderProgress"]),
          overflow: document.documentElement.scrollWidth - innerWidth };
      });
      assert.ok(Math.abs(sample.y - y) < 0.002);
      assert.ok(Math.abs(sample.stageBottom - (sample.header + (size.height - sample.header) / 2)) < 1);
      assert.deepEqual([...new Set(sample.textSizes)], ["17px"]);
      assert.equal(sample.dividerColor, "rgba(255, 255, 255, 0.26)");
      assert.equal(sample.stageBorder, "0px");
      assert.ok(sample.overflow <= 1);
      const ink = (await inspectPaint(page)).glyphs.filter((glyph) => glyph.opacity > 0 && glyph.width > 0 && glyph.height > 0);
      const inkBottom = Math.max(...ink.map((glyph) => glyph.y + glyph.height));
      assert.ok(sample.stageBottom - inkBottom >= 12 && sample.stageBottom - inkBottom < 80,
        "The equation should sit near the divider with breathing room");
      samples.push(sample);
      await page.screenshot({ path: path.join(outputRoot, `rising-${size.width}-${samples.length}-${y}.png`) });
    }
    assert.ok(samples[0]!.opacity < samples[1]!.opacity);
    assert.ok(samples[1]!.opacity > 0.999);
    assert.ok(samples[2]!.opacity < samples[1]!.opacity);
    assert.ok(samples[3]!.opacity < 0.001);
    assert.ok(Math.abs(samples[1]!.progress - 667) <= 1);
    assert.deepEqual(samples[1], samples[4], "Rewinding must restore the same layout and emphasis");
    await page.reload({ waitUntil: "networkidle" });
    await settle(page);
    assert.ok(Math.abs(Number(await page.locator("body").getAttribute("data-kp-reader-progress")) - 667) <= 1);
    await page.locator(".kp-rising-navigation summary").click();
    await page.locator(".kp-lesson-toc a").first().click();
    await settle(page);
    assert.equal(await page.locator(".kp-rising-navigation").getAttribute("open"), null);
    assert.equal(await page.locator("body").getAttribute("data-kp-reader-progress"), "0");
  }
  await page.emulateMedia({ media: "print" });
  assert.equal(await page.locator("[data-kp-reader-equation-stage]").evaluate((node) => getComputedStyle(node).display), "none");
  assert.ok(await page.locator(".kp-rising-passage").evaluateAll((nodes) => nodes.every((node) => getComputedStyle(node).opacity === "1")));
  const staticContext = await page.context().browser()!.newContext({ javaScriptEnabled: false });
  try {
    const staticPage = await staticContext.newPage();
    await staticPage.goto(new URL("/reader/solve-fractional-linear/", baseUrl).toString());
    assert.equal(await staticPage.locator("body").getAttribute("data-kp-reader-layout"), null);
    assert.ok(await staticPage.locator(".kp-animation-static .katex").first().isVisible());
  } finally {
    await staticContext.close();
  }
  process.stdout.write("Rising passages: desktop/phone boundary, fade, stage stability, rewind and URL restoration passed.\n");
}

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  await page.waitForTimeout(220); // Includes the existing URL settlement debounce.
}
