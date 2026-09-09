import { test, expect } from "@playwright/test";
import { buildCommonFactorEdition } from "../scripts/build-common-factor-edition.ts";
import { relative } from "node:path";
import { createKpCommonFactorExample } from "../src/authoring/common-factor-author-check.ts";

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
  await page.locator("[data-common-factor-reading]").selectOption("compact");
  const reading = page.locator("[data-common-factor-reading-output]");
  await expect(reading.locator("h2")).toHaveText("Compact reading");
  await expect(reading).toHaveAttribute("data-revision", (await root.getAttribute("data-common-factor-revision"))!);
  await expect(reading).toContainText("common factor may be zero");
  await expect(reading.locator("math")).toHaveCount(2);
  for (const kind of ["prediction", "reconstruction"]) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate(node => {
      const input = node as HTMLInputElement; input.value = "0.37"; input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await expect(card).toHaveAttribute("data-common-factor-progress", "0.37");
    const origin = page.locator(`[data-common-factor-practice="${kind}"]`);
    await origin.click();
    await expect(page.locator("[data-common-factor-practice-panel]")).toBeVisible();
    await expect(page.locator("[data-reasoning-editor]")).toBeHidden();
    await expect(page.locator("[data-common-factor-answer]")).toBeHidden();
    await expect(card).toHaveAttribute("data-common-factor-progress", "0");
    await page.locator("[data-common-factor-working]").fill("Distribute to check; no division required.");
    await page.locator("[data-common-factor-reveal]").click();
    await expect.poll(async () => Number(await card.getAttribute("data-common-factor-progress"))).toBeGreaterThan(0);
    expect(Number(await card.getAttribute("data-common-factor-progress"))).toBeLessThan(1);
    await expect(card).toHaveAttribute("data-common-factor-progress", "1", { timeout: 10_000 });
    await expect(page.locator("[data-common-factor-answer]")).toContainText("no division");
    await page.locator("[data-common-factor-return]").click();
    await expect(card).toHaveAttribute("data-common-factor-progress", "0.37");
    await expect(origin).toBeFocused();
    await expect(reading.locator("h2")).toHaveText("Compact reading");
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator("[data-kp-canonical-equation-host]")).toHaveAttribute("data-kp-reader-canonical-paint-owner", "true");
  await card.screenshot({ path: info.outputPath("primary-phone.png") });
  expect(errors).toEqual([]);
});

test("primary local edition renders math and self-checks with JavaScript disabled", async ({ browser }, info) => {
  const edition = buildCommonFactorEdition("src/authoring/examples/common-factor-primary.json");
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    const response = await page.goto(`http://localhost:8000/${relative(process.cwd(), edition.directory)}/index.html`);
    expect(response?.ok()).toBe(true);
    await expect(page.locator("h1")).toHaveText(createKpCommonFactorExample().editorial.title);
    await expect(page.locator("math")).toHaveCount(6);
    await expect(page.locator("[data-common-factor-publication-revision]")).toHaveAttribute("data-common-factor-publication-revision", edition.revisionId);
    await page.getByText("Compact reading", { exact: true }).first().click();
    await page.getByText("Compare with the verified answer", { exact: true }).first().click();
    await expect(page.getByText("Distributing the common factor recovers both ordered products.", { exact: false }).first()).toBeVisible();
    await page.screenshot({ path: info.outputPath("static-edition.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await context.close(); }
});
