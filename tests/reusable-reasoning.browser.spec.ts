import { test, expect, type Locator } from "@playwright/test";

async function previewSlider(slider: Locator, value: string) {
  // input is a held drag; change is a committed/released drag. Keep them
  // separate so interruption tests do not accidentally test settled values.
  await slider.evaluate((node, value) => {
    (node as HTMLInputElement).value = value;
    node.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

const route = "/experiments/reusable-reasoning/";

for (const family of ["distribution", "simplification"]) test(`shared playback shows authored ${family} motion and preserves reduced motion`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`/experiments/authoring-${family}-focus-card/`);
  const card = page.locator("[data-kp-focus-deck]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  const attribute = `data-kp-${family}-progress`;
  for (const direction of ["next", "previous"]) {
    const result = await card.evaluate(async (card, { direction, attribute }) => {
      const progress = new Set<number>(), paint = new Set<string>();
      const target = direction === "next" ? 1 : 0;
      const started = performance.now();
      card.querySelector<HTMLButtonElement>(`[data-kp-focus-deck-${direction}]`)!.click();
      do {
        await new Promise(requestAnimationFrame);
        const value = Number(card.getAttribute(attribute));
        if (value > 0 && value < 1) {
          progress.add(value);
          paint.add(Array.from(card.querySelectorAll<HTMLElement>(".kp-focus-deck__stage [style]"))
            .map(node => node.style.cssText).join("|"));
        }
        if (value === target) break;
      } while (performance.now() - started < 6000);
      return { progress: progress.size, paint: paint.size };
    }, { direction, attribute });
    expect(result.progress, direction).toBeGreaterThan(5);
    expect(result.paint, direction).toBeGreaterThan(5);
    await expect(card).toHaveAttribute(attribute, direction === "next" ? "1" : "0");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await card.locator("[data-kp-focus-deck-next]").click();
  await expect(card).toHaveAttribute(attribute, "1");
});

test("buttons visibly sample forward and reverse equation motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(route);
  await expect(page.locator("#authored-focus-card")).toHaveAttribute("data-kp-reasoning-status", "ready");
  for (const direction of ["next", "previous"]) {
    const result = await page.locator("[data-kp-reasoning-card]").evaluate(async (card, direction) => {
      const samples: { progress: number; paint: string; at: number }[] = [];
      const started = performance.now();
      card.querySelector<HTMLButtonElement>(`[data-kp-focus-deck-${direction}]`)!.click();
      while (performance.now() - started < 1800) {
        await new Promise(requestAnimationFrame);
        samples.push({ at: performance.now() - started, progress: Number((card as HTMLElement).dataset["kpReasoningProgress"]),
          paint: Array.from(card.querySelectorAll<HTMLElement>("[data-kp-equation-material-fragment-role]"))
            .map(node => `${node.style.transform}/${node.style.opacity}/${node.style.visibility}`).join("|") });
      }
      return { reduced: matchMedia("(prefers-reduced-motion: reduce)").matches, samples };
    }, direction);
    const intermediate = result.samples.filter(sample => sample.progress > 0 && sample.progress < 1 / 13);
    expect(result.reduced).toBe(false);
    const diagnostic = JSON.stringify({ direction, samples: result.samples.slice(0, 12).map(({ progress, at }) => ({ progress, at })) });
    expect(new Set(intermediate.map(sample => sample.progress)).size, diagnostic).toBeGreaterThan(5);
    expect(new Set(intermediate.map(sample => sample.paint)).size, diagnostic).toBeGreaterThan(5);
    await expect(page.locator("[data-kp-reasoning-card]")).toHaveAttribute("data-kp-reasoning-progress", String(direction === "next" ? 1 / 13 : 0));
  }
});

test("live beat and renewed card gestures respond synchronously while settling", async ({ page }) => {
  await page.goto(route);
  await expect(page.locator("#authored-focus-card")).toHaveAttribute("data-kp-reasoning-status", "ready");
  const result = await page.locator("[data-kp-reasoning-card]").evaluate(async node => {
    const slider = node.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
    const count = () => node.querySelector("[data-reasoning-beat-count]")!.textContent;
    const preview = (value: string) => {
      slider.value = value; slider.dispatchEvent(new Event("input", { bubbles: true }));
      return count();
    };
    const counts = [preview(".7"), preview(".49"), preview(".51"), preview(".44")];
    preview("0"); slider.dispatchEvent(new Event("change", { bubbles: true }));
    const width = node.querySelector<HTMLElement>("[data-kp-focus-deck-viewport]")!.clientWidth;
    const stage = node.querySelector<HTMLElement>(".kp-focus-deck__stage .katex")!;
    const position = () => Number((node as HTMLElement).dataset["kpReasoningProgress"]);
    const wheel = (delta: number, vertical = 0) => stage.dispatchEvent(new WheelEvent("wheel", {
      deltaX: width * delta, deltaY: width * vertical, bubbles: true, cancelable: true,
    }));
    wheel(.6);
    await new Promise(resolve => setTimeout(resolve, 260));
    const beforeRenewal = position(); wheel(.7); const afterRenewal = position();
    // Active horizontal ownership survives diagonal noise.
    wheel(.02, .1); const afterDiagonal = position();
    await new Promise(resolve => setTimeout(resolve, 260));
    const beforeReverse = position(); wheel(-.3); const afterReverse = position();
    return { counts, beforeRenewal, afterRenewal, afterDiagonal, beforeReverse, afterReverse };
  });
  expect(result.counts).toEqual(["2 / 5", "2 / 5", "2 / 5", "1 / 5"]);
  expect(result.afterRenewal).toBeGreaterThan(result.beforeRenewal);
  expect(result.afterDiagonal).toBeGreaterThan(result.afterRenewal);
  expect(result.afterReverse).toBeLessThan(result.beforeReverse);
});

test("embedded product and quotient realize opaque ink compression through the canonical family", async ({ page }, info) => {
  await page.goto(route);
  const card = page.locator("[data-kp-reasoning-card]");
  await expect(page.locator("#authored-focus-card")).toHaveAttribute("data-kp-reasoning-status", "ready");
  const slider = card.locator("[data-kp-focus-deck-scrubber]");
  for (const step of [2, 3]) {
    for (const phase of [.4, .49, .55, .7, .49]) {
      await previewSlider(slider, String(step + phase));
      const stage = card.locator("[data-kp-reader-fit-surface]:visible").last();
      await expect(stage).toHaveAttribute("data-kp-operation-evaluation-realized-primitive-id",
        "kp.rendering.native-katex.primitive.ink-knot.v1");
      const source = stage.locator('[data-kp-equation-material-fragment-role^="successor-source:"]');
      const target = stage.locator('[data-kp-equation-material-fragment-role^="successor-target:"]');
      expect(await source.count()).toBeGreaterThan(0);
      expect(await target.count()).toBeGreaterThan(0);
      const owners = phase < .52 ? source : target;
      const retired = phase < .52 ? target : source;
      for (const owner of await owners.all()) {
        await expect(owner).toHaveCSS("opacity", "1");
        await expect(owner).toHaveCSS("visibility", "visible");
      }
      for (const owner of await retired.all()) await expect(owner).toHaveCSS("visibility", "hidden");
      if (phase === .49) {
        const scales = await source.evaluateAll(elements => elements.map(element => {
          const matrix = new DOMMatrix(getComputedStyle(element).transform);
          return Math.hypot(matrix.a, matrix.b);
        }));
        expect(scales.every(scale => scale > 0 && scale < 1)).toBe(true);
      }
    }
    await card.screenshot({ path: info.outputPath(`evaluation-${step}-ink-kernel.png`) });
    await slider.fill(String(step + 1));
    await expect(card).toHaveAttribute("data-kp-reasoning-state",
      `fraction-solve.state.${step === 2 ? "constant-product" : "constant-quotient"}`);
  }
});

test("release settles slider and passage gestures but cannot resnap restored positions", async ({ page }) => {
  await page.goto(route);
  const root = page.locator("#authored-focus-card");
  const card = page.locator("[data-kp-reasoning-card]");
  const slider = card.locator("[data-kp-focus-deck-scrubber]");
  const passage = card.locator("[data-kp-focus-deck-viewport]");
  await expect(root).toHaveAttribute("data-kp-reasoning-status", "ready");
  await previewSlider(slider, "0.7");
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", String(.7 / 13));
  await slider.dispatchEvent("change");
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", String(1 / 13));
  await slider.fill("0");
  const box = (await slider.boundingBox())!;
  await page.mouse.move(box.x + box.width * .01, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .18, box.y + box.height / 2, { steps: 6 });
  const held = Number(await card.getAttribute("data-kp-reasoning-progress"));
  expect(held).toBeGreaterThan(0); expect(held).toBeLessThan(1 / 13);
  await page.mouse.up();
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", String(1 / 13));
  await slider.fill("0");
  await passage.hover();
  const width = (await passage.boundingBox())!.width;
  await page.mouse.wheel(width * .7, 0);
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", String(1 / 13));
  await previewSlider(slider, "0.37");
  // Begin another modality, then interrupt it with disclosure. A late
  // scrollend must not settle the exact parent return address.
  await passage.dispatchEvent("wheel", { deltaX: 1, deltaY: 0 });
  // Capture at the actual disclosure instant; a release may legitimately
  // advance while an automation command is travelling to the browser.
  const interrupted = await page.getByRole("button", { name: "Why does this step work?" }).evaluate(node => {
    if (!(node instanceof HTMLButtonElement)) throw new Error("Expected disclosure button.");
    const progress = document.querySelector<HTMLElement>("[data-kp-reasoning-card]")!.dataset["kpReasoningProgress"]!;
    node.click(); return progress;
  });
  await page.getByRole("button", { name: "Return to the argument" }).click();
  await passage.dispatchEvent("scrollend");
  await slider.dispatchEvent("change");
  await page.evaluate(async () => { for (let i = 0; i < 40; i++) await new Promise(requestAnimationFrame); });
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", interrupted!);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await previewSlider(slider, "1.7");
  await slider.dispatchEvent("change");
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", String(2 / 13));
  await expect(card).toHaveAttribute("data-kp-reasoning-state", "fraction-solve.state.normalized");
});

for (const count of [4, 3]) test(`Next and Previous mean one semantic operation across readings with ${count} operations`, async ({ page }) => {
  // Split the length matrix so each browser gets a bounded independent case.
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);
  const root = page.locator("#authored-focus-card");
  await expect(root).toHaveAttribute("data-kp-reasoning-status", "ready");
  const card = page.locator("[data-kp-reasoning-card]");
  const slider = card.locator("[data-kp-focus-deck-scrubber]");
  const states = ["factored", "distributed", "normalized", "constant-product", "constant-quotient"];
    if (count === 3) {
      await page.getByText("Edit source JSON", { exact: true }).click();
      await page.getByRole("button", { name: "Load three-step draft", exact: true }).click();
      await page.getByRole("button", { name: "Apply source", exact: true }).click();
    }
    for (const view of ["parent", "reason"]) {
      if (view === "reason") await page.getByRole("button", { name: "Why does this step work?" }).click();
      for (const mode of ["full", "compact"]) {
        await page.locator("[data-reasoning-reading]").selectOption(mode);
        await expect(slider).toHaveAttribute("max", String(count));
        await expect(card.locator(".kp-focus-deck__ticks span")).toHaveCount(count + 1);
        await expect(card.locator("[data-kp-focus-deck-beat]")).toHaveCount(count + 1);
        await slider.fill("0");
        for (let index = 1; index <= count; index++) {
          await card.locator("[data-kp-focus-deck-next]").click();
          await expect(card).toHaveAttribute("data-kp-reasoning-progress", String(index / 13));
          await expect(card).toHaveAttribute("data-kp-reasoning-state", `fraction-solve.state.${states[index]}`);
          await expect(card.locator("[data-reasoning-beat-count]")).toHaveText(`${index + 1} / ${count + 1}`);
          await expect(card.locator('[data-kp-focus-deck-beat][aria-current="page"]'))
            .toHaveAttribute("data-reasoning-state", `fraction-solve.state.${states[index]}`);
        }
        for (let index = count - 1; index >= 0; index--) {
          await card.locator("[data-kp-focus-deck-previous]").click();
          await expect(card).toHaveAttribute("data-kp-reasoning-progress", String(index / 13));
        }
        await previewSlider(slider, "0.7"); await slider.press("ArrowRight");
        await expect(card).toHaveAttribute("data-kp-reasoning-progress", String(1 / 13));
        await previewSlider(slider, "1.2"); await slider.press("ArrowLeft");
        await expect(card).toHaveAttribute("data-kp-reasoning-progress", String(1 / 13));
      }
    }
});

test("reasoning exemplar mounts canonical native ink and returns to interrupted parent position", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/reusable-reasoning/");
  const root = page.locator("#authored-focus-card");
  await expect(root).toHaveAttribute("data-kp-reasoning-status", "ready");
  const card = page.locator("[data-kp-reasoning-card]");
  await expect(card).toHaveAttribute("data-kp-reasoning-state", "fraction-solve.state.factored");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(card.locator(".kp-focus-deck__narrative p").first()).toHaveCSS("font-family", /^Georgia,/);
  const slider = card.locator("[data-kp-focus-deck-scrubber]");
  await card.locator("[data-kp-focus-deck-next]").click();
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", String(1 / 13));
  await page.evaluate(async () => { for (let i = 0; i < 6; i++) await new Promise(requestAnimationFrame); });
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", String(1 / 13));
  await card.locator("[data-kp-focus-deck-previous]").click();
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", "0");
  await previewSlider(slider, "0.37");
  const before = await card.getAttribute("data-kp-reasoning-progress");
  await page.getByRole("button", { name: "Why does this step work?" }).click();
  await expect(root).toHaveAttribute("data-kp-reasoning-view", "reason");
  await expect(slider).toHaveAttribute("max", "4");
  await expect(page.getByText("The denominator 3 is nonzero.")).toBeVisible();
  await card.locator("[data-kp-focus-deck-next]").click();
  await expect(card).toHaveAttribute("data-kp-reasoning-state", "fraction-solve.state.distributed");
  await card.screenshot({ path: info.outputPath("reason-distribution.png") });
  await page.getByRole("button", { name: "Return to the argument" }).click();
  await expect(root).toHaveAttribute("data-kp-reasoning-view", "parent");
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", before!);
  await card.screenshot({ path: info.outputPath("parent-return.png") });
  await page.locator("[data-reasoning-reading]").selectOption("compact");
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", before!);
  await expect(page.getByText("The denominator 3 is nonzero.", { exact: true })).toBeVisible();
  await page.locator("[data-reasoning-reading]").selectOption("full");
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", before!);
  for (const name of ["Predict", "Reconstruct"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator("[data-reasoning-answer]")).toBeHidden();
    await page.locator("[data-reasoning-working]").fill("My attempt stays local.");
    await page.getByRole("button", { name: "Compare with the verified answer" }).click();
    await expect(card).toHaveAttribute("data-kp-reasoning-state", "fraction-solve.state.constant-quotient");
    await expect(page.locator("[data-reasoning-answer]")).toBeVisible();
    await page.getByRole("button", { name: "Return to reading", exact: true }).click();
    await expect(card).toHaveAttribute("data-kp-reasoning-progress", before!);
  }
  expect(errors).toEqual([]);
});

