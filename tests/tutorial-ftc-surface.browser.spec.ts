import { expect, test } from "@playwright/test";

test("FTC learner surface scrubs semantic frames without nested scrollbars", async ({
  page
}) => {
  await page.goto("/?view=ftc-tutorial", { waitUntil: "networkidle" });

  const host = page.locator("[data-kp-ftc-tutorial-host]");
  await expect(host).toHaveAttribute("data-kp-motion-profile", "full");
  await expect(host.locator("[data-kp-ftc-graph]")).toBeVisible();
  await expect(host.locator(".katex")).toBeVisible();

  const scrubber = host.locator('[data-kp-tutorial-action="scrub"]');
  await scrubber.fill("0.8");
  await expect(host.locator("[data-kp-hermeneutic-tutorial]")).toHaveAttribute(
    "data-kp-active-claim",
    "claim.ftc.identity"
  );
  await expect(host.locator("[data-kp-ftc-equation-stage]")).toHaveAttribute(
    "data-kp-ftc-equation-stage",
    "limit"
  );

  await host.locator('[data-kp-tutorial-action="inspect-part"]').click();
  await expect(host.locator("[data-kp-hermeneutic-tutorial]")).toHaveAttribute(
    "data-kp-active-claim",
    "claim.ftc.finite-strip"
  );
  await host.locator('[data-kp-ftc-action="lens"]').selectOption("affine");
  await expect(host).toHaveAttribute("data-kp-ftc-lens", "affine");

  const scrollContainers = await host.evaluate((element) =>
    [element, ...element.querySelectorAll("*")]
      .filter((candidate) => {
        const style = getComputedStyle(candidate);
        return [style.overflow, style.overflowX, style.overflowY].some(
          (value) => value === "auto" || value === "scroll"
        );
      })
      .map((candidate) => candidate.tagName)
  );
  expect(scrollContainers).toEqual([]);
});

test("FTC tutorial is available inside the editor and as a learner view", async ({
  page
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const cards = page.locator(".preview-stage > *");
  const conceptLauncher = page.locator("[data-kp-linear-equation-editor-launcher]");
  await expect(cards.nth(0)).toHaveAttribute("data-kp-linear-equation-editor-launcher", "");
  await expect(cards.nth(1)).toHaveAttribute("data-kp-editor-animation-library", "");
  await expect(cards.nth(2)).toHaveAttribute("data-kp-type", "graph-3d");
  await expect(cards.last()).toHaveAttribute("data-kp-ftc-editor-launcher", "");
  await expect(conceptLauncher.getByRole("link", { name: "Open concept room" })).toHaveAttribute(
    "href",
    "/concepts/mathematics/linear-equations/solve-with-balance"
  );
  await expect(page.locator("[data-kp-ftc-editor-launcher]")).toBeVisible();
  await page.locator('[data-action="load-ftc-tutorial-editor"]').click();
  await expect(page.locator("[data-kp-ftc-editor-surface]")).toBeVisible();
  await page.locator('[data-action="show-ftc-tutorial"]').click();
  await expect(page.locator("[data-kp-ftc-learner-view]")).toBeVisible();
  await expect(page).toHaveURL(/view=ftc-tutorial/);
});

test("linear-equation editor card opens the canonical concept room", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Open concept room" }).click();
  await expect(page).toHaveURL(
    /\/concepts\/mathematics\/linear-equations\/solve-with-balance/
  );
  await expect(page.locator('[data-kp-concept-room-mounted="true"]')).toBeAttached();
});

test("FTC full-motion playback keeps KaTeX geometry stable within a claim", async ({
  page
}) => {
  await page.goto("/?view=ftc-tutorial", { waitUntil: "networkidle" });

  const result = await page.evaluate(async () => {
    const longTasks: number[] = [];
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => longTasks.push(entry.duration));
    });
    observer.observe({ entryTypes: ["longtask"] });
    document
      .querySelector<HTMLElement>('[data-kp-tutorial-action="play"]')
      ?.click();
    const rects: Array<{ x: number; width: number; height: number }> = [];
    for (let index = 0; index < 8; index += 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const rect = document.querySelector<HTMLElement>(".katex")?.getBoundingClientRect();
      if (rect !== undefined) {
        rects.push({ x: rect.x, width: rect.width, height: rect.height });
      }
    }
    observer.disconnect();
    const progress = Number(
      document
        .querySelector<HTMLElement>("[data-kp-hermeneutic-tutorial]")
        ?.dataset["kpTutorialProgress"] ?? 0
    );
    return { rects, progress, longestTask: Math.max(0, ...longTasks) };
  });

  expect(result.progress).toBeGreaterThan(0.02);
  expect(result.rects).toHaveLength(8);
  const widths = result.rects.map(({ width }) => width);
  const xs = result.rects.map(({ x }) => x);
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1);
  expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(1);
  expect(result.longestTask).toBeLessThan(100);
});
