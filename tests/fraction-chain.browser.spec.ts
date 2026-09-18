import { test, expect, type Page } from "@playwright/test";

test("fraction preparation timing records readiness and first and repeat disclosure", async ({ page }) => {
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      if (document.querySelector('[data-fraction-ready="true"]')) {
        performance.mark("fraction-test-ready"); observer.disconnect();
      }
    });
    observer.observe(document, { subtree: true, attributes: true, childList: true });
  });
  const samples = [];
  for (let iteration = 0; iteration < 3; iteration++) {
    await page.goto("/experiments/fraction-chain/");
    await expect(page.locator("[data-fraction-passage]")).toHaveAttribute("data-fraction-ready", "true", { timeout: 20000 });
    samples.push(await page.evaluate(async () => {
      const toggle = document.querySelector<HTMLButtonElement>("[data-fraction-disclosure]")!;
      const click = async () => {
        const start = performance.now(); toggle.click();
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        return performance.now() - start;
      };
      const first = await click(); await click(); const repeat = await click();
      return { readyMs: performance.getEntriesByName("fraction-test-ready")[0]!.startTime, firstDisclosureMs: first, repeatDisclosureMs: repeat };
    }));
  }
  console.log("fraction local browser timings (navigation to ready; click to two paints)", JSON.stringify(samples));
});

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
  // WebKit truncates fractional protocol coordinates. Choose the nearest pixel
  // before dispatch so the input itself stays within half a CSS pixel.
  await page.mouse.click(Math.round(point.x), Math.round(point.y));
  await expect.poll(async () => Number(await page.locator("[data-fraction-passage]").getAttribute("data-fraction-position"))).toBeCloseTo(position, 2);
}

test("composed fraction native endpoints retain typography across every owner", async ({ page }) => {
  for (const route of ["", "numeric/", "two-sided/", "subtraction/"]) {
    await page.goto(`/experiments/fraction-chain/${route}`);
    const root = page.locator("[data-fraction-passage]");
    await expect(root).toHaveAttribute("data-fraction-ready", "true", { timeout: 20000 });
    await root.locator("[data-fraction-disclosure]").click();
    await seek(page, 1.25);
    const endpoints = await root.evaluate(element => {
      const geometry = (equation: Element) => {
        const rects = [...equation.querySelectorAll(":scope > .base")].map(node => node.getBoundingClientRect());
        const x = Math.min(...rects.map(rect => rect.left)), y = Math.min(...rects.map(rect => rect.top));
        return { text: equation.textContent, w: Math.max(...rects.map(rect => rect.right)) - x,
          h: Math.max(...rects.map(rect => rect.bottom)) - y };
      };
      const native = [...element.querySelectorAll('[data-fraction-stage] [data-kp-reader-equation-state] .katex-html, [data-kp-common-denominator-pressure-endpoint] .katex-html')].map(geometry);
      return [...element.querySelectorAll('[data-fraction-row] > .energy-derivation-equation .katex-html')].map(equation => {
        const row = geometry(equation);
        return { row, owners: native.filter(endpoint => endpoint.text === row.text) };
      });
    });
    for (const { row, owners } of endpoints) {
      expect(owners.length, `${route} native endpoint for ${row.text}`).toBeGreaterThan(0);
      for (const endpoint of owners) {
        expect(Math.abs(endpoint.w - row.w), `${route}: ${row.text} width`).toBeLessThan(.5);
        expect(Math.abs(endpoint.h - row.h), `${route}: ${row.text} height`).toBeLessThan(.5);
      }
    }
    for (const position of [1.49, 1.51, 1.99, 2, 1.51, 1.49, .99, 1.01]) await seek(page, position);
    const handle = root.locator("[data-derivation-handle]");
    const grip = await handle.boundingBox();
    await page.mouse.move(grip!.x + grip!.width / 2, grip!.y + grip!.height / 2);
    await page.mouse.down(); await handle.dispatchEvent("pointercancel");
    const held = await root.getAttribute("data-fraction-position");
    await page.mouse.move(grip!.x + grip!.width / 2, 2);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect(root).toHaveAttribute("data-fraction-position", held!);
    await page.mouse.up(); await seek(page, 1.25);
  }
});

