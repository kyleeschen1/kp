import { expect, test } from "@playwright/test";

const routePath = "/reader/radical-succession/";
const route = `${routePath}?kpMotion=full`;

test("radical endpoint ownership is continuous in paint space", async ({
  browser
}) => {
  for (const deviceScaleFactor of [1, 2]) {
    const context = await browser.newContext({
      deviceScaleFactor,
      viewport: { width: 800, height: 450 }
    });
    const page = await context.newPage();
    await assertRadicalEndpointPaintContinuity(page, deviceScaleFactor);
    await context.close();
  }
});

async function assertRadicalEndpointPaintContinuity(
  page: import("@playwright/test").Page,
  deviceScaleFactor: number
): Promise<void> {
  await page.goto(route, { waitUntil: "networkidle" });
  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  const fitSurface = page.locator(
    '[data-kp-reader-transition-active="true"] [data-kp-reader-fit-surface]'
  );

  // Warm the asynchronous structural capture, then compare the last native
  // frame with the first material frame rather than trusting layout boxes.
  await seek(page, scrubber, 500);
  await expect(fitSurface).toHaveAttribute(
    "data-kp-native-katex-structural-succession-status",
    "ready"
  );
  await seek(page, scrubber, 0);

  const surfaceClip = await fitSurface.evaluate((surface) => {
    const rect = surface.getBoundingClientRect();
    return {
      x: Math.floor(rect.left),
      y: Math.floor(rect.top),
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height)
    };
  });
  const structuralPaint = [
    "[data-kp-structural-succession-capture]",
    "[data-kp-native-katex-structural-succession]",
    "[data-kp-radical-native-visual]"
  ];
  const sourceXClip = await clipElement(
    fitSurface,
    '[data-kp-reader-native="source"] ' +
      '[data-kp-reader-selector-id$=".base"]',
    6
  );
  const sourceStructureClip = await clipElement(
    fitSurface,
    '[data-kp-reader-native="source"] ' +
      '[data-kp-structural-succession-capture="source"]',
    6
  );
  const sourceNativeX = localizeInkRect(
    await captureInk(page, sourceXClip, structuralPaint),
    sourceXClip,
    surfaceClip
  );
  const sourceNativeStructureSample = await captureInk(
    page,
    sourceStructureClip,
    ['[data-kp-reader-native="source"] ' +
      '[data-kp-reader-selector-id$=".base"]']
  );
  const sourceNativeStructure = localizeInkRect(
    sourceNativeStructureSample,
    sourceStructureClip,
    surfaceClip
  );

  await seek(page, scrubber, 1);
  const sourceMaterialXClip = await clipMaterialGlyph(fitSurface, "x");
  const sourceGlyphPaint = await measureSourceGlyphPaintAlignment(
    fitSurface,
    '[data-kp-reader-selector-id$=".base"]',
    "x"
  );
  const sourceMaterialX = localizeInkRect(
    await captureInk(page, sourceMaterialXClip, structuralPaint),
    sourceMaterialXClip,
    surfaceClip
  );
  const sourceMaterialStructureComparison =
    await fitSurface.evaluate(async (surface) => {
    const moduleUrl =
      "/src/rendering/native-katex-structural-succession-renderer.ts";
    const comparison = (
      await import(/* @vite-ignore */ moduleUrl)
    ).measureKpNativeKatexStructuralSuccessionInk(surface as HTMLElement);
    const canvas = surface.querySelector<HTMLCanvasElement>(
      "[data-kp-native-katex-structural-succession]"
    );
    return {
      ...(comparison ?? {}),
      canvases: [...surface.querySelectorAll<HTMLCanvasElement>("canvas")]
        .map((candidate) => ({
          className: candidate.className,
          opacity: getComputedStyle(candidate).opacity,
          structural:
            candidate.dataset["kpNativeKatexStructuralSuccession"] ?? null,
          legacy: candidate.dataset["kpEditorRadicalWebglMorph"] ?? null
        })),
      owners: [...surface.querySelectorAll<HTMLElement>(
        "[data-kp-native-katex-scene-owner]"
      )].map((owner) => ({
        text: owner.textContent?.trim() ?? "",
        role: owner.dataset["kpEquationMaterialFragmentRole"] ?? null,
        opacity: getComputedStyle(owner).opacity,
        fontFamily: owner.firstElementChild instanceof HTMLElement
          ? getComputedStyle(owner.firstElementChild).fontFamily
          : null
      })),
      sourceCapture:
        canvas?.dataset["kpNativeKatexStructuralSourceCapture"] ?? null,
      sourceFont:
        canvas?.dataset["kpNativeKatexStructuralSourceFont"] ?? null,
      paintOwner:
        (surface as HTMLElement).dataset[
          "kpNativeKatexStructuralPaintOwner"
        ] ?? null
    };
  });
  const sourceMaterialStructureSample = await captureInk(
    page,
    sourceStructureClip,
    [
      "[data-kp-reader-native]",
      "[data-kp-native-katex-structural-succession]"
    ]
  );
  const sourceMaterialStructure = localizeInkRect(
    sourceMaterialStructureSample,
    sourceStructureClip,
    surfaceClip
  );
  await seek(page, scrubber, 60);
  await expect(fitSurface).toHaveAttribute(
    "data-kp-native-katex-structural-succession-status",
    "ready"
  );
  await expect(fitSurface.locator(
    "[data-kp-native-katex-structural-succession]"
  )).toHaveCSS("opacity", "1");
  const morphStartStructureSample = await captureInk(
    page,
    sourceStructureClip,
    [
      "[data-kp-reader-native]",
      "[data-kp-native-katex-scene-owner]"
    ]
  );
  const morphStartStructure = localizeInkRect(
    morphStartStructureSample,
    sourceStructureClip,
    surfaceClip
  );
  const morphStartOwnership = await fitSurface.evaluate(async (surface) => {
    const structuralUrl =
      "/src/rendering/native-katex-structural-succession-renderer.ts";
    const structural = await import(/* @vite-ignore */ structuralUrl);
    const canvas = surface.querySelector<HTMLCanvasElement>(
      "[data-kp-native-katex-structural-succession]"
    );
    return {
      canvasOpacity: canvas === null
        ? null
        : getComputedStyle(canvas).opacity,
      paintOwner:
        (surface as HTMLElement).dataset[
          "kpNativeKatexStructuralPaintOwner"
        ] ?? null,
      sourceCapture:
        canvas?.dataset["kpNativeKatexStructuralSourceCapture"] ?? null,
      sourceFont:
        canvas?.dataset["kpNativeKatexStructuralSourceFont"] ?? null,
      devicePixelRatio: window.devicePixelRatio,
      maximumGeometryResidualPx:
        structural.measureKpNativeKatexStructuralSuccessionInk(
          surface as HTMLElement
        )?.maximumGeometryResidualPx ?? null
    };
  });
  await seek(page, scrubber, 999);
  const targetMaterialXClip = await clipMaterialGlyph(fitSurface, "x");
  const targetMaterialX = localizeInkRect(
    await captureInk(page, targetMaterialXClip, structuralPaint),
    targetMaterialXClip,
    surfaceClip
  );
  await seek(page, scrubber, 1_000);
  const targetNativeXClip = await clipElement(
    fitSurface,
    '[data-kp-reader-native="target"] ' +
      '[data-kp-reader-selector-id$=".radicand"]',
    6
  );
  const targetNativeX = localizeInkRect(
    await captureInk(page, targetNativeXClip, structuralPaint),
    targetNativeXClip,
    surfaceClip
  );

  await seek(page, scrubber, 999);
  const rewindTargetMaterialXClip = await clipMaterialGlyph(fitSurface, "x");
  const rewindTargetMaterialX = localizeInkRect(
    await captureInk(page, rewindTargetMaterialXClip, structuralPaint),
    rewindTargetMaterialXClip,
    surfaceClip
  );
  await seek(page, scrubber, 1);
  const rewindSourceMaterialXClip = await clipMaterialGlyph(fitSurface, "x");
  const rewindSourceMaterialX = localizeInkRect(
    await captureInk(page, rewindSourceMaterialXClip, structuralPaint),
    rewindSourceMaterialXClip,
    surfaceClip
  );
  const rewindSourceStructureSample = await captureInk(
    page,
    sourceStructureClip,
    [
      "[data-kp-reader-native]",
      "[data-kp-native-katex-structural-succession]"
    ]
  );
  const rewindSourceStructureComparison = await fitSurface.evaluate(
    async (surface) => {
      const structuralUrl =
        "/src/rendering/native-katex-structural-succession-renderer.ts";
      const structural = await import(/* @vite-ignore */ structuralUrl);
      return structural.measureKpNativeKatexStructuralSuccessionInk(
        surface as HTMLElement
      );
    }
  );
  const rewindSourceStructure = localizeInkRect(
    rewindSourceStructureSample,
    sourceStructureClip,
    surfaceClip
  );

  const sourceXResidual = inkRectDelta(sourceNativeX, sourceMaterialX);
  const sourceGlyphPaintResidual = inkRectDelta(
    sourceGlyphPaint.native,
    sourceGlyphPaint.material
  );
  const sourceStructureResidual = inkRectDelta(
    sourceNativeStructure,
    sourceMaterialStructure
  );
  const sourceStructureShapeResidual = inkProfileDifference(
    sourceNativeStructureSample,
    sourceMaterialStructureSample
  );
  const morphStartStructureResidual = inkRectDelta(
    sourceNativeStructure,
    morphStartStructure
  );
  const morphStartShapeResidual = inkProfileDifference(
    sourceNativeStructureSample,
    morphStartStructureSample
  );
  const targetXResidual = inkRectDelta(targetMaterialX, targetNativeX);
  const rewindTargetXResidual = inkRectDelta(
    rewindTargetMaterialX,
    targetNativeX
  );
  const rewindSourceXResidual = inkRectDelta(
    sourceNativeX,
    rewindSourceMaterialX
  );
  const rewindSourceStructureResidual = inkRectDelta(
    sourceNativeStructure,
    rewindSourceStructure
  );
  const rewindSourceShapeResidual = inkProfileDifference(
    sourceNativeStructureSample,
    rewindSourceStructureSample
  );
  const evidence = {
    sourceXResidual,
    sourceGlyphPaintResidual,
    sourceGlyphPaint,
    sourceStructureResidual,
    sourceStructureShapeResidual,
    morphStartStructureResidual,
    morphStartShapeResidual,
    morphStartOwnership,
    targetXResidual,
    rewindTargetXResidual,
    rewindSourceXResidual,
    rewindSourceStructureResidual,
    rewindSourceShapeResidual,
    sourceNativeX,
    sourceMaterialX,
    sourceNativeStructure,
    sourceMaterialStructure,
    morphStartStructure,
    targetMaterialX,
    targetNativeX,
    sourceMaterialStructureComparison,
    rewindSourceStructureComparison
  };

  // Screenshots have one physical-pixel edge granularity. The measured-paint
  // law below remains subpixel-strict so this envelope cannot hide bad motion.
  const rasterTolerancePx = 1 / deviceScaleFactor;
  expect(sourceXResidual, JSON.stringify(evidence))
    .toBeLessThanOrEqual(rasterTolerancePx);
  expect(sourceStructureResidual, JSON.stringify(evidence))
    .toBeLessThanOrEqual(rasterTolerancePx);
  expect(sourceGlyphPaintResidual, JSON.stringify(evidence))
    .toBeLessThanOrEqual(0.25);
  expect(sourceGlyphPaint.alignment, JSON.stringify(evidence))
    .toBe("measured-ink");
  expect(sourceStructureShapeResidual, JSON.stringify(evidence))
    .toBeLessThanOrEqual(0.2);
  // A screenshot threshold can include one antialiased pixel on each edge.
  // The renderer-owned paint microscope below remains the exact geometry law.
  expect(morphStartStructureResidual, JSON.stringify(evidence))
    .toBeLessThanOrEqual(2);
  expect(morphStartShapeResidual, JSON.stringify(evidence))
    .toBeLessThanOrEqual(0.2);
  expect(
    morphStartOwnership.maximumGeometryResidualPx,
    JSON.stringify(evidence)
  ).toBeLessThanOrEqual(0.001);
  expect(morphStartOwnership).toMatchObject({
    canvasOpacity: "1",
    paintOwner: "solid-mask-canvas",
    sourceCapture: "document-font-canvas"
  });
  expect(morphStartOwnership.sourceFont).toContain("KaTeX_Main");
  expect(sourceMaterialStructureComparison.sourceCapture)
    .toBe("document-font-canvas");
  expect(sourceMaterialStructureComparison.sourceFont)
    .toContain("KaTeX_Main");
  expect(sourceMaterialStructureComparison.canvases).toHaveLength(1);
  expect(sourceMaterialStructureComparison.canvases[0]?.structural)
    .not.toBeNull();
  expect(sourceMaterialStructureComparison.canvases[0]?.legacy).toBeNull();
  expect(sourceMaterialStructureComparison.canvases[0]?.opacity).toBe("0");
  expect(sourceMaterialStructureComparison.owners.filter(
    ({ opacity, text }: { readonly opacity: string; readonly text: string }) =>
      Number(opacity) > 0.01 && (text === "1" || text === "2")
  ).every(({
    fontFamily
  }: { readonly fontFamily: string | null }) =>
    fontFamily?.includes("KaTeX_Main")
  ))
    .toBe(true);
  expect(sourceMaterialStructureComparison.paintOwner)
    .toBe("native-material-clones");
  expect(targetXResidual, JSON.stringify(evidence))
    .toBeLessThanOrEqual(rasterTolerancePx);
  expect(rewindTargetXResidual, JSON.stringify(evidence))
    .toBeLessThanOrEqual(rasterTolerancePx);
  expect(rewindSourceXResidual, JSON.stringify(evidence))
    .toBeLessThanOrEqual(rasterTolerancePx);
  expect(rewindSourceStructureResidual, JSON.stringify(evidence))
    .toBeLessThanOrEqual(rasterTolerancePx);
  expect(rewindSourceShapeResidual, JSON.stringify(evidence))
    .toBeLessThanOrEqual(0.2);
  expect(
    rewindSourceStructureComparison?.maximumGeometryResidualPx,
    JSON.stringify(evidence)
  ).toBeLessThanOrEqual(0.001);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-playback-direction",
    "rewind"
  );
}

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
  ).evaluate(async (fitSurface) => {
    const visibleOwners = [
      ...fitSurface.querySelectorAll<HTMLElement>(
        "[data-kp-native-katex-scene-owner]"
      )
    ].filter((owner) => Number(getComputedStyle(owner).opacity) > 0.01);
    const glyphOwner = visibleOwners.find((owner) =>
      owner.dataset["kpEquationMaterialFragmentRole"]?.startsWith("glyph:") &&
      owner.textContent?.trim() === "x"
    )!;
    const target = fitSurface.querySelector<HTMLElement>(
      '[data-kp-reader-native="target"]'
    )!;
    const targetGlyph = target.querySelector<HTMLElement>(
      '[data-kp-reader-selector-id$=".radicand"] .mathnormal'
    ) ?? target.querySelector<HTMLElement>(
      '[data-kp-reader-selector-id$=".radicand"]'
    )!;
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
      const marker = document.createElement("span");
      marker.setAttribute("aria-hidden", "true");
      marker.style.cssText = [
        "display:inline-block",
        "width:0",
        "height:0",
        "padding:0",
        "margin:0",
        "border:0",
        "line-height:0",
        "vertical-align:baseline"
      ].join(";");
      element.append(marker);
      try {
        return marker.getBoundingClientRect().top;
      } finally {
        marker.remove();
      }
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
      structuralInk: await (async () => {
        const moduleUrl =
          "/src/rendering/native-katex-structural-succession-renderer.ts";
        return (
          await import(/* @vite-ignore */ moduleUrl)
        ).measureKpNativeKatexStructuralSuccessionInk(
          fitSurface as HTMLElement
        );
      })(),
      structuralStrategy: (fitSurface as HTMLElement).dataset[
        "kpNativeKatexStructuralSuccessionStrategy"
      ],
      structuralStatus: (fitSurface as HTMLElement).dataset[
        "kpNativeKatexStructuralSuccessionStatus"
      ],
      visibleOwnerCount: visibleOwners.length
    };
  });

  expect(microscope.visibleOwnerCount).toBeGreaterThan(0);
  expect(microscope.glyphRectResidualPx).toBeLessThanOrEqual(0.5);
  expect(microscope.glyphBaselineResidualPx).toBeLessThanOrEqual(2.5);
  expect(microscope.glyphStyleExact).toBe(true);
  expect(microscope.structuralStrategy).toBe("solid-mask-succession");
  expect(microscope.structuralStatus).toBe("ready");
  expect(microscope.structuralInk).toBeDefined();
  expect(microscope.structuralInk?.maximumGeometryResidualPx)
    .toBeLessThanOrEqual(0.5);
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
  const activeFit = stage.locator(
    '[data-kp-reader-transition-active="true"] [data-kp-reader-fit-surface]'
  );
  await expect(activeFit).toHaveAttribute(
    "data-kp-native-katex-structural-succession-strategy",
    "checkpoint-settlement"
  );
  await expect(activeFit).toHaveAttribute(
    "data-kp-native-katex-structural-succession-status",
    "unavailable"
  );
  await expect(activeFit.locator('[data-kp-reader-native="source"]'))
    .toHaveCSS("opacity", "1");
  await expect(activeFit.locator(
    "[data-kp-native-katex-structural-succession]"
  )).toHaveCount(0);
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

