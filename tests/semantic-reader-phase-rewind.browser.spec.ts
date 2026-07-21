import { expect, test, type Page } from "@playwright/test";

const route = (progress: number) =>
  "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1" +
  `&kpProgress=${progress}`;

test("scroll rewind retraces visible ink across both phase boundaries", async ({ page }) => {
  await page.goto(route(320));
  const owner = page.locator(
    '[data-kp-reader-equation-material-owner-id="material-owner.relation-persists"]'
  );
  await owner.evaluate((element) => {
    element.dataset["kpBoundaryRewindProbe"] = "same-owner";
  });

  for (const boundary of [
    { before: 320, after: 346 },
    { before: 653, after: 680 }
  ]) {
    await seekByScroll(page, boundary.before);
    const before = await visibleRelationInk(page);
    await seekByScroll(page, boundary.after);
    await expect(page.locator("body")).toHaveAttribute(
      "data-kp-reader-playback-direction",
      "forward"
    );
    await seekByScroll(page, boundary.before);
    await expect(page.locator("body")).toHaveAttribute(
      "data-kp-reader-playback-direction",
      "rewind"
    );
    const rewound = await visibleRelationInk(page);
    expect(rewound.x).toBeCloseTo(before.x, 4);
    expect(rewound.y).toBeCloseTo(before.y, 4);
    expect(rewound.authority).toBeCloseTo(before.authority, 4);
    await expect(owner).toHaveAttribute(
      "data-kp-boundary-rewind-probe",
      "same-owner"
    );
  }
});

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
    const anchor = Number(document.body.dataset["kpReaderViewportAnchor"] ?? "0.48");
    window.scrollTo(0, readerPosition - window.innerHeight * anchor);
  }, progressPermille);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    String(progressPermille)
  );
}

async function visibleRelationInk(page: Page): Promise<{
  x: number;
  y: number;
  authority: number;
}> {
  return page.locator("[data-kp-reader-equation-stage]").evaluate((stage) => {
    const owner = stage.querySelector<HTMLElement>(
      '[data-kp-reader-equation-material-owner-id="material-owner.relation-persists"]'
    )!;
    const candidates = [
      ...stage.querySelectorAll<HTMLElement>(
        '[data-kp-reader-transition-active="true"] [data-kp-reader-selector-id$=".equals"]'
      ),
      ...owner.querySelectorAll<HTMLElement>(
        '[data-kp-reader-equation-material-fragment-id$=".equals"]'
      )
    ].map((element) => {
      const rect = element.getBoundingClientRect();
      let opacity = 1;
      let current: HTMLElement | null = element;
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
    return {
      x: candidates.reduce((sum, candidate) => sum + candidate.x * candidate.opacity, 0) /
        authority,
      y: candidates.reduce((sum, candidate) => sum + candidate.y * candidate.opacity, 0) /
        authority,
      authority
    };
  });
}
