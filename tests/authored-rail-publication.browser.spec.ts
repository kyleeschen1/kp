import { test, expect, type Locator, type Page } from "@playwright/test";
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { authoredRailExample, compileAuthoredRailPublication } from "../src/tutorial/mechanics-relations/authored-rail-publication.ts";
import { railSelectionPath, selectAuthoredRail } from "../scripts/rail-authoring-selection.ts";

const route = "/experiments/authored-rails/";
const source = readFileSync(authoredRailExample, "utf8");
let previous: string | undefined;
test.beforeAll(() => {
  previous = existsSync(railSelectionPath) ? readFileSync(railSelectionPath, "utf8") : undefined;
  const result = selectAuthoredRail(process.cwd(), authoredRailExample, source);
  expect(result.status).toBe("checked");
});
test.afterAll(() => {
  if (previous === undefined) rmSync(railSelectionPath, { force: true });
  else writeFileSync(railSelectionPath, previous);
});

test("selected Article retains native rails, reverse drag and exact refinement return", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(route + "#energy-from-momentum");
  const energy = page.locator('[data-derivation-namespace="energy"]');
  const handle = energy.getByRole("slider", { name: "Derivation lens", exact: true });
  await expect(handle).toBeEnabled({ timeout: 30000 });
  await expect(energy.locator('[data-derivation-stage]')).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  for (const position of [.55, .25, .55]) {
    await dragTo(page, energy, position);
    await expect.poll(async () => Number(await energy.getAttribute("data-derivation-progress"))).toBeCloseTo(position, 1);
  }
  await page.locator("#energy-from-momentum").screenshot({ path: info.outputPath("authored-energy-inspection.png") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await handle.focus(); await handle.press("End");
  await expect(energy).toHaveAttribute("data-derivation-progress", "3");
  await energy.locator('[data-refinement-expand="cancel-mass"]').click();
  await energy.locator('[data-refinement-local-return]').last().click();
  await expect(energy).toHaveAttribute("data-derivation-progress", "3");
  await handle.focus(); await handle.press("Home");
  await expect(energy).toHaveAttribute("data-derivation-progress", "0");
  const power = page.locator('[data-derivation-namespace="power"]');
  await power.scrollIntoViewIfNeeded();
  const powerHandle = power.getByRole("slider", { name: "Derivation lens", exact: true });
  await expect(powerHandle).toBeEnabled({ timeout: 30000 });
  await powerHandle.focus(); await powerHandle.press("End");
  await expect(power).toHaveAttribute("data-derivation-progress", "1");
  await power.locator('[data-refinement-expand]').first().click();
  await expect(power).toHaveAttribute("data-derivation-detail", "mass-refinement");
  await power.locator('[data-refinement-collapse]').first().click();
  await expect(power).toHaveAttribute("data-derivation-progress", "1");
  await powerHandle.focus(); await powerHandle.press("Home");
  await expect(power).toHaveAttribute("data-derivation-progress", "0");
  await page.locator("#force-to-energy").screenshot({ path: info.outputPath("authored-power.png") });
  await expect(page.locator('[data-repair="true"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("a source-only edit reaches the host and an invalid draft leaves it unchanged", async ({ page }) => {
  const changed = source.replace(/:::kp-passage\{#force-to-energy\}[\s\S]*?\n:::/, "")
    .replace("What does energy keep—and what does it leave out?", "A selected author revision");
  try {
    const result = selectAuthoredRail(process.cwd(), "examples/selected-author.article.md", changed);
    expect(result.status).toBe("checked"); if (result.status !== "checked") return;
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("A selected author revision");
    await expect(page.locator('[data-authored-rail-revision]')).toHaveAttribute("data-authored-rail-revision", result.sourceRevision);
    await expect(page.locator('[data-derivation-namespace="power"]')).toHaveCount(0);
    expect(selectAuthoredRail(process.cwd(), "bad.md", changed.replace("physics.energy-from-momentum@1", "physics.unknown@1")).status).toBe("repair");
    await page.reload();
    await expect(page.locator('[data-authored-rail-revision]')).toHaveAttribute("data-authored-rail-revision", result.sourceRevision);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("A selected author revision");
  } finally { selectAuthoredRail(process.cwd(), authoredRailExample, source); }
});

test("selected source remains readable without JavaScript with shared typography", async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1100, height: 850 } });
  try {
    const page = await context.newPage(); await page.goto(route);
    const checked = compileAuthoredRailPublication(source, authoredRailExample);
    expect(checked.status).toBe("checked"); if (checked.status !== "checked") return;
    await expect(page.locator('[data-authored-rail-revision]')).toHaveAttribute("data-authored-rail-revision", checked.sourceRevision);
    await expect(page.locator('[data-energy-derivation]')).toHaveCount(2);
    await expect(page.locator('#takeaway')).toContainText("How is energy changing?");
    await expect(page.locator('[data-derivation-handle]').first()).toBeHidden();
    expect(await page.locator('.energy-derivation-history > li > .energy-derivation-equation math').count()).toBe(6);
    await page.screenshot({ path: info.outputPath("authored-static-reading.png"), fullPage: true });
    const typography = () => page.locator("main article > p").first().evaluate(el => {
      const style = getComputedStyle(el); return [style.fontFamily, style.fontSize, style.lineHeight];
    });
    const selected = await typography(); await page.goto("/experiments/mechanics-relations/");
    expect(await typography()).toEqual(selected);
  } finally { await context.close(); }
});

test("phone preview retains readable equations and keyboard docking", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route + "#energy-from-momentum");
  const energy = page.locator('[data-derivation-namespace="energy"]');
  const handle = energy.getByRole("slider", { name: "Derivation lens", exact: true });
  await expect(handle).toBeEnabled({ timeout: 30000 });
  await handle.focus(); await handle.press("End");
  await expect(energy).toHaveAttribute("data-derivation-progress", "3");
  await handle.press("Home");
  await expect(energy).toHaveAttribute("data-derivation-progress", "0");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: info.outputPath("authored-phone.png") });
});

async function dragTo(page: Page, root: Locator, position: number) {
  const handle = root.getByRole("slider", { name: "Derivation lens", exact: true });
  await handle.scrollIntoViewIfNeeded();
  const box = (await handle.boundingBox())!;
  const first = (await root.locator('[data-derivation-row="0"] .energy-derivation-equation').boundingBox())!;
  const last = (await root.locator('[data-derivation-row="1"] .energy-derivation-equation').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, first.y + first.height / 2 + (last.y - first.y) * position, { steps: 8 });
  await page.mouse.up();
}
