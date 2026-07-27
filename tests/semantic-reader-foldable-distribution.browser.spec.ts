import { expect, test } from "@playwright/test";

const route = (
  progressPermille: number,
  additions: Record<string, string> = {}
) => {
  const parameters = new URLSearchParams({
    kpLesson: "lesson.algebra.foldable-distribution",
    kpVersion: "1",
    kpProgress: String(progressPermille),
    kpMotion: "full",
    kpProfile: "standard",
    ...additions
  });
  return `/reader/foldable-distribution/?${parameters}`;
};

test("fold controls preserve one semantic clock and stable URL state", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_100, height: 800 });
  await page.goto(route(300), { waitUntil: "networkidle" });
  const body = page.locator("body");
  const stage = page.locator("[data-kp-reader-equation-stage]");
  const mode = page.getByLabel("Evaluation detail", { exact: true });

  await expect(body).toHaveAttribute("data-kp-reader-hydrated", "true");
  await expect(stage).toHaveAttribute("data-kp-reader-fold-mode", "automatic");
  await expect(stage).toHaveAttribute("data-kp-reader-fold-total-beats", "64");

  await mode.selectOption("collapsed");
  await expect(stage).toHaveAttribute("data-kp-reader-fold-mode", "collapsed");
  await expect(stage).toHaveAttribute("data-kp-reader-fold-total-beats", "46");
  await expect.poll(() =>
    new URL(page.url()).searchParams.get("kpFoldMode")
  ).toBe("collapsed");
  expect(new URL(page.url()).searchParams.getAll("kpFold")).toHaveLength(2);

  await page.getByRole("button", { name: "Distribution" }).click();
  await expect(mode).toHaveValue("pinned");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-fold-pinned",
    "evaluation.foldable-distribution.distribute"
  );
  await expect(stage).toHaveAttribute("data-kp-reader-fold-total-beats", "55");
  await expect.poll(() =>
    new URL(page.url()).searchParams.get("kpPin")
  ).toBe("evaluation.foldable-distribution.distribute");
});

test("parallel distribution and product work each render as one complete cohort", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_100, height: 800 });
  await page.goto(route(140, { kpFoldMode: "expanded" }), {
    waitUntil: "networkidle"
  });

  const body = page.locator("body");
  await expect(body).toHaveAttribute("data-kp-reader-hydrated", "true");
  await expect(body).toHaveAttribute("data-kp-reader-transition", /^cohort\./);
  await expect(
    page.locator(
      "[data-kp-reader-transition-active='true']" +
      "[data-kp-reader-cohort-transformations*=',']"
    )
  ).toHaveCount(1);

  await page.goto(route(400, { kpFoldMode: "expanded" }), {
    waitUntil: "networkidle"
  });
  await expect(body).toHaveAttribute("data-kp-reader-transition", /^cohort\./);
  await expect(
    page.locator(
      "[data-kp-reader-transition-active='true']" +
      "[data-kp-reader-cohort-transformations*=',']"
    )
  ).toHaveCount(1);
});
