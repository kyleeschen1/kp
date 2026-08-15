import { expect, test, type Locator } from "@playwright/test";

const animationId = "animation.generated.distribution.expand-a-sum";

test("the canonical catalogue route uses the typed distribution binding", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`/?artifact=${animationId}`);

  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const transition = player.locator("[data-kp-editor-equation-transition-id]");
  const seek = player.locator('[data-action="seek-editor-animation"]');

  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-distribution-binding",
    "binding.distribution.expand-a-sum.pressure"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-distribution-choreography",
    /binding\.distribution\.expand-a-sum\.pressure$/
  );

  for (const progress of [0, 0.18, 0.5, 0.68, 0.83, 0.94, 1]) {
    await seek.fill(String(progress));
    await expect(transition).toHaveAttribute(
      "data-kp-editor-equation-distribution-progress",
      String(progress)
    );
  }
  expect(errors).toEqual([]);
});

test("factor fan-out and the plus connector are continuous across seek and rewind", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const transition = player.locator("[data-kp-editor-equation-transition-id]");
  const seek = player.locator('[data-action="seek-editor-animation"]');
  const sourceFactor = transition.locator(
    '[data-kp-editor-equation-source] [data-kp-motion-id$=".factored.factor"]'
  );
  const targetFactors = transition.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id$="-factor"]'
  );
  const sourcePlus = transition.locator(
    '[data-kp-editor-equation-source] [data-kp-motion-id$=".factored.plus"]'
  );
  const targetPlus = transition.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id$=".expanded.plus"]'
  );

  await seek.fill("0.5");
  await expect(sourceFactor).toHaveCSS("opacity", "1");
  await expect(targetFactors).toHaveCount(2);
  await expect(sourcePlus).toHaveCSS("opacity", "1");
  await expect(targetPlus).toHaveCSS("opacity", "0");
  const plusY = await centerY(sourcePlus);

  await seek.fill("0.83");
  expect(Math.abs((await centerY(sourcePlus)) - plusY)).toBeLessThan(0.75);
  await expect(sourcePlus).toHaveCSS("opacity", "1");
  await expect(targetPlus).toHaveCSS("opacity", "0");

  await seek.fill("0.94");
  await expect(sourcePlus).toHaveCSS("opacity", "0");
  await expect(targetPlus).toHaveCSS("opacity", "1");
  expect(Math.abs((await centerY(targetPlus)) - plusY)).toBeLessThan(0.75);

  // Catalogue chrome is intentionally compact, so exercise its documented
  // keyboard transport instead of reaching for controls the host omits.
  await player.focus();
  await player.press("r");
  await seek.fill("0.5");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-direction",
    "rewind"
  );
  await expect(player.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id$=".factored.plus"]'
  )).toHaveCSS("opacity", "1");
});

test("visible play advances one native accessible distribution surface", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/?artifact=${animationId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const transition = player.locator("[data-kp-editor-equation-transition-id]");
  const play = player.getByRole("button", { name: "Play animation" });

  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-accessibility-mode",
    "reduced-motion"
  );
  await play.click();
  await expect.poll(async () => Number(
    await transition.getAttribute("data-kp-editor-equation-distribution-progress")
  )).toBeGreaterThan(0.05);
  await expect(player).toHaveCount(1);
  await expect(transition).toHaveCount(1);
  await expect(transition.locator(".katex")).toHaveCount(2);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-dev-review-ready",
    "true"
  );
});

async function centerY(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const rect = range.getBoundingClientRect();
    return rect.top + rect.height / 2;
  });
}
