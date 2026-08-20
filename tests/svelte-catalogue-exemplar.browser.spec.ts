import { expect, test } from "@playwright/test";

import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";

const animationId = "animation.dot-projection.basic";
const catalogueResultCount = String(
  createKpAnimationCatalogueProjection().entries.length
);

test("canonical Svelte catalogue mounts through the shared selected-host model", async ({
  page
}) => {
  const pageErrors: string[] = [];
  const requestedUrls: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => requestedUrls.push(request.url()));

  await page.goto(`/?artifact=${animationId}`);

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
    catalogueResultCount
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
  await page.route(
    "**/algebra-linear-solve.ts*",
    async (route) => {
      await algebraRequestGate;
      await route.continue();
    }
  );
  const documentRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") {
      documentRequests.push(request.url());
    }
  });

  await page.goto(`/?artifact=${animationId}`);
  const exemplar = page.locator("[data-kp-svelte-catalogue-shell]");
  const search = exemplar.getByRole("searchbox", { name: "Search artifacts" });
  const stage = exemplar.locator("[data-kp-animation-catalogue-stage]");

  await search.fill("slvx");
  await exemplar.getByRole("link", { name: /Solve x/ }).click();
  await expect(stage).toHaveAttribute(
    "data-kp-animation-catalogue-stage-state",
    "loading"
  );
  await expect(stage.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  )).toHaveCount(1);

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
  expect(new URL(page.url()).searchParams.has("catalogueShell")).toBe(false);
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
  await page.goto(`/?artifact=${animationId}`);
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
  await expect.poll(() => page.url()).toContain("playhead=0.63");

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
  expect(new URL(page.url()).searchParams.has("catalogueShell")).toBe(false);
});

test("Svelte selection restores stage focus and rail scroll", async ({ page }) => {
  await page.goto(`/?artifact=${animationId}`);
  const exemplar = page.locator("[data-kp-svelte-catalogue-shell]");
  const player = exemplar.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const railViewport = exemplar.locator(
    "[data-kp-animation-catalogue-results]"
  );
  await player.focus();
  await railViewport.evaluate((element) => {
    element.scrollTop = 140;
  });
  const retainedScroll = await railViewport.evaluate((element) =>
    element.scrollTop
  );
  expect(retainedScroll).toBeGreaterThan(0);

  const economicsId =
    "animation.economics.supply-demand-equilibrium-shift";
  await exemplar.locator(
    `[data-kp-animation-catalogue-row="${economicsId}"] a`
  ).evaluate((link) => (link as HTMLAnchorElement).click());
  const nextPlayer = exemplar.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${economicsId}"]`
  );
  await expect(nextPlayer).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await expect.poll(() => nextPlayer.evaluate((element) =>
    document.activeElement === element
  )).toBe(true);
  expect(await railViewport.evaluate((element) => element.scrollTop))
    .toBe(retainedScroll);
});

test("Svelte selection retains a live row focus and inspector choice", async ({
  page
}) => {
  await page.goto("/?artifact=animation.linear-solve.solve-x");
  const exemplar = page.locator("[data-kp-svelte-catalogue-shell]");
  const inspectorSelect = exemplar.getByRole("combobox", {
    name: "Inspector view"
  });
  await inspectorSelect.selectOption("parameters");
  await expect(inspectorSelect).toHaveValue("parameters");
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-inspector-view",
    "parameters"
  );
  const nextId = "animation.generated.radical.square-root-as-power";
  const nextLink = exemplar.locator(
    `[data-kp-animation-catalogue-row="${nextId}"] a`
  );
  await nextLink.focus();
  await nextLink.press("Enter");

  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    nextId
  );
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-host-outcome",
    "painted"
  );
  await expect.poll(() => nextLink.evaluate((element) =>
    document.activeElement === element
  )).toBe(true);
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-inspector-view",
    "parameters"
  );
  await expect(exemplar.getByRole("combobox", {
    name: "Inspector view"
  })).toHaveValue("parameters");
});

