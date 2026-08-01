import { expect, test } from "@playwright/test";

const animationId = "animation.physics.constant-force-work-energy";
const solveXId = "animation.linear-solve.solve-x";

test("physics catalogue preserves exact accessible seek, rewind, parameters, Review, and history", async ({
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
  const scrubber = player.locator('[data-action="seek-editor-animation"]');

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
    "physics"
  );
  await expect(graphSlot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.graph.svg"
  );
  await expect(graph).toHaveAttribute(
    "aria-describedby",
    "kp-physics-work-energy-description"
  );
  await expect(graph).toHaveAttribute(
    "data-kp-graph-presentation-profile",
    "kp.graph.dimensional-continuity.physics.v1"
  );
  await expect(graph.locator("[data-kp-physics-math-label]"))
    .toHaveCount(17);
  await expect(graph.locator("text")).toHaveCount(0);
  await expect(graph.locator("#kp-physics-work-energy-description"))
    .toContainText("The net force is 3 newtons");
  await expect(graph.locator("[data-kp-physics-work-area]"))
    .toHaveAttribute("data-kp-physics-work-area", "0");
  await expect(graph.locator("[data-kp-physics-energy-total]"))
    .toHaveAttribute("data-kp-physics-energy-total", "4");

  const startingWorkWidth = await graph.locator(
    '[data-kp-physics-equation-role="work"]'
  ).evaluate((element) => element.getBoundingClientRect().width);
  const startingEnergyWidth = await graph.locator(
    '[data-kp-physics-equation-role="energy"]'
  ).evaluate((element) => element.getBoundingClientRect().width);

  await page.evaluate(() => {
    (window as typeof window & { __kpCatalogueDocumentToken?: string })
      .__kpCatalogueDocumentToken = "physics-persistent-shell";
  });

  await scrubber.fill("0.46");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "0.46"
  );
  await expect(graph.locator("[data-kp-physics-work-energy-view]"))
    .toHaveAttribute("data-kp-physics-choreography-stage", "accumulate");
  await expect(graph.locator("[data-kp-physics-object-position]"))
    .toHaveAttribute("data-kp-physics-object-position", "2");
  await expect(graph.locator("[data-kp-physics-work-area]"))
    .toHaveAttribute("data-kp-physics-work-area", "6");
  await expect(graph.locator("[data-kp-physics-energy-total]"))
    .toHaveAttribute("data-kp-physics-energy-total", "10");
  await expect(graph.locator('[data-kp-physics-equation-role="work"]'))
    .toHaveAttribute(
      "data-kp-latex",
      "W_{\\mathrm{net}} = F_x\\Delta x \\approx 6.00\\,\\mathrm{J}"
    );
  await expect(graph.locator('[data-kp-physics-equation-role="energy"]'))
    .toHaveAttribute(
      "data-kp-latex",
      "K = K_0 + W_{\\mathrm{net}} \\approx 10.00\\,\\mathrm{J}"
    );
  expect(await graph.locator(
    '[data-kp-physics-equation-role="work"]'
  ).evaluate((element) => element.getBoundingClientRect().width))
    .toBeCloseTo(startingWorkWidth, 1);
  expect(await graph.locator(
    '[data-kp-physics-equation-role="energy"]'
  ).evaluate((element) => element.getBoundingClientRect().width))
    .toBeCloseTo(startingEnergyWidth, 1);

  await player.press("End");
  await expect(graph.locator("[data-kp-physics-work-energy-view]"))
    .toHaveAttribute("data-kp-physics-choreography-stage", "settle");
  await player.press("R");
  await scrubber.fill("0.54");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-direction",
    "rewind"
  );
  await expect(graph.locator("[data-kp-physics-object-position]"))
    .toHaveAttribute("data-kp-physics-object-position", "2");
  await expect(graph.locator("[data-kp-physics-work-area]"))
    .toHaveAttribute("data-kp-physics-work-area", "6");
  await expect(graph.locator("[data-kp-physics-energy-total]"))
    .toHaveAttribute("data-kp-physics-energy-total", "10");

  await shell.locator(
    '[data-action="select-animation-catalogue-inspector"]'
  ).selectOption("parameters");
  const parameter = shell.locator('[data-action="set-physics-net-force"]');
  await parameter.fill("5");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "0.54"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-direction",
    "rewind"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-status",
    "paused"
  );
  await expect(graph.locator("[data-kp-physics-constant-force-line]"))
    .toHaveAttribute("data-kp-physics-force-value", "5");
  await expect(graph.locator("[data-kp-physics-work-area]"))
    .toHaveAttribute("data-kp-physics-work-area", "10");
  await expect(graph.locator("[data-kp-physics-energy-total]"))
    .toHaveAttribute("data-kp-physics-energy-total", "14");
  await expect(graph.locator("#kp-physics-work-energy-description"))
    .toContainText("The net force is 5 newtons");
  expect(new URL(page.url()).searchParams.get("netForce")).toBe("5");

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
    progressPermille: 540,
    playbackDirection: "rewind",
    parameters: {
      "net-force-newtons": "5"
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
  )).toBe("physics-persistent-shell");

  await page.goBack();
  await expect(shell).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    animationId
  );
  await expect(shell).toHaveAttribute(
    "data-kp-physics-net-force-newtons",
    "5"
  );
  await expect(shell.locator('[data-action="set-physics-net-force"]'))
    .toHaveValue("5");
  expect(await page.evaluate(() =>
    (window as typeof window & { __kpCatalogueDocumentToken?: string })
      .__kpCatalogueDocumentToken
  )).toBe("physics-persistent-shell");
  expect(pageErrors).toEqual([]);
});
