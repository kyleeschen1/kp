import { expect, test } from "@playwright/test";
import { buildKpVisualContactSheetHtml, type KpVisualContactSheetItem } from "../scripts/capture-visual-contact-sheet.ts";
import { matrixColumnStory, timeline } from "../src/experiments/matrix-column-product/score.ts";

const route = "/experiments/matrix-column-product/";
test("column copies, dot products and results have deterministic visible milestones", async ({ page }, info) => {
  // This review packet captures eleven endpoints plus transit, phone and sheet;
  // its capture budget is separate from the five-second behavior assertions.
  test.setTimeout(60000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1200, height: 950 });
  await page.goto(route);
  const root = page.locator("#matrix-player");
  await expect(root).toHaveAttribute("data-ready", "true");
  const select = page.getByRole("combobox", { name: "Milestone" });
  const captures: KpVisualContactSheetItem[] = [];
  for (const i of [0, 1, 2, 3, 4, 5, 6, 9, 10, 11, 12]) {
    await select.selectOption(String(i));
    await expect(root).not.toHaveAttribute("data-gap", "true");
    const file = info.outputPath(`step-${i}.png`);
    const buffer = await page.locator(".matrix-card").screenshot({ path: file });
    captures.push({ id: String(i), label: await root.getAttribute("data-milestone") ?? "", progress: i / 12,
      viewport: { width: 1200, height: 950 }, file, dataUrl: `data:image/png;base64,${buffer.toString("base64")}` });
  }
  for (const [key, value] of [["c-0-0", "4"], ["c-0-1", "4"], ["c-1-0", "10"], ["c-1-1", "8"]]) {
    const entry = page.locator(`[data-kp-matrix-key="${key}"]`);
    await expect(entry).toHaveText(value!); await expect(entry).toHaveCSS("opacity", "1");
  }
  const slider = page.getByRole("slider", { name: "Animation position" });
  await expect(page.locator(".matrix-material [data-kp-matrix-key]")).toHaveCount(0);
  const stops = timeline(matrixColumnStory()).stops;
  for (const i of [2, 5, 6]) {
    await slider.fill(((stops[i - 1]! + stops[i]!) / 2).toFixed(4));
    if (i === 2) {
      // A lifted column must not pass through its unchanged native source.
      const b = await page.locator('[data-matrix="b"]').boundingBox();
      const copies = await page.locator('[data-occurrence^="column.0.copy.0"]').evaluateAll(nodes => nodes.map(n => {
        const r = n.getBoundingClientRect(); return { top: r.top, bottom: r.bottom };
      }));
      expect(copies.every(r => r.bottom < b!.y)).toBe(true);
    }
    if (i === 5) {
      // The evaluated expression remains readable; contributors do not collapse
      // into each other while a new numerical result is being introduced.
      for (const k of [0, 1]) {
        const paint = await page.locator(`[data-occurrence="column.0.copy.0.entry.${k}"]`).boundingBox();
        const slot = await page.locator(`[data-kp-matrix-key="w-0-0-r${k}"]`).boundingBox();
        expect(Math.abs(paint!.x + paint!.width / 2 - slot!.x - slot!.width / 2)).toBeLessThan(1);
      }
    }
    await page.locator(".matrix-card").screenshot({ path: info.outputPath(`transit-${i}.png`) });
  }
  await slider.fill("0.35");
  const poses = () => page.locator(".matrix-paint").evaluateAll(nodes => nodes.map(n => (n as HTMLElement).getAttribute("style")));
  const held = await poses();
  await slider.fill("1"); await slider.fill("0"); await slider.fill("0.35");
  expect(await poses()).toEqual(held);
  await slider.press("Home"); await expect(root).toHaveAttribute("data-milestone", "initial");
  await page.getByRole("button", { name: "Next milestone" }).click();
  await expect(page.locator("[data-matrix-stage]")).toHaveAttribute("data-progress", String(timeline(matrixColumnStory()).stops[1]), { timeout: 5000 });
  await slider.press("End"); await expect(root).toHaveAttribute("data-milestone", "complete");
  await page.setViewportSize({ width: 390, height: 844 });
  await select.selectOption("4");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("phone.png"), fullPage: true });
  expect(errors).toEqual([]);
  const sheet = await page.context().newPage(); await sheet.setViewportSize({ width: 1500, height: 1000 });
  await sheet.setContent(buildKpVisualContactSheetHtml(captures, { title: "Matrix product · column-first candidate", columns: 3, imageFit: "contain", imageHeightPx: 300 }));
  await sheet.screenshot({ path: info.outputPath("contact-sheet.png"), fullPage: true }); await sheet.close();
});

test("reduced motion and URL restore select exact milestones", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route + "#place-first");
  await expect(page.locator("#matrix-player")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#matrix-player")).toHaveAttribute("data-milestone", "place-first");
  await page.getByRole("button", { name: "Next milestone" }).click();
  await expect(page.locator("#matrix-player")).toHaveAttribute("data-milestone", "lift-second");
  await page.getByRole("button", { name: "Previous milestone" }).click();
  await expect(page.locator("#matrix-player")).toHaveAttribute("data-milestone", "place-first");
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(page.locator("#matrix-player")).toHaveAttribute("data-milestone", "lift-second");
});
