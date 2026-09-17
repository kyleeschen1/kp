import { test, expect } from "@playwright/test";

test("fraction addition uses native merge and numerator evaluation, reversibly", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/fraction-chain/");
  const root = page.locator("#fraction-chain"), slider = page.locator("[data-fraction-progress]");
  await expect(root).toHaveAttribute("data-fraction-ready", "true", { timeout: 60000 });
  const sample = async (position: number) => {
    await slider.fill(String(position));
    await expect(root).toHaveAttribute("data-fraction-position", position.toFixed(3));
    const visible = root.locator('[data-fraction-stage][aria-hidden="false"]');
    await expect(visible).toHaveCount(1);
    await expect(visible.locator("[data-kp-reader-equation-stage]")).toBeVisible();
    const inactive = root.locator('[data-fraction-stage][aria-hidden="true"]');
    expect(await inactive.evaluateAll(elements => elements.some(element => [...element.querySelectorAll<HTMLElement>(".katex, [data-kp-equation-material-owner-id]")]
      .some(owner => owner.checkVisibility({ opacityProperty: true, visibilityProperty: true }))))).toBe(false);
    return visible.evaluate(element => [...element.querySelectorAll<HTMLElement>("[data-kp-equation-material-owner-id]")]
      .map(owner => ({ id: owner.dataset["kpEquationMaterialOwnerId"], transform: owner.style.transform, visibility: owner.style.visibility })));
  };
  for (const position of [0, .25, .5, .75, 1, 1.25, 1.5, 1.75, 2]) await sample(position);
  const first = await sample(.5); await sample(2); expect(await sample(.5)).toEqual(first);
  expect(errors).toEqual([]);
  await page.screenshot({ path: "tmp/codex/fraction-chain-review/addition-merge.png", fullPage: true });
  await sample(1.5);
  await page.screenshot({ path: "tmp/codex/fraction-chain-review/addition-numerator.png", fullPage: true });
  await sample(2);
  await page.screenshot({ path: "tmp/codex/fraction-chain-review/addition-settled.png", fullPage: true });
  for (const position of [2.25, 2.5, 3, 3.5, 4, 4.5, 5]) await sample(position);
  const reduction = await sample(3.5); await sample(5); expect(await sample(3.5)).toEqual(reduction);
  await page.screenshot({ path: "tmp/codex/fraction-chain-review/reduction-transit.png", fullPage: true });
  await sample(5);
  await page.screenshot({ path: "tmp/codex/fraction-chain-review/reduction-settled.png", fullPage: true });
});