test("canonical Svelte shell keeps narrow panels operable and returns focus", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto(`/?artifact=${animationId}`);
  const exemplar = page.locator("[data-kp-svelte-catalogue-shell]");
  await expect(exemplar.getByRole("heading", {
    level: 1,
    name: "Animation catalogue"
  })).toHaveCount(1);
  await expect(exemplar.locator('aside[aria-label="Artifact catalogue"]'))
    .toHaveCount(1);
  await expect(exemplar.getByRole("region", {
    name: "Selected animation stage"
  })).toBeVisible();
  const inspector = exemplar.locator(
    'aside[aria-label="Artifact inspector"]'
  );
  await expect(inspector).toHaveCount(1);
  const viewportGeometry = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(viewportGeometry.documentWidth).toBe(viewportGeometry.viewportWidth);
  const info = exemplar.getByRole("button", { name: "Info" });
  await info.click();
  await expect(inspector).toBeVisible();
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-overlay",
    "inspector"
  );
  await expect(info).toHaveAttribute("aria-expanded", "true");
  const inspectorSelect = exemplar.getByRole("combobox", {
    name: "Inspector view"
  });
  await expect.poll(() => inspectorSelect.evaluate((element) =>
    document.activeElement === element
  )).toBe(true);
  await inspectorSelect.press("Escape");
  await expect(exemplar).not.toHaveAttribute(
    "data-kp-animation-catalogue-overlay",
    /.+/
  );
  await expect(info).toHaveAttribute("aria-expanded", "false");
  await expect.poll(() => info.evaluate((element) =>
    document.activeElement === element
  )).toBe(true);
});

test("canonical Svelte shell projects system reduced motion without losing static truth", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/?artifact=${animationId}&playhead=1`);

  const exemplar = page.locator("[data-kp-svelte-catalogue-shell]");
  const player = exemplar.locator("[data-kp-editor-animation-player]");
  const graph = player.locator("[data-kp-editor-graph-svg]");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-accessibility-preference",
    "system"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-accessibility-mode",
    "reduced-motion"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "1");
  await expect(graph).toHaveAttribute(
    "aria-describedby",
    /.+/
  );
  await expect(graph.locator("desc")).toContainText(
    "projection of a onto b is (3, 3)"
  );
  await expect(graph.locator("text")).toHaveCount(0);
  expect(await graph.locator(".katex").count()).toBeGreaterThan(0);
});

test("Svelte keeps one Review composer and draft across selection", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}`);
  const review = page.locator("[data-kp-dev-review-shell]");
  await expect(review).toHaveCount(1);
  await expect(review).toHaveAttribute(
    "data-kp-dev-review-placement",
    "catalogue-rail"
  );
  await expect(review).toHaveAttribute("data-kp-dev-review-available", "true");
  // The global development toolbar is the visible Review owner; the
  // catalogue-local launcher remains hidden to preserve one entry point.
  await page.locator(
    '[data-kp-dev-toolbar-control="kp.dev-toolbar.review"]'
  ).click();
  const comment = review.getByRole("textbox", { name: "What should change?" });
  await comment.fill("Keep this draft through the asset transition.");
  await review.evaluate((element) => {
    element.dataset["kpSvelteReviewIdentity"] = "stable";
  });

  const economicsId =
    "animation.economics.supply-demand-equilibrium-shift";
  await page.locator(
    `[data-kp-animation-catalogue-row="${economicsId}"] a`
  ).evaluate((link) => (link as HTMLAnchorElement).click());
  await expect(page.locator("[data-kp-svelte-catalogue-shell]")).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    economicsId
  );
  await expect(page.locator("[data-kp-dev-review-shell]")).toHaveCount(1);
  await expect(review).toHaveAttribute(
    "data-kp-svelte-review-identity",
    "stable"
  );
  await expect(comment).toHaveValue(
    "Keep this draft through the asset transition."
  );
});

