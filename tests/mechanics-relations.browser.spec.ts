import { test, expect, type Locator } from "@playwright/test";

const route = "/experiments/mechanics-relations/";
const seek = (input: Locator, progress: number) => input.evaluate((element: HTMLInputElement, value) => {
  element.value = String(value); element.dispatchEvent(new Event("input", { bubbles: true }));
}, progress);
const lens = (root: Locator) => root.getByRole("slider", { name: "Derivation lens", exact: true });
async function dragTo(page: import("@playwright/test").Page, root: Locator, position: number, release = true) {
  const handle = lens(root), box = await handle.boundingBox();
  const move = Math.min(2, Math.floor(position)), fraction = position - move;
  const first = await root.locator(`[data-derivation-row="${move}"] .energy-derivation-equation`).boundingBox();
  const last = await root.locator(`[data-derivation-row="${move + 1}"] .energy-derivation-equation`).boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2, first!.y + first!.height / 2 + (last!.y - first!.y) * fraction, { steps: 8 });
  if (release) await page.mouse.up();
}
async function ready(page: import("@playwright/test").Page) {
  await page.goto(route + "#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]");
  await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  return root;
}

test("semantic accent reaches native and material participants without coloring persistent context", async ({ page }, info) => {
  const root = await ready(page);
  const stage = root.locator("[data-derivation-stage]");
  for (const position of [.25, .55, .85, .55, 0, 1]) {
    await dragTo(page, root, position);
    const strength = await stage.evaluate(el => (el as HTMLElement).style.getPropertyValue("--derivation-participant-strength"));
    if (position === 0 || position === 1) expect(strength).toBe("0%");
    else {
      expect(parseFloat(strength)).toBeGreaterThan(90);
      const participants = stage.locator("[data-derivation-participant]");
      expect(await participants.count()).toBeGreaterThanOrEqual(2);
      const ids = await participants.evaluateAll(els => els.map(el => el.getAttribute("data-derivation-participant")));
      expect(ids.every(id => id === "energy.substitute.0.velocity" || id === "energy.substitute.1.replacement")).toBe(true);
      const focal = await participants.first().evaluate(el => getComputedStyle(el).color);
      expect(focal).toBe("color(srgb 0 0.419608 0.568627)");
      const context = await stage.locator('[data-derivation-source] [data-kp-semantic-entity-id$=".prefix"]').evaluate(el => getComputedStyle(el).color);
      expect(focal).not.toBe(context);
      const innerColors = await participants.locator("*").evaluateAll(els => els.map(el => getComputedStyle(el).color));
      expect(innerColors.every(color => color === focal)).toBe(true);
      const inkColors = await participants.locator("*").evaluateAll(els => els.map(el => getComputedStyle(el).webkitTextFillColor));
      expect(inkColors.every(color => color === focal)).toBe(true);
      await root.screenshot({ path: info.outputPath(`semantic-accent-${position}.png`) });
      if (position === .55) {
        const material = stage.locator('[data-kp-equation-material-owner-id][data-derivation-participant]');
        expect(await material.count()).toBeGreaterThan(0);
        expect(await material.first().locator("*").first().evaluate(el => getComputedStyle(el).color)).toBe(focal);
        await root.screenshot({ path: info.outputPath("semantic-accent.png") });
      }
    }
  }
  await page.goto(route + "?derivation-motion=equation&derivation-emphasis=contrast#energy-from-momentum");
  await expect(stage).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  await dragTo(page, root, .55);
  await expect(stage.locator("[data-derivation-participant]")).toHaveCount(0);
  await root.screenshot({ path: info.outputPath("contrast-only.png") });
});

