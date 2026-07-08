import { expect, test } from "@playwright/test";

test("project dashboard round trip keeps editor motion and graph controls usable", async ({
  page
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Identity Matrix" })).toBeVisible();
  await page.getByRole("button", { name: "Project Dashboard" }).click();

  await expect(
    page.getByRole("heading", { name: "Project Dashboard", exact: true })
  ).toBeVisible();
  await expect(page.locator("[data-kp-project-card=\"work-project-dashboard-v1\"]")).toBeVisible();
  await expect(page.locator("[data-kp-project-dashboard-contract]")).toContainText(
    "src/project-dashboard/data.ts"
  );
  await expect(page.getByRole("button", { name: "Back to Editor" })).toBeVisible();

  await page.getByRole("button", { name: "Back to Editor" }).click();

  await expect(page.getByRole("heading", { name: "Identity Matrix" })).toBeVisible();
  await expect(page.locator("[data-kp-project-dashboard]")).toHaveCount(0);

  const demo = page.locator("[data-kp-equation-motion-demo]");
  const beatScrubber = demo.locator('[data-action="set-equation-motion-beat"]');
  const beatOutput = demo.locator('[data-role="equation-motion-beat-output"]');

  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "0");
  await expect(beatScrubber).toHaveAttribute("max", "20");
  await beatScrubber.evaluate((input) => {
    const range = input as HTMLInputElement;

    range.value = "8";
    range.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(demo).toHaveAttribute("data-kp-equation-motion-progress", "0.4");
  await expect(beatOutput).toHaveText("8/20");

  const graphShell = page.locator(".graph-webgl[data-kp-object=\"saddle-orbit-graph\"]");
  await expect(graphShell).toHaveAttribute("data-kp-webgl-status", /^(ready|fallback)$/);

  const surfaceMode = page.locator('[data-action="set-graph-surface-mode"]');
  await expect(surfaceMode).toBeVisible();
  await surfaceMode.selectOption("donut");
  await expect(surfaceMode).toHaveValue("donut");
  await expect(surfaceMode).toHaveAttribute("data-kp-graph-surface-mode", "donut");
  await expect(
    surfaceMode.locator("xpath=ancestor::label[1]").locator(".graph-control__value")
  ).toHaveText("donut");

  const semanticJson = page.locator('[data-role="semantic-json"]');
  await expect(semanticJson).toContainText('"surfaceMode": "donut"');
});
