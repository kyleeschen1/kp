import { test, expect, type Page } from "@playwright/test";

async function seek(page: Page, position: number) {
  const point = await page.evaluate(value => {
    const root = document.querySelector<HTMLElement>("[data-fraction-passage]")!;
    const rows = [...root.querySelectorAll<HTMLElement>("[data-fraction-row]")].filter(row => !row.hidden);
    const right = Math.max(1, rows.findIndex(row => Number(row.dataset["position"]) >= value));
    const left = rows[right - 1]!, next = rows[right]!;
    const center = (row: HTMLElement) => { const r = row.querySelector(".energy-derivation-equation")!.getBoundingClientRect(); return r.top + r.height / 2; };
    const y = center(left) + (center(next) - center(left)) * (value - Number(left.dataset["position"])) / (Number(next.dataset["position"]) - Number(left.dataset["position"]));
    window.scrollBy({ top: y - innerHeight / 2, behavior: "instant" });
    const rail = root.querySelector("[data-fraction-rail]")!.getBoundingClientRect();
    return { x: rail.left + rail.width / 2, y: center(left) + (center(next) - center(left)) * (value - Number(left.dataset["position"])) / (Number(next.dataset["position"]) - Number(left.dataset["position"])) };
  }, position);
  await page.mouse.click(point.x, point.y);
  await expect.poll(async () => Number(await page.locator("[data-fraction-passage]").getAttribute("data-fraction-position"))).toBeCloseTo(position, 2);
}

test("persistent fraction passage seeks through canonical operations and retains disclosure state", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => { errors.push(error.message); console.error(error.stack); });
  await page.goto("/experiments/fraction-chain/");
  const root = page.locator("[data-fraction-passage]");
  await expect(root).toHaveAttribute("data-fraction-ready", /true|repair/, { timeout: 20000 });
  expect(await root.getAttribute("data-fraction-ready"), await root.locator("[data-fraction-status]").textContent() ?? "").toBe("true");
  for (const position of [.08, .3, .85, 1, 1.25, 1.5, 1.75, 2, 2.2, 2.5, 2.8, 3]) {
    await seek(page, position);
    const inactive = root.locator('[data-fraction-stage][aria-hidden="true"]');
    expect(await inactive.evaluateAll(elements => elements.some(element => [...element.querySelectorAll<HTMLElement>(".katex, [data-kp-equation-material-owner-id]")]
      .some(owner => owner.checkVisibility({ opacityProperty: true, visibilityProperty: true }))))).toBe(false);
  }
  await seek(page, 1.25);
  const handle = root.locator("[data-derivation-handle]"), toggle = root.locator("[data-fraction-disclosure]");
  await handle.focus(); await page.keyboard.press("ArrowDown"); await seek(page, 1.25);
  const held = Number(await root.getAttribute("data-fraction-position"));
  await root.locator('[data-fraction-row][data-position="1"] .energy-derivation-equation').evaluate(element => element.setAttribute("data-retained-probe", "true"));
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(root.locator('[data-retained-probe="true"]')).toHaveCount(1);
  expect(Number(await root.getAttribute("data-fraction-position"))).toBeCloseTo(held, 6);
  await seek(page, 1.75);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(Number(await root.getAttribute("data-fraction-position"))).toBeCloseTo(held, 6);
  await page.screenshot({ path: "tmp/codex/fraction-chain-review/persistent-addition.png", fullPage: true });
  await seek(page, .45);
  await page.screenshot({ path: "tmp/codex/fraction-chain-review/alignment.png", fullPage: true });
  await seek(page, 2.5);
  await page.screenshot({ path: "tmp/codex/fraction-chain-review/reduction.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("static Article keeps the complete fraction argument without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage(); await page.goto("http://localhost:8000/experiments/fraction-chain/");
  await expect(page.locator("[data-fraction-row]:visible")).toHaveCount(4);
  await expect(page.locator("[data-fraction-static-detail]")).toBeVisible();
  await expect(page.locator("h1")).toHaveText("Count the same-sized parts");
  await context.close();
});