test("structural WebGL leases cap contexts and recover from native fallback", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "networkidle" });
  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  const fitSurface = page.locator(
    '[data-kp-reader-transition-active="true"] [data-kp-reader-fit-surface]'
  );
  await seek(page, scrubber, 500);
  await expect(fitSurface).toHaveAttribute(
    "data-kp-native-katex-structural-succession-status",
    "ready"
  );

  const steadyState = await fitSurface.evaluate(async () => {
    const poolUrl = "/src/rendering/webgl-context-lease-pool.ts";
    const pool = await import(/* @vite-ignore */ poolUrl);
    let webglRequests = 0;
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      contextId: string,
      ...args: unknown[]
    ) {
      if (contextId === "webgl") webglRequests += 1;
      return original.call(this, contextId, ...args);
    } as typeof HTMLCanvasElement.prototype.getContext;
    try {
      const input = document.querySelector<HTMLInputElement>(
        "[data-kp-reader-attention-scrubber]"
      );
      if (input === null) throw new Error("Missing radical scrubber.");
      for (const progress of [501, 502, 503]) {
        input.value = String(progress);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    } finally {
      HTMLCanvasElement.prototype.getContext = original;
    }
    return {
      webglRequests,
      snapshot: pool.inspectKpWebglContextLeasePool(document)
    };
  });
  expect(steadyState).toEqual({
    webglRequests: 0,
    snapshot: { limit: 2, active: 1, waiting: 0 }
  });

  const saturated = await fitSurface.evaluate(async (surface) => {
    const poolUrl = "/src/rendering/webgl-context-lease-pool.ts";
    const structuralUrl =
      "/src/rendering/native-katex-structural-succession-renderer.ts";
    const pool = await import(/* @vite-ignore */ poolUrl);
    const structural = await import(/* @vite-ignore */ structuralUrl);
    structural.disposeKpNativeKatexStructuralSuccession(
      surface as HTMLElement
    );
    const canvases = [0, 1].map(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 2;
      canvas.height = 2;
      canvas.hidden = true;
      document.body.append(canvas);
      return canvas;
    });
    const acquisitions = canvases.map((canvas) =>
      pool.acquireKpWebglContextLease({ canvas })
    );
    if (acquisitions.some(({ status }) => status !== "acquired")) {
      throw new Error("Could not saturate the structural WebGL lease pool.");
    }
    const held = acquisitions.flatMap((acquisition) =>
      acquisition.status === "acquired" ? [acquisition.lease] : []
    );
    (window as typeof window & {
      __kpHeldStructuralWebglLeases?: readonly {
        readonly release: () => void;
      }[];
      __kpHeldStructuralWebglCanvases?: readonly HTMLCanvasElement[];
    }).__kpHeldStructuralWebglLeases = held;
    (window as typeof window & {
      __kpHeldStructuralWebglCanvases?: readonly HTMLCanvasElement[];
    }).__kpHeldStructuralWebglCanvases = canvases;
    return pool.inspectKpWebglContextLeasePool(document);
  });
  expect(saturated).toEqual({ limit: 2, active: 2, waiting: 0 });

  await seek(page, scrubber, 500);
  await expect(fitSurface).toHaveAttribute(
    "data-kp-native-katex-structural-succession-reason",
    "webgl-context-capacity"
  );
  await expect(fitSurface).toHaveAttribute(
    "data-kp-reader-canonical-equation-session-owner",
    "source-native"
  );
  await expect(fitSurface.locator(
    "[data-kp-native-katex-structural-succession]"
  )).toHaveCSS("opacity", "0");

  await page.evaluate(() => {
    const holder = window as typeof window & {
      __kpHeldStructuralWebglLeases?: {
        readonly release: () => void;
      }[];
    };
    holder.__kpHeldStructuralWebglLeases?.shift()?.release();
  });
  await expect(fitSurface).toHaveAttribute(
    "data-kp-native-katex-structural-succession-status",
    "ready"
  );
  await expect(fitSurface).toHaveAttribute(
    "data-kp-native-katex-structural-paint-owner",
    "solid-mask-canvas"
  );
  await expect(fitSurface.locator(
    '[data-kp-reader-native="source"]'
  )).toHaveCSS("opacity", "0");
  await expect(fitSurface.locator(
    "[data-kp-native-katex-structural-succession]"
  )).toHaveCSS("opacity", "1");

  const recovered = await page.evaluate(async () => {
    const poolUrl = "/src/rendering/webgl-context-lease-pool.ts";
    const pool = await import(/* @vite-ignore */ poolUrl);
    const holder = window as typeof window & {
      __kpHeldStructuralWebglLeases?: {
        readonly release: () => void;
      }[];
      __kpHeldStructuralWebglCanvases?: readonly HTMLCanvasElement[];
    };
    holder.__kpHeldStructuralWebglLeases?.forEach(({ release }) => release());
    holder.__kpHeldStructuralWebglCanvases?.forEach((canvas) => canvas.remove());
    delete holder.__kpHeldStructuralWebglLeases;
    delete holder.__kpHeldStructuralWebglCanvases;
    await Promise.resolve();
    return pool.inspectKpWebglContextLeasePool(document);
  });
  expect(recovered).toEqual({ limit: 2, active: 1, waiting: 0 });

  await fitSurface.evaluate((surface) => {
    const canvas = surface.querySelector<HTMLCanvasElement>(
      "[data-kp-native-katex-structural-succession]"
    );
    if (canvas === null) throw new Error("Missing structural canvas.");
    canvas.dataset["kpIdleLeaseCanvas"] = "before-release";
  });
  await seek(page, scrubber, 1_000);
  await expect.poll(() => page.evaluate(async () => {
    const poolUrl = "/src/rendering/webgl-context-lease-pool.ts";
    const pool = await import(/* @vite-ignore */ poolUrl);
    return pool.inspectKpWebglContextLeasePool(document);
  })).toEqual({ limit: 2, active: 0, waiting: 0 });

  await page.evaluate(() => {
    const holder = window as typeof window & {
      __kpIdleResumeFrames?: {
        readonly progress: string | null;
        readonly status: string | null;
        readonly retainedReleasedCanvas: boolean;
        readonly contextLost: boolean;
        readonly canvasOpacity: string | null;
        readonly paintOwner: string | null;
      }[];
      __kpIdleResumeListener?: () => void;
    };
    holder.__kpIdleResumeFrames = [];
    holder.__kpIdleResumeListener = () => {
      const surface = document.querySelector<HTMLElement>(
        '[data-kp-reader-transition-active="true"] [data-kp-reader-fit-surface]'
      );
      const canvas = surface?.querySelector<HTMLCanvasElement>(
        "[data-kp-native-katex-structural-succession]"
      );
      const context = canvas?.getContext("webgl");
      holder.__kpIdleResumeFrames?.push({
        progress: document.body.dataset["kpReaderProgress"] ?? null,
        status:
          surface?.dataset["kpNativeKatexStructuralSuccessionStatus"] ?? null,
        retainedReleasedCanvas:
          canvas?.dataset["kpIdleLeaseCanvas"] === "before-release",
        contextLost: context?.isContextLost() ?? true,
        canvasOpacity: canvas === undefined || canvas === null
          ? null
          : getComputedStyle(canvas).opacity,
        paintOwner:
          surface?.dataset["kpNativeKatexStructuralPaintOwner"] ?? null
      });
    };
    window.addEventListener(
      "kp:reader-dev-review-frame",
      holder.__kpIdleResumeListener
    );
  });
  await seek(page, scrubber, 500);
  const resumeFrames = await page.evaluate(() => {
    const holder = window as typeof window & {
      __kpIdleResumeFrames?: readonly {
        readonly progress: string | null;
        readonly status: string | null;
        readonly retainedReleasedCanvas: boolean;
        readonly contextLost: boolean;
        readonly canvasOpacity: string | null;
        readonly paintOwner: string | null;
      }[];
      __kpIdleResumeListener?: () => void;
    };
    if (holder.__kpIdleResumeListener !== undefined) {
      window.removeEventListener(
        "kp:reader-dev-review-frame",
        holder.__kpIdleResumeListener
      );
    }
    const frames = holder.__kpIdleResumeFrames ?? [];
    delete holder.__kpIdleResumeFrames;
    delete holder.__kpIdleResumeListener;
    return frames;
  });
  expect(resumeFrames[0]).toEqual({
    progress: "500",
    status: "ready",
    retainedReleasedCanvas: false,
    contextLost: false,
    canvasOpacity: "1",
    paintOwner: "solid-mask-canvas"
  });
  await expect(fitSurface).toHaveAttribute(
    "data-kp-native-katex-structural-succession-status",
    "ready"
  );
  const currentResume = await fitSurface.evaluate((surface) => {
    const canvas = surface.querySelector<HTMLCanvasElement>(
      "[data-kp-native-katex-structural-succession]"
    );
    const context = canvas?.getContext("webgl");
    return {
      progress: document.body.dataset["kpReaderProgress"] ?? null,
      status:
        (surface as HTMLElement).dataset[
          "kpNativeKatexStructuralSuccessionStatus"
        ] ?? null,
      retainedReleasedCanvas:
        canvas?.dataset["kpIdleLeaseCanvas"] === "before-release",
      contextLost: context?.isContextLost() ?? true,
      canvasOpacity: canvas === undefined || canvas === null
        ? null
        : getComputedStyle(canvas).opacity,
      paintOwner:
        (surface as HTMLElement).dataset[
          "kpNativeKatexStructuralPaintOwner"
        ] ?? null
    };
  });
  expect(currentResume).toEqual({
    progress: "500",
    status: "ready",
    retainedReleasedCanvas: false,
    contextLost: false,
    canvasOpacity: "1",
    paintOwner: "solid-mask-canvas"
  });
  await expect.poll(() => page.evaluate(async () => {
    const poolUrl = "/src/rendering/webgl-context-lease-pool.ts";
    const pool = await import(/* @vite-ignore */ poolUrl);
    return pool.inspectKpWebglContextLeasePool(document);
  })).toEqual({ limit: 2, active: 1, waiting: 0 });
  const resumedAfterIdleRelease = await fitSurface.evaluate(async (surface) => {
    const structuralUrl =
      "/src/rendering/native-katex-structural-succession-renderer.ts";
    const structural = await import(/* @vite-ignore */ structuralUrl);
    const canvas = surface.querySelector<HTMLCanvasElement>(
      "[data-kp-native-katex-structural-succession]"
    );
    const context = canvas?.getContext("webgl");
    return {
      retainedReleasedCanvas:
        canvas?.dataset["kpIdleLeaseCanvas"] === "before-release",
      contextLost: context?.isContextLost() ?? true,
      canvasOpacity: canvas === null
        ? null
        : getComputedStyle(canvas).opacity,
      paintOwner:
        (surface as HTMLElement).dataset[
          "kpNativeKatexStructuralPaintOwner"
        ] ?? null,
      hasStructuralInk:
        structural.measureKpNativeKatexStructuralSuccessionInk(
          surface as HTMLElement
        ) !== undefined
    };
  });
  expect(resumedAfterIdleRelease).toEqual({
    retainedReleasedCanvas: false,
    contextLost: false,
    canvasOpacity: "1",
    paintOwner: "solid-mask-canvas",
    hasStructuralInk: true
  });

  const lossRequested = await fitSurface.evaluate((surface) => {
    const canvas = surface.querySelector<HTMLCanvasElement>(
      "[data-kp-native-katex-structural-succession]"
    );
    if (canvas === null) return false;
    canvas.dataset["kpWebglLossSentinel"] = "true";
    const extension = canvas.getContext("webgl")
      ?.getExtension("WEBGL_lose_context");
    if (extension === null || extension === undefined) return false;
    extension.loseContext();
    return true;
  });
  expect(lossRequested).toBe(true);
  await expect(fitSurface.locator(
    '[data-kp-webgl-loss-sentinel="true"]'
  )).toHaveCount(0);
  await expect(fitSurface).toHaveAttribute(
    "data-kp-native-katex-structural-succession-status",
    "ready"
  );
  await expect.poll(() => page.evaluate(async () => {
    const poolUrl = "/src/rendering/webgl-context-lease-pool.ts";
    const pool = await import(/* @vite-ignore */ poolUrl);
    return pool.inspectKpWebglContextLeasePool(document);
  })).toEqual({ limit: 2, active: 1, waiting: 0 });
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

