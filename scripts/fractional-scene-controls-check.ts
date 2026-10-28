import assert from "node:assert/strict";
import path from "node:path";
import type { Page } from "playwright";
import { inspectPaint, assertFractionalEvaluationPaint } from "./fractional-linear-theme-comparison.ts";

export async function checkFractionalSceneControls(page: Page, baseUrl: string, outputRoot: string) {
  await page.goto(new URL("/reader/solve-fractional-linear/?kpLesson=lesson.solve-x.fractional-linear&kpVersion=1&kpProgress=917", baseUrl).toString(), { waitUntil: "networkidle" });
  await page.locator("[data-kp-scene-controls]").waitFor();
  await settle(page);
  const baseline = await inspectPaint(page);
  const visible = (sample: typeof baseline) => sample.glyphs.filter((glyph) => glyph.opacity > 0 && glyph.width > 0);
  assert.ok(visible(baseline).every((glyph) => glyph.font.includes("KaTeX")));
  assert.ok(visible(baseline).every((glyph) => glyph.stroke === "0.12px"));
  const proseFont = await page.locator(".kp-animation-beats p").first().evaluate((node) => getComputedStyle(node).fontFamily);
  assert.match(proseFont, /Gill Sans/);
  await page.locator("[data-kp-reader-equation-stage]").screenshot({ path: path.join(outputRoot, "controls-default.png") });

  for (const trim of [0, 0.5]) {
    await setSlider(page, "thinning", trim);
    const paint = await inspectPaint(page);
    assert.ok(visible(paint).every((glyph) => glyph.stroke === `${trim}px`));
    assert.deepEqual(visible(paint).map(({ x, y, width, height }) => ({ x, y, width, height })),
      visible(baseline).map(({ x, y, width, height }) => ({ x, y, width, height })),
      "Optical thinning must not move or resize the glyphs");
    await page.locator("[data-kp-reader-equation-stage]").screenshot({ path: path.join(outputRoot, `controls-trim-${trim}.png`) });
  }
  for (const size of [32, 14, 24]) {
    await setSlider(page, "math-size", size);
    const paint = await inspectPaint(page);
    assert.ok(visible(paint).every((glyph) => Math.abs(Number.parseFloat(glyph.size) - size * 1.21) < 0.1),
      "Native and moving glyphs must use the current math size");
    assert.equal(await page.locator("body").getAttribute("data-kp-reader-progress"), "917");
    await assertFractionalEvaluationPaint(page);
  }
  await setSlider(page, "prose-size", 24);
  assert.equal(await page.locator(".kp-animation-beats p").first().evaluate((node) => getComputedStyle(node).fontSize), "24px");
  assert.equal(await page.locator("body").getAttribute("data-kp-reader-progress"), "917");
  await page.locator("[data-kp-reader-equation-stage]").screenshot({ path: path.join(outputRoot, "controls-adjusted.png") });
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await settle(page);
  assert.equal(await page.locator('[data-kp-scene-control="math-size"]').inputValue(), "19.2");
  assert.ok(visible(await inspectPaint(page)).every((glyph) => glyph.stroke === "0.12px"));
  // Restored native endpoints must inherit the same tuning as moving material.
  await page.getByRole("combobox", { name: "Motion preference" }).selectOption("static");
  await settle(page);
  const native = visible(await inspectPaint(page));
  assert.ok(native.length > 0 && native.every((glyph) => glyph.role === "native" && glyph.stroke === "0.12px"));
  process.stdout.write("Fractional scene controls: font isolation, thinning, size, playhead preservation, reset and native endpoints passed.\n");
}

async function setSlider(page: Page, name: string, value: number) {
  await page.locator(`[data-kp-scene-control="${name}"]`).evaluate((node, next) => {
    const slider = node as HTMLInputElement;
    slider.value = String(next);
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
  await settle(page);
}

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}
