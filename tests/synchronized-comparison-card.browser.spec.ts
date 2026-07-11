import { expect, test } from "@playwright/test";

import {
  createLinearSolveProgrammingComparisonSample,
  renderKpSynchronizedComparisonHtmlShell
} from "../src/tutorial/synchronized-comparison-card.ts";

test("synchronized comparison shell renders both tutorial cards", async ({
  page
}) => {
  const sample = createLinearSolveProgrammingComparisonSample();

  await page.setContent(
    [
      "<!doctype html>",
      `<html lang="en">`,
      "<head>",
      `  <meta charset="utf-8" />`,
      `  <meta name="viewport" content="width=device-width, initial-scale=1" />`,
      `  <title>${sample.title}</title>`,
      "</head>",
      "<body>",
      renderKpSynchronizedComparisonHtmlShell(sample, sample.sample(0.5)),
      "</body>",
      "</html>"
    ].join("\n"),
    { waitUntil: "domcontentloaded" }
  );

  await expect(page.locator("[data-kp-synchronized-comparison]")).toHaveAttribute(
    "data-kp-synchronized-comparison",
    "comparison.linear-solve.programming-trace"
  );
  await expect(page.locator("[data-kp-tutorial-card]")).toHaveCount(2);
  await expect(page.locator('[data-kp-tutorial-panel="equation"]')).toBeVisible();
  await expect(
    page.locator('[data-kp-tutorial-panel="execution-trace"]')
  ).toBeVisible();
});
