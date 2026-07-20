import { expect, test, type Page, type Route } from "@playwright/test";

import canonicalArtifactSource from "../content/generated/artifacts/mathematics.linear-equations.solve-with-balance--1.0.0.ts";
import { createExactRationalLinearProblemProvider } from "../providers/linear-problems/public-api.ts";
import { formatConceptRoomRoute } from "../src/kernel/public-api.ts";

const artifact = canonicalArtifactSource;

test("canonical and snapshot URLs mount, switch synchronized views, review, and dispose", async ({ page }) => {
  await serveProvider(page);
  await page.goto(formatConceptRoomRoute({
    schemaVersion: "kp.room-route.v1",
    conceptId: artifact.manifest.conceptId,
    conceptVersion: artifact.manifest.version,
    checkpoint: "start",
    timePermille: 0,
    mode: "touch",
    projection: "symbolic",
    parameters: {},
    focus: ["equation.initial", "term.two-x"],
    provider: {
      id: "linear-problems.exact-rational",
      protocol: "linear-problem.v1",
      version: "1.0.0",
      provenance: "smoke.provider"
    },
    snapshot: { id: "snapshot.smoke", integrity: artifact.integrity }
  }));

  const shell = page.locator("[data-kp-concept-room-shell]");
  const viewport = page.locator("[data-kp-concept-viewport]");
  await expect(shell).toHaveAttribute("data-kp-concept-checkpoint", "start");
  await expect(viewport.locator("[data-kp-symbolic-equation] .katex")).toHaveCount(5);
  await expect(page).toHaveURL(/snapshot=snapshot.smoke/);
  await expect(page.locator("canvas")).toHaveCount(0);

  await page.getByRole("link", { name: "Balance", exact: true }).click();
  await expect(shell).toHaveAttribute("data-kp-concept-projection", "balance");
  await expect(viewport.locator("[data-kp-balance-scene]")).toHaveAttribute(
    "data-kp-frame-id", "frame.initial"
  );
  await page.getByRole("link", { name: "Reveal one x", exact: true }).click();
  await expect(viewport.locator("[data-kp-balance-scene]")).toHaveAttribute(
    "data-kp-frame-id", "frame.step.2"
  );
  await expect(page).toHaveURL(/checkpoint=divide-two/);

  await page.getByRole("link", { name: "Equation", exact: true }).click();
  await expect(viewport.locator("[data-kp-symbolic-equation]")).toHaveAttribute(
    "data-kp-frame-id", "frame.step.2"
  );
  await page.getByRole("link", { name: "Together", exact: true }).click();
  await expect(shell).toHaveAttribute("data-kp-concept-projection", "coordinated");
  await expect(viewport.locator('[data-kp-coordinated-projection="symbolic"] [data-kp-symbolic-equation]'))
    .toHaveAttribute("data-kp-progress-permille", "750");
  await expect(viewport.locator('[data-kp-coordinated-projection="balance"] [data-kp-balance-scene]'))
    .toHaveAttribute("data-kp-progress-permille", "750");
  await page.getByRole("link", { name: "Review", exact: true }).click();
  await expect(viewport.locator("[data-kp-concept-review-fallback]")).toContainText(
    "Two copies of x become one"
  );
  await expect(viewport.locator("[data-kp-diagnostic-code]")).toHaveCount(0);
  await page.getByRole("link", { name: "Touch", exact: true }).click();
  await expect(viewport.locator('[data-kp-coordinated-projection="symbolic"] [data-kp-symbolic-equation]'))
    .toHaveAttribute(
    "data-kp-frame-id", "frame.step.2"
  );

  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect(shell).toHaveCount(0);
});

test("provider, Ask, artifact, capability, and renderer failures preserve Review content", async ({ page }) => {
  await page.route("**/api/v1/linear-problems", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        schemaVersion: "linear-problem.error.v1",
        code: "provider-unavailable",
        message: "Provider unavailable in smoke fixture.",
        path: ["$"],
        retryable: true
      })
    });
  });
  await page.goto(formatConceptRoomRoute({
    schemaVersion: "kp.room-route.v1",
    conceptId: artifact.manifest.conceptId,
    conceptVersion: artifact.manifest.version,
    checkpoint: "divide-two",
    timePermille: 575,
    mode: "touch",
    projection: "coordinated",
    parameters: {},
    focus: ["operation.divide-two"],
    provider: {
      id: "linear-problems.exact-rational",
      protocol: "linear-problem.v1",
      version: "1.0.0",
      provenance: "smoke.failure-provider"
    }
  }));
  const viewport = page.locator("[data-kp-concept-viewport]");
  await expect(viewport.locator("[data-kp-concept-review-fallback]")).toHaveAttribute(
    "data-kp-diagnostic-code", "provider-unavailable"
  );
  await expect(viewport).toContainText("Subtract 3 from both sides");
  await expect(page).toHaveURL(/checkpoint=divide-two/);
  await expect(page).toHaveURL(/t=575/);
  expect(await page.evaluate(() => (
    window as unknown as { find(text: string): boolean }
  ).find("Two copies of x become one"))).toBe(true);
  const touchHref = await page.getByRole("link", { name: "Touch", exact: true }).getAttribute("href");
  if (touchHref === null) throw new Error("Expected a canonical Touch URL.");
  const askUrl = new URL(touchHref, page.url());
  askUrl.searchParams.set("mode", "ask");
  await page.goto(askUrl.toString());
  await expect(viewport.locator("[data-kp-concept-review-fallback]")).toHaveAttribute(
    "data-kp-diagnostic-code", "ask-unavailable"
  );
  await page.getByRole("link", { name: "Touch", exact: true }).click();

  await mountInvalidArtifactFallback(page);
  await expect(page.locator("#invalid-artifact-fixture [data-kp-concept-review-fallback]")).toHaveAttribute(
    "data-kp-diagnostic-code", "artifact-invalid"
  );
  await expect(page.locator("#invalid-artifact-fixture")).toContainText("Preserve equality");
  await expect(page).toHaveURL(/checkpoint=divide-two/);

  await mountCapabilityFallback(page, artifact);
  await expect(page.locator("#capability-fixture [data-kp-concept-review-fallback]")).toHaveAttribute(
    "data-kp-diagnostic-code", "capability-unavailable"
  );

  await page.unroute("**/api/v1/linear-problems");
  await serveProvider(page);
  await mountRendererFallback(page, artifact);
  await expect(page.locator("#renderer-fixture [data-kp-concept-review-fallback]")).toHaveAttribute(
    "data-kp-diagnostic-code", "renderer-unavailable"
  );
  await expect(page.locator("#renderer-fixture")).toContainText("x = 5/2");
  expect(await page.locator("#renderer-fixture").evaluate((root) => root.textContent?.includes("Subtract 3 from both sides")))
    .toBe(true);
});

