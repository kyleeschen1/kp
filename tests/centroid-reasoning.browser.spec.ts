import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
const route = "/experiments/centroid-reasoning/";

test("beat reading keeps the whole argument and fine-grained evidence through comparison and resizing", async ({ page }, info) => {
  await page.goto(`${route}?reading=beats#extract`);
  const root = page.locator("[data-centroid-local-inspection]");
  const beats = root.locator("[data-centroid-beat]");
  await expect(beats).toHaveCount(8);
  await expect(root.locator(".centroid-narrative")).toBeHidden();
  const text = await beats.allTextContents();
  const whole = root.locator('[data-centroid-beat-select="beat.whole"]');
  await whole.click();
  await expect(root).toHaveAttribute("data-centroid-progress", "0");
  await expect(whole).toHaveAttribute("aria-pressed", "true");
  await root.locator("[data-centroid-because] summary").click();
  await expect(root.locator("[data-centroid-because]")).toHaveAttribute("open", "");
  await expect(whole).toHaveAttribute("aria-pressed", "true");
  await root.locator('[data-centroid-beat-select="beat.return"]').click();
  await expect(root).toHaveAttribute("data-centroid-progress", "0.5");
  const seek = root.locator("[data-centroid-seek]");
  await seek.fill("0.67"); await seek.dispatchEvent("input");
  await root.locator('[data-centroid-beat-claim="division"]').click();
  await expect(root).toHaveAttribute("data-centroid-progress", "0.67");
  for (const mode of ["paragraphs", "beats"]) {
    await root.locator(`button[data-centroid-format="${mode}"]`).click();
    await expect(root).toHaveAttribute("data-centroid-progress", "0.67");
  }
  expect(await beats.allTextContents()).toEqual(text);
  await root.locator('[data-centroid-beat-select="beat.meaning"]').focus();
  await page.keyboard.press("Enter");
  await expect(root).toHaveAttribute("data-centroid-progress", "1");
  await page.screenshot({ path: info.outputPath("centroid-beats.png"), fullPage: true });
  await root.locator('[data-centroid-close]').click();
  await expect(root.locator('button[data-centroid-format="beats"]')).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await beats.allTextContents()).toEqual(text);
  await root.locator('[data-centroid-beat-select="beat.meaning"]').click();
  await root.locator('[data-centroid-close]').click();
  await expect(root.locator('[data-centroid-beat-select="beat.meaning"]')).toBeFocused();
  await page.goto(`${route}#centroid-beat.divide`);
  await expect(root).toHaveAttribute("data-centroid-format", "beats");
  await expect(root.locator('[data-centroid-beat-select="beat.divide"]')).toHaveAttribute("aria-pressed", "true");
  await root.locator('[data-centroid-beat-select="beat.divide"]').focus();
  await page.keyboard.press("Escape");
  await expect(root.locator('[data-centroid-beat-select="beat.divide"]')).toHaveAttribute("aria-pressed", "false");
});

test("phrase attention persists across native handoffs and rewind without moving the rail", async ({ page }, info) => {
  await page.goto(`${route}#centroid-extracted`);
  const root = page.locator("[data-centroid-local-inspection]");
  const claim = root.locator('[data-centroid-claim="answer"]');
  const stage = root.locator('[data-centroid-stage]');
  const seek = root.locator('[data-centroid-seek]');
  const geometry = await stage.boundingBox();
  await claim.click();
  await expect(claim).toHaveAttribute("aria-pressed", "true");
  await expect(root).toHaveAttribute("data-centroid-progress", "0.5");
  expect((await stage.boundingBox())!.height).toBe(geometry!.height);
  for (const progress of [.67, 1, .2, 0, .5]) {
    await seek.evaluate((node, p) => { (node as HTMLInputElement).value = String(p); node.dispatchEvent(new Event("input", { bubbles: true })); }, progress);
    const owner = progress === .67 || progress === .2 ? root.locator('[data-kp-typescript-token-theater]') : root.locator('[data-centroid-native]');
    for (const entity of ["centroid.result.expression", "centroid.caller.result"]) {
      const tokens = owner.locator(`[data-kp-typescript-token-entity-id="${entity}"]`);
      expect(await tokens.count()).toBeGreaterThan(0);
      for (const token of await tokens.all()) await expect(token).toHaveAttribute("data-centroid-salience", "focus");
    }
    await expect(owner.locator('[data-kp-typescript-token-entity-id="centroid.local.sum"]').first()).toHaveAttribute("data-centroid-salience", "context");
  }
  await page.screenshot({ path: info.outputPath("centroid-phrase-attention.png"), fullPage: true });
  await claim.focus();
  await page.keyboard.press("Escape");
  await expect(claim).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Enter");
  await expect(claim).toHaveAttribute("aria-pressed", "true");
  await root.locator('[data-centroid-close]').click();
  await expect(claim).toHaveAttribute("aria-pressed", "false");
  await root.locator('[data-centroid-open]').click();
  await expect(claim).toHaveAttribute("aria-pressed", "true");
  await expect(root).toHaveAttribute("data-centroid-progress", "0.5");
});

