import { expect, test } from "@playwright/test";

const route = "/reader/radical-succession/?kpMotion=full";

test("radical succession uses one exclusive canonical paint owner", async ({
  page
}) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  await page.goto(route, { waitUntil: "networkidle" });

  const stage = page.locator("[data-kp-reader-equation-stage]");
  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  await scrubber.evaluate((node) => {
    const input = node as HTMLInputElement;
    input.value = "500";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    "500"
  );

  const active = stage.locator(
    '[data-kp-reader-transition-active="true"] [data-kp-reader-fit-surface]'
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-canonical-equation-session-active",
    "true"
  );
  await expect(active).toHaveAttribute(
    "data-kp-reader-canonical-equation-session",
    "active"
  );
  await expect(active.locator(
    ".kp-reader-canonical-equation-session-material"
  )).toHaveCount(1);
  await expect(active.locator(
    ".kp-reader-equation-material:not(.kp-reader-canonical-equation-session-material) > *"
  )).toHaveCount(0);
  await expect(active.locator(
    '[data-kp-reader-native="target"] [data-kp-reader-equation-state]' +
    '[data-kp-semantic-entity-id$=".radical"]'
  )).toHaveCount(1);
  expect(pageErrors.filter(({ name }) => name !== "KpDevReviewClientError"))
    .toEqual([]);
});

test("radical material paint meets native target geometry before handoff", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "networkidle" });
  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  await scrubber.evaluate((node) => {
    const input = node as HTMLInputElement;
    input.value = "999";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    "999"
  );

  const microscope = await page.locator(
    '[data-kp-reader-transition-active="true"] [data-kp-reader-fit-surface]'
  ).evaluate((fitSurface) => {
    const visibleOwners = [
      ...fitSurface.querySelectorAll<HTMLElement>(
        "[data-kp-native-katex-scene-owner]"
      )
    ].filter((owner) => Number(getComputedStyle(owner).opacity) > 0.01);
    const glyphOwner = visibleOwners.find((owner) =>
      owner.dataset["kpEquationMaterialFragmentRole"]?.startsWith("glyph:") &&
      owner.textContent?.trim() === "x"
    )!;
    const pathOwner = visibleOwners.find((owner) =>
      owner.dataset["kpEquationMaterialFragmentRole"]?.startsWith("path:")
    )!;
    const target = fitSurface.querySelector<HTMLElement>(
      '[data-kp-reader-native="target"]'
    )!;
    const targetGlyph = target.querySelector<HTMLElement>(
      '[data-kp-reader-selector-id$=".radicand"] .mathnormal'
    ) ?? target.querySelector<HTMLElement>(
      '[data-kp-reader-selector-id$=".radicand"]'
    )!;
    const targetSvg = target.querySelector<SVGSVGElement>("svg")!;
    const targetPath = targetSvg.querySelector<SVGPathElement>("path")!;
    const glyphVisual = glyphOwner.firstElementChild as HTMLElement;
    const rect = (element: Element) => {
      const value = element.getBoundingClientRect();
      return {
        left: value.left,
        top: value.top,
        width: value.width,
        height: value.height
      };
    };
    const delta = (
      left: ReturnType<typeof rect>,
      right: ReturnType<typeof rect>
    ) => Math.max(
      Math.abs(left.left - right.left),
      Math.abs(left.top - right.top),
      Math.abs(left.width - right.width),
      Math.abs(left.height - right.height)
    );
    const rangeBottom = (element: HTMLElement) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return range.getBoundingClientRect().bottom;
    };
    const fingerprint = (element: HTMLElement) => {
      const style = getComputedStyle(element);
      return [
        style.fontFamily,
        style.fontSize,
        style.fontStyle,
        style.fontWeight,
        style.lineHeight,
        style.letterSpacing
      ].join("|");
    };
    return {
      glyphRectResidualPx: delta(rect(glyphOwner), rect(targetGlyph)),
      glyphBaselineResidualPx: Math.abs(
        rangeBottom(glyphVisual) - rangeBottom(targetGlyph)
      ),
      glyphStyleExact:
        fingerprint(glyphVisual) === fingerprint(targetGlyph),
      pathRectResidualPx: delta(rect(pathOwner), rect(targetSvg)),
      pathDataExact:
        pathOwner.querySelector("path")?.getAttribute("d") ===
        targetPath.getAttribute("d"),
      visibleOwnerCount: visibleOwners.length
    };
  });

  expect(microscope.visibleOwnerCount).toBeGreaterThan(0);
  expect(microscope.glyphRectResidualPx).toBeLessThanOrEqual(0.5);
  expect(microscope.glyphBaselineResidualPx).toBeLessThanOrEqual(2.5);
  expect(microscope.glyphStyleExact).toBe(true);
  expect(microscope.pathRectResidualPx).toBeLessThanOrEqual(0.5);
  expect(microscope.pathDataExact).toBe(true);
});
