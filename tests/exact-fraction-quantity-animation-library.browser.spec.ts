import { expect, test } from "@playwright/test";

import {
  kpDevReviewNoteV2Schema
} from "../protocols/dev-review-v2-schema.ts";

const descriptorId =
  "editor-animation.animation.exact-fraction-quantity.third-plus-sixth";
const animationId =
  "animation.exact-fraction-quantity.third-plus-sixth";
const committedSceneSelector =
  "[data-kp-exact-symbolic-scene]" +
  "[data-kp-prepared-scene-state=\"committed\"]";

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
  await expect(player.locator(committedSceneSelector))
    .toHaveAttribute("data-kp-exact-symbolic-status", "ready");
  await player.locator(
    "[data-kp-exact-checkpoint-start=\"180\"]"
  ).click();
  await player.locator("[data-action=\"seek-editor-animation\"]")
    .fill("0.2");
  await expect.poll(() => player.evaluate((root) => {
    const committed = root.querySelector<HTMLElement>(
      "[data-kp-exact-symbolic-scene]" +
      "[data-kp-prepared-scene-state=\"committed\"]"
    );
    return committed?.dataset["kpExactSymbolicStatus"] === "ready" &&
      committed.dataset["kpExactSymbolicSegment"] ===
        root.dataset["kpExactSymbolicSegment"];
  })).toBe(true);
  await expect(player.locator(committedSceneSelector))
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

