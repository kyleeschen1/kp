import { expect, test } from "@playwright/test";

test("selected editor animation controls play, pause, seek, step, rewind, and reset", async ({
  page
}) => {
  await page.goto("/");

  const player = page.locator("[data-kp-editor-animation-player]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  const diagnostics = page.locator("[data-kp-editor-animation-diagnostics]");

  await expect(player).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-surface-hydrated",
    "true"
  );
  await expect(player.locator('[data-kp-editor-animation-surface-slot="equation"]'))
    .toHaveAttribute("data-kp-editor-animation-adapter-status", "missing");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-diagnostics-hydrated",
    "true"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-status", "idle");
  await expect(player.getByRole("button", { name: "Pause animation" })).toBeDisabled();

  await player.getByRole("button", { name: "Play animation" }).click();
  await expect(player).toHaveAttribute("data-kp-editor-animation-status", "playing");
  await expect.poll(async () => Number(await scrubber.inputValue())).toBeGreaterThan(0.03);

  await player.getByRole("button", { name: "Pause animation" }).click();
  await expect(player).toHaveAttribute("data-kp-editor-animation-status", "paused");
  const pausedProgress = Number(await scrubber.inputValue());
  await page.waitForTimeout(80);
  expect(Number(await scrubber.inputValue())).toBeCloseTo(pausedProgress, 5);

  await scrubber.fill("0.5");
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0.5");
  await expect(player.locator("[data-kp-editor-animation-progress-label]")).toHaveText("50%");
  await expect(diagnostics.locator("[data-kp-editor-animation-diagnostics-progress]"))
    .toHaveText("50%");
  await expect(diagnostics).toHaveAttribute("data-kp-editor-animation-direction", "forward");
  await expect(diagnostics.locator("[data-kp-editor-animation-diagnostics-active-transformations]"))
    .toHaveText("1");

  await player.getByRole("button", { name: "Step animation forward" }).click();
  expect(Number(await scrubber.inputValue())).toBeGreaterThan(0.5);

  await player.getByRole("button", { name: "Rewind animation" }).click();
  await expect(player).toHaveAttribute("data-kp-editor-animation-direction", "rewind");
  await expect(player).toHaveAttribute("data-kp-editor-animation-status", "playing");
  await expect(diagnostics).toHaveAttribute("data-kp-editor-animation-direction", "rewind");

  await player.getByRole("button", { name: "Reset animation" }).click();
  await expect(player).toHaveAttribute("data-kp-editor-animation-direction", "forward");
  await expect(player).toHaveAttribute("data-kp-editor-animation-status", "idle");
  await expect(scrubber).toHaveValue("0");
});
