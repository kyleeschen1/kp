import { expect, test, type Page } from "@playwright/test";

const route = (progress: number) =>
  "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1" +
  `&kpProgress=${progress}`;

test("perceptual alignment tapers to native geometry at phase boundaries", async ({ page }) => {
  for (const neighborhood of [
    [329, 330, 331, 332, 333, 334, 335, 336, 337],
    [663, 664, 665, 666, 667, 668, 669, 670, 671]
  ]) {
    const centers: Awaited<ReturnType<typeof relationCenter>>[] = [];
    for (const progress of neighborhood) {
      await page.goto(route(progress));
      await expect(page.locator("body")).toHaveAttribute(
        "data-kp-reader-progress",
        String(progress)
      );
      centers.push(await relationCenter(page));
    }
    const adjacentTravel = centers.slice(1).map((center, index) =>
      Math.hypot(
        center.x - centers[index]!.x,
        center.y - centers[index]!.y
      )
    );
    expect(
      Math.max(...adjacentTravel),
      JSON.stringify({ neighborhood, centers, adjacentTravel })
    ).toBeLessThan(2);
  }
});

async function relationCenter(page: Page): Promise<{
  x: number;
  y: number;
  transition: string | undefined;
  fitTransform: string;
  nativeX: number;
}> {
  const owner = page.locator(
    '[data-kp-reader-equation-material-owner-id="material-owner.relation-persists"]'
  );
  return owner.evaluate((element) => {
    const stage = element.closest<HTMLElement>("[data-kp-reader-equation-stage]")!;
    const candidates = [
      ...stage.querySelectorAll<HTMLElement>(
        '[data-kp-reader-transition-active="true"] [data-kp-reader-selector-id$=".equals"]'
      ),
      ...element.querySelectorAll<HTMLElement>(
        '[data-kp-reader-equation-material-fragment-id$=".equals"]'
      )
    ].map((candidate) => {
      const rect = candidate.getBoundingClientRect();
      let opacity = 1;
      let current: HTMLElement | null = candidate;
      while (current !== null) {
        opacity *= Number.parseFloat(getComputedStyle(current).opacity);
        if (current === stage) break;
        current = current.parentElement;
      }
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        opacity
      };
    }).filter(({ opacity }) => opacity > 0.001);
    const authority = candidates.reduce((sum, candidate) => sum + candidate.opacity, 0);
    const fit = element.closest<HTMLElement>("[data-kp-reader-material-fit-surface]")!;
    return {
      x: candidates.reduce((sum, candidate) => sum + candidate.x * candidate.opacity, 0) /
        authority,
      y: candidates.reduce((sum, candidate) => sum + candidate.y * candidate.opacity, 0) /
        authority,
      transition: document.body.dataset["kpReaderTransition"],
      fitTransform: fit.style.transform,
      nativeX: candidates[0]!.x
    };
  });
}
