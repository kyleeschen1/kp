import { expect, test } from "@playwright/test";

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

test("editor equation motion demo advances, rewinds, and replays transitions", async ({
  page
}) => {
  await page.goto("/");

  const demo = page.locator("[data-kp-equation-motion-demo]");
  const next = demo.getByRole("button", { name: "Next" });
  const rewind = demo.getByRole("button", { name: "Rewind" });
  const replay = demo.getByRole("button", { name: "Replay" });

  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "0");
  await expect(
    demo.locator('[data-kp-equation-motion-measure="transfer-target"]')
  ).toHaveText(/x\s*=\s*7\s*−?\s*-?\s*3/);
  await expect(rewind).toBeDisabled();
  await expect(replay).toBeDisabled();
  await expect(next).toBeEnabled();

  await page.evaluate(() => {
    const demo = document.querySelector<HTMLElement>(
      "[data-kp-equation-motion-demo]"
    );

    if (demo === null) {
      throw new Error("Expected the equation motion demo.");
    }

    window.__kpEquationMotionHandoffPromise = new Promise(
      (resolve, reject) => {
        let observer: MutationObserver | undefined;
        let sawOverlay = false;
        let settled = false;
        let timeout: number | undefined;
        const finish = (state: {
          step: string | undefined;
          handoff: string | undefined;
          overlayPresent: boolean;
        }) => {
          if (settled) {
            return;
          }

          settled = true;
          if (timeout !== undefined) {
            clearTimeout(timeout);
          }
          observer?.disconnect();
          resolve(state);
        };
        const fail = (error: Error) => {
          if (settled) {
            return;
          }

          settled = true;
          if (timeout !== undefined) {
            clearTimeout(timeout);
          }
          observer?.disconnect();
          reject(error);
        };
        const inspectHandoff = () => {
          const overlay = document.querySelector(
            '[data-kp-equation-motion-choreography="transfer-3"]'
          );

          if (overlay !== null) {
            sawOverlay = true;
            if (demo.dataset["kpEquationMotionStep"] === "1") {
              finish({
                step: demo.dataset["kpEquationMotionStep"],
                handoff: demo.dataset["kpEquationMotionHandoff"],
                overlayPresent: true
              });
            }
            return;
          }

          if (sawOverlay && demo.dataset["kpEquationMotionStep"] === "1") {
            fail(
              new Error(
                "Equation motion step changed after choreography overlay cleanup."
              )
            );
          }
        };

        timeout = window.setTimeout(() => {
          fail(new Error("Expected equation motion handoff before cleanup."));
        }, 5_000);
        observer = new MutationObserver(inspectHandoff);
        observer.observe(document.body, {
          attributeFilter: [
            "data-kp-equation-motion-step",
            "data-kp-equation-motion-handoff"
          ],
          attributes: true,
          childList: true,
          subtree: true
        });
        inspectHandoff();
      }
    );
  });

  await next.click();
  await expect(demo).toHaveAttribute("data-kp-equation-motion-busy", "true");
  await expect(
    page.locator(
      '[data-kp-equation-motion-choreography="transfer-3"]'
    )
  ).toBeVisible();
  await expect(
    page.locator(
      '[data-kp-equation-motion-choreography="transfer-3"][data-kp-equation-motion-measured-from="transfer-target"]'
    )
  ).toBeVisible();
  await expect(
    page.locator('[data-kp-equation-motion-role="moving-3"]')
  ).toHaveText("3");
  await expect(
    page.locator('[data-kp-equation-motion-role="persisting-equals"]')
  ).toHaveText("=");
  await expect(
    page.locator('[data-kp-equation-motion-role="persisting-seven"]')
  ).toHaveText("7");
  await expect(
    page.locator('[data-kp-equation-motion-role="vanishing-plus"]')
  ).toHaveText("+");
  await expect(
    page.locator('[data-kp-equation-motion-role="appearing-minus"]')
  ).toHaveText(/[-−]/);
  await setEquationMotionAnimationsCurrentTime(page, 220);
  await expectEquationMotionRolesAlignedWithState(page, "0", [
    { role: "persisting-x", text: "x" },
    { role: "persisting-equals", text: "=" },
    { role: "persisting-seven", text: "7" }
  ]);
  await resumeEquationMotionAnimations(page);
  await page.waitForTimeout(650);
  await expect(
    page.locator(
      '[data-kp-equation-motion-choreography="transfer-3"]'
    )
  ).toBeVisible();
  await expect(
    page.locator('[data-kp-equation-motion-role="moving-3"]')
  ).toBeVisible();
  await expect(
    page.locator('[data-kp-equation-motion-role="persisting-equals"]')
  ).toBeVisible();
  await expect(
    page.locator('[data-kp-equation-motion-role="persisting-seven"]')
  ).toBeVisible();
  await expect(
    page.locator('[data-kp-equation-motion-role="appearing-minus"]')
  ).toBeVisible();
  await expect(
    page.locator('[data-kp-equation-motion-role="vanishing-plus"]')
  ).toHaveCSS("opacity", "0");
  await expect(next).toBeDisabled();
  const transferHandoff = await page.evaluate(() => {
    if (window.__kpEquationMotionHandoffPromise === undefined) {
      throw new Error("Expected an equation motion handoff promise.");
    }

    return window.__kpEquationMotionHandoffPromise;
  });

  expect(transferHandoff).toEqual({
    step: "1",
    handoff: "true",
    overlayPresent: true
  });
  const transferOverlay = page.locator(
    '[data-kp-equation-motion-choreography="transfer-3"]'
  );

  await expect(transferOverlay).toHaveAttribute(
    "data-kp-equation-motion-overlay-state",
    "handoff-fade"
  );
  await expectStableEquationMotionHandoff(page, {
    persistentRoles: [
      "persisting-x",
      "persisting-equals",
      "persisting-seven",
      "moving-3",
      "appearing-minus"
    ],
    settledRoles: [
      "settled-x",
      "settled-equals",
      "settled-seven",
      "settled-minus",
      "settled-3"
    ]
  });
  await expect(
    page.locator('[data-kp-equation-motion-role="persisting-x"]')
  ).toHaveText("x");
  await expect(
    page.locator('[data-kp-equation-motion-role="persisting-equals"]')
  ).toHaveText("=");
  await expect(
    page.locator('[data-kp-equation-motion-role="persisting-seven"]')
  ).toHaveText("7");
  await expect(
    page.locator('[data-kp-equation-motion-role="appearing-minus"]')
  ).toHaveText(/[-−]/);
  await expect(
    page.locator('[data-kp-equation-motion-role="moving-3"]')
  ).toHaveText("3");
  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "1", {
    timeout: 5_000
  });
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-last-renderer",
    "custom-transfer"
  );
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-latest-source",
    "0"
  );
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-latest-target",
    "1"
  );
  await expect(rewind).toBeEnabled();
  await expect(replay).toBeEnabled();
  await expect(next).toBeEnabled();

  await page.evaluate(() => {
    const demo = document.querySelector<HTMLElement>(
      "[data-kp-equation-motion-demo]"
    );

    if (demo === null) {
      throw new Error("Expected the equation motion demo.");
    }

    window.__kpEquationMotionMeltHandoffPromise = new Promise(
      (resolve, reject) => {
        let observer: MutationObserver | undefined;
        let sawOverlay = false;
        let settled = false;
        let timeout: number | undefined;
        const finish = (state: {
          step: string | undefined;
          handoff: string | undefined;
          overlayPresent: boolean;
        }) => {
          if (settled) {
            return;
          }

          settled = true;
          if (timeout !== undefined) {
            clearTimeout(timeout);
          }
          observer?.disconnect();
          resolve(state);
        };
        const fail = (error: Error) => {
          if (settled) {
            return;
          }

          settled = true;
          if (timeout !== undefined) {
            clearTimeout(timeout);
          }
          observer?.disconnect();
          reject(error);
        };
        const inspectHandoff = () => {
          const overlay = document.querySelector(
            '[data-kp-equation-motion-choreography="melt-right-side"]'
          );

          if (overlay !== null) {
            sawOverlay = true;
            if (demo.dataset["kpEquationMotionStep"] === "2") {
              finish({
                step: demo.dataset["kpEquationMotionStep"],
                handoff: demo.dataset["kpEquationMotionHandoff"],
                overlayPresent: true
              });
            }
            return;
          }

          if (sawOverlay && demo.dataset["kpEquationMotionStep"] === "2") {
            fail(
              new Error(
                "Equation motion melt step changed after choreography overlay cleanup."
              )
            );
          }
        };

        timeout = window.setTimeout(() => {
          fail(new Error("Expected equation motion melt handoff before cleanup."));
        }, 5_000);
        observer = new MutationObserver(inspectHandoff);
        observer.observe(document.body, {
          attributeFilter: [
            "data-kp-equation-motion-step",
            "data-kp-equation-motion-handoff"
          ],
          attributes: true,
          childList: true,
          subtree: true
        });
        inspectHandoff();
      }
    );
  });

  await next.click();
  await expect(
    page.locator(
      '[data-kp-equation-motion-choreography="melt-right-side"]'
    )
  ).toBeVisible();
  await expect(
    page.locator('[data-kp-equation-motion-role="melting-right-side"]')
  ).toBeVisible();
  await expect(
    page.locator('[data-kp-equation-motion-role="appearing-result"]')
  ).toHaveText("4");
  await setEquationMotionAnimationsCurrentTime(page, 220);
  await expectEquationMotionRolesAlignedWithState(page, "1", [
    { role: "persisting-x", text: "x" },
    { role: "persisting-equals", text: "=" }
  ]);
  await resumeEquationMotionAnimations(page);
  const meltHandoff = await page.evaluate(() => {
    if (window.__kpEquationMotionMeltHandoffPromise === undefined) {
      throw new Error("Expected an equation motion melt handoff promise.");
    }

    return window.__kpEquationMotionMeltHandoffPromise;
  });

  expect(meltHandoff).toEqual({
    step: "2",
    handoff: "true",
    overlayPresent: true
  });
  const meltOverlay = page.locator(
    '[data-kp-equation-motion-choreography="melt-right-side"]'
  );

  await expect(meltOverlay).toHaveAttribute(
    "data-kp-equation-motion-overlay-state",
    "handoff-fade"
  );
  await expectStableEquationMotionHandoff(page, {
    persistentRoles: ["persisting-x", "persisting-equals", "appearing-result"],
    settledRoles: ["settled-x", "settled-equals", "settled-4"]
  });
  await expect(
    page.locator('[data-kp-equation-motion-role="persisting-x"]')
  ).toHaveText("x");
  await expect(
    page.locator('[data-kp-equation-motion-role="persisting-equals"]')
  ).toHaveText("=");
  await expect(
    page.locator('[data-kp-equation-motion-role="appearing-result"]')
  ).toHaveText("4");
  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "2", {
    timeout: 5_000
  });
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-last-renderer",
    "custom-melt"
  );
  await expect(next).toBeDisabled();

  await rewind.click();
  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "1", {
    timeout: 5_000
  });
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-latest-source",
    "2"
  );
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-latest-target",
    "1"
  );

  await replay.click();
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-transition-count",
    "4",
    { timeout: 5_000 }
  );
  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "1");
  await expect(page.locator(".katex-transition-overlay")).toHaveCount(0);
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
    __kpEquationMotionHandoffPromise?: Promise<{
      step: string | undefined;
      handoff: string | undefined;
      overlayPresent: boolean;
    }>;
    __kpEquationMotionMeltHandoffPromise?: Promise<{
      step: string | undefined;
      handoff: string | undefined;
      overlayPresent: boolean;
    }>;
  }
}

