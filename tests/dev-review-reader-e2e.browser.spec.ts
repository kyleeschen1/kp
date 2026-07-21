import { expect, test } from "@playwright/test";

import { kpDevReviewCreateRequestSchema } from "../protocols/dev-review-schema.ts";
import type { KpDevReviewCreateRequestV1 } from "../protocols/dev-review-v1.ts";

test("real reader feedback captures a validated reproducible frame without moving the lesson", async ({ page }) => {
  let request: KpDevReviewCreateRequestV1 | undefined;
  await page.route("**/api/dev/reviews", async (route) => {
    request = kpDevReviewCreateRequestSchema.parse(route.request().postDataJSON());
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ ...request, id: "review-note.1.e2e", sequence: 1, status: "new" })
    });
  });

  await page.goto("/reader/solve-x/");
  await expect(page.locator("body")).toHaveAttribute("data-kp-dev-review-ready", "true");
  const target = page.locator(
    '[data-kp-reader-transition-active="true"] [data-kp-reader-selector-id]'
  ).first();
  await target.hover({ force: true });
  const stateBefore = await page.evaluate(() => ({
    scrollY: window.scrollY,
    progress: document.body.dataset["kpReaderProgress"],
    transition: document.body.dataset["kpReaderTransition"]
  }));

  const host = page.locator("[data-kp-dev-review-shell]");
  await host.locator("button.launcher").click();
  await expect(host.locator("textarea")).toBeEnabled();
  await host.locator("textarea").fill("The selected symbol changes weight during the handoff.");
  await host.locator("button.save").click();
  await expect(host.locator("output.status")).toHaveText("Saved note 1.");

  const stateAfter = await page.evaluate(() => ({
    scrollY: window.scrollY,
    progress: document.body.dataset["kpReaderProgress"],
    transition: document.body.dataset["kpReaderTransition"]
  }));
  expect(stateAfter).toEqual(stateBefore);
  expect(request).toBeDefined();
  expect(request?.comment).toBe("The selected symbol changes weight during the handoff.");
  expect(request?.capture.route).toContain("/reader/solve-x/");
  expect(request?.capture.environment.build.fingerprint).not.toBe("");
  expect(request?.capture.semantic.documentId).toBe("lesson.solve-x.x-plus-3");
  expect(request?.capture.semantic.progressPermille).toBe(Number(stateBefore.progress));
  expect(request?.capture.semantic.activeTransformationIds).toContain(stateBefore.transition);
  expect(request?.capture.semantic.target?.selectorId).toBeTruthy();
  expect(request?.capture.semantic.target?.transformationId).toBe(stateBefore.transition);
  expect(request?.capture.render.layoutRevision).toBeGreaterThanOrEqual(0);
  expect(request?.capture.render.fontReady).toBe(true);
  expect(request?.capture.render.ownerIds.length).toBeGreaterThan(0);
  expect(request?.capture.temporalTrace.length).toBeGreaterThan(0);
});