test("subtraction retains the minus sign through right-hand scaling and numerator combination", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/fraction-chain/subtraction/");
  const root = page.locator("[data-fraction-passage]");
  await expect(root).toHaveAttribute("data-fraction-ready", /true|repair/, { timeout: 20000 });
  expect(await root.getAttribute("data-fraction-ready"), await root.locator("[data-fraction-status]").textContent() ?? "").toBe("true");
  await seek(page, .99);
  const endpoints = await root.evaluate(element => {
    const selectors = [
      '[data-kp-common-denominator-pressure-endpoint="evaluated"] .katex-html',
      '[data-fraction-row][data-position="1"] .katex-html',
      '[data-fraction-stage="merge"] [data-kp-reader-equation-state] .katex-html'
    ];
    return selectors.map(selector => {
      const equation = element.querySelector(selector)!;
      const rects = [...equation.querySelectorAll(":scope > .base")].map(node => node.getBoundingClientRect());
      const x = Math.min(...rects.map(rect => rect.left));
      const y = Math.min(...rects.map(rect => rect.top));
      return { x, w: Math.max(...rects.map(rect => rect.right)) - x,
        h: Math.max(...rects.map(rect => rect.bottom)) - y };
    });
  });
  // Switching native owners must preserve the endpoint's spacing and alignment.
  for (const endpoint of endpoints.slice(1)) {
    expect(Math.abs(endpoint.x - endpoints[0]!.x)).toBeLessThan(.5);
    expect(Math.abs(endpoint.w - endpoints[0]!.w)).toBeLessThan(.5);
    expect(Math.abs(endpoint.h - endpoints[0]!.h)).toBeLessThan(.5);
  }
  for (const position of [0, .18, .45, .85, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 2, 1.75, 1.25, .45, 0]) await seek(page, position);
  for (const position of [2.06, 2.15, 2.27, 2.15, 2]) {
    await seek(page, position);
    await page.screenshot({ path: `tmp/codex/fraction-chain-review/subtraction-factor-split-${position}.png`, fullPage: true });
  }
  await seek(page, 1.25);
  await page.screenshot({ path: "tmp/codex/fraction-chain-review/subtraction-merge.png", fullPage: true });
  const toggle = root.locator("[data-fraction-disclosure]"), held = Number(await root.getAttribute("data-fraction-position"));
  await toggle.click();
  await expect(root.locator('[data-fraction-detail] .katex-html')).toContainText(/5\s*[−-]\s*2/);
  await seek(page, 1.75); await toggle.click();
  expect(Number(await root.getAttribute("data-fraction-position"))).toBeCloseTo(held, 6);
  expect(errors).toEqual([]);
});

test("two-sided alignment keeps two distinct factor joins inside one native owner", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/fraction-chain/two-sided/");
  const root = page.locator("[data-fraction-passage]");
  await expect(root).toHaveAttribute("data-fraction-ready", /true|repair/, { timeout: 20000 });
  expect(await root.getAttribute("data-fraction-ready"), await root.locator("[data-fraction-status]").textContent() ?? "").toBe("true");
  const stage = root.locator("[data-kp-common-denominator-pressure-stage]");
  await expect(stage).toHaveCount(1);
  await expect(stage).toHaveAttribute("data-kp-common-denominator-pressure-seam", "verified");
  for (const position of [0, .08, .18, .3, .5, .7, .85, 1, 1.25, 1.75, 2, 1, .7, .3, .18, 0]) {
    await seek(page, position);
    await expect(stage).toHaveAttribute("data-kp-common-denominator-pressure-stage", "ready");
  }
  for (const position of [.18, .45, 1]) {
    await seek(page, position);
    await page.screenshot({ path: `tmp/codex/fraction-chain-review/two-sided-${position}.png`, fullPage: true });
  }
  await seek(page, 1.25);
  const toggle = root.locator("[data-fraction-disclosure]"), held = Number(await root.getAttribute("data-fraction-position"));
  await toggle.click(); await seek(page, 1.75); await toggle.click();
  expect(Number(await root.getAttribute("data-fraction-position"))).toBeCloseTo(held, 6);
  expect(errors).toEqual([]);
});