async function expectStableEquationMotionHandoff(
  page: import("@playwright/test").Page,
  roles: {
    persistentRoles: readonly string[];
    settledRoles: readonly string[];
  }
): Promise<void> {
  const state = await page.evaluate(({ persistentRoles, settledRoles }) => {
    const persistentGroupOpacities = Object.fromEntries(
      persistentRoles.map((role) => {
        const token = document.querySelector(
          `[data-kp-equation-motion-role="${role}"]`
        );
        const group = token?.closest(".equation-motion-choreography__group");

        return [
          role,
          group instanceof HTMLElement ? getComputedStyle(group).opacity : null
        ];
      })
    );
    const settledRoleCounts = Object.fromEntries(
      settledRoles.map((role) => [
        role,
        document.querySelectorAll(`[data-kp-equation-motion-role="${role}"]`)
          .length
      ])
    );

    return { persistentGroupOpacities, settledRoleCounts };
  }, roles);

  expect(state.persistentGroupOpacities).toEqual(
    Object.fromEntries(roles.persistentRoles.map((role) => [role, "1"]))
  );
  expect(state.settledRoleCounts).toEqual(
    Object.fromEntries(roles.settledRoles.map((role) => [role, 0]))
  );
}

async function setEquationMotionAnimationsCurrentTime(
  page: import("@playwright/test").Page,
  currentTimeMs: number
): Promise<void> {
  await page.evaluate((currentTime) => {
    for (const animation of document.getAnimations()) {
      const effect = animation.effect;

      if (
        effect instanceof KeyframeEffect &&
        effect.target instanceof Element &&
        effect.target.closest(".equation-motion-choreography") !== null
      ) {
        animation.pause();
        animation.currentTime = currentTime;
      }
    }
  }, currentTimeMs);
}

