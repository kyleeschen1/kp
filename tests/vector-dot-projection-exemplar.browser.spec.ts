import { expect, test } from "@playwright/test";

const animationId = "animation.dot-projection.basic";

test("vector projection keeps KaTeX, geometry, labels, rewind, and reduced motion synchronized", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/?artifact=${animationId}`);

  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const graph = player.locator("[data-kp-editor-graph-svg]");
  const view = graph.locator("[data-kp-vector-dot-projection-view]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');

  await expect(graph).toHaveAttribute(
    "data-kp-graph-presentation-profile",
    "kp.graph.dimensional-continuity.linear-algebra.v1"
  );
  await expect(graph).toHaveAttribute(
    "data-kp-graph-language-profile",
    "kp.graph.dimensional-continuity.v1"
  );
  await expect(graph).toHaveAttribute(
    "aria-describedby",
    "kp-vector-dot-projection-description"
  );
  await expect(graph.locator("text")).toHaveCount(0);
  await expect(graph.locator(".katex")).toHaveCount(17);
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-accessibility-mode",
    "reduced-motion"
  );
  await expect(view).toHaveAttribute(
    "data-kp-vector-dot-projection-beat",
    "source-pose"
  );

  await scrubber.fill("0.188");
  await expect(view).toHaveAttribute(
    "data-kp-vector-dot-projection-beat",
    "component-pair-x"
  );
  await expect(graph.locator('[data-kp-vector-component-pair="x"]'))
    .toHaveAttribute("data-kp-vector-component-pair-status", "active");
  await expect(graph.locator('[data-kp-vector-component-pair="y"]'))
    .toHaveAttribute("data-kp-vector-component-pair-status", "pending");

  await scrubber.fill("0.688");
  await expect(view).toHaveAttribute(
    "data-kp-vector-dot-projection-beat",
    "projection-drop"
  );
  const forwardDrop = await graph.locator(
    "[data-kp-editor-graph-projection]"
  ).getAttribute("data-kp-editor-graph-drop-point");
  const forwardDropCoordinates = forwardDrop?.split(",").map(Number) ?? [];
  expect(forwardDropCoordinates[0]).toBeCloseTo(3.496, 6);
  expect(forwardDropCoordinates[1]).toBeCloseTo(2.504, 6);
  await expect(graph.locator("[data-kp-vector-current-relation]"))
    .toHaveAttribute(
      "data-kp-latex",
      "\\operatorname{proj}_{\\mathbf b}(\\mathbf a)=3\\mathbf b=(3,3)"
    );

  await scrubber.fill("1");
  await expect(graph.locator("[data-kp-vector-right-angle]")).toBeAttached();
  await expect(graph.locator("#kp-vector-dot-projection-description"))
    .toContainText("perpendicular residual (1, -1)");

  const labelGeometry = await graph.locator(
    '[data-kp-vector-math-label="source-vector"] > div, ' +
    '[data-kp-vector-math-label="target-vector"] > div, ' +
    '[data-kp-vector-math-label="projection-vector"] > div, ' +
    '[data-kp-vector-math-label="residual-vector"] > div'
  ).evaluateAll((labels) => labels.map((label) => {
    const rect = label.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom
    };
  }));
  const graphRect = await graph.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom
    };
  });
  expect(labelGeometry).toHaveLength(4);
  for (const label of labelGeometry) {
    expect(label.left).toBeGreaterThanOrEqual(graphRect.left - 1);
    expect(label.right).toBeLessThanOrEqual(graphRect.right + 1);
    expect(label.top).toBeGreaterThanOrEqual(graphRect.top - 1);
    expect(label.bottom).toBeLessThanOrEqual(graphRect.bottom + 1);
  }
  for (let left = 0; left < labelGeometry.length; left += 1) {
    for (let right = left + 1; right < labelGeometry.length; right += 1) {
      const a = labelGeometry[left]!;
      const b = labelGeometry[right]!;
      const overlaps = a.left < b.right && a.right > b.left &&
        a.top < b.bottom && a.bottom > b.top;
      expect(overlaps).toBe(false);
    }
  }

  await player.press("R");
  await scrubber.fill("0.312");
  await expect(graph.locator("[data-kp-editor-graph-projection]"))
    .toHaveAttribute("data-kp-editor-graph-drop-point", forwardDrop ?? "");

  // Rewind settlement is progress zero on the same mirrored semantic clock.
  await player.press("Home");
  await expect(graph.locator("[data-kp-vector-right-angle]")).toBeAttached();
});
