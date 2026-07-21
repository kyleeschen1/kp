import { expect, test, type Page } from "@playwright/test";

const route =
  "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=0";

const progressSamples = [0, 333, 517, 620, 867, 943, 1000] as const;

test("integrated reader remains stable across desktop, tablet, and phone", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 768, height: 900 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(route);
    let stageWidth: number | undefined;
    let mastheadHeight: number | undefined;

    for (const progress of progressSamples) {
      await seekByScroll(page, progress);
      const evidence = await integratedEvidence(page);
      expect(evidence.documentOverflowPx).toBeLessThanOrEqual(1);
      expect(evidence.nestedVerticalScrollers).toBe(0);
      expect(evidence.activeTocCount).toBe(1);
      expect(evidence.mastheadTop).toBeGreaterThanOrEqual(-0.5);
      expect(evidence.stageTop).toBeGreaterThanOrEqual(
        evidence.mastheadTop + evidence.mastheadHeight + 8
      );
      expect(evidence.visibleEquationOverflowPx).toBeLessThanOrEqual(1);
      expect(evidence.katexIdentity).toBe(true);
      if (stageWidth === undefined) stageWidth = evidence.stageWidth;
      if (mastheadHeight === undefined) mastheadHeight = evidence.mastheadHeight;
      expect(Math.abs(evidence.stageWidth - stageWidth)).toBeLessThan(0.5);
      expect(Math.abs(evidence.mastheadHeight - mastheadHeight)).toBeLessThan(0.5);
    }

    await expect(page.locator("[data-kp-reader-equation-stage]"))
      .toHaveAttribute("data-kp-reader-native-endpoint", "target");
    await expect(page.locator("[data-kp-reader-equation-stage]"))
      .toHaveAttribute("data-kp-reader-native-endpoint-passed", "true");
  }
});

async function integratedEvidence(page: Page): Promise<{
  documentOverflowPx: number;
  nestedVerticalScrollers: number;
  activeTocCount: number;
  mastheadTop: number;
  mastheadHeight: number;
  stageTop: number;
  stageWidth: number;
  visibleEquationOverflowPx: number;
  katexIdentity: boolean;
}> {
  return page.evaluate(() => {
    const masthead = document.querySelector<HTMLElement>(".kp-reader-masthead");
    const stage = document.querySelector<HTMLElement>("[data-kp-reader-equation-stage]");
    const viewport = document.querySelector<HTMLElement>("[data-kp-reader-equation-viewport]");
    if (masthead === null || stage === null || viewport === null) {
      throw new Error("Integrated reader surfaces are unavailable.");
    }
    const mastheadBounds = masthead.getBoundingClientRect();
    const stageBounds = stage.getBoundingClientRect();
    const viewportBounds = viewport.getBoundingClientRect();
    const visibleEquation = [
      ...stage.querySelectorAll<HTMLElement>(
        "[data-kp-reader-equation-material-fragment-id], " +
        "[data-kp-reader-selector-id]"
      )
    ].filter((element) => {
      let opacity = 1;
      let current: HTMLElement | null = element;
      while (current !== null) {
        opacity *= Number.parseFloat(getComputedStyle(current).opacity);
        if (current === stage) break;
        current = current.parentElement;
      }
      return opacity > 0.01 && element.getBoundingClientRect().width > 0;
    });
    const overflow = visibleEquation.reduce((maximum, element) => {
      const bounds = element.getBoundingClientRect();
      return Math.max(
        maximum,
        viewportBounds.left - bounds.left,
        bounds.right - viewportBounds.right,
        viewportBounds.top - bounds.top,
        bounds.bottom - viewportBounds.bottom
      );
    }, 0);
    return {
      documentOverflowPx: document.documentElement.scrollWidth - window.innerWidth,
      nestedVerticalScrollers: [...document.querySelectorAll<HTMLElement>("body *")]
        .filter((element) => {
          const style = getComputedStyle(element);
          return /(auto|scroll)/.test(style.overflowY) &&
            element.scrollHeight > element.clientHeight + 1;
        }).length,
      activeTocCount: document.querySelectorAll(
        '.kp-lesson-toc [aria-current="location"]'
      ).length,
      mastheadTop: mastheadBounds.top,
      mastheadHeight: mastheadBounds.height,
      stageTop: stageBounds.top,
      stageWidth: stageBounds.width,
      visibleEquationOverflowPx: overflow,
      katexIdentity: visibleEquation.every((element) => {
        const candidates = [element, ...element.querySelectorAll<HTMLElement>("*")];
        return candidates.some((candidate) =>
          getComputedStyle(candidate).fontFamily.includes("KaTeX")
        );
      })
    };
  });
}

async function seekByScroll(page: Page, progressPermille: number): Promise<void> {
  await page.evaluate((target) => {
    const beats = [...document.querySelectorAll<HTMLElement>("[data-kp-beat]")];
    const first = beats[0];
    const last = beats.at(-1);
    if (first === undefined || last === undefined) throw new Error("Reader beats unavailable.");
    const firstRect = first.getBoundingClientRect();
    const lastRect = last.getBoundingClientRect();
    const start = window.scrollY + firstRect.top + firstRect.height * 0.36;
    const end = window.scrollY + lastRect.top + lastRect.height * 0.64;
    const readerPosition = start + (end - start) * target / 1_000;
    window.scrollTo(0, readerPosition - window.innerHeight * 0.48);
  }, progressPermille);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    String(progressPermille)
  );
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}
