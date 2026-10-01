import { expect, test } from "@playwright/test";
import { passage } from "../src/experiments/dot-product-passage/source.ts";

test("focus glow tunes glyph paint without changing geometry or playback", async ({ page }) => {
  await page.goto("/experiments/dot-product-passage/");
  await expect(page.locator("#dot-player")).toHaveAttribute("data-ready", "true");
  const timeline = page.getByRole("slider", { name: "Animation position" });
  const tuning = page.getByRole("slider", { name: "Glow strength" });
  await expect(tuning).toHaveValue("0");
  await timeline.fill("0.1");
  const moving = page.locator('[data-occurrence="pair-left-1"]');
  const measure = () => moving.evaluate(node => {
    const token = node.getBoundingClientRect(), stage = node.closest(".dot-stage")!.getBoundingClientRect();
    return { x: token.x - stage.x, y: token.y - stage.y, width: token.width, height: token.height };
  });
  const bounds = await measure();
  for (const strength of [0, 100, 60]) {
    await tuning.fill(String(strength));
    const glow = await moving.evaluate(node => getComputedStyle(node).textShadow);
    if (strength === 0) expect(glow).toBe("none");
    else expect(glow).toContain("220, 38, 38");
    expect(await measure()).toEqual(bounds);
    await expect(timeline).toHaveValue("0.1");
    await expect(page.locator("[data-glow-value]")).toHaveText(`${strength}%`);
  }
  for (const shadow of await page.locator(".dot-shadow").all()) await expect(shadow).toHaveCSS("text-shadow", "none");
  await timeline.fill("0.25");
  await expect(page.locator('[data-kp-dot-key="pair-left-1"] .dot-negative-sign')).toHaveCSS("text-shadow", /220, 38, 38/);
  await timeline.fill("0");
  await expect(page.locator("[data-dot-focused]")).toHaveCount(0);
  expect(await page.locator('[data-kp-dot-key="left-0"]').evaluate(node => getComputedStyle(node).textShadow)).not.toContain("220, 38, 38");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await tuning.fill("80");
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
});

test("back opacity can be tuned without seeking or pausing playback", async ({ page }) => {
  await page.goto("/experiments/dot-product-passage/");
  await expect(page.locator("#dot-player")).toHaveAttribute("data-ready", "true");
  await page.getByRole("combobox", { name: "Milestone" }).selectOption("1");
  const tuning = page.getByRole("slider", { name: "Back panel opacity" });
  await expect(tuning).toHaveValue("22");
  for (const value of [0, 40, 70, 100]) {
    await tuning.fill(String(value));
    await expect(page.locator(".dot-plane-source")).toHaveCSS("opacity", String(value / 100));
    const fill = await page.locator(".dot-plane-working").evaluate(node => (node as HTMLElement).style.getPropertyValue("--dot-front-fill"));
    expect(fill).toBe("30%");
    await expect(page.locator(".dot-inputs")).toHaveCSS("opacity", String(value / 100));
    await expect(page.locator('[data-kp-dot-key="pair-left-0"]')).toHaveCSS("color", "rgb(32, 32, 32)");
    await expect(page.locator("[data-opacity-value]")).toHaveText(`${value}%`);
    await expect(page.getByRole("slider", { name: "Animation position" })).toHaveValue("0.25");
  }
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await tuning.fill("30");
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect(page.locator(".dot-plane-source")).toHaveCSS("opacity", "0.3");
  await expect(page.locator("[data-opacity-value]")).toHaveText("30%");
});