test("participant inspection retains stationary context and traces across all three moves", async ({ page }, info) => {
  const root = await ready(page), stage = root.locator("[data-derivation-stage]");
  const records = root.locator(".energy-derivation-equation");
  const initial = await records.evaluateAll(els => els.map(el => el.getBoundingClientRect().toJSON()));
  const traces = root.locator("[data-derivation-record-participant]");
  await expect(traces).toHaveCount(2);
  for (const position of [.25, .55, .85, .25, 0, 1]) {
    await dragTo(page, root, position);
    await expect(root).toHaveAttribute("data-inspection-extent", "participants");
    const hidden = stage.locator("[data-derivation-inspection-context]");
    expect(await hidden.count()).toBeGreaterThan(0);
    expect(await hidden.evaluateAll(els => els.every(el => getComputedStyle(el).visibility === "hidden"))).toBe(true);
    expect(await records.evaluateAll(els => els.map(el => el.getBoundingClientRect().toJSON()))).toEqual(initial);
    const opacities = await traces.evaluateAll(els => els.map(el => Number(getComputedStyle(el).opacity)));
    expect(opacities.every(value => position === 0 || position === 1 ? value === 1 : value > 0 && value < .3)).toBe(true);
    if (position === .55) {
      const owners = stage.locator("[data-kp-equation-material-owner-id]");
      expect(await owners.evaluateAll(els => els.every(el => el.hasAttribute("data-derivation-participant") || getComputedStyle(el).visibility === "hidden"))).toBe(true);
    }
    await root.screenshot({ path: info.outputPath(`participant-only-${position}.png`) });
  }
  for (const position of [1.25, 1.6, 1.85, 2, 2.25, 2.6, 2.85, 3, 2.6, 1.6, .25]) {
    await dragTo(page, root, position);
    const move = Math.max(0, Math.ceil(position) - 1);
    await expect(root).toHaveAttribute("data-move", String(move));
    await expect(root).toHaveAttribute("data-inspection-extent", "participants");
    expect(await records.evaluateAll(els => els.map(el => el.getBoundingClientRect().toJSON()))).toEqual(initial);
    const activeRows = await traces.evaluateAll(els => [...new Set(els.map(el => el.closest("[data-derivation-row]")!.getAttribute("data-derivation-row")))]);
    expect(activeRows.sort()).toEqual([String(move), String(move + 1)]);
    if (Number.isInteger(position)) {
      expect(await traces.evaluateAll(els => els.every(el => getComputedStyle(el).opacity === "1"))).toBe(true);
    } else {
      const owners = stage.locator("[data-kp-equation-material-owner-id]");
      expect(await owners.evaluateAll(els => els.every(el => el.hasAttribute("data-derivation-participant") || getComputedStyle(el).visibility === "hidden"))).toBe(true);
      // A scalar cancellation must not hide or dim the retained norm merely
      // because it is nested inside the participating fraction's wrapper.
      if (move === 2) {
        const norm = root.locator('[data-derivation-row="2"] [data-kp-semantic-entity-id="energy.cancel-mass.0.norm"]');
        expect(await norm.evaluate(el => { let opacity = 1; for (let node: Element | null = el; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity); return opacity; })).toBe(1);
      }
    }
    await root.screenshot({ path: info.outputPath(`participant-chain-${position}.png`) });
  }
  await page.goto(route + "?derivation-motion=equation#energy-from-momentum");
  await expect(stage).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  await dragTo(page, root, .25);
  await expect(root).toHaveAttribute("data-inspection-extent", "equation");
  await expect(stage.locator("[data-derivation-inspection-context]")).toHaveCount(0);
  await root.screenshot({ path: info.outputPath("whole-equation-comparison.png") });
});

test("persistent lens follows the expression, holds interiors and rewinds exactly", async ({ page }, info) => {
  const root = await ready(page);
  await expect(root.getByRole("slider")).toHaveCount(1);
  await expect(root.locator("[data-derivation-local], [data-derivation-select], [data-derivation-play]")).toHaveCount(0);
  await expect(lens(root)).toHaveAttribute("aria-valuenow", "0");
  const slots = await root.locator("[data-derivation-row]").evaluateAll(rows => rows.map(row => (row as HTMLElement).offsetTop));
  await dragTo(page, root, .55, false);
  await expect.poll(async () => Number(await root.getAttribute("data-progress"))).toBeGreaterThan(.5);
  await expect(root).toHaveAttribute("data-playing", "false");
  const cue = root.locator("[data-derivation-interleave]").first(), cueBox = await cue.boundingBox();
  const expression = await root.locator("[data-derivation-stage]").boundingBox(), knob = await lens(root).boundingBox();
  expect(Math.abs(expression!.y + expression!.height / 2 - knob!.y - knob!.height / 2)).toBeLessThan(2);
  expect(Number(await root.getAttribute("data-algebra-progress"))).toBeGreaterThan(0);
  await page.mouse.up();
  const held = await root.getAttribute("data-derivation-progress");
  await page.waitForTimeout(150);
  await expect(root).toHaveAttribute("data-derivation-progress", held!);
  await root.screenshot({ path: info.outputPath("lens-interior.png") });
  await dragTo(page, root, .4);
  expect(Number(await root.getAttribute("data-derivation-progress"))).toBeLessThan(Number(held));
  expect(await cue.boundingBox()).toEqual(cueBox);
  await dragTo(page, root, .55);
  await expect(root).toHaveAttribute("data-derivation-progress", held!);
  expect(await root.locator("[data-derivation-row]").evaluateAll(rows => rows.map(row => (row as HTMLElement).offsetTop))).toEqual(slots);
});

