import { expect, test } from "@playwright/test";

const conceptPath = "/concepts/mathematics/linear-equations/solve-with-balance";

test("opening story keeps searchable prose before its canonical animation stage", async ({ page }) => {
  await page.goto(conceptPath);
  const story = page.locator("[data-kp-symbolic-story]");
  await expect(story.getByRole("heading", { name: "Solve x + 3 = 7" })).toBeVisible();
  await expect(story).toContainText("Subtract 3 from both sides");
  await expect(story.locator("[data-kp-symbolic-story-beat]")).toHaveCount(4);
  await expect(story.locator("[data-kp-symbolic-story-player]"))
    .toHaveAttribute("data-kp-editor-animation-id", "animation.linear-solve.solve-x");
  await expect(story.locator(".editor-animation-player__controls")).toBeHidden();
  await expect(page.locator("[data-kp-concept-viewport] [data-kp-linear-equation-coordinated-stage]"))
    .toHaveCount(1);

  const ordered = await story.evaluate((element) => {
    const explanation = element.querySelector("[data-kp-symbolic-story-explanation]");
    const visual = element.querySelector("[data-kp-symbolic-story-visual]");
    return Boolean(
      (explanation?.compareDocumentPosition(visual!) ?? 0) & Node.DOCUMENT_POSITION_FOLLOWING
    );
  });
  expect(ordered).toBe(true);
  expect(await page.evaluate(() => (
    window as typeof window & { find(text: string): boolean }
  ).find("The two −3 terms enter together"))).toBe(true);
});
