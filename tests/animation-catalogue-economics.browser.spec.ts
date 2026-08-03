import { expect, test } from "@playwright/test";

const animationId =
  "animation.economics.supply-demand-equilibrium-shift";
const solveXId = "animation.linear-solve.solve-x";

test("economics catalogue preserves exact accessible seek, rewind, parameters, Review, and history", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`/?artifact=${animationId}`);

  const shell = page.locator("[data-kp-animation-catalogue]");
  const player = shell.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const graphSlot = player.locator(
    '[data-kp-editor-animation-surface-slot="graph"]'
  );
  const graph = graphSlot.locator("[data-kp-editor-graph-svg]");
  const scrubber = player.locator(
    '[data-action="seek-editor-animation"]'
  );

  await expect(shell).toHaveAttribute("data-kp-svelte-catalogue-shell", "");
  await expect(shell.locator("iframe")).toHaveCount(0);
  await expect(shell).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    animationId
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-pack-id",
    "economics"
  );
  await expect(graphSlot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.graph.svg"
  );
  await expect(graphSlot).toHaveAttribute(
    "data-kp-editor-animation-adapter-status",
    "ready"
  );
  await expect(graph).toHaveAttribute(
    "aria-describedby",
    "kp-economics-graph-description"
  );
  await expect(graph).toHaveAttribute(
    "data-kp-graph-presentation-profile",
    "kp.graph.dimensional-continuity.economics.v1"
  );
  await expect(graph).toHaveAttribute(
    "data-kp-graph-language-profile",
    "kp.graph.dimensional-continuity.v1"
  );
  await expect(graph.locator("[data-kp-economics-math-label]"))
    .toHaveCount(14);
  await expect.poll(() => player.evaluate((element) => {
    const graphStage = element.querySelector<HTMLElement>(
      ".editor-graph-stage"
    );
    const graphLabel = element.querySelector<HTMLElement>(
      '[data-kp-economics-math-label="equilibrium-current"] ' +
      ".editor-graph-stage__economics-math-label"
    );
    const equationStrip = element.querySelector<HTMLElement>(
      ".editor-graph-stage__economics-explanation"
    );
    return [graphStage, graphLabel, equationStrip].map((node) =>
      node === null ? null : getComputedStyle(node).backgroundColor
    );
  })).toEqual([
    "rgb(255, 253, 248)",
    "rgb(255, 253, 248)",
    "rgb(255, 253, 248)"
  ]);
  await expect(graph.locator('[data-kp-latex="D_0"]')).toBeVisible();
  await expect(graph.locator('[data-kp-latex="E_0 = (6.00, 8.00)"]'))
    .toBeVisible();
  await expect(graph.locator("[data-kp-economics-equilibrium-view]"))
    .toHaveAttribute("data-kp-economics-display-precision", "2");
  await expect(graph.locator("[data-kp-economics-equilibrium-point]"))
    .toHaveAttribute("r", "4.5");
  await expect(graph.locator("text")).toHaveCount(0);
  await expect(graph.locator("#kp-economics-graph-description"))
    .toContainText("current equilibrium is quantity 6 and price 8");
  const startingDemandWidth = await graph.locator(
    '[data-kp-economics-equation-role="demand"]'
  ).evaluate((element) => element.getBoundingClientRect().width);
  const startingEquilibriumWidth = await graph.locator(
    '[data-kp-economics-math-label="equilibrium-current"] ' +
    ".editor-graph-stage__economics-math-label"
  ).evaluate((element) => element.getBoundingClientRect().width);

  await page.evaluate(() => {
    (window as typeof window & { __kpCatalogueDocumentToken?: string })
      .__kpCatalogueDocumentToken = "economics-persistent-shell";
  });

  await scrubber.fill("0.44");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "0.44"
  );
  await expect(graph.locator("[data-kp-economics-equilibrium-view]"))
    .toHaveAttribute("data-kp-economics-choreography-stage", "shift");
  await expect(graph.locator("[data-kp-economics-demand-line]"))
    .toHaveAttribute("data-kp-economics-equation", "P=16-Q");
  await expect(graph.locator("[data-kp-economics-equilibrium-point]"))
    .toHaveAttribute("data-kp-economics-equilibrium-quantity", "7");
  await expect(graph.locator("[data-kp-economics-equilibrium-point]"))
    .toHaveAttribute("data-kp-economics-equilibrium-price", "9");
  await expect(graph.locator('[data-kp-economics-equation-role="demand"]'))
    .toHaveAttribute("data-kp-latex", "P \\approx 16.00 - Q");
  await expect(graph.locator('[data-kp-latex="D_t"]')).toBeVisible();
  await expect(graph.locator(
    '[data-kp-economics-math-label="equilibrium-current"] [data-kp-latex]'
  ))
    .toHaveAttribute("data-kp-latex", "E_t \\approx (7.00, 9.00)");
  expect(await graph.locator(
    '[data-kp-economics-equation-role="demand"]'
  ).evaluate((element) => element.getBoundingClientRect().width))
    .toBeCloseTo(startingDemandWidth, 1);
  expect(await graph.locator(
    '[data-kp-economics-math-label="equilibrium-current"] ' +
    ".editor-graph-stage__economics-math-label"
  ).evaluate((element) => element.getBoundingClientRect().width))
    .toBeCloseTo(startingEquilibriumWidth, 1);

  await player.press("End");
  await expect(graph.locator("[data-kp-economics-equilibrium-view]"))
    .toHaveAttribute("data-kp-economics-choreography-stage", "settle");
  await player.press("R");
  await scrubber.fill("0.56");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-direction",
    "rewind"
  );
  await expect(graph.locator("[data-kp-economics-demand-line]"))
    .toHaveAttribute("data-kp-economics-equation", "P=16-Q");
  await expect(graph.locator("[data-kp-economics-equilibrium-point]"))
    .toHaveAttribute("data-kp-economics-equilibrium-quantity", "7");
  await expect(graph.locator("[data-kp-economics-equilibrium-point]"))
    .toHaveAttribute("data-kp-economics-equilibrium-price", "9");

  await shell.locator(
    '[data-action="select-animation-catalogue-inspector"]'
  ).selectOption("parameters");
  const parameter = shell.locator(
    '[data-action="set-economics-demand-intercept"]'
  );
  await parameter.fill("20");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "0.56"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-direction",
    "rewind"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-status",
    "paused"
  );
  await expect(graph.locator("[data-kp-economics-demand-line]"))
    .toHaveAttribute("data-kp-economics-equation", "P=17-Q");
  await expect(graph.locator("[data-kp-economics-equilibrium-point]"))
    .toHaveAttribute("data-kp-economics-equilibrium-quantity", "15/2");
  await expect(graph.locator("[data-kp-economics-equilibrium-point]"))
    .toHaveAttribute("data-kp-economics-equilibrium-price", "19/2");
  await expect(graph.locator('[data-kp-economics-equation-role="demand"]'))
    .toHaveAttribute("data-kp-latex", "P \\approx 17.00 - Q");
  await expect(graph.locator(
    '[data-kp-economics-math-label="equilibrium-current"] [data-kp-latex]'
  )).toHaveAttribute("data-kp-latex", "E_t \\approx (7.50, 9.50)");
  await expect(graph.locator("#kp-economics-graph-description"))
    .toContainText("demand intercept rises toward 20");
  expect(new URL(page.url()).searchParams.get("demandIntercept")).toBe("20");

  const capture = await page.evaluate(async (providerPath) => {
    const module = await import(providerPath);
    return module.createKpAnimationCatalogueCaptureProvider(document).capture({
      route: new URL(window.location.href),
      capturedAtMs: performance.now(),
      eventTarget: document.body
    });
  }, "/src/dev-review/animation-catalogue-capture-provider.ts");
  expect(capture.semantic).toMatchObject({
    documentId: "animation.catalogue",
    assetId: animationId,
    progressPermille: 560,
    playbackDirection: "rewind",
    parameters: {
      "demand-price-intercept": "20"
    }
  });

  await shell.locator(
    `[data-kp-animation-catalogue-row="${solveXId}"] ` +
    ".kp-animation-catalogue-shell__result-link"
  ).click();
  await expect(shell).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    solveXId
  );
  expect(await page.evaluate(() =>
    (window as typeof window & { __kpCatalogueDocumentToken?: string })
      .__kpCatalogueDocumentToken
  )).toBe("economics-persistent-shell");

  await page.goBack();
  await expect(shell).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    animationId
  );
  await expect(shell).toHaveAttribute(
    "data-kp-economics-demand-intercept",
    "20"
  );
  await expect(shell.locator(
    '[data-action="set-economics-demand-intercept"]'
  )).toHaveValue("20");
  expect(await page.evaluate(() =>
    (window as typeof window & { __kpCatalogueDocumentToken?: string })
      .__kpCatalogueDocumentToken
  )).toBe("economics-persistent-shell");
  expect(pageErrors).toEqual([]);
});