test("numeric variant uses source-only tenths throughout and ends without a reduction surface", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/fraction-chain/numeric/");
  const root = page.locator("[data-fraction-passage]");
  await expect(root).toHaveAttribute("data-fraction-ready", /true|repair/, { timeout: 20000 });
  expect(await root.getAttribute("data-fraction-ready"), await root.locator("[data-fraction-status]").textContent() ?? "").toBe("true");
  await expect(root.locator("[data-fraction-stage]")).toHaveCount(3);
  await expect(root.locator("[data-derivation-handle]")).toHaveAttribute("aria-valuemax", "2");
  const latex = await root.locator('[data-fraction-stage="alignment"] .katex-mathml annotation').allTextContents();
  expect(latex[0]).toContain("{5}"); expect(latex[3]).toContain("{10}");
  for (const position of [0, .08, .3, .85, 1, 1.25, 1.5, 1.75, 2, 1.75, 1.25, .85, .3, 0]) await seek(page, position);
  await seek(page, 1.25);
  const held = Number(await root.getAttribute("data-fraction-position"));
  const toggle = root.locator("[data-fraction-disclosure]");
  await toggle.click(); await seek(page, 1.75); await toggle.click();
  expect(Number(await root.getAttribute("data-fraction-position"))).toBeCloseTo(held, 6);
  await root.locator("[data-derivation-handle]").focus(); await page.keyboard.press("End");
  await expect(root).toHaveAttribute("data-fraction-position", "2.000000");
  await page.screenshot({ path: "tmp/codex/fraction-chain-review/numeric-variant.png", fullPage: true });
  expect(errors).toEqual([]);
});

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
  await expect(root).toHaveAttribute("data-rail-position", "between");
  await expect(root.locator('[data-rail-stop="boundary"]')).toHaveCount(2);
  await expect(root.locator('[data-rail-active="true"]')).toHaveCount(1);
  const handle = root.locator("[data-derivation-handle]"), toggle = root.locator("[data-fraction-disclosure]");
  await handle.focus(); await page.keyboard.press("ArrowDown"); await seek(page, 1.25);
  const held = Number(await root.getAttribute("data-fraction-position"));
  await root.locator('[data-fraction-row][data-position="1"] .energy-derivation-equation').evaluate(element => element.setAttribute("data-retained-probe", "true"));
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(await root.locator('[data-fraction-row][data-fraction-detail]').evaluate(element => getComputedStyle(element, "::before").borderLeftWidth)).toBe("1px");
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

test("fraction, scalar and energy share document and disclosure styles before enhancement", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  let override = false;
  // Vite can inline the shared sheet into a host's CSS response. Apply the
  // simulated shared-token repair to every response carrying that owner.
  await context.route(/\.css(?:\?|$)/, async route => {
    const response = await route.fetch();
    const body = await response.text();
    await route.fulfill({ response, body: body + (override && body.includes(".kp-reasoning-document") ? '\n:root { --kp-focus-card-passage-font: monospace; }' : '') });
  });
  const page = await context.newPage();
  const read = () => page.evaluate(() => {
    const main = document.querySelector("main")!, action = main.querySelector(".energy-derivation-actions button")!;
    const css = getComputedStyle(action), prose = getComputedStyle(main);
    return { font: prose.fontFamily, lineHeight: prose.lineHeight, heading: getComputedStyle(main.querySelector("h1")!).fontFamily,
      controlFont: css.fontFamily, controlBorder: css.borderStyle, controlBackground: css.backgroundColor, controlPadding: css.padding,
      paper: getComputedStyle(document.body).backgroundColor, math: getComputedStyle(main.querySelector(".katex")!).fontFamily };
  });
  const routes = ["fraction-chain/", "scalar-cancellation/?derivation-detail=expandable", "mechanics-relations/?derivation-detail=expandable"];
  const styles = [];
  for (const route of routes) { await page.goto(`http://localhost:8000/experiments/${route}`); styles.push(await read()); }
  expect(styles[0]).toEqual(styles[1]); expect(styles[0]).toEqual(styles[2]);
  expect(styles[0]!.font).toContain("Georgia");
  override = true;
  for (const route of routes) {
    await page.goto(`http://localhost:8000/experiments/${route}`);
    const changed = await read(); expect(changed.font).toBe("monospace"); expect(changed.heading).toBe("monospace");
    expect(changed.math).toBe(styles[0]!.math);
  }
  await context.close();
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
