import { expect, test } from "@playwright/test";

import type {
  KpDevReviewCreateRequestV2
} from "../protocols/dev-review-v2.ts";
import type {
  KpDevReviewScreenshotRequestV1
} from "../protocols/dev-review-v1.ts";

const vectorId = "animation.dot-projection.basic";

test("the development dock preserves exact state across Catalogue and Coverage", async ({
  context,
  page
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const documentRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") documentRequests.push(request.url());
  });
  await page.goto(
    `/?artifact=${vectorId}` +
    "&playhead=0.42&style=restrained-editorial&focus=no-depth"
  );

  const toolbar = page.getByRole("complementary", {
    name: "Development tools"
  });
  const theme = toolbar.getByRole("button", { name: "Dark mode" });
  await expect(toolbar.getByRole("button", { name: "Review" })).toBeVisible();
  await expect(toolbar.getByRole("button", { name: "Copy link" })).toBeVisible();
  await expect(theme).toHaveAttribute("aria-pressed", "true");

  await theme.focus();
  await expect(theme).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(theme).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("[data-kp-svelte-catalogue-shell]"))
    .toHaveAttribute("data-kp-animation-catalogue-theme", "light");
  expect(new URL(page.url()).searchParams.get("theme")).toBe("light");

  const view = toolbar.locator(
    "[data-kp-dev-toolbar-control='kp.dev-toolbar.pages']"
  );
  await expect(view.locator("summary")).toHaveText("View");
  await view.locator("summary").click();
  await view.getByRole("link", { name: "Transformation coverage" }).click();
  const coverage = page.locator(".kp-transformation-coverage");
  await expect(coverage).toBeVisible();
  await expect(coverage).toHaveAttribute(
    "data-kp-animation-coverage-theme",
    "light"
  );
  expect(new URL(page.url()).searchParams.get("artifact")).toBe(vectorId);
  expect(new URL(page.url()).searchParams.get("playhead")).toBe("0.42");

  await view.locator("summary").click();
  await expect(view.getByRole("link", {
    name: "Transformation coverage"
  })).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");

  const copy = toolbar.getByRole("button", { name: "Copy link" });
  await copy.click();
  await expect(toolbar.getByRole("button", { name: "Copied" })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  const copiedUrl = new URL(copied);
  expect(copiedUrl.searchParams.get("view")).toBe("coverage");
  expect(copiedUrl.searchParams.get("theme")).toBe("light");
  expect(copiedUrl.searchParams.get("style")).toBe("restrained-editorial");
  expect(copiedUrl.searchParams.get("focus")).toBe("no-depth");
  expect(copiedUrl.searchParams.get("artifact")).toBe(vectorId);
  expect(copiedUrl.searchParams.get("playhead")).toBe("0.42");
  expect(documentRequests).toHaveLength(1);
});

