import { expect, test } from "@playwright/test";

test("composer locks one capture per note and submits with command-enter", async ({ page }) => {
  await page.goto("/");
  await page.setContent(`<!doctype html><body></body>`);
  await page.evaluate(async () => {
    const shellPath = "/src/dev-review/review-shell.ts";
    const composerPath = "/src/dev-review/review-composer.ts";
    const shellModule = await import(shellPath);
    const composerModule = await import(composerPath);
    const shell = shellModule.mountKpDevReviewShell(document);
    const state = { captures: 0, submissions: [] as unknown[] };
    (window as typeof window & { reviewState?: typeof state }).reviewState = state;
    composerModule.mountKpDevReviewComposer({
      shell,
      capture: async () => {
        state.captures += 1;
        return {
          route: `http://127.0.0.1:8000/reader/solve-x/?kpProgress=${state.captures * 420}`,
          capturedAt: `2026-07-20T20:00:0${state.captures}.000Z`,
          environment: {
            browserName: "Chrome", language: "en-US",
            viewport: { width: 1280, height: 720, devicePixelRatio: 1, scrollX: 0, scrollY: 400 },
            reducedMotion: false, forcedColors: false, colorScheme: "light",
            build: { commit: "abc", fingerprint: "dev-abc", dirty: false }
          },
          semantic: {
            checkpointId: `story.${state.captures}`, progressPermille: state.captures * 420, activePhase: "act",
            activeTransformationIds: ["linear-solve.cancel"], focusRefs: []
          },
          render: { ownerIds: [] },
          temporalTrace: []
        };
      },
      submit: async (input: { comment: string; capture: unknown }) => {
        state.submissions.push(input);
        return { schemaVersion: "kp.dev-review.v1", sessionId: "review.test.1", comment: input.comment,
          capture: input.capture, id: `review-note.${state.submissions.length}.abc`,
          sequence: state.submissions.length, status: "new" };
      }
    });
  });

  const host = page.locator("[data-kp-dev-review-shell]");
  await host.locator("button.launcher").click();
  await expect(host.locator("textarea")).toBeFocused();
  await expect(host.locator(".meta")).toContainText("Type to capture this moment");
  await host.locator("textarea").fill("The +3 changes size during the handoff.");
  await expect(host.locator(".meta")).toContainText("story.1");
  await expect(host.locator(".meta")).toContainText("42%");
  await expect(host.locator(".meta")).toContainText("act");
  await host.locator("textarea").press(process.platform === "darwin" ? "Meta+Enter" : "Control+Enter");
  await expect(host.locator("output.status")).toHaveText("Saved note 1.");
  await expect(host.locator("output.inbox-count")).toHaveText("Inbox 1");
  await expect(host.locator(".meta")).toContainText("Type to capture this moment");

  await host.locator("textarea").fill("The equals sign jumps at the next handoff.");
  await expect(host.locator(".meta")).toContainText("story.2");
  await expect(host.locator(".meta")).toContainText("84%");
  await host.locator("button.save").click();
  await expect(host.locator("output.status")).toHaveText("Saved note 2.");
  await expect(host.locator("output.inbox-count")).toHaveText("Inbox 2");
  await page.keyboard.press("Escape");
  await expect(host.locator("output.launcher-count")).toHaveText("2");

  const state = await page.evaluate(() => (window as typeof window & {
    reviewState?: { captures: number; submissions: Array<{
      comment: string;
      capture: { capturedAt: string; semantic: { progressPermille: number } };
    }> }
  }).reviewState);
  expect(state?.captures).toBe(2);
  expect(state?.submissions).toHaveLength(2);
  expect(state?.submissions[0]?.comment).toBe("The +3 changes size during the handoff.");
  expect(state?.submissions[1]?.comment).toBe("The equals sign jumps at the next handoff.");
  expect(state?.submissions.map((submission) => submission.capture.semantic.progressPermille))
    .toEqual([420, 840]);
  expect(new Set(state?.submissions.map((submission) => submission.capture.capturedAt)).size)
    .toBe(2);
});

