import { expect, test } from "@playwright/test";
import {
  kpWitnessedAnnihilationMotionProfileV1
} from "../src/animation/witnessed-annihilation.ts";

const animationId = "animation.generated.cancellation.additive-inverses";
const cancellationBrowserExpectations = Object.freeze({
  minimumObservablePlaybackProgress: 0.04
});

test("the catalogue realizes the typed additive cancellation binding", async ({
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
    "true"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-witnessed-annihilation-binding",
    /annihilation.*generated-additive-inverses-cancel$/
  );

  const timing = kpWitnessedAnnihilationMotionProfileV1.timing;
  const deterministicCheckpoints = [
    0,
    timing.contactStart,
    timing.contactEnd,
    timing.witnessReadableAt,
    timing.witnessDwellEnd,
    timing.witnessAbsorptionEnd,
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

test("only the authored left inverse pair retires through the zero witness", async ({
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

  const timing = kpWitnessedAnnihilationMotionProfileV1.timing;
  await seek.fill(String(midpoint(
    timing.witnessReadableAt,
    timing.witnessDwellEnd
  )));
  await expect(transition).toHaveAttribute(
    "data-kp-editor-annihilation-phase",
    "witness-dwell"
  );
  const witness = transition.locator("[data-kp-editor-annihilation-witness]");
  await expect(witness).toContainText("0");
  await expect(witness).toHaveAttribute(
    "data-kp-editor-annihilation-descriptor-id",
    "witness.additive-identity.zero"
  );
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
  await expect(witness).toHaveCSS("opacity", "0");

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
  // The transient zero is inline KaTeX decoration outside the semantic object
  // roots; each native equation endpoint still owns exactly one KaTeX tree.
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
