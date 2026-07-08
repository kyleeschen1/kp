import { expect, test } from "@playwright/test";

test("editor equation motion demo uses semantic playback plans", async ({
  page
}) => {
  await page.goto("/");

  const demo = page.locator("[data-kp-equation-motion-demo]");
  const next = demo.locator('[data-action="equation-motion-next"]');
  const rewind = demo.locator('[data-action="equation-motion-rewind"]');

  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "0");
  await expect(demo.locator('[data-kp-equation-motion-state="0"]')).toBeVisible();
  await expect(demo.locator('[data-kp-equation-motion-state="1"]')).toBeHidden();
  await expect(rewind).toBeDisabled();
  await expect(next).toBeEnabled();

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

  await next.click();

  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "1");
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
