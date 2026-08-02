import { expect, test } from "@playwright/test";

const animationId = "animation.dot-projection.basic";

test("explicit Svelte exemplar mounts through the shared selected-host model", async ({
  page
}) => {
  const pageErrors: string[] = [];
  const requestedUrls: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => requestedUrls.push(request.url()));

  await page.goto(
    `/?artifact=${animationId}&catalogueShell=svelte-exemplar`
  );

  const root = page.locator("#app");
  const exemplar = root.locator("[data-kp-svelte-catalogue-exemplar]");
  await expect(root).toHaveAttribute(
    "data-kp-svelte-catalogue-exemplar",
    "mounted"
  );
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    animationId
  );
  await expect(exemplar.getByRole("heading", { level: 3 })).toBeVisible();
  await expect(page.locator("[data-kp-animation-catalogue]")).toHaveCount(0);
  assertRequestedEntry(requestedUrls);
  expect(pageErrors).toEqual([]);
});

test("canonical catalogue route still mounts the imperative rollback host", async ({
  page
}) => {
  const requestedUrls: string[] = [];
  page.on("request", (request) => requestedUrls.push(request.url()));
  await page.goto(`/?artifact=${animationId}`);

  await expect(page.locator("[data-kp-animation-catalogue]")).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    animationId
  );
  await expect(page.locator("[data-kp-svelte-catalogue-exemplar]")).toHaveCount(0);
  expect(requestedUrls.some((url) =>
    url.includes("svelte-catalogue-exemplar-entry")
  )).toBe(false);
});

function assertRequestedEntry(requestedUrls: readonly string[]): void {
  expect(requestedUrls.some((url) =>
    url.includes("svelte-catalogue-exemplar-entry")
  )).toBe(true);
}