test("Svelte ports economics and physics parameters through one player lifecycle", async ({
  page
}) => {
  const documentRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") {
      documentRequests.push(request.url());
    }
  });
  const economicsId =
    "animation.economics.supply-demand-equilibrium-shift";
  await page.goto(`/?artifact=${economicsId}&playhead=0.56`);

  const exemplar = page.locator("[data-kp-svelte-catalogue-shell]");
  const inspectorSelect = exemplar.getByRole("combobox", {
    name: "Inspector view"
  });
  await inspectorSelect.selectOption("parameters");
  const economicsPlayer = exemplar.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${economicsId}"]`
  );
  const economicsGraph = economicsPlayer.locator(
    "[data-kp-editor-graph-svg]"
  );
  await exemplar.locator(
    '[data-action="set-economics-demand-intercept"]'
  ).fill("20");
  await expect(exemplar).toHaveAttribute(
    "data-kp-economics-demand-intercept",
    "20"
  );
  await expect(exemplar.locator(
    "[data-kp-economics-demand-intercept-output]"
  )).toHaveText("20");
  await expect(economicsPlayer).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "0.56"
  );
  await economicsPlayer.press("End");
  await expect(economicsGraph.locator("[data-kp-economics-demand-line]"))
    .toHaveAttribute("data-kp-economics-equation", "P=20-Q");
  expect(new URL(page.url()).searchParams.get("demandIntercept")).toBe("20");

  const physicsId = "animation.physics.constant-force-work-energy";
  await exemplar.locator(
    `[data-kp-animation-catalogue-row="${physicsId}"] a`
  ).click();
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    physicsId
  );
  const physicsInspectorSelect = exemplar.getByRole("combobox", {
    name: "Inspector view"
  });
  await expect(physicsInspectorSelect).toHaveValue("parameters");
  const physicsPlayer = exemplar.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${physicsId}"]`
  );
  const physicsGraph = physicsPlayer.locator("[data-kp-editor-graph-svg]");
  await exemplar.locator('[data-action="set-physics-net-force"]').fill("5");
  await expect(exemplar).toHaveAttribute(
    "data-kp-physics-net-force-newtons",
    "5"
  );
  await expect(exemplar.locator("[data-kp-physics-net-force-output]"))
    .toHaveText("5 N");
  await expect(physicsGraph.locator("[data-kp-physics-constant-force-line]"))
    .toHaveAttribute("data-kp-physics-force-value", "5");
  expect(new URL(page.url()).searchParams.get("netForce")).toBe("5");

  await page.goBack();
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    economicsId
  );
  await expect(exemplar).toHaveAttribute(
    "data-kp-economics-demand-intercept",
    "20"
  );
  await expect(exemplar.locator(
    '[data-action="set-economics-demand-intercept"]'
  )).toHaveValue("20");
  expect(documentRequests).toHaveLength(1);
});

test("Svelte exposes the generated solve companion as inline explanation", async ({
  page
}) => {
  const documentRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") {
      documentRequests.push(request.url());
    }
  });
  const generatedId =
    "animation.generated.linear-solve.linear-68c15d41";
  await page.goto(`/?artifact=${generatedId}`);

  const exemplar = page.locator("[data-kp-svelte-catalogue-shell]");
  const generatedPlayer = exemplar.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${generatedId}"]`
  );
  await expect(generatedPlayer).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await generatedPlayer.evaluate((element) => {
    element.dataset["kpGeneratedCompanionPlayerIdentity"] = "stable";
  });
  const inspectorSelect = exemplar.getByRole("combobox", {
    name: "Inspector view"
  });
  await expect(inspectorSelect.locator('option[value="explanation"]'))
    .toHaveText("Explanation");
  await inspectorSelect.selectOption("explanation");
  const explanation = exemplar.locator("[data-kp-generated-explanation]");
  await expect(explanation).toBeVisible();
  await expect(explanation.locator("h3")).toHaveCount(4);
  await expect(explanation.locator("h2")).toHaveCount(0);
  expect(await explanation.locator(".katex").count()).toBeGreaterThan(0);
  await expect(explanation.locator(".katex-display")).toHaveCount(0);
  await expect(generatedPlayer).toHaveAttribute(
    "data-kp-generated-companion-player-identity",
    "stable"
  );

  await exemplar.locator(
    `[data-kp-animation-catalogue-row="${animationId}"] a`
  ).click();
  await expect(exemplar).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    animationId
  );
  const nextInspectorSelect = exemplar.getByRole("combobox", {
    name: "Inspector view"
  });
  await expect(nextInspectorSelect).toHaveValue("details");
  await expect(nextInspectorSelect.locator('option[value="explanation"]'))
    .toHaveCount(0);
  await expect(exemplar.locator("[data-kp-generated-explanation]"))
    .toHaveCount(0);
  await expect(exemplar.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  )).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  expect(documentRequests).toHaveLength(1);
});

