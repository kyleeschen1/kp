import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { compileChangeSource } from "../src/tutorial/change-propagation/model.ts";

const route = "/experiments/change-propagation/";
async function applySource(page: Page, bytes: string) {
  await page.locator("#change-source").fill(bytes);
  await page.getByRole("button", { name: "Preview this source" }).click();
  await expect(page.locator("[data-change-diagnostic]")).toContainText("Preview updated");
}
async function downloadedSource(page: Page, label: string) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: label, exact: true }).click();
  const download = await pending, path = await download.path();
  if (!path) throw new Error("Missing downloaded source");
  return { bytes: readFileSync(path, "utf8"), filename: download.suggestedFilename() };
}
async function setRange(page: Page, selector: string, value: number) {
  await page.locator(selector).evaluate((element, next) => {
    if (!(element instanceof HTMLInputElement)) throw new Error("Expected a range input");
    element.value = String(next); element.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}
test("persistent stage, continuous shrink, reversal, keyboard and zero sensitivity", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await page.setViewportSize({ width: 1200, height: 1050 }); await page.goto(route);
  const card = page.locator(".change-card"); await expect(card).toHaveAttribute("data-kp-focus-deck-static", "false");
  const narrative = await page.locator("[data-kp-focus-deck-viewport]").boundingBox(), stage = await page.locator("[data-change-stage]").boundingBox();
  expect(narrative!.y + narrative!.height).toBeLessThanOrEqual(stage!.y + 1);
  await page.locator(".change-formula").first().evaluate(el => el.setAttribute("data-survivor", "yes"));
  await page.screenshot({ path: info.outputPath("input.png"), fullPage: true });
  for (const p of [3, 3.5, 4, 3.5]) {
    await setRange(page, "[data-kp-focus-deck-scrubber]", p);
    await expect(card).toHaveAttribute("data-change-position", String(p));
  }
  await expect(page.locator('[data-change-value="h"]').first()).toHaveText("+0.22000");
  await expect(page.locator('[data-survivor="yes"]')).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const slider = page.locator("[data-kp-focus-deck-scrubber]");
  await slider.focus(); await slider.press("End"); await expect(card).toHaveAttribute("data-change-position", "4");
  await page.screenshot({ path: info.outputPath("limit.png"), fullPage: true });
  await slider.press("Home"); await expect(card).toHaveAttribute("data-change-position", "0");
  await page.getByRole("button", { name: "Try x = 0" }).click();
  await expect(page.locator('[data-change-value="dy"]')).toHaveText("+0.00000");
  await expect(page.locator('[data-change-value="deltaY"]')).not.toHaveText("+0.00000");
  await setRange(page, "[data-change-h]", 0);
  await expect(page.locator('[data-change-value="errorPerH"]')).toHaveText("—");
  await setRange(page, "[data-change-h]", -.3);
  await expect(page.locator('[data-change-value="h"]').first()).toHaveText("−0.30000");
  expect(errors).toEqual([]);
});

test("native travel, URL restoration and interrupted playback share one mathematical sample", async ({ page }) => {
  await page.goto(route + "#step=3.5&x=0&h=-0.4");
  const card = page.locator(".change-card");
  await expect(card).toHaveAttribute("data-change-position", "3.5");
  await expect(page.locator('[data-change-value="h"]').first()).toHaveText("−0.22000");
  await expect(page.locator('[data-change-value="dy"]')).toHaveText("+0.00000");
  await page.locator("[data-kp-focus-deck-viewport]").hover();
  await page.mouse.wheel(-600, 0);
  await expect.poll(async () => Number(await card.getAttribute("data-change-position"))).toBeLessThan(3.5);
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await setRange(page, "[data-kp-focus-deck-scrubber]", 2.25);
  await expect(card).toHaveAttribute("data-change-position", "2.25");
  await expect.poll(() => page.url()).toContain("step=2.25");
  await page.reload();
  await expect(card).toHaveAttribute("data-change-position", "2.25");
  await expect(page.locator('[data-change-value="h"]').first()).toHaveText("−0.40000");
});

test("function and prose edits update derived math; rejected drafts retain the valid card", async ({ page }, info) => {
  await page.goto(route); await page.locator(".change-author summary").click();
  const source = JSON.parse(readFileSync("examples/calculus/change-propagation.json", "utf8"));
  source.inner = "x^3"; source.outer = "u^2"; source.title = "A different composition";
  source.steps[0].text = "This source now cubes the input, then squares the intermediate value.";
  await page.locator("#change-source").fill(JSON.stringify(source, null, 2));
  await page.getByRole("button", { name: "Preview this source" }).click();
  await expect(page.locator("[data-change-diagnostic]")).toContainText("Preview updated");
  await expect(page.locator("h1")).toHaveText(source.title);
  await expect(page.locator('[data-change-value="derivative"]')).toHaveText("+1.42383");
  await expect(page.locator('[data-kp-focus-deck-beat="input"]')).toContainText("cubes the input");
  await page.locator(".change-card").screenshot({ path: info.outputPath("source-variation.png") });
  source.inner = "x/z"; await page.locator("#change-source").fill(JSON.stringify(source));
  await page.getByRole("button", { name: "Preview this source" }).click();
  await expect(page.locator("[data-change-diagnostic]")).toContainText("previous card is unchanged");
  await expect(page.locator('[data-change-value="derivative"]')).toHaveText("+1.42383");
});

test("phone stays readable; no-script retains all passages and native mathematics", async ({ page, browser }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto(route);
  await expect(page.locator(".change-card")).toHaveAttribute("data-kp-focus-deck-static", "false");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: info.outputPath("phone.png"), fullPage: true });
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const staticPage = await context.newPage(); await staticPage.goto(route);
    await expect(staticPage.locator(".change-card")).toHaveAttribute("data-kp-focus-deck-static", "true");
    for (const id of ["input", "inner", "outer", "compose", "limit"]) await expect(staticPage.locator(`[data-kp-focus-deck-beat="${id}"]`)).toBeVisible();
    await expect(staticPage.locator(".kp-focus-deck__navigation")).toBeHidden();
    expect(await staticPage.locator("math").count()).toBeGreaterThan(10);
    await staticPage.locator(".change-reading-source summary").click();
    await expect(staticPage.locator(".change-reading-source")).toContainText("prediction of a finite change generally is not");
  } finally { await context.close(); }
});

