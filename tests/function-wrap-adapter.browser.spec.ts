import { expect, test } from "@playwright/test";

import matrix from
  "../src/architecture/equation-surface-preservation-matrix.generated.json" with {
    type: "json"
  };

const animationId = "animation.generated.function-wrap.apply-f";
const entry = matrix.entries.find((candidate) =>
  candidate.animationId === animationId
);
if (entry === undefined) {
  throw new Error(`Missing preservation entry ${animationId}.`);
}

test("function-wrap adapter preserves reduced-motion endpoints and reverse seek", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(entry.route.href);

  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const slot = player.locator(
    '[data-kp-editor-animation-surface-slot="equation"]'
  );
  const seek = player.locator(entry.directSeek.controlSelector);
  await expect(player).toHaveAttribute(
    entry.accessibility.reducedMotionAttribute,
    entry.accessibility.reducedMotionValue
  );
  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-status",
    entry.nativeSettlement.adapterStatus
  );

  for (const progress of [0, 0.5, 1, 0.5, 0] as const) {
    await seek.fill(String(progress));
    await expect(player).toHaveAttribute(
      entry.directSeek.progressAttribute,
      String(progress)
    );
  }
  await seek.fill("1");
  if (entry.accessibility.mathSemantics === "katex-mathml") {
    await expect(slot.locator(".katex-mathml").first()).toBeAttached();
  } else {
    await expect(slot.locator("[aria-label]").first()).toBeAttached();
  }
  expect(errors).toEqual([]);
});
