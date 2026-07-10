import { expect, test } from "@playwright/test";

test("equation motion card supports focused keyboard controls", async ({
  page
}) => {
  await page.goto("/");

  const demo = page.locator("[data-kp-equation-motion-demo]");
  const durationSlider = demo.locator(
    '[data-action="set-equation-motion-duration"]'
  );
  const picker = demo.locator("[data-kp-equation-animation-picker]");

  await durationSlider.evaluate((element) => {
    const input = element as HTMLInputElement;

    input.value = "200";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await demo.focus();
  await expect
    .poll(() =>
      demo.evaluate((element) => ({
        active: document.activeElement === element,
        borderColor: getComputedStyle(element).borderColor
      }))
    )
    .toEqual({
      active: true,
      borderColor: "rgb(82, 97, 115)"
    });

  await page.keyboard.press("j");
  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "1");

  await page.keyboard.press("k");
  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "0");

  await durationSlider.evaluate((element) => {
    const input = element as HTMLInputElement;

    input.value = "3000";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.keyboard.press("Space");
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-animating",
    "true"
  );
  await expect
    .poll(() =>
      demo.evaluate((element) =>
        Number(element.dataset["kpEquationMotionProgress"] ?? "0")
      )
    )
    .toBeGreaterThan(0);
  await page.keyboard.press("Space");
  await expect(demo).toHaveAttribute("data-kp-equation-motion-paused", "true");
  const pausedProgress = await demo.evaluate((element) =>
    Number(element.dataset["kpEquationMotionProgress"] ?? "0")
  );
  await page.waitForTimeout(160);
  await expect
    .poll(() =>
      demo.evaluate(
        (element, expectedProgress) =>
          Math.abs(
            Number(element.dataset["kpEquationMotionProgress"] ?? "0") -
              expectedProgress
          ),
        pausedProgress
      )
    )
    .toBeLessThan(0.001);
  await page.keyboard.press("Space");
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-animating",
    "true"
  );
  await expect(demo).not.toHaveAttribute(
    "data-kp-equation-motion-paused",
    "true"
  );
  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "1", {
    timeout: 3500
  });

  await page.keyboard.press("Shift+J");
  await expect(picker).toBeVisible();
  await expect(demo).toHaveAttribute(
    "data-kp-equation-animation-picker-open",
    "true"
  );
  await expect(picker.locator('[aria-selected="true"]')).toHaveText(
    "Inline fraction to stacked"
  );

  await page.keyboard.press("Shift+J");
  await expect(picker.locator('[aria-selected="true"]')).toHaveText(
    "Power to radical"
  );

  await page.keyboard.press("Shift+K");
  await expect(picker.locator('[aria-selected="true"]')).toHaveText(
    "Inline fraction to stacked"
  );

  await page.keyboard.press("Enter");
  await expect(demo).toHaveAttribute(
    "data-kp-equation-animation-id",
    "fixture-fraction-make-inline-to-stacked"
  );
});

