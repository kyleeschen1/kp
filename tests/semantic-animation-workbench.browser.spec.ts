import { expect, test, type Page } from "@playwright/test";

const radicalId = "animation.generated.radical.square-root-as-power";
const quadraticId = "animation.algebra.quadratic.solution-branching";

test.beforeEach(async ({ page }) => {
  await mockReviewInbox(page);
});

test("Workbench reuses the live player and preserves direct seek and rewind", async ({
  page
}) => {
  await page.goto(
    `/?view=animation-workbench&q=radical&workbenchAnimation=${radicalId}`
  );
  const workbench = page.locator("[data-kp-animation-workbench]");
  const player = workbench.locator("[data-kp-editor-animation-player]");

  await expect(workbench).toBeVisible();
  await expect(player).toHaveAttribute("data-kp-editor-animation-id", radicalId);
  await expect(player).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  await expect(
    page.locator(
      '[data-kp-animation-workbench-acceptance-kind="semantic-law"]'
    )
  ).toHaveCount(2);
  await expect(
    page.locator("[data-kp-animation-workbench-acceptance]")
  ).toContainText("animation.seek-rewind");
  await expect(
    page.locator("[data-kp-animation-workbench-lifecycle-facet]")
  ).toHaveCount(7);
  await expect(
    page.locator(
      '[data-kp-animation-workbench-review-group="current"] [data-kp-animation-workbench-review-note]'
    )
  ).toHaveCount(1);
  await expect(
    page.locator(
      '[data-kp-animation-workbench-review-group="historical"] [data-kp-animation-workbench-review-note]'
    )
  ).toHaveCount(1);
  await expect(
    page.locator("[data-kp-animation-workbench-review]")
  ).not.toContainText("Derivative-only feedback");
  await expect(
    page.locator(
      '[data-kp-animation-workbench-lifecycle-facet="review"]'
    )
  ).toHaveAttribute("data-state", "changes-requested");

  const cardRepresentation =
    "sample.animation.radical-rewrite.square-root-as-power";
  await page
    .locator(`[data-kp-representation-id="${cardRepresentation}"]`)
    .click();
  await expect(page).toHaveURL(
    new RegExp(
      `workbenchAnimation=${radicalId}.*representation=${cardRepresentation.replaceAll(".", "\\.")}`
    )
  );
  await expect(
    page.locator("[data-kp-animation-workbench-selection]")
  ).toHaveAttribute("data-kp-animation-workbench-selection", radicalId);
  await expect(
    page.locator("[data-kp-animation-workbench-live-preview]")
  ).toHaveAttribute(
    "data-kp-animation-workbench-representation",
    cardRepresentation
  );
  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveCount(1);
  await expect(
    page.locator("[data-kp-editor-animation-player]")
  ).toHaveAttribute("data-kp-editor-animation-id", radicalId);

  const switchedPlayer = workbench.locator("[data-kp-editor-animation-player]");
  const scrubber = switchedPlayer.locator(
    '[data-action="seek-editor-animation"]'
  );
  await scrubber.fill("0.5");
  await expect(switchedPlayer).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "0.5"
  );
  await switchedPlayer
    .locator('[data-action="rewind-editor-animation"]')
    .click();
  await expect(switchedPlayer).toHaveAttribute(
    "data-kp-editor-animation-direction",
    "rewind"
  );
});

test("Workbench planned quadratic never mounts a player", async ({ page }) => {
  await page.goto(
    `/?view=animation-workbench&q=quadratic&workbenchAnimation=${quadraticId}`
  );

  await expect(
    page.locator(`[data-kp-animation-workbench-selection="${quadraticId}"]`)
  ).toBeVisible();
  await expect(
    page.locator("[data-kp-animation-workbench-planned-preview]")
  ).toBeVisible();
  await expect(
    page.locator("[data-kp-animation-workbench-missing-evidence]")
  ).toContainText("Semantic law checks will appear");
  await expect(
    page.locator(
      '[data-kp-animation-workbench-lifecycle-facet="playability"]'
    )
  ).toHaveAttribute("data-state", "planned-only");
  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveCount(0);
});

async function mockReviewInbox(page: Page): Promise<void> {
  await page.route("**/api/dev/reviews/v2/query", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        query: {
          scope: "all",
          limit: 100,
          detail: "full"
        },
        counts: {
          lifetime: 3,
          current: 2,
          currentNew: 2,
          historical: 1,
          matching: 3,
          byStatus: {
            new: 2,
            discussed: 0,
            grouped: 0,
            accepted: 0,
            fixed: 0,
            verified: 1,
            dismissed: 0
          }
        },
        rounds: [
          {
            id: "round.current",
            sequence: 2,
            label: "Current visual review",
            status: "open",
            synthetic: false,
            noteCount: 2,
            newCount: 2
          },
          {
            id: "round.historical",
            sequence: 1,
            label: "Earlier review",
            status: "closed",
            synthetic: false,
            noteCount: 1,
            newCount: 0
          }
        ],
        page: {
          notes: [
            reviewNote({
              id: "note.radical.current",
              sequence: 2,
              roundId: "round.current",
              status: "new",
              comment: "Check the radical settlement.",
              animationId: radicalId
            }),
            reviewNote({
              id: "note.derivative.current",
              sequence: 3,
              roundId: "round.current",
              status: "new",
              comment: "Derivative-only feedback",
              animationId: "animation.derivative-rules.tangent-graph"
            }),
            reviewNote({
              id: "note.radical.historical",
              sequence: 1,
              roundId: "round.historical",
              status: "verified",
              comment: "Earlier radical review passed.",
              animationId: radicalId
            })
          ],
          hasMore: false
        }
      })
    });
  });
}

function reviewNote(input: {
  id: string;
  sequence: number;
  roundId: string;
  status: "new" | "verified";
  comment: string;
  animationId: string;
}): object {
  return {
    id: input.id,
    sequence: input.sequence,
    roundId: input.roundId,
    status: input.status,
    comment: input.comment,
    sessionId: "session.browser",
    capturedAt: "2026-07-23T12:00:00.000Z",
    route:
      `http://127.0.0.1:4173/?animation=${input.animationId}`,
    build: {
      commit: "browser-test",
      fingerprint: "browser-test",
      dirty: false
    },
    checkpointId: `checkpoint.${input.id}`,
    progressPermille: 500,
    activePhase: `${input.animationId}.forward.form`
  };
}
