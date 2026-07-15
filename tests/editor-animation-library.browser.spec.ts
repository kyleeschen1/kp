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
});
