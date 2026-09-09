import { test, expect } from "@playwright/test";

test("primary factoring traverses native endpoints, direct reverse and shared controls", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/reusable-reasoning/?example=common-factor");
  const root = page.locator("#authored-focus-card"), card = page.locator("[data-common-factor-card]");
  await expect(root).toHaveAttribute("data-common-factor-status", "ready", { timeout: 90_000 });
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  const stage = card.locator("[data-kp-canonical-equation-host]");
  await expect(stage).toHaveAttribute("data-kp-reader-animation-id", /^animation.authored.common-factor\./);
  const slider = card.locator("[data-kp-focus-deck-scrubber]");
  for (const value of ["0", "0.5", "1", "0.5", "0"]) {
    await slider.evaluate((node, selected) => { const input = node as HTMLInputElement; input.value = selected; input.dispatchEvent(new Event("input", { bubbles: true })); }, value);
    await expect(card).toHaveAttribute("data-common-factor-progress", value);
    await expect(stage).toHaveAttribute("data-kp-reader-canonical-paint-owner", "true");
  }
  await card.locator("[data-kp-focus-deck-next]").click();
  await expect.poll(async () => Number(await card.getAttribute("data-common-factor-progress"))).toBeGreaterThan(0);
  expect(Number(await card.getAttribute("data-common-factor-progress"))).toBeLessThan(1);
  await expect(card).toHaveAttribute("data-common-factor-progress", "1", { timeout: 10_000 });
  await expect(card.locator("[data-common-factor-count]")).toHaveText("2 / 2");
  await slider.focus(); await page.keyboard.press("ArrowLeft");
  await expect(card).toHaveAttribute("data-common-factor-progress", "0", { timeout: 10_000 });
  await expect(card.locator("[data-common-factor-count]")).toHaveText("1 / 2");
  await card.locator("[data-distribution-stage]").hover();
  await page.mouse.wheel(420, 0);
  await expect.poll(async () => Number(await card.getAttribute("data-common-factor-progress"))).toBeGreaterThan(0);
  expect(Number(await card.getAttribute("data-common-factor-progress"))).toBeLessThan(1);
  await expect(card).toHaveAttribute("data-common-factor-progress", "1", { timeout: 10_000 });
  await page.mouse.wheel(-420, 0);
  await expect(card).toHaveAttribute("data-common-factor-progress", "0", { timeout: 10_000 });
  await card.screenshot({ path: info.outputPath("primary.png") });
  await page.locator("[data-reasoning-editor] summary").click();
  const editor = page.locator("[data-reasoning-json]");
  const source = JSON.parse(await editor.inputValue());
  const oldRevision = await root.getAttribute("data-common-factor-revision");
  await editor.fill(JSON.stringify({ ...source, states: [source.states[0], { ...source.states[1], latex: "b(b+c)" }] }));
  await page.locator("[data-common-factor-apply]").click();
  await expect(page.locator("[data-reasoning-draft-status]")).toContainText("invalid-factorization");
  await expect(root).toHaveAttribute("data-common-factor-revision", oldRevision!);
  source.editorial.title = "A freshly authored explanation";
  await editor.fill(JSON.stringify(source)); await page.locator("[data-common-factor-apply]").click();
  await expect(page.locator("[data-reasoning-draft-status]")).toHaveText("Displayed revision updated.");
  await expect(root).not.toHaveAttribute("data-common-factor-revision", oldRevision!);
  await expect(card).toHaveCount(1); await expect(page.locator(".common-factor-staging")).toHaveCount(0);
  await expect(page.locator("[data-common-factor-title]")).toHaveText(source.editorial.title);
  expect(errors).toEqual([]);
});