async function serveProvider(page: Page): Promise<void> {
  const provider = createExactRationalLinearProblemProvider();
  await page.route("**/api/v1/linear-problems", async (route) => {
    const request = route.request().postDataJSON() as { schemaVersion?: string };
    const response = request.schemaVersion === "linear-problem.generate.request.v1"
      ? provider.generate(request)
      : request.schemaVersion === "linear-problem.verify-step.request.v1"
        ? provider.verifyStep(request)
        : provider.verifySolution(request);
    await fulfillJson(route, response);
  });
}

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
}

async function mountInvalidArtifactFallback(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // @ts-expect-error The browser's Vite server resolves this absolute module path.
    const shell = await import("/src/app-adapters/concept-room-shell.ts");
    const root = document.createElement("div");
    root.id = "invalid-artifact-fixture";
    document.body.append(root);
    const navigation = {
      current: () => ({ pathname: location.pathname, search: location.search }),
      push: () => undefined,
      replace: () => undefined,
      subscribe: () => () => undefined
    };
    await shell.tryMountConceptRoomRoute({
      root,
      catalog: [{
        conceptId: "mathematics.linear-equations.solve-with-balance",
        version: "1.0.0",
        canonicalPath: location.pathname,
        legacyAliases: [],
        title: "Solve 2x + 3 = 8",
        summary: "Preserve equality as you subtract three and divide by two.",
        searchableText: "solve 2x + 3 = 8",
        checkpointIds: ["start"],
        load: async () => ({})
      }],
      navigation
    });
  });
}

async function mountCapabilityFallback(page: Page, inputArtifact: typeof artifact): Promise<void> {
  await page.evaluate(async (published) => {
    // @ts-expect-error The browser's Vite server resolves this absolute module path.
    const shell = await import("/src/app-adapters/concept-room-shell.ts");
    const root = document.createElement("div");
    root.id = "capability-fixture";
    document.body.append(root);
    const entry = {
      conceptId: published.manifest.conceptId,
      version: published.manifest.version,
      canonicalPath: location.pathname,
      legacyAliases: [],
      title: published.manifest.review.title,
      summary: published.manifest.review.summary,
      searchableText: published.manifest.review.searchableText,
      checkpointIds: published.manifest.checkpoints.map((checkpoint) => checkpoint.id),
      load: async () => published
    };
    const navigation = {
      current: () => ({ pathname: location.pathname, search: location.search }),
      push: () => undefined,
      replace: () => undefined,
      subscribe: () => () => undefined
    };
    await shell.tryMountConceptRoomRoute({
      root,
      catalog: [entry],
      navigation,
      validateArtifact: async () => {
        throw { report: { issues: [{ code: "capability-unavailable" }] } };
      }
    });
  }, inputArtifact);
}

async function mountRendererFallback(page: Page, inputArtifact: typeof artifact): Promise<void> {
  await page.evaluate(async (published) => {
    // @ts-expect-error The browser's Vite server resolves these absolute module paths.
    const shell = await import("/src/app-adapters/concept-room-shell.ts");
    // @ts-expect-error The browser's Vite server resolves these absolute module paths.
    const runtimeModule = await import("/src/app-adapters/linear-equation-concept-runtime.ts");
    const root = document.createElement("div");
    root.id = "renderer-fixture";
    document.body.append(root);
    const entry = {
      conceptId: published.manifest.conceptId,
      version: published.manifest.version,
      canonicalPath: location.pathname,
      legacyAliases: [],
      title: published.manifest.review.title,
      summary: published.manifest.review.summary,
      searchableText: published.manifest.review.searchableText,
      checkpointIds: published.manifest.checkpoints.map((checkpoint) => checkpoint.id),
      load: async () => published
    };
    const navigation = {
      current: () => ({ pathname: location.pathname, search: location.search }),
      push: () => undefined,
      replace: () => undefined,
      subscribe: () => () => undefined
    };
    await shell.tryMountConceptRoomRoute({
      root,
      catalog: [entry],
      navigation,
      runtime: runtimeModule.createLinearEquationConceptRuntime({
        loadSymbolicRenderer: async () => { throw new Error("renderer missing"); }
      })
    });
  }, inputArtifact);
}