interface InkRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

interface InkSample extends InkRect {
  readonly inkProfile: readonly number[];
  readonly inkProfileHeight: number;
  readonly inkProfileWidth: number;
}

interface PaintClip {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

async function measureSourceGlyphPaintAlignment(
  surface: import("@playwright/test").Locator,
  sourceSelector: string,
  materialText: string
): Promise<{
  readonly native: InkRect;
  readonly material: InkRect;
  readonly alignment: string | null;
}> {
  return surface.evaluate(async (root, input) => {
    const geometryUrl =
      "/src/rendering/native-katex-paint-geometry.ts";
    const geometry = await import(/* @vite-ignore */ geometryUrl);
    const source = root.querySelector<HTMLElement>(input.sourceSelector);
    const owner = [...root.querySelectorAll<HTMLElement>(
      "[data-kp-native-katex-scene-owner]"
    )].find((candidate) =>
      Number(getComputedStyle(candidate).opacity) > 0.01 &&
      candidate.dataset["kpEquationMaterialFragmentRole"]?.startsWith(
        "glyph:"
      ) &&
      candidate.textContent?.trim() === input.materialText
    );
    const visual = owner?.firstElementChild;
    if (
      source === null ||
      owner === undefined ||
      !(visual instanceof HTMLElement)
    ) {
      throw new Error("Missing source glyph paint-alignment evidence.");
    }
    const native =
      geometry.measureKpNativeKatexSubtreePaintRect(
        root as HTMLElement,
        source
      );
    const material =
      geometry.measureKpNativeKatexSubtreePaintRect(
        root as HTMLElement,
        visual
      );
    if (native === undefined || material === undefined) {
      throw new Error("Source glyph has no measurable native or material ink.");
    }
    return {
      native,
      material,
      alignment:
        owner.dataset["kpEquationMaterialPaintAlignment"] ?? null
    };
  }, { sourceSelector, materialText });
}

async function clipElement(
  surface: import("@playwright/test").Locator,
  selector: string,
  padding = 24
): Promise<PaintClip> {
  const rect = await surface.evaluate((root, query) => {
    const element = root.querySelector<HTMLElement>(query);
    if (element === null) {
      throw new Error(`Could not locate endpoint paint ${query}.`);
    }
    const bounds = element.getBoundingClientRect();
    return {
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height
    };
  }, selector);
  return paddedClip(rect, padding);
}

async function clipMaterialGlyph(
  surface: import("@playwright/test").Locator,
  text: string
): Promise<PaintClip> {
  const rect = await surface.evaluate((root, expectedText) => {
    const owner = [
      ...root.querySelectorAll<HTMLElement>(
        "[data-kp-native-katex-scene-owner]"
      )
    ].find((candidate) =>
      Number(getComputedStyle(candidate).opacity) > 0.01 &&
      candidate.dataset["kpEquationMaterialFragmentRole"]?.startsWith(
        "glyph:"
      ) &&
      candidate.textContent?.trim() === expectedText
    );
    const visual = owner?.firstElementChild;
    if (!(visual instanceof HTMLElement)) {
      throw new Error(`Could not locate material glyph ${expectedText}.`);
    }
    const bounds = visual.getBoundingClientRect();
    return {
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height
    };
  }, text);
  return paddedClip(rect, 6);
}

function paddedClip(
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  padding = 24
):
  PaintClip {
  return {
    x: Math.floor(rect.left - padding),
    y: Math.floor(rect.top - padding),
    width: Math.ceil(rect.width + padding * 2),
    height: Math.ceil(rect.height + padding * 2)
  };
}

function localizeInkRect(
  rect: InkRect,
  clip: PaintClip,
  surfaceClip: PaintClip
): InkRect {
  return {
    left: rect.left + clip.x - surfaceClip.x,
    top: rect.top + clip.y - surfaceClip.y,
    width: rect.width,
    height: rect.height
  };
}

async function captureInk(
  page: import("@playwright/test").Page,
  clip: PaintClip,
  hiddenSelectors: readonly string[] = []
): Promise<InkSample> {
  const selectorsToHide = [
    "[data-kp-reader-equation-stage-heading]",
    ...hiddenSelectors
  ];
  await page.evaluate((selectors) => {
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-reader-equation-stage]"
    );
    if (stage !== null) {
      stage.dataset["kpEndpointPaintPreviousBackground"] =
        stage.style.background;
      stage.dataset["kpEndpointPaintPreviousBorderColor"] =
        stage.style.borderColor;
      stage.style.background = "#fff";
      stage.style.borderColor = "#fff";
    }
    for (const selector of selectors) {
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        element.dataset["kpEndpointPaintPreviousOpacity"] =
          element.style.opacity;
        element.style.opacity = "0";
      });
    }
  }, selectorsToHide);
  const screenshot = await page.screenshot({ clip });
  await page.evaluate((selectors) => {
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-reader-equation-stage]"
    );
    if (stage !== null) {
      stage.style.background =
        stage.dataset["kpEndpointPaintPreviousBackground"] ?? "";
      stage.style.borderColor =
        stage.dataset["kpEndpointPaintPreviousBorderColor"] ?? "";
      delete stage.dataset["kpEndpointPaintPreviousBackground"];
      delete stage.dataset["kpEndpointPaintPreviousBorderColor"];
    }
    for (const selector of selectors) {
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        element.style.opacity =
          element.dataset["kpEndpointPaintPreviousOpacity"] ?? "";
        delete element.dataset["kpEndpointPaintPreviousOpacity"];
      });
    }
  }, selectorsToHide);
  return page.evaluate(async ({ bytes, cssWidth, cssHeight }) => {
    const bitmap = await createImageBitmap(
      new Blob([new Uint8Array(bytes)], { type: "image/png" })
    );
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (context === null) throw new Error("Could not inspect endpoint paint.");
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    const pixels = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    ).data;
    const scaleX = canvas.width / cssWidth;
    const scaleY = canvas.height / cssHeight;
    let left = canvas.width;
    let top = canvas.height;
    let right = -1;
    let bottom = -1;
    const edgeInset = Math.ceil(5 * Math.max(scaleX, scaleY));
    const backgroundOffset =
      (edgeInset * 2 * canvas.width + edgeInset * 2) * 4;
    const backgroundRed = pixels[backgroundOffset] ?? 255;
    const backgroundGreen = pixels[backgroundOffset + 1] ?? 255;
    const backgroundBlue = pixels[backgroundOffset + 2] ?? 255;
    const paintThreshold = 48;
    for (let y = edgeInset; y < canvas.height - edgeInset; y += 1) {
      for (let x = edgeInset; x < canvas.width - edgeInset; x += 1) {
        const offset = (y * canvas.width + x) * 4;
        const red = pixels[offset] ?? 255;
        const green = pixels[offset + 1] ?? 255;
        const blue = pixels[offset + 2] ?? 255;
        const colorDistance = Math.max(
          Math.abs(red - backgroundRed),
          Math.abs(green - backgroundGreen),
          Math.abs(blue - backgroundBlue)
        );
        if (colorDistance <= paintThreshold) continue;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
    if (right < left || bottom < top) {
      throw new Error("Endpoint paint clip contains no visible ink.");
    }
    const inkDistances = [];
    let maximumInkDistance = 1;
    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= right; x += 1) {
        const offset = (y * canvas.width + x) * 4;
        const colorDistance = Math.max(
          Math.abs((pixels[offset] ?? 255) - backgroundRed),
          Math.abs((pixels[offset + 1] ?? 255) - backgroundGreen),
          Math.abs((pixels[offset + 2] ?? 255) - backgroundBlue)
        );
        inkDistances.push(colorDistance);
        maximumInkDistance = Math.max(maximumInkDistance, colorDistance);
      }
    }
    return {
      left: left / scaleX,
      top: top / scaleY,
      width: (right - left + 1) / scaleX,
      height: (bottom - top + 1) / scaleY,
      inkProfile: inkDistances.map((distance) =>
        distance / maximumInkDistance
      ),
      inkProfileHeight: bottom - top + 1,
      inkProfileWidth: right - left + 1
    };
  }, {
    bytes: Array.from(screenshot),
    cssWidth: clip.width,
    cssHeight: clip.height
  });
}

