import { expect, test } from "@playwright/test";
import { buildKpVisualContactSheetHtml, type KpVisualContactSheetItem } from "../scripts/capture-visual-contact-sheet.ts";
import { env, combination } from "../src/experiments/matrix-column-combinations/model.ts";

const route = "/experiments/matrix-column-combinations/";
test("columns and coefficients retain source identity through readable weighted-sum milestones", async ({ page }, info) => {
  test.setTimeout(60000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1200, height: 950 }); await page.goto(route);
  const root = page.locator("#comb-player"); await expect(root).toHaveAttribute("data-ready", "true");
  const chooser = page.getByRole("combobox", { name: "Milestone" });
  const slider = page.getByRole("slider", { name: "Animation position" });
  const captures: KpVisualContactSheetItem[] = [];
  for (let i = 0; i < 6; i++) {
    await chooser.selectOption(String(i));
    const file = info.outputPath(`step-${i}.png`);
    const buffer = await page.locator(".matrix-card").screenshot({ path: file });
    captures.push({ id: String(i), label: await root.getAttribute("data-milestone") ?? "", progress: i / 5,
      viewport: { width: 1200, height: 950 }, file, dataUrl: `data:image/png;base64,${buffer.toString("base64")}` });
  }
  for (const [i, expected] of [[0, "4"], [1, "10"]] as const) {
    const native = page.locator(`[data-kp-comb-key="c-${i}-0"]`);
    await expect(native).toHaveText(expected); await expect(native).toHaveCSS("opacity", "1");
    await expect(page.locator(`[data-kp-comb-key="c-${i}-1"]`)).toHaveCSS("opacity", "0");
  }
  for (const term of combination.terms) {
    for (const [i, entry] of term.vector.entries.entries()) {
      await expect(page.locator(`[data-occurrence="column-${term.index}-${i}"]`)).toHaveAttribute("data-source-id", entry.id);
    }
    await expect(page.locator(`[data-occurrence="weight-${term.index}"]`)).toHaveAttribute("data-source-id", env.B.rows[term.index]![0]!.id);
  }
  await expect(page.locator(".comb-material [data-kp-comb-key]")).toHaveCount(0);
  for (const p of [0.1, 0.3, 0.9]) {
    await slider.fill(String(p)); await page.locator(".matrix-card").screenshot({ path: info.outputPath(`transit-${p}.png`) });
  }
  const poses = () => page.locator(".comb-paint").evaluateAll(nodes => nodes.map(node => node.getAttribute("style")));
  await slider.fill("0.3"); const held = await poses();
  await slider.fill("1"); await slider.fill("0"); await slider.fill("0.3"); expect(await poses()).toEqual(held);
  await slider.press("Home"); await expect(root).toHaveAttribute("data-milestone", "initial");
  await page.getByRole("button", { name: "Next milestone" }).click();
  await expect(page.locator(".comb-stage")).toHaveAttribute("data-progress", "0.2", { timeout: 5000 });
  await slider.press("End"); await expect(root).toHaveAttribute("data-milestone", "placed");
  await page.setViewportSize({ width: 390, height: 844 }); await chooser.selectOption("4");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("phone.png"), fullPage: true });
  await page.emulateMedia({ colorScheme: "dark" }); await page.screenshot({ path: info.outputPath("dark.png"), fullPage: true });
  expect(errors).toEqual([]);
  const sheet = await page.context().newPage(); await sheet.setViewportSize({ width: 1500, height: 1000 });
  await sheet.setContent(buildKpVisualContactSheetHtml(captures, { title: "One product · column combinations", columns: 3, imageFit: "contain", imageHeightPx: 300 }));
  await sheet.screenshot({ path: info.outputPath("contact-sheet.png"), fullPage: true }); await sheet.close();
});

test("reduced-motion controls and deep links reach exact states", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" }); await page.goto(route + "#weights");
  const root = page.locator("#comb-player"); await expect(root).toHaveAttribute("data-ready", "true");
  await expect(root).toHaveAttribute("data-milestone", "weights");
  await page.getByRole("button", { name: "Next step", exact: true }).click(); await expect(root).toHaveAttribute("data-milestone", "scaled");
  await page.getByRole("button", { name: "Previous milestone" }).click(); await expect(root).toHaveAttribute("data-milestone", "weights");
  await page.getByRole("slider").press("End"); await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(root).toHaveAttribute("data-milestone", "initial");
});