test("Review captures one exact animation state without covering playback", async ({
  page
}) => {
  let screenshotRequest: KpDevReviewScreenshotRequestV1 | undefined;
  let noteRequest: KpDevReviewCreateRequestV2 | undefined;
  await page.route("**/api/dev/reviews/v2/query**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(reviewQueryState())
    });
  });
  await page.route("**/api/dev/reviews/v2/screenshots", async (route) => {
    screenshotRequest = route.request().postDataJSON() as
      KpDevReviewScreenshotRequestV1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        schemaVersion: "kp.dev-review-screenshot.v1",
        kind: "bitmap-data-url",
        scope: "selected-stage",
        mediaType: "image/jpeg",
        dataUrl: "data:image/jpeg;base64,/9j/2Q==",
        pixelWidth: 640,
        pixelHeight: 480,
        sourceViewport: { left: 240, top: 0, width: 800, height: 640 }
      })
    });
  });
  await page.route("**/api/dev/reviews/v2/notes", async (route) => {
    noteRequest = route.request().postDataJSON() as KpDevReviewCreateRequestV2;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ...noteRequest,
        id: "review-note.exact-animation-state",
        sequence: 7,
        status: "new"
      })
    });
  });

  await page.goto(
    `/?artifact=${vectorId}` +
    "&playhead=0.42&theme=dark&style=restrained-editorial&focus=no-depth"
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-dev-review-ready",
    "true"
  );

  const toolbar = page.getByRole("complementary", {
    name: "Development tools"
  });
  const scrubber = page.locator(
    "[data-kp-animation-catalogue-stage] " +
    ".editor-animation-player__scrubber input"
  );
  await expect(scrubber).toBeVisible();
  expect(await elementsOverlap(toolbar, scrubber)).toBe(false);

  await toolbar.getByRole("button", { name: "Review" }).click();
  const review = page.locator("[data-kp-dev-review-shell]");
  const panel = review.locator('[role="dialog"]');
  await expect(panel).toBeVisible();
  expect(await elementsOverlap(panel, scrubber)).toBe(false);
  await panel.locator("textarea").fill("Preserve this exact animation state.");
  await expect(panel.locator(".meta")).toContainText("Screenshot attached");
  await expect(panel.locator(".route")).toContainText(
    "view=animation-catalogue"
  );
  await panel.getByRole("button", { name: "Save note" }).click();
  await expect(panel.locator(".status")).toHaveText("Saved note 7.");

  expect(screenshotRequest).toBeDefined();
  expect(noteRequest).toBeDefined();
  const captured = noteRequest!.capture;
  expect(screenshotRequest!.capture.route).toBe(captured.route);
  const route = new URL(captured.route);
  expect(route.searchParams.get("view")).toBe("animation-catalogue");
  expect(route.searchParams.get("artifact")).toBe(vectorId);
  expect(route.searchParams.get("playhead")).toBe("0.42");
  expect(route.searchParams.get("theme")).toBe("dark");
  expect(route.searchParams.get("style")).toBe("restrained-editorial");
  expect(route.searchParams.get("focus")).toBe("no-depth");
  expect(captured.semantic.assetId).toBe(vectorId);
  expect(captured.semantic.progressPermille).toBe(420);
  expect(captured.semantic.themeId).toBe("dark");
  expect(captured.semantic.tuning).toEqual({
    "gestalt-style": "kp.restrained-editorial@1.0.0",
    "focus-experiment": "no-depth"
  });
  expect(captured.screenshot?.scope).toBe("selected-stage");

  await panel.getByRole("button", { name: "Close visual review" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await toolbar.getByRole("button", { name: "Review" }).click();
  await expect(review).toHaveAttribute(
    "data-kp-dev-review-placement",
    "captured-moment-sheet"
  );
  await expect(panel).toBeVisible();
  expect(await elementsOverlap(toolbar, scrubber)).toBe(false);
  expect(await elementsOverlap(panel, scrubber)).toBe(false);
});

async function elementsOverlap(
  left: import("@playwright/test").Locator,
  right: import("@playwright/test").Locator
): Promise<boolean> {
  const [leftBox, rightBox] = await Promise.all([
    left.boundingBox(),
    right.boundingBox()
  ]);
  expect(leftBox).not.toBeNull();
  expect(rightBox).not.toBeNull();
  return leftBox!.x < rightBox!.x + rightBox!.width &&
    leftBox!.x + leftBox!.width > rightBox!.x &&
    leftBox!.y < rightBox!.y + rightBox!.height &&
    leftBox!.y + leftBox!.height > rightBox!.y;
}

function reviewQueryState(): unknown {
  return {
    query: { scope: "current", limit: 20, detail: "summary" },
    counts: {
      lifetime: 0,
      current: 0,
      currentNew: 0,
      historical: 0,
      matching: 0,
      byStatus: {
        new: 0,
        discussed: 0,
        grouped: 0,
        accepted: 0,
        fixed: 0,
        verified: 0,
        dismissed: 0
      }
    },
    rounds: [{
      id: "round.exact-animation-state",
      sequence: 3,
      label: "Exact animation state",
      status: "open",
      synthetic: false,
      noteCount: 0,
      newCount: 0
    }],
    page: { notes: [], hasMore: false }
  };
}