function inkRectDelta(left: InkRect, right: InkRect): number {
  return Math.max(
    Math.abs(left.left - right.left),
    Math.abs(left.top - right.top),
    Math.abs(left.width - right.width),
    Math.abs(left.height - right.height)
  );
}

function inkProfileDifference(left: InkSample, right: InkSample): number {
  const sampleWidth = 32;
  const sampleHeight = 64;
  let difference = 0;
  for (let y = 0; y < sampleHeight; y += 1) {
    for (let x = 0; x < sampleWidth; x += 1) {
      difference += Math.abs(
        sampleNormalizedInk(left, x, y, sampleWidth, sampleHeight) -
        sampleNormalizedInk(right, x, y, sampleWidth, sampleHeight)
      );
    }
  }
  return difference / (sampleWidth * sampleHeight);
}

function sampleNormalizedInk(
  sample: InkSample,
  x: number,
  y: number,
  sampleWidth: number,
  sampleHeight: number
): number {
  const sourceX = (x + 0.5) / sampleWidth * sample.inkProfileWidth - 0.5;
  const sourceY = (y + 0.5) / sampleHeight * sample.inkProfileHeight - 0.5;
  const left = Math.max(0, Math.floor(sourceX));
  const top = Math.max(0, Math.floor(sourceY));
  const right = Math.min(sample.inkProfileWidth - 1, left + 1);
  const bottom = Math.min(sample.inkProfileHeight - 1, top + 1);
  const mixX = Math.max(0, sourceX - left);
  const mixY = Math.max(0, sourceY - top);
  const at = (column: number, row: number) =>
    sample.inkProfile[row * sample.inkProfileWidth + column] ?? 0;
  const upper = at(left, top) * (1 - mixX) + at(right, top) * mixX;
  const lower = at(left, bottom) * (1 - mixX) +
    at(right, bottom) * mixX;
  return upper * (1 - mixY) + lower * mixY;
}