for (const name of ["stationary-change", "two-reversals"]) {
  test(`${name}: selected source, reverse and revision-pinned recovery agree`, async ({ page }) => {
    const bytes = readFileSync(`content/authoring/transfer/${name}.json`, "utf8");
    const checked = compileChangeSource(bytes);
    if (checked.status !== "checked") throw new Error(checked.message);
    await page.goto(route); await page.locator(".change-author summary").click();
    await applySource(page, bytes);
    await expect(page.locator(".change-card")).toHaveAttribute("data-change-revision", checked.model.revision);
    await expect(page.locator("h1")).toHaveText(checked.model.source.title);
    const initial = await page.locator('[data-change-value="deltaY"]').textContent();
    for (const position of [3.5, 4, 0]) await setRange(page, "[data-kp-focus-deck-scrubber]", position);
    await expect(page.locator('[data-change-value="deltaY"]')).toHaveText(initial!);
    await page.locator(".change-reading-source summary").click();
    await expect(page.locator(".change-reading-source math").first()).toBeVisible();
    await setRange(page, "[data-kp-focus-deck-scrubber]", 3.5);
    await expect.poll(() => page.url()).toContain("step=3.5");
    const pinned = page.url();
    await page.reload();
    await expect(page.locator("[data-change-diagnostic]")).toContainText("different source");
    await expect(page.locator(".change-card")).toHaveAttribute("data-change-position", "0");
    expect(page.url()).toBe(pinned);
    await page.locator(".change-author summary").click(); await applySource(page, bytes);
    await expect(page.locator(".change-card")).toHaveAttribute("data-change-position", "3.5");
    await expect(page.locator(".change-card")).toHaveAttribute("data-change-revision", checked.model.revision);
    await page.evaluate(() => { location.hash = "step=4&x=2&h=0.5"; });
    await expect(page.locator("[data-change-diagnostic]")).toContainText("different source");
    await expect(page.locator(".change-card")).toHaveAttribute("data-change-position", "0");
  });
}

