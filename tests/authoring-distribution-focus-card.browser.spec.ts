import { expect, test } from "@playwright/test";

const route = "/experiments/authoring-distribution-focus-card/";
for (const width of [1100, 390]) test(`authored fraction Focus Card preserves native motion and passage at ${width}`, async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width, height: 800 });
  await page.goto(route);
  const card = page.locator("[data-kp-authoring-distribution-card]");
  await expect(card).toHaveAttribute("data-kp-authoring-distribution-card", "ready");
  await expect(card.locator(".kp-focus-deck__narrative p").first()).toHaveCSS("font-family", 'Georgia, "Times New Roman", serif');
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator("[data-kp-log-exponent-stage]")).toHaveCount(0);
  await expect(card).toHaveAttribute("data-kp-distribution-state", "fraction-solve.state.factored");
  const pins = await card.evaluate(node => [node.getAttribute("data-kp-authoring-structural-before"), node.getAttribute("data-kp-authoring-structural-after")]);
  expect(pins[0]).toBeTruthy(); expect(pins[1]).toBeTruthy(); expect(pins[0]).not.toBe(pins[1]);
  await card.screenshot({ path: info.outputPath("authored-fraction-source.png") });
  const profiler = process.env["KP_PROFILE_AUTHORED_CARD"] === "1" && info.project.name === "chromium" ? await page.context().newCDPSession(page) : undefined;
  await profiler?.send("Profiler.enable");
  await profiler?.send("Profiler.start");
  const evidence = await card.evaluate(async node => {
    const card = node as HTMLElement;
    const deltas: number[] = [];
    let previous = performance.now();
    let material = 0;
    card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-next]")!.click();
    while (card.dataset["kpDistributionState"] !== "fraction-solve.state.distributed") {
      const now = await new Promise<number>(resolve => requestAnimationFrame(resolve));
      deltas.push(now - previous); previous = now;
      if (card.querySelector('[data-kp-reader-canonical-equation-session-owner="material-scene"]')) material++;
      if (deltas.length > 600) throw new Error("Distribution did not settle.");
    }
    const sorted = [...deltas].sort((a, b) => a - b);
    return { material, samples: deltas.length, p50: sorted[Math.floor(sorted.length * .5)], p95: sorted[Math.floor(sorted.length * .95)], max: sorted.at(-1) };
  });
  // A correct endpoint plus one intermediate frame can still look instantaneous.
  expect(evidence.material).toBeGreaterThan(20);
  expect(evidence.max).toBeLessThan(180);
  await expect(card).toHaveAttribute("data-kp-focus-deck-active-beat", "distributed");
  await card.screenshot({ path: info.outputPath("authored-fraction-target.png") });
  await card.locator("[data-kp-focus-deck-previous]").click();
  await expect(card).toHaveAttribute("data-kp-distribution-progress", "0");
  await card.locator("[data-kp-focus-deck-scrubber]").fill("0.5");
  await expect(card).toHaveAttribute("data-kp-distribution-progress", "0.5");
  await card.screenshot({ path: info.outputPath("authored-fraction-transit.png") });
  const scrubCosts = await card.evaluate(async node => {
    const range = node.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
    const costs: number[] = [];
    for (let i = 0; i < 40; i++) {
      await new Promise(requestAnimationFrame);
      range.value = String((i % 20 + 1) / 22);
      const start = performance.now();
      range.dispatchEvent(new Event("input", { bubbles: true }));
      costs.push(performance.now() - start);
    }
    return costs;
  });
  console.log(JSON.stringify({ scrubCosts, browser: info.project.name, width }));
  expect(Math.max(...scrubCosts)).toBeLessThan(140);
  if (profiler) {
    const { profile } = await profiler.send("Profiler.stop");
    await info.attach("native-card-cpu-profile", { body: JSON.stringify(profile), contentType: "application/json" });
    const weights = new Map<number, number>();
    profile.samples?.forEach((id, i) => weights.set(id, (weights.get(id) ?? 0) + (profile.timeDeltas?.[i] ?? 0)));
    console.log(JSON.stringify(profile.nodes.map(node => ({ name: node.callFrame.functionName, url: node.callFrame.url, ms: (weights.get(node.id) ?? 0) / 1000 })).sort((a,b) => b.ms-a.ms).slice(0,20)));
  }
  await page.goto(route + "#beat.authoring-distribution.distributed");
  await expect(card).toHaveAttribute("data-kp-authoring-distribution-card", "ready");
  await expect(card).toHaveAttribute("data-kp-distribution-state", "fraction-solve.state.distributed");
  await page.setViewportSize({ width: width === 390 ? 430 : 1000, height: 850 });
  await expect(card).toHaveAttribute("data-kp-distribution-progress", "1");
  const swipeProgresses = await card.evaluate(async node => {
    const card = node as HTMLElement;
    const viewport = card.querySelector<HTMLElement>("[data-kp-focus-deck-viewport]")!;
    viewport.scrollLeft = 0;
    const samples: number[] = [];
    for (let i = 0; i < 120; i++) {
      await new Promise(requestAnimationFrame);
      const progress = Number(card.dataset["kpDistributionProgress"]);
      samples.push(progress);
      if (progress === 0) break;
    }
    return samples;
  });
  expect(swipeProgresses.filter(progress => progress > 0 && progress < 1).length).toBeGreaterThan(20);
  await expect(card).toHaveAttribute("data-kp-distribution-progress", "0");
  await card.locator("[data-kp-focus-deck-replay]").click();
  await expect(card).toHaveAttribute("data-kp-distribution-progress", "1");
  await card.locator("[data-kp-focus-deck-scrubber]").fill("0.3");
  await card.locator("[data-kp-focus-deck-next]").click();
  await card.locator("[data-kp-focus-deck-previous]").click();
  await expect(card).toHaveAttribute("data-kp-distribution-progress", "0");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ width, browser: info.project.name, ...evidence }));
  await info.attach("authored-card-playback", { body: JSON.stringify(evidence), contentType: "application/json" });
});

