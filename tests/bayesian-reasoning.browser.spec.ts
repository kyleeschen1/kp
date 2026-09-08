import { test, expect } from "@playwright/test";

test("Bayes card uses seven shared semantic stops and animated keyboard traversal", async ({ page }) => {
  await page.goto("/experiments/bayesian-reasoning/");
  const card = page.locator("[data-bayes-card]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  const slider = card.locator("[data-kp-focus-deck-scrubber]");
  await slider.focus(); await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(250);
  const position = Number(await card.getAttribute("data-bayes-position"));
  expect(position).toBeGreaterThan(0); expect(position).toBeLessThan(1);
  await expect(slider).toHaveValue("1", { timeout: 4000 });
  await expect(card.locator("[data-bayes-count]")).toHaveText("2 / 7");
  await page.keyboard.press("ArrowLeft");
  await expect(slider).toHaveValue("0", { timeout: 4000 });
  await expect(card.locator("[data-bayes-count]")).toHaveText("1 / 7");
  const viewport = card.locator("[data-kp-focus-deck-viewport]");
  const samples = await viewport.evaluate(async viewport => {
    const samples: number[] = [];
    for (const step of [.3, .8, 1.4, 1.8, 1.3, .7]) {
      viewport.dispatchEvent(new WheelEvent("wheel", { deltaX: 1, bubbles: true }));
      viewport.scrollLeft = viewport.clientWidth * step;
      viewport.dispatchEvent(new Event("scroll"));
      await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
      samples.push(Number(viewport.closest<HTMLElement>("[data-bayes-card]")!.dataset["bayesPosition"]));
    }
    viewport.dispatchEvent(new Event("scrollend"));
    return samples;
  });
  expect(new Set(samples).size, JSON.stringify(samples)).toBeGreaterThan(4);
  expect(samples.at(-1)).toBeLessThan(samples[3]!);
  // A new intent interrupts travel; a stale gesture must not reclaim the clock.
  await slider.focus(); await page.keyboard.press("Home");
  await expect(slider).toHaveValue("0", { timeout: 5000 });
  await page.waitForTimeout(450); await expect(slider).toHaveValue("0");
  await expect(page.locator("[data-bayes-error]")).toBeHidden();
});

test("Bayes quotient traverses canonical native material and native endpoints", async ({ page }) => {
  await page.goto("/experiments/bayesian-reasoning-native-probe/");
  await expect(page.locator("[data-bayes-native-status]")).toHaveText("ready", { timeout: 60000 });
  const frames = await page.evaluate(() => {
    const probe = (window as unknown as { bayesNativeProbe: { seek: (progress: number) => { nativeEndpointPassed: boolean; canonicalPaintOwner: boolean; motionAuthority: string } } }).bayesNativeProbe;
    return [0, .25, .5, .75, 1, .75, .25, 0].map(progress => ({ progress, ...probe.seek(progress) }));
  });
  for (const frame of frames.filter(frame => frame.progress === 0 || frame.progress === 1)) expect(frame.nativeEndpointPassed).toBe(true);
  expect(frames.some(frame => frame.progress > 0 && frame.progress < 1 && frame.canonicalPaintOwner)).toBe(true);
  await expect(page.locator("[data-bayes-native-status][data-error]")).toHaveCount(0);
});
