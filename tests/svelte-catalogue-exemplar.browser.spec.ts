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
  await expect(exemplar.getByRole("heading", {
    level: 3,
    name: "Details"
  })).toBeVisible();
  const player = exemplar.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const graphSlot = player.locator(
    '[data-kp-editor-animation-surface-slot="graph"]'
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await expect(graphSlot).toHaveAttribute(
    "data-kp-editor-animation-adapter-status",
    "ready"
  );
  await expect(graphSlot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.graph.svg"
  );
  await expect(graphSlot.locator("[data-kp-editor-graph-svg]")).toBeVisible();
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-selected-health",
    "ready"
  );
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-host-outcome",
    "painted"
  );
  const inspector = exemplar.locator(
    "[data-kp-animation-catalogue-inspector-view]"
  );
  const inspectorSelect = inspector.getByRole("combobox", {
    name: "Inspector view"
  });
  await inspectorSelect.selectOption("tuning");
  await expect(inspector).toHaveAttribute(
    "data-kp-animation-catalogue-inspector-view",
    "tuning"
  );
  await expect(inspector.locator(
    '[data-kp-animation-catalogue-inspector-panel="details"]'
  )).toBeHidden();
  await expect(inspector.locator(
    '[data-kp-animation-catalogue-inspector-panel="tuning"]'
  )).toBeVisible();
  const styleTuning = inspector.locator(
    '[data-kp-animation-catalogue-tuning="gestalt-style"]'
  );
  await styleTuning.selectOption("kp.restrained-editorial@1.0.0");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-gestalt-selected-style",
    "kp.restrained-editorial@1.0.0"
  );
  const focusTuning = inspector.locator(
    '[data-kp-animation-catalogue-tuning="focus-experiment"]'
  );
  await focusTuning.selectOption("elevated");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-focus-experiment",
    "elevated"
  );
  await inspectorSelect.selectOption("details");
  await expect(styleTuning).toHaveValue("kp.restrained-editorial@1.0.0");
  await player.evaluate((element) => {
    element.dataset["kpSveltePlayerIdentity"] = "stable";
  });
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  await scrubber.fill("0.5");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "0.5"
  );
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
  await expect(player).toHaveAttribute(
    "data-kp-svelte-player-identity",
    "stable"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0.5");
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

test("Svelte in-shell selection ignores a stale pack completion", async ({
  page
}) => {
  let releaseAlgebraRequest: (() => void) | undefined;
  const algebraRequestGate = new Promise<void>((resolve) => {
    releaseAlgebraRequest = resolve;
  });
  await page.route("**/src/animation/catalog-packs/algebra.ts*", async (route) => {
    await algebraRequestGate;
    await route.continue();
  });
  const documentRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") {
      documentRequests.push(request.url());
    }
  });

  await page.goto(
    `/?artifact=${animationId}&catalogueShell=svelte-exemplar`
  );
  const exemplar = page.locator("[data-kp-svelte-catalogue-shell]");
  const search = exemplar.getByRole("searchbox", { name: "Search artifacts" });
  const stage = exemplar.locator("[data-kp-animation-catalogue-stage]");

  await search.fill("slvx");
  await exemplar.getByRole("link", { name: /Solve x/ }).click();
  await expect(stage).toHaveAttribute(
    "data-kp-animation-catalogue-stage-state",
    "loading"
  );
  await expect(stage.locator("[data-kp-editor-animation-player]")).toHaveCount(0);

  await search.fill("demand equilibrium");
  await exemplar.getByRole("link", { name: /Supply and demand/ }).click();
  const economicsId =
    "animation.economics.supply-demand-equilibrium-shift";
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    economicsId
  );
  await expect(stage.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${economicsId}"]`
  )).toHaveAttribute("data-kp-editor-animation-hydrated", "true");

  releaseAlgebraRequest?.();
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    economicsId
  );
  expect(documentRequests).toHaveLength(1);
  expect(page.url()).toContain(
    "artifact=animation.economics.supply-demand-equilibrium-shift"
  );
  expect(page.url()).toContain("catalogueShell=svelte-exemplar");
});

test("Svelte history restores artifact and playhead without a document load", async ({
  page
}) => {
  const documentRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") {
      documentRequests.push(request.url());
    }
  });
  await page.goto(
    `/?artifact=${animationId}&catalogueShell=svelte-exemplar`
  );
  const exemplar = page.locator("[data-kp-svelte-catalogue-shell]");
  const search = exemplar.getByRole("searchbox", { name: "Search artifacts" });
  const vectorPlayer = exemplar.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  await vectorPlayer.locator(
    '[data-action="seek-editor-animation"]'
  ).fill("0.42");
  await expect.poll(() => page.url()).toContain("playhead=0.42");

  await search.fill("demand equilibrium");
  await exemplar.getByRole("link", { name: /Supply and demand/ }).click();
  const economicsId =
    "animation.economics.supply-demand-equilibrium-shift";
  const economicsPlayer = exemplar.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${economicsId}"]`
  );
  await economicsPlayer.locator(
    '[data-action="seek-editor-animation"]'
  ).fill("0.625");
  await expect.poll(() => page.url()).toContain("playhead=0.625");

  await page.goBack();
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    animationId
  );
  await expect(exemplar.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  )).toHaveAttribute("data-kp-editor-animation-progress", "0.42");

  await page.goForward();
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    economicsId
  );
  await expect(exemplar.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${economicsId}"]`
  )).toHaveAttribute("data-kp-editor-animation-progress", "0.625");
  expect(documentRequests).toHaveLength(1);
  expect(page.url()).toContain("catalogueShell=svelte-exemplar");
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
