import { expect, test } from "@playwright/test";

import { kpDevReviewCreateRequestV2Schema } from "../protocols/dev-review-v2-schema.ts";
import type { KpDevReviewCreateRequestV2 } from "../protocols/dev-review-v2.ts";

for (const lesson of [
  {
    name: "economics",
    route: "/tutorials/economics/demand-shift/",
    documentId: "lesson.economics.demand-shift",
    motionBlockId: "demand-shift",
    expressionExpected: false,
    themeId: "theme.kp.lesson.economics-paper-v1"
  },
  {
    name: "economics dark",
    route: "/tutorials/economics/demand-shift/?theme=dark",
    documentId: "lesson.economics.demand-shift",
    motionBlockId: "demand-shift",
    expressionExpected: false,
    themeId: "theme.kp.lesson.economics-midnight-v1"
  },
  {
    name: "Lisp",
    route: "/tutorials/programming/lisp-function-application/",
    documentId: "lesson.programming.lisp-function-application",
    motionBlockId: "structure",
    expressionExpected: true,
    themeId: "theme.kp.lesson.lisp-paper-v1"
  }
] as const) {
  test(`${lesson.name} lesson review captures its current tutorial state`, async ({
    page
  }) => {
    let captured: KpDevReviewCreateRequestV2 | undefined;
    await page.route("**/api/dev/reviews/v2/**", async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname.endsWith("/query")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(queryState())
        });
        return;
      }
      captured = kpDevReviewCreateRequestV2Schema.parse(
        route.request().postDataJSON()
      );
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ...captured,
          id: "review-note.1.tutorial",
          sequence: 1,
          status: "new"
        })
      });
    });

    await page.goto(lesson.route);
    await expect(page.locator("body")).toHaveAttribute(
      "data-kp-dev-review-ready",
      "true",
      { timeout: 15_000 }
    );
    const root = page.locator("[data-kp-tutorial-review-root]");
    await expect(root).toHaveAttribute(
      "data-kp-tutorial-review-motion-block",
      lesson.motionBlockId
    );
    const host = page.locator("[data-kp-dev-review-shell]");
    await expect(host).toHaveAttribute(
      "data-kp-dev-review-placement",
      "left-prose-rail"
    );
    await host.locator("button.launcher").click();
    await host.locator("textarea").fill("Check this lesson moment.");
    await host.locator("button.save").click();
    await expect(host.locator("output.status")).toHaveText("Saved note 1.");

    expect(captured?.capture.semantic.documentId).toBe(lesson.documentId);
    expect(captured?.capture.semantic.activeTransformationIds)
      .toEqual([lesson.motionBlockId]);
    expect(captured?.capture.semantic.progressPermille).toBeGreaterThanOrEqual(0);
    expect(captured?.capture.semantic.focusRefs.length).toBeGreaterThan(0);
    expect(captured?.capture.render.rendererId).not.toBe("");
    expect(captured?.capture.render.ownerIds).toContain(lesson.documentId);
    expect(captured?.capture.semantic.themeId).toBe(lesson.themeId);
    if (lesson.expressionExpected) {
      expect(captured?.capture.semantic.expression).toEqual({
        expressionId: "expr.application",
        operation: "activate",
        syntaxPath: ["expr.application"],
        depth: 0,
        sourceIdentityIds: ["expr.application"],
        destinationIdentityIds: ["expr.application"]
      });
      expect(captured?.capture.semantic.checkpointClass).toBe("major-hold");
      expect(Object.keys(captured?.capture.semantic.tuning ?? {})).toHaveLength(8);
    } else {
      expect(captured?.capture.semantic.expression).toBeUndefined();
      expect(captured?.capture.semantic.checkpointClass).toBeUndefined();
    }
  });
}

function queryState(): unknown {
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
      id: "round.tutorial",
      sequence: 1,
      label: "Tutorial polish",
      status: "open",
      synthetic: false,
      noteCount: 0,
      newCount: 0
    }],
    page: { notes: [], hasMore: false }
  };
}
