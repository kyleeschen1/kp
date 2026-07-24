import { expect, test, type Page } from "@playwright/test";

const radicalId = "animation.generated.radical.square-root-as-power";
const quadraticId = "animation.algebra.quadratic.solution-branching";
const linearSolveId = "animation.linear-solve.solve-x";

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

  const order = await page.evaluate(() => {
    const selection = document.querySelector(
      "[data-kp-animation-workbench-selection]"
    );
    const children = [
      selection?.querySelector("h2"),
      selection?.querySelector("[data-kp-editor-animation-player]"),
      selection?.querySelector(
        "[data-kp-animation-workbench-acceptance]"
      ),
      selection?.querySelector("[data-kp-animation-workbench-metadata]")
    ];
    return children.map((element) =>
      element === null || element === undefined
        ? -1
        : [...selection!.querySelectorAll("*")].indexOf(element)
    );
  });
  expect(order.every((position) => position >= 0)).toBe(true);
  expect(order).toEqual([...order].sort((left, right) => left - right));

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

test("Workbench exposes review capture for playable and planned animations", async ({
  page
}) => {
  for (const route of [
    `/?view=animation-workbench&q=radical&workbenchAnimation=${radicalId}`,
    `/?view=animation-workbench&q=quadratic&workbenchAnimation=${quadraticId}`
  ]) {
    await page.goto(route);
    await expect(page.locator("body")).toHaveAttribute(
      "data-kp-dev-review-ready",
      "true"
    );
    const host = page.locator("[data-kp-dev-review-shell]");
    await expect(host.locator("button.launcher")).toBeVisible();
    await expect(host).toHaveAttribute(
      "data-kp-dev-review-placement",
      "left-prose-rail"
    );
    await host.locator("button.launcher").click();
    await expect(host.locator("textarea")).toBeEnabled();
    await host.locator("textarea").fill("Review this Workbench moment.");
    await expect(host.locator(".meta")).toContainText("Locked");
  }
});