test("failed candidate mount preserves live card, reading, URL and recovery", async ({ page }) => {
  await page.goto(route); await page.locator(".change-author summary").click();
  await setRange(page, "[data-kp-focus-deck-scrubber]", 2);
  await expect.poll(() => page.url()).toContain("step=2");
  const before = page.url();
  await page.locator(".change-card").evaluate(node => node.setAttribute("data-original", "yes"));
  await page.evaluate(() => {
    const Original = window.ResizeObserver;
    window.ResizeObserver = class extends Original {
      constructor(callback: ResizeObserverCallback) {
        super(callback); window.ResizeObserver = Original;
        throw new Error("Injected candidate mount failure");
      }
    };
  });
  const bytes = readFileSync("content/authoring/transfer/stationary-change.json", "utf8");
  await page.locator("#change-source").fill(bytes);
  await page.getByRole("button", { name: "Preview this source" }).click();
  await expect(page.locator("[data-change-diagnostic]")).toContainText("Injected candidate mount failure");
  await expect(page.locator(".change-card")).toHaveAttribute("data-original", "yes");
  await expect(page.locator(".change-staging")).toHaveCount(0);
  expect((await downloadedSource(page, "Download displayed source")).bytes).toBe(readFileSync("examples/calculus/change-propagation.json", "utf8"));
  expect(page.url()).toBe(before);
  await setRange(page, "[data-kp-focus-deck-scrubber]", 1);
  await expect(page.locator(".change-card")).toHaveAttribute("data-change-position", "1");
  await applySource(page, bytes);
  await expect(page.locator("h1")).toHaveText("Zero slope does not mean no change");
  await expect(page.locator(".change-card")).toHaveCount(1);
});

test("draft and displayed downloads retain their own exact bytes after rejection", async ({ page }) => {
  await page.goto(route); await page.locator(".change-author summary").click();
  const bytes = readFileSync("content/authoring/transfer/two-reversals.json", "utf8");
  await applySource(page, bytes);
  const invalid = '{"inner":"x/z"}';
  await page.locator("#change-source").fill(invalid);
  expect(await downloadedSource(page, "Download draft source")).toEqual({ bytes: invalid, filename: "change-propagation-draft.json" });
  expect(await downloadedSource(page, "Download displayed source")).toEqual({ bytes, filename: "change-propagation.json" });
  await page.getByRole("button", { name: "Preview this source" }).click();
  await expect(page.locator("[data-change-diagnostic]")).toContainText("previous card is unchanged");
  expect((await downloadedSource(page, "Download displayed source")).bytes).toBe(bytes);
});

for (const action of ["edit", "dispose"] as const) test(`pending preview cannot publish after ${action}`, async ({ page }) => {
  let release!: () => void, notify!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const requested = new Promise<void>(resolve => { notify = resolve; });
  await page.route("**/change-propagation/view.ts*", async route => { notify(); await held; await route.continue(); });
  await page.goto(route); await page.locator(".change-author summary").click();
  const originalTitle = await page.locator("h1").textContent();
  await page.locator(".change-card").evaluate(node => node.setAttribute("data-original", "yes"));
  const bytes = readFileSync("content/authoring/transfer/stationary-change.json", "utf8");
  await page.locator("#change-source").fill(bytes);
  const apply = page.getByRole("button", { name: "Preview this source" });
  await apply.click(); await requested;
  await apply.dispatchEvent("click"); // A duplicate event must not issue another mount.
  if (action === "edit") await page.locator("#change-source").fill(readFileSync("content/authoring/transfer/two-reversals.json", "utf8"));
  else await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
  release(); await expect(apply).toBeEnabled();
  await expect(page.locator("h1")).toHaveText(originalTitle!);
  await expect(page.locator(".change-card")).toHaveAttribute("data-original", "yes");
  await expect(page.locator(".change-staging")).toHaveCount(0);
  if (action === "edit") {
    await expect(page.locator("[data-change-diagnostic]")).toContainText("Draft changed");
    await apply.click();
    await expect(page.locator("h1")).toHaveText("Two local reversals can make an increase");
  } else {
    await apply.dispatchEvent("click");
    await expect(page.locator("h1")).toHaveText(originalTitle!);
  }
});
