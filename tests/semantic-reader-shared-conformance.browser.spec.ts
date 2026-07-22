import { expect, test } from "@playwright/test";
import { kpReaderRouteManifest } from "../src/reader/compiler/reader-route-manifest.ts";

import {
  assertKpSemanticReaderConformance,
  createKpSemanticReaderConformanceDescriptor
} from "./support/semantic-reader-conformance.ts";

const readers = kpReaderRouteManifest.map(
  createKpSemanticReaderConformanceDescriptor
);

for (const descriptor of readers) {
  test(`${descriptor.id} satisfies the shared semantic reader contract`, async ({ page, browser }) => {
    await assertKpSemanticReaderConformance({ page, browser, descriptor });
  });
}

test("solve-x preserves branch attention across wide and narrow projections", async ({ page }) => {
  const descriptor = readers.find((candidate) => candidate.id === "reader-solve-x");
  if (descriptor === undefined) throw new Error("Missing solve-x reader descriptor.");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(descriptor.route(200), { waitUntil: "networkidle" });

  const body = page.locator("body");
  const stage = page.locator(descriptor.stageSelector);
  await expect(body).toHaveAttribute(
    "data-kp-reader-responsive-projection",
    "wide-scrollytelling"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-branch-schedule",
    /\.together$/
  );
  const wideProgress = JSON.parse(
    (await stage.getAttribute("data-kp-reader-equation-branch-progress")) ?? "{}"
  ) as Record<string, number>;
  expect(wideProgress["lhs"]).toBe(wideProgress["rhs"]);

  await page.setViewportSize({ width: 360, height: 760 });
  await expect(body).toHaveAttribute(
    "data-kp-reader-responsive-projection",
    "focus-stepper"
  );
  await expect(body).toHaveAttribute("data-kp-reader-progress", "200");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-branch-schedule",
    /\.together$/
  );
  await expect(
    page.getByRole("navigation", { name: "Explanation controls" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Previous explanation step" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next explanation step" })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("kpProgress")).toBe("200");
});