test("Review atomically saves the exact phone animation moment", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/?animation=${descriptorId}`);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-dev-review-ready",
    "true"
  );
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await player.locator("[data-action=\"seek-editor-animation\"]")
    .fill("0.72");
  await expect(player).toHaveAttribute(
    "data-kp-exact-progress-permille",
    "720"
  );
  await player.locator(
    "[data-kp-exact-active-view=\"number-line\"]"
  ).click();
  await player.locator("[data-kp-exact-fold-mode]").selectOption("pinned");
  await player.locator(
    "[data-kp-exact-pin-node=\"evaluation.exact-fraction.compose-half\"]"
  ).check();

  const review = page.locator("[data-kp-dev-review-shell]");
  await expect(review).toHaveAttribute(
    "data-kp-dev-review-placement",
    "captured-moment-sheet"
  );
  await review.locator("button.launcher").click();
  await expect(review.locator(".meta")).toContainText("Locked");
  await expect(review.locator(".meta")).toContainText("phone");
  await review.locator("textarea").fill(
    "Atomic exact-quantity Review wiring proof."
  );

  // Mutate the live player after the composer locks its capture. The saved
  // note must still describe the reviewed 72% number-line moment.
  await player.locator("[data-action=\"seek-editor-animation\"]")
    .fill("0.91");
  await player.locator(
    "[data-kp-exact-active-view=\"partitioned-circle\"]"
  ).click();
  await player.locator("[data-kp-exact-fold-mode]")
    .selectOption("collapsed");

  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/dev/reviews/v2/notes") &&
    response.request().method() === "POST"
  );
  await review.locator("button.save").click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  const note = kpDevReviewNoteV2Schema.parse(await response.json());
  const semantic = note.capture.semantic;
  const surface = note.capture.render.surface;
  expect(semantic).toMatchObject({
    documentId: "editor.animation-library",
    assetId: animationId,
    checkpointId: "checkpoint.exact-fraction.merged",
    progressPermille: 720,
    animationProgressPermille: 720,
    phaseProgressPermille: 680,
    projectionId: "number-line",
    activePhase: "action",
    activeTransformationIds: [
      "beat.exact-fraction.merge-three-sixths"
    ],
    foldMode: "pinned",
    layoutPolicy: "deterministic-active-view-focus"
  });
  expect(semantic.foldDetail).toContain(
    "evaluation.exact-fraction.common-sixths"
  );
  expect(semantic.foldDetail).toContain(
    "evaluation.exact-fraction.compose-half"
  );
  expect(semantic.focusRefs.length).toBeGreaterThan(0);
  expect(note.capture.temporalTrace).toEqual([{
    offsetMs: 0,
    progressPermille: 720,
    phase: "action"
  }]);
  expect(surface?.profile).toBe("phone");
  expect(surface?.contentViewport).toMatchObject({
    width: 390,
    height: 844,
    devicePixelRatio: await page.evaluate(() => window.devicePixelRatio)
  });
  expect(surface?.shellViewport.width).toBeGreaterThan(0);
  expect(surface?.stageViewport?.height).toBeGreaterThan(0);

  const visible = await page.evaluate(async ({ noteId, sequence }) => {
    const response = await fetch("/api/dev/reviews/v2/query", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-kp-dev-review": "1"
      },
      body: JSON.stringify({
        scope: "all",
        detail: "full",
        limit: 100,
        afterSequence: Math.max(0, sequence - 1)
      })
    });
    const body = await response.json() as {
      page: { notes: readonly { id: string }[] };
    };
    return response.ok &&
      body.page.notes.some(({ id }) => id === noteId);
  }, { noteId: note.id, sequence: note.sequence });
  expect(visible).toBe(true);
});

test("Review remains reachable and records the wide four-view layout", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_100, height: 800 });
  await page.goto(`/?animation=${descriptorId}`);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-dev-review-ready",
    "true"
  );
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  await player.locator("[data-action=\"seek-editor-animation\"]")
    .fill("0.24");

  const review = page.locator("[data-kp-dev-review-shell]");
  await expect(review).toHaveAttribute(
    "data-kp-dev-review-placement",
    "bottom-right"
  );
  await expect(review.locator("button.launcher")).toBeVisible();
  await review.locator("button.launcher").click();
  await review.locator("textarea").fill(
    "Wide exact-quantity Review wiring proof."
  );
  await expect(review.locator(".meta")).toContainText("wide");

  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/dev/reviews/v2/notes") &&
    response.request().method() === "POST"
  );
  await review.locator("button.save").click();
  const note = kpDevReviewNoteV2Schema.parse(
    await (await responsePromise).json()
  );
  expect(note.capture.semantic).toMatchObject({
    assetId: animationId,
    progressPermille: 240,
    projectionId: "symbolic",
    layoutPolicy: "four-view-readable-grid"
  });
  expect(note.capture.render.surface?.profile).toBe("wide");
  expect(note.capture.render.surface?.contentViewport).toMatchObject({
    width: 1_100,
    height: 800
  });
});

test("lazy wide and phone checkpoint review stays connected to the live player", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_100, height: 800 });
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const sheet = player.locator("[data-kp-exact-review-sheet]");
  const content = sheet.locator(
    "[data-kp-exact-review-sheet-content]"
  );
  const review = page.locator("[data-kp-dev-review-shell]");

  await expect(sheet).toBeVisible();
  await expect(content).toHaveAttribute(
    "data-kp-exact-review-sheet-status",
    "idle"
  );
  await expect(sheet.locator("[data-kp-exact-review-progress]"))
    .toHaveCount(0);
  await expect(review.locator("button.launcher")).toBeVisible();

  await sheet.locator("summary").click();
  await expect(content).toHaveAttribute(
    "data-kp-exact-review-sheet-status",
    "ready"
  );
  const wideCards = sheet.locator(
    "[data-kp-exact-review-card-profile=\"wide\"]"
  );
  const phoneCards = sheet.locator(
    "[data-kp-exact-review-card-profile=\"phone\"]"
  );
  await expect(wideCards).toHaveCount(5);
  await expect(phoneCards).toHaveCount(5);
  await expect(wideCards.locator(
    "[data-kp-exact-review-preview-view]"
  )).toHaveCount(20);
  await expect(phoneCards.locator(
    "[data-kp-exact-review-preview-view]"
  )).toHaveCount(5);

  const aligned = wideCards.locator(
    "[data-kp-exact-review-progress=\"560\"]"
  );
  await aligned.click();
  await expect(player).toHaveAttribute(
    "data-kp-exact-progress-permille",
    "560"
  );
  await expect(aligned).toHaveAttribute("aria-current", "step");

  await page.setViewportSize({ width: 390, height: 844 });
  const mergedNumberLine = phoneCards.locator(
    "[data-kp-exact-review-progress=\"820\"]"
  );
  await expect(mergedNumberLine).toHaveAttribute(
    "data-kp-exact-review-view",
    "number-line"
  );
  await mergedNumberLine.click();
  await expect(player).toHaveAttribute(
    "data-kp-exact-progress-permille",
    "820"
  );
  await expect(player).toHaveAttribute(
    "data-kp-exact-active-representation",
    "number-line"
  );
  await expect(mergedNumberLine).toHaveAttribute(
    "aria-current",
    "step"
  );
  expect(await player.locator("[data-kp-exact-view]")
    .evaluateAll((views) => views.filter((view) =>
      getComputedStyle(view).display !== "none"
    ).length)).toBe(1);
  await expect(review.locator("button.launcher")).toBeVisible();
});

test("accessibility, transcript, settled motion, and keyboard stay canonical", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await expect(player.locator(".kp-exact-quantity__grid"))
    .toHaveAttribute("aria-hidden", "true");
  const accessibleState = player.locator(
    "[data-kp-exact-accessible-state]"
  );
  await expect(accessibleState.locator(".katex-mathml")).toHaveCount(1);
  await expect(
    player.locator("[data-kp-exact-transcript-step]")
  ).toHaveCount(5);
  const transcript = player.locator("[data-kp-exact-transcript]");
  const transcriptText = await transcript.textContent();

  for (const foldMode of [
    "expanded",
    "collapsed",
    "automatic"
  ]) {
    await player.locator("[data-kp-exact-fold-mode]")
      .selectOption(foldMode);
    await expect(transcript).toHaveText(transcriptText ?? "");
  }

  const numberLine = player.locator(
    "button[data-kp-exact-active-view=\"number-line\"]"
  );
  await numberLine.focus();
  await numberLine.press("Enter");
  await expect(numberLine).toHaveAttribute("aria-pressed", "true");
  await expect(numberLine).toBeFocused();
  await expect(accessibleState).toHaveAttribute(
    "data-kp-exact-accessible-view",
    "number-line"
  );

  const checkpoint = player.locator(
    "button[data-kp-exact-checkpoint-start=\"560\"]"
  );
  await checkpoint.focus();
  await checkpoint.press("Enter");
  await expect(checkpoint).toBeFocused();
  await expect(player).toHaveAttribute(
    "data-kp-exact-input-progress-permille",
    "560"
  );

  const presentation = player.locator(
    "[data-kp-editor-animation-accessibility-control]"
  );
  const scrubber = player.locator(
    "[data-action=\"seek-editor-animation\"]"
  );
  await presentation.selectOption("static");
  await scrubber.fill("0.2");
  await expect(player).toHaveAttribute(
    "data-kp-exact-progress-permille",
    "180"
  );
  await expect(player).toHaveAttribute(
    "data-kp-exact-paint-ownership",
    "target-native"
  );
  await scrubber.fill("0.4");
  await expect(player).toHaveAttribute(
    "data-kp-exact-progress-permille",
    "400"
  );
  await presentation.selectOption("reduced-motion");
  await scrubber.fill("0.6");
  await expect(player).toHaveAttribute(
    "data-kp-exact-progress-permille",
    "560"
  );
  await expect(player).toHaveAttribute(
    "data-kp-exact-sampled-accessibility-mode",
    "reduced-motion"
  );
  await presentation.selectOption("full-motion");
  await scrubber.fill("0.72");
  await expect(accessibleState).toHaveAttribute(
    "data-kp-exact-accessible-checkpoint",
    "checkpoint.exact-fraction.merged"
  );
  await expect(
    player.locator(
      "[data-kp-exact-transcript-step][aria-current=\"step\"]"
    )
  ).toHaveAttribute(
    "data-kp-exact-transcript-step",
    "beat.exact-fraction.merge-three-sixths"
  );
  await scrubber.fill("0.6");
  await expect(player).toHaveAttribute(
    "data-kp-exact-progress-permille",
    "600"
  );
  await expect(player).toHaveAttribute(
    "data-kp-exact-paint-ownership",
    "source-native"
  );
  await expect(player).toHaveAttribute(
    "data-kp-exact-visible-phase",
    "setup"
  );

  expect(await player.locator(
    "[data-kp-exact-accessible-state] a[href^=\"#transcript.selection.\"]"
  ).evaluateAll((links) => links.every((link) => {
    const target = link.getAttribute("href");
    return target !== null &&
      document.getElementById(target.slice(1)) !== null;
  }))).toBe(true);

  const summary = transcript.locator("summary");
  await summary.focus();
  await summary.press("Enter");
  await expect(transcript).toHaveAttribute("open", "");
  await expect(summary).toBeFocused();
});
