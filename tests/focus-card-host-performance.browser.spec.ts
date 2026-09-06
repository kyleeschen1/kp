import { expect, test } from "@playwright/test";

const animationId = "animation.algebra.log-exponent.solve-two-power-x";

for (const width of [1100, 390]) test(`Focus Card automatic passage/stage performance at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 800 });
  await page.goto("/experiments/kinetic-figure/supply-tax/#beat.log-exponent.locate-the-unknown");
  const card = page.locator("[data-kp-log-exponent-focus-card]");
  const stage = card.locator("[data-kp-log-exponent-stage]");
  await expect(card.locator("[data-kp-editor-animation-player]")).toHaveAttribute("data-kp-editor-animation-surface-readiness", "ready");
  await card.scrollIntoViewIfNeeded();
  await card.locator("[data-kp-focus-deck-next]").click();
  const evidence = await card.evaluate(async element => {
    const card = element as HTMLElement;
    const viewport = card.querySelector<HTMLElement>("[data-kp-focus-deck-viewport]")!;
    const stage = card.querySelector<HTMLElement>("[data-kp-log-exponent-stage]")!;
    let previous = performance.now();
    const intervals: number[] = [];
    let materialSamples = 0;
    const passagePositions = new Set<string>();
    card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-next]")!.click();
    const started = performance.now();
    do {
      const now = await new Promise<number>(resolve => requestAnimationFrame(resolve));
      intervals.push(now - previous);
      previous = now;
      if (stage.dataset["kpLogExponentVisualOwner"] === "material-scene") materialSamples++;
      passagePositions.add((viewport.scrollLeft / Math.max(1, viewport.clientWidth)).toFixed(2));
      if (now - started > 10_000) throw new Error("Focus Card automatic motion failed to settle.");
    } while (card.dataset["kpLogExponentTransition"] !== "settled");
    const sorted = [...intervals].sort((a, b) => a - b);
    return { samples: intervals.length, materialSamples, p50Ms: sorted[Math.floor(sorted.length * .5)],
      p95Ms: sorted[Math.floor(sorted.length * .95)], maxMs: sorted.at(-1),
      passagePositions: [...passagePositions], beat: card.dataset["kpFocusDeckActiveBeat"] };
  });
  expect(evidence.materialSamples).toBeGreaterThan(0);
  expect(evidence.beat).toBe("apply-logarithms");
  expect(evidence.passagePositions).toEqual(["2.00"]);
  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");
  await expect(card).toHaveAttribute("data-kp-log-exponent-deck-position", "2.0000");
  await page.setViewportSize({ width: width === 390 ? 1100 : 390, height: 800 });
  await expect.poll(() => card.locator("[data-kp-focus-deck-viewport]").evaluate(element =>
    element.scrollLeft / Math.max(1, element.clientWidth))).toBeCloseTo(2, 1);
  await expect(card).toHaveAttribute("data-kp-focus-deck-active-beat", "apply-logarithms");
  console.log(JSON.stringify({ host: "focus-card-auto", width, browser: info.project.name, ...evidence }));
  await info.attach("automatic-passage-stage-performance", { body: JSON.stringify(evidence, null, 2), contentType: "application/json" });
});

// Compare the same asset through the same surface adapter. Fraction-reader
// measurements cannot establish a Focus Card host regression.
for (const host of ["focus-card", "catalogue"] as const) {
  test(`${host}: same-asset first traversal and warm reverse performance`, async ({ page }, info) => {
    test.setTimeout(60_000);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.goto(host === "focus-card" ? "/experiments/kinetic-figure/supply-tax/" : `/?artifact=${animationId}`);
    const player = page.locator(`[data-kp-editor-animation-player][data-kp-editor-animation-id="${animationId}"]`);
    const stage = player.locator("[data-kp-log-exponent-stage]");
    await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");
    await expect(player).toHaveAttribute("data-kp-editor-animation-surface-readiness", "ready");
    await player.scrollIntoViewIfNeeded();
    const evidence = await player.evaluate(async element => {
      const controllerPath = "/src/editor/animation-player-controller.ts";
      const { dispatchKpEditorAnimationPlaybackAction: dispatch } = await import(controllerPath);
      const player = element as HTMLElement;
      const stage = player.querySelector<HTMLElement>("[data-kp-log-exponent-stage]")!;
      await document.fonts.ready;
      const frame = () => new Promise<number>(resolve => requestAnimationFrame(resolve));
      const summaries = [];
      for (const phase of ["first-traversal", "warm"] as const) {
        let endpointMutations = 0;
        let materialSamples = 0;
        const observer = new MutationObserver(records => { endpointMutations += records.length; });
        for (const root of stage.querySelectorAll("[data-kp-log-exponent-endpoint-index]")) {
          observer.observe(root, { attributes: true, attributeFilter: ["aria-hidden", "inert"] });
        }
        const frameMs: number[] = [];
        const dispatchMs: number[] = [];
        let previous = await frame();
        for (let i = 0; i < 60; i++) {
          // Stay inside the first operation, then reverse without changing host
          // cadence or inventing a replacement animation clock in production.
          const progress = 0.05 + 0.2 * (i < 30 ? i / 30 : (60 - i) / 30);
          const start = performance.now();
          dispatch(player, { type: "seek", progress });
          dispatchMs.push(performance.now() - start);
          const now = await frame();
          frameMs.push(now - previous);
          previous = now;
          if (stage.dataset["kpLogExponentVisualOwner"] === "material-scene") materialSamples++;
          if (stage.querySelectorAll('[data-kp-log-exponent-endpoint-index][aria-hidden="false"]').length !== 1) {
            throw new Error("Every sampled frame must retain one accessible equation endpoint.");
          }
        }
        await frame();
        observer.disconnect();
        const summary = (values: number[]) => {
          const sorted = [...values].sort((a, b) => a - b);
          return { p50: sorted[Math.floor(sorted.length * .5)]!, p95: sorted[Math.floor(sorted.length * .95)]!, max: sorted.at(-1)! };
        };
        summaries.push({ phase, samples: frameMs.length, frames: summary(frameMs), dispatch: summary(dispatchMs), endpointMutations, materialSamples });
      }
      return { summaries, animationId: player.dataset["kpEditorAnimationId"],
        adapter: player.querySelector<HTMLElement>("[data-kp-editor-animation-surface-slot]")?.dataset["kpEditorAnimationAdapterId"],
        owner: stage.dataset["kpLogExponentVisualOwner"],
        accessibleEndpoints: stage.querySelectorAll('[data-kp-log-exponent-endpoint-index][aria-hidden="false"]').length };
    });
    expect(evidence.animationId).toBe(animationId);
    expect(evidence.adapter).toBe("editor-animation-surface.log-exponent.canonical-native-katex");
    expect(evidence.accessibleEndpoints).toBe(1);
    expect(evidence.owner).not.toBe("fallback-native");
    for (const summary of evidence.summaries) {
      expect(summary.materialSamples).toBeGreaterThan(0);
      // Semantic accessibility changes only when the nearest owned endpoint
      // changes, not once per animation frame. Timing remains reported evidence.
      expect(summary.endpointMutations).toBeLessThan(30);
    }
    expect(errors).toEqual([]);
    console.log(JSON.stringify({ host, browser: info.project.name, ...evidence }));
    await info.attach("same-asset-host-performance", { body: JSON.stringify(evidence, null, 2), contentType: "application/json" });
  });
}
