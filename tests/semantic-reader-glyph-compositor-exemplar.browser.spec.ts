import { expect, test } from "@playwright/test";

const route =
  "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1" +
  "&kpProgress=500&kpGlyphCompositor=1";

test("one gold reader card uses the generic glyph compositor session", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(route);

  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-glyph-compositor-exemplar",
    "transform.linear-solve.cancel-left-additive-inverse"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-glyph-compositor-active",
    "true"
  );
  const transition = page.locator(
    '[data-kp-reader-transition-active="true"]'
  );
  await expect(transition).toHaveAttribute(
    "data-kp-reader-transition",
    "transform.linear-solve.cancel-left-additive-inverse"
  );
  const fitSurface = transition.locator("[data-kp-reader-fit-surface]");
  await expect(fitSurface).toHaveAttribute(
    "data-kp-reader-glyph-compositor",
    "active"
  );
  await expect(fitSurface).toHaveAttribute(
    "data-kp-reader-glyph-compositor-lifecycle",
    "renderer-session"
  );
  await expect(fitSurface).toHaveAttribute(
    "data-kp-reader-glyph-compositor-owner",
    "material-scene"
  );
  expect(Number(await fitSurface.getAttribute(
    "data-kp-reader-glyph-compositor-track-count"
  ))).toBeGreaterThan(0);
  await expect(
    fitSurface.locator("[data-kp-native-katex-scene-owner]")
  ).not.toHaveCount(0);
  await expect(
    page.locator("[data-kp-reader-equation-material-owner-id]")
  ).toHaveCount(0);
  expect(errors.filter((message) =>
    !message.includes("Visual review request failed with status 502")
  )).toEqual([]);
});

test("reader glyph compositor is opt-in and supports reduced motion", async ({
  page
}) => {
  await page.goto(`${route}&kpMotion=reduced`);
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-glyph-compositor-active",
    "true"
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-motion-preference",
    "reduced"
  );

  await page.goto(route.replace("&kpGlyphCompositor=1", ""));
  await expect(stage).not.toHaveAttribute(
    "data-kp-reader-glyph-compositor-exemplar"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-glyph-compositor-active",
    "false"
  );
  await expect(
    page.locator("[data-kp-editor-equation-material-layer]")
  ).toHaveCount(0);
});

test("reader compositor direct seek and rewind return to the same paint frame", async ({
  page
}) => {
  await page.goto(route);
  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  const sample = () => page.locator(
    '[data-kp-reader-transition-active="true"] [data-kp-native-katex-scene-owner]'
  ).evaluateAll((owners) => owners.map((owner) => {
    const element = owner as HTMLElement;
    return {
      id: element.dataset["kpEquationMaterialOwnerId"],
      left: element.style.left,
      top: element.style.top,
      width: element.style.width,
      height: element.style.height,
      opacity: element.style.opacity
    };
  }));
  const seek = async (progress: number) => {
    await scrubber.evaluate((element, value) => {
      const input = element as HTMLInputElement;
      input.value = String(value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, progress);
    await expect(page.locator("[data-kp-reader-equation-stage]"))
      .toHaveAttribute("data-kp-reader-glyph-compositor-active", "true");
  };

  await seek(475);
  const first = await sample();
  await seek(525);
  expect(await sample()).not.toEqual(first);
  await seek(475);
  expect(await sample()).toEqual(first);
});
