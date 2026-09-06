import { expect, test } from "@playwright/test";

const route = "/experiments/authoring-distribution-focus-card/";
for (const width of [1100, 390]) test(`authored fraction Focus Card preserves native motion and passage at ${width}`, async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width, height: 800 });
  await page.goto(route);
  const card = page.locator("[data-kp-authoring-distribution-card]");
  await expect(card).toHaveAttribute("data-kp-authoring-distribution-card", "ready");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator("[data-kp-log-exponent-stage]")).toHaveCount(0);
  await expect(card).toHaveAttribute("data-kp-distribution-state", "fraction-solve.state.factored");
  const pins = await card.evaluate(node => [node.getAttribute("data-kp-authoring-structural-before"), node.getAttribute("data-kp-authoring-structural-after")]);
  expect(pins[0]).toBeTruthy(); expect(pins[1]).toBeTruthy(); expect(pins[0]).not.toBe(pins[1]);
  await card.screenshot({ path: info.outputPath("authored-fraction-source.png") });
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
  expect(evidence.material).toBeGreaterThan(0);
  await expect(card).toHaveAttribute("data-kp-focus-deck-active-beat", "distributed");
  await card.screenshot({ path: info.outputPath("authored-fraction-target.png") });
  await card.locator("[data-kp-focus-deck-previous]").click();
  await expect(card).toHaveAttribute("data-kp-distribution-progress", "0");
  await card.locator("[data-kp-focus-deck-scrubber]").fill("0.5");
  await expect(card).toHaveAttribute("data-kp-distribution-progress", "0.5");
  await card.screenshot({ path: info.outputPath("authored-fraction-transit.png") });
  await page.goto(route + "#beat.authoring-distribution.distributed");
  await expect(card).toHaveAttribute("data-kp-authoring-distribution-card", "ready");
  await expect(card).toHaveAttribute("data-kp-distribution-state", "fraction-solve.state.distributed");
  await page.setViewportSize({ width: width === 390 ? 430 : 1000, height: 850 });
  await expect(card).toHaveAttribute("data-kp-distribution-progress", "1");
  await card.locator("[data-kp-focus-deck-viewport]").evaluate(node => { node.scrollLeft = 0; });
  await expect(card).toHaveAttribute("data-kp-distribution-progress", "0");
  await card.locator("[data-kp-focus-deck-replay]").click();
  await expect(card).toHaveAttribute("data-kp-distribution-progress", "1");
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
