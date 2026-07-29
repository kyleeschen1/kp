import { expect, test } from "@playwright/test";

const descriptorId =
  "editor-animation.animation.exact-fraction-quantity.third-plus-sixth";
const animationId =
  "animation.exact-fraction-quantity.third-plus-sixth";

test("exact quantity mounts lazily in the shared Animation Library", async ({
  page
}) => {
  await page.goto(`/?animation=${descriptorId}`);
  const library = page.locator("[data-kp-editor-animation-library]");
  const player = library.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );

  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-pack-id",
    "exact-quantity"
  );
  await expect(player.locator(
    "[data-kp-editor-animation-surface-slot=\"diagram\"]"
  )).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.exact-fraction-quantity.synchronized"
  );
  await expect(player.locator("[data-kp-exact-view]")).toHaveCount(4);
  await expect(player.locator("[data-kp-exact-symbolic-scene]"))
    .toHaveAttribute("data-kp-exact-symbolic-status", "ready");
  await player.locator(
    "[data-kp-exact-checkpoint-start=\"180\"]"
  ).click();
  await player.locator("[data-action=\"seek-editor-animation\"]")
    .fill("0.2");
  await expect(player.locator("[data-kp-exact-symbolic-scene]"))
    .toHaveAttribute("data-kp-exact-symbolic-status", "ready");
  await expect(player.locator("[data-kp-exact-symbolic-scene]"))
    .toHaveAttribute(
      "data-kp-canonical-native-katex-session-factory",
      "shared-v1"
    );
});

test("checkpoint, fold, pin, representation, and seek controls round-trip", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-pack-id",
    "exact-quantity"
  );

  await player.locator(
    "[data-kp-exact-checkpoint-start=\"400\"]"
  ).click();
  await expect(player).toHaveAttribute(
    "data-kp-exact-progress-permille",
    "400"
  );
  await player.locator(
    "[data-kp-exact-active-view=\"number-line\"]"
  ).click();
  await expect(player).toHaveAttribute(
    "data-kp-exact-active-representation",
    "number-line"
  );
  await player.locator("[data-kp-exact-fold-mode]").selectOption("pinned");
  await player.locator(
    "[data-kp-exact-pin-node=\"evaluation.exact-fraction.compose-half\"]"
  ).check();

  await expect.poll(() => new URL(page.url()).searchParams.get(
    "exactProgress"
  )).toBe("400");
  expect(new URL(page.url()).searchParams.get("exactView"))
    .toBe("number-line");
  expect(new URL(page.url()).searchParams.get("exactFold")).toBe("pinned");

  await page.reload();
  const reloaded = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  await expect(reloaded).toHaveAttribute(
    "data-kp-exact-active-representation",
    "number-line"
  );
  await expect(reloaded).toHaveAttribute(
    "data-kp-exact-fold-mode",
    "pinned"
  );
  await expect(reloaded).toHaveAttribute(
    "data-kp-exact-progress-permille",
    "400"
  );
});
