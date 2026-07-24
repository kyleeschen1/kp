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

test("direct seek and rewind keep equation and graph on the same playhead", async ({ page }) => {
  await page.goto(route.replace("kpProgress=680", "kpProgress=1000"), {
    waitUntil: "networkidle"
  });
  const stage = page.locator("[data-kp-quadratic-stage]");
  const slider = page.locator("[data-kp-quadratic-progress]");
  const rootTwo = page.locator('[data-kp-graph-root="root:2/1"]');
  const settled = await synchronizedSnapshot();

  await seek(950);
  await expect(stage).toHaveAttribute("data-kp-graph-progress", "0.5");
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", "950");

  await seek(680);
  await expect(stage).toHaveAttribute("data-kp-phase", "branch");
  await expect(stage).toHaveAttribute("data-kp-graph-progress", "0");
  await expect(page.locator("[data-kp-quadratic-branches]")).toBeVisible();

  await seek(1000);
  expect(await synchronizedSnapshot()).toEqual(settled);
  await page.getByRole("button", { name: "Quadratic formula" }).click();
  await expect(rootTwo).toHaveAttribute(
    "data-kp-source-branch",
    "branch.method.quadratic.formula.minus"
  );
  await expect(rootTwo).toHaveAttribute("data-kp-graph-root", "root:2/1");

  async function seek(progressPermille: number): Promise<void> {
    await slider.evaluate((element, value) => {
      element.value = String(value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }, progressPermille);
  }

  async function synchronizedSnapshot() {
    return page.evaluate(() => {
      const graph = document.querySelector<SVGElement>("[data-kp-quadratic-graph]")!;
      const curve = graph.querySelector<SVGPolylineElement>(".kp-quadratic-graph__curve")!;
      return {
        clock: graph.dataset["kpSharedClockId"],
        progress: document.body.dataset["kpReaderProgress"],
        graphProgress: document.querySelector<HTMLElement>("[data-kp-quadratic-stage]")!
          .dataset["kpGraphProgress"],
        curveOffset: curve.style.strokeDashoffset,
        roots: [...graph.querySelectorAll<SVGGElement>("[data-kp-graph-root]")]
          .map((root) => ({
            id: root.dataset["kpGraphRoot"],
            opacity: root.style.opacity
          }))
      };
    });
  }
});
