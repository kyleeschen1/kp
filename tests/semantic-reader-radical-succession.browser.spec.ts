import { expect, test } from "@playwright/test";

const routePath = "/reader/radical-succession/";
const route = `${routePath}?kpMotion=full`;

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
    const fontBaseline = (element: HTMLElement) => {
      const style = getComputedStyle(element);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;
      context.font = [
        style.fontStyle,
        style.fontWeight,
        style.fontSize,
        style.fontFamily
      ].join(" ");
      const metrics = context.measureText(element.textContent?.trim() ?? "");
      const bounds = element.getBoundingClientRect();
      return bounds.top + bounds.height - metrics.actualBoundingBoxDescent;
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
        fontBaseline(glyphVisual) - fontBaseline(targetGlyph)
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

test("radical direct seek and rewind are history independent", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "networkidle" });
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
      opacity: element.style.opacity,
      transform: element.style.transform
    };
  }));

  await seek(page, scrubber, 300);
  const first = await sample();
  await seek(page, scrubber, 700);
  expect(await sample()).not.toEqual(first);
  await seek(page, scrubber, 300);
  expect(await sample()).toEqual(first);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-playback-direction",
    "rewind"
  );
  for (const progress of [700, 300, 700, 300]) {
    await seek(page, scrubber, progress);
  }
  expect(await sample()).toEqual(first);
});

test("radical reduced and static projections preserve exact endpoints", async ({
  browser
}) => {
  const reduced = await browser.newPage();
  await reduced.goto(`${routePath}?kpMotion=reduced`, {
    waitUntil: "networkidle"
  });
  const body = reduced.locator("body");
  const stage = reduced.locator("[data-kp-reader-equation-stage]");
  const scrubber = reduced.locator("[data-kp-reader-attention-scrubber]");
  await seek(reduced, scrubber, 500);
  await expect(body).toHaveAttribute(
    "data-kp-reader-motion-preference",
    "reduced"
  );
  await expect(body).toHaveAttribute("data-kp-reader-motion-mode", "essential");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-canonical-equation-session-active",
    "true"
  );
  const finite = await stage.locator(
    "[data-kp-native-katex-scene-owner]"
  ).evaluateAll((owners) => owners.every((owner) => {
    const style = (owner as HTMLElement).style;
    return [style.left, style.top, style.width, style.height, style.opacity]
      .every((value) => Number.isFinite(Number.parseFloat(value)));
  }));
  expect(finite).toBe(true);
  await seek(reduced, scrubber, 0);
  await expect(stage.locator('[data-kp-reader-native="source"]'))
    .toHaveCSS("opacity", "1");
  await seek(reduced, scrubber, 1_000);
  await expect(stage.locator('[data-kp-reader-native="target"]'))
    .toHaveCSS("opacity", "1");
  await reduced.close();

  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(routePath);
  await expect(staticPage.getByText(
    "A half power and a square root name the same value"
  )).toBeVisible();
  await expect(staticPage.locator("math")).toHaveCount(3);
  await expect(staticPage.locator(
    "[data-kp-native-katex-scene-owner]"
  )).toHaveCount(0);
  await staticContext.close();
});

test("radical reader preserves semantic DOM focus URLs and learning seams", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "networkidle" });
  const stage = page.locator("[data-kp-reader-equation-stage]");
  const active = stage.locator('[data-kp-reader-transition-active="true"]');
  const material = active.locator(
    ".kp-reader-canonical-equation-session-material"
  );
  const owners = material.locator("[data-kp-native-katex-scene-owner]");
  await expect(material).toHaveAttribute("aria-hidden", "true");
  await expect(material).toHaveAttribute("inert", "");
  expect(await owners.count()).toBeGreaterThan(0);
  for (const owner of await owners.all()) {
    await expect(owner).toHaveAttribute("aria-hidden", "true");
    await expect(owner).toHaveAttribute("inert", "");
  }
  await expect(material.locator([
    "math",
    ".katex-mathml",
    "annotation",
    "[role]",
    "[tabindex]",
    "[href]",
    "[data-kp-reader-selector-id]",
    "[data-kp-semantic-entity-id]"
  ].join(","))).toHaveCount(0);
  const native = active.locator("[data-kp-reader-equation-measurement]");
  expect(await page.locator("math").count()).toBeGreaterThan(0);
  expect(await native.locator(".katex-html").count()).toBeGreaterThan(0);
  expect(await native.locator(
    "[data-kp-reader-selector-id]"
  ).count()).toBeGreaterThan(0);

  const fractionBarLink = page.getByRole("button", {
    name: "fraction bar"
  });
  await fractionBarLink.dispatchEvent("pointerover");
  await expect(stage).toHaveAttribute("data-kp-reader-focus-source", "pointer");
  await expect(native.locator(
    '[data-kp-reader-selector-id$=".exponent-fraction-line"]'
  ).first()).toHaveClass(/kp-reader-semantic-focus/);
  await fractionBarLink.focus();
  await expect(fractionBarLink).toBeFocused();
  await expect(stage).toHaveAttribute("data-kp-reader-focus-source", "keyboard");
  await expect(material.locator(".kp-reader-semantic-focus")).toHaveCount(0);

  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  await seek(page, scrubber, 643);
  await expect.poll(() =>
    new URL(page.url()).searchParams.get("kpProgress")
  ).toBe("643");
  const share = page.locator("[data-kp-reader-share]");
  await expect.poll(async () =>
    new URL((await share.getAttribute("href"))!).searchParams.get("kpProgress")
  ).toBe("643");
  expect(new URL((await share.getAttribute("href"))!).pathname)
    .toBe(routePath);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    "643"
  );

  // The reader reuses the generated card/export authority; it does not fork
  // that contract into route-owned Cloze or export markup.
  await expect(page.locator("[data-kp-cloze], [data-kp-export-artifact]"))
    .toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-responsive-projection",
    "fallback"
  );
  await expect(page.getByRole("heading", {
    name: "Follow the notation change"
  })).toBeVisible();
  await expect(page.getByRole("navigation", {
    name: "Explanation controls"
  })).toBeHidden();
});

async function seek(
  page: import("@playwright/test").Page,
  scrubber: import("@playwright/test").Locator,
  progress: number
): Promise<void> {
  await scrubber.evaluate((element, value) => {
    const input = element as HTMLInputElement;
    input.value = String(value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, progress);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    String(progress)
  );
}
