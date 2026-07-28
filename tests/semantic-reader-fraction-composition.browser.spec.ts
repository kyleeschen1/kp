import { expect, test } from "@playwright/test";

const route = (
  progressPermille: number,
  additions: Record<string, string> = {}
) => {
  const parameters = new URLSearchParams({
    kpLesson: "lesson.algebra.fraction-composition",
    kpVersion: "1",
    kpProgress: String(progressPermille),
    kpMotion: "full",
    kpProfile: "standard",
    ...additions
  });
  return `/reader/fraction-composition/?${parameters}`;
};

for (const viewport of [
  { id: "wide", width: 1_100, height: 800 },
  { id: "phone", width: 390, height: 844 }
] as const) {
  test(`fraction composition applies one certified native stage at ${viewport.id} width`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await page.goto(route(538), { waitUntil: "networkidle" });
    const stage = page.locator("[data-kp-reader-equation-stage]");

    await expect(stage).toHaveAttribute(
      "data-kp-reader-canonical-equation-session-active",
      "true"
    );
    const transitions = stage.locator("[data-kp-reader-transition]");
    await expect(transitions).toHaveCount(13);
    await expect(
      transitions.filter({ has: page.locator("[data-kp-reader-fit-surface]") })
    ).toHaveCount(13);
    const layoutEvidence = await transitions.evaluateAll((elements) =>
      elements.map((element) => ({
        transition: element.getAttribute("data-kp-reader-transition"),
        phase: element.getAttribute("data-kp-reader-stage-layout-phase"),
        application: element.getAttribute("data-kp-reader-stage-layout-applied"),
        policy: element.getAttribute("data-kp-reader-stage-layout-policy")
      }))
    );
    expect(layoutEvidence.every(
      ({ transition, phase, application, policy }) =>
        transition === phase &&
        application !== null &&
        application !== "" &&
        policy === (
          viewport.id === "wide"
            ? "single-row"
            : "semantic-two-row-stage"
        )
    ), JSON.stringify(layoutEvidence)).toBe(true);
    const fitEvidence = await transitions.locator(
      "[data-kp-reader-fit-surface]"
    ).evaluateAll((elements) => elements.map((element) => ({
      status: element.getAttribute("data-kp-reader-equation-fit-status"),
      geometry: element.getAttribute(
        "data-kp-reader-equation-fit-geometry-source"
      ),
      scale: Number(
        element.getAttribute("data-kp-reader-equation-fit-scale")
      ),
      wrap: element.getAttribute("data-kp-reader-equation-wrap-allowed")
    })));
    expect(fitEvidence.every(({ status, geometry, scale, wrap }) =>
      (status === "native" || status === "scaled") &&
      geometry === "certified-stage-swept-envelope" &&
      scale >= 0.68 &&
      wrap === "false"
    ), JSON.stringify(fitEvidence)).toBe(true);
    expect(await page.evaluate(() =>
      document.documentElement.scrollWidth <= window.innerWidth + 1
    )).toBe(true);
  });
}

test("fraction fold controls share the semantic clock and stable URL state", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_100, height: 800 });
  await page.goto(route(538), { waitUntil: "domcontentloaded" });
  const body = page.locator("body");
  const stage = page.locator("[data-kp-reader-equation-stage]");
  const mode = page.getByLabel("Evaluation detail", { exact: true });

  await expect(body).toHaveAttribute("data-kp-reader-hydrated", "true");
  await expect(stage).toHaveAttribute("data-kp-reader-fold-mode", "automatic");
  await expect(stage).toHaveAttribute("data-kp-reader-fold-total-beats", "156");
  await expect(
    page.locator(
      "[data-kp-reader-accessible-equation] " +
      "[data-kp-reader-accessible-equation-state]"
    )
  ).toHaveCount(14);
  await expect(
    page.locator(
      "[data-kp-reader-accessible-equation-state][aria-current='step']" +
      "[role='math'][aria-label]"
    )
  ).toHaveCount(1);

  await mode.selectOption("collapsed");
  await expect(stage).toHaveAttribute("data-kp-reader-fold-mode", "collapsed");
  await expect(stage).toHaveAttribute("data-kp-reader-fold-total-beats", "52");
  await expect(page.locator("#kp-reader-fold-status")).toContainText("Folded");
  await expect(page.locator("#kp-reader-fold-status")).toContainText(
    "13 operations"
  );
  await expect.poll(() =>
    new URL(page.url()).searchParams.get("kpFoldMode")
  ).toBe("collapsed");
  expect(new URL(page.url()).searchParams.getAll("kpFold")).toHaveLength(5);

  const subtraction = page.getByRole("button", { name: "Subtract" });
  await subtraction.focus();
  await page.keyboard.press("Space");
  await expect(subtraction).toHaveAttribute("aria-pressed", "true");
  await expect(mode).toHaveValue("pinned");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-fold-pinned",
    "evaluation.fraction-composition.subtract-and-simplify"
  );
  await expect(stage).toHaveAttribute("data-kp-reader-fold-total-beats", "76");
  await expect.poll(() =>
    new URL(page.url()).searchParams.get("kpPin")
  ).toBe("evaluation.fraction-composition.subtract-and-simplify");

  const progressBeforeReload = await body.getAttribute(
    "data-kp-reader-progress"
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Evaluation detail", { exact: true }))
    .toHaveValue("pinned");
  await expect(
    page.getByRole("button", { name: "Subtract" })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(body).toHaveAttribute(
    "data-kp-reader-progress",
    progressBeforeReload ?? "538"
  );
});

test("fraction outline, direct seek, and rewind use exact canonical boundaries", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_100, height: 800 });
  await page.goto(route(769, { kpFoldMode: "expanded" }), {
    waitUntil: "domcontentloaded"
  });
  const body = page.locator("body");
  await expect(body).toHaveAttribute("data-kp-reader-hydrated", "true");

  await page.locator(
    '.kp-lesson-toc a[href="#beat.fraction-composition.difference-simplified"]'
  ).click();
  await expect(body).toHaveAttribute("data-kp-reader-progress", "538");
  await expect.poll(async () => {
    const value = await body.getAttribute("data-kp-reader-review-frame");
    return value === null ? undefined : JSON.parse(value);
  }).toEqual([
    538,
    0,
    expect.any(String),
    expect.any(Array)
  ]);

  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  const seek = async (progress: number) => {
    await scrubber.evaluate((node, next) => {
      const input = node as HTMLInputElement;
      input.value = String(next);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, progress);
    await expect(body).toHaveAttribute(
      "data-kp-reader-progress",
      String(progress)
    );
    return body.getAttribute("data-kp-reader-review-frame");
  };
  const forward = await seek(620);
  await seek(900);
  const rewind = await seek(620);
  expect(rewind).toBe(forward);
  await expect(
    page.locator("[data-kp-reader-transition-active='true']")
  ).toHaveCount(1);
});
