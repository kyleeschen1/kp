import { expect, test } from "@playwright/test";

test("composer locks one capture on open and submits with command-enter", async ({ page }) => {
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
          route: "http://127.0.0.1:8000/reader/solve-x/?kpProgress=420",
          capturedAt: "2026-07-20T20:00:00.000Z",
          environment: {
            browserName: "Chrome", language: "en-US",
            viewport: { width: 1280, height: 720, devicePixelRatio: 1, scrollX: 0, scrollY: 400 },
            reducedMotion: false, forcedColors: false, colorScheme: "light",
            build: { commit: "abc", fingerprint: "dev-abc", dirty: false }
          },
          semantic: {
            checkpointId: "story.cancel", progressPermille: 420, activePhase: "act",
            activeTransformationIds: ["linear-solve.cancel"], focusRefs: []
          },
          render: { ownerIds: [] },
          temporalTrace: []
        };
      },
      submit: async (input: { comment: string; capture: unknown }) => {
        state.submissions.push(input);
        return { schemaVersion: "kp.dev-review.v1", sessionId: "review.test.1", comment: input.comment,
          capture: input.capture, id: "review-note.1.abc", sequence: 1, status: "new" };
      }
    });
  });

  const host = page.locator("[data-kp-dev-review-shell]");
  await host.locator("button.launcher").click();
  await expect(host.locator("textarea")).toBeFocused();
  await expect(host.locator(".meta")).toContainText("story.cancel");
  await expect(host.locator(".meta")).toContainText("42%");
  await expect(host.locator(".meta")).toContainText("act");
  await host.locator("textarea").fill("The +3 changes size during the handoff.");
  await host.locator("textarea").press(process.platform === "darwin" ? "Meta+Enter" : "Control+Enter");
  await expect(host.locator("output.status")).toHaveText("Saved note 1.");

  const state = await page.evaluate(() => (window as typeof window & {
    reviewState?: { captures: number; submissions: Array<{ comment: string }> }
  }).reviewState);
  expect(state?.captures).toBe(1);
  expect(state?.submissions).toHaveLength(1);
  expect(state?.submissions[0]?.comment).toBe("The +3 changes size during the handoff.");
});

test("composer preserves failed text and recaptures only after close and reopen", async ({ page }) => {
  await page.goto("/");
  await page.setContent(`<!doctype html><body></body>`);
  await page.evaluate(async () => {
    const shellPath = "/src/dev-review/review-shell.ts";
    const composerPath = "/src/dev-review/review-composer.ts";
    const shellModule = await import(shellPath);
    const composerModule = await import(composerPath);
    const shell = shellModule.mountKpDevReviewShell(document);
    let captures = 0;
    composerModule.mountKpDevReviewComposer({
      shell,
      capture: async () => ({
        route: "http://localhost/reader/solve-x/", capturedAt: new Date().toISOString(),
        environment: { browserName: "Chrome", language: "en-US",
          viewport: { width: 320, height: 640, devicePixelRatio: 1, scrollX: 0, scrollY: 0 },
          reducedMotion: false, forcedColors: false, colorScheme: "light",
          build: { commit: "abc", fingerprint: `dev-${++captures}`, dirty: false } },
        semantic: { activeTransformationIds: [], focusRefs: [] }, render: { ownerIds: [] }, temporalTrace: []
      }),
      submit: async () => { throw new Error("offline"); }
    });
  });
  const host = page.locator("[data-kp-dev-review-shell]");
  await host.locator("button.launcher").click();
  const textarea = host.locator("textarea");
  await textarea.fill("Keep this text");
  await host.locator("button.save").click();
  await expect(host.locator("output.status")).toContainText("still here");
  await expect(textarea).toHaveValue("Keep this text");
  await page.keyboard.press("Escape");
  await host.locator("button.launcher").click();
  await expect(textarea).toHaveValue("");
});
