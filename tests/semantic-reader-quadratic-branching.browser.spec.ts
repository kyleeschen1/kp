import { expect, test } from "@playwright/test";

const route =
  "/reader/quadratic-branching/?kpLesson=lesson.algebra.quadratic-branching" +
  "&kpVersion=1&kpProgress=680&kpMethod=completing-square";

test("quadratic learner surface shares progress across method, URL, and controls", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route, { waitUntil: "networkidle" });
  const body = page.locator("body");
  const stage = page.locator("[data-kp-quadratic-stage]");
  await expect(body).toHaveAttribute("data-kp-reader-hydrated", "true");
  await expect(body).toHaveAttribute("data-kp-reader-progress", "680");
  await expect(body).toHaveAttribute("data-kp-reader-responsive-projection", "wide-scrollytelling");
  await expect(stage).toHaveAttribute("data-kp-phase", "branch");
  await expect(stage).toHaveAttribute("data-kp-clock-id", "clock.reader.quadratic-branching.shared");
  await expect(page.locator("[data-kp-quadratic-branches]")).toBeVisible();

  await page.getByRole("button", { name: "Quadratic formula" }).click();
  await expect(stage).toHaveAttribute("data-kp-method", "formula");
  expect(new URL(page.url()).searchParams.get("kpProgress")).toBe("680");
  expect(new URL(page.url()).searchParams.get("kpMethod")).toBe("formula");

  await page.getByRole("button", { name: "Next explanation step" }).click();
  await expect(body).toHaveAttribute("data-kp-reader-progress", "880");
  await expect(page.locator("[data-kp-quadratic-solution]")).toBeVisible();
  await expect(page.locator("[data-kp-quadratic-branches]")).toBeHidden();
});

test("quadratic learner surface becomes a narrow focus stepper without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto(route, { waitUntil: "networkidle" });
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-responsive-projection",
    "focus-stepper"
  );
  const containment = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    stage: (() => {
      const rect = document.querySelector<HTMLElement>("[data-kp-quadratic-stage]")!.getBoundingClientRect();
      return rect.left >= -1 && rect.right <= window.innerWidth + 1;
    })()
  }));
  expect(containment).toEqual({ overflow: 0, stage: true });
  await page.locator("[data-kp-quadratic-stage]").press("ArrowRight");
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", "880");
});

test("quadratic graph displays the authored curve and exact solution intersections", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route.replace("kpProgress=680", "kpProgress=1000"), {
    waitUntil: "networkidle"
  });
  const stage = page.locator("[data-kp-quadratic-stage]");
  const graph = page.locator("[data-kp-quadratic-graph]");
  await expect(stage).toHaveAttribute("data-kp-phase", "graph");
  await expect(graph).toBeVisible();
  await expect(graph).toHaveAttribute("data-kp-renderer-may-solve", "false");
  await expect(graph.locator('[data-kp-graph-root="root:2/1"]')).toHaveCount(1);
  await expect(graph.locator('[data-kp-graph-root="root:3/1"]')).toHaveCount(1);
  await expect(graph.locator("[data-kp-selector-id='selector.quadratic.graph.curve']")).toHaveCount(1);
});
