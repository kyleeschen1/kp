import { expect, test } from "@playwright/test";

test("every playable catalog identity paints one certified primary host", async ({
  page
}) => {
  test.setTimeout(240_000);
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    if (
      error.message ===
      "ResizeObserver loop completed with undelivered notifications."
    ) return;
    pageErrors.push(error.message);
  });

  await page.goto("/canonical-animation-review.html");
  const library = page.locator("[data-kp-animation-library]");
  await expect(library).toHaveAttribute("data-catalog-ready", "true");
  const playableIds = await page
    .locator(
      '[data-animation-library-list] ' +
      'button[data-availability="playable"]'
    )
    .evaluateAll((buttons) => buttons.map(
      (button) => (button as HTMLElement).dataset["animationId"] ?? ""
    ).filter(Boolean));

  expect(playableIds.length).toBeGreaterThan(30);
  for (const animationId of playableIds) {
    const errorCount = pageErrors.length;
    await page.locator(
      `[data-animation-library-list] ` +
      `button[data-animation-id="${animationId}"]`
    ).click();
    await expect(
      library,
      `${animationId} must not be certified by iframe load alone`
    ).toHaveAttribute("data-preview-ready", "true", { timeout: 15_000 });
    await expect(
      page.frameLocator("[data-animation-library-frame]").locator("body"),
      `${animationId} must report readiness after its first rendered frame`
    ).toHaveAttribute("data-kp-animation-host-status", "ready");
    expect(
      pageErrors.slice(errorCount),
      `${animationId} emitted an unhandled renderer error`
    ).toEqual([]);
  }
});

test("rapid selection and reload cannot strand the shared host", async ({
  page
}) => {
  test.setTimeout(90_000);
  await page.goto("/canonical-animation-review.html");
  const library = page.locator("[data-kp-animation-library]");
  await expect(library).toHaveAttribute("data-catalog-ready", "true");
  const playableIds = await page
    .locator(
      '[data-animation-library-list] ' +
      'button[data-availability="playable"]'
    )
    .evaluateAll((buttons) => buttons.slice(0, 8).map(
      (button) => (button as HTMLElement).dataset["animationId"] ?? ""
    ).filter(Boolean));

  for (const animationId of playableIds) {
    await page.locator(
      `[data-animation-library-list] ` +
      `button[data-animation-id="${animationId}"]`
    ).click();
  }
  await expect(library).toHaveAttribute(
    "data-preview-ready",
    "true",
    { timeout: 15_000 }
  );
  await expect(page.locator("[data-animation-library-error]")).toBeHidden();

  await page.reload();
  await expect(library).toHaveAttribute("data-catalog-ready", "true");
  await expect(library).toHaveAttribute(
    "data-preview-ready",
    "true",
    { timeout: 15_000 }
  );
  await expect(
    page.frameLocator("[data-animation-library-frame]").locator("body")
  ).toHaveAttribute("data-kp-animation-host-status", "ready");
});
