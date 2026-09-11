import { expect, test, type Page } from "@playwright/test";
const route = "/experiments/kinetic-figure/gradient-contour/";
const deck = "[data-kp-focus-deck-id=gradient-contour]";
async function seek(page: Page, step: number) {
  await page.locator("[data-kp-focus-deck-scrubber]").evaluate((element, position) => {
    (element as HTMLInputElement).value = String(position); element.dispatchEvent(new Event("input", { bubbles: true }));
  }, step);
  await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", String(step));
}
async function paint(page: Page) {
  return page.locator(".gradient-overlay").innerHTML();
}
test("passage handoff stays close to a fixed stage at desktop and phone widths", async ({ page }, info) => {
  await page.goto(route); await expect(page.locator(deck)).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await seek(page, 5);
    const layout = () => page.locator(deck).evaluate(element => {
      const get = (selector: string) => element.querySelector<HTMLElement>(selector)!;
      const stage = get(".kp-surface-contour-stage").getBoundingClientRect();
      const plot = get(".kp-surface-contour-stage__plot").getBoundingClientRect();
      const header = get(".kp-surface-contour-stage__header").getBoundingClientRect();
      const pane = get("[data-gradient-guided-passage]");
      const end = get("[data-gradient-guided-passage] .kp-focus-deck__passage-page").lastElementChild!.getBoundingClientRect();
      const cue = get(".gradient-viewing-cue").getBoundingClientRect();
      const button = get("[data-gradient-play-comparison]").getBoundingClientRect();
      const origin = get(".gradient-origin").getBoundingClientRect();
      return { gap: stage.top - end.bottom, stageY: stage.top, stageHeight: stage.height,
        plotY: plot.top, plotHeight: plot.height, plotRatio: plot.width / plot.height,
        plotGap: plot.top - header.bottom, cueY: cue.top, buttonY: button.top,
        originX: origin.x, originY: origin.y, overflow: pane.scrollHeight - pane.clientHeight };
    });
    const prepared = await layout();
    expect(prepared.gap).toBeGreaterThanOrEqual(0);
    expect(prepared.gap).toBeLessThanOrEqual(16);
    expect(prepared.overflow).toBeLessThanOrEqual(1);
    expect(prepared.plotRatio).toBeCloseTo(520 / 300, 2);
    expect(prepared.plotGap).toBeGreaterThanOrEqual(0);
    expect(prepared.plotGap).toBeLessThanOrEqual(4);
    for (const step of [5.5, 6, 5.25, 5]) {
      await seek(page, step);
      expect(await layout()).toEqual(prepared);
    }
    await page.screenshot({ path: info.outputPath(`compact-handoff-${width}.png`), fullPage: true });
  }
});
test("primary visual checkpoint: motivated question, local mechanism and coherent controls", async ({ page }, info) => {
  test.setTimeout(60000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(route); await expect(page.locator(deck)).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  await expect(page.locator(".graph-webgl")).toHaveAttribute("data-kp-surface-contour-capability", "ready");
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.screenshot({ path: info.outputPath("01-surface.png"), fullPage: true });
  const samples = await page.locator(deck).evaluate(async element => {
    const states: number[] = [];
    const observer = new MutationObserver(() => states.push(Number((element as HTMLElement).dataset["gradientStep"])));
    observer.observe(element, { attributes: true, attributeFilter: ["data-gradient-step"] });
    element.querySelector<HTMLButtonElement>("[data-kp-focus-deck-next]")!.click();
    await new Promise(resolve => setTimeout(resolve, 2100)); observer.disconnect(); return states;
  });
  expect(samples.some(position => position > 0 && position < 1)).toBe(true);
  await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", "1");
  await expect(page.locator("[data-gradient-count]")).toHaveText("2 / 8");
  for (const step of [1.5, 3, 4, 5, 5.5, 6, 7]) {
    await seek(page, step);
    await expect(page.locator("[data-gradient-height]")).toHaveText("1.50");
    await page.screenshot({ path: info.outputPath(`step-${step}.png`), fullPage: true });
  }
  await expect(page.locator("[data-gradient-rate]")).toHaveText("2.83");
  const end = await paint(page); await seek(page, 2.71); await seek(page, 7); expect(await paint(page)).toEqual(end);
  await seek(page, 5); const decomposition = await paint(page);
  await expect(page.locator(".kp-surface-contour-stage__equations")).toBeHidden();
  await expect(page.locator(".gradient-viewing-cue")).toHaveText("Watch the across part as the direction turns.");
  await expect(page.locator("[data-gradient-across]")).toHaveText("0.71");
  await expect(page.locator("[data-gradient-along]")).toHaveText("0.71");
  await expect(page.locator("[data-gradient-rate]")).toHaveText("2.00");
  await seek(page, 6); await expect(page.locator("[data-gradient-across]")).toHaveText("1.00");
  await expect(page.locator("[data-gradient-along]")).toHaveText("0.00");
  await seek(page, 3); await seek(page, 5); expect(await paint(page)).toEqual(decomposition);
  await seek(page, 0);
  const slider = page.locator("[data-kp-focus-deck-scrubber]");
  await slider.focus(); await page.keyboard.press("ArrowRight");
  await expect.poll(async () => Number(await page.locator(deck).getAttribute("data-gradient-step"))).toBeGreaterThan(0);
  await page.keyboard.press("ArrowLeft"); await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", "0");
  const viewport = page.locator("[data-kp-focus-deck-viewport]"); const box = (await viewport.boundingBox())!;
  // Content is bottom-aligned now. Keep the gesture in the small blank margin,
  // not over the final line of selectable prose or the anchored action button.
  const dragY = box.y + box.height - 4;
  await page.mouse.move(box.x + box.width * .8, dragY); await page.mouse.down();
  await page.mouse.move(box.x + box.width * .2, dragY, { steps: 10 });
  const middle = Number(await page.locator(deck).getAttribute("data-gradient-step")); expect(middle).toBeGreaterThan(0); expect(middle).toBeLessThan(1);
  await page.mouse.up(); await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", "1");
  await page.mouse.move(box.x + box.width * .25, dragY); await page.mouse.down();
  await page.mouse.move(box.x + box.width * .85, dragY, { steps: 10 }); await page.mouse.up();
  await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", "0");
  expect(errors).toEqual([]);
});

test("phone and reduced motion retain readable evidence and exact stopping points", async ({ page, browserName }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route); await expect(page.locator(deck)).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  await page.locator("[data-kp-focus-deck-scrubber]").focus(); await page.keyboard.press("End");
  await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", "7");
  await expect(page.locator("[data-gradient-count]")).toHaveText("8 / 8");
  await expect(page.locator("[data-gradient-rate]")).toHaveText("2.83");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = (await page.locator(deck).boundingBox())!; expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(390);
  const overflow = await page.locator("[data-kp-focus-deck-beat]").evaluateAll(elements => Math.max(...elements.map(e => e.scrollHeight - e.clientHeight)));
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: info.outputPath("phone-uphill.png"), fullPage: true });
  await seek(page, 5); await expect(page.locator("[data-gradient-component-evidence]")).toBeHidden();
  await page.getByText("Inspect the numbers", { exact: true }).click();
  await expect(page.locator("[data-gradient-component-evidence]")).toBeVisible();
  await expect(page.locator("[data-gradient-across]")).toHaveText("0.71");
  await page.getByText("Inspect the numbers", { exact: true }).click();
  await expect(page.getByRole("button", { name: "Turn toward uphill" })).toBeVisible();
  const paneBox = (await page.locator("[data-gradient-guided-passage]").boundingBox())!;
  const stageBox = (await page.locator(".kp-surface-contour-stage").boundingBox())!;
  expect(paneBox.y + paneBox.height).toBeLessThanOrEqual(stageBox.y + 1);
  for (const child of [paneBox, stageBox]) {
    expect(child.x).toBeGreaterThanOrEqual(box.x);
    expect(child.x + child.width).toBeLessThanOrEqual(box.x + box.width);
  }
  expect(await page.locator("[data-gradient-guided-passage]").evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("phone-components.png"), fullPage: true });
  const inside = await page.locator(".gradient-overlay").evaluate(element => {
    const rect = element.getBoundingClientRect();
    return [...element.querySelectorAll("[data-gradient-ramp] path,[data-gradient-components] path")].every(item => {
      const bounds = item.getBoundingClientRect();
      return bounds.x >= rect.x && bounds.right <= rect.right && bounds.y >= rect.y && bounds.bottom <= rect.bottom;
    });
  });
  expect(inside).toBe(true);
  await expect(page.locator("[data-gradient-annotations]")).toBeVisible();
  for (const id of ["gradient.across-component", "gradient.along-component"]) {
    const text = page.locator(`[data-kp-focus-deck-annotation="${id}"]`);
    await expect(text).toBeVisible();
    const labelBox = (await text.boundingBox())!;
    expect(labelBox.x).toBeGreaterThanOrEqual(stageBox.x);
    expect(labelBox.x + labelBox.width).toBeLessThanOrEqual(stageBox.x + stageBox.width);
  }
  await page.getByRole("button", { name: "Turn toward uphill" }).click();
  await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", "6");
  await expect(page.locator("[data-gradient-reading-lead]")).toHaveText("The whole step now points across the level lines.");
  expect(await page.locator("[data-gradient-guided-passage]").evaluate(e => e.scrollHeight <= e.clientHeight + 1)).toBe(true);
  if (browserName === "chromium") {
    // Exercise actual touch-generated pointer events over the stationary panel,
    // not a synthetic change of the range input. Other engines need their own cohort.
    const touch = await page.context().newCDPSession(page);
    await touch.send("Emulation.setTouchEmulationEnabled", { enabled: true });
    for (const [from, to] of [[5, 6], [6, 5]] as const) {
      await seek(page, from);
      const panel = page.locator("[data-gradient-guided-passage]"); await panel.scrollIntoViewIfNeeded();
      const rect = (await panel.boundingBox())!, forward = to > from;
      const x = rect.x + rect.width * (forward ? .8 : .2), y = rect.y + rect.height - 4;
      await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: rect.x + rect.width * (forward ? .2 : .8), y }] });
      const intermediate = Number(await page.locator(deck).getAttribute("data-gradient-step"));
      expect(intermediate).toBeGreaterThan(5); expect(intermediate).toBeLessThan(6);
      await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", String(to));
    }
    await touch.detach();
  }
  await page.locator("[data-kp-focus-deck-scrubber]").focus();
  await page.keyboard.press("Home"); await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", "0");
});

