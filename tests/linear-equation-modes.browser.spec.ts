import { expect, test, type Locator } from "@playwright/test";

const conceptPath = "/concepts/mathematics/linear-equations/solve-with-balance";

test("Watch plays while direct links remain paused at their exact shared frame", async ({ page }) => {
  await page.goto(conceptPath);
  const shell = page.locator("[data-kp-concept-room-shell]");

  await expect(shell).toHaveAttribute("data-kp-concept-mode", "watch");
  await expect(shell).toHaveAttribute("data-kp-concept-playing", "false");
  await expect(shell.getByRole("button", { name: "Play concept", exact: true })).toBeVisible();
  await expect(shell.getByRole("button", { name: "Replay concept", exact: true })).toBeVisible();
  await expect(shell.getByRole("button", { name: "Previous step" })).toHaveCount(0);
  await expect(shell.getByRole("slider", { name: "Scrub concept timeline" })).toHaveCount(0);

  await shell.getByRole("link", { name: "Touch", exact: true }).click();
  await expect(shell).toHaveAttribute("data-kp-concept-mode", "touch");
  await expect(shell.getByRole("slider", { name: "Scrub concept timeline" })).toHaveValue("0");
  await expect(shell.locator("[data-kp-concept-checkpoints]")).toBeVisible();

  await shell.getByRole("link", { name: "Watch", exact: true }).press("Enter");
  await expect(shell).toHaveAttribute("data-kp-concept-mode", "watch");
  await expect(shell).toHaveAttribute("data-kp-concept-playing", "true");
  await expect.poll(() => routeTime(page.url())).toBeGreaterThan(0);
  await expect.poll(async () => {
    const [symbolic, balance] = await sharedProjectionTimes(shell);
    return symbolic === balance && symbolic !== undefined && symbolic > 0;
  }).toBe(true);

  await page.goBack();
  await expect(shell).toHaveAttribute("data-kp-concept-mode", "touch");
  await expect(shell).toHaveAttribute("data-kp-concept-playing", "false");
  await expect(page).toHaveURL(/mode=touch/);
  await expect(page).toHaveURL(/t=0/);
});

test("Touch and Review preserve one canonical state without forking or quiz UI", async ({ page }) => {
  await page.goto(conceptPath);
  const shell = page.locator("[data-kp-concept-room-shell]");
  await shell.getByRole("link", { name: "Touch", exact: true }).dispatchEvent("click");
  const scrubber = shell.getByRole("slider", { name: "Scrub concept timeline" });
  await scrubber.fill("750");
  const touchUrl = page.url();
  await expect(shell).toHaveAttribute("data-kp-concept-checkpoint", "divide-two");
  expect(await sharedProjectionTimes(shell)).toEqual([750, 750]);

  await shell.getByRole("link", { name: "Review", exact: true }).press("Enter");
  await expect(shell).toHaveAttribute("data-kp-concept-mode", "review");
  await expect(shell).toHaveAttribute("data-kp-concept-checkpoint", "divide-two");
  await expect(shell.locator("[data-kp-concept-review-mode]"))
    .toContainText("Two copies of x become one");
  await expect(shell.locator("[data-kp-concept-review-mode] li")).toHaveCount(4);
  await expect(shell.locator("[data-kp-concept-copy-rail]"))
    .toHaveCount(0);
  await expect(shell.locator("[data-kp-concept-projection-controls]"))
    .toHaveCount(0);
  await expect(shell.getByRole("slider", { name: "Scrub concept timeline" }))
    .toHaveCount(0);
  await expect(shell.getByRole("button", { name: /check|submit|answer/i }))
    .toHaveCount(0);
  expect(await page.evaluate(() =>
    (window as unknown as { find(text: string): boolean }).find("Substitution confirms")
  )).toBe(true);
  expect(routeWithoutMode(page.url())).toEqual(routeWithoutMode(touchUrl));

  await page.goBack();
  await expect(shell).toHaveAttribute("data-kp-concept-mode", "touch");
  await expect(shell.getByRole("slider", { name: "Scrub concept timeline" })).toHaveValue("750");
  expect(await sharedProjectionTimes(shell)).toEqual([750, 750]);
});

function routeTime(url: string): number {
  return Number(new URL(url).searchParams.get("t"));
}

function routeWithoutMode(url: string): readonly string[] {
  const parsed = new URL(url);
  parsed.searchParams.delete("mode");
  return [...parsed.searchParams.entries()].map(([key, value]) => `${key}=${value}`).sort();
}

async function sharedProjectionTimes(shell: Locator): Promise<readonly number[]> {
  const symbolic = shell.locator('[data-kp-coordinated-projection="symbolic"]');
  const balance = shell.locator('[data-kp-coordinated-projection="balance"]');
  return Promise.all([symbolic, balance].map(async (projection) => Number(
    await projection.getAttribute("data-kp-coordinated-time-permille")
  )));
}
