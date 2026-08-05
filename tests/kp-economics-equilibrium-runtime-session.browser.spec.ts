import { expect, test } from "@playwright/test";

test("economics runtime scaffold mounts once and disposes idempotently", async ({
  page
}) => {
  await page.goto("/tutorials/economics/demand-shift/");

  const result = await page.evaluate(async () => {
    const runtimeUrl = "/src/rendering/economics-equilibrium-runtime-session.ts";
    const animationUrl = "/src/animation/economics-equilibrium-adapter.ts";
    const runtimeFrameUrl =
      "/src/animation/economics-equilibrium-runtime-frame.ts";
    const samplerUrl = "/src/animation/runtime-sampler.ts";
    const viewportUrl = "/src/editor/graph-svg-viewport.ts";
    const retainedMathUrl =
      "/src/rendering/economics-equilibrium-retained-math.ts";
    const runtime = await import(/* @vite-ignore */ runtimeUrl);
    const animationModule = await import(/* @vite-ignore */ animationUrl);
    const runtimeFrameModule = await import(/* @vite-ignore */ runtimeFrameUrl);
    const samplerModule = await import(/* @vite-ignore */ samplerUrl);
    const viewportModule = await import(/* @vite-ignore */ viewportUrl);
    const retainedMath = await import(/* @vite-ignore */ retainedMathUrl);
    const animation = animationModule.createEconomicsEquilibriumAnimationAsset();
    const sample = (progress: number) =>
      runtimeFrameModule.sampleKpEconomicsEquilibriumRuntimeFrame({
      animation,
      runtimeFrame: samplerModule.sampleKpAnimationRuntimeFrame({
        animation,
        progress
      })
    });
    const frame = sample(0);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const content = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.append(content);
    const input = {
      content,
      frame,
      viewport: viewportModule.createKpEditorGraphSvgViewportModel(animation),
      renderInlineLatex: retainedMath.renderKpEconomicsRetainedInlineLatex
    };
    const first = runtime.mountKpEconomicsEquilibriumRuntimeScaffold(input);
    const initialView = first.view;
    const second = runtime.mountKpEconomicsEquilibriumRuntimeScaffold(input);
    const descendants = initialView.querySelectorAll("*").length;
    const supply = initialView.querySelector("[data-kp-economics-supply-line]");
    const firstGridLine = initialView.querySelector(
      '[data-kp-economics-grid-axis="quantity"]'
    );
    const observerRecords: MutationRecord[] = [];
    const observer = new MutationObserver((records) => observerRecords.push(...records));
    observer.observe(initialView, { attributes: true, subtree: true });
    runtime.patchKpEconomicsEquilibriumStableStructure({
      scaffold: first,
      frame,
      viewport: input.viewport
    });
    await Promise.resolve();
    const sameInputMutations = observerRecords.length;
    runtime.patchKpEconomicsEquilibriumStableStructure({
      scaffold: first,
      frame,
      viewport: { ...input.viewport, width: 700 }
    });
    await Promise.resolve();
    const changedInputMutations = observerRecords.length;
    const resizedSupplyX2 = supply?.getAttribute("x2");
    const demand = initialView.querySelector("[data-kp-economics-demand-line]");
    const demandLabel = initialView.querySelector(
      '[data-kp-economics-math-label="curve-demand-current"]'
    );
    const demandKatex = demandLabel?.querySelector(".katex");
    const equilibrium = initialView.querySelector(
      "[data-kp-economics-equilibrium-point]"
    );
    const equilibriumLabel = initialView.querySelector(
      '[data-kp-economics-math-label="equilibrium-current"]'
    );
    const equilibriumKatex = equilibriumLabel?.querySelector(".katex");
    const initialReference = initialView.querySelector(
      "[data-kp-economics-initial-equilibrium-reference]"
    );
    const shiftFrame = sample(0.44);
    runtime.patchKpEconomicsEquilibriumDynamicStructure({
      scaffold: first,
      frame: shiftFrame,
      viewport: input.viewport
    });
    const demandShiftY1 = demand?.getAttribute("y1");
    runtime.patchKpEconomicsEquilibriumMathLabels({
      scaffold: first,
      frame: shiftFrame,
      viewport: input.viewport
    });
    const demandLabelOwner = demandLabel?.querySelector("[data-kp-latex]") as
      | HTMLElement
      | null
      | undefined;
    const demandLabelLatex = demandLabelOwner?.dataset["kpLatex"];
    const equilibriumLabelOwner = equilibriumLabel?.querySelector(
      "[data-kp-latex]"
    ) as HTMLElement | null | undefined;
    const equilibriumLabelLatex = equilibriumLabelOwner?.dataset["kpLatex"];
    const equilibriumRelation = equilibriumLabelOwner?.querySelector(
      ".katex-html .mrel"
    )?.textContent;
    const equilibriumValues = Array.from(equilibriumLabelOwner?.querySelectorAll(
      ".katex-html > .base:nth-child(2) > .mord"
    ) ?? []).map((value) => value.textContent);
    const demandReferenceLabel = initialView.querySelector(
      '[data-kp-economics-math-label="curve-demand-reference"]'
    );
    const equilibriumReferenceLabel = initialView.querySelector(
      '[data-kp-economics-math-label="equilibrium-reference"]'
    );
    const guideGroup = initialView.querySelector(
      "[data-kp-economics-initial-equilibrium-guides]"
    );
    runtime.patchKpEconomicsEquilibriumDynamicStructure({
      scaffold: first,
      frame: sample(0.8),
      viewport: input.viewport
    });
    runtime.patchKpEconomicsEquilibriumMathLabels({
      scaffold: first,
      frame: sample(0.8),
      viewport: input.viewport
    });
    const demandReferenceLabelRetained = demandReferenceLabel ===
      initialView.querySelector(
        '[data-kp-economics-math-label="curve-demand-reference"]'
      );
    const equilibriumReferenceLabelRetained = equilibriumReferenceLabel ===
      initialView.querySelector(
        '[data-kp-economics-math-label="equilibrium-reference"]'
      );
    const guideGroupRetained = guideGroup === initialView.querySelector(
      "[data-kp-economics-initial-equilibrium-guides]"
    );
    runtime.patchKpEconomicsEquilibriumDynamicStructure({
      scaffold: first,
      frame,
      viewport: input.viewport
    });
    runtime.patchKpEconomicsEquilibriumMathLabels({
      scaffold: first,
      frame,
      viewport: input.viewport
    });
    observer.disconnect();
    first.dispose();
    first.dispose();
    const fullSession = runtime.createKpEconomicsEquilibriumRuntimeSession({
      content,
      frame: shiftFrame,
      viewport: input.viewport,
      renderInlineLatex: retainedMath.renderKpEconomicsRetainedInlineLatex
    });
    const shiftedDescription = content.querySelector(
      "[data-kp-economics-nonvisual-summary]"
    )?.textContent;
    fullSession.apply({ frame: sample(1), viewport: input.viewport });
    const settledDescription = content.querySelector(
      "[data-kp-economics-nonvisual-summary]"
    )?.textContent;
    fullSession.dispose();
    let disposedApplyThrows = false;
    try {
      fullSession.apply({ frame, viewport: input.viewport });
    } catch {
      disposedApplyThrows = true;
    }

    return {
      descendants,
      changedInputMutations,
      demandRetained: demand === initialView.querySelector(
        "[data-kp-economics-demand-line]"
      ),
      demandKatexRetained: demandKatex === demandLabel?.querySelector(".katex"),
      demandLabelLatex,
      demandShiftY1,
      disposedStatus: first.status,
      equilibriumRetained: equilibrium === initialView.querySelector(
        "[data-kp-economics-equilibrium-point]"
      ),
      equilibriumKatexRetained: equilibriumKatex ===
        equilibriumLabel?.querySelector(".katex"),
      equilibriumLabelLatex,
      equilibriumRelation,
      equilibriumValues,
      discreteLabelsRemovedAtEstablish:
        initialView.querySelector(
          '[data-kp-economics-math-label="curve-demand-reference"]'
        ) === null &&
        initialView.querySelector(
          '[data-kp-economics-math-label="equilibrium-reference"]'
        ) === null,
      demandReferenceLabelRetained,
      disposedApplyThrows,
      equilibriumReferenceLabelRetained,
      settledDescriptionHasFinalEquilibrium:
        settledDescription?.includes("quantity 8 and price 10") ?? false,
      shiftedDescriptionHasIntermediateEquilibrium:
        shiftedDescription?.includes("quantity 7 and price 9") ?? false,
      guideGroupRemovedAtEstablish: initialView.querySelector(
        "[data-kp-economics-initial-equilibrium-guides]"
      ) === null,
      guideGroupRetained,
      firstGridLineRetained: firstGridLine === initialView.querySelector(
        '[data-kp-economics-grid-axis="quantity"]'
      ),
      sameScaffold: first === second,
      sameInputMutations,
      sameView: initialView === second.view,
      initialReferenceRetained: initialReference === initialView.querySelector(
        "[data-kp-economics-initial-equilibrium-reference]"
      ),
      supplyRetained: supply === initialView.querySelector(
        "[data-kp-economics-supply-line]"
      ),
      resizedSupplyX2,
      viewCountAfterDispose: content.querySelectorAll(
        "[data-kp-economics-equilibrium-view]"
      ).length
    };
  });

  expect(result).toEqual({
    descendants: 366,
    changedInputMutations: 25,
    demandRetained: true,
    demandKatexRetained: true,
    demandLabelLatex: "D_t",
    demandShiftY1: "94.39999999999998",
    disposedStatus: "disposed",
    equilibriumRetained: true,
    equilibriumKatexRetained: true,
    equilibriumLabelLatex: "E_t \\approx (7.00, 9.00)",
    equilibriumRelation: "≈",
    equilibriumValues: ["7.00", "9.00"],
    discreteLabelsRemovedAtEstablish: true,
    demandReferenceLabelRetained: true,
    disposedApplyThrows: true,
    equilibriumReferenceLabelRetained: true,
    settledDescriptionHasFinalEquilibrium: true,
    shiftedDescriptionHasIntermediateEquilibrium: true,
    guideGroupRemovedAtEstablish: true,
    guideGroupRetained: true,
    firstGridLineRetained: true,
    sameScaffold: true,
    sameInputMutations: 0,
    sameView: true,
    initialReferenceRetained: true,
    supplyRetained: true,
    resizedSupplyX2: "616",
    viewCountAfterDispose: 0
  });
});

