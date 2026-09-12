import { installBuiltFocusRoute } from "./support/built-focus-route.ts";
import { expect, test } from "@playwright/test";
import { checkGradientExplanation, gradientContourVariant } from "../src/tutorial/gradient-contour/gradient-contour-authoring.ts";
import { gradientComparisonBounds } from "../src/tutorial/gradient-contour/gradient-contour-story.ts";

test("built gradient entry executes source Apply, WebGL and independent return without dev modules", async ({ page, context, baseURL }) => {
  const errors: string[] = [], requests: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const routePath = "/experiments/kinetic-figure/gradient-contour/";
  const output = new URL("../dist/gradient-contour/", import.meta.url);
  page.on("request", request => requests.push(new URL(request.url()).pathname));
  await installBuiltFocusRoute(context, { output, pathname: routePath, origin: new URL(baseURL!).origin });
  await page.goto(routePath);
  const card = page.locator("[data-kp-focus-deck]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  await expect(page.locator(".graph-webgl")).toHaveAttribute("data-kp-surface-contour-capability", "ready");
  await page.locator(".gradient-source-editor summary").click();
  await page.locator("[data-gradient-variant]").click();
  await page.locator("[data-gradient-apply]").click();
  const checked = checkGradientExplanation(gradientContourVariant);
  if (checked.status !== "checked") throw new Error(checked.expected);
  await expect(page.locator("[data-gradient-revision]")).toHaveAttribute("data-gradient-revision", checked.lesson.revisionId);
  await page.locator("[data-kp-focus-deck-scrubber]").evaluate((element, step) => {
    (element as HTMLInputElement).value = String(step); element.dispatchEvent(new Event("input", { bubbles: true }));
  }, gradientComparisonBounds.end);
  await expect(page.locator("[data-gradient-rate]")).toHaveText("3.16");
  await page.locator("[data-gradient-open-tangent]").click();
  await expect(page.locator("[data-gradient-tangent-reading]")).toBeVisible();
  await page.locator("[data-gradient-return]").click();
  await expect(card).toHaveAttribute("data-gradient-step", String(gradientComparisonBounds.end));
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(requests.some(path => path.startsWith("/src/"))).toBe(false);
  expect(errors).toEqual([]);
  // Inject forbidden fallback requests after the ordinary closure assertions.
  // Both source modules and external network must fail, not reach the dev host.
  expect(await page.evaluate(async () => Promise.all([
    "/src/forbidden-production-fallback.ts", "https://kp-invalid.invalid/not-an-asset.js"
  ].map(url => fetch(url).then(() => false, () => true))))).toEqual([true, true]);
});
