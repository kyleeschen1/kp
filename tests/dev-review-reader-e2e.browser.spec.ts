import { expect, test } from "@playwright/test";

import { kpDevReviewCreateRequestV2Schema } from "../protocols/dev-review-v2-schema.ts";
import type { KpDevReviewCreateRequestV2 } from "../protocols/dev-review-v2.ts";

test("real reader feedback captures a validated reproducible frame without moving the lesson", async ({ page }) => {
  let request: KpDevReviewCreateRequestV2 | undefined;
  await page.route("**/api/dev/reviews/v2/**", async (route) => {
    if (new URL(route.request().url()).pathname.endsWith("/query")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(queryState(2)) });
      return;
    }
    request = kpDevReviewCreateRequestV2Schema.parse(route.request().postDataJSON());
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ ...request, id: "review-note.41.e2e", sequence: 41, status: "new" })
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
  await expect(host.locator("output.inbox-count")).toHaveText("Inbox 2");
  await expect(host.locator("textarea")).toBeEnabled();
  await host.locator("textarea").fill("The selected symbol changes weight during the handoff.");
  await host.locator("button.save").click();
  await expect(host.locator("output.status")).toHaveText("Saved note 41.");
  await expect(host.locator("output.inbox-count")).toHaveText("Inbox 3");
  await page.keyboard.press("Escape");
  await expect(host.locator("output.launcher-count")).toHaveText("3");

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

test("an open reader inbox locks a fresh current frame for every submitted note", async ({ page }) => {
  const requests: KpDevReviewCreateRequestV2[] = [];
  await page.route("**/api/dev/reviews/v2/**", async (route) => {
    if (new URL(route.request().url()).pathname.endsWith("/query")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(queryState()) });
      return;
    }
    const request = kpDevReviewCreateRequestV2Schema.parse(route.request().postDataJSON());
    requests.push(request);
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ...request,
        id: `review-note.${requests.length}.e2e`,
        sequence: requests.length,
        status: "new"
      })
    });
  });

  await page.goto("/reader/solve-x/");
  await expect(page.locator("body")).toHaveAttribute("data-kp-dev-review-ready", "true");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => Number(document.body.dataset["kpReaderProgress"]) < 200);

  const host = page.locator("[data-kp-dev-review-shell]");
  await host.locator("button.launcher").click();
  await host.locator("textarea").fill("The opening equation needs a steadier handoff.");
  const firstLockedState = await page.evaluate(() => ({
    scrollY: window.scrollY,
    progress: Number(document.body.dataset["kpReaderProgress"])
  }));
  await host.locator("button.save").click();
  await expect(host.locator("output.status")).toHaveText("Saved note 1.");
  expect(await page.evaluate(() => ({
    scrollY: window.scrollY,
    progress: Number(document.body.dataset["kpReaderProgress"])
  }))).toEqual(firstLockedState);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForFunction(
    (firstProgress) => Number(document.body.dataset["kpReaderProgress"]) > Number(firstProgress) + 400,
    firstLockedState.progress
  );
  await host.locator("textarea").fill("The final equation should settle without a jump.");
  const secondLockedState = await page.evaluate(() => ({
    scrollY: window.scrollY,
    progress: Number(document.body.dataset["kpReaderProgress"])
  }));
  await host.locator("button.save").click();
  await expect(host.locator("output.status")).toHaveText("Saved note 2.");
  await expect(host.locator("output.inbox-count")).toHaveText("Inbox 2");
  expect(await page.evaluate(() => ({
    scrollY: window.scrollY,
    progress: Number(document.body.dataset["kpReaderProgress"])
  }))).toEqual(secondLockedState);

  expect(requests).toHaveLength(2);
  expect(requests.map(({ comment }) => comment)).toEqual([
    "The opening equation needs a steadier handoff.",
    "The final equation should settle without a jump."
  ]);
  expect(requests[0]?.capture.semantic.progressPermille).toBe(firstLockedState.progress);
  expect(requests[1]?.capture.semantic.progressPermille).toBe(secondLockedState.progress);
  expect(requests[1]?.capture.semantic.progressPermille)
    .toBeGreaterThan((requests[0]?.capture.semantic.progressPermille ?? 0) + 400);
  expect(requests[1]?.capture.capturedAt).not.toBe(requests[0]?.capture.capturedAt);
  for (const request of requests) {
    expect(request.capture.route).toContain("/reader/solve-x/");
    expect(request.capture.environment.build.fingerprint).not.toBe("");
    expect(request.capture.semantic.documentId).toBe("lesson.solve-x.x-plus-3");
    expect(request.capture.render.layoutRevision).toBeGreaterThanOrEqual(0);
    expect(request.capture.render.fontReady).toBe(true);
  }
});

function queryState(unread = 0): unknown {
  return {
    query: { scope: "current", limit: 20, detail: "summary" },
    counts: {
      lifetime: 0,
      current: 0,
      currentNew: 0,
      historical: 0,
      matching: unread,
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
      id: "round.e2e",
      sequence: 1,
      label: "Reader polish",
      status: "open",
      synthetic: false,
      noteCount: 0,
      newCount: 0
    }],
    page: { notes: [], hasMore: false }
  };
}
