import { expect, test } from "@playwright/test";

const route =
  "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1" +
  "&kpProgress=500";
const otherRoute =
  "/reader/solve-x/teacher-zero/?kpLesson=" +
  "lesson.solve-x.x-plus-3.teacher-zero&kpVersion=1&kpProgress=500";

test("one gold reader card uses the canonical equation session", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(route);

  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-canonical-equation-session",
    "transform.linear-solve.cancel-left-additive-inverse"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-canonical-equation-session-active",
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
    "data-kp-reader-canonical-equation-session",
    "active"
  );
  await expect(fitSurface).toHaveAttribute(
    "data-kp-reader-canonical-equation-session-lifecycle",
    "renderer-session"
  );
  await expect(fitSurface).toHaveAttribute(
    "data-kp-reader-canonical-equation-session-owner",
    "material-scene"
  );
  expect(Number(await fitSurface.getAttribute(
    "data-kp-reader-canonical-equation-session-track-count"
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

test("default reader canonical equation session supports reduced motion", async ({
  page
}) => {
  await page.goto(`${route}&kpMotion=reduced`);
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-canonical-equation-session-active",
    "true"
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-motion-preference",
    "reduced"
  );

  await page.goto(otherRoute);
  await expect(stage).not.toHaveAttribute(
    "data-kp-reader-canonical-equation-session"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-canonical-equation-session-active",
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
    await expect(page.locator("body")).toHaveAttribute(
      "data-kp-reader-progress",
      String(progress)
    );
    await expect(page.locator("[data-kp-reader-equation-stage]"))
      .toHaveAttribute(
        "data-kp-reader-canonical-equation-session-active",
        "true"
      );
  };

  await seek(475);
  const first = await sample();
  await seek(525);
  expect(await sample()).not.toEqual(first);
  await seek(475);
  expect(await sample()).toEqual(first);
});

test("moving reader paint is inert while native DOM keeps semantic authority", async ({
  page
}) => {
  await page.goto(route);
  const active = page.locator('[data-kp-reader-transition-active="true"]');
  const layer = active.locator("[data-kp-editor-equation-material-layer]");
  const owners = layer.locator("[data-kp-native-katex-scene-owner]");
  await expect(layer).toHaveAttribute("aria-hidden", "true");
  await expect(layer).toHaveAttribute("inert", "");
  expect(await owners.count()).toBeGreaterThan(0);
  for (const owner of await owners.all()) {
    await expect(owner).toHaveAttribute("aria-hidden", "true");
    await expect(owner).toHaveAttribute("inert", "");
  }
  await expect(layer.locator([
    "[data-kp-reader-equation-anchor-id]",
    "[data-kp-reader-selector-id]",
    "[data-kp-semantic-entity-id]",
    "[data-kp-presentation-group-id]",
    "[data-kp-focus]",
    "[role]",
    "[tabindex]",
    "[href]",
    "[id]"
  ].join(","))).toHaveCount(0);
  await expect(layer.locator("math, .katex-mathml, annotation")).toHaveCount(0);

  const nativeMeasurement = active.locator(
    "[data-kp-reader-equation-measurement]"
  );
  const nativeAnchors = nativeMeasurement.locator(
    "[data-kp-reader-equation-anchor-id]"
  );
  const nativeSelectors = nativeMeasurement.locator(
    "[data-kp-reader-selector-id]"
  );
  expect(await nativeAnchors.count()).toBeGreaterThan(0);
  expect(await nativeSelectors.count()).toBe(await nativeAnchors.count());
  expect(await nativeMeasurement.locator(".katex-html").count())
    .toBeGreaterThan(0);
  expect(await nativeMeasurement.locator(
    ".kp-reader-semantic-focus"
  ).count()).toBeGreaterThan(0);
  await expect(layer.locator(".kp-reader-semantic-focus")).toHaveCount(0);
  const semanticLink = page.getByRole("button", { name: "the unknown" });
  await expect(semanticLink)
    .toHaveAttribute(
      "title",
      "x stays the same object as the equation changes"
    );
  await semanticLink.dispatchEvent("pointerover");
  await expect(page.locator("[data-kp-reader-equation-stage]"))
    .toHaveAttribute("data-kp-reader-focus-source", "pointer");
  await expect(semanticLink).toHaveClass(/kp-reader-semantic-focus/);
  await expect(layer.locator(".kp-reader-semantic-focus")).toHaveCount(0);
  await semanticLink.focus();
  await expect(semanticLink).toBeFocused();
  await expect(page.locator("[data-kp-reader-equation-stage]"))
    .toHaveAttribute("data-kp-reader-focus-source", "keyboard");
});

test("only the gold reader loads canonical equation session chunks", async ({
  page
}) => {
  const loaded: string[] = [];
  page.on("response", (response) => loaded.push(response.url()));
  await page.goto(otherRoute);
  expect(loaded.some((url) =>
    /reader-canonical-equation-session|native-katex-scene-compositor/.test(url)
  )).toBe(false);

  loaded.length = 0;
  await page.goto(route);
  expect(loaded.some((url) =>
    /reader-canonical-equation-session/.test(url)
  )).toBe(true);
});
