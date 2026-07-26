import { expect, test } from "@playwright/test";

test("production package exposes one artifact set through four outputs", async ({
  page
}) => {
  await page.goto("/canonical-animation-review.html");
  const review = page.locator("[data-kp-canonical-animation-review]");
  await expect(review).toHaveAttribute(
    "data-review-projection-schema",
    "kp.governed-canonical-projection-bundle.v1"
  );

  const outputs = page.locator("[data-review-projection]");
  await expect(outputs).toHaveCount(4);
  const records = await outputs.evaluateAll((items) =>
    items.map((item) => {
      const element = item as HTMLElement;
      return {
        kind: element.dataset["reviewProjection"],
        artifacts: element.dataset["reviewProjectionArtifacts"],
        checkpoints: element.dataset["reviewProjectionCheckpoints"]
      };
    })
  );

  expect(records.map(({ kind }) => kind)).toEqual([
    "static-js",
    "headless",
    "iframe",
    "static-step"
  ]);
  expect(new Set(records.map(({ artifacts }) => artifacts)).size).toBe(1);
  expect(new Set(records.map(({ checkpoints }) => checkpoints)).size).toBe(1);
  expect(records[0]!.artifacts?.split(",")).toHaveLength(3);
  expect(records[0]!.checkpoints?.split(",")).toHaveLength(7);
});
