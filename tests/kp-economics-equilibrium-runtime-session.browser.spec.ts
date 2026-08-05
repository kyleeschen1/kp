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
    const runtime = await import(/* @vite-ignore */ runtimeUrl);
    const animationModule = await import(/* @vite-ignore */ animationUrl);
    const runtimeFrameModule = await import(/* @vite-ignore */ runtimeFrameUrl);
    const samplerModule = await import(/* @vite-ignore */ samplerUrl);
    const viewportModule = await import(/* @vite-ignore */ viewportUrl);
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
      viewport: viewportModule.createKpEditorGraphSvgViewportModel(animation)
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
      viewport: input.viewport
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
    descendants: 234,
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
