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
    "warning"
  );
  await diagnostics.locator("summary").click();
  await expect(diagnostics).toContainText("Render targets bound");
  await expect(
    diagnostics.locator(
      '[data-kp-editor-animation-diagnostic-code="visual-frame.render-target-unbound"]'
    )
  ).toBeVisible();
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
