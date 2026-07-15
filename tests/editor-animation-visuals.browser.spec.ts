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
    .toHaveAttribute("data-kp-editor-animation-adapter-status", "ready");
  await expect(player.locator('[data-kp-editor-animation-surface-slot="equation"]'))
    .toHaveAttribute(
      "data-kp-editor-animation-adapter-id",
      "editor-animation-surface.equation.katex"
    );
  await expect(player.locator("[data-kp-editor-equation-stage] .katex").first())
    .toBeVisible();
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
  const equationStage = player.locator("[data-kp-editor-equation-stage]");
  await expect(equationStage).toHaveAttribute(
    "data-kp-editor-equation-phase-id",
    /\.forward\.1$/
  );
  await expect(equationStage.locator("[data-kp-editor-equation-source]"))
    .toHaveCSS("opacity", "0.5");
  await expect(equationStage.locator("[data-kp-editor-equation-target]"))
    .toHaveCSS("opacity", "0.5");
  await expect(equationStage.locator("[data-kp-editor-equation-transition-id]"))
    .toHaveAttribute("data-kp-editor-equation-motif", "cancelation");
  await expect(equationStage.locator("[data-kp-editor-equation-motif-label]"))
    .toHaveText("cancelation");
  await expect(equationStage.locator("[data-kp-editor-equation-focus-token]"))
    .toHaveCount(2);
  const solveSequence = equationStage.locator("[data-kp-editor-solve-x-sequence]");
  await expect(solveSequence).toBeVisible();
  await expect(solveSequence.locator("[data-kp-editor-solve-x-step]"))
    .toHaveCount(4);
  await expect(solveSequence.locator('[aria-current="step"]')).toContainText("3");

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

test("editor animation player disposes cleanly across selection and dashboard rerenders", async ({
  page
}) => {
  await page.goto("/");

  let player = page.locator("[data-kp-editor-animation-player]");
  const initialDescriptorId = await player.getAttribute(
    "data-kp-editor-animation-descriptor-id"
  );
  await player.getByRole("button", { name: "Play animation" }).click();
  await expect(player).toHaveAttribute("data-kp-editor-animation-status", "playing");

  await page.locator('[data-action="set-editor-animation"]').selectOption({ index: 1 });
  player = page.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveAttribute("data-kp-editor-animation-status", "idle");
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0");
  expect(await player.getAttribute("data-kp-editor-animation-descriptor-id"))
    .not.toBe(initialDescriptorId);

  await player.getByRole("button", { name: "Play animation" }).click();
  await page.getByRole("button", { name: "Project Dashboard" }).click();
  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveCount(0);

  await page.getByRole("button", { name: "Back to Editor" }).click();
  player = page.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveAttribute("data-kp-editor-animation-status", "idle");
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0");
});

test("every solve-x descriptor route uses the same visible shared player", async ({
  page
}) => {
  await page.goto("/");

  const descriptorIds = [
    "editor-animation.animation.linear-solve.solve-x",
    "editor-animation.sample.animation.solve-x.both-sides",
    "editor-animation.sample.animation.solve-x.cancel-additive-inverses"
  ];

  for (const descriptorId of descriptorIds) {
    await page.locator('[data-action="set-editor-animation"]').selectOption(descriptorId);
    const player = page.locator("[data-kp-editor-animation-player]");
    await expect(player).toHaveAttribute(
      "data-kp-editor-animation-descriptor-id",
      descriptorId
    );
    await expect(player).toHaveAttribute(
      "data-kp-editor-animation-id",
      "animation.linear-solve.solve-x"
    );
    await expect(player.locator("[data-kp-editor-solve-x-sequence]")).toBeVisible();

    await player.locator('[data-action="seek-editor-animation"]').fill("1");
    await expect(player.locator("[data-kp-editor-equation-target]")).toContainText("x=4");
    await expect(player.locator("[data-kp-editor-equation-target]")).toHaveCSS(
      "opacity",
      "1"
    );
  }
});
