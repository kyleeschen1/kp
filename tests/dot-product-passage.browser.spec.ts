import { expect, test } from "@playwright/test";
import { passage } from "../src/experiments/dot-product-passage/source.ts";

test("back opacity can be tuned without seeking or pausing playback", async ({ page }) => {
  await page.goto("/experiments/dot-product-passage/");
  await expect(page.locator("#dot-player")).toHaveAttribute("data-ready", "true");
  await page.getByRole("combobox", { name: "Milestone" }).selectOption("1");
  const tuning = page.getByRole("slider", { name: "Back panel opacity" });
  await expect(tuning).toHaveValue("22");
  for (const value of [0, 100, 40]) {
    await tuning.fill(String(value));
    await expect(page.locator(".dot-plane-source")).toHaveCSS("opacity", String(value / 100));
    await expect(page.locator(".dot-inputs")).toHaveCSS("opacity", String(value / 100));
    await expect(page.locator("[data-opacity-value]")).toHaveText(`${value}%`);
    await expect(page.getByRole("slider", { name: "Animation position" })).toHaveValue("0.25");
  }
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await tuning.fill("65");
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect(page.locator(".dot-plane-source")).toHaveCSS("opacity", "0.65");
});

test("signed dot passage preserves references through pairing, products and sum", async ({ page }, info) => {
  await page.setViewportSize({ width: 1200, height: 950 });
  await page.goto("/experiments/dot-product-passage/");
  const root = page.locator("#dot-player"); await expect(root).toHaveAttribute("data-ready", "true");
  const inputBounds = async (side: string) => page.locator(`[data-kp-dot-key^="${side}-"]`).evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }));
  // Orientation is a plane-local invariant, independent of the camera angle.
  await page.locator(".dot-stage").evaluate(node => { (node as HTMLElement).style.transform = "none"; });
  const row = await inputBounds("left"), localColumn = await inputBounds("right");
  expect(Math.max(...row.map(r => r.y)) - Math.min(...row.map(r => r.y))).toBeLessThan(1);
  expect(Math.max(...localColumn.map(r => r.x)) - Math.min(...localColumn.map(r => r.x))).toBeLessThan(1);
  await page.locator(".dot-stage").evaluate(node => { (node as HTMLElement).style.transform = ""; });
  const column = await inputBounds("right");
  expect(column[0]!.y).toBeLessThan(column[1]!.y); expect(column[1]!.y).toBeLessThan(column[2]!.y);
  await expect(page.locator('[data-kp-dot-key="left-1"]')).toHaveText("−1");
  await expect(page.locator('[data-kp-dot-key="right-2"]')).toHaveText("−2");
  const chooser = page.getByRole("combobox", { name: "Milestone" });
  const slider = page.getByRole("slider", { name: "Animation position" });
  await expect(page.locator(".dot-plane")).toHaveCount(2);
  await expect(page.locator(".dot-plane-working")).toHaveCSS("opacity", "0");
  const initialBackColor = await page.locator(".dot-plane-source").evaluate(node => getComputedStyle(node).backgroundColor);
  const initialFrontColor = await page.locator(".dot-plane-working").evaluate(node => getComputedStyle(node).backgroundColor);
  await slider.fill("0.06");
  const earlyBackColor = await page.locator(".dot-plane-source").evaluate(node => getComputedStyle(node).backgroundColor);
  expect(earlyBackColor).not.toBe(initialBackColor);
  await expect(page.locator(".dot-plane-working")).toHaveCSS("background-color", initialFrontColor);
  const nativeInk = await page.locator('[data-kp-dot-key="pair-left-0"]').evaluate(node => getComputedStyle(node).color);
  for (const copy of await page.locator(".dot-paint").all()) await expect(copy).toHaveCSS("color", nativeInk);
  const lifted = await page.locator('[data-occurrence="pair-right-0"]').boundingBox();
  expect(lifted!.y + lifted!.height / 2).toBeLessThan(column[0]!.y);
  // Brackets stay at their source while entries depart; no corner docking.
  for (const side of ["left", "right"]) await expect(page.locator(`[data-dot-vector="${side}"]`)).toHaveCSS("transform", "none");
  await expect(page.locator('[data-occurrence="pair-right-0"]')).toHaveCSS("text-shadow", "none");
  await expect(page.locator('[data-occurrence="pair-left-0"]')).toHaveCSS("text-shadow", "none");
  const tiltY = (selector: string) => page.locator(selector).evaluate(node =>
    new DOMMatrixReadOnly(getComputedStyle(node).transform).m13);
  expect(await tiltY(".dot-stage")).toBe(0);
  expect(await tiltY('[data-occurrence="pair-right-0"]')).toBe(0);
  const forward = await page.locator('[data-occurrence="pair-right-0"]').evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m43);
  expect(forward).toBe(90);
  const planeDepth = await page.locator(".dot-plane-working").evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m43);
  expect(planeDepth).toBe(69);
  const projected = await page.locator('[data-shadow-for="pair-right-0"]').evaluate(node => {
    const m = new DOMMatrixReadOnly(getComputedStyle(node).transform);
    return { z: m.m43, opacity: Number(getComputedStyle(node).opacity) };
  });
  expect(projected.z).toBe(69.5); expect(projected.opacity).toBeCloseTo(.65, 2);
  const originalSize = await page.locator('[data-kp-dot-key="right-0"]').boundingBox();
  const liftedSize = await page.locator('[data-occurrence="pair-right-0"] > span').boundingBox();
  expect(liftedSize!.width).toBeGreaterThan(originalSize!.width);
  expect(liftedSize!.height).toBeGreaterThan(originalSize!.height);
  await expect(page.locator(".dot-plane").first()).toHaveCSS("border-top-width", "0px");
  await expect(page.locator(".dot-plane-working")).toHaveCSS("border-top-width", "0px");
  await expect(page.locator(".dot-shadow [data-source-id], .dot-shadow [data-kp-dot-key]")).toHaveCount(0);
  const retreat = await page.locator(".dot-inputs").evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m43);
  const backSurface = await page.locator(".dot-plane-source").evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m43);
  expect(retreat).toBe(0); expect(backSurface).toBe(retreat - 1);
  const tiltX = await page.locator(".dot-stage").evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m23);
  expect(tiltX).toBe(0);
  await expect(page.locator(".dot-plane-working")).not.toHaveCSS("box-shadow", "none");
  const backingOffset = await page.locator(".dot-plane-source").evaluate(node => {
    const m = new DOMMatrixReadOnly(getComputedStyle(node).transform); return { x: m.m41, y: m.m42 };
  });
  expect(backingOffset).toEqual({ x: 0, y: 0 });
  await expect(page.locator(".dot-plane-source")).toHaveCSS("opacity", "0.22");
  await expect(page.locator(".dot-inputs")).toHaveCSS("opacity", "0.22");
  const backScale = await page.locator(".dot-plane-source").evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m11);
  expect(backScale).toBeCloseTo(.94, 4);
  await expect(page.locator(".dot-plane-working")).toHaveCSS("opacity", "1");
  expect(await tiltY('[data-occurrence="pair-left-0"]')).toBe(0);
  const bracketScale = await page.locator('[data-dot-vector="right"] .mopen').evaluate(node => {
    const m = new DOMMatrixReadOnly(getComputedStyle(node).transform); return { x: m.a, y: m.d };
  });
  expect(bracketScale.x).toBeGreaterThan(0);
  expect(bracketScale.x).toBe(1); expect(bracketScale.y).toBe(1);
  await page.locator(".matrix-card").screenshot({ path: info.outputPath("lift-and-turn.png") });
  const fading = Number(await page.locator('[data-dot-vector="right"]').evaluate(node => getComputedStyle(node).opacity));
  expect(fading).toBe(1);
  await slider.fill("0.2");
  await expect(page.locator('[data-dot-vector="left"]')).toHaveCSS("opacity", "1");
  await expect(page.locator('[data-dot-vector="right"]')).toHaveCSS("opacity", "1");
  for (const copy of await page.locator(".dot-paint").all()) await expect(copy).toHaveCSS("opacity", "1");
  // Matching pairs approach the central line from opposite sides, without
  // the former rigid-column sweep. Each entry keeps its original source ID.
  for (const p of [.12, .15, .18, .21]) {
    await slider.fill(String(p));
    for (const pair of passage.dot.pairs) {
      const left = await page.locator(`[data-occurrence="pair-left-${pair.index}"]`).boundingBox();
      const right = await page.locator(`[data-occurrence="pair-right-${pair.index}"]`).boundingBox();
      const target = await page.locator(`[data-kp-dot-key="pair-right-${pair.index}"]`).boundingBox();
      expect(left!.y + left!.height / 2).toBeGreaterThan(right!.y + right!.height / 2);
      expect(Math.abs(right!.y - target!.y)).toBeLessThan(70);
    }
  }
  await slider.fill("0.2499");
  for (const pair of passage.dot.pairs) {
    const copy = await page.locator(`[data-occurrence="pair-left-${pair.index}"]`).boundingBox();
    const target = await page.locator(`[data-kp-dot-key="pair-left-${pair.index}"]`).boundingBox();
    expect(copy!.x + copy!.width / 2).toBeCloseTo(target!.x + target!.width / 2, 1);
    expect(copy!.y + copy!.height / 2).toBeCloseTo(target!.y + target!.height / 2, 1);
  }
  const columnTop = await page.locator('[data-occurrence="pair-right-0"]').boundingBox();
  const columnBottom = await page.locator('[data-occurrence="pair-right-2"]').boundingBox();
  expect(Math.abs(columnBottom!.y - columnTop!.y)).toBeLessThan(1);
  for (const i of [0, 1, 2, 3, 4]) {
    await chooser.selectOption(String(i));
    await page.locator(".matrix-card").screenshot({ path: info.outputPath(`step-${i}.png`) });
  }
  // Addition is introduced only after multiplication, then remains for summation.
  for (const progress of [.25, .3, .4, .5, .65, .75]) {
    await slider.fill(String(progress));
    const visiblePluses = await page.locator(".dot-plus").evaluateAll(nodes => nodes.filter(node => {
      const parent = node.parentElement!;
      return getComputedStyle(parent).opacity === "1" && getComputedStyle(node).opacity === "1" && node.getBoundingClientRect().width > 0;
    }).map(node => node.textContent));
    expect(visiblePluses).toHaveLength(progress <= .5 ? 0 : 2);
    expect(visiblePluses.every(text => text?.includes("+"))).toBe(true);
  }
  await chooser.selectOption("1");
  const settledScale = await page.locator('[data-occurrence="pair-right-0"]').evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m11);
  expect(settledScale).toBe(1);
  for (const shadow of await page.locator(".dot-shadow").all()) await expect(shadow).toHaveCSS("opacity", "0");
  await expect(page.locator('[data-trace-role="source-trace"]')).toHaveCount(6);
  for (const trace of await page.locator('[data-trace-role="source-trace"]').all()) await expect(trace).toHaveCSS("opacity", "0.6");
  const backColor = await page.locator(".dot-plane-source").evaluate(node => getComputedStyle(node).backgroundColor);
  expect(backColor).toBe(initialFrontColor.replace(/\/\s*[\d.]+\)/, "/ 0.85)"));
  expect(earlyBackColor).not.toBe(backColor);
  await expect(page.locator(".dot-plane-working")).toHaveCSS("background-color", initialBackColor.replace(/\/\s*[\d.]+\)/, "/ 0.3)"));
  for (const copy of await page.locator(".dot-paint").all()) await expect(copy).toHaveCSS("text-shadow", "none");
  expect(await tiltY('[data-occurrence="pair-right-0"]')).toBe(0);
  for (const operator of await page.locator('[data-kp-dot-key^="syntax-"]').all()) await expect(operator).toHaveCSS("opacity", "0");
  await slider.fill("0.31");
  for (const operator of await page.locator('[data-kp-dot-key^="syntax-"]').all()) await expect(operator).toHaveCSS("opacity", "1");
  await expect(page.locator('[data-kp-dot-key="syntax-multiply-0"]')).toHaveText("⋅");
  await expect(page.locator('[data-kp-dot-key^="syntax-open-"]')).toHaveCount(3);
  await expect(page.locator('[data-kp-dot-key^="syntax-close-"]')).toHaveCount(3);
  await page.locator(".matrix-card").screenshot({ path: info.outputPath("multiply-hold.png") });
  const notation = await page.locator(".dot-stage").evaluate(stage => {
    const read = (selector: string) => getComputedStyle(stage.querySelector(selector)!);
    const work = stage.querySelector<HTMLElement>(".dot-work")!;
    return { entry: read('[data-kp-dot-key="left-0"]').fontSize,
      paired: read('[data-kp-dot-key="pair-left-0"]').fontSize,
      ink: read('[data-kp-dot-key="pair-left-0"]').color,
      syntax: ['[data-kp-dot-key="syntax-open-0"]', '[data-kp-dot-key="syntax-close-0"]',
        '[data-kp-dot-key="syntax-multiply-0"]', '.dot-plus', '.dot-inputs .mopen', '.dot-inputs .mclose'].map(s => read(s).color),
      offsetX: work.offsetLeft + work.offsetWidth / 2 - stage.clientWidth / 2,
      depth: new DOMMatrixReadOnly(getComputedStyle(work).transform).m43 };
  });
  expect(notation.entry).toBe(notation.paired);
  expect(new Set(notation.syntax).size).toBe(1);
  expect(notation.syntax[0]).not.toBe(notation.ink);
  expect(notation.syntax[0]).toBe("rgb(70, 70, 70)");
  // Check centering in scene coordinates, before the shared camera projection.
  expect(Math.abs(notation.offsetX)).toBeLessThan(1);
  expect(notation.depth).toBe(70);
  // Parentheses shrink after the contents; seeking backward restores that ordering.
  const delayedPose = async () => page.locator('[data-kp-dot-key="syntax-open-0"], [data-kp-dot-key="pair-left-0"]').evaluateAll(nodes => nodes.map(node => {
    const style = getComputedStyle(node);
    return { scale: new DOMMatrixReadOnly(style.transform).a, opacity: style.opacity };
  }));
  await slider.fill("0.4106");
  const delayed = await delayedPose();
  expect(delayed[0]!.scale).toBeGreaterThan(delayed[1]!.scale);
  expect(delayed[0]!.scale).toBe(1);
  await page.locator(".matrix-card").screenshot({ path: info.outputPath("enclosure-delay.png") });
  await slider.fill("0.4269");
  await expect(page.locator('[data-kp-dot-key="pair-left-0"]')).toHaveCSS("opacity", "0");
  await expect(page.locator('[data-kp-dot-key="syntax-open-0"]')).toHaveCSS("opacity", "1");
  const popPose = await page.locator('[data-kp-dot-key="syntax-open-0"]').evaluate(node => {
    const m = new DOMMatrixReadOnly(getComputedStyle(node).transform); return { x: m.a, y: m.d };
  });
  expect(popPose.y).toBeLessThan(popPose.x);
  expect(popPose.x).toBeLessThan(1);
  const resultWidth = () => page.locator('[data-kp-dot-key="product-0"]').evaluate(node => node.getBoundingClientRect().width);
  const kernelWidth = await resultWidth();
  await page.locator(".matrix-card").screenshot({ path: info.outputPath("parenthesis-pop.png") });
  await slider.fill("0.4383");
  expect(await resultWidth()).toBeCloseTo(kernelWidth, 2);
  await slider.fill("0.4594");
  await expect(page.locator('[data-kp-dot-key="syntax-open-0"]')).toHaveCSS("opacity", "0");
  expect(await resultWidth()).toBeGreaterThan(kernelWidth);
  await page.locator(".matrix-card").screenshot({ path: info.outputPath("result-after-pop.png") });
  await slider.fill("1"); await slider.fill("0.4106");
  expect(await delayedPose()).toEqual(delayed);
  const gap = await page.locator(".dot-pairs").evaluate(node => parseFloat(getComputedStyle(node).gap));
  expect(gap).toBeLessThan(8);
  await chooser.selectOption("3");
  // Fusion retains nonzero ink through the handoff, rather than a blank
  // shrink-to-zero interval. Each multiplication remains its own cohort.
  for (const local of [.48, .51, .53, .58]) {
    for (const phase of [1, 3]) {
      const phaseLocal = phase === 1 ? .35 + .65 * local : local;
      await slider.fill(String(Number(((phase + phaseLocal) / 4).toFixed(4))));
      const cohorts = phase === 1 ? passage.dot.pairs.map(pair =>
        [`pair-left-${pair.index}`, `pair-right-${pair.index}`, `syntax-multiply-${pair.index}`, `product-${pair.index}`])
        : [[...passage.dot.pairs.map(pair => `product-${pair.index}`), "sum"]];
      for (const keys of cohorts) {
        const visible = await page.locator(keys.map(key => `[data-kp-dot-key="${key}"]`).join(",")).evaluateAll(nodes => nodes.filter(node => {
          const bounds = node.getBoundingClientRect();
          return getComputedStyle(node).opacity === "1" && bounds.width > 1 && bounds.height > 1;
        }).length);
        expect(visible).toBeGreaterThan(0);
      }
      await page.locator(".matrix-card").screenshot({ path: info.outputPath(`fusion-${phase}-${local}.png`) });
    }
  }
  await chooser.selectOption("4");
  await expect(page.locator('[data-kp-dot-key="sum"]')).toHaveText("−3");
  await expect(page.locator(".dot-sum")).toHaveCSS("opacity", "1");
  for (const pair of passage.dot.pairs) {
    await expect(page.locator(`[data-kp-dot-key="product-${pair.index}"]`)).toHaveAttribute("data-source-id", pair.product.id);
    for (const side of ["left", "right"] as const) {
      await expect(page.locator(`[data-occurrence="pair-${side}-${pair.index}"]`)).toHaveAttribute("data-source-id", pair[side].id);
    }
  }
  await expect(page.locator(".dot-material [data-kp-dot-key]")).toHaveCount(0);
  for (const p of [.03, .08, .14, .18, .25, .29, .43, .57, .78, .94]) {
    await slider.fill(String(p));
    await page.locator(".matrix-card").screenshot({ path: info.outputPath(`transit-${p}.png`) });
    // Preserve spacing in scene coordinates. Rotated screen-space rectangles
    // include empty corner wedges; their contact is not a glyph collision.
    await page.locator(".dot-stage").evaluate(node => { (node as HTMLElement).style.transform = "none"; });
    const moving = await page.locator(".dot-paint").evaluateAll(nodes => nodes.filter(n => getComputedStyle(n).opacity === "1").map(n => {
      // Native glyph rectangles still include font whitespace; contacts are
      // diagnostics during this pop trial, not a raster-level collision proof.
      const glyphs = [...n.querySelectorAll(".mord")].map(g => g.getBoundingClientRect());
      if (glyphs.length === 0) throw new Error("Missing native scalar glyph boxes");
      return { left: Math.min(...glyphs.map(r => r.left)), right: Math.max(...glyphs.map(r => r.right)),
        top: Math.min(...glyphs.map(r => r.top)), bottom: Math.max(...glyphs.map(r => r.bottom)) };
    }));
    await page.locator(".dot-stage").evaluate(node => { (node as HTMLElement).style.transform = ""; });
    const contacts = [];
    for (const box of moving) {
      expect(Object.values(box).every(Number.isFinite)).toBe(true);
      expect(box.right).toBeGreaterThan(box.left); expect(box.bottom).toBeGreaterThan(box.top);
    }
    for (let i = 0; i < moving.length; i++) for (let j = i + 1; j < moving.length; j++) {
      const a = moving[i]!, b = moving[j]!;
      if (!(a.right <= b.left + .5 || b.right <= a.left + .5 || a.bottom <= b.top + .5 || b.bottom <= a.top + .5)) contacts.push({ p, i, j, a, b });
    }
    if (contacts.length) await info.attach(`transit-contacts-${p}`, { body: JSON.stringify(contacts), contentType: "application/json" });
    const poses = () => page.locator(".dot-stage [style]").evaluateAll(nodes => nodes.map(n => n.getAttribute("style")));
    const held = await poses(); await slider.fill("0"); await slider.fill("1"); await slider.fill(String(p));
    expect(await poses()).toEqual(held);
  }
  await chooser.selectOption("0");
  await page.getByRole("button", { name: "Next milestone" }).click();
  await expect(page.locator(".dot-stage")).toHaveAttribute("data-progress", "0.25");
  await expect(page.locator('.dot-paint').first()).toHaveCSS("opacity", "0");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("phone.png"), fullPage: true });
});