test("combined checkpoint preserves keyboard and continuous passage travel at phone width", async ({ page, browserName }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  const root = page.locator("#authored-focus-card");
  const card = page.locator("[data-kp-reasoning-card]");
  await expect(root).toHaveAttribute("data-kp-reasoning-status", "ready");
  await page.getByRole("button", { name: "Why does this step work?" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Return to the argument" })).toBeFocused();
  const slider = page.locator("[data-kp-focus-deck-scrubber]");
  await slider.focus(); await page.keyboard.press("ArrowRight");
  await expect(card).toHaveAttribute("data-kp-reasoning-state", "fraction-solve.state.distributed");
  await slider.focus(); await page.keyboard.press("Home");
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", "0");
  const viewport = card.locator("[data-kp-focus-deck-viewport]");
  await viewport.scrollIntoViewIfNeeded();
  const initialBox = (await viewport.boundingBox())!;
  const startX = initialBox.x + initialBox.width * .95, dragY = initialBox.y + initialBox.height * .8;
  await page.mouse.move(startX, dragY); await page.mouse.down();
  const samples: number[] = [];
  for (const fraction of [.1, .25, .5, .75, .9]) {
    await page.mouse.move(startX - initialBox.width * fraction, dragY);
    samples.push(Number(await card.getAttribute("data-kp-reasoning-progress")));
  }
  expect(samples.every(value => value > 0 && value < 1 / 13)).toBe(true);
  expect(new Set(samples).size).toBe(5);
  expect(samples).toEqual([...samples].sort((a, b) => a - b));
  await expect(card.locator("[data-reasoning-beat-count]")).toHaveText("2 / 5");
  await page.mouse.up();
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", String(1 / 13));
  await previewSlider(slider, ".4");
  await viewport.click({ position: { x: initialBox.width * .5, y: initialBox.height * .8 } });
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", "0");
  await slider.fill("0");
  await viewport.scrollIntoViewIfNeeded();
  const box = (await viewport.boundingBox())!;
  if (browserName === "chromium") {
  const touch = await page.context().newCDPSession(page);
  await touch.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  const x = box.x + box.width * .85;
  const y = box.y + box.height * .5;
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  const touchSamples: number[] = [];
  for (const distance of [35, 70, 105, 140]) {
    await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - distance, y }] });
    await page.evaluate(() => new Promise(requestAnimationFrame));
    touchSamples.push(Number(await card.getAttribute("data-kp-reasoning-progress")));
  }
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await touch.detach();
  expect(new Set(touchSamples.filter(value => value > 0 && value < 1 / 13)).size).toBeGreaterThanOrEqual(3);
  await expect.poll(async () => {
    const position = Number(await card.getAttribute("data-kp-reasoning-progress")) * 13;
    return Math.abs(position - Math.round(position));
  }).toBeLessThan(1e-10);
  }
  await slider.fill("4");
  await expect(card.locator('[data-kp-reader-accessible-equation-state][aria-current="step"]')).toHaveCount(1);
  await page.screenshot({ path: info.outputPath("phone-reason.png"), fullPage: true });
  await page.locator("[data-reasoning-reading]").selectOption("compact");
  await expect(page.getByText("The denominator 3 is nonzero.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reconstruct", exact: true }).click();
  await expect(card.locator('[data-kp-reader-accessible-equation-state][aria-current="step"]')).toHaveCount(1);
  await page.screenshot({ path: info.outputPath("phone-practice.png"), fullPage: true });
  await page.getByRole("button", { name: "Return to reading", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("native passage crosses multiple beats backward, reverses and preserves restoration and vertical scroll", async ({ page }) => {
  await page.goto(route);
  const card = page.locator("[data-kp-reasoning-card]");
  await expect(page.locator("#authored-focus-card")).toHaveAttribute("data-kp-reasoning-status", "ready");
  const viewport = card.locator("[data-kp-focus-deck-viewport]");
  const slider = card.locator("[data-kp-focus-deck-scrubber]");
  await expect(viewport).toHaveCSS("scroll-snap-type", "none");
  await expect(viewport).toHaveCSS("overflow-x", "auto");
  // Check a fresh vertical gesture independently: native engines may retain
  // a horizontal wheel transaction across synthetic direction changes.
  await slider.fill("1");
  await viewport.hover();
  const before = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 160);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", String(1 / 13));
  await previewSlider(slider, ".37");
  await viewport.evaluate(node => {
    node.scrollLeft = -100; node.dispatchEvent(new Event("scroll"));
    node.scrollLeft = 100000; node.dispatchEvent(new Event("scrollend"));
  });
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", String(.37 / 13));
  await slider.fill("4");
  await viewport.hover();
  const width = (await viewport.boundingBox())!.width;
  // Native engines may cap an individual oversized delta. A sustained stream
  // tests continuous travel without requiring identical OS wheel scaling.
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel(-width * .5, 0);
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  await expect.poll(async () => Number(await card.getAttribute("data-kp-reasoning-progress")) * 13).toBeLessThan(2);
  await expect.poll(async () => {
    const position = Number(await card.getAttribute("data-kp-reasoning-progress")) * 13;
    return position < 2 && Math.abs(position - Math.round(position)) < 1e-8;
  }).toBe(true);
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(width * .5, 0);
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", String(4 / 13));
  await slider.fill("0");
  const restored = await viewport.evaluate(node => {
    node.dispatchEvent(new WheelEvent("wheel", { deltaX: node.clientWidth * .4, cancelable: true, bubbles: true }));
    node.scrollLeft = node.clientWidth * .4;
    node.dispatchEvent(new Event("scroll"));
    const card = document.querySelector<HTMLElement>("[data-kp-reasoning-card]")!;
    const position = card.dataset["kpReasoningProgress"]!;
    document.querySelector<HTMLButtonElement>("[data-reasoning-open]")!.click();
    document.querySelector<HTMLButtonElement>("[data-reasoning-return]")!.click();
    // A late scroll/scrollend has no authority after disclosure. A fresh
    // physical wheel is intentionally NOT treated as a stale callback.
    node.dispatchEvent(new Event("scroll")); node.dispatchEvent(new Event("scrollend"));
    return position;
  });
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", restored);
});


test("source edit reaches native ink, both readings and practice while invalid drafts retain last valid state", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/reusable-reasoning/");
  const root = page.locator("#authored-focus-card");
  await expect(root).toHaveAttribute("data-kp-reasoning-status", "ready");
  const card = page.locator("[data-kp-reasoning-card]");
  const revision = await root.getAttribute("data-kp-reasoning-revision");
  await page.getByText("Edit source JSON", { exact: true }).click();
  await page.getByRole("button", { name: "Load three-step draft", exact: true }).click();
  await expect(root).toHaveAttribute("data-kp-reasoning-revision", revision!);
  await page.getByRole("button", { name: "Apply source", exact: true }).click();
  await expect(root).not.toHaveAttribute("data-kp-reasoning-revision", revision!);
  await expect(page.locator("[data-reasoning-title]")).toHaveText("Stop before the final quotient");
  const applied = await root.getAttribute("data-kp-reasoning-revision");
  await page.locator("[data-kp-focus-deck-scrubber]").fill("3");
  await expect(card).toHaveAttribute("data-kp-reasoning-state", "fraction-solve.state.constant-product");
  await expect(card.locator(".katex-html:visible").filter({ hasText: "12" }).first()).toBeVisible();
  await card.screenshot({ path: info.outputPath("edited-native-endpoint.png") });
  await page.locator("[data-reasoning-reading]").selectOption("compact");
  await expect(card.locator(".kp-focus-deck__narrative")).toContainText("retain the quotient");
  await page.getByRole("button", { name: "Why does this step work?" }).click();
  await page.locator("[data-reasoning-reading]").selectOption("full");
  await expect(page.locator("[data-kp-focus-deck-scrubber]")).toHaveAttribute("max", "3");
  for (const name of ["Predict", "Reconstruct"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.getByRole("button", { name: "Compare with the verified answer" }).click();
    await expect(card).toHaveAttribute("data-kp-reasoning-state", "fraction-solve.state.constant-product");
    await expect(page.locator("[data-reasoning-answer]")).toContainText("Evaluate the constant product");
    await expect(page.locator("[data-reasoning-answer]")).toHaveAttribute("data-reasoning-answer-operations", /fraction-solve.step.constant-product/);
    await expect(page.locator("[data-reasoning-answer]")).not.toHaveAttribute("data-reasoning-answer-operations", /constant-quotient/);
    await page.getByRole("button", { name: "Return to reading", exact: true }).click();
  }
  await previewSlider(page.locator("[data-kp-focus-deck-scrubber]"), "1.37");
  const position = await card.getAttribute("data-kp-reasoning-progress");
  await page.locator("[data-reasoning-json]").fill("{");
  await page.getByRole("button", { name: "Apply source", exact: true }).click();
  await expect(page.locator("[data-reasoning-draft-status]")).toContainText("Last valid lesson retained");
  await expect(root).toHaveAttribute("data-kp-reasoning-revision", applied!);
  await expect(card).toHaveAttribute("data-kp-reasoning-progress", position!);
  expect(errors).toEqual([]);
});