test("persistent centroid reasons coordinate long prose without replacing text or losing return", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto(`${route}#extract`);
  const root = page.locator("[data-centroid-local-inspection]");
  const reasons = root.locator("[data-centroid-reason]");
  await expect(reasons).toHaveCount(3);
  const originalText = await reasons.allTextContents();
  await reasons.evaluateAll(nodes => nodes.forEach(node => node.setAttribute("data-test-retained", "true")));
  const button = reasons.first().locator("[data-centroid-select]");
  await button.scrollIntoViewIfNeeded();
  const entryTop = await reasons.first().evaluate(node => node.getBoundingClientRect().top);
  await button.click();
  for (const summary of await root.locator("[data-centroid-depth] > summary").all()) await summary.click();
  const figure = root.locator("[data-centroid-evidence]");
  await expect(figure).toHaveAttribute("data-sticky-fit", "true");
  expect((await root.locator(".centroid-narrative").boundingBox())!.height).toBeGreaterThan((await figure.boundingBox())!.height);
  const seek = root.locator("[data-centroid-seek]");
  const sample = async (p: number) => { await seek.fill(String(p)); await seek.dispatchEvent("input"); };
  await sample(.61);
  await expect(reasons.nth(1)).toHaveAttribute("data-centroid-current", "true");
  await root.evaluate(node => window.scrollTo({ top: scrollY + node.getBoundingClientRect().top + 200, behavior: "instant" }));
  await expect(root).toHaveAttribute("data-centroid-progress", "0.61");
  expect((await figure.boundingBox())!.y).toBeGreaterThanOrEqual(15);
  expect((await figure.boundingBox())!.y).toBeLessThan(40);
  await page.screenshot({ path: info.outputPath("centroid-persistent-long-text.png"), fullPage: true });
  const boxes = () => reasons.evaluateAll(nodes => nodes.map(node => ({ y: node.getBoundingClientRect().top + scrollY, height: node.getBoundingClientRect().height })));
  const before = await boxes();
  for (const p of [.85, .2, .61]) await sample(p);
  expect(await boxes()).toEqual(before);
  expect(await reasons.allTextContents()).toEqual(originalText);
  await expect(root.locator('[data-test-retained="true"]')).toHaveCount(3);
  await root.locator("[data-centroid-close]").click();
  await expect(root).not.toHaveAttribute("data-centroid-inspecting", "true");
  await expect.poll(() => reasons.first().evaluate(node => node.getBoundingClientRect().top)).toBeCloseTo(entryTop, 0);
  await root.locator("[data-centroid-open]").click();
  await expect(root).toHaveAttribute("data-centroid-progress", "0.61");
  await page.setViewportSize({ width: 1000, height: 280 });
  await expect(figure).toHaveAttribute("data-sticky-fit", "false");
  await page.goto(`${route}#centroid-generalized`);
  await expect(root).toHaveAttribute("data-centroid-progress", "1");
  await expect(root.locator('[data-centroid-reason="generalized"]')).toHaveAttribute("data-centroid-current", "true");
  expect(errors).toEqual([]);
});

test("centroid is a source-backed readable record without JavaScript", async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(route);
  await expect(page.getByRole("heading", { name: "Two loops, one idea" })).toBeVisible();
  await expect(page.locator("[data-centroid-excerpt]")).toHaveCount(4);
  const keyword = page.locator('[data-centroid-excerpt="helper"] [data-kp-typescript-syntax-kind="keyword"]').first();
  const identifier = page.locator('[data-centroid-excerpt="helper"] [data-kp-typescript-syntax-kind="identifier"]').first();
  const keywordColor = await keyword.evaluate(node => getComputedStyle(node).color);
  expect(keywordColor).not.toBe(await identifier.evaluate(node => getComputedStyle(node).color));
  await page.screenshot({ path: info.outputPath("centroid-desktop.png"), fullPage: true });
  const disclosure = page.getByText("See both complete source files", { exact: true });
  await disclosure.focus(); await page.keyboard.press("Enter");
  for (const revision of ["before", "after"]) {
    const code = page.locator(`[data-centroid-source="${revision}"] code`);
    await expect(code).toBeVisible();
    expect(await code.textContent()).toBe(readFileSync(`examples/programming/centroid-${revision}.ts`, "utf8"));
  }
  await disclosure.click();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator('[data-centroid-source="before"]')).toBeVisible();
  await expect(keyword).toHaveCSS("color", keywordColor);
  await page.emulateMedia({ media: "screen" });
  await page.setViewportSize({ width: 390, height: 844 });
  await disclosure.click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("centroid-phone.png"), fullPage: true });
  await context.close();
});