test("comparison hands reading to motion without moving prose, then holds the inference", async ({ page }, info) => {
  // Full-motion replay, interruption and both gesture directions share this
  // checkpoint capture; use the same bounded allowance as the primary review.
  test.setTimeout(60000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(route); await expect(page.locator(deck)).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  await seek(page, 5);
  const pane = page.locator("[data-gradient-guided-passage]");
  const reading = pane.locator(".gradient-comparison-reading");
  const body = await reading.innerText();
  const bounds = (await pane.boundingBox())!;
  const cardBounds = (await page.locator(deck).boundingBox())!;
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(cardBounds.x + cardBounds.width);
  const stageBounds = (await page.locator(".kp-surface-contour-stage").boundingBox())!;
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(stageBounds.y + 1);
  await expect(page.locator("[data-gradient-instruction-role]")).toHaveText("Before the move");
  await expect(page.locator(".gradient-viewing-cue")).toHaveCount(1);
  await expect(page.locator("[data-gradient-annotations]")).toBeVisible();
  await expect(page.locator('[data-kp-semantic-entity="gradient.across-component"]')).toHaveAttribute("data-gradient-salience", "focus");
  await expect(page.locator('[data-kp-semantic-entity="gradient.along-component"]')).toHaveAttribute("data-gradient-salience", "context");
  await expect(page.locator("[data-gradient-component-evidence]")).toBeHidden();
  const original = await paint(page);
  await page.waitForTimeout(400);
  expect(await paint(page)).toBe(original); // Reading is learner-paced, not a timer.
  for (const id of ["gradient.unit-direction", "gradient.across-component", "gradient.along-component", "gradient.equal-horizontal-reach"]) {
    await expect(page.locator(`[data-kp-semantic-entity="${id}"]`)).toHaveCount(1);
  }
  await page.screenshot({ path: info.outputPath("attention-prepare.png"), fullPage: true });
  await page.getByRole("button", { name: "Turn toward uphill" }).click();
  await expect(page.locator(deck)).toHaveAttribute("data-gradient-attention-phase", "act");
  expect(await reading.innerText()).toBe(body);
  await expect(page.locator("[data-gradient-instruction-role]")).toHaveText("Watch");
  expect((await pane.boundingBox())!.x).toBe(bounds.x);
  expect((await pane.boundingBox())!.y).toBe(bounds.y);
  await expect(page.locator("[data-kp-focus-deck-beat=across]")).toBeHidden();
  await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", "6");
  await expect(page.locator("[data-gradient-reading-lead]")).toHaveText("The whole step now points across the level lines.");
  await expect(page.locator("[data-gradient-instruction-role]")).toHaveText("What this shows");
  expect(await page.locator(".kp-surface-contour-stage").boundingBox()).toEqual(stageBounds);
  const settled = await paint(page); await page.waitForTimeout(350); expect(await paint(page)).toBe(settled);
  await page.screenshot({ path: info.outputPath("attention-infer.png"), fullPage: true });
  // Local replay does not revisit the camera or earlier card steps.
  await page.locator("[data-kp-focus-deck-replay]").click();
  await expect(page.locator(deck)).toHaveAttribute("data-gradient-attention-phase", "act");
  expect(Number(await page.locator(deck).getAttribute("data-gradient-step"))).toBeGreaterThanOrEqual(5);
  await page.locator("[data-kp-focus-deck-previous]").click();
  await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", "5");
  expect(await reading.innerText()).toBe(body);
  // Native input still owns travel under the stationary reading projection.
  // Transport clicks may scroll the page; do not reuse pre-click viewport coordinates.
  await pane.scrollIntoViewIfNeeded();
  const dragBounds = (await pane.boundingBox())!;
  await page.mouse.move(dragBounds.x + dragBounds.width * .9, dragBounds.y + dragBounds.height - 4); await page.mouse.down();
  await page.mouse.move(dragBounds.x + dragBounds.width * .1, dragBounds.y + dragBounds.height - 4, { steps: 10 });
  const middle = Number(await page.locator(deck).getAttribute("data-gradient-step"));
  expect(middle).toBeGreaterThan(5); expect(middle).toBeLessThan(6);
  expect(await reading.innerText()).toBe(body);
  expect((await pane.boundingBox())!.x).toBe(bounds.x);
  await page.mouse.up(); await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", "6");
  await page.mouse.move(dragBounds.x + dragBounds.width * .1, dragBounds.y + dragBounds.height - 4); await page.mouse.down();
  await page.mouse.move(dragBounds.x + dragBounds.width * .9, dragBounds.y + dragBounds.height - 4, { steps: 10 });
  await page.mouse.up(); await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", "5");
  // Exact seeks restore the same text and paint without replaying intermediate phases.
  await seek(page, 5.5); const midpoint = await paint(page);
  // Full-page capture can resize the viewport and intentionally cancel contact;
  // capture a directly sought pose, never change the viewport during a drag.
  await page.screenshot({ path: info.outputPath("attention-observe.png"), fullPage: true });
  await seek(page, 7); await expect(pane).toBeHidden();
  await seek(page, 5.5); expect(await paint(page)).toBe(midpoint);
  expect(await reading.innerText()).toBe(body);
  for (const [from, to] of [[5, 6], [6, 5]] as const) {
    await seek(page, from); await pane.scrollIntoViewIfNeeded();
    const rect = (await pane.boundingBox())!;
    const laneWidth = await page.locator("[data-kp-focus-deck-viewport]").evaluate(e => e.clientWidth);
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height - 4);
    await page.mouse.wheel((to - from) * laneWidth * .65, 0);
    await expect.poll(async () => Number(await page.locator(deck).getAttribute("data-gradient-step"))).not.toBe(from);
    await expect(page.locator(deck)).toHaveAttribute("data-gradient-step", String(to));
  }
  expect(errors).toEqual([]);
});

