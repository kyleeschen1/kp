import { expect, test } from "@playwright/test";

const route = "/tutorials/algebra/fraction-composition/";

test("algebra article lazily mounts one canonical player and advances it", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const host = page.locator("[data-kp-algebra-stage-host]");
  await host.scrollIntoViewIfNeeded();
  await expect(host).toHaveAttribute(
    "data-kp-algebra-runtime-animation",
    "animation.fraction-composition.two-thirds-solve"
  );
  await expect(host).toHaveAttribute("data-kp-algebra-runtime-range-count", "5");
  const player = host.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveCount(1);
  await expect(player).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  await expect(host.locator("[data-kp-algebra-stage-fallback]")).toBeHidden();

  const before = Number(await player.getAttribute(
    "data-kp-editor-animation-progress"
  ));
  await player.getByRole("button", { name: "Play animation" }).click();
  await expect.poll(async () => Number(await player.getAttribute(
    "data-kp-editor-animation-progress"
  ))).toBeGreaterThan(before);
  await player.getByRole("button", { name: "Pause animation" }).click();
});
