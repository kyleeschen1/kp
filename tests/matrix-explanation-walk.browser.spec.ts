import { expect, test, type Page } from "@playwright/test";

const route = "/experiments/matrix-column-combinations/";
const frames = (page: Page) => page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
const choose = (page: Page, index: number) => page.getByRole("combobox", { name: "Explanation stop" }).selectOption(String(index));
const seek = (page: Page, progress: number) => page.getByRole("slider").evaluate((node, value) => {
  if (!(node instanceof HTMLInputElement)) throw new Error("Expected scrubber");
  node.value = String(value); node.dispatchEvent(new Event("input", { bubbles: true }));
}, progress);
const pose = (page: Page) => page.locator("#comb-player").evaluate(root => {
  const column = root.getAttribute("data-column");
  const panel = root.querySelector(`[data-view="${column}"]`) ?? root;
  const stage = panel.querySelector(".comb-stage")!, bounds = stage.getBoundingClientRect();
  return [...stage.querySelectorAll<HTMLElement>("[data-kp-comb-key], .comb-paint")].map(node => {
    const range = document.createRange(); range.selectNodeContents(node); const box = range.getBoundingClientRect();
    return { text: node.textContent, style: node.getAttribute("style"),
      x: Math.round((box.x - bounds.x) * 100) / 100, y: Math.round((box.y - bounds.y) * 100) / 100 };
  });
});

test("authored stops keep native paint, hold contributions and restore both inputs", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto(`${route}?walk=1`);
  const root = page.locator("#comb-player");
  await expect(root).toHaveAttribute("data-ready", "true"); await frames(page);
  const controls = page.getByRole("combobox", { name: "Explanation stop" });
  await expect(controls.locator("option")).toHaveCount(8);
  for (const index of [0, 1, 2, 3, 4, 5, 6, 7]) {
    await choose(page, index);
    await expect(root).toHaveAttribute("data-column", index >= 5 ? "1" : "0");
    const opacities = await page.locator(".comb-walk-view").evaluateAll(nodes => nodes.map(node => getComputedStyle(node).opacity));
    expect(opacities.sort()).toEqual(["0", "1"]);
    if ([0, 2, 4, 6, 7].includes(index)) await page.locator(".matrix-card").screenshot({ path: info.outputPath(`stop-${index}.png`) });
  }
  await choose(page, 2); const contributions = await pose(page);
  await frames(page); expect(await pose(page)).toEqual(contributions);
  await choose(page, 7); await choose(page, 2); expect(await pose(page)).toEqual(contributions);
  await page.reload(); await expect(root).toHaveAttribute("data-ready", "true");
  await expect(root).toHaveAttribute("data-stop", "first-contributions");
  expect(await pose(page)).toEqual(contributions);
  await page.goto(`${route}?input=dependent-columns#scaled`);
  await expect(root).toHaveAttribute("data-ready", "true");
  expect(await pose(page)).toEqual(contributions);
  // The ordinary reader must not activate the optional walk/source host.
  expect(await page.evaluate(() => performance.getEntriesByType("resource").map(entry => entry.name).filter(name => /walk-host|dependent-columns-walk/.test(name)))).toEqual([]);
  expect(errors).toEqual([]);
});

test("continuous reversal and column handoff stay on accepted native paths", async ({ page }) => {
  await page.goto(`${route}?walk=1`);
  await expect(page.locator("#comb-player")).toHaveAttribute("data-ready", "true");
  await seek(page, .72); const held = await pose(page);
  for (const value of [.9, .4, 0, 1, .72]) await seek(page, value);
  expect(await pose(page)).toEqual(held);
  await choose(page, 4); const original = await page.locator('[data-view="0"] .comb-equation').boundingBox();
  await seek(page, .6668);
  const switched = await page.locator('[data-view="1"] .comb-equation').boundingBox();
  expect(switched).toEqual(original);
  const material = await page.locator('[data-view="1"] [data-occurrence="column-0-0"]').evaluate(node => {
    const native = node.closest(".comb-stage")!.querySelector('[data-kp-comb-key="a-0-0"]')!;
    const rect = (element: Element) => { const r = document.createRange(); r.selectNodeContents(element); return r.getBoundingClientRect().toJSON(); };
    return { owner: rect(node.firstElementChild!), native: rect(native) };
  });
  expect(Math.abs(material.owner.x - material.native.x)).toBeLessThan(.5);
  expect(Math.abs(material.owner.y - material.native.y)).toBeLessThan(.5);
  // Use the shared clock with normal Next, then interrupt it and reverse.
  await page.clock.install(); await choose(page, 1);
  await page.getByRole("button", { name: "Next explanation stop" }).click();
  await page.clock.runFor(1000);
  expect(Number(await page.getByRole("slider").inputValue())).toBeGreaterThan(2 / 18);
  await page.getByRole("button", { name: "Previous explanation stop" }).click();
  await page.clock.runFor(2000);
  await expect(page.locator("#comb-player")).toHaveAttribute("data-stop", "first-weights");
  await page.getByRole("button", { name: "Next explanation stop" }).click();
  await page.clock.runFor(5000);
  await expect(page.locator("#comb-player")).toHaveAttribute("data-stop", "first-contributions");
  await expect(page.getByRole("button", { name: "Play all", exact: true })).toBeVisible();
});

test("resize, reduced motion, history and disposal preserve one active paint owner", async ({ page }, info) => {
  await page.goto(`${route}?walk=1#second-contributions`);
  const root = page.locator("#comb-player");
  await expect(root).toHaveAttribute("data-ready", "true");
  const progress = await page.getByRole("slider").inputValue();
  await page.setViewportSize({ width: 390, height: 844 }); await frames(page);
  await expect(page.getByRole("slider")).toHaveValue(progress);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("phone.png"), fullPage: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Next explanation stop" }).click();
  await expect(root).toHaveAttribute("data-stop", "same-result");
  await page.getByRole("slider").press("Home"); await expect(root).toHaveAttribute("data-stop", "whole");
  await page.getByRole("slider").press("End"); await expect(root).toHaveAttribute("data-stop", "same-result");
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
    history.replaceState(null, "", "#first-weights");
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
  });
  await expect(root).toHaveAttribute("data-stop", "first-weights");
  await page.evaluate(() => { location.hash = "unsupported"; });
  await expect(page.getByRole("alert")).toContainText("Choose a named explanation stop");
  await expect(root).toHaveAttribute("data-stop", "first-weights");
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
  await expect(page.locator(".comb-material > *")).toHaveCount(0);
  await expect(root).not.toHaveAttribute("data-ready", "true");
});

test("disposal during cold font preparation cannot install a late player", async ({ page }) => {
  let release = () => {};
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/KaTeX_Size3-Regular.woff2*", async request => { await held; await request.continue(); });
  const requested = page.waitForRequest(request => request.url().includes("KaTeX_Size3-Regular.woff2"));
  await page.goto(`${route}?walk=1`, { waitUntil: "domcontentloaded" }); await requested;
  const root = page.locator("#comb-player");
  await expect(root).toHaveAttribute("aria-busy", "true");
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
  release(); await page.evaluate(() => document.fonts.ready); await frames(page);
  await expect(root).not.toHaveAttribute("data-ready", "true");
  await expect(page.locator(".comb-stage")).toHaveCount(0);
});
