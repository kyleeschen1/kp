import { expect, test } from "@playwright/test";

const GRAPH_DESCRIPTOR_ID =
  "editor-animation.animation.graph.surface-mode.mesh-to-donut";

test("editor animation library restores and persists concrete selections", async ({
  page
}) => {
  await page.goto(`/?animation=${GRAPH_DESCRIPTOR_ID}`);

  const library = page.locator("[data-kp-editor-animation-library]");
  const select = library.locator('[data-action="set-editor-animation"]');

  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-descriptor-id",
    GRAPH_DESCRIPTOR_ID
  );
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-surface",
    "graph"
  );

  const equationDescriptorId =
    "editor-animation.animation.linear-solve.solve-x";
  await select.selectOption(equationDescriptorId);

  await expect(page).toHaveURL(
    new RegExp(`animation=${equationDescriptorId.replaceAll(".", "\\.")}`)
  );
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-descriptor-id",
    equationDescriptorId
  );
  const diagnostics = library.locator(
    "[data-kp-editor-animation-diagnostics]"
  );
  await expect(diagnostics).toHaveAttribute(
    "data-kp-editor-animation-diagnostics-status",
    "passed"
  );
  await diagnostics.locator("summary").click();
  await expect(diagnostics).toContainText("Render targets bound");
  await expect(diagnostics).toContainText("1/1");
  await expect(
    diagnostics.locator(
      "[data-kp-editor-animation-diagnostics-playback-laws]"
    )
  ).toHaveText("2/2");
  await page.evaluate(() => {
    const demo = document.querySelector<HTMLElement>(
      "[data-kp-equation-motion-demo]"
    );
    if (demo === null) throw new Error("Expected equation motion demo.");
    window.__kpEquationMotionSetProgress?.(demo, 0.5);
  });
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-live-visual-frame-id",
    "visual.live-equation-card.frame"
  );
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-live-visual-unbound-selector-count",
    "0"
  );
  await expect(
    diagnostics.locator("[data-kp-editor-animation-diagnostics-selectors]")
  ).toHaveText("10/10");
});

test("dashboard animation assets open their concrete editor selection", async ({
  page
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Project Dashboard" }).click();
  await page
    .locator('[data-kp-select-agenda-row="animation-linear-solve-solve-x"]')
    .click();
  await page
    .locator(
      '[data-kp-preview-link="editor-animation"]' +
      '[data-kp-preview-animation-asset="animation.linear-solve.solve-x"]'
    )
    .click();

  await expect(page.locator("[data-kp-project-dashboard]")).toHaveCount(0);
  await expect(
    page.locator("[data-kp-editor-animation-library]")
  ).toHaveAttribute(
    "data-kp-editor-animation-descriptor-id",
    "editor-animation.animation.linear-solve.solve-x"
  );
  await expect(page).toHaveURL(
    /animation=editor-animation\.animation\.linear-solve\.solve-x/
  );
});

test("fraction family descriptor opens as a concrete editor animation", async ({
  page
}) => {
  const descriptorId =
    "editor-animation.sample.animation.fraction-simplification.basic";
  await page.goto(`/?animation=${descriptorId}`);

  const library = page.locator("[data-kp-editor-animation-library]");
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-descriptor-id",
    descriptorId
  );
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-id",
    "animation.generated.fraction-expression.two-fourths"
  );
  await expect(library).toContainText(
    "family.algebra.fraction-simplification"
  );
});