test("editor equation motion demo uses semantic playback plans", async ({
  page
}) => {
  await page.goto("/");

  const demo = page.locator("[data-kp-equation-motion-demo]");
  const next = demo.locator('[data-action="equation-motion-next"]');
  const rewind = demo.locator('[data-action="equation-motion-rewind"]');
  const animationSelect = demo.locator(
    '[data-action="set-equation-motion-animation"]'
  );
  const beatScrubber = demo.locator('[data-action="set-equation-motion-beat"]');
  const durationSlider = demo.locator(
    '[data-action="set-equation-motion-duration"]'
  );
  const collapseScaleSlider = demo.locator(
    '[data-action="set-equation-motion-collapse-scale"]'
  );

  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "0");
  await expect(animationSelect).toHaveValue("linear-equation-solve-x");
  await expect(demo.locator('[data-kp-equation-motion-state="0"]')).toBeVisible();
  await expect(demo.locator('[data-kp-equation-motion-state="1"]')).toBeHidden();
  await expect(rewind).toBeDisabled();
  await expect(next).toBeEnabled();
  await expect(beatScrubber).toHaveAttribute("max", "50");
  await expect(beatScrubber).toHaveValue("0");
  await expect(durationSlider).toHaveAttribute("min", "200");
  await expect(durationSlider).toHaveAttribute("max", "3000");
  await expect(durationSlider).toHaveValue("1200");
  await expect(
    demo.locator('[data-role="equation-motion-duration-output"]')
  ).toHaveText("1200 ms");
  await expect(collapseScaleSlider).toHaveAttribute("min", "0");
  await expect(collapseScaleSlider).toHaveAttribute("max", "50");
  await expect(collapseScaleSlider).toHaveValue("0");
  await expect(
    demo.locator('[data-role="equation-motion-collapse-scale-output"]')
  ).toHaveText("0%");

  const fixtureAnimations = [
    {
      id: "fixture-fraction-make-inline-to-stacked",
      sourceLatex: "x / 3",
      targetLatex: "\\frac{x}{3}"
    },
    {
      id: "fixture-radical-rewrite-power-as-root",
      sourceLatex: "x^{1/2}",
      targetLatex: "\\sqrt{x}"
    },
    {
      id: "fixture-wrapper-function-wrap",
      sourceLatex: "x",
      targetLatex: "f(x)"
    },
    {
      id: "fixture-script-combine-factor-as-power",
      sourceLatex: "x \\cdot x",
      targetLatex: "x^2"
    },
    {
      id: "fixture-matrix-bracket-change-delimiter",
      sourceLatex: "\\begin{bmatrix}1 & 0 \\\\ 0 & 1\\end{bmatrix}",
      targetLatex: "\\begin{pmatrix}1 & 0 \\\\ 0 & 1\\end{pmatrix}"
    }
  ] as const;

  for (const animation of fixtureAnimations) {
    await animationSelect.selectOption(animation.id);
    await expect(demo).toHaveAttribute(
      "data-kp-equation-animation-id",
      animation.id
    );
    await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "0");
    await expect(demo).toHaveAttribute("data-kp-equation-motion-max-step", "1");
    await expect(
      demo.locator('[data-kp-equation-motion-state="0"]')
    ).toHaveAttribute("data-kp-equation-motion-latex", animation.sourceLatex);
    await expect(
      demo.locator('[data-kp-equation-motion-state="1"]')
    ).toHaveAttribute("data-kp-equation-motion-latex", animation.targetLatex);
  }

  await animationSelect.selectOption("fixture-matrix-bracket-change-delimiter");
  const matrixMotionIds = await page.evaluate(() => {
    const demoElement = document.querySelector<HTMLElement>(
      "[data-kp-equation-motion-demo]"
    );

    if (demoElement === null) {
      throw new Error("Expected equation motion demo.");
    }

    return {
      source: Array.from(
        demoElement.querySelectorAll(
          '[data-kp-equation-motion-state="0"] [data-kp-motion-id]'
        )
      ).map((element) => element.getAttribute("data-kp-motion-id")),
      target: Array.from(
        demoElement.querySelectorAll(
          '[data-kp-equation-motion-state="1"] [data-kp-motion-id]'
        )
      ).map((element) => element.getAttribute("data-kp-motion-id"))
    };
  });

  expect(matrixMotionIds.source).toContain(
    "matrix.bracket.change-delimiter.source.entry.r0.c0"
  );
  expect(matrixMotionIds.source).toContain(
    "matrix.bracket.change-delimiter.source.left-bracket"
  );
  expect(matrixMotionIds.target).toContain(
    "matrix.bracket.change-delimiter.target.entry.r1.c1"
  );
  expect(matrixMotionIds.target).toContain(
    "matrix.bracket.change-delimiter.target.right-bracket"
  );
  expect(matrixMotionIds.source).not.toContain(
    "matrix.bracket.change-delimiter.source.expression"
  );
  expect(matrixMotionIds.target).not.toContain(
    "matrix.bracket.change-delimiter.target.expression"
  );

  await animationSelect.selectOption("fixture-radical-rewrite-power-as-root");
  const radicalMotionIds = await page.evaluate(() => {
    const demoElement = document.querySelector<HTMLElement>(
      "[data-kp-equation-motion-demo]"
    );

    if (demoElement === null) {
      throw new Error("Expected equation motion demo.");
    }

    return {
      source: Array.from(
        demoElement.querySelectorAll(
          '[data-kp-equation-motion-state="0"] [data-kp-motion-id]'
        )
      ).map((element) => element.getAttribute("data-kp-motion-id")),
      target: Array.from(
        demoElement.querySelectorAll(
          '[data-kp-equation-motion-state="1"] [data-kp-motion-id]'
        )
      ).map((element) => element.getAttribute("data-kp-motion-id"))
    };
  });

  expect(radicalMotionIds.source).toContain(
    "radical.rewrite-power-as-root.source.x"
  );
  expect(radicalMotionIds.source).toContain(
    "radical.rewrite-power-as-root.source.exponent"
  );
  expect(radicalMotionIds.target).toContain(
    "radical.rewrite-power-as-root.target.x"
  );
  expect(radicalMotionIds.target).toContain(
    "radical.rewrite-power-as-root.target.radical"
  );
  expect(radicalMotionIds.source).not.toContain(
    "radical.rewrite-power-as-root.source.expression"
  );
  expect(radicalMotionIds.target).not.toContain(
    "radical.rewrite-power-as-root.target.expression"
  );

  const radicalInterpolationState = await page.evaluate(() => {
    const demoElement = document.querySelector<HTMLElement>(
      "[data-kp-equation-motion-demo]"
    );

    if (demoElement === null) {
      throw new Error("Expected equation motion demo.");
    }

    const sourceToken = demoElement.querySelector<HTMLElement>(
      '[data-kp-equation-motion-state="0"] [data-kp-motion-id="radical.rewrite-power-as-root.source.x"]'
    );
    const targetToken = demoElement.querySelector<HTMLElement>(
      '[data-kp-equation-motion-state="1"] [data-kp-motion-id="radical.rewrite-power-as-root.target.x"]'
    );

    if (sourceToken === null || targetToken === null) {
      throw new Error("Expected radical source and target x tokens.");
    }

    const center = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();

      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    };

    window.__kpEquationMotionSetProgress?.(demoElement, 0);
    const start = center(sourceToken);
    const target = center(targetToken);

    window.__kpEquationMotionSetProgress?.(demoElement, 0.25);
    const inFlight = center(sourceToken);

    window.__kpEquationMotionSetProgress?.(demoElement, 1);
    const end = center(sourceToken);

    return {
      start,
      inFlight,
      end,
      target,
      sourceDisplay: getComputedStyle(sourceToken).display,
      targetDisplay: getComputedStyle(targetToken).display
    };
  });

  expect(radicalInterpolationState.sourceDisplay).not.toBe("inline");
  expect(radicalInterpolationState.targetDisplay).not.toBe("inline");
  expect(radicalInterpolationState.inFlight.x).toBeGreaterThan(
    radicalInterpolationState.start.x + 5
  );
  expect(radicalInterpolationState.inFlight.x).toBeLessThan(
    radicalInterpolationState.target.x - 5
  );
  expect(radicalInterpolationState.end.x).toBeCloseTo(
    radicalInterpolationState.target.x,
    1
  );
  expect(radicalInterpolationState.end.y).toBeCloseTo(
    radicalInterpolationState.target.y,
    1
  );

  const radicalArtifactState = await page.evaluate(async () => {
    const demoElement = document.querySelector<HTMLElement>(
      "[data-kp-equation-motion-demo]"
    );

    if (demoElement === null) {
      throw new Error("Expected equation motion demo.");
    }

    window.__kpEquationMotionSetProgress?.(demoElement, 0.5);

    const overlay = await new Promise<HTMLCanvasElement>((resolve, reject) => {
      const existingOverlay = demoElement.querySelector<HTMLCanvasElement>(
        '[data-kp-equation-motion-artifact-overlay][data-kp-equation-motion-artifact-ready="true"]'
      );

      if (existingOverlay !== null) {
        resolve(existingOverlay);
        return;
      }

      const observer = new MutationObserver(() => {
        const nextOverlay = demoElement.querySelector<HTMLCanvasElement>(
          '[data-kp-equation-motion-artifact-overlay][data-kp-equation-motion-artifact-ready="true"]'
        );

        if (nextOverlay !== null) {
          window.clearTimeout(timeout);
          observer.disconnect();
          resolve(nextOverlay);
        }
      });
      const timeout = window.setTimeout(() => {
        observer.disconnect();
        reject(new Error("Expected radical artifact texture overlay."));
      }, 5_000);

      observer.observe(demoElement, {
        attributeFilter: ["data-kp-equation-motion-artifact-ready"],
        attributes: true,
        childList: true,
        subtree: true
      });
      void Promise.resolve().then(() => {
        const nextOverlay = demoElement.querySelector<HTMLCanvasElement>(
          '[data-kp-equation-motion-artifact-overlay][data-kp-equation-motion-artifact-ready="true"]'
        );

        if (nextOverlay !== null) {
          window.clearTimeout(timeout);
          observer.disconnect();
          resolve(nextOverlay);
        }
      });
    });

    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

    const context = overlay.getContext("2d", { willReadFrequently: true });

    if (context === null) {
      throw new Error("Expected radical artifact overlay to use a 2D canvas.");
    }

    const pixels = context.getImageData(0, 0, overlay.width, overlay.height).data;
    let maxAlpha = 0;
    let nonTransparentPixelCount = 0;

    for (let index = 3; index < pixels.length; index += 4) {
      const alpha = pixels[index] ?? 0;

      maxAlpha = Math.max(maxAlpha, alpha);

      if (alpha > 0) {
        nonTransparentPixelCount += 1;
      }

      if (nonTransparentPixelCount >= 32) {
        break;
      }
    }

    const persistentX = demoElement.querySelector<HTMLElement>(
      '[data-kp-equation-motion-state="0"] [data-kp-motion-id="radical.rewrite-power-as-root.source.x"]'
    );

    if (persistentX === null) {
      throw new Error("Expected persistent radical source x token.");
    }

    return {
      mode: demoElement.dataset["kpEquationMotionArtifactMode"],
      fallbackReason: demoElement.dataset["kpEquationMotionArtifactFallbackReason"],
      overlayConnected: overlay.isConnected,
      overlayZIndex: window.getComputedStyle(overlay).zIndex,
      persistentXTokenZIndex: window.getComputedStyle(persistentX).zIndex,
      renderer: overlay.dataset["kpEquationMotionArtifactRenderer"],
      sourceTokenId: overlay.dataset["kpEquationMotionArtifactSource"],
      targetTokenId: overlay.dataset["kpEquationMotionArtifactTarget"],
      sourceMotion: overlay.dataset["kpEquationMotionArtifactSourceMotion"],
      pathMotion: overlay.dataset["kpEquationMotionArtifactPathMotion"],
      targetMotion: overlay.dataset["kpEquationMotionArtifactTargetMotion"],
      bundleRect: overlay.dataset["kpEquationMotionArtifactBundleRect"],
      collapseEnd: overlay.dataset["kpEquationMotionArtifactCollapseEnd"],
      revealStart: overlay.dataset["kpEquationMotionArtifactRevealStart"],
      dissolveFraction:
        overlay.dataset["kpEquationMotionArtifactDissolveFraction"],
      nonTransparentPixelCount,
      maxAlpha
    };
  });

  expect(radicalArtifactState).toEqual({
    mode: "fold-bundle-swap",
    fallbackReason: undefined,
    overlayConnected: true,
    overlayZIndex: "1",
    persistentXTokenZIndex: "2",
    renderer: "canvas-fold-bundle-swap",
    sourceTokenId: "radical.rewrite-power-as-root.source.exponent",
    targetTokenId: "radical.rewrite-power-as-root.target.radical",
    sourceMotion: "collapse-to-bundle",
    pathMotion: "fold-bundle-swap",
    targetMotion: "unfold-from-bundle",
    bundleRect: expect.any(String),
    collapseEnd: "0.48",
    revealStart: "0.42",
    dissolveFraction: "0",
    nonTransparentPixelCount: expect.any(Number),
    maxAlpha: expect.any(Number)
  });
  expect(radicalArtifactState.nonTransparentPixelCount).toBeGreaterThan(0);
  expect(radicalArtifactState.maxAlpha).toBeGreaterThan(0);

  await durationSlider.evaluate((element) => {
    const input = element as HTMLInputElement;

    input.value = "200";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await next.click();
  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "1");
  await rewind.click();
  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "0");

  const radicalReverseHandoffState = await page.evaluate(() => {
    const demoElement = document.querySelector<HTMLElement>(
      "[data-kp-equation-motion-demo]"
    );

    if (demoElement === null) {
      throw new Error("Expected equation motion demo.");
    }

    const overlay = demoElement.querySelector<HTMLCanvasElement>(
      '[data-kp-equation-motion-artifact-overlay][data-kp-equation-motion-artifact-handoff="true"]'
    );
    const exponent = demoElement.querySelector<HTMLElement>(
      '[data-kp-equation-motion-state="0"] [data-kp-motion-id="radical.rewrite-power-as-root.source.exponent"]'
    );

    if (overlay === null || exponent === null) {
      return {
        overlayExists: overlay !== null,
        exponentExists: exponent !== null
      };
    }

    const overlayStyle = getComputedStyle(overlay);
    const exponentStyle = getComputedStyle(exponent);

    return {
      overlayExists: true,
      exponentExists: true,
      overlayConnected: overlay.isConnected,
      overlayHandoff: overlay.dataset["kpEquationMotionArtifactHandoff"],
      overlayPointerEvents: overlayStyle.pointerEvents,
      exponentVisibility: exponentStyle.visibility,
      exponentOpacity: Number(exponentStyle.opacity)
    };
  });

  expect(radicalReverseHandoffState).toEqual({
    overlayExists: true,
    exponentExists: true,
    overlayConnected: true,
    overlayHandoff: "true",
    overlayPointerEvents: "none",
    exponentVisibility: "visible",
    exponentOpacity: 1
  });

  await animationSelect.selectOption("fixture-fraction-make-inline-to-stacked");
  const fractionScaleState = await page.evaluate(() => {
    const demoElement = document.querySelector<HTMLElement>(
      "[data-kp-equation-motion-demo]"
    );

    if (demoElement === null) {
      throw new Error("Expected equation motion demo.");
    }

    const sourceX = demoElement.querySelector<HTMLElement>(
      '[data-kp-equation-motion-state="0"] [data-kp-motion-id="fraction.make.inline-to-stacked.source.x"]'
    );
    const targetX = demoElement.querySelector<HTMLElement>(
      '[data-kp-equation-motion-state="1"] [data-kp-motion-id="fraction.make.inline-to-stacked.target.x"]'
    );

    if (sourceX === null || targetX === null) {
      throw new Error("Expected inline-fraction source and target x tokens.");
    }

    const sourceWidth = sourceX.getBoundingClientRect().width;
    const targetWidth = targetX.getBoundingClientRect().width;

    window.__kpEquationMotionSetProgress?.(demoElement, 0.25);

    const scaleMatch = /scale\(([-\d.]+)\)/.exec(sourceX.style.transform);
    const scale = scaleMatch === null ? Number.NaN : Number(scaleMatch[1]);

    return {
      sourceWidth,
      targetWidth,
      scale,
      transform: sourceX.style.transform
    };
  });

  expect(fractionScaleState.sourceWidth).toBeGreaterThan(
    fractionScaleState.targetWidth
  );
  expect(fractionScaleState.scale).toBeLessThan(1);
  expect(fractionScaleState.scale).toBeGreaterThan(0.5);
  expect(fractionScaleState.transform).not.toContain("scale(1)");

  await next.click();
  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "1");
  await expect(demo.locator('[data-kp-equation-motion-state="1"]')).toBeVisible();
  await expect(demo.locator('[data-kp-equation-motion-state="0"]')).toBeHidden();
  await rewind.click();
  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "0");
  await expect(demo.locator('[data-kp-equation-motion-state="0"]')).toBeVisible();
  await expect(demo.locator('[data-kp-equation-motion-state="1"]')).toBeHidden();

  await animationSelect.selectOption("linear-equation-solve-x");
  await expect(demo).toHaveAttribute(
    "data-kp-equation-animation-id",
    "linear-equation-solve-x"
  );
  await expect(demo).toHaveAttribute("data-kp-equation-motion-max-step", "3");

  await durationSlider.evaluate((element) => {
    const input = element as HTMLInputElement;

    input.value = "1200";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-duration-ms",
    "1200"
  );
  await expect(
    demo.locator('[data-role="equation-motion-duration-output"]')
  ).toHaveText("1200 ms");
  await collapseScaleSlider.evaluate((element) => {
    const input = element as HTMLInputElement;

    input.value = "25";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-collapse-scale-percent",
    "25"
  );
  await expect(
    demo.locator('[data-role="equation-motion-collapse-scale-output"]')
  ).toHaveText("25%");
  await collapseScaleSlider.evaluate((element) => {
    const input = element as HTMLInputElement;

    input.value = "0";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  const visibleTokenBox = await demo
    .locator('[data-kp-equation-motion-state="0"] [data-kp-motion-id="lhs.x"]')
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);

      return {
        inVisibleFormula:
          element.closest(".equation-motion__formula") !== null &&
          element.closest(".equation-motion__motion-anchors") === null,
        opacity: style.opacity,
        text: element.textContent?.trim(),
        visibility: style.visibility,
        width: rect.width,
        height: rect.height
      };
    });

  expect(visibleTokenBox).toEqual({
    inVisibleFormula: true,
    opacity: "1",
    text: "x",
    visibility: "visible",
    width: expect.any(Number),
    height: expect.any(Number)
  });
  expect(visibleTokenBox.width).toBeGreaterThan(0);
  expect(visibleTokenBox.height).toBeGreaterThan(0);

  const earlyBeatState = await page.evaluate(() => {
    const demoElement = document.querySelector<HTMLElement>(
      "[data-kp-equation-motion-demo]"
    );

    if (demoElement === null) {
      throw new Error("Expected equation motion demo.");
    }

    const scrubber = demoElement.querySelector<HTMLInputElement>(
      '[data-action="set-equation-motion-beat"]'
    );

    if (scrubber === null) {
      throw new Error("Expected equation motion beat scrubber.");
    }

    scrubber.value = "15";
    scrubber.dispatchEvent(new Event("input", { bubbles: true }));

    const movingToken = demoElement.querySelector<HTMLElement>(
      '[data-kp-equation-motion-state="0"] [data-kp-motion-id="lhs.x"]'
    );
    const targetState = demoElement.querySelector<HTMLElement>(
      '[data-kp-equation-motion-state="1"]'
    );
    const enteringToken = targetState?.querySelector<HTMLElement>(
      '[data-kp-motion-id="lhs.inverse.minus"]'
    );
    const output = demoElement.querySelector<HTMLOutputElement>(
      '[data-role="equation-motion-beat-output"]'
    );

    if (
      movingToken === null ||
      targetState === null ||
      enteringToken === undefined ||
      enteringToken === null ||
      output === null
    ) {
      throw new Error("Expected moving, entering, and beat output nodes.");
    }

    const enteringStyle = getComputedStyle(enteringToken);

    return {
      progress: demoElement.dataset["kpEquationMotionProgress"],
      beatOutput: output.textContent,
      movingTransform: movingToken.style.transform,
      enteringOpacity: Number(enteringStyle.opacity),
      enteringVisibility: enteringStyle.visibility
    };
  });

  expect(earlyBeatState).toEqual({
    progress: "0.3",
    beatOutput: "15/50",
    movingTransform: expect.any(String),
    enteringOpacity: 0,
    enteringVisibility: "hidden"
  });
  expect(earlyBeatState.movingTransform).not.toBe("");
  expect(earlyBeatState.movingTransform).not.toBe("none");

  const scrubbedVisualState = await page.evaluate(() => {
    const demoElement = document.querySelector<HTMLElement>(
      "[data-kp-equation-motion-demo]"
    );

    if (demoElement === null) {
      throw new Error("Expected equation motion demo.");
    }

    window.__kpEquationMotionSetProgress?.(demoElement, 0.6);

    const sourceState = demoElement.querySelector<HTMLElement>(
      '[data-kp-equation-motion-state="0"]'
    );
    const targetState = demoElement.querySelector<HTMLElement>(
      '[data-kp-equation-motion-state="1"]'
    );
    const enteringToken = targetState?.querySelector<HTMLElement>(
      '[data-kp-motion-id="lhs.inverse.minus"]'
    );

    if (
      sourceState === null ||
      targetState === null ||
      enteringToken === undefined ||
      enteringToken === null
    ) {
      throw new Error("Expected source, target, and entering token nodes.");
    }

    const targetStyle = getComputedStyle(targetState);
    const enteringStyle = getComputedStyle(enteringToken);

    return {
      progress: demoElement.dataset["kpEquationMotionProgress"],
      targetStateVisibility: targetStyle.visibility,
      enteringOpacity: Number(enteringStyle.opacity),
      enteringTransform: enteringStyle.transform
    };
  });

  expect(scrubbedVisualState.progress).toBe("0.6");
  expect(scrubbedVisualState.targetStateVisibility).toBe("visible");
  expect(scrubbedVisualState.enteringOpacity).toBeGreaterThan(0);
  expect(scrubbedVisualState.enteringOpacity).toBeLessThan(1);
  expect(scrubbedVisualState.enteringTransform).not.toBe("none");

  const repeatedProgressState = await page.evaluate(() => {
    const demoElement = document.querySelector<HTMLElement>(
      "[data-kp-equation-motion-demo]"
    );

    if (demoElement === null) {
      throw new Error("Expected equation motion demo.");
    }

    const movingToken = demoElement.querySelector<HTMLElement>(
      '[data-kp-equation-motion-state="0"] [data-kp-motion-id="lhs.x"]'
    );

    if (movingToken === null) {
      throw new Error("Expected moving lhs.x token.");
    }

    window.__kpEquationMotionSetProgress?.(demoElement, 0.5);
    const firstTransform = movingToken.style.transform;
    const firstRectLeft = movingToken.getBoundingClientRect().left;

    window.__kpEquationMotionSetProgress?.(demoElement, 0.5);
    const secondTransform = movingToken.style.transform;
    const secondRectLeft = movingToken.getBoundingClientRect().left;

    return {
      firstTransform,
      secondTransform,
      rectDelta: Math.abs(secondRectLeft - firstRectLeft)
    };
  });

  expect(repeatedProgressState.secondTransform).toBe(
    repeatedProgressState.firstTransform
  );
  expect(repeatedProgressState.rectDelta).toBeLessThan(0.01);

  await next.click();

  const animatedProgress = await page.waitForFunction(() => {
    const demoElement = document.querySelector<HTMLElement>(
      "[data-kp-equation-motion-demo]"
    );
    const progress = Number(demoElement?.dataset["kpEquationMotionProgress"]);

    if (
      demoElement?.dataset["kpEquationMotionAnimating"] === "true" &&
      Number.isFinite(progress) &&
      progress >= 0 &&
      progress < 1
    ) {
      return progress;
    }

    if (demoElement?.dataset["kpEquationMotionStep"] === "1") {
      return 1;
    }

    return false;
  });

  expect(await animatedProgress.jsonValue()).toEqual(expect.any(Number));
  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "1");
  await expect(demo).not.toHaveAttribute("data-kp-equation-motion-animating", "true");
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-last-renderer",
    "operation-plan"
  );
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-latest-source",
    "0"
  );
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-latest-target",
    "1"
  );
  await expect(demo).toHaveAttribute("data-kp-equation-motion-progress", "1");
  await expect(demo.locator('[data-kp-equation-motion-state="1"]')).toBeVisible();
  await expect(demo.locator('[data-kp-equation-motion-state="0"]')).toBeHidden();
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-source-anchor-count",
    "5"
  );
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-target-anchor-count",
    "9"
  );
  await expect(rewind).toBeEnabled();
  await expect(next).toBeEnabled();

  await next.click();

  const cancellationMotionState = await page.evaluate(() => {
    const demoElement = document.querySelector<HTMLElement>(
      "[data-kp-equation-motion-demo]"
    );

    if (demoElement === null) {
      throw new Error("Expected equation motion demo.");
    }

    const scrubber = demoElement.querySelector<HTMLInputElement>(
      '[data-action="set-equation-motion-beat"]'
    );
    const cancelMotionIds = [
      "lhs.plus",
      "lhs.3",
      "lhs.inverse.minus",
      "lhs.inverse.3"
    ] as const;

    if (scrubber === null) {
      throw new Error("Expected equation motion beat scrubber.");
    }

    const parseInlineTransform = (transform: string) => {
      const translate = transform.match(
        /translate\(([-0-9.]+)px, ([-0-9.]+)px\)/
      );
      const scale = transform.match(/scale\(([-0-9.]+)\)/);

      return {
        x: translate === null ? 0 : Number(translate[1]),
        y: translate === null ? 0 : Number(translate[2]),
        scale: scale === null ? 1 : Number(scale[1])
      };
    };
    const sourceToken = (motionId: string): HTMLElement => {
      const token = demoElement.querySelector<HTMLElement>(
        `[data-kp-equation-motion-state="1"] [data-kp-motion-id="${motionId}"]`
      );

      if (token === null) {
        throw new Error(`Expected source token ${motionId}.`);
      }

      return token;
    };
    const snapshotToken = (motionId: string) => {
      const token = sourceToken(motionId);
      const rect = token.getBoundingClientRect();
      const style = getComputedStyle(token);

      return {
        motionId,
        center: {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        },
        opacity: Number(style.opacity),
        transform: parseInlineTransform(token.style.transform),
        visibility: style.visibility
      };
    };
    const sampleBeat = (beat: number) => {
      scrubber.value = String(beat);
      scrubber.dispatchEvent(new Event("input", { bubbles: true }));

      return {
        progress: demoElement.dataset["kpEquationMotionProgress"],
        cancelMode: demoElement.dataset["kpEquationMotionCancelMode"],
        xToken: snapshotToken("lhs.x"),
        cancelTokens: cancelMotionIds.map(snapshotToken),
        domParticleCount: demoElement.querySelectorAll(
          "[data-kp-equation-motion-particle]"
        ).length,
        webglParticles: (() => {
          const canvas = demoElement.querySelector<HTMLCanvasElement>(
            "[data-kp-equation-motion-webgl-particles]"
          );

          if (canvas === null) {
            return {
              exists: false,
              renderer: undefined,
              particleCount: 0,
              nonTransparentPixelCount: 0,
              maxAlpha: 0
            };
          }

          const gl = canvas.getContext("webgl");

          if (gl === null) {
            throw new Error("Expected cancellation particles to use WebGL.");
          }

          gl.finish();

          const pixels = new Uint8Array(canvas.width * canvas.height * 4);
          let maxAlpha = 0;
          let nonTransparentPixelCount = 0;

          gl.readPixels(
            0,
            0,
            canvas.width,
            canvas.height,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            pixels
          );

          for (let index = 3; index < pixels.length; index += 4) {
            const alpha = pixels[index] ?? 0;

            maxAlpha = Math.max(maxAlpha, alpha);

            if (alpha > 0) {
              nonTransparentPixelCount += 1;
            }

            if (nonTransparentPixelCount >= 32) {
              break;
            }
          }

          return {
            exists: true,
            renderer: canvas.dataset["kpEquationMotionParticleRenderer"],
            particleCount: Number(
              canvas.dataset["kpEquationMotionParticleCount"] ?? 0
            ),
            nonTransparentPixelCount,
            maxAlpha
          };
        })()
      };
    };
    const distance = (
      a: { readonly x: number; readonly y: number },
      b: { readonly x: number; readonly y: number }
    ): number => Math.hypot(a.x - b.x, a.y - b.y);
    const minimumScale = 0;
    const isMinimumScale = (scale: number): boolean =>
      Math.abs(scale - minimumScale) < 0.001;
    const convergenceProgressSpread = (
      tokens: readonly {
        readonly motionId: string;
        readonly center: { readonly x: number; readonly y: number };
      }[],
      distances: ReadonlyMap<string, number>
    ): number => {
      const progressValues = tokens.flatMap((token) => {
        const startDistance = distances.get(token.motionId) ?? 0;

        if (startDistance <= 1) {
          return [];
        }

        return [1 - distance(token.center, midpoint) / startDistance];
      });

      if (progressValues.length < 2) {
        return 0;
      }

      return Math.max(...progressValues) - Math.min(...progressValues);
    };

    const start = sampleBeat(0);
    const cancelBounds = start.cancelTokens.reduce(
      (bounds, token) => ({
        minX: Math.min(bounds.minX, token.center.x),
        maxX: Math.max(bounds.maxX, token.center.x),
        minY: Math.min(bounds.minY, token.center.y),
        maxY: Math.max(bounds.maxY, token.center.y)
      }),
      {
        minX: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY
      }
    );
    const midpoint = {
      x: (cancelBounds.minX + cancelBounds.maxX) / 2,
      y: (cancelBounds.minY + cancelBounds.maxY) / 2
    };
    const startDistances = new Map(
      start.cancelTokens.map((token) => [
        token.motionId,
        distance(token.center, midpoint)
      ])
    );
    const overlap = sampleBeat(15);
    const fullyOverlapped = sampleBeat(20);
    const dissolve = sampleBeat(23);
    const collapsed = sampleBeat(25);
    const pause = sampleBeat(30);
    const shifted = sampleBeat(40);

    return {
      midpoint,
      overlap,
      fullyOverlapped,
      dissolve,
      collapsed,
      pause,
      shifted,
      overlapTokensMovedCloser: overlap.cancelTokens.every(
        (token) =>
          distance(token.center, midpoint) <
          (startDistances.get(token.motionId) ?? 0) - 0.5
      ),
      overlapConvergenceProgressSpread: convergenceProgressSpread(
        overlap.cancelTokens,
        startDistances
      ),
      overlapTokensShrinking: overlap.cancelTokens.every(
        (token) => token.transform.scale > 0 && token.transform.scale < 1
      ),
      fullyOverlappedAtMidpoint: fullyOverlapped.cancelTokens.every(
        (token) => distance(token.center, midpoint) < 1.5
      ),
      fullyOverlappedAtMinimumScale: fullyOverlapped.cancelTokens.every(
        (token) =>
          isMinimumScale(token.transform.scale) &&
          token.opacity === 1 &&
          token.visibility === "visible"
      ),
      webglParticlesVisible:
        dissolve.webglParticles.exists &&
        dissolve.webglParticles.renderer === "webgl" &&
        dissolve.webglParticles.particleCount > 0 &&
        dissolve.webglParticles.nonTransparentPixelCount > 0 &&
        dissolve.webglParticles.maxAlpha > 0,
      dissolveFadingFromMinimumScale: dissolve.cancelTokens.every(
        (token) =>
          isMinimumScale(token.transform.scale) &&
          token.opacity > 0 &&
          token.opacity < 1
      ),
      collapsedAtMidpoint: collapsed.cancelTokens.every(
        (token) => distance(token.center, midpoint) < 1.5
      ),
      collapsedToMinimumFade: collapsed.cancelTokens.every(
        (token) =>
          isMinimumScale(token.transform.scale) &&
          token.opacity === 0 &&
          token.visibility === "hidden"
      ),
      survivorHeldDuringPause:
        Math.abs(pause.xToken.transform.x) < 0.01 &&
        Math.abs(pause.xToken.transform.y) < 0.01,
      survivorShiftedAfterPause:
        Math.abs(shifted.xToken.transform.x) > 0.5 ||
        Math.abs(shifted.xToken.transform.y) > 0.5
    };
  });

  expect(cancellationMotionState.overlap.cancelMode).toBe("particle-dissolve");
  expect(cancellationMotionState.overlap.progress).toBe("0.3");
  expect(cancellationMotionState.overlapTokensMovedCloser).toBe(true);
  expect(
    cancellationMotionState.overlapConvergenceProgressSpread
  ).toBeGreaterThan(0.03);
  expect(cancellationMotionState.overlapTokensShrinking).toBe(true);
  expect(cancellationMotionState.fullyOverlapped.progress).toBe("0.4");
  expect(cancellationMotionState.fullyOverlappedAtMidpoint).toBe(true);
  expect(cancellationMotionState.fullyOverlappedAtMinimumScale).toBe(true);
  expect(cancellationMotionState.dissolve.progress).toBe("0.46");
  expect(cancellationMotionState.dissolve.domParticleCount).toBe(0);
  expect(cancellationMotionState.webglParticlesVisible).toBe(true);
  expect(cancellationMotionState.dissolveFadingFromMinimumScale).toBe(true);
  expect(cancellationMotionState.collapsed.progress).toBe("0.5");
  expect(cancellationMotionState.collapsedAtMidpoint).toBe(true);
  expect(cancellationMotionState.collapsedToMinimumFade).toBe(true);
  expect(cancellationMotionState.pause.progress).toBe("0.6");
  expect(cancellationMotionState.survivorHeldDuringPause).toBe(true);
  expect(cancellationMotionState.shifted.progress).toBe("0.8");
  expect(cancellationMotionState.survivorShiftedAfterPause).toBe(true);

  await next.click();

  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "2");
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-latest-source",
    "1"
  );
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-latest-target",
    "2"
  );
  await expect(demo.locator('[data-kp-equation-motion-state="2"]')).toBeVisible();

  await next.click();

  const finalSimplifyState = await page.evaluate(() => {
    const demoElement = document.querySelector<HTMLElement>(
      "[data-kp-equation-motion-demo]"
    );

    if (demoElement === null) {
      throw new Error("Expected equation motion demo.");
    }

    const sourceIds = ["rhs.7", "rhs.inverse.minus", "rhs.inverse.3"] as const;
    const scrubber = demoElement.querySelector<HTMLInputElement>(
      '[data-action="set-equation-motion-beat"]'
    );

    if (scrubber === null) {
      throw new Error("Expected equation motion beat scrubber.");
    }

    const parseInlineTransform = (transform: string) => {
      const translate = transform.match(
        /translate\(([-0-9.]+)px, ([-0-9.]+)px\)/
      );
      const scale = transform.match(/scale\(([-0-9.]+)\)/);

      return {
        x: translate === null ? 0 : Number(translate[1]),
        y: translate === null ? 0 : Number(translate[2]),
        scale: scale === null ? 1 : Number(scale[1])
      };
    };
    const sourceToken = (motionId: string): HTMLElement => {
      const token = demoElement.querySelector<HTMLElement>(
        `[data-kp-equation-motion-state="2"] [data-kp-motion-id="${motionId}"]`
      );

      if (token === null) {
        throw new Error(`Expected final source token ${motionId}.`);
      }

      return token;
    };
    const snapshotSourceToken = (motionId: string) => {
      const token = sourceToken(motionId);
      const rect = token.getBoundingClientRect();

      return {
        motionId,
        center: {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        },
        opacity: Number(getComputedStyle(token).opacity),
        transform: parseInlineTransform(token.style.transform)
      };
    };
    const targetToken = (): HTMLElement => {
      const token = demoElement.querySelector<HTMLElement>(
        '[data-kp-equation-motion-state="3"] [data-kp-motion-id="rhs.4"]'
      );

      if (token === null) {
        throw new Error("Expected final target token rhs.4.");
      }

      return token;
    };
    const snapshotTargetToken = () => {
      const token = targetToken();
      const rect = token.getBoundingClientRect();
      const style = getComputedStyle(token);

      return {
        center: {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        },
        opacity: Number(style.opacity),
        transform: parseInlineTransform(token.style.transform),
        visibility: style.visibility
      };
    };
    const sampleBeat = (beat: number) => {
      scrubber.value = String(beat);
      scrubber.dispatchEvent(new Event("input", { bubbles: true }));

      const canvas = demoElement.querySelector<HTMLCanvasElement>(
        "[data-kp-equation-motion-liquid-merge]"
      );

      return {
        progress: demoElement.dataset["kpEquationMotionProgress"],
        liquidMode: demoElement.dataset["kpEquationMotionLiquidMode"],
        sourceTokens: sourceIds.map(snapshotSourceToken),
        targetToken: snapshotTargetToken(),
        liquidCanvasExists: canvas !== null
      };
    };
    const distance = (
      a: { readonly x: number; readonly y: number },
      b: { readonly x: number; readonly y: number }
    ): number => Math.hypot(a.x - b.x, a.y - b.y);
    const minimumScale = 0;
    const isMinimumScale = (scale: number): boolean =>
      Math.abs(scale - minimumScale) < 0.001;
    const convergenceProgressSpread = (
      tokens: readonly {
        readonly motionId: string;
        readonly center: { readonly x: number; readonly y: number };
      }[],
      distances: ReadonlyMap<string, number>
    ): number => {
      const progressValues = tokens.flatMap((token) => {
        const startDistance = distances.get(token.motionId) ?? 0;

        if (startDistance <= 1) {
          return [];
        }

        return [1 - distance(token.center, midpoint) / startDistance];
      });

      if (progressValues.length < 2) {
        return 0;
      }

      return Math.max(...progressValues) - Math.min(...progressValues);
    };

    const start = sampleBeat(0);
    const sourceBounds = start.sourceTokens.reduce(
      (bounds, token) => ({
        minX: Math.min(bounds.minX, token.center.x),
        maxX: Math.max(bounds.maxX, token.center.x),
        minY: Math.min(bounds.minY, token.center.y),
        maxY: Math.max(bounds.maxY, token.center.y)
      }),
      {
        minX: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY
      }
    );
    const midpoint = {
      x: (sourceBounds.minX + sourceBounds.maxX) / 2,
      y: (sourceBounds.minY + sourceBounds.maxY) / 2
    };
    const startDistances = new Map(
      start.sourceTokens.map((token) => [
        token.motionId,
        distance(token.center, midpoint)
      ])
    );
    const converging = sampleBeat(15);
    const collapsed = sampleBeat(25);
    const emerging = sampleBeat(30);

    return {
      midpoint,
      converging,
      collapsed,
      emerging,
      sourceTokensMovedCloser: converging.sourceTokens.every(
        (token) => {
          const startDistance = startDistances.get(token.motionId) ?? 0;
          const convergingDistance = distance(token.center, midpoint);

          return startDistance <= 0.5
            ? convergingDistance <= startDistance + 0.5
            : convergingDistance < startDistance - 0.5;
        }
      ),
      sourceTokensShrinking:
        converging.sourceTokens.every(
          (token) => token.transform.scale > 0 && token.transform.scale < 1
        ),
      sourceConvergenceProgressSpread: convergenceProgressSpread(
        converging.sourceTokens,
        startDistances
      ),
      sourceTokensCollapsed:
        collapsed.sourceTokens.every(
          (token) =>
            distance(token.center, midpoint) < 1.5 &&
            token.opacity === 0 &&
            isMinimumScale(token.transform.scale)
        ),
      targetCollapsedAtMidpoint:
        distance(collapsed.targetToken.center, midpoint) < 1.5 &&
        collapsed.targetToken.opacity === 0 &&
        isMinimumScale(collapsed.targetToken.transform.scale) &&
        collapsed.targetToken.visibility === "hidden",
      sourceTokensStayCollapsed:
        emerging.sourceTokens.every(
          (token) =>
            token.opacity === 0 && isMinimumScale(token.transform.scale)
        ),
      targetEmerging:
        distance(emerging.targetToken.center, midpoint) < 1.5 &&
        emerging.targetToken.opacity > 0 &&
        emerging.targetToken.opacity < 1 &&
        emerging.targetToken.transform.scale > minimumScale &&
        emerging.targetToken.transform.scale < 1 &&
        emerging.targetToken.visibility === "visible",
      noLiquidRenderer:
        emerging.liquidMode === undefined && !emerging.liquidCanvasExists
    };
  });

  expect(finalSimplifyState.converging.progress).toBe("0.3");
  expect(finalSimplifyState.sourceTokensMovedCloser).toBe(true);
  expect(finalSimplifyState.sourceTokensShrinking).toBe(true);
  expect(finalSimplifyState.sourceConvergenceProgressSpread).toBeGreaterThan(
    0.03
  );
  expect(finalSimplifyState.collapsed.progress).toBe("0.5");
  expect(finalSimplifyState.sourceTokensCollapsed).toBe(true);
  expect(finalSimplifyState.targetCollapsedAtMidpoint).toBe(true);
  expect(finalSimplifyState.emerging.progress).toBe("0.6");
  expect(finalSimplifyState.sourceTokensStayCollapsed).toBe(true);
  expect(finalSimplifyState.targetEmerging).toBe(true);
  expect(finalSimplifyState.noLiquidRenderer).toBe(true);

  await next.click();

  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "3");
  await expect(demo.locator('[data-kp-equation-motion-state="3"]')).toBeVisible();
  await expect(next).toBeDisabled();
  await expect(rewind).toBeEnabled();

  await rewind.click();

  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "2");
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-latest-source",
    "3"
  );
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-latest-target",
    "2"
  );
  await expect(demo).toHaveAttribute("data-kp-equation-motion-progress", "1");
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-plan-progress",
    "0"
  );
  await expect(demo.locator('[data-kp-equation-motion-state="2"]')).toBeVisible();
  await expect(demo.locator('[data-kp-equation-motion-state="3"]')).toBeHidden();
  await expect(next).toBeEnabled();
  await expect(rewind).toBeEnabled();

  const scrubbedProgress = await page.evaluate(() => {
    const demoElement = document.querySelector<HTMLElement>(
      "[data-kp-equation-motion-demo]"
    );

    if (demoElement === null) {
      throw new Error("Expected equation motion demo.");
    }

    window.__kpEquationMotionSetProgress?.(demoElement, 0.5);

    return {
      progress: demoElement.dataset["kpEquationMotionProgress"],
      sourceCount: demoElement.dataset["kpEquationMotionSourceAnchorCount"],
      targetCount: demoElement.dataset["kpEquationMotionTargetAnchorCount"]
    };
  });

  expect(scrubbedProgress).toEqual({
    progress: "0.5",
    sourceCount: "3",
    targetCount: "5"
  });
});

