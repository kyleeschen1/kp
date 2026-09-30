import { expect, test } from "@playwright/test";
import { passage } from "../src/experiments/dot-product-passage/source.ts";

test("signed dot passage preserves references through pairing, products and sum", async ({ page }, info) => {
  await page.setViewportSize({ width: 1200, height: 950 });
  await page.goto("/experiments/dot-product-passage/");
  const root = page.locator("#dot-player"); await expect(root).toHaveAttribute("data-ready", "true");
  const inputBounds = async (side: string) => page.locator(`[data-kp-dot-key^="${side}-"]`).evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }));
  const row = await inputBounds("left"), column = await inputBounds("right");
  expect(Math.max(...row.map(r => r.y)) - Math.min(...row.map(r => r.y))).toBeLessThan(1);
  expect(Math.max(...column.map(r => r.x)) - Math.min(...column.map(r => r.x))).toBeLessThan(1);
  expect(column[0]!.y).toBeLessThan(column[1]!.y); expect(column[1]!.y).toBeLessThan(column[2]!.y);
  await expect(page.locator('[data-kp-dot-key="left-1"]')).toHaveText("−1");
  await expect(page.locator('[data-kp-dot-key="right-2"]')).toHaveText("−2");
  const chooser = page.getByRole("combobox", { name: "Milestone" });
  const slider = page.getByRole("slider", { name: "Animation position" });
  for (const i of [0, 1, 2, 3]) {
    await chooser.selectOption(String(i));
    await page.locator(".matrix-card").screenshot({ path: info.outputPath(`step-${i}.png`) });
  }
  await expect(page.locator('[data-kp-dot-key="sum"]')).toHaveText("−3");
  await expect(page.locator(".dot-sum")).toHaveCSS("opacity", "1");
  for (const pair of passage.dot.pairs) {
    await expect(page.locator(`[data-kp-dot-key="product-${pair.index}"]`)).toHaveAttribute("data-source-id", pair.product.id);
    for (const side of ["left", "right"] as const) {
      await expect(page.locator(`[data-occurrence="pair-${side}-${pair.index}"]`)).toHaveAttribute("data-source-id", pair[side].id);
    }
  }
  await expect(page.locator(".dot-material [data-kp-dot-key]")).toHaveCount(0);
  for (const p of [.03, .08, .14, .18, .25, .29, .43, .57, .78, .94]) {
    await slider.fill(String(p));
    await page.locator(".matrix-card").screenshot({ path: info.outputPath(`transit-${p}.png`) });
    const moving = await page.locator(".dot-paint").evaluateAll(nodes => nodes.filter(n => getComputedStyle(n).opacity === "1").map(n => {
      // The owner includes line leading; measure the copied scalar's inline box.
      const r = n.firstElementChild!.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    }));
    for (let i = 0; i < moving.length; i++) for (let j = i + 1; j < moving.length; j++) {
      const a = moving[i]!, b = moving[j]!;
      expect(a.right <= b.left + .5 || b.right <= a.left + .5 || a.bottom <= b.top + .5 || b.bottom <= a.top + .5, JSON.stringify({ p, i, j, a, b })).toBe(true);
    }
    const poses = () => page.locator(".dot-stage [style]").evaluateAll(nodes => nodes.map(n => n.getAttribute("style")));
    const held = await poses(); await slider.fill("0"); await slider.fill("1"); await slider.fill(String(p));
    expect(await poses()).toEqual(held);
  }
  await chooser.selectOption("0");
  await page.getByRole("button", { name: "Next milestone" }).click();
  await expect(page.locator(".dot-stage")).toHaveAttribute("data-progress", String(1 / 3));
  await expect(page.locator('.dot-paint').first()).toHaveCSS("opacity", "0");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("phone.png"), fullPage: true });
});

test("menu configuration, native endpoints and reduced motion work for the passage", async ({ page }, info) => {
  await page.goto("/experiments/matrix-examples/");
  await page.getByRole("combobox", { name: "Example", exact: true }).selectOption("dot-passage");
  const child = page.frameLocator("#example-frame");
  await expect(child.locator("#dot-player")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Step instantly", exact: true }).click();
  await child.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(child.locator("#dot-player")).toHaveAttribute("data-milestone", "pairs");
  await child.getByRole("slider").fill("0.57");
  await page.getByRole("button", { name: "Side by side", exact: true }).click();
  await expect(child.getByRole("slider")).toHaveValue("0.57");
  await page.screenshot({ path: info.outputPath("side-layout.png"), fullPage: true });
  await child.getByRole("slider").press("End");
  await child.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(child.getByRole("slider")).toHaveValue("0");
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.getByRole("button", { name: "Reset settings", exact: true }).click();
  await child.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(child.locator("#dot-player")).toHaveAttribute("data-milestone", "pairs");
  await page.screenshot({ path: info.outputPath("dark.png"), fullPage: true });
});