test("native rule geometry survives hidden ownership and the rail survives font resizing", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/fraction-chain/");
  const root = page.locator("[data-fraction-passage]");
  await expect(root).toHaveAttribute("data-fraction-ready", "true", { timeout: 20000 });
  const geometry = await root.evaluate(async element => {
    const path = "/src/rendering/native-katex-paint-geometry.ts";
    const { measureKpNativeKatexSubtreePaintRect: measure } = await import(path);
    const state = element.querySelector<HTMLElement>('[data-fraction-stage="reduction"] .katex-html')!;
    const previous = state.style.visibility;
    try {
      state.style.visibility = "visible"; const visible = measure(element, state);
      state.style.visibility = "hidden"; const hidden = measure(element, state);
      return { visible, hidden };
    } finally { state.style.visibility = previous; }
  });
  expect(geometry.hidden).toEqual(geometry.visible);
  await seek(page, 2.5);
  await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; });
  await expect.poll(() => root.locator(".energy-derivation-equation").first().evaluate(element => element.getBoundingClientRect().height)).toBe(144);
  for (const position of [2.8, 2.2, 1.75, .45, 0, 3]) await seek(page, position);
  const handle = root.locator("[data-derivation-handle]");
  await handle.focus(); await page.keyboard.press("Home");
  await expect(root).toHaveAttribute("data-fraction-position", "0.000000");
  await expect.poll(() => root.locator('[data-fraction-row][data-position="0"] .katex').evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
  await page.keyboard.press("End");
  await expect(root).toHaveAttribute("data-fraction-position", "3.000000");
  await expect.poll(() => root.locator('[data-fraction-row][data-position="3"] .katex').evaluate(element => innerHeight - element.getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(0);
  await seek(page, 1.25);
  const held = await root.getAttribute("data-fraction-position");
  await page.mouse.wheel(0, 100);
  await expect(root).toHaveAttribute("data-fraction-position", held!);
  await page.setViewportSize({ width: 640, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await root.evaluate(element => { element.style.width = "0px"; });
  await expect.poll(() => root.locator(".fraction-history").evaluate(element => element.getBoundingClientRect().width)).toBe(0);
  // Cross the observer/RAF boundary while collapsed before restoring width.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await root.evaluate(element => { element.style.width = ""; });
  await expect.poll(() => root.locator(".fraction-history").evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThan(0);
  await seek(page, 2.5);
  await page.screenshot({ path: "tmp/codex/fraction-chain-review/large-font.png", fullPage: true });
  expect(await root.evaluate(element => {
    const lane = element.querySelector("[data-fraction-inspection]")!.getBoundingClientRect();
    return [...element.querySelectorAll(".fraction-reason")].filter(reason => reason.getClientRects().length > 0)
      .every(reason => reason.getBoundingClientRect().left > lane.right);
  })).toBe(true);
  await seek(page, 1.5);
  const grip = await handle.boundingBox();
  await page.mouse.move(grip!.x + grip!.width / 2, grip!.y + grip!.height / 2);
  await page.mouse.down(); await page.mouse.move(grip!.x + grip!.width / 2, 797);
  await expect(root).toHaveAttribute("data-fraction-position", "3.000000", { timeout: 10000 });
  await expect.poll(() => root.locator('[data-fraction-row][data-position="3"] .katex').evaluate(element => innerHeight - element.getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(0);
  await page.mouse.move(grip!.x + grip!.width / 2, 3);
  await expect(root).toHaveAttribute("data-fraction-position", "0.000000", { timeout: 10000 });
  await expect.poll(() => root.locator('[data-fraction-row][data-position="0"] .katex').evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
  await page.mouse.up();
  expect(errors).toEqual([]);
});
