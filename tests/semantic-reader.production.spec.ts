import { expect, test } from "@playwright/test";
import { kpReaderRouteManifest } from "../src/reader/compiler/reader-route-manifest.ts";
import {
  assertKpSemanticReaderConformance,
  createKpSemanticReaderConformanceDescriptor
} from "./support/semantic-reader-conformance.ts";

test("built fraction reader preserves direct narrow multiplication without prewarm history", async ({ page }) => {
  const failures: string[] = [];
  page.on("pageerror", error => failures.push(error.message));
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto("/reader/fraction-composition/?kpLesson=lesson.algebra.fraction-composition&kpVersion=1&kpProgress=575&kpMotion=full", {
    waitUntil: "networkidle"
  });
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", "575");
  await expect(page.locator('[data-kp-reader-transition-active="true"]')).toHaveAttribute(
    "data-kp-reader-transition", /multiply-by-three/
  );
  expect(failures).toEqual([]);
});

for (const route of kpReaderRouteManifest) {
  test(`built ${route.route} preserves reader behavior without development services`, async ({ page, browser }) => {
    const failures: string[] = [];
    page.on("pageerror", error => failures.push(error.message));
    page.on("response", response => {
      if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
    });
    page.on("request", request => {
      if (/\/__kp\/|\/src\/|\/@vite\//.test(new URL(request.url()).pathname)) {
        failures.push(`Development request: ${request.url()}`);
      }
    });
    // Exercise the emitted chunks, not Vite's development module graph.
    try {
      await assertKpSemanticReaderConformance({
        page, browser, delivery: "production",
        descriptor: createKpSemanticReaderConformanceDescriptor(route)
      });
    } catch (error) {
      await test.info().attach("reader-failure", {
        contentType: "application/json",
        body: JSON.stringify({ failures, anchors: await page.locator(
          "[data-kp-reader-equation-anchor-id]"
        ).evaluateAll(elements => elements.map(element => ({
          selector: element.getAttribute("data-kp-reader-selector-id"),
          transition: element.closest("[data-kp-reader-transition]")?.getAttribute("data-kp-reader-transition"),
          rect: element.getBoundingClientRect().toJSON(),
          html: element.outerHTML
        }))) }, null, 2)
      });
      throw error;
    }
    expect(failures).toEqual([]);
  });
}
