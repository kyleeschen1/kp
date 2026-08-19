import { expect, test } from "@playwright/test";

test("shadow review shell opens without reflow and restores focus on escape", async ({ page }) => {
  await page.goto("/");
  await page.setContent(`<!doctype html><style>html,body{margin:0}</style><main style="min-height:1600px">Reader fixture</main>`);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  await page.evaluate(async () => {
    const modulePath = "/src/dev-review/review-shell.ts";
    const { mountKpDevReviewShell } = await import(modulePath);
    (window as typeof window & { reviewShell?: ReturnType<typeof mountKpDevReviewShell> }).reviewShell = mountKpDevReviewShell(document);
  });
  const before = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));

  const host = page.locator("[data-kp-dev-review-shell]");
  await expect(host).toHaveAttribute("data-kp-dev-review-placement", "bottom-right");
  const launcher = host.locator("button.launcher");
  const panel = host.locator("[role=dialog]");
  await expect(launcher).toHaveAccessibleName("Review");
  await launcher.click();
  await expect(host.locator("[role=dialog]")).toBeVisible();
  await expect(launcher).toBeHidden();
  await page.evaluate(() => {
    const shell = (window as typeof window & {
      reviewShell?: {
        setReviewRound(label: string, sequence: number, synthetic: boolean): void;
        setInboxCount(count: number): void;
      }
    }).reviewShell;
    shell?.setReviewRound("Solve-x polish", 3, false);
    shell?.setInboxCount(4);
  });
  await expect(host.locator("output.review-round")).toHaveText("Round 3 · Solve-x polish");
  await expect(host.locator("output.inbox-count"))
    .toHaveAccessibleName("Current round contains 4 unread notes");
  await expect(panel).toHaveCSS("background-color", "rgba(255, 250, 240, 0.86)");
  await expect(host.locator("button.close")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(launcher).toBeFocused();

  const after = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
  expect(after).toEqual(before);
});

test("shadow review shell fits a narrow viewport and keeps canonical focus affordance", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await page.setContent(`<!doctype html><style>html,body{margin:0}</style><main style="min-height:1200px">Reader fixture</main>`);
  await page.evaluate(async () => {
    const modulePath = "/src/dev-review/review-shell.ts";
    const { mountKpDevReviewShell } = await import(modulePath);
    mountKpDevReviewShell(document).open();
  });
  const host = page.locator("[data-kp-dev-review-shell]");
  const panel = host.locator("[role=dialog]");
  await expect(panel).toBeVisible();
  expect((await panel.boundingBox())?.width).toBeLessThanOrEqual(296);
  await expect(host.locator("button.close")).toHaveCSS("outline-width", "3px");
  await expect(host.locator("button.close")).toHaveCSS("outline-color", "rgb(31, 99, 113)");
});

test("Catalogue Review opens as a bounded inspector-side drawer", async ({ page }) => {
  await page.setViewportSize({ width: 1_440, height: 900 });
  await page.goto("/");
  await page.setContent(`<!doctype html>
    <style>
      html,body{margin:0}
      #inspector{position:fixed;inset:0 0 0 auto;width:302px}
    </style>
    <main>Catalogue fixture</main>
    <aside id="inspector">Inspector fixture</aside>`);
  await page.evaluate(async () => {
    const modulePath = "/src/dev-review/review-shell.ts";
    const { mountKpDevReviewShell } = await import(modulePath);
    const inspector = document.querySelector<HTMLElement>("#inspector")!;
    const shell = mountKpDevReviewShell(document, {
      placement: "catalogue-inspector-drawer",
      constraintElement: inspector
    });
    shell.setReviewRound(
      "A deliberately long review round label that must remain inside the drawer",
      12,
      false
    );
    shell.open();
  });

  const host = page.locator("[data-kp-dev-review-shell]");
  const panel = host.locator("[role=dialog]");
  await expect(host).toHaveAttribute(
    "data-kp-dev-review-placement",
    "catalogue-inspector-drawer"
  );
  await expect(panel).toBeVisible();
  const box = await panel.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(1_138);
  expect(box!.width).toBeCloseTo(278, 0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(1_440);
  expect(box!.y + box!.height).toBeLessThanOrEqual(900 - 60);
  await expect.poll(() => panel.evaluate((element) =>
    element.scrollWidth <= element.clientWidth
  )).toBe(true);

  await page.locator("#inspector").evaluate((element) => {
    (element as HTMLElement).style.width = "256px";
  });
  await expect.poll(async () => (await panel.boundingBox())?.width).toBe(232);
  await expect.poll(() => panel.evaluate((element) =>
    element.scrollWidth <= element.clientWidth
  )).toBe(true);
});