test("composer preserves failed text and its locked capture until retry succeeds", async ({ page }) => {
  await page.goto("/");
  await page.setContent(`<!doctype html><body></body>`);
  await page.evaluate(async () => {
    const shellPath = "/src/dev-review/review-shell.ts";
    const composerPath = "/src/dev-review/review-composer.ts";
    const shellModule = await import(shellPath);
    const composerModule = await import(composerPath);
    const shell = shellModule.mountKpDevReviewShell(document);
    const state = { captures: 0, attempts: 0 };
    (window as typeof window & { reviewFailureState?: typeof state }).reviewFailureState = state;
    composerModule.mountKpDevReviewComposer({
      shell,
      capture: async () => ({
        route: "http://localhost/reader/solve-x/", capturedAt: new Date().toISOString(),
        environment: { browserName: "Chrome", language: "en-US",
          viewport: { width: 320, height: 640, devicePixelRatio: 1, scrollX: 0, scrollY: 0 },
          reducedMotion: false, forcedColors: false, colorScheme: "light",
          build: { commit: "abc", fingerprint: `dev-${++state.captures}`, dirty: false } },
        semantic: { activeTransformationIds: [], focusRefs: [] }, render: { ownerIds: [] }, temporalTrace: []
      }),
      submit: async (input: { comment: string; capture: unknown }) => {
        state.attempts += 1;
        if (state.attempts === 1) throw new Error("offline");
        return { schemaVersion: "kp.dev-review.v1", sessionId: "review.test.1", comment: input.comment,
          capture: input.capture, id: "review-note.1.retry", sequence: 1, status: "new" };
      }
    });
  });
  const host = page.locator("[data-kp-dev-review-shell]");
  await host.locator("button.launcher").click();
  const textarea = host.locator("textarea");
  await textarea.fill("Keep this text");
  await host.locator("button.save").click();
  await expect(host.locator("output.status")).toContainText("still here");
  await expect(host.locator("output.inbox-count")).toHaveText("Inbox 0");
  await expect(textarea).toHaveValue("Keep this text");
  await host.locator("button.save").click();
  await expect(host.locator("output.status")).toHaveText("Saved note 1.");
  await expect(textarea).toHaveValue("");
  const state = await page.evaluate(() => (window as typeof window & {
    reviewFailureState?: { captures: number; attempts: number }
  }).reviewFailureState);
  expect(state).toEqual({ captures: 1, attempts: 2 });
});

test("an obsolete capture cannot unlock a newer note after close and reopen", async ({ page }) => {
  await page.goto("/");
  await page.setContent(`<!doctype html><body></body>`);
  await page.evaluate(async () => {
    const shellPath = "/src/dev-review/review-shell.ts";
    const composerPath = "/src/dev-review/review-composer.ts";
    const shellModule = await import(shellPath);
    const composerModule = await import(composerPath);
    const shell = shellModule.mountKpDevReviewShell(document);
    const state = { captures: 0, resolve: [] as Array<() => void> };
    (window as typeof window & { reviewRaceState?: typeof state }).reviewRaceState = state;
    composerModule.mountKpDevReviewComposer({
      shell,
      capture: () => new Promise((resolve) => {
        const captureNumber = ++state.captures;
        state.resolve.push(() => resolve({
          route: `http://localhost/reader/solve-x/?kpProgress=${captureNumber * 100}`,
          capturedAt: `2026-07-20T20:00:0${captureNumber}.000Z`,
          environment: { browserName: "Chrome", language: "en-US",
            viewport: { width: 320, height: 640, devicePixelRatio: 1, scrollX: 0, scrollY: 0 },
            reducedMotion: false, forcedColors: false, colorScheme: "light",
            build: { commit: "abc", fingerprint: `dev-${captureNumber}`, dirty: false } },
          semantic: { checkpointId: `story.${captureNumber}`, progressPermille: captureNumber * 100,
            activeTransformationIds: [], focusRefs: [] },
          render: { ownerIds: [] }, temporalTrace: []
        }));
      }),
      submit: async () => { throw new Error("not reached"); }
    });
  });

  const host = page.locator("[data-kp-dev-review-shell]");
  await host.locator("button.launcher").click();
  await host.locator("textarea").fill("Old moment");
  await page.keyboard.press("Escape");
  await host.locator("button.launcher").click();
  await host.locator("textarea").fill("New moment");

  await page.evaluate(() => (window as typeof window & {
    reviewRaceState?: { resolve: Array<() => void> }
  }).reviewRaceState?.resolve[0]?.());
  await expect(host.locator(".meta")).toContainText("Capturing state");
  await expect(host.locator("button.save")).toBeDisabled();

  await page.evaluate(() => (window as typeof window & {
    reviewRaceState?: { resolve: Array<() => void> }
  }).reviewRaceState?.resolve[1]?.());
  await expect(host.locator(".meta")).toContainText("story.2");
  await expect(host.locator("button.save")).toBeEnabled();
});