test("canonical Graph3D retains shader programs across sampled frames", async ({ page }) => {
  await page.addInitScript(() => {
    const prototype = WebGL2RenderingContext.prototype;
    const create = prototype.createProgram, remove = prototype.deleteProgram;
    let created = 0, deleted = 0;
    prototype.createProgram = function (this: WebGL2RenderingContext) {
      document.documentElement.dataset["gradientProgramsCreated"] = String(++created);
      return create.call(this);
    };
    prototype.deleteProgram = function (this: WebGL2RenderingContext, program: WebGLProgram | null) {
      document.documentElement.dataset["gradientProgramsDeleted"] = String(++deleted);
      return remove.call(this, program);
    };
  });
  await page.goto(route);
  await expect(page.locator(".graph-webgl")).toHaveAttribute("data-kp-surface-contour-capability", "ready");
  await seek(page, 5.2);
  const counts = () => page.locator("html").evaluate(e => ({
    created: Number(e.dataset["gradientProgramsCreated"]), deleted: Number(e.dataset["gradientProgramsDeleted"] ?? 0)
  }));
  const warm = await counts(); expect(warm.created).toBeGreaterThan(0);
  for (const position of [5.3, 5.4, 5.5]) await seek(page, position);
  expect(await counts()).toEqual(warm);
});

test("reference retains its own native surface, contour identity and level control", async ({ page }, info) => {
  await page.goto("/experiments/kinetic-figure/surface-contour/#beat.find-the-intersection");
  await expect(page.locator(".graph-webgl")).toHaveAttribute("data-kp-surface-contour-capability", "ready");
  await page.screenshot({ path: info.outputPath("reference-intersection.png"), fullPage: true });
  await page.goto("/experiments/kinetic-figure/surface-contour/#beat.read-the-map");
  const reference = page.locator("[data-kp-surface-contour-deck]");
  await expect(reference).toHaveAttribute("data-kp-surface-contour-active-beat", "read-the-map");
  await expect(reference.locator("[data-kp-semantic-identity='identity.calculus.surface-contour.same-level-set']")).toHaveCount(1);
  const level = reference.locator("[data-kp-surface-contour-level]"); await expect(level).toBeEnabled(); await level.fill("2.4");
  await expect(reference.locator("[data-kp-surface-contour-stage]")).toHaveAttribute("data-kp-surface-contour-current-level", "2.4000");
  await expect(page.locator(".gradient-overlay")).toHaveCount(0);
});