test("KaTeX WebGL transition blanks DOM during overlay and reveals target", async ({
  page
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const katexAdapterPath = "/src/rendering/katex-adapter.ts";
    const katexTransitionControllerPath =
      "/src/rendering/katex-transition-controller.ts";
    const katexTokenSnapshotPath = "/src/rendering/katex-token-snapshot.ts";
    const katexTextureAtlasPath = "/src/rendering/katex-texture-atlas.ts";
    const [
      { renderLatexToHtml },
      { transitionKatexEquations },
      { snapshotKatexTokens },
      { createKatexTextureAtlas }
    ] =
      await Promise.all([
        import(katexAdapterPath) as Promise<
          typeof import("../src/rendering/katex-adapter.ts")
        >,
        import(katexTransitionControllerPath) as Promise<
          typeof import("../src/rendering/katex-transition-controller.ts")
        >,
        import(katexTokenSnapshotPath) as Promise<
          typeof import("../src/rendering/katex-token-snapshot.ts")
        >,
        import(katexTextureAtlasPath) as Promise<
          typeof import("../src/rendering/katex-texture-atlas.ts")
        >
      ]);
    const host = document.createElement("section");

    host.setAttribute("data-testid", "katex-transition-host");
    host.innerHTML = `
      <div data-testid="source">${renderLatexToHtml(String.raw`x + x = 2x`)}</div>
      <div data-testid="target">${renderLatexToHtml(String.raw`\frac{x^2 - 1}{x - 1} = x + 1`)}</div>
    `;
    document.body.append(host);

    const source = host.querySelector<HTMLElement>('[data-testid="source"]');
    const target = host.querySelector<HTMLElement>('[data-testid="target"]');

    if (source === null || target === null) {
      throw new Error("Expected source and target KaTeX nodes.");
    }

    if (
      target.querySelector(".mfrac") === null ||
      target.querySelector(".frac-line") === null
    ) {
      throw new Error("Expected the target KaTeX equation to render a fraction.");
    }

    const assertStructuralAtlasPixels = async (
      root: HTMLElement,
      tokenText: string,
      description: string,
      options: { expectTransparentGaps?: boolean } = {}
    ) => {
      const snapshot = snapshotKatexTokens(root);
      const token = snapshot.tokens.find((entry) => entry.text === tokenText);

      if (token === undefined) {
        throw new Error(`Expected the KaTeX snapshot to include ${description}.`);
      }

      const structuralAtlas = await createKatexTextureAtlas([token], {
        maxTextureSize: 256,
        pixelRatio: 1
      });
      const region = structuralAtlas.regions.get(token.id);
      const page =
        region === undefined ? undefined : structuralAtlas.pages[region.page];
      const context = page?.getContext("2d");

      if (region === undefined || context == null) {
        throw new Error(`Expected a texture atlas region for ${description}.`);
      }

      const pixels = context.getImageData(
        region.x,
        region.y,
        region.width,
        region.height
      ).data;
      const hasPixels = Array.from(pixels).some(
        (value, index) => index % 4 === 3 && value > 0
      );

      if (!hasPixels) {
        throw new Error(`Expected the ${description} texture to contain pixels.`);
      }

      if (options.expectTransparentGaps === true) {
        let densestRow = 0;
        let densestRowOpaquePixels = 0;

        for (let y = 0; y < region.height; y += 1) {
          let opaquePixels = 0;

          for (let x = 0; x < region.width; x += 1) {
            const alpha = pixels[(y * region.width + x) * 4 + 3] ?? 0;

            if (alpha > 0) {
              opaquePixels += 1;
            }
          }

          if (opaquePixels > densestRowOpaquePixels) {
            densestRow = y;
            densestRowOpaquePixels = opaquePixels;
          }
        }

        const transparentGapCount = Array.from({ length: region.width }).filter(
          (_, x) => {
            const alpha = pixels[(densestRow * region.width + x) * 4 + 3] ?? 0;

            return alpha === 0;
          }
        ).length;

        if (transparentGapCount === 0) {
          throw new Error(`Expected the ${description} texture to contain gaps.`);
        }
      }
    };

    await assertStructuralAtlasPixels(
      target,
      "structural:frac-line",
      "fraction rule"
    );

    for (const structuralCase of [
      {
        latex: String.raw`\sqrt{x}`,
        selector: ".hide-tail svg",
        tokenText: "structural:hide-tail",
        description: "radical svg"
      },
      {
        latex: String.raw`\begin{array}{c}a\\\hline b\end{array}`,
        selector: ".hline",
        tokenText: "structural:hline",
        description: "array horizontal line"
      },
      {
        latex: String.raw`\begin{array}{c}a\\\hdashline b\end{array}`,
        selector: ".hdashline",
        tokenText: "structural:hdashline",
        description: "array dashed line",
        expectTransparentGaps: true
      },
      {
        latex: String.raw`\rule{1em}{0.2em}`,
        selector: ".rule",
        tokenText: "structural:rule",
        description: "rule"
      }
    ]) {
      const fixture = document.createElement("div");

      fixture.style.position = "absolute";
      fixture.style.left = "-10000px";
      fixture.style.top = "0";
      fixture.innerHTML = renderLatexToHtml(structuralCase.latex);
      document.body.append(fixture);

      if (fixture.querySelector(structuralCase.selector) === null) {
        throw new Error(
          `Expected KaTeX to render ${structuralCase.description}.`
        );
      }

      await assertStructuralAtlasPixels(
        fixture,
        structuralCase.tokenText,
        structuralCase.description,
        structuralCase.expectTransparentGaps === true
          ? { expectTransparentGaps: true }
          : {}
      );
      fixture.remove();
    }

    target.style.position = "absolute";
    target.style.left = `${source.getBoundingClientRect().left}px`;
    target.style.top = `${source.getBoundingClientRect().bottom + 24}px`;
    target.style.visibility = "visible";

    // The overlay only lives for the animation window, so record its state in-page.
    window.__kpKatexTransitionOverlayPromise = new Promise((resolve, reject) => {
      let observer: MutationObserver | undefined;
      let pixelSamplingStarted = false;
      let timeout: number | undefined;
      const rejectWithError = (error: Error) => {
        if (timeout !== undefined) {
          clearTimeout(timeout);
        }

        observer?.disconnect();
        reject(error);
      };
      timeout = window.setTimeout(() => {
        rejectWithError(
          new Error("Expected the KaTeX transition overlay to appear.")
        );
      }, 5_000);
      const settleWithOverlayState = (
        overlayVisible: boolean,
        sourceHidden: boolean,
        targetHidden: boolean,
        nonTransparentPixelCount: number,
        maxAlpha: number
      ) => {
        if (timeout !== undefined) {
          clearTimeout(timeout);
        }

        observer?.disconnect();
        resolve({
          overlayVisible,
          sourceHidden,
          targetHidden,
          nonTransparentPixelCount,
          maxAlpha
        });
      };
      const sampleOverlayPixels = (overlay: HTMLCanvasElement) => {
        const gl = overlay.getContext("webgl");

        if (gl === null) {
          throw new Error("Expected the KaTeX transition overlay to use WebGL.");
        }

        gl.finish();

        const pixels = new Uint8Array(overlay.width * overlay.height * 4);
        let maxAlpha = 0;
        let nonTransparentPixelCount = 0;

        gl.readPixels(
          0,
          0,
          overlay.width,
          overlay.height,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixels
        );

        for (let index = 3; index < pixels.length; index += 4) {
          const alpha = pixels[index] ?? 0;

          maxAlpha = Math.max(maxAlpha, alpha);

          if (alpha > 0) {
            nonTransparentPixelCount += 1;
          }

          if (nonTransparentPixelCount >= 16) {
            break;
          }
        }

        return { maxAlpha, nonTransparentPixelCount };
      };
      const assertOverlayState = () => {
        const overlay = document.querySelector(".katex-transition-overlay");

        if (!(overlay instanceof HTMLCanvasElement)) {
          return;
        }

        const rect = overlay?.getBoundingClientRect();
        const style = getComputedStyle(overlay);
        const overlayVisible =
          rect !== undefined &&
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden";
        const sourceHidden = source.classList.contains(
          "katex-transition-source-hidden"
        );
        const targetHidden = target.classList.contains(
          "katex-transition-target-hidden"
        );

        if (
          overlayVisible &&
          sourceHidden &&
          targetHidden &&
          !pixelSamplingStarted
        ) {
          pixelSamplingStarted = true;

          const sampleVisibleOverlay = () => {
            const activeOverlay = document.querySelector(
              ".katex-transition-overlay"
            );

            if (!(activeOverlay instanceof HTMLCanvasElement)) {
              rejectWithError(
                new Error(
                  "Expected the KaTeX transition overlay to render WebGL pixels before removal."
                )
              );
              return;
            }

            let pixelSample: ReturnType<typeof sampleOverlayPixels>;

            try {
              pixelSample = sampleOverlayPixels(activeOverlay);
            } catch (error) {
              rejectWithError(
                error instanceof Error
                  ? error
                  : new Error("Could not sample the KaTeX WebGL overlay.")
              );
              return;
            }

            if (pixelSample.nonTransparentPixelCount > 0) {
              settleWithOverlayState(
                overlayVisible,
                sourceHidden,
                targetHidden,
                pixelSample.nonTransparentPixelCount,
                pixelSample.maxAlpha
              );
              return;
            }

            requestAnimationFrame(sampleVisibleOverlay);
          };

          requestAnimationFrame(sampleVisibleOverlay);
        }
      };

      observer = new MutationObserver(assertOverlayState);
      observer.observe(document.body, {
        attributeFilter: ["class"],
        attributes: true,
        childList: true,
        subtree: true
      });

      assertOverlayState();
    });
    window.__kpKatexTransitionPromise = transitionKatexEquations(source, target, {
      durationMs: 120
    });
  });

  const overlayState = await page.evaluate(() => {
    if (window.__kpKatexTransitionOverlayPromise === undefined) {
      throw new Error("Expected a KaTeX transition overlay promise.");
    }

    return window.__kpKatexTransitionOverlayPromise;
  });

  expect(overlayState).toEqual({
    overlayVisible: true,
    sourceHidden: true,
    targetHidden: true,
    nonTransparentPixelCount: expect.any(Number),
    maxAlpha: expect.any(Number)
  });
  expect(overlayState.nonTransparentPixelCount).toBeGreaterThan(0);
  expect(overlayState.maxAlpha).toBeGreaterThan(0);

  const result = await page.evaluate(() => {
    if (window.__kpKatexTransitionPromise === undefined) {
      throw new Error("Expected a KaTeX transition promise.");
    }

    return window.__kpKatexTransitionPromise;
  });

  expect(result.renderer).toBe("webgl");
  expect(result.sourceTokenCount).toBeGreaterThan(0);
  expect(result.targetTokenCount).toBeGreaterThan(0);
  await expect(page.locator(".katex-transition-overlay")).toHaveCount(0);
  await expect(page.locator('[data-testid="target"] .katex')).toBeVisible();
});