test("local extraction animates steps and rewinds names through the native painter", async ({ page }, info) => {
  await page.goto(route);
  const root = page.locator("[data-centroid-local-inspection]");
  await page.getByRole("button", { name: "Trace the first loop" }).click();
  const seek = page.getByRole("slider", { name: "Inspect first-loop extraction" });
  const native = root.locator("[data-centroid-native]");
  const theater = root.locator("[data-kp-typescript-token-theater]");
  const staticKeyword = page.locator('[data-centroid-excerpt="x"] [data-kp-typescript-syntax-kind="keyword"]').first();
  const staticColor = await staticKeyword.evaluate(node => getComputedStyle(node).color);
  await expect(native.locator('[data-kp-typescript-syntax-kind="keyword"]').first()).toHaveCSS("color", staticColor);
  const sample = async (p: number) => { await seek.fill(String(p)); await seek.dispatchEvent("input"); };
  await expect(native).toContainText("const cx = sx / xs.length");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect.poll(async () => Number(await root.getAttribute("data-centroid-progress"))).toBeGreaterThan(0);
  expect(Number(await root.getAttribute("data-centroid-progress"))).toBeLessThan(.5);
  await expect(root).toHaveAttribute("data-centroid-progress", "0.5", { timeout: 6000 });
  await expect(native).toContainText("return sx / xs.length");
  await seek.press("ArrowRight");
  await expect(root).toHaveAttribute("data-centroid-progress", "1", { timeout: 6000 });
  await expect(native).toContainText("return s / vs.length");
  const pose = () => theater.locator("[data-kp-typescript-token-id]").evaluateAll(nodes => nodes.map(node => node.outerHTML).sort());
  await sample(.61); const first = await pose();
  await sample(.85); await sample(.61); expect(await pose()).toEqual(first);
  await page.mouse.wheel(0, 100); await expect(root).toHaveAttribute("data-centroid-progress", "0.61");
  const stageSize = await root.locator("[data-centroid-stage]").boundingBox();
  for (const p of [0, .15, .3, .5, .65, .8, 1]) {
    await sample(p);
    const box = await root.locator("[data-centroid-stage]").boundingBox();
    expect(box?.height).toBe(stageSize?.height);
    expect(box?.width).toBe(stageSize?.width);
    await root.screenshot({ path: info.outputPath(`centroid-motion-${p}.png`) });
  }
  const track = await seek.boundingBox();
  await page.mouse.move(track!.x + track!.width * .7, track!.y + track!.height / 2);
  await page.mouse.down(); await page.mouse.move(track!.x + track!.width * .25, track!.y + track!.height / 2, { steps: 10 }); await page.mouse.up();
  const held = await root.getAttribute("data-centroid-progress");
  expect(Number(held)).toBeGreaterThan(.15); expect(Number(held)).toBeLessThan(.35);
  await expect(root).toHaveAttribute("data-centroid-progress", held!);
  await sample(.24); await page.getByRole("button", { name: "Return to reading" }).click();
  await expect(page.locator('[data-centroid-excerpt="helper"]')).toBeVisible();
  await page.getByRole("button", { name: "Trace the first loop" }).click();
  await expect(root).toHaveAttribute("data-centroid-progress", "0.24");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator('[data-centroid-excerpt="helper"]')).toBeVisible();
  await expect(root.locator("[data-centroid-stage]")).toBeHidden();
});

test("reduced motion reaches named endpoints and stale source cannot mount", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);
  await page.getByRole("button", { name: "Trace the first loop" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator("[data-centroid-local-inspection]")).toHaveAttribute("data-centroid-progress", "0.5");
  await page.route("**/experiments/centroid-reasoning/", async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(/data-centroid-source-pin="[^"]+"/, 'data-centroid-source-pin="stale"') });
  });
  await page.goto(route);
  await expect(page.locator("[data-centroid-error]")).toContainText("source and motion differ");
  await expect(page.locator('[data-centroid-excerpt="helper"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Trace the first loop" })).toBeHidden();
});
