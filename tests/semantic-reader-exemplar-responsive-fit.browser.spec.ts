import { expect, test } from "@playwright/test";

const route = (progress: number) =>
  "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1" +
  `&kpProgress=${progress}&kpMotion=full`;

const viewports = [
  { name: "desktop", width: 1280, height: 900, maxFontSize: 32 },
  { name: "compact", width: 820, height: 820, maxFontSize: 32 },
  { name: "phone", width: 375, height: 720, maxFontSize: 24 }
] as const;

for (const viewport of viewports) {
  test(`${viewport.name} equation stays compact, single-line, and in bounds`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const progress of [0, 167, 333, 500, 667, 833, 1000]) {
      await page.goto(route(progress));
      await expect(page.locator("body")).toHaveAttribute(
        "data-kp-reader-progress",
        String(progress)
      );
      const result = await page.locator(
        '[data-kp-reader-transition-active="true"]'
      ).evaluate((transition) => {
        const stage = transition.closest<HTMLElement>("[data-kp-reader-equation-stage]");
        const fit = transition.querySelector<HTMLElement>("[data-kp-reader-fit-surface]");
        const measurement = transition.querySelector<HTMLElement>(
          "[data-kp-reader-equation-measurement]"
        );
        if (stage === null || fit === null || measurement === null) {
          throw new Error("Active reader equation geometry is incomplete.");
        }
        const stageRect = stage.getBoundingClientRect();
        const heading = stage.querySelector<HTMLElement>(
          ".kp-reader-equation-stage-heading"
        );
        const visibleRects = [
          ...transition.querySelectorAll<HTMLElement>(
            "[data-kp-reader-equation-anchor-id]"
          ),
          ...stage.querySelectorAll<HTMLElement>(
            '[data-kp-reader-equation-material-owner-id]'
          )
        ].filter((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.visibility !== "hidden" && Number(style.opacity) > 0.01 &&
            rect.width > 0 && rect.height > 0;
        }).map((element) => element.getBoundingClientRect());
        return {
          fitStatus: fit.dataset["kpReaderEquationFitStatus"],
          wrapAllowed: fit.dataset["kpReaderEquationWrapAllowed"],
          whiteSpace: getComputedStyle(fit).whiteSpace,
          fontSize: Number.parseFloat(getComputedStyle(measurement).fontSize),
          headingOverflows: heading === null || heading.scrollWidth > heading.clientWidth + 1,
          outOfBounds: visibleRects.some((rect) =>
            rect.left < stageRect.left - 0.5 || rect.right > stageRect.right + 0.5
          ),
          multilineState: [...transition.querySelectorAll<HTMLElement>(
            ".kp-reader-equation-state .katex-display"
          )].some((display) => display.scrollWidth > display.clientWidth + 1)
        };
      });
      expect(result.fitStatus).not.toBe("overflow");
      expect(result.wrapAllowed).toBe("false");
      expect(result.whiteSpace).toBe("nowrap");
      expect(result.fontSize).toBeLessThanOrEqual(viewport.maxFontSize);
      expect(result.headingOverflows).toBe(false);
      expect(result.outOfBounds).toBe(false);
      expect(result.multilineState).toBe(false);
    }
  });
}
