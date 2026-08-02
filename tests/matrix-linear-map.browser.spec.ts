import { expect, test } from "@playwright/test";

const animationId =
  "animation.generated.linear-algebra.matrix-vector.two-by-two";

test("rank-6 matrix-vector exemplar preserves exact row-dot playback", async ({
  page
}) => {
  const documentRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") {
      documentRequests.push(request.url());
    }
  });

  await page.goto(`/?artifact=${animationId}`);
  const catalogue = page.locator("[data-kp-animation-catalogue]");
  const player = catalogue.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const transition = player.locator(
    "[data-kp-editor-equation-transition-id]"
  );
  const scrubber = player.locator('[data-action="seek-editor-animation"]');

  await expect(catalogue).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    animationId
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await expect(player.locator(
    '[data-kp-editor-animation-surface-slot="equation"]'
  )).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.equation.katex"
  );
  await expect(player.locator("[data-kp-editor-animation-stage]"))
    .toHaveAttribute("data-kp-editor-animation-surface", "composite");
  await expect(player.locator(
    '[data-kp-editor-animation-surface-slot="graph"]'
  )).toHaveCount(1);

  await scrubber.fill("0.18");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-matrix-vector-active-row",
    "0"
  );
  await expect(transition.locator(
    '[data-kp-editor-matrix-vector-row="0"]'
  )).toContainText("2×4+1×5=13");

  await scrubber.fill("0.52");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-matrix-vector-resolved-through",
    "0"
  );

  await scrubber.fill("1");
  await expect(player.locator(
    "[data-kp-editor-equation-target] [data-kp-editor-equation-object-id]"
  )).toHaveAttribute(
    "data-kp-editor-equation-object-id",
    "expression.generated.linear-algebra.matrix-vector.two-by-two.result"
  );
  await expect(player.locator("[data-kp-editor-equation-target]"))
    .toContainText("1315");
  expect(documentRequests).toHaveLength(1);
});
