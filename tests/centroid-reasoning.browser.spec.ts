import { expect, test, type Locator } from "@playwright/test";
import { readFileSync } from "node:fs";
const route = "/experiments/centroid-reasoning/";

test("motion reading follows the existing playhead forward, backward and by sentence without reflow", async ({ page }, info) => {
  await page.goto(`${route}?reading=motion#extract`);
  const root = page.locator("[data-centroid-local-inspection]");
  const stage = root.locator("[data-centroid-stage]");
  const thoughts = root.locator("[data-centroid-thought]");
  const seek = root.locator("[data-centroid-seek]");
  await expect(stage).toBeVisible();
  await expect(thoughts).toHaveCount(3);
  const geometry = () => stage.evaluate(node => { const r = node.getBoundingClientRect(); return { top: r.top + scrollY, height: r.height }; });
  const initial = await geometry();
  for (const [id, progress] of [["boundary", "0.3"], ["answer", "0.5"], ["calculation", "0.1"]]) {
    const sentence = root.locator(`[data-centroid-thought="${id}"]`);
    await sentence.click();
    await expect(root).toHaveAttribute("data-centroid-progress", progress!);
    await expect(sentence).toHaveAttribute("aria-current", "step");
    expect(await geometry()).toEqual(initial);
  }
  for (const [p, id] of [[1, "answer"], [.31, "boundary"], [.12, "calculation"], [.49, "answer"], [0, "calculation"]] as const) {
    await seek.evaluate((node, value) => { if (!(node instanceof HTMLInputElement)) throw new Error("Expected range input"); node.value = String(value); node.dispatchEvent(new Event("input", { bubbles: true })); }, p);
    await expect(root.locator(`[data-centroid-thought="${id}"]`)).toHaveAttribute("aria-current", "step");
    expect(await geometry()).toEqual(initial);
  }
  const evidence = JSON.parse(readFileSync("src/semantic/centroid-extraction.generated.json", "utf8"));
  expect(await root.locator("[data-centroid-native]").textContent()).toBe(evidence.states[0].source);
  await thoughts.nth(1).focus(); await page.keyboard.press("Enter");
  await expect(root).toHaveAttribute("data-centroid-progress", "0.3");
  await root.screenshot({ path: info.outputPath("centroid-motion-reading.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(thoughts.nth(1)).toHaveAttribute("aria-current", "step");
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await thoughts.nth(2).click();
  await expect(root.locator("[data-centroid-native]")).toHaveCSS("opacity", "1");
});

test("stationary caller relationship preserves code geometry, selection and before-state return", async ({ page }, info) => {
  await page.goto(`${route}?reading=relationships#extract`);
  const root = page.locator("[data-centroid-relation]");
  const call = root.locator("[data-centroid-relation-call]");
  const helper = root.locator("[data-centroid-relation-helper]");
  await expect(root).toBeVisible();
  await expect(page.locator("[data-centroid-local-inspection]")).toBeHidden();
  const code = root.locator('[data-relation-source="after"]');
  const box = (node: Locator) => node.evaluate(element => { const r = element.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; });
  const source = await code.textContent();
  const evidence = JSON.parse(readFileSync("src/semantic/centroid-extraction.generated.json", "utf8"));
  expect(source).toBe(evidence.states[2].source);
  const sourceBox = await box(code);
  const callBox = await box(call);
  await call.click();
  await expect(call).toHaveAttribute("aria-pressed", "true");
  await expect(root.locator('[data-relation-note="selected"]')).toBeVisible();
  expect(await helper.evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
  expect(await box(code)).toEqual(sourceBox);
  expect(await box(call)).toEqual(callBox);
  expect(await code.textContent()).toEqual(source);
  await root.screenshot({ path: info.outputPath("centroid-caller-helper.png") });
  const before = root.getByRole("button", { name: "Show before extraction" });
  await before.click();
  await expect(code).toBeHidden();
  await expect(root.locator('[data-relation-source="before"]')).toBeVisible();
  await expect(root.locator('[data-relation-note="before"]')).toBeVisible();
  expect(await root.locator('[data-relation-source="before"]').textContent()).toBe(evidence.states[0].source);
  expect(await box(root.locator('[data-relation-source="before"]'))).toEqual(sourceBox);
  await root.getByRole("button", { name: "Return to helper" }).click();
  await expect(call).toHaveAttribute("aria-pressed", "true");
  expect(await box(call)).toEqual(callBox);
  await call.focus(); await page.keyboard.press("Escape");
  await expect(call).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Enter");
  await expect(call).toHaveAttribute("aria-pressed", "true");
  await root.getByRole("button", { name: "Clear selection" }).click();
  await expect(call).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; });
  await call.click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(call).toHaveAttribute("aria-pressed", "true");
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await expect(helper).toHaveCSS("outline-style", "solid");
});

test("unknown relationship roles fail closed to the readable source", async ({ page }) => {
  await page.route("**/experiments/centroid-reasoning/?reading=relationships", async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('data-relation-role="role.centroid.x.call"', 'data-relation-role="unknown.call"') });
  });
  await page.goto(`${route}?reading=relationships`);
  await expect(page.locator("[data-centroid-relation]")).toBeHidden();
  await expect(page.locator("[data-centroid-error]")).toContainText("unknown call/helper binding");
  await expect(page.locator("[data-centroid-static-helper]")).toBeVisible();
});

