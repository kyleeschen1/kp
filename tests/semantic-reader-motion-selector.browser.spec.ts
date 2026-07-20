import { expect, test } from "@playwright/test";

const route = (motion?: string) =>
  "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=553" +
  (motion === undefined ? "" : `&kpMotion=${motion}`);

test("motion selector overrides, persists, and serializes reader policy", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route("full"));
  const selector = page.getByLabel("Motion preference");
  await expect(selector).toHaveValue("full");
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-motion-mode",
    "continuous"
  );

  await selector.selectOption("reduced");
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-motion-mode",
    "essential"
  );
  await expect.poll(() => new URL(page.url()).searchParams.get("kpMotion"))
    .toBe("reduced");
  await expect.poll(() => page.evaluate(() =>
    localStorage.getItem("kp.reader.motion-preference.v1")
  )).toBe("reduced");

  await page.reload();
  await expect(selector).toHaveValue("reduced");
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-motion-mode",
    "essential"
  );

  await page.goto(route());
  await expect(selector).toHaveValue("reduced");
  await selector.selectOption("static");
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-motion-mode",
    "checkpoint"
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    "667"
  );
  await expect.poll(() => new URL(page.url()).searchParams.get("kpMotion"))
    .toBe("static");
});