test("KaTeX texture atlas preserves nested fraction geometry for grouped captures", async ({
  page
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const katexAdapterPath = "/src/rendering/katex-adapter.ts";
    const katexTextureAtlasPath = "/src/rendering/katex-texture-atlas.ts";
    const [
      { renderLatexToHtml },
      { createKatexTextureAtlas, measureKatexTextureCaptureRect }
    ] =
      await Promise.all([
        import(katexAdapterPath) as Promise<
          typeof import("../src/rendering/katex-adapter.ts")
        >,
        import(katexTextureAtlasPath) as Promise<
          typeof import("../src/rendering/katex-texture-atlas.ts")
        >
      ]);
    const fixture = document.createElement("div");

    fixture.style.position = "absolute";
    fixture.style.left = "80px";
    fixture.style.top = "80px";
    fixture.innerHTML = renderLatexToHtml(String.raw`\frac{x^2 - 1}{x - 1}`);
    document.body.append(fixture);

    const fraction = fixture.querySelector<HTMLElement>(".katex-html .mfrac");

    if (fraction === null) {
      throw new Error("Expected KaTeX to render a fraction group.");
    }

    const rect = measureKatexTextureCaptureRect(fraction);
    const atlas = await createKatexTextureAtlas(
      [
        {
          id: "grouped-fraction",
          text: "artifact:grouped-fraction",
          signature: "mfrac",
          rect,
          localRect: {
            left: 0,
            top: 0,
            width: rect.width,
            height: rect.height
          },
          row: 0,
          element: fraction
        }
      ],
      {
        maxTextureSize: 256,
        pixelRatio: 1
      }
    );
    const region = atlas.regions.get("grouped-fraction");
    const page = region === undefined ? undefined : atlas.pages[region.page];
    const context = page?.getContext("2d");

    if (region === undefined || context == null) {
      throw new Error("Expected a texture atlas region for the fraction group.");
    }

    const pixels = context.getImageData(
      region.x,
      region.y,
      region.width,
      region.height
    ).data;
    const rowOpaqueCounts = Array.from({ length: region.height }, (_, y) => {
      let opaqueCount = 0;

      for (let x = 0; x < region.width; x += 1) {
        const alpha = pixels[(y * region.width + x) * 4 + 3] ?? 0;

        if (alpha > 16) {
          opaqueCount += 1;
        }
      }

      return opaqueCount;
    });
    const significantRowThreshold = Math.max(1, Math.floor(region.width * 0.08));
    const significantRows = rowOpaqueCounts
      .map((opaqueCount, y) => ({ opaqueCount, y }))
      .filter(({ opaqueCount }) => opaqueCount >= significantRowThreshold)
      .map(({ y }) => y);

    if (significantRows.length === 0) {
      throw new Error("Expected the grouped fraction texture to contain pixels.");
    }

    const clusters: number[][] = [];

    for (const y of significantRows) {
      const current = clusters[clusters.length - 1];

      if (current === undefined || y - (current[current.length - 1] ?? y) > 2) {
        clusters.push([y]);
      } else {
        current.push(y);
      }
    }

    const firstSignificantRow = significantRows[0] ?? 0;
    const lastSignificantRow = significantRows[significantRows.length - 1] ?? 0;
    const occupiedSpan = lastSignificantRow - firstSignificantRow + 1;

    if (clusters.length < 2 || occupiedSpan < region.height * 0.55) {
      throw new Error(
        `Expected grouped fraction capture to preserve stacked geometry; got ${clusters.length} row clusters across ${occupiedSpan}/${region.height}px.`
      );
    }

    fixture.remove();
  });
});

