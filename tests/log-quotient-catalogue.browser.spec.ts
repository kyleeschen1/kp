import { expect, test } from "@playwright/test";

const animationId =
  "animation.algebra.log-quotient.difference-to-quotient";

test("log quotient mounts lazily and seeks through one native paint owner", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`/?artifact=${animationId}`);

  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const slot = player.locator(
    `[data-kp-editor-animation-surface-slot="equation"]`
  );
  const stage = slot.locator("[data-kp-log-quotient-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');

  await expect(player).toHaveAttribute("data-kp-editor-animation-pack-id", "algebra");
  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.log-quotient.canonical-native-katex"
  );
  await expect(stage).toHaveAttribute("data-kp-log-quotient-stage", "ready");
  await expect(stage.locator(".kp-log-quotient-stage__endpoint")).toHaveCount(2);
  await expect(stage.locator(
    '[data-kp-semantic-entity-id="target.quotient.bar"].frac-line'
  )).toHaveCount(1);
  await expect(stage.locator(
    '[data-kp-semantic-entity-id="source.subtract"].frac-line'
  )).toHaveCount(0);

  const trackSummary = JSON.parse(
    await stage.getAttribute("data-kp-log-quotient-track-summary") ?? "[]"
  ) as Array<{ lifecycle?: string; sourceAtomId?: string; targetAtomId?: string }>;
  expect(trackSummary.length).toBeGreaterThan(0);
  expect(trackSummary.some(({ sourceAtomId, targetAtomId }) =>
    sourceAtomId !== undefined && targetAtomId !== undefined
  )).toBe(true);

  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    await seek.fill(String(progress));
    await expect(stage).toHaveAttribute(
      "data-kp-log-quotient-progress",
      String(progress)
    );
    const ownership = await stage.evaluate((root) => {
      const endpointOpacities = [...root.querySelectorAll<HTMLElement>(
        ".kp-log-quotient-stage__endpoint"
      )].map((element) => Number(getComputedStyle(element).opacity));
      const material = root.querySelector<HTMLElement>(
        "[data-kp-editor-equation-material-layer]"
      );
      const materialVisible = material === null
        ? 0
        : [...material.querySelectorAll<HTMLElement>(
            "[data-kp-equation-material-owner-id]"
          )].some((element) => Number(getComputedStyle(element).opacity) > 0)
          ? 1
          : 0;
      return {
        visualOwner: root.dataset["kpLogQuotientVisualOwner"],
        visibleOwnerCount:
          endpointOpacities.filter((opacity) => opacity > 0).length +
          materialVisible
      };
    });
    expect(ownership.visibleOwnerCount).toBe(1);
  }

  await seek.fill("0");
  await expect(stage).toHaveAttribute(
    "data-kp-log-quotient-visual-owner",
    "source-native"
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-dev-review-ready",
    "true"
  );
  await expect(page.getByRole("button", { name: "Review" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("log quotient keeps one accessible endpoint under reduced motion", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/?artifact=${animationId}&playhead=0.5`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-log-quotient-stage]");

  await expect(stage).toHaveAttribute("data-kp-log-quotient-stage", "ready");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-accessibility-mode",
    "reduced-motion"
  );
  const accessibility = await stage.evaluate((root) => {
    const endpoints = [...root.querySelectorAll<HTMLElement>(
      ".kp-log-quotient-stage__endpoint"
    )];
    const active = endpoints.filter((endpoint) =>
      endpoint.getAttribute("aria-hidden") === "false"
    );
    return {
      activeCount: active.length,
      activeHasMathMl: active[0]?.querySelector("math") !== null,
      inactiveAreInert: endpoints
        .filter((endpoint) => endpoint !== active[0])
        .every((endpoint) => endpoint.hasAttribute("inert")),
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth
    };
  });
  expect(accessibility.activeCount).toBe(1);
  expect(accessibility.activeHasMathMl).toBe(true);
  expect(accessibility.inactiveAreInert).toBe(true);
  expect(accessibility.documentWidth).toBe(accessibility.viewportWidth);
});