test("retained economics session matches canonical direct seek and rewind", async ({
  page
}) => {
  await page.goto("/tutorials/economics/demand-shift/");

  const evidence = await page.evaluate(async () => {
    const runtimeUrl = "/src/rendering/economics-equilibrium-runtime-session.ts";
    const rendererUrl = "/src/rendering/economics-equilibrium-svg.ts";
    const animationUrl = "/src/animation/economics-equilibrium-adapter.ts";
    const runtimeFrameUrl =
      "/src/animation/economics-equilibrium-runtime-frame.ts";
    const samplerUrl = "/src/animation/runtime-sampler.ts";
    const viewportUrl = "/src/editor/graph-svg-viewport.ts";
    const retainedMathUrl =
      "/src/rendering/economics-equilibrium-retained-math.ts";
    const runtimeMathUrl =
      "/src/rendering/dimensional-continuity-inline-latex.ts";
    const runtime = await import(/* @vite-ignore */ runtimeUrl);
    const renderer = await import(/* @vite-ignore */ rendererUrl);
    const animationModule = await import(/* @vite-ignore */ animationUrl);
    const runtimeFrameModule = await import(/* @vite-ignore */ runtimeFrameUrl);
    const samplerModule = await import(/* @vite-ignore */ samplerUrl);
    const viewportModule = await import(/* @vite-ignore */ viewportUrl);
    const retainedMath = await import(/* @vite-ignore */ retainedMathUrl);
    const runtimeMath = await import(/* @vite-ignore */ runtimeMathUrl);
    const animation = animationModule.createEconomicsEquilibriumAnimationAsset();
    const viewport = viewportModule.createKpEditorGraphSvgViewportModel(animation);
    const sample = (
      progress: number,
      direction: "forward" | "rewind" = "forward"
    ) => runtimeFrameModule.sampleKpEconomicsEquilibriumRuntimeFrame({
      animation,
      runtimeFrame: samplerModule.sampleKpAnimationRuntimeFrame({
        animation,
        direction,
        progress
      })
    });
    const createContent = () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const content = document.createElementNS("http://www.w3.org/2000/svg", "g");
      svg.append(content);
      return content;
    };
    const attributeSnapshot = (root: Element, selector: string) => {
      const element = root.querySelector(selector);
      if (element === null) return null;
      return Object.fromEntries(Array.from(element.attributes)
        .filter(({ name }) =>
          name === "x" || name === "y" || name === "x1" || name === "y1" ||
          name === "x2" || name === "y2" || name === "cx" || name === "cy" ||
          name === "style" || name.startsWith("data-kp-economics-")
        )
        .map(({ name, value }) => [name, value]));
    };
    const snapshot = (root: Element) => {
      const selectors = [
        "[data-kp-economics-equilibrium-view]",
        "[data-kp-economics-initial-demand-reference]",
        "[data-kp-economics-demand-line]",
        "[data-kp-economics-supply-line]",
        "[data-kp-economics-supply-movement]",
        "[data-kp-economics-supply-movement-trace]",
        "[data-kp-economics-equilibrium-quantity-guide]",
        "[data-kp-economics-equilibrium-price-guide]",
        "[data-kp-economics-initial-equilibrium-reference]",
        "[data-kp-economics-equilibrium-point]",
        '[data-kp-economics-math-label="curve-demand-current"]',
        '[data-kp-economics-math-label="curve-demand-reference"]',
        '[data-kp-economics-math-label="equilibrium-current"]',
        '[data-kp-economics-math-label="equilibrium-reference"]'
      ];
      return {
        attributes: selectors.map((selector) => [
          selector,
          attributeSnapshot(root, selector)
        ]),
        description: root.querySelector(
          "[data-kp-economics-nonvisual-summary]"
        )?.textContent ?? null,
        equations: Array.from(root.querySelectorAll(
          "[data-kp-economics-equation-role]"
        )).map((element) => [
          element.getAttribute("data-kp-economics-equation-role"),
          element.getAttribute("data-kp-latex")
        ]),
        guideCount: root.querySelectorAll(
          "[data-kp-economics-initial-equilibrium-guides]"
        ).length,
        labels: Array.from(root.querySelectorAll(
          "[data-kp-economics-math-label]"
        )).map((element) => [
          element.getAttribute("data-kp-economics-math-label"),
          element.querySelector("[data-kp-latex]")?.getAttribute("data-kp-latex")
        ]),
        narrative: [
          root.querySelector("[data-kp-economics-synchronized-view]")
            ?.getAttribute("data-kp-economics-narrative-id") ?? null,
          root.querySelector("[data-kp-economics-narrative]")?.textContent ?? null
        ]
      };
    };
    const canonicalSnapshot = (frame: ReturnType<typeof sample>) => {
      const content = createContent();
      content.innerHTML = renderer.renderKpEconomicsEquilibriumRuntimeContent({
        frame,
        viewport,
        // The catalogue's generic renderer remains the independent canonical
        // oracle; the learner route proves retained math at its mount points.
        renderInlineLatex:
          runtimeMath.renderKpDimensionalContinuityInlineLatex
      });
      return snapshot(content);
    };
    const content = createContent();
    const initialFrame = sample(0);
    const session = runtime.createKpEconomicsEquilibriumRuntimeSession({
      content,
      frame: initialFrame,
      viewport,
      renderInlineLatex: retainedMath.renderKpEconomicsRetainedInlineLatex
    });
    const fixedNodes = [
      content.querySelector("[data-kp-economics-equilibrium-view]"),
      content.querySelector("[data-kp-economics-demand-line]"),
      content.querySelector("[data-kp-economics-equilibrium-point]"),
      content.querySelector(
        '[data-kp-economics-math-label="equilibrium-current"] .katex'
      ),
      content.querySelector("[data-kp-economics-nonvisual-summary]"),
      content.querySelector("[data-kp-economics-synchronized-view]")
    ];
    const progresses = [
      0, 0.1, 0.16, 0.17, 0.44, 0.72, 0.73, 0.8, 0.9, 0.91, 1, 0.44, 0
    ];
    const mismatchSummary = (actual: unknown, canonical: unknown) => {
      const differences: Array<{ path: string; actual: unknown; canonical: unknown }> = [];
      const visit = (left: unknown, right: unknown, path: string) => {
        if (differences.length >= 12 || Object.is(left, right)) return;
        if (typeof left !== "object" || left === null ||
            typeof right !== "object" || right === null) {
          differences.push({ path, actual: left, canonical: right });
          return;
        }
        const keys = new Set([
          ...Object.keys(left as Record<string, unknown>),
          ...Object.keys(right as Record<string, unknown>)
        ]);
        for (const key of keys) {
          visit(
            (left as Record<string, unknown>)[key],
            (right as Record<string, unknown>)[key],
            `${path}.${key}`
          );
        }
      };
      visit(actual, canonical, "snapshot");
      return differences;
    };
    const parity = progresses.map((progress) => {
      const frame = sample(progress);
      session.apply({ frame, viewport });
      const actual = snapshot(content);
      const canonical = canonicalSnapshot(frame);
      const matchesCanonical = mismatchSummary(actual, canonical).length === 0;
      return {
        progress,
        matchesCanonical,
        retained: fixedNodes.every((node, index) => node === [
          content.querySelector("[data-kp-economics-equilibrium-view]"),
          content.querySelector("[data-kp-economics-demand-line]"),
          content.querySelector("[data-kp-economics-equilibrium-point]"),
          content.querySelector(
            '[data-kp-economics-math-label="equilibrium-current"] .katex'
          ),
          content.querySelector("[data-kp-economics-nonvisual-summary]"),
          content.querySelector("[data-kp-economics-synchronized-view]")
        ][index])
      };
    });
    const directFrame = sample(0.44);
    session.apply({ frame: directFrame, viewport });
    const traversed = snapshot(content);
    const freshContent = createContent();
    const fresh = runtime.createKpEconomicsEquilibriumRuntimeSession({
      content: freshContent,
      frame: directFrame,
      viewport,
      renderInlineLatex: retainedMath.renderKpEconomicsRetainedInlineLatex
    });
    const freshDirectSeekMatches = mismatchSummary(
      traversed,
      snapshot(freshContent)
    ).length === 0;
    const rewindFrame = sample(0.56, "rewind");
    session.apply({ frame: rewindFrame, viewport });
    const rewindMatchesForward = mismatchSummary(
      snapshot(content),
      canonicalSnapshot(directFrame)
    ).length === 0;
    session.dispose();
    fresh.dispose();

    return { freshDirectSeekMatches, parity, rewindMatchesForward };
  });

  expect(evidence.parity.filter(({ matchesCanonical }) => !matchesCanonical))
    .toEqual([]);
  expect(evidence.parity.every(({ retained }) => retained)).toBe(true);
  expect(evidence.freshDirectSeekMatches).toBe(true);
  expect(evidence.rewindMatchesForward).toBe(true);
});
