import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { checkGradientExplanation, gradientContourVariant } from "../src/tutorial/gradient-contour/gradient-contour-authoring.ts";
import { gradientComparisonBounds } from "../src/tutorial/gradient-contour/gradient-contour-story.ts";

test("built gradient entry executes source Apply, WebGL and independent return without dev modules", async ({ page }) => {
  const errors: string[] = [], requests: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const routePath = "/experiments/kinetic-figure/gradient-contour/";
  const output = new URL("../dist/gradient-contour/", import.meta.url);
  const html = await readFile(new URL("experiments/kinetic-figure/gradient-contour/index.html", output));
  // Serve the already-built files inside this isolated browser context. No
  // preview server, source-module fallback or app-server route is introduced.
  await page.route("http://localhost:8000/**", async route => {
    const pathname = new URL(route.request().url()).pathname;
    requests.push(pathname);
    if (pathname === routePath) { await route.fulfill({ body: html, contentType: "text/html" }); return; }
    const asset = /^\/assets\/([A-Za-z0-9._-]+\.(js|css|woff2?|ttf))$/.exec(pathname);
    if (!asset) { await route.abort(); return; }
    const contentType = asset[2] === "js" ? "text/javascript" : asset[2] === "css" ? "text/css" : "application/octet-stream";
    await route.fulfill({ body: await readFile(new URL(`assets/${asset[1]!}`, output)), contentType });
  });
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
});