async function resumeEquationMotionAnimations(
  page: import("@playwright/test").Page
): Promise<void> {
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      const effect = animation.effect;

      if (
        effect instanceof KeyframeEffect &&
        effect.target instanceof Element &&
        effect.target.closest(".equation-motion-choreography") !== null
      ) {
        animation.play();
      }
    }
  });
}

async function expectEquationMotionRolesAlignedWithState(
  page: import("@playwright/test").Page,
  stateIndex: string,
  roles: readonly { role: string; text: string }[]
): Promise<void> {
  const deltas = await page.evaluate(
    ({ stateIndex, roles }) => {
      const normalize = (text: string | null) =>
        (text ?? "").replace(/\s+/g, " ").replace("\u2212", "-").trim();
      const rectOf = (element: Element) => {
        const rect = element.getBoundingClientRect();

        return {
          left: rect.left,
          top: rect.top
        };
      };
      const sourceState = document.querySelector(
        `[data-kp-equation-motion-state="${stateIndex}"]`
      );

      if (!(sourceState instanceof HTMLElement)) {
        throw new Error(`Expected equation motion state ${stateIndex}.`);
      }

      return roles.map(({ role, text }) => {
        const ghost = document.querySelector(
          `[data-kp-equation-motion-role="${role}"]`
        );
        const sourceToken = Array.from(
          sourceState.querySelectorAll(".katex-html span")
        ).find((element) => {
          const hasTextChild = Array.from(element.children).some(
            (child) => normalize(child.textContent).length > 0
          );

          return !hasTextChild && normalize(element.textContent) === text;
        });

        if (!(ghost instanceof HTMLElement) || sourceToken === undefined) {
          throw new Error(`Expected ${role} and source token ${text}.`);
        }

        const ghostRect = rectOf(ghost);
        const sourceRect = rectOf(sourceToken);

        return {
          role,
          dx: Math.abs(ghostRect.left - sourceRect.left),
          dy: Math.abs(ghostRect.top - sourceRect.top)
        };
      });
    },
    { stateIndex, roles }
  );

  for (const delta of deltas) {
    expect(delta.dx, `${delta.role} horizontal drift`).toBeLessThanOrEqual(1);
    expect(delta.dy, `${delta.role} vertical drift`).toBeLessThanOrEqual(1);
  }
}
