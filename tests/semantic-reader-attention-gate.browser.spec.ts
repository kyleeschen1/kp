import { expect, test, type Page } from "@playwright/test";

const route = (progress: number) =>
  "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1" +
  `&kpProgress=${progress}`;

test("wide solve-x transfers attention through one solid phase at a time", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const sample of [
    { progress: 25, phase: "attention.read.orient", kind: "orient", target: "prose", gate: "hold", visual: 0 },
    { progress: 150, phase: "attention.subtract.act", kind: "act", target: "visual", gate: "play", visual: 162.23076923076923 },
    { progress: 275, phase: "attention.subtract.settle", kind: "settle", target: "prose", gate: "hold", visual: 333 },
    { progress: 320, phase: "attention.subtract.inspect", kind: "inspect", target: "correspondence", gate: "hold", visual: 333 },
    { progress: 500, phase: "attention.cancel.act", kind: "act", target: "visual", gate: "play", visual: 531.5945945945946 },
    { progress: 650, phase: "attention.cancel.inspect", kind: "inspect", target: "correspondence", gate: "hold", visual: 667 },
    { progress: 700, phase: "attention.solve.orient", kind: "orient", target: "prose", gate: "hold", visual: 667 },
    { progress: 980, phase: "attention.solve.inspect", kind: "inspect", target: "correspondence", gate: "hold", visual: 1_000 }
  ] as const) {
    await page.goto(route(sample.progress));
    const body = page.locator("body");
    await expect(body).toHaveAttribute("data-kp-reader-progress", String(sample.progress));
    await expect(body).toHaveAttribute("data-kp-reader-attention-phase", sample.phase);
    await expect(body).toHaveAttribute("data-kp-reader-attention-kind", sample.kind);
    await expect(body).toHaveAttribute("data-kp-reader-attention-target", sample.target);
    await expect(body).toHaveAttribute("data-kp-reader-attention-motion-gate", sample.gate);
    expect(Number(await body.getAttribute("data-kp-reader-visual-progress")))
      .toBeCloseTo(sample.visual, 8);
    await expect(page.locator('[data-kp-attention-phase-active="true"]')).toHaveCount(1);
    await expect(page.locator(`[data-kp-attention-phase="${sample.phase}"]`))
      .toHaveAttribute("data-kp-attention-phase-active", "true");
    await expect.poll(() => new URL(page.url()).searchParams.get("kpProgress"))
      .toBe(String(sample.progress));
  }

  const salience = await page.locator(
    '.kp-animation-story[data-kp-attention="phased-attention-v1"] [data-kp-beat]'
  ).evaluateAll((elements) => elements.map((element) => ({
    opacity: getComputedStyle(element).opacity,
    transitionDuration: getComputedStyle(element).transitionDuration
  })));
  expect(salience.every(({ opacity }) => opacity === "1")).toBe(true);
  expect(salience.every(({ transitionDuration }) => transitionDuration === "0s")).toBe(true);
});

test("attention holds and active identity retrace exactly after rewind", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route(275));
  const settled = await attentionFrame(page);
  await seekByScroll(page, 500);
  await seekByScroll(page, 275);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-playback-direction",
    "rewind"
  );
  expect(await attentionFrame(page)).toEqual(settled);
});

test("a lesson without attention keeps the original visual projection", async ({ page }) => {
  await page.goto(
    "/reader/solve-x/teacher-zero/?kpLesson=lesson.solve-x.x-plus-3.teacher-zero" +
    "&kpVersion=1&kpProgress=625"
  );
  const body = page.locator("body");
  await expect(body).not.toHaveAttribute("data-kp-reader-attention-phase", /.+/);
  await expect(body).toHaveAttribute("data-kp-reader-progress", "625");
  await expect(body).toHaveAttribute("data-kp-reader-visual-progress", "625");
});

test("responsive projection changes live without changing the semantic moment", async ({ page }) => {
  await page.setViewportSize({ width: 881, height: 844 });
  await page.goto(route(500));
  const body = page.locator("body");
  await expect(body).toHaveAttribute(
    "data-kp-reader-responsive-projection",
    "wide-scrollytelling"
  );
  const before = await attentionFrame(page);

  await page.setViewportSize({ width: 880, height: 844 });
  await expect(body).toHaveAttribute(
    "data-kp-reader-responsive-projection",
    "focus-stepper"
  );
  expect(await attentionFrame(page)).toEqual(before);

  await page.setViewportSize({ width: 881, height: 844 });
  await expect(body).toHaveAttribute(
    "data-kp-reader-responsive-projection",
    "wide-scrollytelling"
  );
  expect(await attentionFrame(page)).toEqual(before);
});

async function attentionFrame(page: Page): Promise<unknown> {
  return page.locator("body").evaluate((body) => ({
    semantic: body.dataset["kpReaderProgress"],
    visual: body.dataset["kpReaderVisualProgress"],
    phase: body.dataset["kpReaderAttentionPhase"],
    kind: body.dataset["kpReaderAttentionKind"],
    target: body.dataset["kpReaderAttentionTarget"],
    gate: body.dataset["kpReaderAttentionMotionGate"],
    active: document.querySelector<HTMLElement>(
      '[data-kp-attention-phase-active="true"]'
    )?.dataset["kpAttentionPhase"]
  }));
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
    const anchor = Number(document.body.dataset["kpReaderViewportAnchor"] ?? "0.48");
    window.scrollTo(0, readerPosition - window.innerHeight * anchor);
  }, progressPermille);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    String(progressPermille)
  );
}
