import { test, expect, type Locator } from "@playwright/test";

const route = "/experiments/mechanics-relations/";
const seek = (input: Locator, progress: number) => input.evaluate((element: HTMLInputElement, value) => {
  element.value = String(value); element.dispatchEvent(new Event("input", { bubbles: true }));
}, progress);
const lens = (root: Locator) => root.getByRole("slider", { name: "Derivation lens", exact: true });
// Element screenshots may scroll a taller record into view. Compare document
// geometry to detect reflow without mistaking viewport movement for layout.
const documentBoxes = (elements: Locator) => elements.evaluateAll(els => els.map(el => {
  const box = el.getBoundingClientRect();
  return { x: box.x + scrollX, y: box.y + scrollY, width: box.width, height: box.height };
}));
async function dragTo(page: import("@playwright/test").Page, root: Locator, position: number, release = true) {
  const handle = lens(root);
  // Pointer capture can cross viewport edges, but starting a drag must hit a
  // visible handle. Taller approved records can put its previous dock offscreen.
  await handle.scrollIntoViewIfNeeded();
  const box = await handle.boundingBox();
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

test("local entry preserves edge identity and bookmarks without scrolling or autoplay", async ({ page }, info) => {
  await page.goto(route + "#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]"), entries = root.locator("[data-derivation-entry]");
  await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  await entries.nth(1).scrollIntoViewIfNeeded();
  const scroll = await page.evaluate(() => scrollY);
  await entries.nth(1).click();
  await expect(root).toHaveAttribute("data-move", "1");
  await expect(root).toHaveAttribute("data-progress", "0");
  await expect(root).toHaveAttribute("data-playing", "false");
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await dragTo(page, root, 1.55);
  const held = await root.getAttribute("data-progress");
  await entries.nth(2).click();
  await expect(root).toHaveAttribute("data-move", "2");
  await expect(root).toHaveAttribute("data-progress", "0");
  await entries.nth(1).click();
  await expect(root).toHaveAttribute("data-move", "1");
  await expect(root).toHaveAttribute("data-progress", held!);
  // Latest local request wins during preparation; adjacent source endpoints
  // must not silently resolve to the preceding edge's destination.
  await entries.evaluateAll(buttons => { (buttons[2] as HTMLElement).click(); (buttons[1] as HTMLElement).click(); (buttons[0] as HTMLElement).click(); });
  await expect(root).toHaveAttribute("data-move", "0");
  await expect(root).toHaveAttribute("data-progress", "0");
  await entries.nth(1).click();
  await expect(root).toHaveAttribute("data-move", "1");
  await expect(root).toHaveAttribute("data-progress", held!);
  await root.locator('[data-derivation-interleave="1"] [data-derivation-restart]').click();
  await expect(root).toHaveAttribute("data-progress", "0");
  await entries.nth(2).focus();
  await page.keyboard.press("Enter");
  await expect(root).toHaveAttribute("data-move", "2");
  await expect(root).toHaveAttribute("data-progress", "0");
  expect(await root.locator("[data-derivation-stage]").count()).toBe(1);
  await page.mouse.wheel(0, 90);
  await expect(root).toHaveAttribute("data-progress", "0");
  await root.screenshot({ path: info.outputPath("local-entry-desktop.png") });
  const written = root.locator(".energy-derivation-interleave-text").last();
  await written.evaluate(el => { const range = document.createRange(); range.selectNodeContents(el); getSelection()!.removeAllRanges(); getSelection()!.addRange(range); });
  expect(await page.evaluate(() => getSelection()!.toString())).toContain("Cancel one mass factor");
  await expect(root).toHaveAttribute("data-progress", "0");
  await root.evaluate(el => { (el as HTMLElement).dataset["derivationRevision"] = "edited"; });
  await entries.nth(1).click();
  await expect(root.locator("[data-derivation-status]")).toContainText("older revision");
  await expect(root).toHaveAttribute("data-move", "2");
});

test("long-document local access preserves held transitions and exact return after reflow", async ({ page }) => {
  await page.goto(route + "#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]");
  await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  await dragTo(page, root, .55);
  const held = await root.getAttribute("data-progress");
  // Layout pressure only, not fabricated mathematical states or authoring
  // support for a longer proof. Unequal prose intervals reuse all three moves.
  await root.locator(".energy-derivation-interleave-text").evaluateAll(passages => passages.forEach((passage, i) => {
    for (let j = 0; j < [22, 11, 5][i]!; j++) {
      const p = document.createElement("p");
      p.textContent = "Layout fixture: a longer explanation occupies reading space without adding a mathematical state or changing the transition's meaning.";
      passage.append(p);
    }
  }));
  const why = root.locator('[data-derivation-interleave="0"] summary').first();
  await why.click();
  const entry = root.locator('[data-derivation-entry="2"]');
  await entry.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  expect(before).toBeGreaterThan(3000);
  expect((await lens(root).boundingBox())!.y).toBeLessThan(0);
  await entry.click();
  await expect(root).toHaveAttribute("data-move", "2");
  await expect(root).toHaveAttribute("data-progress", "0");
  expect(await page.evaluate(() => scrollY)).toBe(before);
  expect((await lens(root).boundingBox())!.y).toBeGreaterThan(0);
  await root.locator('[data-derivation-entry="0"]').click();
  await expect(root).toHaveAttribute("data-move", "0");
  await expect(root).toHaveAttribute("data-progress", held!);
  const recall = root.locator("[data-derivation-recall]");
  await recall.locator("summary").click();
  const origin = recall.locator("a");
  await origin.scrollIntoViewIfNeeded();
  const offset = await root.locator('[data-derivation-row="0"]').evaluate(el => el.getBoundingClientRect().top);
  await origin.click();
  const back = page.locator("[data-derivation-return]");
  await expect(back).toBeFocused();
  await page.setViewportSize({ width: 960, height: 800 });
  await back.click();
  await expect(origin).toBeFocused();
  await expect(root).toHaveAttribute("data-progress", held!);
  expect(Math.abs(await root.locator('[data-derivation-row="0"]').evaluate(el => el.getBoundingClientRect().top) - offset)).toBeLessThan(2);
  await expect(root).toHaveAttribute("data-playing", "false");
  await expect(root.locator(".energy-derivation-equation")).toHaveCount(4);
});

test("desktop integration preserves enlarged reading and keeps phone presentation opt-in", async ({ page }) => {
  await page.addInitScript(() => document.addEventListener("DOMContentLoaded", () => { document.documentElement.style.fontSize = "24px"; }));
  const root = await ready(page);
  await expect(root.locator("[data-derivation-entry]")).toHaveCount(3);
  await root.locator('[data-derivation-entry="1"]').click();
  await expect(root).toHaveAttribute("data-move", "1");
  await expect(root).toHaveAttribute("data-progress", "0");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(root).toHaveAttribute("data-mobile-candidate", "false");
  await expect(root.locator('[data-derivation-entry="0"]')).toBeHidden();
  await expect(lens(root)).toBeVisible();
  await expect(root.locator(".energy-derivation-mobile-well").first()).toBeHidden();
});

test("phone local inspection keeps normal-width prose and holds a reversible local animation", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route + "?derivation-access=local#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]"), entry = root.locator('[data-derivation-entry="0"]');
  await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  await expect(lens(root)).toBeHidden();
  const text = root.locator(".energy-derivation-interleave-text").first();
  expect((await text.boundingBox())!.width).toBeGreaterThan(310);
  await entry.scrollIntoViewIfNeeded();
  const before = (await entry.boundingBox())!.y;
  await entry.click();
  await expect(root).toHaveAttribute("data-mobile-inspect", "true");
  expect(Math.abs((await entry.boundingBox())!.y - before)).toBeLessThan(1);
  const range = root.getByRole("slider", { name: "Inspect transition 1 to 2", exact: true });
  await seek(range, .55);
  await expect(root).toHaveAttribute("data-progress", "0.55");
  await expect(root).toHaveAttribute("data-playing", "false");
  const stage = root.locator("[data-derivation-stage]");
  const stageBox = await stage.boundingBox(), textBox = await text.boundingBox();
  expect(stageBox!.y + stageBox!.height).toBeLessThan(textBox!.y);
  await expect(stage.locator("[data-derivation-inspection-context]")).toHaveCount(0);
  await page.mouse.wheel(0, 100);
  await expect(root).toHaveAttribute("data-progress", "0.55");
  await seek(range, .35);
  await expect(root).toHaveAttribute("data-direction", "rewind");
  await seek(range, .55);
  await root.screenshot({ path: info.outputPath("local-inspection-phone.png") });
  const close = root.locator('[data-derivation-interleave="0"] [data-local-close]');
  await close.click();
  await expect(root).toHaveAttribute("data-mobile-inspect", "false");
  await expect(entry).toBeFocused();
  await entry.click();
  await expect(root).toHaveAttribute("data-progress", "0.55");
  await root.locator('[data-derivation-interleave="0"] [data-local-back]').click();
  await expect.poll(async () => Number(await root.getAttribute("data-progress"))).toBeLessThan(.55);
  await expect(root).toHaveAttribute("data-progress", "0");
  await range.focus();
  await page.keyboard.press("End");
  await expect(root).toHaveAttribute("data-progress", "1");
  await page.keyboard.press("Home");
  await expect(root).toHaveAttribute("data-progress", "0");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.emulateMedia({ media: "print" });
  await expect(stage).toBeHidden();
  await expect(entry).toBeHidden();
  for (const record of await root.locator(".energy-derivation-equation").all()) await expect(record).toBeVisible();
});

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
  await page.goto(route + "?derivation-motion=participants#energy-from-momentum");
  await expect(stage).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  const records = root.locator(".energy-derivation-equation");
  const initial = await documentBoxes(records);
  const traces = root.locator("[data-derivation-record-participant]");
  await expect(traces).toHaveCount(2);
  for (const position of [.25, .55, .85, .25, 0, 1]) {
    await dragTo(page, root, position);
    await expect(root).toHaveAttribute("data-inspection-extent", "participants");
    const hidden = stage.locator("[data-derivation-inspection-context]");
    expect(await hidden.count()).toBeGreaterThan(0);
    expect(await hidden.evaluateAll(els => els.every(el => getComputedStyle(el).visibility === "hidden"))).toBe(true);
    expect(await documentBoxes(records)).toEqual(initial);
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
    expect(await documentBoxes(records)).toEqual(initial);
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

test("contextual inspection keeps the complete working equation through forward and reverse handoffs", async ({ page }, info) => {
  await page.goto(route + "?derivation-motion=contextual#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]"), stage = root.locator("[data-derivation-stage]");
  await expect(stage).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  const records = root.locator(".energy-derivation-equation");
  const geometry = await documentBoxes(records);
  for (const position of [.55, 1, 1.55, 2, 2.55, 3, 2.55, 1.55, .55, 0]) {
    await dragTo(page, root, position);
    await expect(root).toHaveAttribute("data-inspection-extent", "equation");
    await expect(stage.locator("[data-derivation-inspection-context]")).toHaveCount(0);
    await expect(records).toHaveCount(4);
    expect(await documentBoxes(records)).toEqual(geometry);
    const opacity = await stage.evaluate(el => Number(getComputedStyle(el).opacity));
    expect(opacity).toBe(Number.isInteger(position) ? 0 : 1);
    if (!Number.isInteger(position)) {
      const owners = stage.locator("[data-kp-equation-material-owner-id]");
      expect(await owners.count()).toBeGreaterThan(0);
      // Visible contextual material, not merely a hidden native source or an
      // endpoint elsewhere on the page, must accompany the semantic change.
      const context = owners.filter({ hasNot: stage.locator("[data-derivation-participant]") });
      expect(await context.evaluateAll(els => els.some(el => !el.hasAttribute("data-derivation-participant") && getComputedStyle(el).visibility !== "hidden"))).toBe(true);
      expect(await stage.locator("[data-derivation-participant]").count()).toBeGreaterThan(0);
      await root.screenshot({ path: info.outputPath(`contextual-${position}.png`) });
    }
  }
  await page.emulateMedia({ media: "print" });
  await expect(stage).toBeHidden();
  for (const record of await records.all()) await expect(record).toBeVisible();
});

test("local provenance returns to the same logical position, disclosures and focus after reflow", async ({ page }, info) => {
  await page.goto(route + "?derivation-motion=contextual&derivation-provenance=local#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]");
  await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  const recall = root.locator("[data-derivation-recall]");
  await recall.locator("summary").click();
  await root.locator('[data-derivation-interleave="1"] summary').click();
  await dragTo(page, root, 1.55);
  const link = recall.getByRole("link", { name: "Visit the original definition" });
  await link.focus();
  const before = await root.evaluate(el => ({ progress: el.getAttribute("data-derivation-progress"),
    offset: el.querySelector('[data-derivation-row="1"]')!.getBoundingClientRect().top,
    disclosures: [...el.querySelectorAll("details")].map(detail => detail.open) }));
  await link.press("Enter");
  const back = page.getByRole("button", { name: "Return to your derivation" });
  await expect(back).toBeFocused();
  await expect(root).toHaveAttribute("data-playing", "false");
  await page.locator("#momentum-definition").evaluate(el => { (el as HTMLElement).style.paddingBottom = "120px"; });
  await page.setViewportSize({ width: 800, height: 900 });
  await back.click();
  await expect(link).toBeFocused();
  await expect(back).toBeHidden();
  await expect(root).toHaveAttribute("data-derivation-progress", before.progress!);
  const after = await root.evaluate(el => ({ offset: el.querySelector('[data-derivation-row="1"]')!.getBoundingClientRect().top,
    disclosures: [...el.querySelectorAll("details")].map(detail => detail.open) }));
  expect(after.disclosures).toEqual(before.disclosures);
  expect(Math.abs(after.offset - before.offset)).toBeLessThan(2);
  await expect(root).toHaveAttribute("data-playing", "false");
  await root.screenshot({ path: info.outputPath("provenance-return.png") });
  // Stale publication bookmarks fail without changing the held mathematical state.
  await link.press("Enter");
  await expect(back).toBeFocused();
  await root.evaluate(el => { (el as HTMLElement).dataset["derivationRevision"] = "edited"; });
  await back.click();
  await expect(page.getByText("This return needs repair; your written derivation is unchanged.")).toBeVisible();
  await expect(root).toHaveAttribute("data-derivation-progress", before.progress!);
  await expect(back).toBeVisible();
});

test("accepted context and provenance are defaults with explicit legacy comparisons", async ({ page }, info) => {
  const root = await ready(page);
  await expect(root.locator("[data-derivation-recall]")).toHaveCount(1);
  await expect(root).toHaveAttribute("data-inspection-extent", "equation");
  await page.goto(route + "?derivation-provenance=off#energy-from-momentum");
  await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  await expect(root.locator("[data-derivation-recall]")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route + "?derivation-motion=contextual&derivation-provenance=local#energy-from-momentum");
  await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  await root.locator("[data-derivation-recall] summary").click();
  await dragTo(page, root, .55);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await root.screenshot({ path: info.outputPath("contextual-narrow.png") });
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
  const cue = root.locator("[data-derivation-interleave]").first(), cueBox = await documentBoxes(cue);
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
  expect(await documentBoxes(cue)).toEqual(cueBox);
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
    await passage.getByText("Why is this allowed?", { exact: true }).click();
    await expect(root).toHaveAttribute("data-playing", "false");
    await dragTo(page, root, 1);
    await expect(lens(root)).toHaveAttribute("aria-valuenow", "1");
    const knob = await lens(root).boundingBox(), dock = await target.boundingBox();
    expect(Math.abs(knob!.y + knob!.height / 2 - dock!.y - dock!.height / 2)).toBeLessThan(2);
    await passage.getByText("Why is this allowed?", { exact: true }).click();
    await dragTo(page, root, .5);
    await root.screenshot({ path: info.outputPath(`interleaved-${width}.png`) });
  }
});

test("the audit trail never disappears and exact docks have one visible expression", async ({ page }, info) => {
  const root = await ready(page);
  const records = root.locator(".energy-derivation-equation");
  const initial = await documentBoxes(records);
  for (const position of [0, .07, .15, .5, .85, .93, 1, .5, 0]) {
    await dragTo(page, root, position);
    for (const record of await records.all()) await expect(record).toBeVisible();
    expect(await documentBoxes(records)).toEqual(initial);
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
