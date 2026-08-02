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
  const exemplar = root.locator("[data-kp-svelte-catalogue-shell]");
  await expect(root).toHaveAttribute(
    "data-kp-svelte-catalogue-exemplar",
    "mounted"
  );
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    animationId
  );
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-state",
    "selected"
  );
  await expect(exemplar.locator(
    "[data-kp-animation-catalogue-region]"
  )).toHaveCount(3);
  await expect(exemplar.getByRole("heading", { level: 3 })).toHaveText("Details");
  await expect(exemplar.locator("[data-kp-editor-animation-player]")).toHaveCount(0);
  const search = exemplar.getByRole("searchbox", { name: "Search artifacts" });
  const results = exemplar.locator("[data-kp-animation-catalogue-results]");
  const originalUrl = page.url();
  await expect(results).toHaveAttribute(
    "data-kp-animation-catalogue-result-count",
    "36"
  );
  await expect(results.locator("li").first()).toHaveAttribute(
    "data-kp-animation-catalogue-row",
    animationId
  );

  await search.fill("demand equilibrium");
  await expect(results).toHaveAttribute(
    "data-kp-animation-catalogue-result-count",
    "1"
  );
  await expect(results.locator("li").first()).toHaveAttribute(
    "data-kp-animation-catalogue-row",
    "animation.economics.supply-demand-equilibrium-shift"
  );
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    animationId
  );
  await expect(exemplar.getByRole("status")).toContainText(
    "Dot product and vector projection"
  );
  expect(page.url()).toBe(originalUrl);

  await search.fill("slvx");
  await expect(results.locator("li").first()).toHaveAttribute(
    "data-kp-animation-catalogue-row",
    "animation.linear-solve.solve-x"
  );
  await search.fill("");
  await expect(results.locator("li").first()).toHaveAttribute(
    "data-kp-animation-catalogue-row-selected",
    "true"
  );
  assertRequestedEntry(requestedUrls);
  expect(pageErrors).toEqual([]);
});

test("Svelte exemplar renders the not-found terminal state in its reserved stage", async ({
  page
}) => {
  await page.goto(
    "/?artifact=animation.unknown&catalogueShell=svelte-exemplar"
  );

  const exemplar = page.locator("[data-kp-svelte-catalogue-shell]");
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-state",
    "not-found"
  );
  await expect(exemplar.getByRole("alert")).toContainText(
    "animation.unknown"
  );
  await expect(exemplar.locator(
    "[data-kp-animation-catalogue-stage-reservation]"
  )).toHaveCount(1);
});

test("Svelte exemplar keeps loading truth visible and contains preparation errors", async ({
  page
}) => {
  let releasePackRequest: (() => void) | undefined;
  const packRequestGate = new Promise<void>((resolve) => {
    releasePackRequest = resolve;
  });
  await page.route("**/src/animation/catalog-packs/graph.ts*", async (route) => {
    await packRequestGate;
    await route.abort("failed");
  });

  await page.goto(
    `/?artifact=${animationId}&catalogueShell=svelte-exemplar`
  );
  const exemplar = page.locator("[data-kp-svelte-catalogue-shell]");
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-state",
    "loading"
  );
  await expect(exemplar).toHaveAttribute("aria-busy", "true");
  await expect(exemplar.getByRole("status")).toContainText("Preparing");

  releasePackRequest?.();
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-state",
    "error"
  );
  await expect(exemplar.getByRole("alert")).toBeVisible();
  await expect(exemplar).toHaveAttribute("aria-busy", "false");
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
  await expect(page.locator("[data-kp-svelte-catalogue-shell]")).toHaveCount(0);
  expect(requestedUrls.some((url) =>
    url.includes("svelte-catalogue-exemplar-entry")
  )).toBe(false);
});

function assertRequestedEntry(requestedUrls: readonly string[]): void {
  expect(requestedUrls.some((url) =>
    url.includes("svelte-catalogue-exemplar-entry")
  )).toBe(true);
}