test("authored card honors reduced motion and fails closed when prepared source is unavailable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);
  const card = page.locator("[data-kp-authoring-distribution-card]");
  await expect(card).toHaveAttribute("data-kp-authoring-distribution-card", "ready");
  await card.locator("[data-kp-focus-deck-next]").click();
  await expect(card).toHaveAttribute("data-kp-distribution-progress", "1");
  await expect(card.locator('[data-kp-reader-accessible-equation-state][aria-current="step"]')).toHaveCount(1);
  await page.route("**/api/dev/authoring-structural/distribution-focus-card", route => route.fulfill({ status: 422, body: "{}" }));
  await page.reload();
  await expect(page.locator('[role="alert"]')).toContainText("preparation-gap");
  await expect(page.locator('[data-kp-authoring-distribution-card="ready"]')).toHaveCount(0);
});

test("card paint cache preserves uncached native material pixels", async ({ page }) => {
  await page.goto(route);
  const card = page.locator('[data-kp-authoring-distribution-card="ready"]');
  await expect(card).toBeVisible();
  const stage = card.locator("[data-distribution-stage]");
  const scrub = async (value: number) => card.evaluate((node, value) => {
    const range = node.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
    range.value = String(value); range.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
  const cached = [];
  for (const progress of [.25, .75]) { await scrub(progress); cached.push(await stage.screenshot()); }
  await card.evaluate(node => node.querySelectorAll<HTMLElement>("[data-kp-equation-material-visual-cache]").forEach(surface => { delete surface.dataset["kpEquationMaterialVisualCache"]; }));
  for (const [index, progress] of [.25, .75].entries()) {
    await scrub(progress);
    expect((await stage.screenshot()).equals(cached[index]!)).toBe(true);
  }
});

test("coherent fraction copies retain native internal arrangement through forward and reverse", async ({ page }, info) => {
  for (const width of [1100, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(route);
    const card = page.locator('[data-kp-authoring-distribution-card="ready"]');
    await expect(card).toBeVisible();
    const shapes = [];
    for (const progress of [.12, .3, .5, .7, .88, .7, .3, .12]) {
      await card.locator("[data-kp-focus-deck-scrubber]").fill(String(progress));
      shapes.push(await card.evaluate(node => ["x", "6"].map(branch => {
        const rects = ["numerator", "fraction-rule", "denominator"].map(part => {
          const owner = node.querySelector<HTMLElement>(`[data-kp-equation-material-semantic-entity-id="fraction-fan-out.target.factor.${branch}.${part}"]`)!;
          const rect = owner.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        });
        return rects.map(rect => ({ dx: rect.x - rects[0]!.x, dy: rect.y - rects[0]!.y, width: rect.width, height: rect.height }));
      })));
      if (progress === .12 || progress === .3 || progress === .5) await card.screenshot({ path: info.outputPath(`coherent-fraction-${width}-${progress}.png`) });
    }
    for (const shape of shapes) for (const branch of [0, 1]) for (const part of [0, 1, 2]) {
      for (const key of ["dx", "dy", "width", "height"] as const) {
        expect(Math.abs(shape[branch]![part]![key] - shapes[0]![branch]![part]![key]), `${width}: ${branch}/${part}/${key}`).toBeLessThan(1);
      }
    }
  }
});

for (const kind of ["distribution", "simplification"]) test(`shared card stays legible without JavaScript: ${kind}`, async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 800 } });
  const page = await context.newPage();
  await page.goto(`/experiments/authoring-${kind}-focus-card/`);
  const card = page.locator('[data-kp-focus-deck-static="true"]');
  await expect(card).toBeVisible();
  await expect(card.locator(".katex")).toHaveCount(2);
  const passages = card.locator(".kp-focus-deck__narrative p");
  await expect(passages).toHaveCount(2);
  for (const passage of await passages.all()) {
    await expect(passage).toBeVisible();
    await expect(passage).toHaveCSS("font-family", 'Georgia, "Times New Roman", serif');
    expect(await passage.evaluate(node => node.getBoundingClientRect().bottom <= node.closest("[data-kp-focus-deck]")!.getBoundingClientRect().bottom)).toBe(true);
  }
  await expect(card.locator("[data-kp-focus-deck-next]")).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await card.screenshot({ path: info.outputPath(`static-${kind}.png`) });
  await context.close();
});

for (const kind of ["distribution", "simplification"]) test(`shared card disposes and restores its lifecycle: ${kind}`, async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`/experiments/authoring-${kind}-focus-card/`);
  const card = page.locator(`[data-kp-authoring-${kind}-card="ready"]`);
  await expect(card).toBeVisible();
  await expect(card.locator(".kp-focus-deck__narrative p").first()).toHaveCSS("font-family", 'Georgia, "Times New Roman", serif');
  await page.evaluate(() => {
    dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
    dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
  });
  await card.locator("[data-kp-focus-deck-next]").click();
  await expect(card).toHaveAttribute(kind === "distribution" ? "data-kp-distribution-progress" : "data-kp-simplification-progress", "1");
  await page.evaluate(() => {
    dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false }));
    dispatchEvent(new Event("resize"));
    document.dispatchEvent(new Event("visibilitychange"));
    dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
    document.querySelector<HTMLButtonElement>("[data-kp-focus-deck-replay]")!.click();
  });
  expect(errors).toEqual([]);
});
