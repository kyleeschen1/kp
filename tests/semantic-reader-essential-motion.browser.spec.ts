import { expect, test } from "@playwright/test";

test("system reduced motion retains algebraic causality without flourish", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(
    "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=553"
  );
  const body = page.locator("body");
  await expect(body).toHaveAttribute("data-kp-reader-motion-preference", "system");
  await expect(body).toHaveAttribute("data-kp-reader-motion-mode", "essential");
  await expect(body).toHaveAttribute("data-kp-reader-progress", "553");

  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-presentation-recipe",
    "continuity-v1"
  );
  await expect(stage).not.toHaveAttribute("data-kp-reader-annihilation-witness-readable");
  const witness = page.locator("[data-kp-reader-annihilation-witness]");
  await expect(witness).toHaveCSS("opacity", "0");
  await expect(witness).toHaveCSS("filter", "none");
  const movingFragments = page.locator(
    '[data-kp-native-katex-scene-owner][data-kp-reader-motion-guided="true"]'
  );
  const transforms = await movingFragments.evaluateAll((elements) =>
    elements.map((element) => (element as HTMLElement).style.transform)
  );
  expect(transforms.length).toBeGreaterThanOrEqual(4);
  expect(transforms.every((transform) => !transform.includes("translate(0px, 0px)")))
    .toBe(true);
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-effective-depth-recipe",
    "flat-v1"
  );
  await expect(movingFragments.first()).not.toHaveAttribute(
    "data-kp-reader-equation-semantic-depth",
    /.+/
  );
  await expect(movingFragments.first()).toHaveCSS("filter", "none");
});

test("explicit full motion restores depth under a reduced system preference", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(
    "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1" +
    "&kpProgress=517&kpMotion=full"
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-motion-mode",
    "continuous"
  );
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-effective-depth-recipe",
    "semantic-depth-v1"
  );
  const elevated = page.locator(
    '[data-kp-native-katex-scene-owner]' +
    '[data-kp-reader-equation-semantic-depth]'
  ).first();
  await expect(elevated).toHaveAttribute(
    "data-kp-reader-equation-semantic-depth",
    /.+/
  );
  await expect(elevated).toHaveCSS("filter", /drop-shadow/);
});

test("essential causal motion retraces exactly on rewind", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(
    "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=480"
  );
  await seekByScroll(page, 520);
  const forward = await cancellationPose(page);
  await seekByScroll(page, 560);
  await seekByScroll(page, 520);
  const rewound = await cancellationPose(page);
  expect(rewound).toEqual(forward);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-playback-direction",
    "rewind"
  );
});

async function cancellationPose(page: import("@playwright/test").Page) {
  return page.locator(
    '[data-kp-native-katex-scene-owner][data-kp-reader-motion-guided="true"]'
  ).evaluateAll((elements) => elements.map((element) => ({
    transform: (element as HTMLElement).style.transform,
    opacity: (element as HTMLElement).style.opacity,
    filter: (element as HTMLElement).style.filter
  })));
}

async function seekByScroll(
  page: import("@playwright/test").Page,
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
    const anchor = Number(document.body.dataset["kpReaderViewportAnchor"] ?? "0.48");
    window.scrollTo(0, readerPosition - window.innerHeight * anchor);
  }, progressPermille);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    String(progressPermille)
  );
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}
