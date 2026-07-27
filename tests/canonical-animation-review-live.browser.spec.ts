import { expect, test } from "@playwright/test";

import {
  kpDevReviewNoteV2Schema
} from "../protocols/dev-review-v2-schema.ts";

test("Animation Library review capture persists through the real local inbox", async ({
  page
}) => {
  await page.goto("/canonical-animation-review.html");
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-dev-review-ready",
    "true"
  );
  await page
    .frameLocator("[data-animation-library-frame]")
    .locator("[data-kp-reader-equation-stage]")
    .waitFor();

  const review = page.locator("[data-kp-dev-review-shell]");
  await review.locator("button.launcher").click();
  await review.locator("textarea").fill(
    "Automated wiring proof for the Animation Library review inbox."
  );
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/dev/reviews/v2/notes") &&
    response.request().method() === "POST"
  );
  await review.locator("button.save").click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  const note = kpDevReviewNoteV2Schema.parse(await response.json());
  await expect(review.locator("output.status")).toHaveText(
    `Saved note ${note.sequence}.`
  );

  const query = await page.evaluate(async (noteId) => {
    const response = await fetch("/api/dev/reviews/v2/query", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-kp-dev-review": "1"
      },
      body: JSON.stringify({
        scope: "all",
        detail: "full",
        limit: 100
      })
    });
    return {
      status: response.status,
      body: await response.json(),
      noteId
    };
  }, note.id);
  expect(query.status).toBe(200);
  expect(
    (query.body as {
      page: { notes: readonly { id: string }[] };
    }).page.notes.some(({ id }) => id === query.noteId)
  ).toBe(true);
});