test("interleaved reason preserves its endpoints, readable lane and disclosure geometry", async ({ page }, info) => {
  for (const width of [1000, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const root = await ready(page), passage = root.locator("[data-derivation-interleave]").first();
    const source = root.locator('[data-derivation-row="0"] .energy-derivation-equation');
    const target = root.locator('[data-derivation-row="1"] .energy-derivation-equation');
    await expect(root.locator("[data-derivation-cue], [data-derivation-notes]")).toHaveCount(0);
    await expect(root.locator("[data-derivation-interleave]")).toHaveCount(3);
    await expect(root.locator("[data-derivation-rail] span")).toHaveCount(4);
    const textBox = await passage.locator(".energy-derivation-interleave-text").boundingBox();
    expect(textBox!.y).toBeGreaterThan((await source.boundingBox())!.y);
    expect(textBox!.y + textBox!.height).toBeLessThan((await target.boundingBox())!.y);
    await dragTo(page, root, .5);
    await expect(source).toBeVisible(); await expect(target).toBeVisible();
    expect(await passage.locator(".energy-derivation-interleave-text").boundingBox()).toEqual(textBox);
    // The KaTeX display wrapper fills the row; its native bases measure the
    // actual notation span rather than counting unused display width as ink.
    const nativeRight = await root.locator("[data-derivation-stage] [data-derivation-target] .katex-html > .base")
      .evaluateAll(bases => Math.max(...bases.map(base => base.getBoundingClientRect().right)));
    expect(textBox!.x).toBeGreaterThan(nativeRight);
    await passage.locator("summary").click();
    await expect(root).toHaveAttribute("data-playing", "false");
    await dragTo(page, root, 1);
    await expect(lens(root)).toHaveAttribute("aria-valuenow", "1");
    const knob = await lens(root).boundingBox(), dock = await target.boundingBox();
    expect(Math.abs(knob!.y + knob!.height / 2 - dock!.y - dock!.height / 2)).toBeLessThan(2);
    await passage.locator("summary").click();
    await dragTo(page, root, .5);
    await root.screenshot({ path: info.outputPath(`interleaved-${width}.png`) });
  }
});

test("the audit trail never disappears and exact docks have one visible expression", async ({ page }, info) => {
  const root = await ready(page);
  const records = root.locator(".energy-derivation-equation");
  const initial = await records.evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().y));
  for (const position of [0, .07, .15, .5, .85, .93, 1, .5, 0]) {
    await dragTo(page, root, position);
    for (const record of await records.all()) await expect(record).toBeVisible();
    expect(await records.evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().y))).toEqual(initial);
    for (const reason of await root.locator("[data-derivation-interleave]").all()) await expect(reason).toBeVisible();
    const opacity = Number(await root.locator("[data-derivation-stage]").evaluate(el => getComputedStyle(el).opacity));
    if (position === 0 || position === 1) {
      expect(opacity).toBe(0);
      await expect(root).toHaveAttribute("data-inspection-owner", "docked");
      await expect(root.locator('[data-derivation-row="2"]')).toHaveAttribute("data-trace-role", "prospective");
    } else if (position === .5) expect(opacity).toBe(1);
    else expect(opacity).toBeGreaterThan(0);
    if (position === .07 || position === .5 || position === 1)
      await root.screenshot({ path: info.outputPath("retained-record-" + position + ".png") });
  }
});