test("Svelte loads rich surface capabilities only after their selection", async ({
  page
}) => {
  const requestedUrls: string[] = [];
  const documentRequests: string[] = [];
  page.on("request", (request) => {
    requestedUrls.push(request.url());
    if (request.resourceType() === "document") {
      documentRequests.push(request.url());
    }
  });
  await page.goto(`/?artifact=${animationId}`);

  const exemplar = page.locator("[data-kp-svelte-catalogue-shell]");
  await expect(exemplar.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  )).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  expect(requested(requestedUrls, "graph-svg-surface-capability")).toBe(true);
  expect(requested(requestedUrls, "graph-svg-viewport")).toBe(true);
  expect(requested(requestedUrls, "graph-3d-surface-capability")).toBe(false);
  expect(requested(requestedUrls, "graph-webgl-three")).toBe(false);
  expect(requested(requestedUrls, "programming-surface-capability")).toBe(false);
  expect(requested(
    requestedUrls,
    "verified-generated-linear-solve-reader"
  )).toBe(false);

  const graph3DId = "animation.graph.surface-mode.mesh-to-donut";
  await exemplar.locator(
    `[data-kp-animation-catalogue-row="${graph3DId}"] a`
  ).click();
  const graph3DShell = exemplar.locator(
    `[data-kp-editor-animation-id="${graph3DId}"] .graph-webgl`
  );
  await expect(graph3DShell).toHaveAttribute(
    "data-kp-editor-graph-3d-capability",
    /ready|fallback/
  );
  expect(requested(requestedUrls, "graph-3d-surface-capability")).toBe(true);
  expect(requested(requestedUrls, "graph-webgl-three")).toBe(true);
  expect(requested(requestedUrls, "programming-surface-capability")).toBe(false);
  expect(requested(
    requestedUrls,
    "verified-generated-linear-solve-reader"
  )).toBe(false);

  const programmingId = "animation.programming.add.execution-trace";
  await exemplar.locator(
    `[data-kp-animation-catalogue-row="${programmingId}"] a`
  ).click();
  await expect(exemplar.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${programmingId}"]`
  )).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  expect(requested(requestedUrls, "programming-surface-capability")).toBe(true);
  expect(requested(
    requestedUrls,
    "verified-generated-linear-solve-reader"
  )).toBe(false);

  const generatedId = "animation.generated.linear-solve.linear-68c15d41";
  await exemplar.locator(
    `[data-kp-animation-catalogue-row="${generatedId}"] a`
  ).click();
  await expect(exemplar.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${generatedId}"]`
  )).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  expect(requested(
    requestedUrls,
    "verified-generated-linear-solve-reader"
  )).toBe(true);
  expect(documentRequests).toHaveLength(1);
});

test("canonical Svelte shell renders the not-found terminal state in its reserved stage", async ({
  page
}) => {
  await page.goto("/?artifact=animation.unknown");

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
  await expect(exemplar).toHaveAttribute("aria-busy", "false");
});

test("canonical Svelte shell keeps loading truth visible and contains preparation errors", async ({
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

  // The intercepted pack intentionally keeps Firefox's document load pending;
  // commit is the correct boundary for observing the already-mounted loader.
  await page.goto(`/?artifact=${animationId}`, { waitUntil: "commit" });
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

test("canonical catalogue route mounts the approved Svelte host", async ({
  page
}) => {
  const requestedUrls: string[] = [];
  page.on("request", (request) => requestedUrls.push(request.url()));
  await page.goto(`/?artifact=${animationId}`);

  await expect(page.locator("[data-kp-svelte-catalogue-shell]")).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    animationId
  );
  expect(requestedUrls.some((url) =>
    url.includes("svelte-catalogue-exemplar-entry")
  )).toBe(true);
});

function assertRequestedEntry(requestedUrls: readonly string[]): void {
  expect(requestedUrls.some((url) =>
    url.includes("svelte-catalogue-exemplar-entry")
  )).toBe(true);
}

function requested(
  requestedUrls: readonly string[],
  moduleName: string
): boolean {
  return requestedUrls.some((url) => url.includes(moduleName));
}
