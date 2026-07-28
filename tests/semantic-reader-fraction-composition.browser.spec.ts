import { expect, test } from "@playwright/test";

const route = (progressPermille: number) => {
  const parameters = new URLSearchParams({
    kpLesson: "lesson.algebra.fraction-composition",
    kpVersion: "1",
    kpProgress: String(progressPermille),
    kpMotion: "full",
    kpProfile: "standard"
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
