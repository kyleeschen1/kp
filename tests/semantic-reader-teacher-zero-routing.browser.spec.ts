import { expect, test, type Page } from "@playwright/test";

const route = (progress: number) =>
  "/reader/solve-x/teacher-zero/" +
  "?kpLesson=lesson.solve-x.x-plus-3.teacher-zero&kpVersion=1" +
  `&kpProgress=${progress}`;

test("teacher URL restores the explicit semantic zero beat", async ({ page }) => {
  await page.goto(route(500));

  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-document-id",
    "lesson.solve-x.x-plus-3.teacher-zero"
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-lesson-variant",
    "teacher-zero"
  );
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", "500");
  await expect(page.locator("[data-kp-beat]")).toHaveCount(5);
  await expect(page.locator('[data-kp-beat="beat.make-zero"]')).toContainText(
    "x plus zero equals seven minus three"
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-transition",
    "transform.linear-solve.remove-left-zero"
  );
  await expect(page.locator(
    '[data-kp-reader-transition-active="true"] ' +
    '[data-kp-reader-equation-state="equation.linear-solve.teacher-zero"]'
  ).first()).toHaveText("x+0=7−3");
  await expect(page.locator("[data-kp-reader-share]")).toHaveAttribute(
    "href",
    /kpLesson=lesson\.solve-x\.x-plus-3\.teacher-zero/
  );
});

test("teacher beat reloads and rewinds through its own URL", async ({ page }) => {
  await page.goto(route(750));
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", "750");
  await page.reload();
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", "750");

  await seekByScroll(page, 500);
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", "500");
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-playback-direction",
    "rewind"
  );
  await expect(page.locator(".kp-reader-mode")).toHaveAttribute(
    "href",
    /\/reader\/solve-x\/\?kpLesson=lesson\.solve-x\.x-plus-3/
  );
});

async function seekByScroll(
  page: Page,
  progressPermille: number
): Promise<void> {
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
}

test("streamlined lesson links to the teacher zero moment", async ({ page }) => {
  await page.goto(
    "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=667"
  );
  await expect(page.locator(".kp-reader-mode")).toHaveAttribute(
    "href",
    /\/reader\/solve-x\/teacher-zero\/\?kpLesson=lesson\.solve-x\.x-plus-3\.teacher-zero/
  );
});

test("teacher route remains searchable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(route(500));
    const text = await page.locator("body").textContent();
    expect(text).toContain("Make the zero visible");
    expect(text).toContain("x plus zero equals seven minus three");
    const latex = await page.locator(
      'annotation[encoding="application/x-tex"]'
    ).allTextContents();
    for (const expected of [
      "x + 3 = 7",
      "x + 3 - 3 = 7 - 3",
      "x + 0 = 7 - 3",
      "x = 7 - 3",
      "x = 4"
    ]) {
      expect(latex).toContain(expected);
    }
  } finally {
    await context.close();
  }
});
