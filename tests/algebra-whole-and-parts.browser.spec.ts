import { test, expect } from "@playwright/test";
import source from "../content/authoring/algebra/whole-and-parts.json" with { type: "json" };
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import { compile } from "../src/authoring/algebra/compile.ts";

const route = "/experiments/reusable-reasoning/?example=algebra-intuition&variant=whole-and-parts";
test("whole and parts: selected source, canonical transitions, reversal and source-preserving links", async ({ page }, info) => {
  test.setTimeout(120000);
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await page.setViewportSize({ width: 1280, height: 1000 }); await page.goto(route);
  const root = page.locator("#authored-focus-card"), card = root.locator("[data-composed-reader] [data-composed-card]");
  await expect(root).toHaveAttribute("data-composed-status", "ready", { timeout: 90000 });
  await expect(root).toHaveAttribute("data-composed-revision", compile(source).revisionId);
  await expect(root.locator("[data-composed-title]")).toHaveText(source.editorial.title);
  await expect(card.locator("[data-kp-canonical-equation-host]")).toHaveCount(1);
  await expect(card.locator("[data-kp-reader-transition]")).toHaveCount(3);
  const slider = card.locator("[data-kp-focus-deck-scrubber]");
  const poses = new Map<number, unknown>();
  for (const step of [0, .5, 1, 1.5, 2, 2.5, 3, 2.5, 1.5, .5, 0]) {
    await slider.evaluate((node, value) => { (node as HTMLInputElement).value = String(value); node.dispatchEvent(new Event("input")); }, step);
    await expect.poll(async () => Number(await card.getAttribute("data-composed-step"))).toBeCloseTo(step, 8);
    if (Number.isInteger(step)) await expect(card).toHaveAttribute("data-common-factor-state", source.states[step]!.id);
    const pose = await card.locator('[data-kp-reader-transition-active="true"]').evaluate(root => [...root.querySelectorAll<HTMLElement>("[data-kp-equation-material-semantic-entity-id]")].map(node => {
      const r = node.getBoundingClientRect(); return { id: node.dataset["kpEquationMaterialSemanticEntityId"], text: node.textContent, x: r.x, y: r.y, opacity: getComputedStyle(node).opacity };
    }));
    if (step % 1) expect(pose.length).toBeGreaterThan(0);
    if (poses.has(step)) expect(pose).toEqual(poses.get(step)); else poses.set(step, pose);
    if (Number.isInteger(step)) await card.screenshot({ path: info.outputPath(`step-${step}.png`) });
  }
  const first = await root.locator('[data-composed-intuition="collect"]').getAttribute("href");
  expect(first).toContain("variant=whole-and-parts");
  await page.goto(`/experiments/reusable-reasoning/${first!}`);
  await expect(root).toHaveAttribute("data-intuition-status", "ready", { timeout: 90000 });
  await expect(root).toHaveAttribute("data-composed-revision", compile(source).revisionId);
  await root.locator("[data-composed-intuition-return]").click();
  expect(page.url()).toContain("variant=whole-and-parts");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(card).toHaveAttribute("data-common-factor-state", source.states[0]!.id);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const text = await card.locator("[data-kp-focus-deck-viewport]").boundingBox(), stage = await card.locator("[data-distribution-stage]").boundingBox();
  expect(text!.y + text!.height).toBeLessThanOrEqual(stage!.y + 1);
  expect((await card.boundingBox())!.height).toBeLessThan(844);
  await card.screenshot({ path: info.outputPath("phone.png") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await slider.focus(); await slider.press("End"); await expect(card).toHaveAttribute("data-composed-step", "3");
  await page.goto("/experiments/reusable-reasoning/?example=algebra-intuition");
  await expect(root).toHaveAttribute("data-composed-status", "ready", { timeout: 90000 });
  await expect(root).toHaveAttribute("data-composed-revision", compile(primary).revisionId);
  expect(errors).toEqual([]);
});

test("selected source has complete native static meaning without script", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage(); await page.goto(`http://localhost:8000${route}`);
    await expect(page.locator("[data-composed-title]")).toHaveText(source.editorial.title);
    await expect(page.locator("[data-composed-reader]")).toBeHidden();
    await expect(page.getByRole("heading", { name: "Verified endpoints" })).toBeVisible();
    for (const state of source.states) expect(await page.locator("body").textContent()).toContain(state.narration);
    expect(await page.locator("math").count()).toBeGreaterThanOrEqual(4);
  } finally { await context.close(); }
});

test("missing or malformed embedded source cannot silently mount the primary", async ({ page }) => {
  await page.route("**/experiments/reusable-reasoning/?example=algebra-intuition&variant=whole-and-parts", async route => {
    const response = await route.fetch(), body = (await response.text()).replace(/(<script type="application\/json" data-composed-initial-source>).*?(<\/script>)/, "$1{}$2");
    await route.fulfill({ response, body });
  });
  await page.goto(route);
  await expect(page.locator("#authored-focus-card")).toHaveAttribute("data-composed-status", "repair-gap");
  await expect(page.locator("[data-composed-error]")).toBeVisible();
});