test("fast cross-edge dragging keeps the latest sample and cancels without autoplay", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  const root = await ready(page);
  await dragTo(page, root, 2.5);
  await expect(root).toHaveAttribute("data-move", "2");
  await expect.poll(async () => Number(await root.getAttribute("data-progress"))).toBeCloseTo(.5, 1);
  await expect(root.locator("[data-kp-editor-equation-material-layer] [data-kp-equation-material-owner-id]").first()).toBeAttached();
  await dragTo(page, root, .5, false);
  await expect(root).toHaveAttribute("data-move", "0");
  await lens(root).dispatchEvent("pointercancel", { pointerId: 1 });
  await page.mouse.up();
  await expect(root).not.toHaveAttribute("data-derivation-dragging", "true");
  await expect(root).toHaveAttribute("data-playing", "false");
  for (const position of [1.02, 2.02, 3, 0]) {
    await dragTo(page, root, position);
    await expect(lens(root)).toHaveAttribute("aria-valuenow", String(Math.round(position)));
  }
  await root.screenshot({ path: info.outputPath("lens-source.png") });
  expect(errors).toEqual([]);
});

test("explicit next and previous animate through continuous native handoffs", async ({ page }) => {
  const root = await ready(page);
  await dragTo(page, root, .5);
  await root.locator("[data-derivation-next]").click();
  await expect(root).toHaveAttribute("data-playing", "true");
  await expect(root).toHaveAttribute("data-progress", "1", { timeout: 10000 });
  const result = await root.evaluate(el => new Promise<{ originFlash: boolean; shift: number }>(resolve => {
    const old = el.querySelector<HTMLElement>('[data-derivation-stage] [data-derivation-target] [data-kp-semantic-entity-id$=".prefix"]')!.getBoundingClientRect();
    const top = el.querySelector("[data-derivation-stage]")!.getBoundingClientRect().top;
    let originFlash = false;
    const observer = new MutationObserver(() => {
      const current = el.querySelector("[data-derivation-stage]")!;
      originFlash ||= current.getBoundingClientRect().top < top - .5;
      if (el.getAttribute("data-move") === "1") {
        const fresh = current.querySelector('[data-derivation-source] [data-kp-semantic-entity-id$=".prefix"]')!.getBoundingClientRect();
        observer.disconnect(); clearTimeout(timeout);
        resolve({ originFlash, shift: Math.max(Math.abs(fresh.x - old.x), Math.abs(fresh.y - old.y)) });
      }
    });
    observer.observe(el, { subtree: true, attributes: true, childList: true });
    const timeout = setTimeout(() => { observer.disconnect(); resolve({ originFlash, shift: 999 }); }, 10000);
    el.querySelector<HTMLButtonElement>("[data-derivation-next]")!.click();
  }));
  expect(result.originFlash).toBe(false); expect(result.shift).toBeLessThan(.5);
  await expect(root).toHaveAttribute("data-playing", "true");
  await root.locator("[data-derivation-previous]").click();
  await expect(root).toHaveAttribute("data-direction", "rewind");
  await expect(root).toHaveAttribute("data-progress", "0", { timeout: 10000 });
});

