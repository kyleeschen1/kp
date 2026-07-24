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

test("both methods move selector-owned native symbols through measured paths", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(
    route.replace("kpProgress=680", "kpProgress=180") + "&kpMotion=full",
    { waitUntil: "networkidle" }
  );
  const stage = page.locator("[data-kp-quadratic-stage]");
  const slider = page.locator("[data-kp-quadratic-progress]");
  await expect(stage).toHaveAttribute(
    "data-kp-symbolic-transition",
    "transition.quadratic.completing-square.balance"
  );
  await expect(stage.locator("[data-kp-transition-layer]")).toHaveCount(2);
  const squareMotion = await symbolicSnapshot(
    "katex.quadratic.completing-square.standard.constant",
    "katex.quadratic.completing-square.balanced.right"
  );
  expect(squareMotion.sourceTransform).not.toBe("none");
  expect(squareMotion.targetTransform).not.toBe("none");
  expect(squareMotion.centerDistance).toBeLessThan(1);

  await seek(430);
  await seek(180);
  expect(await symbolicSnapshot(
    "katex.quadratic.completing-square.standard.constant",
    "katex.quadratic.completing-square.balanced.right"
  )).toEqual(squareMotion);

  await page.getByRole("button", { name: "Quadratic formula" }).click();
  await seek(400);
  await expect(stage).toHaveAttribute(
    "data-kp-symbolic-transition",
    "transition.quadratic.formula.simplify-radical"
  );
  await expect(stage.locator("[data-kp-transition-layer]")).toHaveCount(2);
  await expect(
    stage.locator(
      '[data-kp-motion-id="katex.quadratic.formula.discriminant.radical"]'
    )
  ).toHaveCSS("transform", /matrix/);
  await expect(
    stage.locator(
      '[data-kp-motion-id="katex.quadratic.formula.simplified.offset"]'
    )
  ).toHaveCSS("transform", /matrix/);
  await expect(stage.locator("[data-kp-reader-equation-material-layer]")).toHaveCount(0);

  async function seek(progressPermille: number): Promise<void> {
    await slider.evaluate((element: HTMLInputElement, value) => {
      element.value = String(value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }, progressPermille);
  }

  async function symbolicSnapshot(sourceId: string, targetId: string) {
    return page.evaluate(({ sourceId, targetId }) => {
      const source = document.querySelector<HTMLElement>(
        `[data-kp-motion-id="${sourceId}"]`
      )!;
      const target = document.querySelector<HTMLElement>(
        `[data-kp-motion-id="${targetId}"]`
      )!;
      const sourceRect = source.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      return {
        sourceTransform: getComputedStyle(source).transform,
        targetTransform: getComputedStyle(target).transform,
        centerDistance: Math.hypot(
          sourceRect.left + sourceRect.width / 2 -
            (targetRect.left + targetRect.width / 2),
          sourceRect.top + sourceRect.height / 2 -
            (targetRect.top + targetRect.height / 2)
        )
      };
    }, { sourceId, targetId });
  }
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
    await slider.evaluate((element: HTMLInputElement, value) => {
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

test("motion policy, narration, and no-depth mode preserve semantic checkpoints", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${route}&kpMotion=system`, { waitUntil: "networkidle" });
  const body = page.locator("body");
  const stage = page.locator("[data-kp-quadratic-stage]");
  await expect(body).toHaveAttribute("data-kp-reader-motion-mode", "essential");
  await expect(body).toHaveAttribute("data-kp-reader-depth", "none");
  await expect(stage).toHaveAttribute("data-kp-motion-sampling", "continuous");
  await expect(page.locator("[data-kp-quadratic-narration]")).toContainText(
    "minus branch gives x equals two"
  );

  await page.goto(
    route.replace("kpProgress=680", "kpProgress=950") + "&kpMotion=static",
    { waitUntil: "networkidle" }
  );
  await expect(body).toHaveAttribute("data-kp-reader-motion-mode", "static");
  await expect(body).toHaveAttribute("data-kp-reader-progress", "1000");
  await expect(stage).toHaveAttribute("data-kp-motion-sampling", "checkpoint");
  await expect(page.locator("[data-kp-quadratic-graph]")).toBeVisible();
  expect(new URL(page.url()).searchParams.get("kpProgress")).toBe("1000");
});

test("keyboard endpoints, resize invalidation, and review recapture are deterministic", async ({ page }) => {
  await page.goto(route, { waitUntil: "networkidle" });
  const stage = page.locator("[data-kp-quadratic-stage]");
  await stage.press("End");
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", "1000");
  await stage.press("Home");
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", "0");

  const beforeRevision = Number(await stage.getAttribute("data-kp-layout-revision"));
  await page.setViewportSize({ width: 420, height: 780 });
  await expect.poll(async () =>
    Number(await stage.getAttribute("data-kp-layout-revision"))
  ).toBeGreaterThan(beforeRevision);

  const detail = await page.evaluate(() => new Promise<Record<string, unknown>>((resolve) => {
    window.addEventListener("kp:reader-dev-review-frame", (event) => {
      resolve((event as CustomEvent<Record<string, unknown>>).detail);
    }, { once: true });
    window.dispatchEvent(new CustomEvent("kp:reader-dev-review-request-frame"));
  }));
  expect(detail["progressPermille"]).toBe(0);
  expect(detail["clockId"]).toBe("clock.reader.quadratic-branching.shared");
  await expect(stage).toHaveAttribute("data-kp-capture-revision", "1");
});

test("forced colors retain distinct roots without color-only meaning", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(route.replace("kpProgress=680", "kpProgress=1000"), {
    waitUntil: "networkidle"
  });
  const styles = await page.evaluate(() => {
    const curve = document.querySelector<SVGPolylineElement>(".kp-quadratic-graph__curve")!;
    const plus = document.querySelector<SVGCircleElement>(
      '.kp-quadratic-graph__root[data-kp-branch-sign="plus"] circle'
    )!;
    return {
      curveStroke: getComputedStyle(curve).stroke,
      plusDash: getComputedStyle(plus).strokeDasharray
    };
  });
  expect(styles.curveStroke).not.toBe("none");
  expect(styles.plusDash).not.toBe("none");
});

test("no-script fallback keeps the complete transcript in reading order", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-kp-quadratic-stage]")).toHaveAttribute(
      "aria-describedby",
      "kp-quadratic-transcript"
    );
    await expect(page.locator("#kp-quadratic-transcript")).toBeVisible();
    await expect(page.locator("#kp-quadratic-transcript")).toContainText(
      "both give x ∈ {2, 3}"
    );
    await expect(page.locator("[data-kp-quadratic-progress]")).toBeHidden();
  } finally {
    await context.close();
  }
});