test("Workbench links a catalog animation to its real learner lesson", async ({
  page
}) => {
  await page.goto(
    `/?view=animation-workbench&q=${linearSolveId}&workbenchAnimation=${linearSolveId}`
  );
  const lesson = page.locator(
    '[data-kp-representation-id^="learner-experience."]'
  );
  await expect(lesson).toHaveAttribute("href", "/reader/solve-x/");
  await expect(lesson).toContainText("lesson");
  await lesson.click();
  await expect(page).toHaveURL(/\/reader\/solve-x\//);
  await expect(
    page.locator("[data-kp-reader-equation-stage]")
  ).toBeVisible();
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

test("Workbench renders and queries the authoritative roadmap table", async ({
  page
}) => {
  await page.goto(
    `/?view=animation-workbench&q=radical&workbenchAnimation=${radicalId}`
  );
  const roadmap = page.locator("[data-kp-animation-workbench-roadmap]");
  await expect(roadmap).toContainText("Product roadmap · revision 6");
  await expect(
    roadmap.locator("[data-kp-animation-workbench-roadmap-row]")
  ).toHaveCount(35);

  await roadmap
    .locator('[data-action="sort-animation-workbench-roadmap"]')
    .selectOption("name");
  await expect(page).toHaveURL(/roadmapSort=name/);
  await expect(
    page.locator('[data-action="sort-animation-workbench-roadmap"]')
  ).toBeFocused();
  await expect(
    page
      .locator("[data-kp-animation-workbench-roadmap] tbody th")
      .first()
  ).toHaveText("Authoritative roadmap Workbench");

  await page
    .locator('[data-action="filter-animation-workbench-roadmap-topic"]')
    .selectOption("Arithmetic · Addition");
  await expect(page).toHaveURL(/roadmapTopic=Arithmetic/);
  await expect(
    page.locator('[data-action="filter-animation-workbench-roadmap-topic"]')
  ).toBeFocused();
  const rows = page.locator("[data-kp-animation-workbench-roadmap-row]");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("Multi-digit addition");
  await expect(rows.first()).toContainText("planned");
  await page.reload();
  await expect(
    page.locator("[data-kp-animation-workbench-roadmap-row]")
  ).toHaveCount(1);
  await expect(
    page.locator('[data-action="sort-animation-workbench-roadmap"]')
  ).toHaveValue("name");
});

test("roadmap rows open only proven concrete animation representations", async ({
  page
}) => {
  await page.goto(
    `/?view=animation-workbench&q=quadratic&workbenchAnimation=${quadraticId}`
  );
  await expect(
    page.locator(
      '[data-action="select-animation-workbench-roadmap-link"]'
    )
  ).toHaveCount(5);
  await expect(
    page.locator(
      '[data-kp-animation-workbench-roadmap-row="quadratic-semantic-branching"] button'
    )
  ).toHaveCount(0);
  await expect(
    page.locator(
      '[data-kp-animation-workbench-roadmap-row="authoritative-roadmap-workbench"] button'
    )
  ).toHaveCount(0);

  await page
    .locator(
      '[data-kp-animation-workbench-roadmap-row="radical-native-settlement"] button'
    )
    .click();
  await expect(page).toHaveURL(
    new RegExp(
      `workbenchAnimation=${radicalId}.*representation=editor-animation\\.${radicalId}`
    )
  );
  await expect(
    page.locator("[data-kp-editor-animation-player]")
  ).toHaveAttribute("data-kp-editor-animation-id", radicalId);
});

test("Workbench search updates only the result projection while typing", async ({
  page
}) => {
  await page.goto(
    `/?view=animation-workbench&q=&workbenchAnimation=${radicalId}`
  );
  await expect(
    page.locator(
      '[data-kp-animation-workbench-review-group="current"] [data-kp-animation-workbench-review-note]'
    )
  ).toHaveCount(1);
  await page.evaluate(() => {
    const traceWindow = window as typeof window & {
      __kpWorkbenchProbe?: Element | null;
      __kpWorkbenchDetailProbe?: Element | null;
    };
    traceWindow.__kpWorkbenchProbe = document.querySelector(
      "[data-kp-animation-workbench]"
    );
    traceWindow.__kpWorkbenchDetailProbe = document.querySelector(
      "[data-kp-animation-workbench-detail]"
    );
  });
  const query = page.locator("[data-kp-animation-workbench-query]");
  await query.fill("");
  await query.pressSequentially("tangent");

  await expect(page).toHaveURL(/q=tangent/);
  expect(
    await page.evaluate(() => {
      const traceWindow = window as typeof window & {
        __kpWorkbenchProbe?: Element | null;
        __kpWorkbenchDetailProbe?: Element | null;
      };
      return {
        workbench:
          traceWindow.__kpWorkbenchProbe?.isConnected === true &&
          traceWindow.__kpWorkbenchProbe ===
            document.querySelector("[data-kp-animation-workbench]"),
        detail:
          traceWindow.__kpWorkbenchDetailProbe?.isConnected === true &&
          traceWindow.__kpWorkbenchDetailProbe ===
            document.querySelector("[data-kp-animation-workbench-detail]")
      };
    })
  ).toEqual({
    workbench: true,
    detail: true
  });
  await expect(
    page.locator('[data-kp-animation-workbench-result]')
  ).toHaveCount(1);
  await expect(
    page.locator('[data-kp-animation-workbench-result]')
  ).toContainText("Difference quotient converging to a tangent");
  await expect(
    page.locator(`[data-kp-animation-workbench-selection="${radicalId}"]`)
  ).toBeVisible();
});

test("Workbench search preserves player progress and review composer state", async ({
  page
}) => {
  await page.goto(
    `/?view=animation-workbench&q=&workbenchAnimation=${radicalId}`
  );
  const player = page.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await expect(
    page.locator(
      '[data-kp-animation-workbench-review-group="current"] [data-kp-animation-workbench-review-note]'
    )
  ).toHaveCount(1);
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  await scrubber.fill("0.5");
  const reviewShell = page.locator("[data-kp-dev-review-shell]");
  await reviewShell.locator("button.launcher").click();
  const reviewDraft = reviewShell.locator("textarea");
  await reviewDraft.fill("Keep this unsent review draft.");

  await page.evaluate(() => {
    const traceWindow = window as typeof window & {
      __kpWorkbenchDetailProbe?: Element | null;
      __kpWorkbenchPlayerProbe?: Element | null;
      __kpWorkbenchReviewProbe?: Element | null;
      __kpReviewShellProbe?: Element | null;
    };
    traceWindow.__kpWorkbenchDetailProbe = document.querySelector(
      "[data-kp-animation-workbench-detail]"
    );
    traceWindow.__kpWorkbenchPlayerProbe = document.querySelector(
      "[data-kp-editor-animation-player]"
    );
    traceWindow.__kpWorkbenchReviewProbe = document.querySelector(
      "[data-kp-animation-workbench-review]"
    );
    traceWindow.__kpReviewShellProbe = document.querySelector(
      "[data-kp-dev-review-shell]"
    );
  });

  await page
    .locator("[data-kp-animation-workbench-query]")
    .pressSequentially("tangent");

  expect(
    await page.evaluate(() => {
      const traceWindow = window as typeof window & {
        __kpWorkbenchDetailProbe?: Element | null;
        __kpWorkbenchPlayerProbe?: Element | null;
        __kpWorkbenchReviewProbe?: Element | null;
        __kpReviewShellProbe?: Element | null;
      };
      const retained = (
        probe: Element | null | undefined,
        selector: string
      ): boolean =>
        probe?.isConnected === true &&
        probe === document.querySelector(selector);
      return {
        detail: retained(
          traceWindow.__kpWorkbenchDetailProbe,
          "[data-kp-animation-workbench-detail]"
        ),
        player: retained(
          traceWindow.__kpWorkbenchPlayerProbe,
          "[data-kp-editor-animation-player]"
        ),
        reviewEvidence: retained(
          traceWindow.__kpWorkbenchReviewProbe,
          "[data-kp-animation-workbench-review]"
        ),
        reviewShell: retained(
          traceWindow.__kpReviewShellProbe,
          "[data-kp-dev-review-shell]"
        )
      };
    })
  ).toEqual({
    detail: true,
    player: true,
    reviewEvidence: true,
    reviewShell: true
  });
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "0.5"
  );
  await expect(reviewDraft).toHaveValue("Keep this unsent review draft.");
});

test("Workbench search and results support keyboard-only traversal", async ({
  page
}) => {
  await page.goto(
    `/?view=animation-workbench&q=radical&workbenchAnimation=${radicalId}`
  );
  // Chromium reserves Control+K for the omnibox, so "/" is the portable
  // in-page shortcut while Command+K remains available on macOS.
  await page.locator('[data-action="show-editor"]').focus();
  await page.keyboard.press("/");
  const query = page.locator("[data-kp-animation-workbench-query]");
  await expect(query).toBeFocused();
  await query.fill(quadraticId);
  await page.keyboard.press("ArrowDown");
  const result = page.locator(
    '[data-action="select-animation-workbench-result"]'
  ).first();
  await expect(result).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.locator(`[data-kp-animation-workbench-selection="${quadraticId}"]`)
  ).toBeVisible();
  await expect(result).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(query).toBeFocused();
});

test("Workbench respects system reduced motion and exposes static checkpoints", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(
    `/?view=animation-workbench&q=radical&workbenchAnimation=${radicalId}`
  );
  const player = page.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-accessibility-preference",
    "system"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-accessibility-mode",
    "reduced-motion"
  );
  await player
    .locator("[data-kp-editor-animation-accessibility-control]")
    .selectOption("static");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-accessibility-mode",
    "static"
  );
  await expect(
    player.locator('[data-action="play-editor-animation"]')
  ).toBeDisabled();
  await expect(
    page.locator("[data-kp-animation-workbench-static-hint]")
  ).toContainText("static checkpoints");
});

test("Workbench stacks without horizontal overflow on a narrow viewport", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    `/?view=animation-workbench&q=radical&workbenchAnimation=${radicalId}`
  );
  await expect(
    page.locator("[data-kp-editor-animation-player]")
  ).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  const geometry = await page.evaluate(() => {
    const results = document.querySelector<HTMLElement>(
      ".kp-animation-workbench__results"
    );
    const detail = document.querySelector<HTMLElement>(
      ".kp-animation-workbench__detail"
    );
    const roadmapTable = document.querySelector<HTMLElement>(
      ".kp-animation-workbench__roadmap-table-wrap"
    );
    return {
      overflow:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      resultsTop: results?.getBoundingClientRect().top ?? 0,
      detailTop: detail?.getBoundingClientRect().top ?? 0,
      roadmapTableOverflow:
        (roadmapTable?.scrollWidth ?? 0) -
        (roadmapTable?.clientWidth ?? 0)
    };
  });
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  expect(geometry.roadmapTableOverflow).toBeGreaterThan(0);
  expect(geometry.detailTop).toBeGreaterThan(geometry.resultsTop);
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