test("menu configuration, native endpoints and reduced motion work for the passage", async ({ page }, info) => {
  await page.goto("/experiments/matrix-examples/");
  await page.getByRole("combobox", { name: "Example", exact: true }).selectOption("dot-passage");
  const child = page.frameLocator("#example-frame");
  await expect(child.locator("#dot-player")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Step instantly", exact: true }).click();
  await child.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(child.locator("#dot-player")).toHaveAttribute("data-milestone", "pairs");
  await child.getByRole("slider", { name: "Animation position" }).fill("0.57");
  await page.getByRole("button", { name: "Side by side", exact: true }).click();
  await expect(child.getByRole("slider", { name: "Animation position" })).toHaveValue("0.57");
  await expect(child.locator('[data-trace-role="source-trace"]')).toHaveCount(6);
  await expect(child.locator('.dot-material [data-trace-role]')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("side-layout.png"), fullPage: true });
  await child.getByRole("slider", { name: "Animation position" }).fill("0.2");
  const stageBounds = await child.locator(".dot-stage").boundingBox();
  for (const copy of await child.locator(".dot-paint").all()) {
    const bounds = await copy.boundingBox();
    expect(bounds!.y).toBeGreaterThanOrEqual(stageBounds!.y);
  }
  await page.screenshot({ path: info.outputPath("side-tilt.png"), fullPage: true });
  await child.getByRole("slider", { name: "Animation position" }).press("End");
  await child.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(child.getByRole("slider", { name: "Animation position" })).toHaveValue("0");
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.getByRole("button", { name: "Reset settings", exact: true }).click();
  await child.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(child.locator("#dot-player")).toHaveAttribute("data-milestone", "pairs");
  await expect(child.locator("body")).toHaveCSS("background-color", "rgb(255, 253, 248)");
  await expect(child.locator("html")).toHaveCSS("color-scheme", "light");
  await page.screenshot({ path: info.outputPath("light-override.png"), fullPage: true });
  await child.getByRole("slider", { name: "Animation position" }).fill("0.06");
  const darkInk = await child.locator('[data-kp-dot-key="pair-left-0"]').evaluate(node => getComputedStyle(node).color);
  for (const copy of await child.locator(".dot-paint").all()) await expect(copy).toHaveCSS("color", darkInk);
  for (const copy of await child.locator(".dot-paint").all()) await expect(copy).toHaveCSS("text-shadow", "none");
});
