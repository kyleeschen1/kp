import { mkdir } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

const route = "/tutorials/programming/lisp-function-application/";
const evidenceDirectory = "tmp/codex/botanical-lisp-tutorial";

test("the shared shell preserves the approved reader attention cues", async ({ page }) => {
  await page.setViewportSize({ width: 1_440, height: 900 });
  await page.goto(route);
  const root = page.locator("[data-kp-lisp-function-application-tutorial]");
  const passage = root.locator(
    '[data-kp-lisp-tutorial-passage="binding-before"]'
  );
  const motion = root.locator(
    '[data-kp-tutorial-motion-block="bind-and-reconstruct"]'
  );

  await expect(motion).toHaveAttribute(
    "data-kp-tutorial-motion-introduction",
    "binding-before"
  );
  await expect(motion).toHaveAttribute(
    "aria-describedby",
    "kp-passage-binding-before"
  );
  expect(await motion.evaluate((element) =>
    element.previousElementSibling?.id
  )).toBe("kp-passage-binding-before");
  const introductionGap = await motion.evaluate((element) => {
    const before = element.previousElementSibling!.getBoundingClientRect();
    return element.getBoundingClientRect().top - before.bottom;
  });
  expect(introductionGap).toBeLessThanOrEqual(24);
  await expect.poll(() => passage.locator("p").first().evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).textIndent)
  )).toBeGreaterThan(0);

  await passage.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.38
  }));
  await expect(root).toHaveAttribute(
    "data-kp-lisp-tutorial-reading-passage",
    "binding-before"
  );
  await expect(passage).toHaveAttribute("data-kp-lisp-reading-active", "true");
  const toc = root.locator("kp-tutorial-toc");
  await expect(toc).toHaveAttribute(
    "data-kp-tutorial-toc-active-id",
    "bind-argument"
  );

  const pointer = root.locator("[data-kp-lisp-tutorial-reading-band]");
  await expect(pointer).toHaveAttribute("data-kp-reading-band-state", "crossing");
  const cueProjection = await pointer.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const activePassage = document.querySelector<HTMLElement>(
      '[data-kp-lisp-reading-active="true"]'
    )!;
    return {
      background: style.backgroundColor,
      clipPath: style.clipPath,
      opacity: style.opacity,
      pointerEvents: style.pointerEvents,
      zIndex: Number(style.zIndex),
      width: bounds.width,
      height: bounds.height,
      right: bounds.right,
      passageLeft: activePassage.getBoundingClientRect().left,
      rail: getComputedStyle(activePassage).borderLeftColor
    };
  });
  expect(cueProjection).toMatchObject({
    opacity: "1",
    pointerEvents: "none"
  });
  expect(cueProjection.background).toBe(cueProjection.rail);
  expect(cueProjection.clipPath).toContain("polygon");
  expect(cueProjection.zIndex).toBeGreaterThan(12);
  expect(cueProjection.width).toBeGreaterThanOrEqual(16);
  expect(cueProjection.height).toBeGreaterThanOrEqual(19);
  expect(cueProjection.right).toBeLessThan(cueProjection.passageLeft);
});

test("capture the complete local Lisp tutorial checkpoint story", async ({ page }) => {
  await mkdir(evidenceDirectory, { recursive: true });
  await page.setViewportSize({ width: 1_440, height: 900 });
  for (const [name, hash, progress] of [
    ["wide-application", "application-ready", "0.0000"],
    ["wide-binding", "binding-established", "0.3404"],
    ["wide-reconstructed", "body-reconstructed", "0.7400"],
    ["wide-evaluation", "evaluation-gathering", "0.8908"],
    ["wide-result", "result-settled", "1.0000"]
  ] as const) {
    await page.goto(`${route}#kp-checkpoint-${hash}`);
    await settle(page, progress);
    const nativeBounds = await page.locator(
      '[data-kp-lisp-current="true"][aria-hidden="false"]'
    ).evaluate((element) => {
      const expression = element.getBoundingClientRect();
      const stage = element.closest<HTMLElement>(".kp-lisp-tutorial__stage")!
        .getBoundingClientRect();
      return {
        expressionLeft: expression.left,
        expressionRight: expression.right,
        stageLeft: stage.left,
        stageRight: stage.right
      };
    });
    expect(nativeBounds.expressionLeft).toBeGreaterThanOrEqual(nativeBounds.stageLeft);
    expect(nativeBounds.expressionRight).toBeLessThanOrEqual(nativeBounds.stageRight);
    await page.screenshot({
      path: `${evidenceDirectory}/${name}.png`,
      fullPage: false
    });
  }
});

test("capture the phone lesson with its persistent stage and native result", async ({ page }) => {
  await mkdir(evidenceDirectory, { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${route}#kp-checkpoint-result-settled`);
  await settle(page, "1.0000");
  await expect(page.locator('[data-kp-lisp-native-code="result"]')).toBeVisible();
  await page.screenshot({
    path: `${evidenceDirectory}/phone-result.png`,
    fullPage: false
  });
});

async function settle(page: Page, progress: string): Promise<void> {
  const root = page.locator("[data-kp-lisp-function-application-tutorial]");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-progress", progress);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      let stableFrames = 0;
      let previous = scrollY;
      const sample = (): void => {
        const current = scrollY;
        stableFrames = Math.abs(current - previous) < 0.5 ? stableFrames + 1 : 0;
        previous = current;
        if (stableFrames >= 5) resolve();
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
  });
}
