import { expect, test } from "@playwright/test";

const animationId =
  "animation.place-value-addition.278-plus-156";
const descriptorId =
  "editor-animation.animation.place-value-addition.278-plus-156";
const focusedRepresentationId =
  "library.editor.place-value-addition-focused-host";

test("place-value exemplar mounts lazily in the canonical Animation Library", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_440, height: 1_000 });
  await page.goto(
    "/canonical-animation-review.html" +
    `?animation=${encodeURIComponent(animationId)}`
  );
  const library = page.locator("[data-kp-animation-library]");
  const frameElement = page.locator("[data-animation-library-frame]");
  const frame = page.frameLocator("[data-animation-library-frame]");
  const player = frame.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const surface = player.locator(
    "[data-kp-place-value-responsive-surface]"
  );

  await expect(library).toHaveAttribute(
    "data-representation-id",
    focusedRepresentationId
  );
  await expect(library).toHaveAttribute(
    "data-canonical-format",
    "partial"
  );
  await expect(frameElement).toHaveAttribute(
    "src",
    "/?view=animation-library-host&animation=" + descriptorId
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-pack-id",
    "place-value"
  );
  await expect(player.locator(
    "[data-kp-editor-animation-surface-slot=\"diagram\"]"
  )).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.place-value-addition.synchronized"
  );
  await expect(surface).toHaveAttribute(
    "data-kp-place-value-runtime-controller-status",
    "mounted"
  );
  await expect(surface).toHaveAttribute(
    "data-kp-place-value-renderer-session-active-count",
    "1"
  );
  await expect(surface).toHaveAttribute(
    "data-kp-place-value-webgl-lease-count",
    "0"
  );
  await expect(player.locator(
    "[data-kp-place-value-responsive-surface]"
  )).toHaveCount(1);
  await expect(player.locator(
    "[data-action=\"toggle-editor-animation\"]"
  )).toHaveCount(1);
  await expect(page.locator("[data-kp-dev-review-shell]")).toHaveCount(1);
  await expect(frame.locator("[data-kp-dev-review-shell]")).toHaveCount(0);

  await player.locator("[data-action=\"seek-editor-animation\"]")
    .fill("0.325");
  await expect(surface).toHaveAttribute(
    "data-kp-place-value-progress-permille",
    "325"
  );
  await player.locator(
    "[data-kp-place-value-outline-anchor=\"outline.place-value.tens\"]"
  ).click();
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "0.4"
  );
  await expect(surface).toHaveAttribute(
    "data-kp-place-value-progress-permille",
    "400"
  );

  const toggle = player.locator(
    "[data-action=\"toggle-editor-animation\"]"
  );
  await toggle.click();
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-status",
    "playing"
  );
  await expect(toggle).toHaveText("Pause");
  await toggle.focus();
  await toggle.press("Enter");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-status",
    "paused"
  );
});

test("phone review keeps the equation readable and captures the sealed beat", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_200, height: 900 });
  await page.goto(
    "/canonical-animation-review.html" +
    `?animation=${encodeURIComponent(animationId)}&viewport=phone`
  );
  const frame = page.frameLocator("[data-animation-library-frame]");
  const player = frame.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const surface = player.locator(
    "[data-kp-place-value-responsive-surface]"
  );

  await expect(surface).toHaveAttribute(
    "data-kp-place-value-responsive-mode",
    "phone-selected"
  );
  await expect(player.locator(
    "[data-kp-place-value-view-controls]"
  )).toBeVisible();
  await player.locator("[data-action=\"seek-editor-animation\"]")
    .fill("0.635");
  await expect(surface).toHaveAttribute(
    "data-kp-place-value-progress-permille",
    "635"
  );
  await player.locator(
    "[data-kp-place-value-view-button=\"base-ten\"]"
  ).click();
  await expect(surface).toHaveAttribute(
    "data-kp-place-value-active-representation",
    "base-ten"
  );
  expect(await frame.locator("html").evaluate((root) =>
    root.scrollWidth - root.clientWidth
  )).toBeLessThanOrEqual(1);

  const capture = await page.evaluate(async () => {
    const moduleUrl =
      "/src/dev-review/animation-library-capture-provider.ts";
    const reviewModule = await import(/* @vite-ignore */ moduleUrl);
    const provider =
      reviewModule.createKpAnimationLibraryCaptureProvider(document);
    return provider.capture({
      route: new URL(location.href),
      capturedAtMs: performance.now(),
      eventTarget: null
    });
  });
  expect(capture.semantic).toMatchObject({
    assetId: animationId,
    progressPermille: 635,
    animationProgressPermille: 635,
    phaseProgressPermille: 500,
    projectionId: "base-ten",
    checkpointId: "checkpoint.place-value.4",
    activeTransformationIds: ["beat.place-value.exchange-tens"],
    activePhase: "action",
    foldMode: "automatic",
    layoutPolicy: "phone-selected"
  });
  expect(capture.render.surface?.profile).toBe("phone");
});

test("switching catalog selections disposes the one place-value controller", async ({
  page
}) => {
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  await expect(player.locator(
    "[data-kp-place-value-responsive-surface]"
  )).toHaveAttribute(
    "data-kp-place-value-runtime-controller-status",
    "mounted"
  );
  await page.evaluate(() => {
    const candidate = document.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]" +
      "[data-kp-editor-animation-id=" +
      "\"animation.place-value-addition.278-plus-156\"]"
    );
    if (candidate === null) throw new Error("Place-value player missing.");
    (window as Window & { __kpDisposedPlaceValuePlayer?: HTMLElement })
      .__kpDisposedPlaceValuePlayer = candidate;
  });

  await page.locator("[data-action=\"set-editor-animation\"]")
    .selectOption("editor-animation.animation.operation-evaluation.one-plus-two");
  await expect(page.locator(
    "[data-kp-editor-animation-player][data-kp-editor-animation-id=" +
    "\"animation.operation-evaluation.one-plus-two\"]"
  )).toBeVisible();
  expect(await page.evaluate(() => {
    const previous =
      (window as Window & {
        __kpDisposedPlaceValuePlayer?: HTMLElement;
      }).__kpDisposedPlaceValuePlayer;
    return {
      connected: previous?.isConnected,
      disposed: previous?.dataset["kpEditorAnimationDisposed"],
      surfaceCount: previous?.querySelectorAll(
        "[data-kp-place-value-responsive-surface]"
      ).length
    };
  })).toEqual({
    connected: false,
    disposed: "true",
    surfaceCount: 0
  });
});
