import { expect, test } from "@playwright/test";

const route = (progress: number) =>
  "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1" +
  `&kpProgress=${progress}`;

test("reader native endpoints close ownership and geometry without a visual seam", async ({ page }) => {
  for (const endpoint of [
    { progress: 0, kind: "source", text: "x+3=7" },
    { progress: 1_000, kind: "target", text: "x=4" }
  ]) {
    await page.goto(route(endpoint.progress));
    await expect(page.locator("body")).toHaveAttribute(
      "data-kp-reader-progress",
      String(endpoint.progress)
    );
    const stage = page.locator("[data-kp-reader-equation-stage]");
    await expect(stage).toHaveAttribute("data-kp-reader-native-endpoint", endpoint.kind);
    await expect(stage).toHaveAttribute("data-kp-reader-native-endpoint-passed", "true");
    await expect(stage).toHaveAttribute("data-kp-reader-native-endpoint-failures", "");
    expect(Number(await stage.getAttribute(
      "data-kp-reader-native-endpoint-max-residual"
    ))).toBeLessThanOrEqual(0.5);
    await expect(page.locator(
      `[data-kp-reader-transition-active="true"] ` +
      `[data-kp-reader-native="${endpoint.kind}"]`
    )).toHaveText(endpoint.text);
    const materialAuthority = await page.locator(
      "[data-kp-reader-equation-material-owner-id]"
    ).evaluateAll((elements) => elements.map((element) =>
      Number(getComputedStyle(element).opacity)
    ));
    expect(materialAuthority.every((opacity) => opacity === 0)).toBe(true);
  }
});

test("solve-x keeps native and moving owner opacity atomic between endpoints", async ({ page }) => {
  for (const progress of [1, 10, 20, 323, 343, 657, 677, 990, 999]) {
    await page.goto(route(progress));
    const stage = page.locator("[data-kp-reader-equation-stage]");
    await expect(stage).toHaveAttribute("data-kp-reader-equation-handoff-recipe", "atomic-v1");
    const opacities = await page.locator(
      '[data-kp-reader-transition-active="true"] [data-kp-reader-equation-anchor-id], ' +
      "[data-kp-reader-equation-material-owner-id]"
    ).evaluateAll((elements) => elements.map((element) =>
      Number(getComputedStyle(element).opacity)
    ));
    expect(opacities.length).toBeGreaterThan(0);
    expect(opacities.every((opacity) => opacity === 0 || opacity === 1)).toBe(true);
  }
});
