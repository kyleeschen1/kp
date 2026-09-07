import { expect, test } from "@playwright/test";
import { kpReaderRouteManifest } from "../src/reader/compiler/reader-route-manifest.ts";
import {
  assertKpSemanticReaderConformance,
  createKpSemanticReaderConformanceDescriptor
} from "./support/semantic-reader-conformance.ts";

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
