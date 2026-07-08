import { expect, test } from "@playwright/test";

test("KaTeX WebGL transition blanks DOM during overlay and reveals target", async ({
  page
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const katexAdapterPath = "/src/rendering/katex-adapter.ts";
    const katexTransitionControllerPath =
      "/src/rendering/katex-transition-controller.ts";
    const [{ renderLatexToHtml }, { transitionKatexEquations }] =
      await Promise.all([
        import(katexAdapterPath) as Promise<
          typeof import("../src/rendering/katex-adapter.ts")
        >,
        import(katexTransitionControllerPath) as Promise<
          typeof import("../src/rendering/katex-transition-controller.ts")
        >
      ]);
    const host = document.createElement("section");

    host.setAttribute("data-testid", "katex-transition-host");
    host.innerHTML = `
      <div data-testid="source">${renderLatexToHtml(String.raw`x + x = 2x`)}</div>
      <div data-testid="target">${renderLatexToHtml(String.raw`\\frac{x^2 - 1}{x - 1} = x + 1`)}</div>
    `;
    document.body.append(host);

    const source = host.querySelector<HTMLElement>('[data-testid="source"]');
    const target = host.querySelector<HTMLElement>('[data-testid="target"]');

    if (source === null || target === null) {
      throw new Error("Expected source and target KaTeX nodes.");
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
