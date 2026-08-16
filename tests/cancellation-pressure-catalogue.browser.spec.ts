import { expect, test } from "@playwright/test";
import {
  kpCounterOrbitCancellationTiming
} from "../src/animation/counter-orbit-cancellation-timing.ts";

const animationId = "animation.generated.cancellation.additive-inverses";
const cancellationBrowserExpectations = Object.freeze({
  minimumObservablePlaybackProgress: 0.04
});

test("the catalogue realizes the typed counter-orbit cancellation policy", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`/?artifact=${animationId}`);

  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const transition = player.locator("[data-kp-editor-equation-transition-id]");
  const seek = player.locator('[data-action="seek-editor-animation"]');

  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-witnessed-annihilation-active",
    "false"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-cancellation-recipe",
    "counter-orbit-v1"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-zero-witness-recipe",
    "none"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-linear-rearrangement",
    "cancel-additive-inverses"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-semantic-motion-choreography",
    /recipe\.semantic-motion\.inverse-cancellation\.v1/u
  );
  await expect(transition).not.toHaveAttribute(
    "data-kp-editor-equation-witnessed-annihilation-binding"
  );

  const deterministicCheckpoints = [
    0,
    kpCounterOrbitCancellationTiming.meetStart,
    midpoint(
      kpCounterOrbitCancellationTiming.meetStart,
      kpCounterOrbitCancellationTiming.contactAt
    ),
    kpCounterOrbitCancellationTiming.contactAt,
    kpCounterOrbitCancellationTiming.retirementEnd,
    1
  ];
  for (const progress of deterministicCheckpoints) {
    await seek.fill(String(progress));
    await expect(transition).toHaveAttribute(
      "data-kp-editor-equation-semantic-progress",
      String(progress)
    );
  }
  expect(errors).toEqual([]);
});

test("inverse terms counter-orbit, contact, and then retire together", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const transition = player.locator("[data-kp-editor-equation-transition-id]");
  const seek = player.locator('[data-action="seek-editor-animation"]');
  const source = transition.locator("[data-kp-editor-equation-source]");
  const target = transition.locator("[data-kp-editor-equation-target]");
  const leftAddend = source.locator('[data-kp-motion-id$=".lhs.addend"]');
  const leftInverse = source.locator('[data-kp-motion-id$=".lhs.subtract"]');
  const rightInverse = source.locator('[data-kp-motion-id$=".rhs.subtract"]');

  const orbitProgress = midpoint(
    kpCounterOrbitCancellationTiming.meetStart,
    kpCounterOrbitCancellationTiming.contactAt
  );
  await seek.fill(String(orbitProgress));
  const orbit = await Promise.all([
    motionEvidence(leftAddend),
    motionEvidence(leftInverse)
  ]);
  expect(orbit[0].opacity).toBeCloseTo(1, 5);
  expect(orbit[1].opacity).toBeCloseTo(1, 5);
  expect(Math.sign(orbit[0].centerY - orbit[1].centerY)).not.toBe(0);

  await seek.fill(String(kpCounterOrbitCancellationTiming.contactAt));
  const contact = await Promise.all([
    motionEvidence(leftAddend),
    motionEvidence(leftInverse)
  ]);
  expect(contact[0].opacity).toBeCloseTo(1, 5);
  expect(contact[1].opacity).toBeCloseTo(1, 5);
  expect(Math.abs(contact[0].centerX - contact[1].centerX)).toBeLessThan(0.5);
  expect(Math.abs(contact[0].centerY - contact[1].centerY)).toBeLessThan(0.5);

  await seek.fill(String(midpoint(
    kpCounterOrbitCancellationTiming.contactAt,
    kpCounterOrbitCancellationTiming.retirementEnd
  )));
  const witness = transition.locator("[data-kp-editor-annihilation-witness]");
  await expect(witness).toHaveCount(0);
  expect(Number(await leftAddend.evaluate(
    (element) => getComputedStyle(element).opacity
  ))).toBeLessThan(1);
  expect(Number(await leftInverse.evaluate(
    (element) => getComputedStyle(element).opacity
  ))).toBeLessThan(1);
  await expect(rightInverse).toHaveCSS("opacity", "1");

  await seek.fill("1");
  await expect(target).toHaveCSS("opacity", "1");
  await expect(target.locator('[data-kp-motion-id$=".rhs.subtract"]'))
    .toHaveCSS("opacity", "1");
  await expect(witness).toHaveCount(0);

  await player.focus();
  await player.press("r");
  await seek.fill("1");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-direction",
    "rewind"
  );
  await expect(player.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id$=".lhs.addend"]'
  )).toHaveCSS("opacity", "1");
  await expect(player.locator(
    '[data-kp-editor-equation-target] [data-kp-motion-id$=".lhs.subtract"]'
  )).toHaveCSS("opacity", "1");
});

test("visible play and reduced motion keep one accessible native equation", async ({
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
    await transition.getAttribute("data-kp-editor-equation-semantic-progress")
  )).toBeGreaterThan(
    cancellationBrowserExpectations.minimumObservablePlaybackProgress
  );
  await expect(player).toHaveCount(1);
  await expect(transition).toHaveCount(1);
  // Each native equation endpoint owns exactly one KaTeX tree; counter-orbit
  // cancellation does not introduce a third witness tree.
  await expect(transition.locator(
    "[data-kp-editor-equation-source] " +
    "[data-kp-editor-equation-object-id] .katex"
  )).toHaveCount(1);
  await expect(transition.locator(
    "[data-kp-editor-equation-target] " +
    "[data-kp-editor-equation-object-id] .katex"
  )).toHaveCount(1);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-dev-review-ready",
    "true"
  );
});

function midpoint(start: number, end: number): number {
  return start + (end - start) / 2;
}

async function motionEvidence(locator: import("@playwright/test").Locator): Promise<{
  readonly centerX: number;
  readonly centerY: number;
  readonly opacity: number;
}> {
  return locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      opacity: Number(getComputedStyle(element).opacity)
    };
  });
}
