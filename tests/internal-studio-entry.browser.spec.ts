import { expect, test } from "@playwright/test";

test("dedicated Studio shell mounts the legacy editor without the root bootstrap", async ({
  page
}) => {
  await page.goto("/studio/?view=editor");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-kp-internal-studio-entry",
    "mounted"
  );
  await expect(page.getByRole("heading", { name: "Identity Matrix" }))
    .toBeVisible();
});

test("dedicated Studio shell mounts the canonical Svelte catalogue", async ({
  page
}) => {
  await page.goto("/studio/?artifact=animation.dot-projection.basic");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-kp-svelte-catalogue-exemplar",
    "mounted"
  );
  await expect(page.locator("[data-kp-svelte-catalogue-shell]"))
    .toHaveAttribute(
      "data-kp-animation-catalogue-selection",
      "animation.dot-projection.basic"
    );
});