test("signed dot passage preserves references through pairing, products and sum", async ({ page }, info) => {
  await page.setViewportSize({ width: 1200, height: 950 });
  await page.goto("/experiments/dot-product-passage/");
  const root = page.locator("#dot-player"); await expect(root).toHaveAttribute("data-ready", "true");
  await expect(page.locator("[data-dot-focused]")).toHaveCount(0);
  // Short font delimiters and tall SVG delimiters must not own competing paint.
  const brackets = await page.locator(".dot-inputs [data-dot-vector]").evaluateAll(nodes => nodes.flatMap(node =>
    ["::before", "::after"].map(pseudo => {
      const style = getComputedStyle(node, pseudo);
      return { horizontal: style.borderTopWidth, vertical: pseudo === "::before" ? style.borderLeftWidth : style.borderRightWidth, color: style.borderTopColor };
    })));
  expect(brackets).toHaveLength(4);
  const contextInk = await page.locator(".dot-inputs").evaluate(node => getComputedStyle(node).color);
  for (const bracket of brackets) {
    expect(bracket.color).toBe(contextInk);
    expect(bracket).toEqual(brackets[0]);
    expect(bracket.horizontal).toBe(bracket.vertical);
    expect(parseFloat(bracket.vertical)).toBeGreaterThan(0);
  }
  await page.locator(".dot-inputs").evaluate(node => { (node as HTMLElement).style.color = "rgb(100, 110, 120)"; });
  for (const vector of await page.locator("[data-dot-vector]").all()) {
    expect(await vector.evaluate(node => getComputedStyle(node, "::before").borderLeftColor)).toBe("rgb(100, 110, 120)");
  }
  await page.locator(".dot-inputs").evaluate(node => { (node as HTMLElement).style.color = ""; });
  for (const delimiter of await page.locator(".dot-inputs :is(.mopen, .mclose)").all()) await expect(delimiter).toHaveCSS("visibility", "hidden");
  await expect(page.locator('[data-kp-dot-key="left-0"] .mord')).toHaveCSS("font-weight", "400");
  const elementSize = await page.locator('[data-kp-dot-key="left-0"]').evaluate(node => parseFloat(getComputedStyle(node).fontSize));
  const expressionSize = await page.locator('[data-kp-dot-key="pair-left-0"]').evaluate(node => parseFloat(getComputedStyle(node).fontSize));
  expect(elementSize).toBe(expressionSize);
  const negative = page.locator('[data-kp-dot-key="pair-left-1"] .dot-negative-sign');
  await expect(negative).toHaveCSS("font-weight", "700");
  const tokenInk = await page.locator('[data-kp-dot-key="pair-left-1"]').evaluate(node => getComputedStyle(node).color);
  await expect(negative).toHaveCSS("color", tokenInk);
  const signRatio = await negative.evaluate(node => {
    const digit = node.nextElementSibling!;
    return node.getBoundingClientRect().width / digit.getBoundingClientRect().width;
  });
  expect(signRatio).toBeLessThan(1);
  expect(signRatio).toBeGreaterThan(.6);
  for (const vector of await page.locator(".dot-inputs [data-dot-vector]").all()) {
    const offset = await vector.evaluate(node => {
      const outer = node.getBoundingClientRect();
      const entries = [...node.querySelectorAll("[data-kp-dot-key]")].map(entry => entry.getBoundingClientRect());
      const left = getComputedStyle(node, "::before"), right = getComputedStyle(node, "::after");
      return {
        x: (outer.left + parseFloat(left.left) + outer.right - parseFloat(right.right)) / 2 - (Math.min(...entries.map(r => r.left)) + Math.max(...entries.map(r => r.right))) / 2,
        y: (outer.top + parseFloat(left.top) + outer.bottom - parseFloat(left.bottom)) / 2 - (Math.min(...entries.map(r => r.top)) + Math.max(...entries.map(r => r.bottom))) / 2,
      };
    });
    expect(Math.abs(offset.x)).toBeLessThan(.5);
    expect(Math.abs(offset.y)).toBeLessThan(.5);
  }
  await expect(page.locator('[data-kp-dot-key="syntax-multiply-0"]')).toHaveCSS("font-weight", "700");
  await expect(page.locator(".dot-products .dot-plus .katex").first()).toHaveCSS("font-weight", "700");
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
  const originalSize = await page.locator('[data-kp-dot-key="right-0"]').boundingBox();
  const slider = page.getByRole("slider", { name: "Animation position" });
  await expect(page.locator(".dot-plane")).toHaveCount(2);
  await expect(page.locator(".dot-plane-working")).toHaveCSS("opacity", "0");
  const initialBackColor = await page.locator(".dot-plane-source").evaluate(node => getComputedStyle(node).backgroundColor);
  const frontAlpha = () => page.locator(".dot-plane-working").evaluate(node =>
    Number(getComputedStyle(node).backgroundColor.match(/\/\s*([\d.e+-]+)\)/)?.[1] ?? 1));
  expect(await frontAlpha()).toBe(0);
  let lastAlpha = 0;
  for (const progress of [.001, .01, .025, .05]) {
    await slider.fill(String(progress));
    const alpha = await frontAlpha();
    expect(alpha).toBeGreaterThan(lastAlpha);
    if (progress === .001) expect(alpha).toBeLessThan(.001);
    lastAlpha = alpha;
    for (const copy of await page.locator(".dot-paint").all()) {
      const size = await copy.evaluate(node => {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
        return { x: matrix.m11, y: matrix.m22 };
      });
      expect(size).toEqual({ x: 1, y: 1 });
    }
  }
  expect(lastAlpha).toBeCloseTo(.3, 4);
  await slider.fill("0");
  expect(await frontAlpha()).toBe(0);
  await slider.fill("0.06");
  const initialFrontColor = await page.locator(".dot-plane-working").evaluate(node => getComputedStyle(node).backgroundColor);
  const earlyBackColor = await page.locator(".dot-plane-source").evaluate(node => getComputedStyle(node).backgroundColor);
  expect(earlyBackColor).toBe(initialBackColor);
  expect(initialFrontColor).toMatch(/\/\s*0\.3\)/);
  expect(initialFrontColor.replace(/\s*\/\s*0\.3\)/, ")")).toBe(initialBackColor);
  await expect(page.locator(".dot-plane-working")).toHaveCSS("background-color", initialFrontColor);
  const nativeInk = await page.locator('[data-kp-dot-key="pair-left-0"]').evaluate(node => getComputedStyle(node).color);
  expect(nativeInk).toBe("rgb(32, 32, 32)");
  await expect(page.locator('[data-occurrence="pair-left-0"] .mord')).toHaveCSS("-webkit-text-stroke-color", nativeInk);
  await expect(page.locator('[data-occurrence="pair-left-1"] .dot-negative-sign')).toHaveCSS("color", nativeInk);
  for (const shadow of await page.locator(".dot-shadow").all()) await expect(shadow).toHaveCSS("color", "rgb(0, 0, 0)");
  for (const copy of await page.locator(".dot-paint").all()) await expect(copy).toHaveCSS("color", nativeInk);
  await expect(page.locator('[data-occurrence="pair-left-0"] .mord')).toHaveCSS("font-weight", "400");
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
  expect(projected.z).toBe(69.5); expect(projected.opacity).toBeCloseTo(.55, 2);
  const liftedSize = await page.locator('[data-occurrence="pair-right-0"] > span').boundingBox();
  expect(liftedSize!.width).toBeCloseTo(originalSize!.width, 1);
  expect(liftedSize!.height).toBeCloseTo(originalSize!.height, 1);
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
  const contextScale = await page.locator(".dot-inputs").evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m11);
  expect(contextScale).toBeCloseTo(.94, 4);
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
  const contact = await page.locator('[data-shadow-for="pair-right-0"]').evaluate(node => {
    const style = getComputedStyle(node);
    return { blur: Number(style.filter.match(/blur\(([\d.]+)px\)/)?.[1]), opacity: Number(style.opacity) };
  });
  expect(contact.blur).toBeLessThan(.51);
  expect(contact.opacity).toBeCloseTo(.35, 2);
  await expect(page.locator(".dot-work")).not.toHaveCSS("text-shadow", "none");
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
  for (const progress of [.25, .5, .75, 1]) {
    await slider.fill(String(progress));
    const key = progress === .25 ? "pair-left-0" : progress === 1 ? "sum" : "product-0";
    await expect(page.locator(`[data-kp-dot-key="${key}"]`)).toHaveCSS("color", "rgb(32, 32, 32)");
    for (const syntax of await page.locator('[data-kp-dot-key^="syntax-"]').all()) await expect(syntax).toHaveCSS("color", "rgb(70, 70, 70)");
  }
  await slider.fill("0");
  await expect(page.locator("[data-dot-focused]")).toHaveCount(0);
  await expect(page.locator('[data-kp-dot-key="left-0"]')).toHaveCSS("color", "rgb(32, 32, 32)");
  expect(await page.locator(".dot-inputs").evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m11)).toBe(1);
  await chooser.selectOption("1");
  const settledScale = await page.locator('[data-occurrence="pair-right-0"]').evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m11);
  expect(settledScale).toBe(1);
  for (const shadow of await page.locator(".dot-shadow").all()) await expect(shadow).toHaveCSS("opacity", "0");
  await expect(page.locator('[data-trace-role="source-trace"]')).toHaveCount(0);
  for (const source of await page.locator(".dot-inputs [data-kp-dot-key]").all()) await expect(source).toHaveCSS("opacity", "0");
  const backColor = await page.locator(".dot-plane-source").evaluate(node => getComputedStyle(node).backgroundColor);
  expect(backColor).toBe(initialBackColor);
  expect(earlyBackColor).toBe(backColor);
  await expect(page.locator(".dot-plane-working")).toHaveCSS("background-color", initialFrontColor);
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
        '[data-kp-dot-key="syntax-multiply-0"]', '.dot-plus'].map(s => read(s).color),
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
      // diagnostics during transit, not a raster-level collision proof.
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
  await expect(child.locator('[data-trace-role="source-trace"]')).toHaveCount(0);
  for (const source of await child.locator(".dot-inputs [data-kp-dot-key]").all()) await expect(source).toHaveCSS("opacity", "0");
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
