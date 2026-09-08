import { test, expect } from "@playwright/test";

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