test("narrow keyboard lens, reduced motion, ordinary scroll and print preserve reading", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const root = await ready(page), handle = lens(root);
  await handle.focus(); await handle.press("End");
  await expect(handle).toHaveAttribute("aria-valuenow", "3");
  await handle.press("ArrowUp");
  await expect(handle).toHaveAttribute("aria-valuenow", "2");
  await handle.press("Home");
  await expect(handle).toHaveAttribute("aria-valuenow", "0");
  await dragTo(page, root, .5);
  const held = await root.getAttribute("data-derivation-progress");
  await page.mouse.wheel(0, 100);
  await expect(root).toHaveAttribute("data-derivation-progress", held!);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await root.screenshot({ path: info.outputPath("lens-narrow.png") });
  await page.emulateMedia({ media: "print" });
  for (const row of await root.locator("[data-derivation-row]").all()) await expect(row).toBeVisible();
  for (const reason of await root.locator("[data-derivation-interleave]").all()) await expect(reason).toBeVisible();
});
test("native reading, continuous local control, exact reverse and held prose", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(route);
  const straight = page.locator('[data-episode="straight"]'), turning = page.locator('[data-episode="turning"]');
  await straight.scrollIntoViewIfNeeded();
  await expect(straight).toHaveAttribute("data-enhanced", "true");
  const prose = await straight.locator(".physics-cue").innerText();
  await straight.locator("[data-physics-play]").click();
  await expect.poll(async () => Number(await straight.getAttribute("data-physical-time"))).toBeGreaterThan(.05);
  const time = Number(await straight.getAttribute("data-physical-time"));
  expect(time).toBeLessThan(2);
  await straight.locator("[data-physics-play]").click();
  // Compare the same rendered-text representation: KaTeX also carries hidden
  // MathML/source text, so textContent is not equivalent to innerText.
  await expect.poll(() => straight.locator(".physics-cue").innerText()).toBe(prose);
  await seek(straight.locator("input"), 1);
  const midway = await straight.locator("[data-momentum]").getAttribute("d");
  await expect(straight).toHaveAttribute("data-energy", "2");
  await seek(straight.locator("input"), 2);
  await expect(straight).toHaveAttribute("data-energy", "8");
  await seek(straight.locator("input"), 1);
  await expect(straight.locator("[data-momentum]")).toHaveAttribute("d", midway!);
  await straight.locator("input").press("ArrowLeft");
  expect(Number(await straight.getAttribute("data-physical-time"))).toBeLessThan(1);
  await turning.scrollIntoViewIfNeeded();
  await expect(turning).toHaveAttribute("data-enhanced", "true");
  const slider = turning.locator("input"), box = await slider.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width * .2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * .7, box!.y + box!.height / 2, { steps: 8 });
  await page.mouse.up();
  expect(Number(await turning.getAttribute("data-physical-time"))).toBeGreaterThan(.5);
  expect(Number(await turning.getAttribute("data-physical-time"))).toBeLessThan(Math.PI / 2);
  await seek(slider, Math.PI / 4);
  await expect(turning).toHaveAttribute("data-energy", "0.5");
  await expect(turning.locator("[data-physics-description]")).toContainText("(-0.71, 0.71)");
  await turning.screenshot({ path: info.outputPath("turning-intermediate.png") });
  const beforeScroll = await turning.getAttribute("data-physical-time");
  await page.mouse.wheel(0, 150);
  await expect(turning).toHaveAttribute("data-physical-time", beforeScroll!);
  await turning.locator("[data-physics-play]").click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(turning).toHaveAttribute("data-playing", "false");
  await page.screenshot({ path: info.outputPath("reading-start.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("source-owned static reading needs no JavaScript", async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`http://localhost:8000${route}`);
  await expect(page.locator("h1")).toContainText("momentum");
  await expect(page.locator("[data-particle]")).toHaveCount(2);
  await expect(page.locator('[data-episode="turning"] [data-kp-focus-deck-annotation="physics.momentum"]')).toContainText("(0, 1)");
  await page.goto(`http://localhost:8000${route}static.html`);
  const images = page.locator("figure img");
  await expect(images).toHaveCount(4);
  for (const img of await images.all()) await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  await page.screenshot({ path: info.outputPath("static-reading.png"), fullPage: true });
  await context.close();
});

test("narrow layout and reduced-motion controls retain explicit endpoints", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);
  const turning = page.locator('[data-episode="turning"]');
  await turning.scrollIntoViewIfNeeded();
  await turning.locator("[data-physics-play]").click();
  await expect(turning).toHaveAttribute("data-physical-time", String(Math.PI / 2));
  await expect(turning).toHaveAttribute("data-playing", "false");
  await turning.locator("[data-physics-reset]").click();
  await expect(turning).toHaveAttribute("data-physical-time", "0");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await turning.screenshot({ path: info.outputPath("narrow-turning.png") });
});

test("the algebraic argument is navigable in both editions without playback", async ({ page }, info) => {
  for (const edition of ["", "static.html"]) {
    await page.goto(route + edition);
    await expect(page.locator("h1")).toHaveText("Force, momentum and energy: how the relationships fit together");
    for (const [label, target] of [["Inspect the substitution", "energy-from-momentum"], ["Inspect the differentiation", "force-to-energy"], ["Inspect the accumulation", "impulse-and-work"]]) {
      await page.getByRole("link", { name: label!, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#${target}$`));
      await expect(page.locator(`#${target}`)).toBeAttached();
    }
    await page.getByRole("link", { name: "Back to the relationship map", exact: true }).last().click();
    await expect(page).toHaveURL(/#relationship-map$/);
  }
  await page.goto(route + "#relationship-map");
  await page.locator("#relationship-map").screenshot({ path: info.outputPath("algebraic-map.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("link", { name: "Inspect the differentiation", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("#force-to-energy").screenshot({ path: info.outputPath("algebraic-reason-narrow.png") });
});