test("text rail drag scrolls at both viewport edges and cancels without residual motion", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 420 });
  await page.goto(`${route}?reading=beats#centroid-beat.want-average`);
  await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; });
  const passage = page.locator("[data-centroid-beats]");
  const handle = passage.getByRole("slider", { name: "Explore the argument" });
  await page.locator("[data-centroid-because] summary").click();
  await handle.focus(); await handle.press("Home");
  await handle.scrollIntoViewIfNeeded();
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  const before = await page.evaluate(() => scrollY);
  await page.mouse.move(box.x + box.width / 2, 417);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 30);
  await page.mouse.up();
  await handle.press("End");
  const bottom = await page.evaluate(() => scrollY);
  const end = (await handle.boundingBox())!;
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2);
  await page.mouse.down(); await page.mouse.move(end.x + end.width / 2, 2);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(bottom - 30);
  await handle.dispatchEvent("pointercancel");
  await page.mouse.up();
  await expect(passage).not.toHaveAttribute("data-derivation-dragging", "true");
  const held = await handle.getAttribute("aria-valuenow");
  await page.mouse.wheel(0, 100);
  await expect(handle).toHaveAttribute("aria-valuenow", held!);
  await handle.press("End");
  await page.evaluate(() => { document.documentElement.style.fontSize = "28px"; });
  await expect(handle).toHaveAttribute("aria-valuenow", "7.000");
  await expect.poll(async () => {
    const grip = (await handle.boundingBox())!;
    const text = (await page.locator('[data-centroid-beat="beat.meaning"] p').boundingBox())!;
    return Math.abs(grip.y + grip.height / 2 - text.y - text.height / 2);
  }).toBeLessThan(1);
});

test("beat reading keeps the whole argument and fine-grained evidence through comparison and resizing", async ({ page }, info) => {
  await page.goto(`${route}?reading=beats#extract`);
  const root = page.locator("[data-centroid-local-inspection]");
  const beats = root.locator("[data-centroid-beat]");
  await expect(beats).toHaveCount(8);
  await expect(root.locator(".centroid-narrative")).toBeHidden();
  const text = await beats.allTextContents();
  const handle = root.getByRole("slider", { name: "Explore the argument" });
  const whole = root.locator('[data-centroid-beat="beat.whole"]');
  await whole.locator("p").first().click();
  await expect(root).toHaveAttribute("data-centroid-progress", "0");
  await expect(whole).toHaveAttribute("data-centroid-beat-current", "true");
  await root.locator("[data-centroid-because] summary").click();
  await expect(root.locator("[data-centroid-because]")).toHaveAttribute("open", "");
  await expect(whole).toHaveAttribute("data-centroid-beat-current", "true");
  await root.locator('[data-centroid-beat="beat.return"] p').click({ position: { x: 3, y: 3 } });
  await expect(root).toHaveAttribute("data-centroid-progress", "0.5");
  const rail = root.locator("[data-centroid-text-rail]");
  const y = async (index: number) => beats.nth(index).locator("p").first().evaluate(node => { const rect = node.getBoundingClientRect(); return rect.top + rect.height / 2; });
  await rail.scrollIntoViewIfNeeded();
  const box = (await rail.boundingBox())!;
  await page.mouse.click(box.x, (await y(5)) + ((await y(6)) - (await y(5))) * .34);
  await expect.poll(async () => Number(await root.getAttribute("data-centroid-progress"))).toBeCloseTo(.67, 2);
  const held = await root.getAttribute("data-centroid-progress");
  await root.locator('[data-centroid-beat-claim="division"]').click();
  await expect(root).toHaveAttribute("data-centroid-progress", held!);
  for (const mode of ["paragraphs", "beats"]) {
    await root.locator(`button[data-centroid-format="${mode}"]`).click();
    await expect(root).toHaveAttribute("data-centroid-progress", held!);
  }
  expect(await beats.allTextContents()).toEqual(text);
  await handle.focus();
  await page.keyboard.press("End");
  await expect(root).toHaveAttribute("data-centroid-progress", "1");
  await page.screenshot({ path: info.outputPath("centroid-beats.png"), fullPage: true });
  await root.locator('[data-centroid-close]').click();
  await expect(root.locator('button[data-centroid-format="beats"]')).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await beats.allTextContents()).toEqual(text);
  await handle.focus(); await page.keyboard.press("End");
  await root.locator('[data-centroid-close]').click();
  await expect(handle).toBeFocused();
  await page.goto(`${route}#centroid-beat.divide`);
  await expect(root).toHaveAttribute("data-centroid-format", "beats");
  await expect(handle).toHaveAttribute("aria-valuenow", "2.000");
  await handle.focus();
  await page.keyboard.press("Escape");
  await expect(handle).toHaveAttribute("aria-valuenow", "2.000");
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
