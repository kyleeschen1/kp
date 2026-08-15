import { expect, test } from "@playwright/test";

import matrix from
  "../src/architecture/equation-surface-preservation-matrix.generated.json" with {
    type: "json"
  };

test("all equation surfaces preserve native endpoints, direct seek, reduced motion, and fit", async ({
  page
}) => {
  test.setTimeout(180_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  for (const entry of matrix.entries) {
    await page.goto(entry.route.href);
    const player = page.locator(
      `[data-kp-editor-animation-player]` +
      `[data-kp-editor-animation-id="${entry.animationId}"]`
    );
    const slot = player.locator(
      '[data-kp-editor-animation-surface-slot="equation"]'
    );
    const seek = player.locator(entry.directSeek.controlSelector);

    await expect(player, entry.animationId).toHaveCount(1);
    await expect(player).toHaveAttribute(
      entry.accessibility.reducedMotionAttribute,
      entry.accessibility.reducedMotionValue
    );
    await expect(slot).toHaveAttribute(
      "data-kp-editor-animation-adapter-status",
      entry.nativeSettlement.adapterStatus
    );
    await expect(slot).toHaveAttribute(
      "data-kp-editor-animation-adapter-id",
      entry.nativeSettlement.adapterId
    );
    for (const checkpoint of entry.directSeek.checkpoints) {
      await seek.fill(String(checkpoint));
      await expect(player).toHaveAttribute(
        entry.directSeek.progressAttribute,
        String(checkpoint)
      );
    }
    // Some sequence assets intentionally begin before their first equation is
    // materialized. Accessibility truth is therefore frozen at the settled
    // semantic endpoint, rather than misclassifying an empty initial phase.
    if (entry.accessibility.mathSemantics === "katex-mathml") {
      await expect(slot.locator(".katex-mathml").first()).toBeAttached();
    } else {
      await expect(slot.locator("[aria-label]").first()).toBeAttached();
    }

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, `${entry.animationId} document overflow`).toBeLessThanOrEqual(1);
  }

  expect(errors).toEqual([]);
});