test("KaTeX texture atlas waits for document fonts before capture", async ({
  page
}) => {
  await page.goto("/");
  const state = await page.evaluate(async () => {
    const katexTextureAtlasPath = "/src/rendering/katex-texture-atlas.ts";
    const { createKatexTextureAtlas } = (await import(
      katexTextureAtlasPath
    )) as typeof import("../src/rendering/katex-texture-atlas.ts");
    const originalFontsDescriptor = Object.getOwnPropertyDescriptor(
      document,
      "fonts"
    );
    let releaseFontsReady: (() => void) | undefined;
    const fontsReady = new Promise<void>((resolve) => {
      releaseFontsReady = resolve;
    });
    const tokenElement = document.createElement("span");

    tokenElement.className = "frac-line";
    tokenElement.style.position = "absolute";
    tokenElement.style.left = "20px";
    tokenElement.style.top = "20px";
    tokenElement.style.display = "block";
    tokenElement.style.width = "24px";
    tokenElement.style.height = "2px";
    tokenElement.style.borderBottom = "2px solid black";
    document.body.append(tokenElement);
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { ready: fontsReady }
    });

    try {
      const rect = tokenElement.getBoundingClientRect();
      const atlasPromise = createKatexTextureAtlas(
        [
          {
            id: "font-wait-structural-token",
            text: "structural:frac-line",
            signature: "frac-line",
            rect,
            localRect: {
              left: 0,
              top: 0,
              width: rect.width,
              height: rect.height
            },
            row: 0,
            element: tokenElement
          }
        ],
        {
          maxTextureSize: 64,
          pixelRatio: 1
        }
      );
      let settledBeforeFontsReady = false;

      atlasPromise.then(() => {
        settledBeforeFontsReady = true;
      });
      await Promise.resolve();
      await Promise.resolve();
      const pendingBeforeRelease = settledBeforeFontsReady === false;

      releaseFontsReady?.();
      await atlasPromise;

      return {
        pendingBeforeRelease,
        settledAfterRelease: true
      };
    } finally {
      tokenElement.remove();
      if (originalFontsDescriptor === undefined) {
        delete (document as { fonts?: FontFaceSet }).fonts;
      } else {
        Object.defineProperty(document, "fonts", originalFontsDescriptor);
      }
    }
  });

  expect(state).toEqual({
    pendingBeforeRelease: true,
    settledAfterRelease: true
  });
});

declare global {
  interface Window {
    __kpEquationMotionSetProgress?: (
      demo: HTMLElement,
      progress: number
    ) => void;
    __kpKatexTransitionPromise?: Promise<{
      renderer: string;
      sourceTokenCount: number;
      targetTokenCount: number;
    }>;
    __kpKatexTransitionOverlayPromise?: Promise<{
      overlayVisible: boolean;
      sourceHidden: boolean;
      targetHidden: boolean;
      nonTransparentPixelCount: number;
      maxAlpha: number;
    }>;
  }
}
